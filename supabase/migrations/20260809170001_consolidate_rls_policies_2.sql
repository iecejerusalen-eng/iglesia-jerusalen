-- 20260809170001_consolidate_rls_policies_2.sql
-- Optimización de rendimiento Parte 2: Consolidación de políticas permisivas (multiple_permissive_policies)

-- ==========================================
-- 1. sermons
-- ==========================================
DROP POLICY IF EXISTS "Permitir gestión de sermones a administradores" ON public.sermons;
DROP POLICY IF EXISTS "Permitir gestión de sermones a administradores y editores" ON public.sermons;
DROP POLICY IF EXISTS "Permitir lectura pública de sermones" ON public.sermons;
DROP POLICY IF EXISTS "Public can read sermons" ON public.sermons;

DROP POLICY IF EXISTS "Consolidated read access" ON public.sermons;
CREATE POLICY "Consolidated read access" ON public.sermons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.sermons;
CREATE POLICY "Consolidated manage access insert" ON public.sermons FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.sermons;
CREATE POLICY "Consolidated manage access update" ON public.sermons FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.sermons;
CREATE POLICY "Consolidated manage access delete" ON public.sermons FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'editor', 'leader'));

-- ==========================================
-- 2. song_styles
-- ==========================================
DROP POLICY IF EXISTS "Gestión de estilos de canción por roles autorizados" ON public.song_styles;
DROP POLICY IF EXISTS "Lectura pública de estilos de canción" ON public.song_styles;

DROP POLICY IF EXISTS "Consolidated read access" ON public.song_styles;
CREATE POLICY "Consolidated read access" ON public.song_styles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.song_styles;
CREATE POLICY "Consolidated manage access insert" ON public.song_styles FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.song_styles;
CREATE POLICY "Consolidated manage access update" ON public.song_styles FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.song_styles;
CREATE POLICY "Consolidated manage access delete" ON public.song_styles FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 3. song_types
-- ==========================================
DROP POLICY IF EXISTS "Gestión de tipos de canción por roles autorizados" ON public.song_types;
DROP POLICY IF EXISTS "Lectura pública de tipos de canción" ON public.song_types;

DROP POLICY IF EXISTS "Consolidated read access" ON public.song_types;
CREATE POLICY "Consolidated read access" ON public.song_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.song_types;
CREATE POLICY "Consolidated manage access insert" ON public.song_types FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.song_types;
CREATE POLICY "Consolidated manage access update" ON public.song_types FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.song_types;
CREATE POLICY "Consolidated manage access delete" ON public.song_types FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 4. songs
-- ==========================================
DROP POLICY IF EXISTS "Gestión de canciones por roles autorizados" ON public.songs;
DROP POLICY IF EXISTS "Lectura pública de canciones" ON public.songs;

DROP POLICY IF EXISTS "Consolidated read access" ON public.songs;
CREATE POLICY "Consolidated read access" ON public.songs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.songs;
CREATE POLICY "Consolidated manage access insert" ON public.songs FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.songs;
CREATE POLICY "Consolidated manage access update" ON public.songs FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.songs;
CREATE POLICY "Consolidated manage access delete" ON public.songs FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 5. spaces
-- ==========================================
DROP POLICY IF EXISTS "spaces_admin_all" ON public.spaces;
DROP POLICY IF EXISTS "spaces_public_read" ON public.spaces;

DROP POLICY IF EXISTS "Consolidated read access" ON public.spaces;
CREATE POLICY "Consolidated read access" ON public.spaces FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.spaces;
CREATE POLICY "Consolidated manage access insert" ON public.spaces FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.spaces;
CREATE POLICY "Consolidated manage access update" ON public.spaces FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.spaces;
CREATE POLICY "Consolidated manage access delete" ON public.spaces FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 6. speakers
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de speakers a todos" ON public.speakers;
DROP POLICY IF EXISTS "Public can read speakers" ON public.speakers;

DROP POLICY IF EXISTS "Consolidated read access" ON public.speakers;
CREATE POLICY "Consolidated read access" ON public.speakers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.speakers;
CREATE POLICY "Consolidated manage access insert" ON public.speakers FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.speakers;
CREATE POLICY "Consolidated manage access update" ON public.speakers FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.speakers;
CREATE POLICY "Consolidated manage access delete" ON public.speakers FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 7. store_categories
-- ==========================================
DROP POLICY IF EXISTS "Admin manage store_categories" ON public.store_categories;
DROP POLICY IF EXISTS "Public read store_categories" ON public.store_categories;

