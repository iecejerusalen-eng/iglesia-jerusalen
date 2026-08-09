-- Repair two legacy functions detected by `supabase db lint`.

DROP FUNCTION IF EXISTS public.purge_old_events();
CREATE FUNCTION public.purge_old_events()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  WITH deleted AS (
    DELETE FROM public.lms_calendar_events
    WHERE end_date < (CURRENT_DATE - INTERVAL '2 years')
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  RETURN v_deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_old_events() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_student_status(p_student_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile record;
  v_has_academic_access boolean;
  v_masked_email text;
BEGIN
  SELECT
    profile.id,
    concat_ws(' ', profile.first_name, profile.last_name) AS full_name,
    profile.photo_url,
    profile.role,
    profile.email
  INTO v_profile
  FROM public.profiles profile
  WHERE profile.id = p_student_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Estudiante no encontrado');
  END IF;

  SELECT (
    EXISTS (
      SELECT 1 FROM public.lms_enrollments enrollment
      WHERE enrollment.user_id = p_student_id AND enrollment.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_school_memberships membership
      WHERE membership.user_id = p_student_id AND membership.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_course_teachers teacher
      WHERE teacher.user_id = p_student_id
    )
    OR v_profile.role::text IN ('admin', 'pastor', 'editor')
  ) INTO v_has_academic_access;

  v_masked_email := CASE
    WHEN v_profile.email IS NULL OR position('@' IN v_profile.email) <= 1 THEN NULL
    ELSE left(v_profile.email, 1) || '***@' || split_part(v_profile.email, '@', 2)
  END;

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', v_profile.id,
      'full_name', v_profile.full_name,
      'avatar_url', v_profile.photo_url,
      'role', v_profile.role,
      'email_masked', v_masked_email,
      'is_active', v_has_academic_access,
      'verified_at', now()
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_student_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_student_status(uuid) TO anon, authenticated;
