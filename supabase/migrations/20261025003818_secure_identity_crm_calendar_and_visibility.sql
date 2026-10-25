-- Privacidad de perfiles y CRM, controles editables de herramientas y agenda pública mínima.

-- La visibilidad pública no depende del bundle: el administrador puede activarla
-- desde el panel y las rutas leen esta tabla. Un fallo de lectura deja todo oculto.
CREATE TABLE IF NOT EXISTS public.site_feature_visibility (
  feature_key text PRIMARY KEY CHECK (feature_key IN ('store', 'classroom', 'admin_onboarding', 'toolbox')),
  is_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.site_feature_visibility ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read site feature visibility" ON public.site_feature_visibility;
CREATE POLICY "Public can read site feature visibility"
  ON public.site_feature_visibility FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Settings editors manage site feature visibility" ON public.site_feature_visibility;
CREATE POLICY "Settings editors manage site feature visibility"
  ON public.site_feature_visibility FOR ALL TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('settings', 'edit')))
  WITH CHECK ((SELECT private.current_user_has_admin_permission('settings', 'edit')));
GRANT SELECT ON public.site_feature_visibility TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_feature_visibility TO authenticated;

CREATE OR REPLACE FUNCTION public.set_site_feature_visibility_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := (SELECT auth.uid());
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS site_feature_visibility_updated_at ON public.site_feature_visibility;
CREATE TRIGGER site_feature_visibility_updated_at
  BEFORE INSERT OR UPDATE ON public.site_feature_visibility
  FOR EACH ROW EXECUTE FUNCTION public.set_site_feature_visibility_updated_at();

-- Mantiene en SQL el mismo bypass administrativo que authService/usePermissions:
-- superadmin recibe permisos completos y los overrides continúan siendo autoritativos.
CREATE OR REPLACE FUNCTION private.profile_has_admin_permission(
  target_user uuid, module_key text, capability_key text
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.id = target_user AND profile.banned IS NOT TRUE
      AND CASE
        WHEN profile.role::text IN ('admin', 'superadmin')
          OR COALESCE(profile.roles::text[], ARRAY[]::text[]) && ARRAY['admin', 'superadmin']::text[] THEN true
        WHEN profile.permissions_override IS NOT NULL THEN
          COALESCE((profile.permissions_override -> module_key ->> capability_key)::boolean,
            module_key = 'dashboard' AND capability_key = 'view')
        ELSE (module_key = 'dashboard' AND capability_key = 'view')
          OR EXISTS (
            SELECT 1 FROM public.role_permissions permission
            WHERE permission.role::text = ANY(array_prepend(profile.role::text,
              COALESCE(profile.roles::text[], ARRAY[]::text[])))
              AND COALESCE((permission.permissions -> module_key ->> capability_key)::boolean, false)
          )
          OR EXISTS (
            SELECT 1 FROM public.access_roles access_role
            WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, '{}'::uuid[]))
              AND access_role.is_active
              AND COALESCE((access_role.permissions -> module_key ->> capability_key)::boolean, false)
          )
      END
  );
$$;
REVOKE ALL ON FUNCTION private.profile_has_admin_permission(uuid, text, text) FROM PUBLIC, anon, authenticated;

-- Impide que una cuenta cambie sus vínculos al CRM o al ministerio, su correo
-- operativo o su condición de docente y herede accesos mediante políticas hijas.
CREATE OR REPLACE FUNCTION public.current_user_is_active_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid()) AND profile.banned IS NOT TRUE
      AND (profile.role::text IN ('admin', 'superadmin')
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR 'superadmin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[])))
  );
