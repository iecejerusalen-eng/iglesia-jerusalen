-- School-first public catalog, atomic course enrollment and course-content isolation.

ALTER TABLE public.lms_enrollment_requests
  ADD COLUMN IF NOT EXISTS decision_note text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS lms_enrollments_user_status_course_idx
  ON public.lms_enrollments (user_id, status, course_id);
CREATE INDEX IF NOT EXISTS lms_enrollment_requests_user_status_idx
  ON public.lms_enrollment_requests (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS lms_courses_public_school_level_idx
  ON public.lms_courses (school_id, level_id, created_at DESC)
  WHERE is_published = true;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.can_access_lms_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role::text IN ('admin', 'pastor', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_course_teachers teacher
      WHERE teacher.course_id = p_course_id
        AND teacher.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_enrollments enrollment
      WHERE enrollment.course_id = p_course_id
        AND enrollment.user_id = (SELECT auth.uid())
        AND COALESCE(enrollment.status, 'active') = 'active'
    )
  );
$$;

REVOKE ALL ON FUNCTION private.can_access_lms_course(uuid) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_lms_course(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_lms_course_enrollment(
  p_course_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS public.lms_enrollment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_request public.lms_enrollment_requests;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 500 THEN
    RAISE EXCEPTION 'Enrollment request notes cannot exceed 500 characters';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.lms_courses course
    JOIN public.lms_schools school ON school.id = course.school_id
    WHERE course.id = p_course_id
      AND course.is_published = true
      AND school.is_active = true
  ) THEN
    RAISE EXCEPTION 'Published course not found';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.lms_enrollments enrollment
    WHERE enrollment.course_id = p_course_id
      AND enrollment.user_id = v_user_id
      AND COALESCE(enrollment.status, 'active') = 'active'
  ) THEN
    RAISE EXCEPTION 'You are already enrolled in this course';
  END IF;

  INSERT INTO public.lms_enrollment_requests (course_id, user_id, status, notes)
  VALUES (p_course_id, v_user_id, 'pending', NULLIF(trim(p_notes), ''))
  ON CONFLICT (course_id, user_id) DO UPDATE SET
    status = CASE
      WHEN public.lms_enrollment_requests.status = 'rejected' THEN 'pending'
      ELSE public.lms_enrollment_requests.status
    END,
    notes = CASE
      WHEN public.lms_enrollment_requests.status = 'rejected' THEN EXCLUDED.notes
      ELSE COALESCE(EXCLUDED.notes, public.lms_enrollment_requests.notes)
    END,
    decision_note = CASE
      WHEN public.lms_enrollment_requests.status = 'rejected' THEN NULL
      ELSE public.lms_enrollment_requests.decision_note
    END,
    reviewed_by = CASE
      WHEN public.lms_enrollment_requests.status = 'rejected' THEN NULL
      ELSE public.lms_enrollment_requests.reviewed_by
    END,
    reviewed_at = CASE
      WHEN public.lms_enrollment_requests.status = 'rejected' THEN NULL
      ELSE public.lms_enrollment_requests.reviewed_at
    END,
    created_at = CASE
      WHEN public.lms_enrollment_requests.status = 'rejected' THEN now()
      ELSE public.lms_enrollment_requests.created_at
    END
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.request_lms_course_enrollment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_lms_course_enrollment(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_lms_course_enrollment_request(
  p_request_id uuid,
  p_approve boolean,
  p_decision_note text DEFAULT NULL
)
RETURNS public.lms_enrollment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reviewer_id uuid := (SELECT auth.uid());
  v_request public.lms_enrollment_requests;
  v_school_id uuid;
  v_authorized boolean;
BEGIN
  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_decision_note IS NOT NULL AND length(p_decision_note) > 500 THEN
    RAISE EXCEPTION 'Decision notes cannot exceed 500 characters';
  END IF;

  SELECT request.* INTO v_request
  FROM public.lms_enrollment_requests request
  WHERE request.id = p_request_id
  FOR UPDATE;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment request not found';
  END IF;
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Enrollment request has already been processed';
  END IF;

  SELECT (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = v_reviewer_id
        AND profile.role::text IN ('admin', 'pastor', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM public.lms_course_teachers teacher
      WHERE teacher.course_id = v_request.course_id
        AND teacher.user_id = v_reviewer_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.lms_courses course
      JOIN public.lms_schools school ON school.id = course.school_id
      WHERE course.id = v_request.course_id
        AND school.leader_id = v_reviewer_id
    )
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'You are not authorized to process this enrollment request';
  END IF;

  IF p_approve THEN
    INSERT INTO public.lms_enrollments (course_id, user_id, role, status, enrolled_at)
    VALUES (v_request.course_id, v_request.user_id, 'student', 'active', now())
    ON CONFLICT (course_id, user_id) DO UPDATE SET
      status = 'active',
      role = CASE
        WHEN public.lms_enrollments.role = 'teacher' THEN public.lms_enrollments.role
        ELSE 'student'
      END,
      enrolled_at = now();

    SELECT course.school_id INTO v_school_id
    FROM public.lms_courses course
    WHERE course.id = v_request.course_id;

    IF v_school_id IS NOT NULL THEN
      INSERT INTO public.lms_school_memberships (school_id, user_id, role, status, approved_by, joined_at)
      VALUES (v_school_id, v_request.user_id, 'student', 'active', v_reviewer_id, now())
      ON CONFLICT (school_id, user_id, role) DO UPDATE SET
        status = 'active',
        approved_by = EXCLUDED.approved_by,
        joined_at = COALESCE(public.lms_school_memberships.joined_at, EXCLUDED.joined_at),
        updated_at = now();
    END IF;
  END IF;

  UPDATE public.lms_enrollment_requests request
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      decision_note = NULLIF(trim(p_decision_note), ''),
      reviewed_by = v_reviewer_id,
      reviewed_at = now()
  WHERE request.id = p_request_id
  RETURNING request.* INTO v_request;

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.process_lms_course_enrollment_request(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_lms_course_enrollment_request(uuid, boolean, text) TO authenticated;

-- The school catalog is public, but inactive schools remain private to managers.
DROP POLICY IF EXISTS "Authenticated users can view active schools" ON public.lms_schools;
CREATE POLICY "Public views active LMS schools"
  ON public.lms_schools FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authorities view all LMS schools"
  ON public.lms_schools FOR SELECT TO authenticated
  USING (
    leader_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role::text IN ('admin', 'pastor', 'editor')
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view levels" ON public.lms_levels;
CREATE POLICY "Public views levels of active LMS schools"
  ON public.lms_levels FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_schools school
      WHERE school.id = lms_levels.school_id AND school.is_active = true
    )
  );

CREATE POLICY "School authorities view all LMS levels"
  ON public.lms_levels FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_schools school
      WHERE school.id = lms_levels.school_id
        AND (
          school.leader_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.profiles profile
            WHERE profile.id = (SELECT auth.uid())
              AND profile.role::text IN ('admin', 'pastor', 'editor')
          )
        )
    )
  );

