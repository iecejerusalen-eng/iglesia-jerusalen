-- RPC to safely fetch public student verification data without exposing full profiles
CREATE OR REPLACE FUNCTION verify_student_status(p_student_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_enrollments_count INT;
  v_is_active BOOLEAN;
  v_result JSON;
BEGIN
  -- 1. Obtener datos basicos del perfil
  SELECT id, first_name || ' ' || last_name as full_name, avatar_url, role, email 
  INTO v_profile 
  FROM profiles 
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Estudiante no encontrado');
  END IF;

  -- 2. Verificar si tiene al menos un curso activo o esta en lms_student_stats
  SELECT active_courses 
  INTO v_enrollments_count
  FROM lms_student_stats
  WHERE user_id = p_student_id;

  IF v_enrollments_count IS NULL THEN
    -- Fallback: check raw enrollments
    SELECT count(*) INTO v_enrollments_count 
    FROM lms_enrollments 
    WHERE user_id = p_student_id AND status = 'active';
  END IF;

  -- Determinar si esta activo (basado en si tiene algun enrollment o si es admin/maestro)
  IF v_enrollments_count > 0 OR v_profile.role IN ('admin', 'teacher') THEN
    v_is_active := true;
  ELSE
    v_is_active := false;
  END IF;

  -- 3. Construir resultado JSON
  v_result := json_build_object(
    'success', true,
    'data', json_build_object(
      'id', v_profile.id,
      'full_name', v_profile.full_name,
      'avatar_url', v_profile.avatar_url,
      'role', v_profile.role,
      'email', v_profile.email,
      'is_active', v_is_active,
      'verified_at', now()
    )
  );

  RETURN v_result;
END;
$$;
