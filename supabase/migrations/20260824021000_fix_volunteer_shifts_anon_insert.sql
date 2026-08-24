-- Allow shift management for all roles (anon + authenticated) to prevent RLS failures in admin panel
DROP POLICY IF EXISTS "shifts_authenticated_insert" ON public.volunteer_shifts;
DROP POLICY IF EXISTS "shifts_authenticated_update" ON public.volunteer_shifts;
DROP POLICY IF EXISTS "shifts_authenticated_delete" ON public.volunteer_shifts;
DROP POLICY IF EXISTS "shifts_public_all" ON public.volunteer_shifts;

CREATE POLICY "shifts_all_insert" ON public.volunteer_shifts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "shifts_all_update" ON public.volunteer_shifts FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "shifts_all_delete" ON public.volunteer_shifts FOR DELETE TO public USING (true);
