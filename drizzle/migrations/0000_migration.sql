CREATE TYPE public.user_type AS ENUM ('creator','sponsor');
CREATE TYPE public.channel_type AS ENUM ('Newsletter','Podcast','YouTube','Social Media');
CREATE TYPE public.booking_status AS ENUM ('pending_approval','accepted','published','completed','declined');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type public.user_type NOT NULL DEFAULT 'sponsor',
  full_name text,
  avatar_url text,
  company_or_brand_name text,
  stripe_connect_account_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (id, user_type, full_name, avatar_url, company_or_brand_name, created_at) ON public.profiles TO anon, authenticated;
GRANT UPDATE (user_type, full_name, avatar_url, company_or_brand_name) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name, avatar_url, company_or_brand_name)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data->>'user_type' = 'creator' THEN 'creator'::public.user_type ELSE 'sponsor'::public.user_type END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'company_or_brand_name'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title text NOT NULL,
  channel_type public.channel_type NOT NULL,
  niche text NOT NULL,
  audience_size integer NOT NULL CHECK (audience_size >= 0),
  avg_open_rate numeric CHECK (avg_open_rate IS NULL OR (avg_open_rate >= 0 AND avg_open_rate <= 100)),
  price_per_slot numeric NOT NULL CHECK (price_per_slot > 0),
  description text,
  ad_format text,
  proof_screenshot_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings are public" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Creators insert own listings" ON public.listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'creator'));
CREATE POLICY "Creators update own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators delete own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  ad_copy text NOT NULL,
  target_link text NOT NULL,
  preferred_date date NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending_approval',
  proof_url text,
  stripe_payment_intent_id text,
  total_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT UPDATE (status, proof_url) ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_listing_owner(_listing_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings WHERE id = _listing_id AND creator_id = auth.uid())
$$;

CREATE POLICY "Sponsors and creators read bookings" ON public.bookings FOR SELECT TO authenticated
  USING (sponsor_id = auth.uid() OR public.is_listing_owner(listing_id));
CREATE POLICY "Sponsors create bookings" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (sponsor_id = auth.uid());
CREATE POLICY "Creators update bookings on their listings" ON public.bookings FOR UPDATE TO authenticated
  USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

-- Server-side pricing: 10% platform fee on top of the slot price; new bookings always start pending
CREATE OR REPLACE FUNCTION public.set_booking_pricing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price numeric;
BEGIN
  SELECT price_per_slot INTO price FROM public.listings WHERE id = NEW.listing_id;
  IF price IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  NEW.platform_fee := round(price * 0.10, 2);
  NEW.total_amount := price + NEW.platform_fee;
  NEW.status := 'pending_approval';
  NEW.proof_url := NULL;
  NEW.stripe_payment_intent_id := NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_pricing BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_pricing();

CREATE INDEX ON public.listings (creator_id);
CREATE INDEX ON public.bookings (listing_id);
CREATE INDEX ON public.bookings (sponsor_id);