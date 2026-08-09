-- 20260809170000_consolidate_rls_policies.sql
-- Optimización de rendimiento: Consolidación de políticas permisivas (multiple_permissive_policies)

-- ==========================================
-- 1. study_programs
-- ==========================================
DROP POLICY IF EXISTS "Published study programs are public" ON public.study_programs;
DROP POLICY IF EXISTS "Managers read all study programs" ON public.study_programs;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_programs;
CREATE POLICY "Consolidated read access" ON public.study_programs FOR SELECT USING (
  status = 'published' OR 
  (auth.role() = 'authenticated' AND (SELECT private.can_view_study_program_admin()))
);

-- ==========================================
-- 2. study_program_sections
-- ==========================================
DROP POLICY IF EXISTS "Published study sections are public" ON public.study_program_sections;
DROP POLICY IF EXISTS "Program viewers read all study sections" ON public.study_program_sections;
DROP POLICY IF EXISTS "Managers manage study sections" ON public.study_program_sections;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_program_sections;
CREATE POLICY "Consolidated read access" ON public.study_program_sections FOR SELECT USING (
  (is_published AND EXISTS (SELECT 1 FROM public.study_programs p WHERE p.id = program_id AND p.status = 'published')) OR 
  (auth.role() = 'authenticated' AND (SELECT private.can_view_study_program_admin()))
);
DROP POLICY IF EXISTS "Managers manage study sections insert" ON public.study_program_sections;
CREATE POLICY "Managers manage study sections insert" ON public.study_program_sections FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage study sections update" ON public.study_program_sections;
CREATE POLICY "Managers manage study sections update" ON public.study_program_sections FOR UPDATE TO authenticated USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage study sections delete" ON public.study_program_sections;
CREATE POLICY "Managers manage study sections delete" ON public.study_program_sections FOR DELETE TO authenticated USING ((SELECT private.can_manage_study_programs()));

-- ==========================================
-- 3. study_program_lessons
-- ==========================================
DROP POLICY IF EXISTS "Published study lessons are public" ON public.study_program_lessons;
DROP POLICY IF EXISTS "Active participants read study lessons" ON public.study_program_lessons;
DROP POLICY IF EXISTS "Program viewers read all study lessons" ON public.study_program_lessons;
DROP POLICY IF EXISTS "Managers manage study lessons" ON public.study_program_lessons;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_program_lessons;
CREATE POLICY "Consolidated read access" ON public.study_program_lessons FOR SELECT USING (
  (is_published AND EXISTS (
    SELECT 1 FROM public.study_program_sections section
    JOIN public.study_programs program ON program.id = section.program_id
    WHERE section.id = study_program_lessons.section_id AND section.is_published AND program.status = 'published'
      AND (program.access_type = 'public' OR study_program_lessons.is_preview)
  )) OR 
  (auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM public.study_program_sections section
      JOIN public.study_memberships membership ON membership.program_id = section.program_id
      WHERE section.id = study_program_lessons.section_id
        AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
    ) OR 
    (SELECT private.can_view_study_program_admin())
  ))
);
DROP POLICY IF EXISTS "Managers manage study lessons insert" ON public.study_program_lessons;
CREATE POLICY "Managers manage study lessons insert" ON public.study_program_lessons FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage study lessons update" ON public.study_program_lessons;
CREATE POLICY "Managers manage study lessons update" ON public.study_program_lessons FOR UPDATE TO authenticated USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage study lessons delete" ON public.study_program_lessons;
CREATE POLICY "Managers manage study lessons delete" ON public.study_program_lessons FOR DELETE TO authenticated USING ((SELECT private.can_manage_study_programs()));

