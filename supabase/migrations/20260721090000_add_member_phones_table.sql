-- ==============================================================================
-- MIGRATION: Add member_phones table for additional phone numbers
-- PURPOSE: Supports storing multiple phone numbers per member in the CRM
-- ==============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.member_phones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    country_code TEXT DEFAULT '+593',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_phones_member_id ON public.member_phones(member_id);

-- 3. Enable Row Level Security
ALTER TABLE public.member_phones ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies
-- Admins, pastors, editors, leaders can view and edit all
DROP POLICY IF EXISTS "Lectura de teléfonos para staff" ON public.member_phones;
CREATE POLICY "Lectura de teléfonos para staff" 
    ON public.member_phones 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = (select auth.uid()) 
            AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')
        )
    );

DROP POLICY IF EXISTS "Escritura de teléfonos para staff" ON public.member_phones;
CREATE POLICY "Escritura de teléfonos para staff" 
    ON public.member_phones 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = (select auth.uid()) 
            AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = (select auth.uid()) 
            AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')
        )
    );

-- Allow members to manage their own additional phones if self-management is active
DROP POLICY IF EXISTS "Lectura de teléfonos propios" ON public.member_phones;
CREATE POLICY "Lectura de teléfonos propios" 
    ON public.member_phones 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.member_id = member_phones.member_id
        )
    );

DROP POLICY IF EXISTS "Escritura de teléfonos propios" ON public.member_phones;
CREATE POLICY "Escritura de teléfonos propios" 
    ON public.member_phones 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.member_id = member_phones.member_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.member_id = member_phones.member_id
        )
    );
