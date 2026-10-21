-- Restore the intended least-privilege rules for family links, prayer participation,
-- and LMS-only question content.
DROP POLICY IF EXISTS "Authenticated admin full family members" ON public.family_members;
CREATE POLICY "Authorized family member management"
  ON public.family_members
  FOR ALL
  TO authenticated
  USING (private.current_user_has_admin_permission('families', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('families', 'edit'));
REVOKE ALL PRIVILEGES ON TABLE public.family_members FROM anon;

DROP POLICY IF EXISTS "Cualquiera puede ver intercesores" ON public.petition_prayers;
REVOKE ALL PRIVILEGES ON TABLE public.petition_prayers FROM anon;

DROP POLICY IF EXISTS "Public can view quiz questions" ON public.lms_quiz_questions;
REVOKE SELECT ON TABLE public.lms_quiz_questions FROM anon;

DROP POLICY IF EXISTS "Public can view quizzes" ON public.lms_quizzes;
CREATE POLICY "Enrolled students can read course quizzes"
  ON public.lms_quizzes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lms_lessons AS lesson
      JOIN public.lms_modules AS module ON module.id = lesson.module_id
      JOIN public.lms_subjects AS subject ON subject.id = module.subject_id
      JOIN public.lms_enrollments AS enrollment ON enrollment.course_id = subject.course_id
      WHERE lesson.id = lms_quizzes.lesson_id
        AND enrollment.user_id = (SELECT auth.uid())
        AND enrollment.status = 'active'
    )
  );
REVOKE SELECT ON TABLE public.lms_quizzes FROM anon;

DROP POLICY IF EXISTS "Consolidated read access lms" ON public.lms_user_badges;
CREATE POLICY "Users can read their own LMS badges"
  ON public.lms_user_badges
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role IN ('admin', 'editor', 'pastor')
    )
  );
REVOKE SELECT ON TABLE public.lms_user_badges FROM anon;

-- Keep role checks statement-scoped in the remaining policies.
DO $migration$
DECLARE
  policy_row record;
  using_expression text;
  check_expression text;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND position('auth.role()' IN qual) > 0
          AND position('SELECT auth.role()' IN qual) = 0)
        OR
        (with_check IS NOT NULL AND position('auth.role()' IN with_check) > 0
          AND position('SELECT auth.role()' IN with_check) = 0)
      )
  LOOP
    using_expression := CASE
      WHEN policy_row.qual IS NULL THEN NULL
      ELSE replace(policy_row.qual, 'auth.role()', '(SELECT auth.role())')
    END;
    check_expression := CASE
      WHEN policy_row.with_check IS NULL THEN NULL
      ELSE replace(policy_row.with_check, 'auth.role()', '(SELECT auth.role())')
    END;

    EXECUTE format(
      'ALTER POLICY %I ON %I.%I%s%s',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename,
      CASE WHEN using_expression IS NULL THEN '' ELSE format(' USING (%s)', using_expression) END,
      CASE WHEN check_expression IS NULL THEN '' ELSE format(' WITH CHECK (%s)', check_expression) END
    );
  END LOOP;
END;
$migration$;
