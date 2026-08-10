-- 20260810010000_fix_speakers_sermons_rls.sql
-- Fix RLS policies that incorrectly relied on auth.jwt()->>'role' instead of public.profiles.role

-- ==========================================
-- 1. speakers
-- ==========================================
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.speakers;
CREATE POLICY "Consolidated manage access insert" ON public.speakers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Consolidated manage access update" ON public.speakers;
CREATE POLICY "Consolidated manage access update" ON public.speakers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.speakers;
CREATE POLICY "Consolidated manage access delete" ON public.speakers FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));


-- ==========================================
-- 2. sermons
-- ==========================================
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.sermons;
CREATE POLICY "Consolidated manage access insert" ON public.sermons FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'editor', 'leader')));

DROP POLICY IF EXISTS "Consolidated manage access update" ON public.sermons;
CREATE POLICY "Consolidated manage access update" ON public.sermons FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'editor', 'leader'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'editor', 'leader')));

DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.sermons;
CREATE POLICY "Consolidated manage access delete" ON public.sermons FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'editor', 'leader')));
