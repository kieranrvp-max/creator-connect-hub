CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _profile_id AND p.user_type = 'creator')
    OR _profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.bookings b JOIN public.listings l ON l.id = b.listing_id
      WHERE b.sponsor_id = _profile_id AND l.creator_id = auth.uid() AND b.payment_status <> 'unpaid'
    )
$$;
DROP POLICY "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Creator profiles public; sponsors visible to self and their creators" ON public.profiles
  FOR SELECT TO anon, authenticated USING (public.can_view_profile(id));