-- Published course metadata is public; unpublished courses require an assignment.
DROP POLICY IF EXISTS "Authenticated users can view all courses" ON public.lms_courses;
CREATE POLICY "Course participants view assigned unpublished courses"
  ON public.lms_courses FOR SELECT TO authenticated
  USING ((SELECT private.can_access_lms_course(lms_courses.id)));

-- A student can inspect only their own request status.
DROP POLICY IF EXISTS "Users view own course enrollment requests" ON public.lms_enrollment_requests;
CREATE POLICY "Users view own course enrollment requests"
  ON public.lms_enrollment_requests FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Course content requires an active enrollment, course assignment or global academic authority.
DROP POLICY IF EXISTS "Authenticated users can view sections" ON public.lms_sections;
CREATE POLICY "Course participants view sections"
  ON public.lms_sections FOR SELECT TO authenticated
  USING ((SELECT private.can_access_lms_course(lms_sections.course_id)));

DROP POLICY IF EXISTS "Authenticated users can view activities" ON public.lms_activities;
CREATE POLICY "Course participants view activities"
  ON public.lms_activities FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_sections section
      WHERE section.id = lms_activities.section_id
        AND (SELECT private.can_access_lms_course(section.course_id))
    )
  );

DROP POLICY IF EXISTS "Public read lms_subjects" ON public.lms_subjects;
CREATE POLICY "Course participants view subjects"
  ON public.lms_subjects FOR SELECT TO authenticated
  USING ((SELECT private.can_access_lms_course(lms_subjects.course_id)));