-- ==========================================
-- 4. study_lesson_facilitator_content
-- ==========================================
DROP POLICY IF EXISTS "Facilitators read private lesson content" ON public.study_lesson_facilitator_content;
DROP POLICY IF EXISTS "Managers manage private lesson content" ON public.study_lesson_facilitator_content;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_lesson_facilitator_content;
CREATE POLICY "Consolidated read access" ON public.study_lesson_facilitator_content FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.study_program_lessons lesson
    JOIN public.study_program_sections section ON section.id = lesson.section_id
    WHERE lesson.id = study_lesson_facilitator_content.lesson_id AND (SELECT private.can_facilitate_study_program(section.program_id))
  ) OR 
  (SELECT private.can_manage_study_programs())
);
DROP POLICY IF EXISTS "Managers manage private lesson content insert" ON public.study_lesson_facilitator_content;
CREATE POLICY "Managers manage private lesson content insert" ON public.study_lesson_facilitator_content FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage private lesson content update" ON public.study_lesson_facilitator_content;
CREATE POLICY "Managers manage private lesson content update" ON public.study_lesson_facilitator_content FOR UPDATE TO authenticated USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage private lesson content delete" ON public.study_lesson_facilitator_content;
CREATE POLICY "Managers manage private lesson content delete" ON public.study_lesson_facilitator_content FOR DELETE TO authenticated USING ((SELECT private.can_manage_study_programs()));

-- ==========================================
-- 5. study_memberships
-- ==========================================
DROP POLICY IF EXISTS "Users read own memberships" ON public.study_memberships;
DROP POLICY IF EXISTS "Managers manage memberships" ON public.study_memberships;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_memberships;
CREATE POLICY "Consolidated read access" ON public.study_memberships FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid()) OR 
  (SELECT private.can_facilitate_study_program(program_id)) OR 
  (SELECT private.can_manage_study_programs())
);
DROP POLICY IF EXISTS "Managers manage memberships update" ON public.study_memberships;
CREATE POLICY "Managers manage memberships update" ON public.study_memberships FOR UPDATE TO authenticated USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage memberships delete" ON public.study_memberships;
CREATE POLICY "Managers manage memberships delete" ON public.study_memberships FOR DELETE TO authenticated USING ((SELECT private.can_manage_study_programs()));

DROP POLICY IF EXISTS "Users request eligible programs" ON public.study_memberships;
DROP POLICY IF EXISTS "Consolidated insert access" ON public.study_memberships;
CREATE POLICY "Consolidated insert access" ON public.study_memberships FOR INSERT TO authenticated WITH CHECK (
  (SELECT private.can_manage_study_programs()) OR
  (
    user_id = (SELECT auth.uid()) AND member_role = 'participant'
    AND EXISTS (
      SELECT 1 FROM public.study_programs p
      WHERE p.id = study_memberships.program_id AND p.status = 'published' AND p.access_type <> 'invitation'
        AND ((p.access_type IN ('public', 'account') AND study_memberships.status = 'active') OR (p.access_type = 'approval' AND study_memberships.status = 'pending'))
    )
    AND (study_memberships.cohort_id IS NULL OR (SELECT private.cohort_accepts_member(study_memberships.cohort_id, study_memberships.program_id)))
  )
);

