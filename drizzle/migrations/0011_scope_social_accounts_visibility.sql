CREATE OR REPLACE FUNCTION public.creator_is_public(_creator_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings WHERE creator_id = _creator_id)
      OR EXISTS (SELECT 1 FROM public.opportunity_applications WHERE creator_id = _creator_id)
$$;
DROP POLICY IF EXISTS "Social accounts are public" ON public.social_accounts;
CREATE POLICY "Social accounts visible for public creators" ON public.social_accounts FOR SELECT TO anon, authenticated
  USING (creator_id = auth.uid() OR public.creator_is_public(creator_id));