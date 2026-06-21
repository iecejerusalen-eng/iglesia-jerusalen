-- Migración SQL: Corrección de Claves Foráneas para Joins de Profiles
-- Añade restricciones de clave foránea apuntando a profiles(id) para que la API de Supabase (PostgREST)
-- pueda resolver automáticamente las consultas relacionales (joins) como profiles:user_id o profiles:student_id.

-- 1. Tabla: lms_enrollment_requests
ALTER TABLE lms_enrollment_requests
  DROP CONSTRAINT IF EXISTS fk_lms_enrollment_requests_profiles;

ALTER TABLE lms_enrollment_requests
  ADD CONSTRAINT fk_lms_enrollment_requests_profiles 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 2. Tabla: lms_enrollments
ALTER TABLE lms_enrollments
  DROP CONSTRAINT IF EXISTS fk_lms_enrollments_profiles;

ALTER TABLE lms_enrollments
  ADD CONSTRAINT fk_lms_enrollments_profiles 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 3. Tabla: lms_assignment_submissions
ALTER TABLE lms_assignment_submissions
  DROP CONSTRAINT IF EXISTS fk_lms_assignment_submissions_profiles;

ALTER TABLE lms_assignment_submissions
  ADD CONSTRAINT fk_lms_assignment_submissions_profiles 
  FOREIGN KEY (student_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 4. Tabla: lms_lesson_forum_posts
ALTER TABLE lms_lesson_forum_posts
  DROP CONSTRAINT IF EXISTS fk_lms_lesson_forum_posts_profiles;

ALTER TABLE lms_lesson_forum_posts
  ADD CONSTRAINT fk_lms_lesson_forum_posts_profiles 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 5. Tabla: lms_tutoring_appointments
ALTER TABLE lms_tutoring_appointments
  DROP CONSTRAINT IF EXISTS fk_lms_tutoring_appointments_profiles;

ALTER TABLE lms_tutoring_appointments
  ADD CONSTRAINT fk_lms_tutoring_appointments_profiles 
  FOREIGN KEY (student_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;
