-- Solicitudes CRM: rendimiento y permisos por módulo.
-- La recepción pública se conserva; la lectura y gestión quedan en manos del RBAC del panel.

CREATE INDEX IF NOT EXISTS crm_onboarding_submissions_status_created_idx
  ON public.crm_onboarding_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS crm_onboarding_submissions_processed_by_idx
  ON public.crm_onboarding_submissions (processed_by)
  WHERE processed_by IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can insert onboarding submissions" ON public.crm_onboarding_submissions;
DROP POLICY IF EXISTS "Admins can manage onboarding submissions" ON public.crm_onboarding_submissions;
DROP POLICY IF EXISTS "CRM staff can view onboarding submissions" ON public.crm_onboarding_submissions;
DROP POLICY IF EXISTS "CRM staff can update onboarding submissions" ON public.crm_onboarding_submissions;

CREATE POLICY "Anyone can insert onboarding submissions"
  ON public.crm_onboarding_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "CRM staff can view onboarding submissions"
  ON public.crm_onboarding_submissions FOR SELECT
  TO authenticated
  USING (
    private.current_user_has_admin_permission('members', 'view')
    OR private.current_user_has_admin_permission('members', 'edit')
  );

CREATE POLICY "CRM staff can update onboarding submissions"
  ON public.crm_onboarding_submissions FOR UPDATE
  TO authenticated
  USING (private.current_user_has_admin_permission('members', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('members', 'edit'));

COMMENT ON TABLE public.crm_onboarding_submissions IS
  'Solicitudes públicas de ingreso al CRM. La revisión se controla con members.view/members.edit.';
