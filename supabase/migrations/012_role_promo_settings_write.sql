-- Allow the Real Estate and Second-Hand dashboards to save their own promo keys.
-- The client routes are role-locked; the policies restrict writes to each module's keys.
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Real Estate promo settings insert" ON public.app_settings;
CREATE POLICY "Real Estate promo settings insert"
  ON public.app_settings
  FOR INSERT TO anon, authenticated
  WITH CHECK (key IN (
    'property_ad_video_url',
    'property_ad_title',
    'property_ad_desc',
    'property_ad_tag'
  ));

DROP POLICY IF EXISTS "Real Estate promo settings update" ON public.app_settings;
CREATE POLICY "Real Estate promo settings update"
  ON public.app_settings
  FOR UPDATE TO anon, authenticated
  USING (key IN (
    'property_ad_video_url',
    'property_ad_title',
    'property_ad_desc',
    'property_ad_tag'
  ))
  WITH CHECK (key IN (
    'property_ad_video_url',
    'property_ad_title',
    'property_ad_desc',
    'property_ad_tag'
  ));

DROP POLICY IF EXISTS "Second-Hand promo settings insert" ON public.app_settings;
CREATE POLICY "Second-Hand promo settings insert"
  ON public.app_settings
  FOR INSERT TO anon, authenticated
  WITH CHECK (key IN (
    'secondhand_ad_video_url',
    'secondhand_ad_title',
    'secondhand_ad_desc',
    'secondhand_ad_tag'
  ));

DROP POLICY IF EXISTS "Second-Hand promo settings update" ON public.app_settings;
CREATE POLICY "Second-Hand promo settings update"
  ON public.app_settings
  FOR UPDATE TO anon, authenticated
  USING (key IN (
    'secondhand_ad_video_url',
    'secondhand_ad_title',
    'secondhand_ad_desc',
    'secondhand_ad_tag'
  ))
  WITH CHECK (key IN (
    'secondhand_ad_video_url',
    'secondhand_ad_title',
    'secondhand_ad_desc',
    'secondhand_ad_tag'
  ));
