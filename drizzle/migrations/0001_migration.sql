CREATE TYPE public.payment_status AS ENUM ('unpaid','paid','refunded');
ALTER TABLE public.bookings
  ADD COLUMN payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  ADD COLUMN stripe_checkout_session_id text;

-- 15% platform fee taken from the creator's share: sponsor pays the listed price
CREATE OR REPLACE FUNCTION public.set_booking_pricing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price numeric;
BEGIN
  SELECT price_per_slot INTO price FROM public.listings WHERE id = NEW.listing_id;
  IF price IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  NEW.total_amount := price;
  NEW.platform_fee := round(price * 0.15, 2);
  NEW.status := 'pending_approval';
  NEW.payment_status := 'unpaid';
  NEW.proof_url := NULL;
  NEW.stripe_payment_intent_id := NULL;
  NEW.stripe_checkout_session_id := NULL;
  RETURN NEW;
END $$;

-- Creators only see bookings once paid; sponsors always see their own
DROP POLICY "Sponsors and creators read bookings" ON public.bookings;
CREATE POLICY "Sponsors read own bookings" ON public.bookings FOR SELECT TO authenticated USING (sponsor_id = auth.uid());
CREATE POLICY "Creators read paid bookings" ON public.bookings FOR SELECT TO authenticated
  USING (payment_status <> 'unpaid' AND public.is_listing_owner(listing_id));
DROP POLICY "Creators update bookings on their listings" ON public.bookings;
CREATE POLICY "Creators update paid bookings on their listings" ON public.bookings FOR UPDATE TO authenticated
  USING (payment_status = 'paid' AND public.is_listing_owner(listing_id))
  WITH CHECK (public.is_listing_owner(listing_id));

-- Declines go through the refund server function, not direct updates
CREATE OR REPLACE FUNCTION public.guard_booking_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NEW.status = 'declined' THEN RAISE EXCEPTION 'Use decline & refund'; END IF;
    IF NOT (
      (OLD.status = 'pending_approval' AND NEW.status = 'accepted') OR
      (OLD.status = 'accepted' AND NEW.status = 'published') OR
      (OLD.status = 'published' AND NEW.status = 'completed') OR
      (OLD.status = NEW.status)
    ) THEN RAISE EXCEPTION 'Invalid status change'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_status_guard BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.guard_booking_status();