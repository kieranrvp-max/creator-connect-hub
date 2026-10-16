INSERT INTO public.promo_codes (code, fee_rate, max_uses) VALUES ('EARLYBIRDBIZ', 0.05, 10) ON CONFLICT (code) DO NOTHING;

-- Brand campaign briefs
CREATE TYPE public.opportunity_status AS ENUM ('open','closed');
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  niche text NOT NULL,
  channel_type public.channel_type,
  budget numeric NOT NULL CHECK (budget > 0 AND budget <= 100000),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  deliverables text CHECK (deliverables IS NULL OR char_length(deliverables) <= 1000),
  deadline date,
  status public.opportunity_status NOT NULL DEFAULT 'open',
  promo_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opportunities are public" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Brands insert own opportunities" ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = brand_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'sponsor'));
CREATE POLICY "Brands update own opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (auth.uid() = brand_id) WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "Brands delete own opportunities" ON public.opportunities FOR DELETE TO authenticated USING (auth.uid() = brand_id);
CREATE INDEX ON public.opportunities (brand_id);

CREATE OR REPLACE FUNCTION public.validate_opportunity_promo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.promo_code IS NOT NULL THEN
    NEW.promo_code := upper(trim(NEW.promo_code));
    IF NEW.promo_code = '' THEN NEW.promo_code := NULL; RETURN NEW; END IF;
    IF NEW.promo_code <> 'EARLYBIRDBIZ' OR NOT EXISTS (SELECT 1 FROM public.promo_codes WHERE code = NEW.promo_code AND active) THEN
      RAISE EXCEPTION 'That promo code is not valid for brand opportunities';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_opportunity_promo BEFORE INSERT OR UPDATE OF promo_code ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.validate_opportunity_promo();

-- Creator applications to briefs; brand funds escrow on acceptance
CREATE TYPE public.application_status AS ENUM ('pending','accepted','delivered','released','declined','refunded');
CREATE TABLE public.opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  pitch text NOT NULL CHECK (char_length(pitch) BETWEEN 10 AND 2000),
  portfolio_link text,
  status public.application_status NOT NULL DEFAULT 'pending',
  total_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  promo_code text,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_env text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  paid_at timestamptz,
  released_at timestamptz,
  proof_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, creator_id)
);
GRANT SELECT, INSERT ON public.opportunity_applications TO authenticated;
GRANT UPDATE (status, proof_url) ON public.opportunity_applications TO authenticated;
GRANT ALL ON public.opportunity_applications TO service_role;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_opportunity_owner(_opportunity_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.opportunities WHERE id = _opportunity_id AND brand_id = auth.uid())
$$;

CREATE POLICY "Creators and brands read applications" ON public.opportunity_applications FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.is_opportunity_owner(opportunity_id));
CREATE POLICY "Creators apply" ON public.opportunity_applications FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'creator'));
CREATE POLICY "Parties update applications" ON public.opportunity_applications FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() OR public.is_opportunity_owner(opportunity_id))
  WITH CHECK (creator_id = auth.uid() OR public.is_opportunity_owner(opportunity_id));
CREATE INDEX ON public.opportunity_applications (opportunity_id);
CREATE INDEX ON public.opportunity_applications (creator_id);

CREATE OR REPLACE FUNCTION public.opportunity_fee_rate(_opportunity_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT p.fee_rate FROM public.opportunities o JOIN public.promo_codes p ON p.code = o.promo_code
    WHERE o.id = _opportunity_id AND p.active
      AND (p.max_uses IS NULL OR (SELECT count(*) FROM public.opportunity_applications a
            WHERE a.promo_code = p.code AND a.payment_status = 'paid') < p.max_uses)
  ), 0.15)
