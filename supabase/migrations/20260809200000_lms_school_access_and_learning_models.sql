-- Aula Virtual multi-escuela: acceso por escuela, modelos formativos y seguridad por asignacion.

ALTER TABLE public.lms_schools
  ADD COLUMN IF NOT EXISTS school_type text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lms_schools_school_type_check'
      AND conrelid = 'public.lms_schools'::regclass
  ) THEN
    ALTER TABLE public.lms_schools
      ADD CONSTRAINT lms_schools_school_type_check
      CHECK (school_type IN ('age_based', 'rank_based', 'custom'));
  END IF;
END $$;

ALTER TABLE public.lms_levels
  ADD COLUMN IF NOT EXISTS min_age smallint,
  ADD COLUMN IF NOT EXISTS max_age smallint,
  ADD COLUMN IF NOT EXISTS parallel_code text,
  ADD COLUMN IF NOT EXISTS level_type text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Completa columnas que las vistas docente/estudiante ya necesitan.
ALTER TABLE public.lms_class_sessions
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS sync_link text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.lms_lesson_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';

ALTER TABLE public.lms_lessons
  ADD COLUMN IF NOT EXISTS due_date timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lms_class_sessions_status_check'
      AND conrelid = 'public.lms_class_sessions'::regclass
  ) THEN
    ALTER TABLE public.lms_class_sessions
      ADD CONSTRAINT lms_class_sessions_status_check
      CHECK (status IN ('scheduled', 'open', 'in_progress', 'closed', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lms_lesson_submissions_status_check'
      AND conrelid = 'public.lms_lesson_submissions'::regclass
  ) THEN
    ALTER TABLE public.lms_lesson_submissions
      ADD CONSTRAINT lms_lesson_submissions_status_check
      CHECK (status IN ('draft', 'submitted', 'graded', 'returned'));
  END IF;
END $$;

ALTER TABLE public.lms_attendance DROP CONSTRAINT IF EXISTS lms_attendance_status_check;
ALTER TABLE public.lms_attendance
  ADD CONSTRAINT lms_attendance_status_check
  CHECK (status IN ('present', 'zoom', 'absent', 'late', 'excused'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lms_levels_age_range_check'
      AND conrelid = 'public.lms_levels'::regclass
  ) THEN
    ALTER TABLE public.lms_levels
      ADD CONSTRAINT lms_levels_age_range_check
      CHECK (
        (min_age IS NULL OR min_age >= 0)
        AND (max_age IS NULL OR max_age >= 0)
        AND (min_age IS NULL OR max_age IS NULL OR min_age <= max_age)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.lms_school_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.lms_schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'coordinator')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  level_id uuid REFERENCES public.lms_levels(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS public.lms_school_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.lms_schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL DEFAULT 'student' CHECK (requested_role IN ('student', 'teacher')),
  requested_level_id uuid REFERENCES public.lms_levels(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  message text,
  decision_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lms_school_access_requests_one_pending_idx
  ON public.lms_school_access_requests (school_id, user_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS lms_school_memberships_user_status_idx
  ON public.lms_school_memberships (user_id, status);
CREATE INDEX IF NOT EXISTS lms_school_memberships_school_role_idx
  ON public.lms_school_memberships (school_id, role, status);
CREATE INDEX IF NOT EXISTS lms_school_memberships_level_idx
  ON public.lms_school_memberships (level_id) WHERE level_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lms_school_memberships_approved_by_idx
  ON public.lms_school_memberships (approved_by) WHERE approved_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS lms_school_access_requests_school_status_idx
  ON public.lms_school_access_requests (school_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS lms_school_access_requests_user_idx
  ON public.lms_school_access_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lms_school_access_requests_level_idx
  ON public.lms_school_access_requests (requested_level_id) WHERE requested_level_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lms_school_access_requests_reviewed_by_idx
  ON public.lms_school_access_requests (reviewed_by) WHERE reviewed_by IS NOT NULL;

-- Conserva el acceso de matrículas y asignaciones docentes que ya existen.
INSERT INTO public.lms_school_memberships (school_id, user_id, role, status, joined_at)
SELECT course.school_id, enrollment.user_id,
       CASE WHEN enrollment.role = 'teacher' THEN 'teacher' ELSE 'student' END,
       'active', COALESCE(enrollment.enrolled_at, now())
FROM public.lms_enrollments enrollment
JOIN public.lms_courses course ON course.id = enrollment.course_id
WHERE course.school_id IS NOT NULL
  AND enrollment.status = 'active'
  AND enrollment.role IN ('student', 'teacher')
ON CONFLICT (school_id, user_id, role) DO NOTHING;

INSERT INTO public.lms_school_memberships (school_id, user_id, role, status)
SELECT DISTINCT course.school_id, teacher.user_id, 'teacher', 'active'
FROM public.lms_course_teachers teacher
JOIN public.lms_courses course ON course.id = teacher.course_id
WHERE course.school_id IS NOT NULL
ON CONFLICT (school_id, user_id, role) DO NOTHING;

ALTER TABLE public.lms_school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_school_access_requests ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.is_lms_school_staff(p_school_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.lms_school_memberships membership
    WHERE membership.school_id = p_school_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.role = ANY(p_roles)
      AND membership.status = 'active'
  );
$$;
REVOKE ALL ON FUNCTION private.is_lms_school_staff(uuid, text[]) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_lms_school_staff(uuid, text[]) TO authenticated;

DROP POLICY IF EXISTS "School memberships visible to participants and managers" ON public.lms_school_memberships;
CREATE POLICY "School memberships visible to participants and managers"
  ON public.lms_school_memberships FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role::text IN ('admin', 'pastor', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_schools s
      WHERE s.id = lms_school_memberships.school_id
        AND s.leader_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_lms_school_staff(lms_school_memberships.school_id, ARRAY['teacher', 'coordinator']))
  );

DROP POLICY IF EXISTS "School memberships managed by school authorities" ON public.lms_school_memberships;
CREATE POLICY "School memberships managed by school authorities"
  ON public.lms_school_memberships FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role::text IN ('admin', 'pastor', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_schools s
      WHERE s.id = lms_school_memberships.school_id
        AND s.leader_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_lms_school_staff(lms_school_memberships.school_id, ARRAY['coordinator']))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role::text IN ('admin', 'pastor', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_schools s
      WHERE s.id = lms_school_memberships.school_id
        AND s.leader_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_lms_school_staff(lms_school_memberships.school_id, ARRAY['coordinator']))
  );

DROP POLICY IF EXISTS "Users view own school requests" ON public.lms_school_access_requests;
CREATE POLICY "Users view own school requests"
  ON public.lms_school_access_requests FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role::text IN ('admin', 'pastor', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_schools s
      WHERE s.id = lms_school_access_requests.school_id
        AND s.leader_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_lms_school_staff(lms_school_access_requests.school_id, ARRAY['coordinator']))
  );

DROP POLICY IF EXISTS "Users request school access" ON public.lms_school_access_requests;
CREATE POLICY "Users request school access"
  ON public.lms_school_access_requests FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND requested_role IN ('student', 'teacher')
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Users cancel own pending school requests" ON public.lms_school_access_requests;
CREATE POLICY "Users cancel own pending school requests"
  ON public.lms_school_access_requests FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND status = 'pending')
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'cancelled');

CREATE OR REPLACE FUNCTION public.process_lms_school_access_request(
  p_request_id uuid,
  p_approve boolean,
  p_decision_note text DEFAULT NULL
)
RETURNS public.lms_school_access_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.lms_school_access_requests;
  v_authorized boolean;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT request.* INTO v_request
  FROM public.lms_school_access_requests request
  WHERE request.id = p_request_id
  FOR UPDATE;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'School access request not found';
  END IF;
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'School access request has already been processed';
  END IF;

  SELECT (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role::text IN ('admin', 'pastor', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_schools s
      WHERE s.id = v_request.school_id
        AND s.leader_id = (SELECT auth.uid())
    )
    OR (SELECT private.is_lms_school_staff(v_request.school_id, ARRAY['coordinator']))
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'You are not authorized to process this school request';
  END IF;

  IF p_approve THEN
    INSERT INTO public.lms_school_memberships (
      school_id, user_id, role, status, level_id, approved_by
    ) VALUES (
      v_request.school_id,
      v_request.user_id,
      v_request.requested_role,
      'active',
      v_request.requested_level_id,
      (SELECT auth.uid())
    )
    ON CONFLICT (school_id, user_id, role) DO UPDATE SET
      status = 'active',
      level_id = COALESCE(EXCLUDED.level_id, public.lms_school_memberships.level_id),
      approved_by = EXCLUDED.approved_by,
      updated_at = now();
  END IF;

  UPDATE public.lms_school_access_requests request
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      decision_note = NULLIF(BTRIM(p_decision_note), ''),
      reviewed_by = (SELECT auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  WHERE request.id = p_request_id
  RETURNING request.* INTO v_request;

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.process_lms_school_access_request(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_lms_school_access_request(uuid, boolean, text) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.lms_school_access_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lms_school_memberships TO authenticated;

-- Finaliza un cuestionario y califica en el servidor las preguntas objetivas.
-- Las preguntas de desarrollo quedan pendientes para revision del docente.
CREATE OR REPLACE FUNCTION public.submit_lms_quiz_attempt(p_attempt_id uuid)
RETURNS public.lms_quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempt public.lms_quiz_attempts;
  v_has_essay boolean;
  v_score numeric(5,2);
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_attempt
  FROM public.lms_quiz_attempts attempt
  WHERE attempt.id = p_attempt_id
  FOR UPDATE;

  IF NOT FOUND OR v_attempt.student_id <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Quiz attempt not found';
  END IF;

  IF v_attempt.status <> 'in_progress' THEN
    RETURN v_attempt;
  END IF;

  UPDATE public.lms_quiz_answers answer
  SET is_correct = CASE
        WHEN question.type IN ('multiple_choice', 'true_false')
          THEN answer.answer_data = question.correct_answer
        ELSE NULL
      END,
      points_awarded = CASE
        WHEN question.type IN ('multiple_choice', 'true_false')
          AND answer.answer_data = question.correct_answer
          THEN question.points
        ELSE 0
      END,
      updated_at = now()
  FROM public.lms_questions question
  JOIN public.lms_quiz_questions quiz_question ON quiz_question.question_id = question.id
  WHERE answer.attempt_id = p_attempt_id
    AND quiz_question.lesson_id = v_attempt.lesson_id
    AND answer.question_id = question.id;

  SELECT EXISTS (
    SELECT 1
    FROM public.lms_quiz_questions quiz_question
    JOIN public.lms_questions question ON question.id = quiz_question.question_id
    WHERE quiz_question.lesson_id = v_attempt.lesson_id
      AND question.type = 'essay'
  ) INTO v_has_essay;

  SELECT COALESCE(SUM(answer.points_awarded), 0)
  INTO v_score
  FROM public.lms_quiz_answers answer
  WHERE answer.attempt_id = p_attempt_id;

  UPDATE public.lms_quiz_attempts attempt
  SET status = CASE WHEN v_has_essay THEN 'completed' ELSE 'graded' END,
      score = v_score,
      completed_at = now()
  WHERE attempt.id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lms_quiz_attempt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_lms_quiz_attempt(uuid) TO authenticated;

-- Punto unico de autorizacion para las herramientas que pertenecen a un curso.
-- Se mantiene en el esquema privado para que las politicas no dependan de datos
-- enviados por el navegador ni de nombres globales de rol como "maestro".
CREATE OR REPLACE FUNCTION private.can_manage_lms_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles profile
        WHERE profile.id = (SELECT auth.uid())
          AND profile.role::text IN ('admin', 'pastor', 'editor')
      )
      OR EXISTS (
        SELECT 1
        FROM public.lms_course_teachers teacher
        WHERE teacher.course_id = p_course_id
          AND teacher.user_id = (SELECT auth.uid())
      )
    );
$$;

REVOKE ALL ON FUNCTION private.can_manage_lms_course(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_manage_lms_course(uuid) TO authenticated;

-- Los docentes asignados pueden administrar únicamente sus cursos.
DROP POLICY IF EXISTS "Allow attendance manage" ON public.lms_attendance;
CREATE POLICY "Course authorities manage attendance"
  ON public.lms_attendance FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lms_class_sessions session
      JOIN public.lms_course_teachers teacher ON teacher.course_id = session.course_id
      WHERE session.id = lms_attendance.session_id
        AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lms_class_sessions session
      JOIN public.lms_course_teachers teacher ON teacher.course_id = session.course_id
      WHERE session.id = lms_attendance.session_id
        AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor')
    )
  );

DROP POLICY IF EXISTS "Allow class sessions manage" ON public.lms_class_sessions;
CREATE POLICY "Course authorities manage class sessions"
  ON public.lms_class_sessions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_course_teachers teacher
      WHERE teacher.course_id = lms_class_sessions.course_id
        AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lms_course_teachers teacher
      WHERE teacher.course_id = lms_class_sessions.course_id
        AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admin manage lms_modules" ON public.lms_modules;
CREATE POLICY "Course authorities manage modules"
  ON public.lms_modules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lms_subjects subject
      JOIN public.lms_course_teachers teacher ON teacher.course_id = subject.course_id
      WHERE subject.id = lms_modules.subject_id AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lms_subjects subject
      JOIN public.lms_course_teachers teacher ON teacher.course_id = subject.course_id
      WHERE subject.id = lms_modules.subject_id AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor'))
  );

