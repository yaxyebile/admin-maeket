-- EMARA Admin Add-on migrations
-- 1. Technicians
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    phone TEXT NOT NULL,
    description TEXT,
    rate NUMERIC,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for technicians" ON public.technicians FOR SELECT USING (true);
CREATE POLICY "Allow admin edit for technicians" ON public.technicians FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 2. Technician Bookings
CREATE TABLE IF NOT EXISTS public.technician_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES public.technicians(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    user_phone TEXT,
    service_type TEXT,
    status TEXT DEFAULT 'pending',
    price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technician_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated bookings select" ON public.technician_bookings FOR SELECT USING (true);
CREATE POLICY "Allow bookings insert" ON public.technician_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin edit for bookings" ON public.technician_bookings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Cargo Ads
CREATE TABLE IF NOT EXISTS public.cargo_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    route TEXT NOT NULL,
    price NUMERIC NOT NULL,
    contact TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cargo_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for cargo_ads" ON public.cargo_ads FOR SELECT USING (true);
CREATE POLICY "Allow admin edit for cargo_ads" ON public.cargo_ads FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Notifications (Broadcast history)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'role', 'user'
    target_role TEXT,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow admin edit for notifications" ON public.notifications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
