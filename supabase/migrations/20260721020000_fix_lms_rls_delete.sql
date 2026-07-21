-- 20260721020000_fix_lms_rls_delete.sql
-- Fix: Allow admin to DELETE schools and courses
-- Fix: Remove duplicate Escuela Dominical

-- ================================================================
-- 1. SCHOOLS: Add DELETE policy for admins
-- ================================================================
DROP POLICY IF EXISTS "Admins can manage schools" ON public.lms_schools;
DROP POLICY IF EXISTS "Admins can insert schools" ON public.lms_schools;
DROP POLICY IF EXISTS "Admins can update schools" ON public.lms_schools;
DROP POLICY IF EXISTS "Admins can delete schools" ON public.lms_schools;

-- Recreate with explicit operations
CREATE POLICY "Admins can insert schools" ON public.lms_schools
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor', 'pastor'))
  );

CREATE POLICY "Admins can update schools" ON public.lms_schools
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor', 'pastor'))
  );

CREATE POLICY "Admins can delete schools" ON public.lms_schools
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor'))
  );

-- ================================================================
-- 2. COURSES: Ensure admin can DELETE courses
-- ================================================================
-- Check if policy exists and add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lms_courses' AND policyname = 'Admins can delete courses'
  ) THEN
    DROP POLICY IF EXISTS "Admins can delete courses" ON public.lms_courses;
    CREATE POLICY "Admins can delete courses" ON public.lms_courses
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor'))
      );
  END IF;
END $$;

-- ================================================================
-- 3. ACADEMIC PERIODS: Ensure DELETE works
-- ================================================================
DROP POLICY IF EXISTS "Admins can manage periods" ON public.lms_academic_periods;

CREATE POLICY "Admins can manage periods" ON public.lms_academic_periods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor'))
  );

-- ================================================================
-- 4. Remove duplicate Escuela Dominical
-- Keep the one created by the Fase9 migration (escuela-dominical slug),
-- and remove any duplicates keeping the one with most content / oldest
-- ================================================================
DELETE FROM public.lms_schools
WHERE slug = 'escuela-dominical-central'
   OR (name ILIKE 'Escuela Dominical' AND slug NOT IN ('escuela-dominical', 'dominical'));

-- If there are still duplicates (same slug), keep the oldest one
DELETE FROM public.lms_schools
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC) as rn
    FROM public.lms_schools
    WHERE LOWER(name) LIKE '%escuela dominical%'
  ) sub
  WHERE rn > 1
);
