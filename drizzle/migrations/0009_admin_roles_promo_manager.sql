CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'kieran@creatorconnecthub.co.uk' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_owner_admin AFTER INSERT OR UPDATE OF email_confirmed_at, email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();
INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'kieran@creatorconnecthub.co.uk' AND email_confirmed_at IS NOT NULL
  ON CONFLICT DO NOTHING;

ALTER TABLE public.promo_codes
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN referrer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN referral_rate numeric NOT NULL DEFAULT 0 CHECK (referral_rate >= 0 AND referral_rate <= 0.15);
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_fee_range CHECK (fee_rate >= 0 AND fee_rate <= 0.15) NOT VALID;

GRANT SELECT, INSERT, UPDATE ON public.promo_codes TO authenticated;
CREATE POLICY "Admins read promo codes" ON public.promo_codes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add promo codes" ON public.promo_codes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins edit promo codes" ON public.promo_codes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.listing_fee_rate(_listing_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT p.fee_rate FROM public.listings l JOIN public.promo_codes p ON p.code = l.promo_code
    WHERE l.id = _listing_id AND p.active AND (p.expires_at IS NULL OR p.expires_at > now())
      AND (p.max_uses IS NULL OR (SELECT count(*) FROM public.bookings b
            WHERE b.promo_code = p.code AND b.payment_status <> 'refunded') < p.max_uses)
  ), 0.15)
$$;
CREATE OR REPLACE FUNCTION public.opportunity_fee_rate(_opportunity_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT p.fee_rate FROM public.opportunities o JOIN public.promo_codes p ON p.code = o.promo_code
    WHERE o.id = _opportunity_id AND p.active AND (p.expires_at IS NULL OR p.expires_at > now())
      AND (p.max_uses IS NULL OR (SELECT count(*) FROM public.opportunity_applications a
            WHERE a.promo_code = p.code AND a.payment_status = 'paid') < p.max_uses)
  ), 0.15)
$$;
CREATE OR REPLACE FUNCTION public.validate_listing_promo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.promo_code IS NOT NULL THEN
    NEW.promo_code := upper(trim(NEW.promo_code));
    IF NEW.promo_code = '' THEN NEW.promo_code := NULL; RETURN NEW; END IF;
    IF NEW.promo_code = 'EARLYBIRDBIZ' OR NOT EXISTS (SELECT 1 FROM public.promo_codes WHERE code = NEW.promo_code AND active AND (expires_at IS NULL OR expires_at > now())) THEN
      RAISE EXCEPTION 'That promo code is not valid';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.validate_opportunity_promo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.promo_code IS NOT NULL THEN
    NEW.promo_code := upper(trim(NEW.promo_code));
    IF NEW.promo_code = '' THEN NEW.promo_code := NULL; RETURN NEW; END IF;
    IF NEW.promo_code = 'EARLYBIRD' OR NOT EXISTS (SELECT 1 FROM public.promo_codes WHERE code = NEW.promo_code AND active AND (expires_at IS NULL OR expires_at > now())) THEN
      RAISE EXCEPTION 'That promo code is not valid for brand opportunities';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS TABLE (total_users bigint, active_listings bigint, deals_completed bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.profiles),
    (SELECT count(*) FROM public.listings),
    (SELECT count(*) FROM public.bookings WHERE status = 'completed')
      + (SELECT count(*) FROM public.opportunity_applications WHERE status = 'released');
END $$;

CREATE OR REPLACE FUNCTION public.admin_promo_usage()
RETURNS TABLE (code text, uses bigint, gross numeric, referral_earnings numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  WITH u AS (
    SELECT b.promo_code AS c, b.total_amount AS t FROM public.bookings b WHERE b.payment_status = 'paid' AND b.promo_code IS NOT NULL
    UNION ALL
    SELECT a.promo_code, a.total_amount FROM public.opportunity_applications a WHERE a.payment_status = 'paid' AND a.promo_code IS NOT NULL
  )
  SELECT p.code, count(u.c), COALESCE(sum(u.t), 0), round(COALESCE(sum(u.t), 0) * p.referral_rate, 2)
  FROM public.promo_codes p LEFT JOIN u ON u.c = p.code GROUP BY p.code, p.referral_rate;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_promo_usage() FROM anon;