$$;
GRANT EXECUTE ON FUNCTION public.opportunity_fee_rate(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_application_pricing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record;
BEGIN
  SELECT budget, brand_id, status INTO o FROM public.opportunities WHERE id = NEW.opportunity_id;
  IF o.budget IS NULL THEN RAISE EXCEPTION 'Opportunity not found'; END IF;
  IF o.status <> 'open' THEN RAISE EXCEPTION 'This opportunity is closed'; END IF;
  IF o.brand_id = NEW.creator_id THEN RAISE EXCEPTION 'You can''t apply to your own opportunity'; END IF;
  NEW.total_amount := o.budget;
  NEW.platform_fee := round(o.budget * 0.15, 2);
  NEW.promo_code := NULL;
  NEW.status := 'pending';
  NEW.payment_status := 'unpaid';
  NEW.payment_env := NULL;
  NEW.paid_at := NULL;
  NEW.released_at := NULL;
  NEW.proof_url := NULL;
  NEW.stripe_checkout_session_id := NULL;
  NEW.stripe_payment_intent_id := NULL;
  NEW.stripe_transfer_id := NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER applications_pricing BEFORE INSERT ON public.opportunity_applications
FOR EACH ROW EXECUTE FUNCTION public.set_application_pricing();

-- Called by the server right before checkout so the commission reflects the current promo usage.
CREATE OR REPLACE FUNCTION public.reprice_application(_application_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; rate numeric; code text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('promo_codes'));
  SELECT ap.id, ap.opportunity_id, o.budget, o.promo_code INTO a
  FROM public.opportunity_applications ap JOIN public.opportunities o ON o.id = ap.opportunity_id
  WHERE ap.id = _application_id AND ap.payment_status = 'unpaid';
  IF a.id IS NULL THEN RETURN; END IF;
  rate := public.opportunity_fee_rate(a.opportunity_id);
  code := CASE WHEN rate < 0.15 THEN a.promo_code ELSE NULL END;
  UPDATE public.opportunity_applications
    SET total_amount = a.budget, platform_fee = round(a.budget * rate, 2), promo_code = code
    WHERE id = a.id;
END $$;
REVOKE EXECUTE ON FUNCTION public.reprice_application(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reprice_application(uuid) TO service_role;

-- Users may only: brand declines an unpaid pending application; creator marks a funded one delivered.
CREATE OR REPLACE FUNCTION public.guard_application_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NEW.status = OLD.status AND NEW.proof_url IS NOT DISTINCT FROM OLD.proof_url THEN RETURN NEW; END IF;
    IF OLD.status = 'pending' AND NEW.status = 'declined' AND OLD.payment_status = 'unpaid'
       AND public.is_opportunity_owner(OLD.opportunity_id) THEN RETURN NEW; END IF;
    IF OLD.status = 'accepted' AND NEW.status = 'delivered' AND OLD.payment_status = 'paid'
       AND OLD.creator_id = auth.uid() AND NEW.proof_url IS NOT NULL THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'Invalid status change';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER applications_status_guard BEFORE UPDATE ON public.opportunity_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_application_status();

-- Creator social accounts; "verified" is only set server-side after OAuth
CREATE TYPE public.social_platform AS ENUM ('tiktok','instagram');
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  platform public.social_platform NOT NULL,
  handle text NOT NULL CHECK (char_length(handle) BETWEEN 1 AND 60),
  followers integer NOT NULL DEFAULT 0 CHECK (followers >= 0),
  avg_views integer CHECK (avg_views IS NULL OR avg_views >= 0),
  verified boolean NOT NULL DEFAULT false,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, platform)
);
GRANT SELECT ON public.social_accounts TO anon, authenticated;
GRANT INSERT (creator_id, platform, handle, followers, avg_views) ON public.social_accounts TO authenticated;
GRANT UPDATE (handle, followers, avg_views) ON public.social_accounts TO authenticated;
GRANT DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Social accounts are public" ON public.social_accounts FOR SELECT USING (true);
CREATE POLICY "Creators add own socials" ON public.social_accounts FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators edit own socials" ON public.social_accounts FOR UPDATE TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators remove own socials" ON public.social_accounts FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- Manual edits always drop verification
CREATE OR REPLACE FUNCTION public.unverify_manual_social() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN NEW.verified := false; NEW.synced_at := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER social_accounts_unverify BEFORE INSERT OR UPDATE ON public.social_accounts
FOR EACH ROW EXECUTE FUNCTION public.unverify_manual_social();

-- Brands with public opportunities and applicants' brands become visible
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _profile_id AND p.user_type = 'creator')
    OR _profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.brand_id = _profile_id)
    OR EXISTS (SELECT 1 FROM public.opportunity_applications a WHERE a.creator_id = _profile_id AND public.is_opportunity_owner(a.opportunity_id))
    OR EXISTS (
      SELECT 1 FROM public.bookings b JOIN public.listings l ON l.id = b.listing_id
      WHERE b.sponsor_id = _profile_id AND l.creator_id = auth.uid() AND b.payment_status <> 'unpaid'
    )
$$;