DROP POLICY IF EXISTS "Admin manage lms_lessons" ON public.lms_lessons;
CREATE POLICY "Course authorities manage lessons"
  ON public.lms_lessons FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lms_modules module
      JOIN public.lms_subjects subject ON subject.id = module.subject_id
      JOIN public.lms_course_teachers teacher ON teacher.course_id = subject.course_id
      WHERE module.id = lms_lessons.module_id AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lms_modules module
      JOIN public.lms_subjects subject ON subject.id = module.subject_id
      JOIN public.lms_course_teachers teacher ON teacher.course_id = subject.course_id
      WHERE module.id = lms_lessons.module_id AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor'))
  );

CREATE POLICY "Course teachers grade lesson submissions"
  ON public.lms_lesson_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lms_lessons lesson
      JOIN public.lms_modules module ON module.id = lesson.module_id
      JOIN public.lms_subjects subject ON subject.id = module.subject_id
      JOIN public.lms_course_teachers teacher ON teacher.course_id = subject.course_id
      WHERE lesson.id = lms_lesson_submissions.lesson_id AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lms_lessons lesson
      JOIN public.lms_modules module ON module.id = lesson.module_id
      JOIN public.lms_subjects subject ON subject.id = module.subject_id
      JOIN public.lms_course_teachers teacher ON teacher.course_id = subject.course_id
      WHERE lesson.id = lms_lesson_submissions.lesson_id AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor'))
  );

