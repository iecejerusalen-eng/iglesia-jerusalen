-- ============================================================================
-- FIX RLS POLICIES FOR VOLUNTEER SHIFTS & ASSIGNMENTS
-- Timestamp: 20260824010000
-- ============================================================================

-- Fix volunteer_shifts RLS policies to allow authenticated users / admins to manage shifts
DROP POLICY IF EXISTS "shifts_admin_insert" ON public.volunteer_shifts;
DROP POLICY IF EXISTS "shifts_admin_update" ON public.volunteer_shifts;
DROP POLICY IF EXISTS "shifts_admin_delete" ON public.volunteer_shifts;
DROP POLICY IF EXISTS "shifts_admin_all" ON public.volunteer_shifts;

CREATE POLICY "shifts_authenticated_insert" ON public.volunteer_shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "shifts_authenticated_update" ON public.volunteer_shifts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shifts_authenticated_delete" ON public.volunteer_shifts FOR DELETE TO authenticated USING (true);

-- Fix volunteer_assignments RLS policies
DROP POLICY IF EXISTS "assignments_admin_all" ON public.volunteer_assignments;
DROP POLICY IF EXISTS "assignments_public_insert" ON public.volunteer_assignments;
DROP POLICY IF EXISTS "assignments_user_read" ON public.volunteer_assignments;
DROP POLICY IF EXISTS "Consolidated read access" ON public.volunteer_assignments;

CREATE POLICY "assignments_read_all" ON public.volunteer_assignments FOR SELECT USING (true);
CREATE POLICY "assignments_insert_all" ON public.volunteer_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "assignments_update_all" ON public.volunteer_assignments FOR UPDATE USING (true);
CREATE POLICY "assignments_delete_all" ON public.volunteer_assignments FOR DELETE USING (true);
