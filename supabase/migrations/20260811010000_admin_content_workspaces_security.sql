-- Secure the new administrative content workspaces with the same permission
-- model used by the client (base role, override, and custom access roles).

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.current_user_has_admin_permission(
  module_key text,
  capability_key text DEFAULT 'edit'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.banned IS NOT TRUE
      AND (
        profile.role::text = 'admin'
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR COALESCE((profile.permissions_override -> module_key ->> capability_key)::boolean, false)
        OR EXISTS (
          SELECT 1
          FROM public.role_permissions permission
          WHERE permission.role::text = ANY(
            array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[]))
          )
            AND COALESCE((permission.permissions -> module_key ->> capability_key)::boolean, false)
        )
        OR EXISTS (
          SELECT 1
          FROM public.access_roles access_role
          WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, '{}'::uuid[]))
            AND access_role.is_active
            AND COALESCE((access_role.permissions -> module_key ->> capability_key)::boolean, false)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION private.current_user_has_admin_permission(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_has_admin_permission(text, text) TO authenticated;

DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.schedules;
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.schedules;
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.schedules;
CREATE POLICY "Authorized editors insert schedules" ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (private.current_user_has_admin_permission('events', 'edit'));
CREATE POLICY "Authorized editors update schedules" ON public.schedules
  FOR UPDATE TO authenticated
  USING (private.current_user_has_admin_permission('events', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('events', 'edit'));
CREATE POLICY "Authorized editors delete schedules" ON public.schedules
  FOR DELETE TO authenticated
  USING (private.current_user_has_admin_permission('events', 'edit'));

DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.reading_plans;
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.reading_plans;
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.reading_plans;
CREATE POLICY "Authorized editors insert reading plans" ON public.reading_plans
  FOR INSERT TO authenticated
  WITH CHECK (private.current_user_has_admin_permission('study_programs', 'edit'));
CREATE POLICY "Authorized editors update reading plans" ON public.reading_plans
  FOR UPDATE TO authenticated
  USING (private.current_user_has_admin_permission('study_programs', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('study_programs', 'edit'));
CREATE POLICY "Authorized editors delete reading plans" ON public.reading_plans
  FOR DELETE TO authenticated
  USING (private.current_user_has_admin_permission('study_programs', 'edit'));

DROP POLICY IF EXISTS "Gestión de insignias por Admin" ON public.badges;
CREATE POLICY "Authorized editors manage badges" ON public.badges
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('study_programs', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('study_programs', 'edit'));

DROP POLICY IF EXISTS "Permitir lectura de mensajes de contacto a administradores" ON public.contact_messages;
DROP POLICY IF EXISTS "Permitir actualizar mensajes de contacto a administradores" ON public.contact_messages;
CREATE POLICY "Authorized team reads contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (private.current_user_has_admin_permission('chat', 'view'));
CREATE POLICY "Authorized team updates contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (private.current_user_has_admin_permission('chat', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('chat', 'edit'));

CREATE INDEX IF NOT EXISTS schedules_order_idx ON public.schedules (order_index, day);
CREATE INDEX IF NOT EXISTS reading_progress_plan_idx ON public.user_reading_progress (plan_id);
CREATE INDEX IF NOT EXISTS user_badges_badge_idx ON public.user_badges (badge_id);
CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx ON public.contact_messages (status, created_at DESC);

GRANT SELECT ON public.schedules, public.reading_plans, public.badges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schedules, public.reading_plans, public.badges TO authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT SELECT ON public.user_reading_progress, public.user_badges TO authenticated;

COMMENT ON FUNCTION private.current_user_has_admin_permission(text, text) IS
  'Checks active profile, role permissions, explicit overrides, and custom access roles for RLS policies.';