-- ==========================================
-- 6. study_progress
-- ==========================================
DROP POLICY IF EXISTS "Users manage own study progress" ON public.study_progress;
DROP POLICY IF EXISTS "Facilitators read participant progress" ON public.study_progress;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_progress;
CREATE POLICY "Consolidated read access" ON public.study_progress FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.study_program_lessons lesson
    JOIN public.study_program_sections section ON section.id = lesson.section_id
    WHERE lesson.id = study_progress.lesson_id AND (SELECT private.can_facilitate_study_program(section.program_id))
  )
);
DROP POLICY IF EXISTS "Users manage own study progress insert" ON public.study_progress;
CREATE POLICY "Users manage own study progress insert" ON public.study_progress FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users manage own study progress update" ON public.study_progress;
CREATE POLICY "Users manage own study progress update" ON public.study_progress FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users manage own study progress delete" ON public.study_progress;
CREATE POLICY "Users manage own study progress delete" ON public.study_progress FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ==========================================
-- 7. study_resources
-- ==========================================
DROP POLICY IF EXISTS "Public study resources are visible" ON public.study_resources;
DROP POLICY IF EXISTS "Members read participant resources" ON public.study_resources;
DROP POLICY IF EXISTS "Facilitators read facilitator resources" ON public.study_resources;
DROP POLICY IF EXISTS "Managers manage study resources" ON public.study_resources;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_resources;
CREATE POLICY "Consolidated read access" ON public.study_resources FOR SELECT USING (
  (visibility = 'public' AND EXISTS (SELECT 1 FROM public.study_programs p WHERE p.id = program_id AND p.status = 'published')) OR
  (auth.role() = 'authenticated' AND (
    (visibility = 'participant' AND EXISTS (
      SELECT 1 FROM public.study_memberships membership
      WHERE membership.program_id = study_resources.program_id AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
    )) OR
    (visibility = 'facilitator' AND (SELECT private.can_facilitate_study_program(study_resources.program_id))) OR
    (SELECT private.can_manage_study_programs())
  ))
);
DROP POLICY IF EXISTS "Managers manage study resources insert" ON public.study_resources;
CREATE POLICY "Managers manage study resources insert" ON public.study_resources FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage study resources update" ON public.study_resources;
CREATE POLICY "Managers manage study resources update" ON public.study_resources FOR UPDATE TO authenticated USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage study resources delete" ON public.study_resources;
CREATE POLICY "Managers manage study resources delete" ON public.study_resources FOR DELETE TO authenticated USING ((SELECT private.can_manage_study_programs()));

-- ==========================================
-- 8. study_sessions
-- ==========================================
DROP POLICY IF EXISTS "Cohort members read sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Facilitators manage sessions" ON public.study_sessions;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_sessions;
CREATE POLICY "Consolidated read access" ON public.study_sessions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.study_memberships membership
    WHERE membership.cohort_id = study_sessions.cohort_id AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
  ) OR 
  (SELECT private.can_manage_study_programs()) OR
  EXISTS (SELECT 1 FROM public.study_cohorts cohort WHERE cohort.id = study_sessions.cohort_id AND (SELECT private.can_facilitate_study_program(cohort.program_id)))
);
DROP POLICY IF EXISTS "Facilitators manage sessions insert" ON public.study_sessions;
CREATE POLICY "Facilitators manage sessions insert" ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.study_cohorts cohort WHERE cohort.id = study_sessions.cohort_id AND (SELECT private.can_facilitate_study_program(cohort.program_id))));
DROP POLICY IF EXISTS "Facilitators manage sessions update" ON public.study_sessions;
CREATE POLICY "Facilitators manage sessions update" ON public.study_sessions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.study_cohorts cohort WHERE cohort.id = study_sessions.cohort_id AND (SELECT private.can_facilitate_study_program(cohort.program_id)))) WITH CHECK (EXISTS (SELECT 1 FROM public.study_cohorts cohort WHERE cohort.id = study_sessions.cohort_id AND (SELECT private.can_facilitate_study_program(cohort.program_id))));
DROP POLICY IF EXISTS "Facilitators manage sessions delete" ON public.study_sessions;
CREATE POLICY "Facilitators manage sessions delete" ON public.study_sessions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.study_cohorts cohort WHERE cohort.id = study_sessions.cohort_id AND (SELECT private.can_facilitate_study_program(cohort.program_id))));

-- ==========================================
-- 9. system_plugins
-- ==========================================
DROP POLICY IF EXISTS "Allow public read for plugins" ON public.system_plugins;
DROP POLICY IF EXISTS "Allow admin manage for plugins" ON public.system_plugins;

DROP POLICY IF EXISTS "Consolidated read access" ON public.system_plugins;
CREATE POLICY "Consolidated read access" ON public.system_plugins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin manage for plugins insert" ON public.system_plugins;
CREATE POLICY "Allow admin manage for plugins insert" ON public.system_plugins FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow admin manage for plugins update" ON public.system_plugins;
CREATE POLICY "Allow admin manage for plugins update" ON public.system_plugins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow admin manage for plugins delete" ON public.system_plugins;
CREATE POLICY "Allow admin manage for plugins delete" ON public.system_plugins FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 10. user_badges
-- ==========================================
DROP POLICY IF EXISTS "Lectura de propias insignias" ON public.user_badges;
DROP POLICY IF EXISTS "Lectura pública de insignias de otros" ON public.user_badges;

