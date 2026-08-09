-- 20260809190000_fix_remaining_security_advisors.sql
-- Optimización de rendimiento Parte 5: Resolviendo warnings de Splinter (Advisors)

-- ==========================================
-- 1. function_search_path_mutable (Añadir SET search_path)
-- ==========================================
ALTER FUNCTION public.increment_version_and_updated_at() SET search_path = public;
ALTER FUNCTION public.increment_prayer_count() SET search_path = public;
ALTER FUNCTION public.decrement_prayer_count() SET search_path = public;
ALTER FUNCTION public.store_unit_price(public.products, integer) SET search_path = public;

-- ==========================================
-- 2. rls_policy_always_true (system_plugins tenía USING (true))
-- ==========================================
DROP POLICY IF EXISTS "Allow admin manage for plugins insert" ON public.system_plugins;
CREATE POLICY "Allow admin manage for plugins insert" ON public.system_plugins FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Allow admin manage for plugins update" ON public.system_plugins;
CREATE POLICY "Allow admin manage for plugins update" ON public.system_plugins FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Allow admin manage for plugins delete" ON public.system_plugins;
CREATE POLICY "Allow admin manage for plugins delete" ON public.system_plugins FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));

-- ==========================================
-- 3. anon_security_definer_function_executable & authenticated_security_definer_function_executable
-- ==========================================
-- Cambiamos a SECURITY INVOKER las que solo leen o modifican donde el admin ya tiene permisos por RLS
ALTER FUNCTION public.current_user_is_active_admin() SECURITY INVOKER;
ALTER FUNCTION public.delete_access_role(uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_current_streak(uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_public_birthdays() SECURITY INVOKER;
ALTER FUNCTION public.verify_student_status(uuid) SECURITY INVOKER;

-- Mover a esquema private (funciones internas que las políticas RLS usan, no disponibles para frontend)
CREATE SCHEMA IF NOT EXISTS private;
ALTER FUNCTION public.is_chat_participant(uuid, uuid) SET SCHEMA private;

-- Quitar permisos de ejecución a triggers de base de datos
REVOKE EXECUTE ON FUNCTION public.protect_profile_access_fields() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_access_fields() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_profile_access_fields() FROM authenticated;

-- NOTA: delete_lms_course y delete_user_by_admin intencionalmente quedan como SECURITY DEFINER en public
-- porque son llamadas por los admins desde el frontend (PostgREST) y requieren alterar registros
-- donde el usuario no tiene acceso a los hijos o al esquema auth (auth.users). 
-- Es seguro ignorar los warnings (0029) para estas dos funciones.
