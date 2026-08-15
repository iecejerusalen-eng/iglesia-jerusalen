-- Strategic map: permission-aware member data and operational cell metadata.
-- The existing `map` module permission controls access:
--   view = names, leadership, and map position
--   edit = pastoral contact and address details plus cell management

CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.cells
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'planning', 'archived')),
  ADD COLUMN IF NOT EXISTS capacity integer
    CHECK (capacity IS NULL OR capacity > 0),
  ADD COLUMN IF NOT EXISTS coverage_radius_m integer NOT NULL DEFAULT 500
    CHECK (coverage_radius_m BETWEEN 100 AND 10000),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS cells_active_coordinates_idx
  ON public.cells (status, latitude, longitude)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.get_strategic_map_members()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  photo_url text,
  is_leader boolean,
  leadership_role text,
  ministry_id uuid,
  latitude numeric,
  longitude numeric,
  phone text,
  phone_country_code text,
  address text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  can_view boolean;
  can_manage boolean;
BEGIN
  can_view := private.current_user_has_admin_permission('map', 'view')
    OR private.current_user_has_admin_permission('map', 'edit');
  can_manage := private.current_user_has_admin_permission('map', 'edit');

  IF NOT can_view THEN
    RAISE EXCEPTION 'No tienes permiso para ver el mapa estratégico'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    member.id,
    member.first_name,
    member.last_name,
    member.photo_url,
    member.is_leader,
    member.leadership_role,
    member.ministry_id,
    member.latitude,
    member.longitude,
    CASE WHEN can_manage THEN member.phone ELSE NULL END,
    CASE WHEN can_manage THEN member.phone_country_code ELSE NULL END,
    CASE WHEN can_manage THEN member.address ELSE NULL END,
    member.created_at
  FROM public.members member
  WHERE member.deleted_at IS NULL
  ORDER BY member.last_name, member.first_name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_strategic_map_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_strategic_map_members() TO authenticated;

DROP POLICY IF EXISTS "Permitir lectura de células a autorizados" ON public.cells;
DROP POLICY IF EXISTS "Permitir gestión de células a admin y secretaria" ON public.cells;
DROP POLICY IF EXISTS "Strategic map reads cells" ON public.cells;
CREATE POLICY "Strategic map reads cells"
  ON public.cells FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.current_user_has_admin_permission('map', 'view')
      OR private.current_user_has_admin_permission('map', 'edit')
    )
  );

DROP POLICY IF EXISTS "Strategic map manages cells" ON public.cells;
CREATE POLICY "Strategic map manages cells"
  ON public.cells FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('map', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('map', 'edit'));

COMMENT ON FUNCTION public.get_strategic_map_members() IS
  'Returns only the member fields required by the strategic map. Contact data requires the map edit permission.';
