-- Alinea columnas heredadas y endurece el acceso de la suite competitiva.
-- Esta migración debe aplicarse antes de habilitar estos módulos en producción.

ALTER TABLE public.small_groups
  ADD COLUMN IF NOT EXISTS leader_name text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS max_capacity integer;

UPDATE public.small_groups
SET location = location_name
WHERE location IS NULL AND location_name IS NOT NULL;

UPDATE public.small_groups
SET max_capacity = max_members
WHERE max_capacity IS NULL AND max_members IS NOT NULL;

ALTER TABLE public.dynamic_forms
  ADD COLUMN IF NOT EXISTS requires_auth boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.dynamic_form_submissions
  ALTER COLUMN form_slug DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS submitter_name text,
  ADD COLUMN IF NOT EXISTS submitter_email text,
  ADD COLUMN IF NOT EXISTS responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected'));

-- Las políticas iniciales permitían que cualquier sesión autenticada leyera o
-- modificara datos administrativos. Se reemplazan por permisos centralizados.
DROP POLICY IF EXISTS "Lectura pública de sedes activas" ON public.campuses;
DROP POLICY IF EXISTS "Administración total de sedes" ON public.campuses;
DROP POLICY IF EXISTS "Public campuses read" ON public.campuses;
DROP POLICY IF EXISTS "Authenticated admin full campuses" ON public.campuses;
CREATE POLICY "Public active campuses read" ON public.campuses
  FOR SELECT USING (status = 'active');
CREATE POLICY "Authorized campus management" ON public.campuses
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('campuses', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('campuses', 'edit'));

DROP POLICY IF EXISTS "Administración total de familias" ON public.families;
DROP POLICY IF EXISTS "Authenticated admin full families" ON public.families;
CREATE POLICY "Authorized family management" ON public.families
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('families', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('families', 'edit'));

DROP POLICY IF EXISTS "Administración total de checkin infantil" ON public.child_checkin_sessions;
DROP POLICY IF EXISTS "Authenticated admin full child checkin" ON public.child_checkin_sessions;
CREATE POLICY "Authorized child checkin management" ON public.child_checkin_sessions
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('checkin', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('checkin', 'edit'));

DROP POLICY IF EXISTS "Lectura pública de formularios publicados" ON public.dynamic_forms;
DROP POLICY IF EXISTS "Public dynamic forms read" ON public.dynamic_forms;
DROP POLICY IF EXISTS "Administración total de formularios" ON public.dynamic_forms;
DROP POLICY IF EXISTS "Authenticated admin full dynamic forms" ON public.dynamic_forms;
CREATE POLICY "Public published forms read" ON public.dynamic_forms
  FOR SELECT USING (is_published = true);
CREATE POLICY "Authorized form management" ON public.dynamic_forms
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('forms', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('forms', 'edit'));

DROP POLICY IF EXISTS "Inserción pública de respuestas de formularios" ON public.dynamic_form_submissions;
DROP POLICY IF EXISTS "Public insert form submissions" ON public.dynamic_form_submissions;
DROP POLICY IF EXISTS "Administración total de respuestas" ON public.dynamic_form_submissions;
DROP POLICY IF EXISTS "Authenticated admin read form submissions" ON public.dynamic_form_submissions;
CREATE POLICY "Submit published forms" ON public.dynamic_form_submissions
  FOR INSERT
  WITH CHECK (
    form_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.dynamic_forms form WHERE form.id = form_id AND form.is_published = true)
  );
CREATE POLICY "Authorized form submission review" ON public.dynamic_form_submissions
  FOR SELECT TO authenticated
  USING (private.current_user_has_admin_permission('forms', 'view'));

DROP POLICY IF EXISTS "Authenticated insert community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authenticated update community posts" ON public.community_posts;
CREATE POLICY "Authenticated community post submission" ON public.community_posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND length(trim(content)) BETWEEN 1 AND 5000);
CREATE POLICY "Authorized community moderation" ON public.community_posts
  FOR UPDATE TO authenticated
  USING (private.current_user_has_admin_permission('community', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('community', 'edit'));

DROP POLICY IF EXISTS "Authenticated admin full recurring donations" ON public.recurring_donations;
CREATE POLICY "Authorized recurring donation management" ON public.recurring_donations
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('donations', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('donations', 'edit'));

DROP POLICY IF EXISTS "Authenticated admin full tax statements" ON public.tax_statements;
CREATE POLICY "Authorized tax statement management" ON public.tax_statements
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('donations', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('donations', 'edit'));

DROP POLICY IF EXISTS "Authenticated admin full guardians" ON public.authorized_guardians;
CREATE POLICY "Authorized guardian management" ON public.authorized_guardians
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('checkin', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('checkin', 'edit'));

DROP POLICY IF EXISTS "Allow admin manage small groups" ON public.small_groups;
CREATE POLICY "Authorized small group management" ON public.small_groups
  FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('groups', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('groups', 'edit'));

DROP POLICY IF EXISTS "Allow user manage own membership" ON public.group_memberships;
DROP POLICY IF EXISTS "Allow members view memberships" ON public.group_memberships;
CREATE POLICY "Members manage own group request" ON public.group_memberships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members view own group membership" ON public.group_memberships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.current_user_has_admin_permission('groups', 'view'));
CREATE POLICY "Authorized group membership management" ON public.group_memberships
  FOR UPDATE TO authenticated
  USING (private.current_user_has_admin_permission('groups', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('groups', 'edit'));
