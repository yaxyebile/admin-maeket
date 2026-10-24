-- Migration: Second-Hand (Suuqa Casriga) Promo Video Advertisement Settings
-- Inserts default settings for Second-Hand items promotional video ad

INSERT INTO public.app_settings (key, value) VALUES
  ('secondhand_ad_video_url', 'https://www.youtube.com/watch?v=fq4N0hgOWzU'),
  ('secondhand_ad_title', 'Suuqa Casriga Ah Ee Alaabta'),
  ('secondhand_ad_desc', 'Iibso ama iibi alaab kasta oo la isticmaalay si fudud oo ammaan ah.'),
  ('secondhand_ad_tag', 'SUUQA CASRIGA & SECOND HAND')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
