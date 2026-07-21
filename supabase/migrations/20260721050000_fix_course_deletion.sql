-- Migration: 20260721050000_fix_course_deletion.sql

-- Drop the function if it exists to replace it
DROP FUNCTION IF EXISTS public.delete_lms_course(UUID);

CREATE OR REPLACE FUNCTION public.delete_lms_course(p_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the caller is an admin, editor, pastor, or leader
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (select auth.uid()) AND role IN ('admin', 'editor', 'pastor', 'leader')
    ) THEN
        RAISE EXCEPTION 'Access denied. Only admins, editors, pastors, and leaders can delete courses.';
    END IF;

    -- Delete the course. 
    -- We assume ON DELETE CASCADE is set for all child tables. 
    -- Because this runs as SECURITY DEFINER, it bypasses RLS on child tables, avoiding issues
    -- where child table rows cannot be deleted due to RLS policies.
    DELETE FROM public.lms_courses WHERE id = p_course_id;
END;
$$;