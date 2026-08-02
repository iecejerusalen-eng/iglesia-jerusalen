-- Harden the public student-verification RPC.
--
-- The previous implementation returned the student's full email address and
-- queried a legacy shape of lms_student_stats that no longer exists. Keep the
-- public credential check working while exposing only a masked email address.

CREATE OR REPLACE FUNCTION public.verify_student_status(p_student_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile record;
  v_has_active_enrollment boolean;
  v_is_active boolean;
  v_masked_email text;
BEGIN
  SELECT
    p.id,
    concat_ws(' ', p.first_name, p.last_name) AS full_name,
    p.avatar_url,
    p.role,
    p.email
  INTO v_profile
  FROM public.profiles AS p
  WHERE p.id = p_student_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Estudiante no encontrado'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.lms_enrollments AS enrollment
    WHERE enrollment.user_id = p_student_id
      AND enrollment.status = 'active'
  )
  INTO v_has_active_enrollment;

  v_is_active := v_has_active_enrollment
    OR v_profile.role IN ('admin', 'teacher');

  v_masked_email := CASE
    WHEN v_profile.email IS NULL OR position('@' IN v_profile.email) <= 1 THEN NULL
    ELSE left(v_profile.email, 1) || '***@' || split_part(v_profile.email, '@', 2)
  END;

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', v_profile.id,
      'full_name', v_profile.full_name,
      'avatar_url', v_profile.avatar_url,
      'role', v_profile.role,
      'email_masked', v_masked_email,
      'is_active', v_is_active,
      'verified_at', now()
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_student_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_student_status(uuid) TO anon, authenticated;