CREATE POLICY "Course teachers create lesson grade overrides"
  ON public.lms_lesson_submissions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lms_lessons lesson
      JOIN public.lms_modules module ON module.id = lesson.module_id
      JOIN public.lms_subjects subject ON subject.id = module.subject_id
      JOIN public.lms_course_teachers teacher ON teacher.course_id = subject.course_id
      WHERE lesson.id = lms_lesson_submissions.lesson_id AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'pastor', 'editor'))
  );

DROP POLICY IF EXISTS "Allow announcements manage" ON public.lms_announcements;
CREATE POLICY "Course authorities manage announcements"
  ON public.lms_announcements FOR ALL TO authenticated
  USING ((SELECT private.can_manage_lms_course(lms_announcements.course_id)))
  WITH CHECK ((SELECT private.can_manage_lms_course(lms_announcements.course_id)));

DROP POLICY IF EXISTS "Allow tutoring manage" ON public.lms_tutoring_appointments;
CREATE POLICY "Course authorities manage tutoring"
  ON public.lms_tutoring_appointments FOR ALL TO authenticated
  USING ((SELECT private.can_manage_lms_course(lms_tutoring_appointments.course_id)))
  WITH CHECK ((SELECT private.can_manage_lms_course(lms_tutoring_appointments.course_id)));

