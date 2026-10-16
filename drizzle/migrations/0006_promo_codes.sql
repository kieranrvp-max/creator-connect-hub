CREATE TABLE public.promo_codes (
  code text PRIMARY KEY,
  fee_rate numeric NOT NULL CHECK (fee_rate >= 0 AND fee_rate < 1),
  max_uses integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
INSERT INTO public.promo_codes (code, fee_rate, max_uses) VALUES ('EARLYBIRD', 0.05, 10);

ALTER TABLE public.listings ADD COLUMN promo_code text;
ALTER TABLE public.bookings ADD COLUMN promo_code text;

-- Rate that applies to the next booking on a listing (15% unless a valid code with uses left).
CREATE OR REPLACE FUNCTION public.listing_fee_rate(_listing_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT p.fee_rate FROM public.listings l JOIN public.promo_codes p ON p.code = l.promo_code
    WHERE l.id = _listing_id AND p.active
      AND (p.max_uses IS NULL OR (SELECT count(*) FROM public.bookings b
            WHERE b.promo_code = p.code AND b.payment_status <> 'refunded') < p.max_uses)
  ), 0.15)
$$;
GRANT EXECUTE ON FUNCTION public.listing_fee_rate(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_listing_promo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.promo_code IS NOT NULL THEN
    NEW.promo_code := upper(trim(NEW.promo_code));
    IF NEW.promo_code = '' THEN NEW.promo_code := NULL; RETURN NEW; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.promo_codes WHERE code = NEW.promo_code AND active) THEN
      RAISE EXCEPTION 'That promo code is not valid';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_listing_promo BEFORE INSERT OR UPDATE OF promo_code ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.validate_listing_promo();

CREATE OR REPLACE FUNCTION public.set_booking_pricing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE price numeric; code text; rate numeric;
BEGIN
  SELECT price_per_slot, promo_code INTO price, code FROM public.listings WHERE id = NEW.listing_id;
  IF price IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF NEW.preferred_date < current_date THEN RAISE EXCEPTION 'Launch date must be in the future'; END IF;
  IF public.creator_date_taken(NEW.listing_id, NEW.preferred_date) THEN
    RAISE EXCEPTION 'This creator is already booked on that date. Please pick another day.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('promo_codes'));
  rate := public.listing_fee_rate(NEW.listing_id);
  NEW.promo_code := CASE WHEN rate < 0.15 THEN code ELSE NULL END;
  NEW.total_amount := price;
  NEW.platform_fee := round(price * rate, 2);
  NEW.status := 'pending_approval';
  NEW.payment_status := 'unpaid';
  NEW.paid_at := NULL;
  NEW.proof_url := NULL;
  NEW.stripe_payment_intent_id := NULL;
  NEW.stripe_checkout_session_id := NULL;
  RETURN NEW;
END $function$;