-- Safe, bounded public certificate lookups. These RPCs return display fields only.
CREATE OR REPLACE FUNCTION public.get_public_lms_certificate(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  certificate_data jsonb;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 OR length(p_code) > 256 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', certificate.id,
    'grade', certificate.grade,
    'issued_at', certificate.issued_at,
    'courses', jsonb_build_object(
      'title', course.title,
      'description', COALESCE(course.description, ''),
      'schools', CASE WHEN school.id IS NULL THEN NULL ELSE jsonb_build_object(
        'name', school.name,
        'color', COALESCE(school.color, '#D4AF37'),
        'cover_image_url', COALESCE(school.cover_image_url, '')
      ) END
    ),
    'profiles', jsonb_build_object(
      'full_name', COALESCE(NULLIF(trim(concat_ws(' ', profile.first_name, profile.last_name)), ''), 'Estudiante')
    )
  )
  INTO certificate_data
  FROM public.lms_certificates AS certificate
  LEFT JOIN public.lms_courses AS course ON course.id = certificate.course_id
  LEFT JOIN public.lms_schools AS school ON school.id = course.school_id
  LEFT JOIN public.profiles AS profile ON profile.id = certificate.user_id
  WHERE certificate.id::text = p_code OR certificate.code_url = p_code
  LIMIT 1;

  IF certificate_data IS NOT NULL THEN
    RETURN certificate_data;
  END IF;

  SELECT jsonb_build_object(
    'id', certificate.id,
    'grade', NULL,
    'issued_at', certificate.issue_date,
    'courses', jsonb_build_object(
      'title', course.title,
      'description', COALESCE(course.description, ''),
      'schools', CASE WHEN school.id IS NULL THEN NULL ELSE jsonb_build_object(
        'name', school.name,
        'color', COALESCE(school.color, '#D4AF37'),
        'cover_image_url', COALESCE(school.cover_image_url, '')
      ) END
    ),
    'profiles', jsonb_build_object(
      'full_name', COALESCE(NULLIF(trim(concat_ws(' ', profile.first_name, profile.last_name)), ''), 'Estudiante')
    )
  )
  INTO certificate_data
  FROM public.lms_certificates_issued AS certificate
  LEFT JOIN public.lms_courses AS course ON course.id = certificate.course_id
  LEFT JOIN public.lms_schools AS school ON school.id = course.school_id
  LEFT JOIN public.profiles AS profile ON profile.id = certificate.student_id
  WHERE certificate.id::text = p_code OR certificate.validation_hash = p_code
  LIMIT 1;

  RETURN certificate_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_lms_certificate_issued(p_validation_hash text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'issue_date', certificate.issue_date,
    'student_name', COALESCE(NULLIF(trim(concat_ws(' ', profile.first_name, profile.last_name)), ''), 'Estudiante'),
    'course_name', COALESCE(course.title, 'Curso Desconocido'),
    'validation_hash', certificate.validation_hash
  )
  FROM public.lms_certificates_issued AS certificate
  LEFT JOIN public.profiles AS profile ON profile.id = certificate.student_id
  LEFT JOIN public.lms_courses AS course ON course.id = certificate.course_id
  WHERE p_validation_hash IS NOT NULL
    AND length(p_validation_hash) <= 256
    AND certificate.validation_hash = p_validation_hash
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_public_lms_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_lms_certificate(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_lms_certificate_issued(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_lms_certificate_issued(text) TO anon, authenticated;