DROP POLICY IF EXISTS "Consolidated read access" ON public.user_badges;
CREATE POLICY "Consolidated read access" ON public.user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users read own badges" ON public.lms_user_badges;
DROP POLICY IF EXISTS "Consolidated read access lms" ON public.lms_user_badges;
CREATE POLICY "Consolidated read access lms" ON public.lms_user_badges FOR SELECT USING (true);

-- ==========================================
-- 11. user_reading_progress
-- ==========================================
DROP POLICY IF EXISTS "Lectura de propio progreso" ON public.user_reading_progress;
DROP POLICY IF EXISTS "Lectura de progreso global por todos" ON public.user_reading_progress;
DROP POLICY IF EXISTS "Modificación de propio progreso" ON public.user_reading_progress;

DROP POLICY IF EXISTS "Consolidated read access" ON public.user_reading_progress;
CREATE POLICY "Consolidated read access" ON public.user_reading_progress FOR SELECT USING (true);
DROP POLICY IF EXISTS "Modificación de propio progreso insert" ON public.user_reading_progress;
CREATE POLICY "Modificación de propio progreso insert" ON public.user_reading_progress FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Modificación de propio progreso update" ON public.user_reading_progress;
CREATE POLICY "Modificación de propio progreso update" ON public.user_reading_progress FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Modificación de propio progreso delete" ON public.user_reading_progress;
CREATE POLICY "Modificación de propio progreso delete" ON public.user_reading_progress FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- ==========================================
-- 12. volunteer_assignments
-- ==========================================
DROP POLICY IF EXISTS "assignments_public_read" ON public.volunteer_assignments;
DROP POLICY IF EXISTS "assignments_admin_all" ON public.volunteer_assignments;

DROP POLICY IF EXISTS "Consolidated read access" ON public.volunteer_assignments;
CREATE POLICY "Consolidated read access" ON public.volunteer_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "assignments_admin_insert" ON public.volunteer_assignments;
CREATE POLICY "assignments_admin_insert" ON public.volunteer_assignments FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "assignments_admin_update" ON public.volunteer_assignments;
CREATE POLICY "assignments_admin_update" ON public.volunteer_assignments FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "assignments_admin_delete" ON public.volunteer_assignments;
CREATE POLICY "assignments_admin_delete" ON public.volunteer_assignments FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 13. volunteer_shifts
-- ==========================================
DROP POLICY IF EXISTS "shifts_public_read" ON public.volunteer_shifts;
DROP POLICY IF EXISTS "shifts_admin_all" ON public.volunteer_shifts;

DROP POLICY IF EXISTS "Consolidated read access" ON public.volunteer_shifts;
CREATE POLICY "Consolidated read access" ON public.volunteer_shifts FOR SELECT USING (true);
DROP POLICY IF EXISTS "shifts_admin_insert" ON public.volunteer_shifts;
CREATE POLICY "shifts_admin_insert" ON public.volunteer_shifts FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "shifts_admin_update" ON public.volunteer_shifts;
CREATE POLICY "shifts_admin_update" ON public.volunteer_shifts FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "shifts_admin_delete" ON public.volunteer_shifts;
CREATE POLICY "shifts_admin_delete" ON public.volunteer_shifts FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 14. zones
-- ==========================================
DROP POLICY IF EXISTS "zones_public_read" ON public.zones;
DROP POLICY IF EXISTS "zones_auth" ON public.zones;
DROP POLICY IF EXISTS "zones_admin_all" ON public.zones;

DROP POLICY IF EXISTS "Consolidated read access" ON public.zones;
CREATE POLICY "Consolidated read access" ON public.zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "zones_admin_insert" ON public.zones;
CREATE POLICY "zones_admin_insert" ON public.zones FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "zones_admin_update" ON public.zones;
CREATE POLICY "zones_admin_update" ON public.zones FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "zones_admin_delete" ON public.zones;
CREATE POLICY "zones_admin_delete" ON public.zones FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