DROP POLICY IF EXISTS "Allow integrations manage" ON public.lms_course_integrations;
CREATE POLICY "Course authorities manage integrations"
  ON public.lms_course_integrations FOR ALL TO authenticated
  USING ((SELECT private.can_manage_lms_course(lms_course_integrations.course_id)))
  WITH CHECK ((SELECT private.can_manage_lms_course(lms_course_integrations.course_id)));

DROP POLICY IF EXISTS "Allow student groups manage" ON public.lms_student_groups;
CREATE POLICY "Course authorities manage student groups"
  ON public.lms_student_groups FOR ALL TO authenticated
  USING ((SELECT private.can_manage_lms_course(lms_student_groups.course_id)))
  WITH CHECK ((SELECT private.can_manage_lms_course(lms_student_groups.course_id)));

DROP POLICY IF EXISTS "Allow group members manage" ON public.lms_group_members;
DROP POLICY IF EXISTS "Admin write group members" ON public.lms_group_members;
CREATE POLICY "Course authorities manage group members"
  ON public.lms_group_members FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_student_groups student_group
      WHERE student_group.id = lms_group_members.group_id
        AND (SELECT private.can_manage_lms_course(student_group.course_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lms_student_groups student_group
      WHERE student_group.id = lms_group_members.group_id
        AND (SELECT private.can_manage_lms_course(student_group.course_id))
    )
  );

