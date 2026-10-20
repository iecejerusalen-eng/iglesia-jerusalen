-- Keep public catalog reads independent from private admin-check functions.
-- The old PUBLIC policies mixed anonymous predicates with can_view_* calls;
-- Postgres may evaluate those calls for anon and abort the whole SELECT.
-- Public policies expose only the same published/active rows as before.

BEGIN;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_programs;
CREATE POLICY "Public read published study programs"
  ON public.study_programs FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Authorized users read all study programs"
  ON public.study_programs FOR SELECT TO authenticated
  USING ((SELECT private.can_view_study_program_admin()));

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_program_sections;
CREATE POLICY "Public read published study sections"
  ON public.study_program_sections FOR SELECT TO anon, authenticated
  USING (
    is_published
    AND EXISTS (
      SELECT 1 FROM public.study_programs program
      WHERE program.id = study_program_sections.program_id
        AND program.status = 'published'
    )
  );
CREATE POLICY "Authorized users read all study sections"
  ON public.study_program_sections FOR SELECT TO authenticated
  USING ((SELECT private.can_view_study_program_admin()));

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_program_lessons;
CREATE POLICY "Public read published study lessons"
  ON public.study_program_lessons FOR SELECT TO anon, authenticated
  USING (
    is_published
    AND EXISTS (
      SELECT 1
      FROM public.study_program_sections section
      JOIN public.study_programs program ON program.id = section.program_id
      WHERE section.id = study_program_lessons.section_id
        AND section.is_published
        AND program.status = 'published'
        AND (program.access_type = 'public' OR study_program_lessons.is_preview)
    )
  );
CREATE POLICY "Members and authorized users read study lessons"
  ON public.study_program_lessons FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_program_sections section
      JOIN public.study_memberships membership ON membership.program_id = section.program_id
      WHERE section.id = study_program_lessons.section_id
        AND membership.user_id = (SELECT auth.uid())
        AND membership.status = 'active'
    )
    OR (SELECT private.can_view_study_program_admin())
  );

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_cohorts;
CREATE POLICY "Public read open published study cohorts"
  ON public.study_cohorts FOR SELECT TO anon, authenticated
  USING (
    status IN ('open', 'active')
    AND EXISTS (
      SELECT 1 FROM public.study_programs program
      WHERE program.id = study_cohorts.program_id
        AND program.status = 'published'
    )
  );
CREATE POLICY "Authorized users read all study cohorts"
  ON public.study_cohorts FOR SELECT TO authenticated
  USING ((SELECT private.can_view_study_program_admin()));

COMMIT;
