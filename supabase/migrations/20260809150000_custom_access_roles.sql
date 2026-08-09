-- Gestión de acceso: roles personalizados, asignaciones y protección de privilegios.

CREATE TABLE IF NOT EXISTS public.access_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 60),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#2563eb' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(permissions) = 'object'),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_role_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS access_roles_active_idx
  ON public.access_roles (is_active, name);

CREATE INDEX IF NOT EXISTS profiles_custom_role_ids_idx
  ON public.profiles USING gin (custom_role_ids);

CREATE OR REPLACE FUNCTION public.current_user_is_active_admin()
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
      )
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_active_admin() TO authenticated;

ALTER TABLE public.access_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read active access roles" ON public.access_roles;
CREATE POLICY "Authenticated users read active access roles"
  ON public.access_roles
  FOR SELECT
  TO authenticated
  USING (is_active OR public.current_user_is_active_admin());

DROP POLICY IF EXISTS "Admins manage access roles" ON public.access_roles;
CREATE POLICY "Admins manage access roles"
  ON public.access_roles
  FOR ALL
  TO authenticated
  USING (public.current_user_is_active_admin())
  WITH CHECK (public.current_user_is_active_admin());

CREATE OR REPLACE FUNCTION public.set_access_role_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_access_role_updated_at ON public.access_roles;
CREATE TRIGGER set_access_role_updated_at
  BEFORE UPDATE ON public.access_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_access_role_updated_at();

CREATE OR REPLACE FUNCTION public.protect_profile_access_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  access_changed boolean;
  removing_admin boolean;
  active_admin_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    access_changed := true;
    removing_admin := OLD.banned IS NOT TRUE AND (
      OLD.role::text = 'admin'
      OR 'admin' = ANY(COALESCE(OLD.roles::text[], ARRAY[]::text[]))
    );
  ELSE
    access_changed :=
      OLD.role IS DISTINCT FROM NEW.role
      OR OLD.roles IS DISTINCT FROM NEW.roles
      OR OLD.permissions_override IS DISTINCT FROM NEW.permissions_override
      OR OLD.allowed_ministries IS DISTINCT FROM NEW.allowed_ministries
      OR OLD.custom_role_ids IS DISTINCT FROM NEW.custom_role_ids
      OR OLD.banned IS DISTINCT FROM NEW.banned;

    removing_admin := OLD.banned IS NOT TRUE
      AND (OLD.role::text = 'admin' OR 'admin' = ANY(COALESCE(OLD.roles::text[], ARRAY[]::text[])))
      AND (
        NEW.banned IS TRUE
        OR (
          NEW.role::text <> 'admin'
          AND NOT ('admin' = ANY(COALESCE(NEW.roles::text[], ARRAY[]::text[])))
        )
      );
  END IF;

  IF access_changed AND NOT public.current_user_is_active_admin() THEN
    RAISE EXCEPTION 'Solo un administrador activo puede modificar roles, permisos o suspensión.';
  END IF;

  IF removing_admin THEN
    SELECT count(*)
      INTO active_admin_count
    FROM public.profiles profile
    WHERE profile.id <> OLD.id
      AND profile.banned IS NOT TRUE
      AND (
        profile.role::text = 'admin'
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
      );

    IF active_admin_count = 0 THEN
      RAISE EXCEPTION 'Debe permanecer al menos un administrador activo.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_access_fields ON public.profiles;
CREATE TRIGGER protect_profile_access_fields
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_access_fields();

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.current_user_is_active_admin() THEN
    RAISE EXCEPTION 'Operación denegada. Solo los administradores activos pueden eliminar usuarios.';
  END IF;

  IF target_user_id = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'No puedes eliminar tu propia cuenta administrativa.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La cuenta solicitada no existe.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_by_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_access_role(target_role_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.current_user_is_active_admin() THEN
    RAISE EXCEPTION 'Operación denegada. Solo los administradores activos pueden eliminar roles.';
  END IF;

  UPDATE public.profiles
  SET custom_role_ids = array_remove(custom_role_ids, target_role_id),
      updated_at = now()
  WHERE target_role_id = ANY(custom_role_ids);

  DELETE FROM public.access_roles WHERE id = target_role_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El rol personalizado solicitado no existe.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_access_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_access_role(uuid) TO authenticated;

COMMENT ON TABLE public.access_roles IS
  'Roles personalizados del panel. Sus permisos se suman a los roles del sistema asignados al perfil.';
COMMENT ON COLUMN public.profiles.custom_role_ids IS
  'Identificadores de roles personalizados asignados al usuario.';