DROP POLICY IF EXISTS "Public read lms_modules" ON public.lms_modules;
CREATE POLICY "Course participants view modules"
  ON public.lms_modules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_subjects subject
      WHERE subject.id = lms_modules.subject_id
        AND (SELECT private.can_access_lms_course(subject.course_id))
    )
  );

DROP POLICY IF EXISTS "Public read lms_lessons" ON public.lms_lessons;
CREATE POLICY "Course participants view lessons"
  ON public.lms_lessons FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lms_modules module
      JOIN public.lms_subjects subject ON subject.id = module.subject_id
      WHERE module.id = lms_lessons.module_id
        AND (SELECT private.can_access_lms_course(subject.course_id))
    )
  );

DROP POLICY IF EXISTS "Read lesson forum posts" ON public.lms_lesson_forum_posts;
CREATE POLICY "Course participants view lesson forum posts"
  ON public.lms_lesson_forum_posts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lms_lessons lesson
      JOIN public.lms_modules module ON module.id = lesson.module_id
      JOIN public.lms_subjects subject ON subject.id = module.subject_id
      WHERE lesson.id = lms_lesson_forum_posts.lesson_id
        AND (SELECT private.can_access_lms_course(subject.course_id))
    )
  );

DROP POLICY IF EXISTS "Allow announcements view" ON public.lms_announcements;
CREATE POLICY "Course participants view announcements"
  ON public.lms_announcements FOR SELECT TO authenticated
  USING ((SELECT private.can_access_lms_course(lms_announcements.course_id)));

DROP POLICY IF EXISTS "Allow class sessions view" ON public.lms_class_sessions;
CREATE POLICY "Course participants view class sessions"
  ON public.lms_class_sessions FOR SELECT TO authenticated
  USING ((SELECT private.can_access_lms_course(lms_class_sessions.course_id)));

DROP POLICY IF EXISTS "Allow student groups view" ON public.lms_student_groups;
CREATE POLICY "Course participants view student groups"
  ON public.lms_student_groups FOR SELECT TO authenticated
  USING ((SELECT private.can_access_lms_course(lms_student_groups.course_id)));

DROP POLICY IF EXISTS "Allow group members view" ON public.lms_group_members;
CREATE POLICY "Course participants view group members"
  ON public.lms_group_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_student_groups student_group
      WHERE student_group.id = lms_group_members.group_id
        AND (SELECT private.can_access_lms_course(student_group.course_id))
    )
  );

DROP POLICY IF EXISTS "Allow attendance view" ON public.lms_attendance;
CREATE POLICY "Students view own attendance and authorities view course attendance"
  ON public.lms_attendance FOR SELECT TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.lms_class_sessions session
      WHERE session.id = lms_attendance.session_id
        AND (SELECT private.can_manage_lms_course(session.course_id))
    )
  );

DROP POLICY IF EXISTS "Allow integrations view" ON public.lms_course_integrations;
CREATE POLICY "Course authorities view integrations"
  ON public.lms_course_integrations FOR SELECT TO authenticated
  USING ((SELECT private.can_manage_lms_course(lms_course_integrations.course_id)));

-- Keep canonical public ordering while preserving all additional schools.
UPDATE public.lms_schools SET sort_order = 1
WHERE slug IN ('dominical', 'escuela-dominical') OR LOWER(name) = LOWER('Escuela Dominical');
UPDATE public.lms_schools SET sort_order = 2
WHERE slug = 'cadetes' OR LOWER(name) IN (LOWER('Escuela de Cadetes'), LOWER('Escuela de Cadetes de Cristo'));

-- Explicit Data API privileges for projects where automatic table exposure is disabled.
GRANT SELECT ON public.lms_schools, public.lms_levels, public.lms_courses, public.lms_landing_content TO anon, authenticated;
GRANT SELECT ON public.lms_enrollments, public.lms_enrollment_requests TO authenticated;
GRANT SELECT ON public.lms_sections, public.lms_activities, public.lms_subjects,
  public.lms_modules, public.lms_lessons, public.lms_lesson_forum_posts,
  public.lms_announcements, public.lms_class_sessions, public.lms_student_groups,
  public.lms_group_members, public.lms_attendance, public.lms_course_integrations TO authenticated;

NOTIFY pgrst, 'reload schema';