$$;
REVOKE ALL ON FUNCTION public.current_user_is_active_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_active_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_access_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  access_changed boolean;
  removing_admin boolean;
  active_admin_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    access_changed := true;
    removing_admin := OLD.banned IS NOT TRUE AND (
      OLD.role::text IN ('admin', 'superadmin')
      OR 'admin' = ANY(COALESCE(OLD.roles::text[], ARRAY[]::text[]))
      OR 'superadmin' = ANY(COALESCE(OLD.roles::text[], ARRAY[]::text[]))
    );
  ELSE
    access_changed :=
      OLD.role IS DISTINCT FROM NEW.role
      OR OLD.roles IS DISTINCT FROM NEW.roles
      OR OLD.permissions_override IS DISTINCT FROM NEW.permissions_override
      OR OLD.allowed_ministries IS DISTINCT FROM NEW.allowed_ministries
      OR OLD.custom_role_ids IS DISTINCT FROM NEW.custom_role_ids
      OR OLD.banned IS DISTINCT FROM NEW.banned
      OR OLD.member_id IS DISTINCT FROM NEW.member_id
      OR OLD.ministry_id IS DISTINCT FROM NEW.ministry_id
      OR OLD.email IS DISTINCT FROM NEW.email
      OR OLD.is_teacher IS DISTINCT FROM NEW.is_teacher;

    removing_admin := OLD.banned IS NOT TRUE
      AND (OLD.role::text IN ('admin', 'superadmin')
        OR 'admin' = ANY(COALESCE(OLD.roles::text[], ARRAY[]::text[]))
        OR 'superadmin' = ANY(COALESCE(OLD.roles::text[], ARRAY[]::text[])))
      AND (NEW.banned IS TRUE OR (NEW.role::text NOT IN ('admin', 'superadmin')
        AND NOT ('admin' = ANY(COALESCE(NEW.roles::text[], ARRAY[]::text[])))
        AND NOT ('superadmin' = ANY(COALESCE(NEW.roles::text[], ARRAY[]::text[])))));
  END IF;

  IF access_changed AND NOT public.current_user_is_active_admin() THEN
    RAISE EXCEPTION 'Solo un administrador activo puede modificar roles, permisos, vínculos o suspensión.';
  END IF;

  IF removing_admin THEN
    SELECT count(*) INTO active_admin_count
    FROM public.profiles profile
    WHERE profile.id <> OLD.id AND profile.banned IS NOT TRUE
      AND (profile.role::text IN ('admin', 'superadmin')
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR 'superadmin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[])));
    IF active_admin_count = 0 THEN
      RAISE EXCEPTION 'Debe permanecer al menos un administrador o superadministrador activo.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Reemplaza lecturas globales de perfiles. Los perfiles completos solo son
-- visibles al propio usuario o a personal con permiso sobre usuarios/miembros.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd IN ('SELECT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_row.policyname);
  END LOOP;
END;
$$;
CREATE POLICY "profiles_read_self_or_authorized_staff"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid())
    OR (SELECT private.current_user_has_admin_permission('users', 'view'))
    OR (SELECT private.current_user_has_admin_permission('members', 'view')));

DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd IN ('UPDATE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_row.policyname);
  END LOOP;
END;
$$;
CREATE POLICY "profiles_update_self_or_user_editors"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT private.current_user_has_admin_permission('users', 'edit')))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT private.current_user_has_admin_permission('users', 'edit')));

-- Los permisos de roles son datos de configuración del sistema. No se comparan
-- claims custom del JWT (normalmente `authenticated`) con el rol de la iglesia.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'role_permissions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.role_permissions', policy_row.policyname);
  END LOOP;
END;
$$;
CREATE POLICY "role_permissions_read_authenticated"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_admin_insert"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.current_user_is_active_admin()));
CREATE POLICY "role_permissions_admin_update"
  ON public.role_permissions FOR UPDATE TO authenticated
  USING ((SELECT public.current_user_is_active_admin()))
  WITH CHECK ((SELECT public.current_user_is_active_admin()));
CREATE POLICY "role_permissions_admin_delete"
  ON public.role_permissions FOR DELETE TO authenticated
  USING ((SELECT public.current_user_is_active_admin()));

-- Retira los permisos de lectura global de datos secundarios del censo.
DO $$
DECLARE
  table_name text;
  policy_row record;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['member_service_areas', 'member_talents', 'member_spiritual_gifts', 'member_availabilities'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    FOR policy_row IN SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, table_name);
    END LOOP;
  END LOOP;
END;
$$;

CREATE POLICY "member_service_areas_read_authorized"
  ON public.member_service_areas FOR SELECT TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'view')) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.member_id = member_service_areas.member_id));
CREATE POLICY "member_talents_read_authorized"
  ON public.member_talents FOR SELECT TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'view')) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.member_id = member_talents.member_id));
CREATE POLICY "member_spiritual_gifts_read_authorized"
  ON public.member_spiritual_gifts FOR SELECT TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'view')) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.member_id = member_spiritual_gifts.member_id));
CREATE POLICY "member_availabilities_read_authorized"
  ON public.member_availabilities FOR SELECT TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'view')) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.member_id = member_availabilities.member_id));

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['member_service_areas', 'member_talents', 'member_spiritual_gifts', 'member_availabilities'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((SELECT private.current_user_has_admin_permission(''members'', ''edit''))) WITH CHECK ((SELECT private.current_user_has_admin_permission(''members'', ''edit'')))', table_name || '_manage_authorized', table_name);
  END LOOP;
END;
$$;

-- Eventos: públicos solo cuando están marcados; la gestión se controla por permiso.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', policy_row.policyname);
  END LOOP;
END;
$$;
CREATE POLICY "events_public_anon_read"
  ON public.events FOR SELECT TO anon USING (is_public IS TRUE);
CREATE POLICY "events_public_or_authorized_read"
  ON public.events FOR SELECT TO authenticated
  USING (is_public IS TRUE OR (SELECT private.current_user_has_admin_permission('events', 'view'))
    OR (SELECT private.current_user_has_admin_permission('events', 'edit'))
    OR EXISTS (SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid()) AND (profile.role::text = 'leader'
        OR 'leader' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[])))
        AND profile.ministry_id = events.ministry_id));
CREATE POLICY "events_authorized_create"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_has_admin_permission('events', 'edit'))
    OR EXISTS (SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid()) AND (profile.role::text = 'leader'
        OR 'leader' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[])))
        AND profile.ministry_id = events.ministry_id));
