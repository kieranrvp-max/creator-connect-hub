REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_type, full_name, avatar_url, company_or_brand_name, created_at) ON public.profiles TO anon, authenticated;
COMMENT ON POLICY "Profiles are publicly readable" ON public.profiles IS 'Intentional: public creator names shown on listings. stripe_connect_account_id is excluded via column grants.';