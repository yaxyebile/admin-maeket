-- Migration: Real Estate Property Promo Video Advertisement Settings
-- Inserts default settings for Property / Real Estate promotional video ad

INSERT INTO public.app_settings (key, value) VALUES
  ('property_ad_video_url', 'https://www.youtube.com/watch?v=fq4N0hgOWzU'),
  ('property_ad_title', 'Guryo & Dhul Casri Ah'),
  ('property_ad_desc', 'Ka hel guryaha kirada iyo iibka ah ee ugu tayada sarreeya.'),
  ('property_ad_tag', 'REAL ESTATE & PROPERTIES')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
