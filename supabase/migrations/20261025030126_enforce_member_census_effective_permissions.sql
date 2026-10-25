-- Replace permissive legacy census policies with effective permission checks.
DROP POLICY IF EXISTS "Permitir lectura de miembros a personal autorizado" ON public.members;
DROP POLICY IF EXISTS "Permitir lectura de correos a autorizados" ON public.member_emails;
DROP POLICY IF EXISTS "Permitir gestión de miembros a admin y secretaria" ON public.members;
DROP POLICY IF EXISTS "Permitir gestión de correos a admin y secretaria" ON public.member_emails;
DROP POLICY IF EXISTS "Permitir escritura a personal autorizado" ON public.members;
DROP POLICY IF EXISTS "Permitir escritura a personal autorizado" ON public.member_emails;

CREATE POLICY members_insert_by_permission
  ON public.members FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_has_admin_permission('members', 'edit')));
CREATE POLICY members_update_by_permission
  ON public.members FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'edit')))
  WITH CHECK ((SELECT private.current_user_has_admin_permission('members', 'edit')));
CREATE POLICY members_delete_by_permission
  ON public.members FOR DELETE TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'edit')));

CREATE POLICY member_emails_insert_by_permission
  ON public.member_emails FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_has_admin_permission('members', 'edit')));
CREATE POLICY member_emails_update_by_permission
  ON public.member_emails FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'edit')))
  WITH CHECK ((SELECT private.current_user_has_admin_permission('members', 'edit')));
CREATE POLICY member_emails_delete_by_permission
  ON public.member_emails FOR DELETE TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'edit')));