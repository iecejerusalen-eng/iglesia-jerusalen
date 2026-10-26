-- Contact-detail policies use the same effective CRM permissions as the member record.
-- Keep a member's own phone details private and editable only on their linked record.

DROP POLICY IF EXISTS "Escritura de teléfonos para staff" ON public.member_phones;
DROP POLICY IF EXISTS "Lectura de teléfonos para staff" ON public.member_phones;
DROP POLICY IF EXISTS "Escritura de teléfonos propios" ON public.member_phones;
DROP POLICY IF EXISTS "Lectura de teléfonos propios" ON public.member_phones;

CREATE POLICY member_phones_read_by_permission_or_owner
  ON public.member_phones
  FOR SELECT
  TO authenticated
  USING (
    (SELECT private.current_user_has_admin_permission('members', 'view'))
    OR EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.member_id = member_phones.member_id
    )
  );

CREATE POLICY member_phones_insert_by_permission
  ON public.member_phones
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.current_user_has_admin_permission('members', 'edit')));

CREATE POLICY member_phones_update_by_permission
  ON public.member_phones
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'edit')))
  WITH CHECK ((SELECT private.current_user_has_admin_permission('members', 'edit')));

CREATE POLICY member_phones_delete_by_permission
  ON public.member_phones
  FOR DELETE
  TO authenticated
  USING ((SELECT private.current_user_has_admin_permission('members', 'edit')));

CREATE POLICY member_phones_manage_own
  ON public.member_phones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.member_id = member_phones.member_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.member_id = member_phones.member_id
    )
  );
