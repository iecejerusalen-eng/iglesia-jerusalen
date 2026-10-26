-- Profile deletion is limited to active administrators. The trigger
-- protect_profile_access_fields remains a second server-side safeguard.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd IN ('DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_row.policyname);
  END LOOP;
END;
$$;

CREATE POLICY profiles_delete_active_admins
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((SELECT public.current_user_is_active_admin()));
