-- Centro de misiones: permisos alineados con el RBAC del panel.
-- La lectura pública se conserva para las páginas públicas de misiones.

CREATE INDEX IF NOT EXISTS missions_admin_status_created_idx
  ON public.missions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS missions_admin_scope_status_idx
  ON public.missions (scope, status, created_at DESC);

DROP POLICY IF EXISTS "missions_public_read" ON public.missions;
DROP POLICY IF EXISTS "missions_admin_insert" ON public.missions;
DROP POLICY IF EXISTS "missions_admin_update" ON public.missions;
DROP POLICY IF EXISTS "missions_admin_delete" ON public.missions;
DROP POLICY IF EXISTS "Missions staff can insert" ON public.missions;
DROP POLICY IF EXISTS "Missions staff can update" ON public.missions;
DROP POLICY IF EXISTS "Missions staff can delete" ON public.missions;

CREATE POLICY "missions_public_read"
  ON public.missions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Missions staff can insert"
  ON public.missions FOR INSERT
  TO authenticated
  WITH CHECK (private.current_user_has_admin_permission('missions', 'edit'));

CREATE POLICY "Missions staff can update"
  ON public.missions FOR UPDATE
  TO authenticated
  USING (private.current_user_has_admin_permission('missions', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('missions', 'edit'));

CREATE POLICY "Missions staff can delete"
  ON public.missions FOR DELETE
  TO authenticated
  USING (private.current_user_has_admin_permission('missions', 'edit'));

COMMENT ON TABLE public.missions IS
  'Proyectos misioneros públicos; la gestión administrativa requiere missions.edit.';
