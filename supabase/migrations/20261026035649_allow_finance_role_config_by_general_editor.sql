-- General editors may adjust only the permission map of the existing finance
-- role. The database keeps role identity, assignment, creation and deletion
-- reserved for active administrators.

CREATE OR REPLACE FUNCTION private.finance_role_permissions_are_valid(p_permissions jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_permissions IS NULL OR jsonb_typeof(p_permissions) <> 'object' THEN false
    ELSE
      (p_permissions - ARRAY['finances', 'orders', 'products', 'store_settings', 'dashboard']::text[]) = '{}'::jsonb
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_each(p_permissions) AS module(name, capabilities)
        WHERE jsonb_typeof(module.capabilities) <> 'object'
          OR (module.capabilities - ARRAY['view', 'edit']::text[]) <> '{}'::jsonb
          OR EXISTS (
            SELECT 1
            FROM jsonb_each(module.capabilities) AS capability(name, value)
            WHERE jsonb_typeof(capability.value) <> 'boolean'
          )
      )
  END;
$$;

REVOKE ALL ON FUNCTION private.finance_role_permissions_are_valid(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.finance_role_permissions_are_valid(jsonb) TO authenticated;

DROP POLICY IF EXISTS "Finance role editors can update finance role" ON public.access_roles;
CREATE POLICY "Finance role editors can update finance role"
  ON public.access_roles
  FOR UPDATE
  TO authenticated
  USING (
    slug = 'encargado_finanzas'
    AND (SELECT private.current_user_has_admin_permission('users', 'edit'))
  )
  WITH CHECK (
    slug = 'encargado_finanzas'
    AND (SELECT private.current_user_has_admin_permission('users', 'edit'))
    AND private.finance_role_permissions_are_valid(permissions)
  );

CREATE OR REPLACE FUNCTION private.restrict_finance_role_editor_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT public.current_user_is_active_admin()) THEN
    RETURN NEW;
  END IF;

  IF NOT (SELECT private.current_user_has_admin_permission('users', 'edit')) THEN
    RAISE EXCEPTION 'Solo administradores activos o editores autorizados pueden actualizar el rol financiero.';
  END IF;

  IF OLD.slug <> 'encargado_finanzas'
    OR NEW.slug <> OLD.slug
    OR NEW.name IS DISTINCT FROM OLD.name
    OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.color IS DISTINCT FROM OLD.color
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'El editor general solo puede cambiar los permisos del rol Encargado de finanzas.';
  END IF;

  IF NOT private.finance_role_permissions_are_valid(NEW.permissions) THEN
    RAISE EXCEPTION 'El rol financiero solo puede incluir permisos de Finanzas, Pedidos, Productos, Configuración de tienda y Panel.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.restrict_finance_role_editor_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS restrict_finance_role_editor_fields ON public.access_roles;
CREATE TRIGGER restrict_finance_role_editor_fields
  BEFORE UPDATE ON public.access_roles
  FOR EACH ROW
  EXECUTE FUNCTION private.restrict_finance_role_editor_fields();