DROP POLICY IF EXISTS "Teachers and admins can manage resources" ON public.lms_course_resources;
CREATE POLICY "Course authorities manage resources"
  ON public.lms_course_resources FOR ALL TO authenticated
  USING ((SELECT private.can_manage_lms_course(lms_course_resources.course_id)))
  WITH CHECK ((SELECT private.can_manage_lms_course(lms_course_resources.course_id)));

DROP POLICY IF EXISTS "Admin/Teacher write grades" ON public.lms_grades;
CREATE POLICY "Course authorities manage grades"
  ON public.lms_grades FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_enrollments enrollment
      WHERE enrollment.id = lms_grades.enrollment_id
        AND (SELECT private.can_manage_lms_course(enrollment.course_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lms_enrollments enrollment
      WHERE enrollment.id = lms_grades.enrollment_id
        AND (SELECT private.can_manage_lms_course(enrollment.course_id))
    )
  );

DROP POLICY IF EXISTS "Teachers and Admins can create forums" ON public.lms_forums;
CREATE POLICY "Course authorities manage forums"
  ON public.lms_forums FOR ALL TO authenticated
  USING ((SELECT private.can_manage_lms_course(lms_forums.course_id)))
  WITH CHECK ((SELECT private.can_manage_lms_course(lms_forums.course_id)));

-- Configuracion base editable. No elimina escuelas ni cursos existentes.
UPDATE public.lms_schools
SET school_type = 'age_based',
    settings = settings || '{"organization":"age_ranges","parallel_strategy":"dynamic","grading_period":"weekly"}'::jsonb
WHERE LOWER(name) = LOWER('Escuela Dominical');

UPDATE public.lms_schools
SET name = 'Escuela de Cadetes de Cristo',
    school_type = 'rank_based',
    settings = settings || '{"organization":"ranks","parallel_strategy":"dynamic","grading_period":"weekly","final_exam":"annual"}'::jsonb
WHERE slug = 'cadetes' OR LOWER(name) IN (LOWER('Escuela de Cadetes'), LOWER('Escuela de Cadetes de Cristo'));

