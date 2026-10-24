-- Migration: Technician Promo Video Advertisement Settings
-- Key-value app_settings table and initial promotional video settings

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access for application settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow public read for app_settings'
  ) THEN
    CREATE POLICY "Allow public read for app_settings" ON public.app_settings FOR SELECT USING (true);
  END IF;
END $$;

-- Allow admin full write access for application settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow admin write for app_settings'
  ) THEN
    CREATE POLICY "Allow admin write for app_settings" ON public.app_settings FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;

-- Seed / Upsert promotional video settings for Technicians section
INSERT INTO public.app_settings (key, value) VALUES
  ('technician_ad_video_url', 'https://www.youtube.com/watch?v=fq4N0hgOWzU'),
  ('technician_ad_title', 'Farsamo Yaqaano Xirfad Leh'),
  ('technician_ad_desc', 'Dooro adeegga aad u baahan tahay, si automatic ahna ugu bixi EVC Plus.'),
  ('technician_ad_tag', 'WAAFI PAY API INTEGRATED')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
