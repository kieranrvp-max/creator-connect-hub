ALTER TABLE public.profiles ADD COLUMN location text;
ALTER TABLE public.profiles ADD COLUMN bio text;
ALTER TABLE public.profiles ADD COLUMN website_url text;
ALTER TABLE public.profiles ADD COLUMN suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN verified_badge boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.profiles.suspended IS 'Admin-set: suspended accounts cannot sign in meaningfully; enforced in UI and admin controls';

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active announcements" ON public.announcements FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  reason text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users report content" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins read reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins resolve reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.listings ADD COLUMN pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.opportunities ADD COLUMN pinned boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins delete listings" ON public.listings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete opportunities" ON public.opportunities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update listings" ON public.listings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS TABLE(creators bigint, brands bigint, active_deals bigint, gross_volume numeric, net_revenue numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.profiles WHERE user_type = 'creator'),
    (SELECT count(*) FROM public.profiles WHERE user_type = 'sponsor'),
    (SELECT count(*) FROM public.bookings WHERE payment_status = 'paid' AND status IN ('pending_approval','accepted','published'))
      + (SELECT count(*) FROM public.opportunity_applications WHERE payment_status = 'paid' AND status IN ('accepted','delivered')),
    COALESCE((SELECT sum(total_amount) FROM public.bookings WHERE payment_status = 'paid'), 0)
      + COALESCE((SELECT sum(total_amount) FROM public.opportunity_applications WHERE payment_status = 'paid'), 0),
    COALESCE((SELECT sum(platform_fee) FROM public.bookings WHERE payment_status = 'paid'), 0)
      + COALESCE((SELECT sum(platform_fee) FROM public.opportunity_applications WHERE payment_status = 'paid'), 0);
END $function$;