DO $$
DECLARE
  v_sunday_school_id uuid;
  v_cadets_school_id uuid;
BEGIN
  SELECT id INTO v_sunday_school_id
  FROM public.lms_schools
  WHERE LOWER(name) = LOWER('Escuela Dominical')
  ORDER BY CASE WHEN slug = 'escuela-dominical' THEN 0 ELSE 1 END, created_at
  LIMIT 1;

  IF v_sunday_school_id IS NULL THEN
    INSERT INTO public.lms_schools (name, slug, description, color, is_active, sort_order, school_type, settings)
    VALUES (
      'Escuela Dominical', 'escuela-dominical',
      'Formacion biblica organizada por edades y paralelos editables.',
      '#C4930A', true, 1, 'age_based',
      '{"organization":"age_ranges","parallel_strategy":"dynamic","grading_period":"weekly"}'::jsonb
    ) RETURNING id INTO v_sunday_school_id;
  END IF;

  SELECT id INTO v_cadets_school_id
  FROM public.lms_schools
  WHERE slug = 'cadetes' OR LOWER(name) = LOWER('Escuela de Cadetes de Cristo')
  ORDER BY created_at
  LIMIT 1;

  IF v_cadets_school_id IS NULL THEN
    INSERT INTO public.lms_schools (name, slug, description, color, is_active, sort_order, school_type, settings)
    VALUES (
      'Escuela de Cadetes de Cristo', 'cadetes',
      'Formacion por rangos con seguimiento semanal y examen final anual.',
      '#4F46E5', true, 2, 'rank_based',
      '{"organization":"ranks","parallel_strategy":"dynamic","grading_period":"weekly","final_exam":"annual"}'::jsonb
    ) RETURNING id INTO v_cadets_school_id;
  END IF;

  INSERT INTO public.lms_levels (school_id, name, min_age, max_age, level_type, sort_order, description)
  SELECT v_sunday_school_id, seed.name, seed.min_age, seed.max_age, 'age_range', seed.sort_order, seed.description
  FROM (VALUES
    ('Parvulitos 1', 1::smallint, 3::smallint, 1, 'Ninos de 1 a 3 anos.'),
    ('Parvulitos 2', 4::smallint, 6::smallint, 2, 'Ninos de 4 a 6 anos.'),
    ('Infantes 1', 7::smallint, 10::smallint, 3, 'Ninos de 7 a 10 anos.'),
    ('Infantes 2', 11::smallint, 14::smallint, 4, 'Preadolescentes de 11 a 14 anos.'),
    ('Adolescentes', 15::smallint, 17::smallint, 5, 'Adolescentes de 15 a 17 anos.'),
    ('Jovenes', 18::smallint, 30::smallint, 6, 'Jovenes de 18 a 30 anos.'),
    ('Adultos', 30::smallint, 60::smallint, 7, 'Adultos de 30 a 60 anos.'),
    ('Adultos mayores', 61::smallint, NULL::smallint, 8, 'Personas mayores de 60 anos.')
  ) AS seed(name, min_age, max_age, sort_order, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lms_levels level
    WHERE level.school_id = v_sunday_school_id AND LOWER(level.name) = LOWER(seed.name)
  );

  INSERT INTO public.lms_levels (school_id, name, level_type, sort_order, description, metadata)
  SELECT v_cadets_school_id, seed.name, 'rank', seed.sort_order, seed.description, seed.metadata
  FROM (VALUES
    ('Guerreros', 1, 'Rango editable de formacion inicial.', '{"annual_final_exam":true}'::jsonb),
    ('Consagrados', 2, 'Rango editable de crecimiento y disciplina.', '{"annual_final_exam":true}'::jsonb),
    ('Vencedores', 3, 'Rango editable de madurez y servicio.', '{"annual_final_exam":true}'::jsonb)
  ) AS seed(name, sort_order, description, metadata)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lms_levels level
    WHERE level.school_id = v_cadets_school_id AND LOWER(level.name) = LOWER(seed.name)
  );
END $$;
