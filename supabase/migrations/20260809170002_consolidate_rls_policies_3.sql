-- 20260809170002_consolidate_rls_policies_3.sql
-- Optimización de rendimiento Parte 3: Consolidación final de políticas permisivas (multiple_permissive_policies)

-- ==========================================
-- 1. push_subscriptions
-- ==========================================
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;

DROP POLICY IF EXISTS "Consolidated read access" ON public.push_subscriptions;
CREATE POLICY "Consolidated read access" ON public.push_subscriptions FOR SELECT USING (
  user_id = (SELECT auth.uid()) OR 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'))
);

-- ==========================================
-- 2. reading_plans
-- ==========================================
DROP POLICY IF EXISTS "Gestión de planes de lectura por Admin" ON public.reading_plans;
DROP POLICY IF EXISTS "Lectura pública de planes de lectura" ON public.reading_plans;

DROP POLICY IF EXISTS "Consolidated read access" ON public.reading_plans;
CREATE POLICY "Consolidated read access" ON public.reading_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.reading_plans;
CREATE POLICY "Consolidated manage access insert" ON public.reading_plans FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.reading_plans;
CREATE POLICY "Consolidated manage access update" ON public.reading_plans FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.reading_plans;
CREATE POLICY "Consolidated manage access delete" ON public.reading_plans FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 3. role_permissions
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de permisos a usuarios autenticados" ON public.role_permissions;
DROP POLICY IF EXISTS "Permitir modificación de permisos a administradores" ON public.role_permissions;

DROP POLICY IF EXISTS "Consolidated read access" ON public.role_permissions;
CREATE POLICY "Consolidated read access" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.role_permissions;
CREATE POLICY "Consolidated manage access insert" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.role_permissions;
CREATE POLICY "Consolidated manage access update" ON public.role_permissions FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.role_permissions;
CREATE POLICY "Consolidated manage access delete" ON public.role_permissions FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin'));

-- ==========================================
-- 4. schedules
-- ==========================================
DROP POLICY IF EXISTS "Permitir gestión de horarios a administradores" ON public.schedules;
DROP POLICY IF EXISTS "Permitir lectura pública de horarios" ON public.schedules;

DROP POLICY IF EXISTS "Consolidated read access" ON public.schedules;
CREATE POLICY "Consolidated read access" ON public.schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.schedules;
CREATE POLICY "Consolidated manage access insert" ON public.schedules FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.schedules;
CREATE POLICY "Consolidated manage access update" ON public.schedules FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'manager')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.schedules;
CREATE POLICY "Consolidated manage access delete" ON public.schedules FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'manager'));

-- ==========================================
-- 5. sermon_categories
-- ==========================================
DROP POLICY IF EXISTS "Permitir gestión a administradores" ON public.sermon_categories;
DROP POLICY IF EXISTS "Permitir lectura pública de sermon_categories" ON public.sermon_categories;

DROP POLICY IF EXISTS "Consolidated read access" ON public.sermon_categories;
CREATE POLICY "Consolidated read access" ON public.sermon_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.sermon_categories;
CREATE POLICY "Consolidated manage access insert" ON public.sermon_categories FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.sermon_categories;
CREATE POLICY "Consolidated manage access update" ON public.sermon_categories FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.sermon_categories;
CREATE POLICY "Consolidated manage access delete" ON public.sermon_categories FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor'));

-- ==========================================
-- 6. sermon_notes
-- ==========================================
DROP POLICY IF EXISTS "Lectura de propias notas de sermones" ON public.sermon_notes;
DROP POLICY IF EXISTS "Modificación de propias notas" ON public.sermon_notes;

DROP POLICY IF EXISTS "Consolidated read access" ON public.sermon_notes;
CREATE POLICY "Consolidated read access" ON public.sermon_notes FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.sermon_notes;
CREATE POLICY "Consolidated manage access insert" ON public.sermon_notes FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.sermon_notes;
CREATE POLICY "Consolidated manage access update" ON public.sermon_notes FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.sermon_notes;
CREATE POLICY "Consolidated manage access delete" ON public.sermon_notes FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ==========================================
-- 7. speakers
-- ==========================================
DROP POLICY IF EXISTS "Permitir eliminación de speakers a admins" ON public.speakers;
DROP POLICY IF EXISTS "Permitir inserción de speakers a admins" ON public.speakers;
DROP POLICY IF EXISTS "Permitir actualización de speakers a admins" ON public.speakers;