CREATE POLICY "events_authorized_update"
  ON public.events FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('events', 'edit'))
    OR EXISTS (SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid()) AND (profile.role::text = 'leader'
        OR 'leader' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[])))
        AND profile.ministry_id = events.ministry_id))
  WITH CHECK ((SELECT private.current_user_has_admin_permission('events', 'edit'))
    OR EXISTS (SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid()) AND (profile.role::text = 'leader'
        OR 'leader' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[])))
        AND profile.ministry_id = events.ministry_id));
CREATE POLICY "events_authorized_delete"
  ON public.events FOR DELETE TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('events', 'edit'))
    OR EXISTS (SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid()) AND (profile.role::text = 'leader'
        OR 'leader' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[])))
        AND profile.ministry_id = events.ministry_id));

-- La agenda pastoral guarda notas y vínculos CRM de carácter privado. Su vista
-- pública se convierte en una proyección de campos aprobados, sin CRM ni notas.
DROP POLICY IF EXISTS "agenda pública explícita" ON public.agenda_items;
DO $$
DECLARE relation_kind "char";
BEGIN
  SELECT relkind INTO relation_kind
  FROM pg_class relation
  JOIN pg_namespace schema ON schema.oid = relation.relnamespace
  WHERE schema.nspname = 'public' AND relation.relname = 'agenda_publica';

  IF relation_kind = 'v' THEN
    DROP VIEW public.agenda_publica;
  ELSIF relation_kind = 'm' THEN
    DROP MATERIALIZED VIEW public.agenda_publica;
  END IF;
END;
$$;
CREATE TABLE IF NOT EXISTS public.agenda_publica (
  id uuid PRIMARY KEY,
  tipo text NOT NULL,
  titulo text NOT NULL,
  persona_nombre text,
  ubicacion text,
  fecha_inicio timestamptz NOT NULL,
  fecha_fin timestamptz,
  todo_el_dia boolean NOT NULL DEFAULT false,
  estado text NOT NULL,
  prioridad text NOT NULL,
  color text NOT NULL,
  fuente text NOT NULL DEFAULT 'manual'
);
ALTER TABLE public.agenda_publica ADD COLUMN IF NOT EXISTS fuente text NOT NULL DEFAULT 'manual';
ALTER TABLE public.agenda_publica ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agenda_publica_read" ON public.agenda_publica;
CREATE POLICY "agenda_publica_read" ON public.agenda_publica FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.agenda_publica TO anon, authenticated;
REVOKE ALL ON public.agenda_items FROM anon;

CREATE OR REPLACE FUNCTION public.sync_agenda_public_projection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.agenda_publica WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  IF NEW.es_publico IS TRUE AND NEW.estado <> 'cancelado' THEN
    INSERT INTO public.agenda_publica (id, tipo, titulo, persona_nombre, ubicacion,
      fecha_inicio, fecha_fin, todo_el_dia, estado, prioridad, color, fuente)
    VALUES (NEW.id, NEW.tipo, NEW.titulo, NULL, NEW.ubicacion, NEW.fecha_inicio,
      NEW.fecha_fin, NEW.todo_el_dia, NEW.estado, NEW.prioridad, NEW.color, NEW.fuente)
    ON CONFLICT (id) DO UPDATE SET tipo = EXCLUDED.tipo, titulo = EXCLUDED.titulo,
      persona_nombre = NULL, ubicacion = EXCLUDED.ubicacion,
      fecha_inicio = EXCLUDED.fecha_inicio, fecha_fin = EXCLUDED.fecha_fin,
      todo_el_dia = EXCLUDED.todo_el_dia, estado = EXCLUDED.estado,
      prioridad = EXCLUDED.prioridad, color = EXCLUDED.color, fuente = EXCLUDED.fuente;
  ELSE
    DELETE FROM public.agenda_publica WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_agenda_public_projection() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS agenda_items_public_projection ON public.agenda_items;
CREATE TRIGGER agenda_items_public_projection
  AFTER INSERT OR UPDATE OR DELETE ON public.agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_agenda_public_projection();
INSERT INTO public.agenda_publica (id, tipo, titulo, persona_nombre, ubicacion,
  fecha_inicio, fecha_fin, todo_el_dia, estado, prioridad, color, fuente)
SELECT id, tipo, titulo, NULL, ubicacion, fecha_inicio, fecha_fin, todo_el_dia, estado, prioridad, color, fuente
FROM public.agenda_items WHERE es_publico IS TRUE AND estado <> 'cancelado'
ON CONFLICT (id) DO UPDATE SET tipo = EXCLUDED.tipo, titulo = EXCLUDED.titulo,
  persona_nombre = NULL, ubicacion = EXCLUDED.ubicacion, fecha_inicio = EXCLUDED.fecha_inicio,
  fecha_fin = EXCLUDED.fecha_fin, todo_el_dia = EXCLUDED.todo_el_dia,
  estado = EXCLUDED.estado, prioridad = EXCLUDED.prioridad, color = EXCLUDED.color,
  fuente = EXCLUDED.fuente;

DELETE FROM public.agenda_publica published
WHERE NOT EXISTS (
  SELECT 1 FROM public.agenda_items source
  WHERE source.id = published.id AND source.es_publico IS TRUE AND source.estado <> 'cancelado'
);
