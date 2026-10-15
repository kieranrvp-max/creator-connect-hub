ALTER TABLE public.bookings ADD COLUMN paid_at timestamptz;

-- One active paid booking per creator per date
CREATE OR REPLACE FUNCTION public.creator_date_taken(_listing_id uuid, _date date, _exclude uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.listings l ON l.id = b.listing_id
    WHERE l.creator_id = (SELECT creator_id FROM public.listings WHERE id = _listing_id)
      AND b.preferred_date = _date
      AND b.payment_status = 'paid'
      AND b.status IN ('pending_approval','accepted','published')
      AND (_exclude IS NULL OR b.id <> _exclude)
  )
$$;
GRANT EXECUTE ON FUNCTION public.creator_date_taken(uuid, date, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_booking_pricing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price numeric;
BEGIN
  SELECT price_per_slot INTO price FROM public.listings WHERE id = NEW.listing_id;
  IF price IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF NEW.preferred_date < current_date THEN RAISE EXCEPTION 'Launch date must be in the future'; END IF;
  IF public.creator_date_taken(NEW.listing_id, NEW.preferred_date) THEN
    RAISE EXCEPTION 'This creator is already booked on that date. Please pick another day.';
  END IF;
  NEW.total_amount := price;
  NEW.platform_fee := round(price * 0.15, 2);
  NEW.status := 'pending_approval';
  NEW.payment_status := 'unpaid';
  NEW.paid_at := NULL;
  NEW.proof_url := NULL;
  NEW.stripe_payment_intent_id := NULL;
  NEW.stripe_checkout_session_id := NULL;
  RETURN NEW;
END $$;

-- Public, privacy-safe list of taken dates for a listing's creator
CREATE OR REPLACE FUNCTION public.taken_dates(_listing_id uuid)
RETURNS SETOF date LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT b.preferred_date FROM public.bookings b
  JOIN public.listings l ON l.id = b.listing_id
  WHERE l.creator_id = (SELECT creator_id FROM public.listings WHERE id = _listing_id)
    AND b.preferred_date >= current_date
    AND b.payment_status = 'paid'
    AND b.status IN ('pending_approval','accepted','published')
$$;
GRANT EXECUTE ON FUNCTION public.taken_dates(uuid) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS bookings_pending_paid_idx ON public.bookings (paid_at) WHERE status = 'pending_approval' AND payment_status = 'paid';