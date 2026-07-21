-- 20260721000000_lms_master_admin.sql
-- Create Master Admin tables for multi-school and global settings

-- lms_schools already exists from Fase 9 migration! We will use the existing table.

-- 1. Create lms_academic_periods
CREATE TABLE IF NOT EXISTS public.lms_academic_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.lms_schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create lms_global_settings
CREATE TABLE IF NOT EXISTS public.lms_global_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.lms_schools(id) ON DELETE CASCADE UNIQUE,
    forums_graded BOOLEAN DEFAULT true,
    weeks_per_course INT DEFAULT 16,
    custom_settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.lms_academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_global_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Periods (Public Read if active or admin read all, Admin Write)
DROP POLICY IF EXISTS "Periods are viewable by everyone if active" ON public.lms_academic_periods;
CREATE POLICY "Periods are viewable by everyone if active" ON public.lms_academic_periods
    FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage periods" ON public.lms_academic_periods;
CREATE POLICY "Admins can manage periods" ON public.lms_academic_periods
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Settings (Admin only)
DROP POLICY IF EXISTS "Admins can view and manage settings" ON public.lms_global_settings;
CREATE POLICY "Admins can view and manage settings" ON public.lms_global_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- 5. Insert Default School (Iglesia Jerusalén) if not exists
INSERT INTO public.lms_schools (name, slug, description, is_active) 
VALUES ('Iglesia Jerusalén (Central)', 'iglesia-jerusalen-central', 'Sede principal de formación', true)
ON CONFLICT (slug) DO NOTHING;
