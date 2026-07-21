-- Migration: Teacher Dashboards, Roles, and Course Mapping

-- 1. Add `is_teacher` to profiles so we can mark anyone as a teacher
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_teacher boolean DEFAULT false;

-- 2. Create lms_course_teachers mapping table
CREATE TABLE IF NOT EXISTS public.lms_course_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, user_id)
);

ALTER TABLE public.lms_course_teachers ENABLE ROW LEVEL SECURITY;

-- Admins can manage course teachers
CREATE POLICY "Admins can manage course teachers" ON public.lms_course_teachers 
FOR ALL TO authenticated 
USING (
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role in ('admin', 'pastor')
    )
);

-- Users can view their own teacher assignments
CREATE POLICY "Teachers can view their own assignments" ON public.lms_course_teachers
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));


-- 3. Fix RLS for Courses, Sections, and Activities to restrict editing

-- COURSES
DROP POLICY IF EXISTS "Admin can manage courses" ON public.lms_courses;
CREATE POLICY "Admins and Teachers can manage courses" ON public.lms_courses FOR ALL TO authenticated 
USING (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'pastor')
  )
  OR
  exists (
    select 1 from public.lms_course_teachers
    where course_id = id and user_id = (select auth.uid())
  )
)
WITH CHECK (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'pastor')
  )
  OR
  exists (
    select 1 from public.lms_course_teachers
    where course_id = id and user_id = (select auth.uid())
  )
);

-- SECTIONS
DROP POLICY IF EXISTS "Admin can manage sections" ON public.lms_sections;
CREATE POLICY "Admins and Teachers can manage sections" ON public.lms_sections FOR ALL TO authenticated 
USING (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'pastor')
  )
  OR
  exists (
    select 1 from public.lms_course_teachers
    where course_id = lms_sections.course_id and user_id = (select auth.uid())
  )
)
WITH CHECK (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'pastor')
  )
  OR
  exists (
    select 1 from public.lms_course_teachers
    where course_id = lms_sections.course_id and user_id = (select auth.uid())
  )
);

-- ACTIVITIES
DROP POLICY IF EXISTS "Admin can manage activities" ON public.lms_activities;
CREATE POLICY "Admins and Teachers can manage activities" ON public.lms_activities FOR ALL TO authenticated 
USING (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'pastor')
  )
  OR
  exists (
    select 1 from public.lms_course_teachers ct
    inner join public.lms_sections s on ct.course_id = s.course_id
    where s.id = lms_activities.section_id and ct.user_id = (select auth.uid())
  )
)
WITH CHECK (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'pastor')
  )
  OR
  exists (
    select 1 from public.lms_course_teachers ct
    inner join public.lms_sections s on ct.course_id = s.course_id
    where s.id = lms_activities.section_id and ct.user_id = (select auth.uid())
  )
);