DROP POLICY IF EXISTS "Consolidated read access" ON public.store_categories;
CREATE POLICY "Consolidated read access" ON public.store_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.store_categories;
CREATE POLICY "Consolidated manage access insert" ON public.store_categories FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.store_categories;
CREATE POLICY "Consolidated manage access update" ON public.store_categories FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.store_categories;
CREATE POLICY "Consolidated manage access delete" ON public.store_categories FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));

-- ==========================================
-- 8. studies
-- ==========================================
DROP POLICY IF EXISTS "Public can view published studies" ON public.studies;
DROP POLICY IF EXISTS "Authenticated users can view all studies" ON public.studies;
DROP POLICY IF EXISTS "Admin can manage studies" ON public.studies;

DROP POLICY IF EXISTS "Consolidated read access" ON public.studies;
CREATE POLICY "Consolidated read access" ON public.studies FOR SELECT USING (
  is_published = true OR auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.studies;
CREATE POLICY "Consolidated manage access insert" ON public.studies FOR INSERT TO authenticated WITH CHECK (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'pastor')));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.studies;
CREATE POLICY "Consolidated manage access update" ON public.studies FOR UPDATE TO authenticated USING (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'pastor'))) WITH CHECK (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'pastor')));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.studies;
CREATE POLICY "Consolidated manage access delete" ON public.studies FOR DELETE TO authenticated USING (exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'pastor')));

-- ==========================================
-- 9. study_cohort_private_access
-- ==========================================
DROP POLICY IF EXISTS "Managers manage private cohort access" ON public.study_cohort_private_access;
DROP POLICY IF EXISTS "Members read private cohort access" ON public.study_cohort_private_access;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_cohort_private_access;
CREATE POLICY "Consolidated read access" ON public.study_cohort_private_access FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.study_memberships membership
    WHERE membership.cohort_id = study_cohort_private_access.cohort_id
      AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.study_cohorts cohort
    WHERE cohort.id = study_cohort_private_access.cohort_id
      AND (SELECT private.can_facilitate_study_program(cohort.program_id))
  ) OR (SELECT private.can_manage_study_programs()));

DROP POLICY IF EXISTS "Managers manage private cohort access insert" ON public.study_cohort_private_access;
CREATE POLICY "Managers manage private cohort access insert" ON public.study_cohort_private_access FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage private cohort access update" ON public.study_cohort_private_access;
CREATE POLICY "Managers manage private cohort access update" ON public.study_cohort_private_access FOR UPDATE TO authenticated USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage private cohort access delete" ON public.study_cohort_private_access;
CREATE POLICY "Managers manage private cohort access delete" ON public.study_cohort_private_access FOR DELETE TO authenticated USING ((SELECT private.can_manage_study_programs()));

-- ==========================================
-- 10. study_cohorts
-- ==========================================
DROP POLICY IF EXISTS "Published cohorts are public" ON public.study_cohorts;
DROP POLICY IF EXISTS "Program viewers read all cohorts" ON public.study_cohorts;
DROP POLICY IF EXISTS "Managers manage cohorts" ON public.study_cohorts;

DROP POLICY IF EXISTS "Consolidated read access" ON public.study_cohorts;
CREATE POLICY "Consolidated read access" ON public.study_cohorts FOR SELECT USING (
  (status IN ('open', 'active') AND EXISTS (SELECT 1 FROM public.study_programs p WHERE p.id = program_id AND p.status = 'published')) OR 
  (auth.role() = 'authenticated' AND ((SELECT private.can_view_study_program_admin()) OR (SELECT private.can_manage_study_programs())))
);
DROP POLICY IF EXISTS "Managers manage cohorts insert" ON public.study_cohorts;
CREATE POLICY "Managers manage cohorts insert" ON public.study_cohorts FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage cohorts update" ON public.study_cohorts;
CREATE POLICY "Managers manage cohorts update" ON public.study_cohorts FOR UPDATE TO authenticated USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
DROP POLICY IF EXISTS "Managers manage cohorts delete" ON public.study_cohorts;
CREATE POLICY "Managers manage cohorts delete" ON public.study_cohorts FOR DELETE TO authenticated USING ((SELECT private.can_manage_study_programs()));
