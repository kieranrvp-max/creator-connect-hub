CREATE OR REPLACE FUNCTION public.my_referral_earnings()
RETURNS TABLE (code text, uses bigint, gross numeric, earnings numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH u AS (
    SELECT b.promo_code AS c, b.total_amount AS t FROM public.bookings b WHERE b.payment_status = 'paid' AND b.promo_code IS NOT NULL
    UNION ALL
    SELECT a.promo_code, a.total_amount FROM public.opportunity_applications a WHERE a.payment_status = 'paid' AND a.promo_code IS NOT NULL
  )
  SELECT p.code, count(u.c), COALESCE(sum(u.t), 0), round(COALESCE(sum(u.t), 0) * p.referral_rate, 2)
  FROM public.promo_codes p LEFT JOIN u ON u.c = p.code
  WHERE auth.uid() IS NOT NULL AND p.referrer_id = auth.uid()
  GROUP BY p.code, p.referral_rate;
$$;
REVOKE EXECUTE ON FUNCTION public.my_referral_earnings() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_referral_earnings() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_user_directory()
RETURNS TABLE (id uuid, full_name text, company_or_brand_name text, user_type text, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.company_or_brand_name, p.user_type::text, u.email::text
    FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_user_directory() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_user_directory() TO authenticated;