ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '[]'::jsonb;
GRANT SELECT (social_links, location, bio, website_url) ON public.profiles TO anon, authenticated;
GRANT UPDATE (social_links, location, bio, website_url, full_name, company_or_brand_name, avatar_url) ON public.profiles TO authenticated;