-- Reduce personal data exposed by the public credential verification RPC.
-- The page only needs the holder name and whether the academic credential is active.
CREATE OR REPLACE FUNCTION public.verify_student_status(p_student_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile record;
  v_has_academic_access boolean;
BEGIN
  SELECT
    profile.id,
    concat_ws(' ', profile.first_name, profile.last_name) AS full_name,
    profile.role
  INTO v_profile
  FROM public.profiles AS profile
  WHERE profile.id = p_student_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Estudiante no encontrado');
  END IF;

  SELECT (
    EXISTS (
      SELECT 1 FROM public.lms_enrollments AS enrollment
      WHERE enrollment.user_id = p_student_id AND enrollment.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_school_memberships AS membership
      WHERE membership.user_id = p_student_id AND membership.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_course_teachers AS teacher
      WHERE teacher.user_id = p_student_id
    )
    OR v_profile.role::text IN ('admin', 'pastor', 'editor')
  ) INTO v_has_academic_access;

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'full_name', v_profile.full_name,
      'is_active', v_has_academic_access,
      'verified_at', now()
    )
  );
END;
$$;

-- These helpers are used by authenticated RLS policies and authenticated
-- Edge Function calls, never by anonymous visitors.
REVOKE ALL ON FUNCTION public.current_user_can_propresenter(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_can_propresenter(text) TO authenticated;

REVOKE ALL ON FUNCTION public.current_user_can_worship_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_can_worship_manager() TO authenticated;

-- The credential verifier is intentionally public for QR credential checks.
-- Keep that capability while limiting its returned fields above.
REVOKE ALL ON FUNCTION public.verify_student_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_student_status(uuid) TO anon, authenticated;
