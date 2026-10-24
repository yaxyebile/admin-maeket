-- Promo videos are managed from the admin dashboard only.
-- Remove the role-specific write policies introduced in migration 012.
DROP POLICY IF EXISTS "Real Estate promo settings insert" ON public.app_settings;
DROP POLICY IF EXISTS "Real Estate promo settings update" ON public.app_settings;
DROP POLICY IF EXISTS "Second-Hand promo settings insert" ON public.app_settings;
DROP POLICY IF EXISTS "Second-Hand promo settings update" ON public.app_settings;
