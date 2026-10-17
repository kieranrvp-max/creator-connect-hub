GRANT DELETE ON public.opportunities TO authenticated;
GRANT DELETE ON public.opportunity_applications TO authenticated;

DROP POLICY IF EXISTS "Brands delete own opportunities" ON public.opportunities;
CREATE POLICY "Brands delete own opportunities"
ON public.opportunities FOR DELETE TO authenticated
USING (brand_id = auth.uid());

DROP POLICY IF EXISTS "Brands delete applications on own opportunities" ON public.opportunity_applications;
CREATE POLICY "Brands delete applications on own opportunities"
ON public.opportunity_applications FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.opportunities o
  WHERE o.id = opportunity_id AND o.brand_id = auth.uid()
));