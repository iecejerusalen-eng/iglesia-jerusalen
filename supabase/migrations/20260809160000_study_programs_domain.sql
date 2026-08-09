-- Separa Programas de Estudio del LMS formal y protege el material del facilitador.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.safe_jsonb_array(value text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE parsed jsonb;
BEGIN
  IF value IS NULL OR trim(value) = '' THEN RETURN '[]'::jsonb; END IF;
  BEGIN
    parsed := value::jsonb;
    IF jsonb_typeof(parsed) = 'array' THEN RETURN parsed; END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    NULL;
  END;
  RETURN jsonb_build_array(jsonb_build_object('id', md5(value), 'type', 'html', 'content', value));
END;
$$;

CREATE TABLE IF NOT EXISTS public.study_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 140),
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  program_type text NOT NULL DEFAULT 'self_guided'
    CHECK (program_type IN ('community_group', 'self_guided', 'facilitated', 'downloadable')),
  modality text NOT NULL DEFAULT 'online'
    CHECK (modality IN ('online', 'in_person', 'hybrid', 'offline_package')),
  access_type text NOT NULL DEFAULT 'public'
    CHECK (access_type IN ('public', 'account', 'approval', 'invitation')),
  audience text NOT NULL DEFAULT 'Todos',
  category text NOT NULL DEFAULT 'General',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  duration_label text,
  difficulty text NOT NULL DEFAULT 'inicial'
    CHECK (difficulty IN ('inicial', 'intermedio', 'avanzado')),
  requires_facilitator boolean NOT NULL DEFAULT false,
  allows_guest_progress boolean NOT NULL DEFAULT true,
  offline_enabled boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_program_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 140),
  description text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.study_program_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.study_program_sections(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  summary text NOT NULL DEFAULT '',
  lesson_type text NOT NULL DEFAULT 'lesson'
    CHECK (lesson_type IN ('lesson', 'devotional', 'reading', 'activity', 'meeting', 'download')),
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(content_blocks) = 'array'),
  estimated_minutes integer CHECK (estimated_minutes IS NULL OR estimated_minutes BETWEEN 1 AND 1440),
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  is_preview boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, order_index)
);

-- Esta tabla separada evita que una consulta pública pueda devolver respuestas o guías privadas.
CREATE TABLE IF NOT EXISTS public.study_lesson_facilitator_content (
  lesson_id uuid PRIMARY KEY REFERENCES public.study_program_lessons(id) ON DELETE CASCADE,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(content_blocks) = 'array'),
  internal_notes text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'open', 'active', 'completed', 'cancelled')),
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  starts_on date,
  ends_on date,
  timezone text NOT NULL DEFAULT 'America/Guayaquil',
  schedule_text text,
  meeting_provider text CHECK (meeting_provider IS NULL OR meeting_provider IN ('google_meet', 'zoom', 'teams', 'other')),
  registration_deadline timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.study_cohort_private_access (
  cohort_id uuid PRIMARY KEY REFERENCES public.study_cohorts(id) ON DELETE CASCADE,
  meeting_url text,
  internal_notes text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES public.study_cohorts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'participant'
    CHECK (member_role IN ('director', 'editor', 'facilitator', 'moderator', 'analyst', 'participant')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'declined', 'completed', 'withdrawn')),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS study_memberships_program_user_no_cohort_uidx
  ON public.study_memberships (program_id, user_id) WHERE cohort_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS study_memberships_cohort_user_uidx
  ON public.study_memberships (cohort_id, user_id) WHERE cohort_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.study_cohorts(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  description text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  meeting_url text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.study_program_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  response_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(response_data) = 'object'),
  progress_percent smallint NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.study_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.study_program_lessons(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  resource_type text NOT NULL CHECK (resource_type IN ('pdf', 'video', 'audio', 'link', 'book', 'file')),
  url text NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'participant', 'facilitator')),
  is_downloadable boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_programs_public_catalog_idx ON public.study_programs (status, is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS study_programs_type_category_idx ON public.study_programs (program_type, category);
CREATE INDEX IF NOT EXISTS study_program_sections_program_idx ON public.study_program_sections (program_id, order_index);
CREATE INDEX IF NOT EXISTS study_program_lessons_section_idx ON public.study_program_lessons (section_id, order_index);
CREATE INDEX IF NOT EXISTS study_cohorts_program_status_idx ON public.study_cohorts (program_id, status);
CREATE INDEX IF NOT EXISTS study_memberships_user_status_idx ON public.study_memberships (user_id, status);
CREATE INDEX IF NOT EXISTS study_memberships_program_role_idx ON public.study_memberships (program_id, member_role, status);
CREATE INDEX IF NOT EXISTS study_sessions_cohort_starts_idx ON public.study_sessions (cohort_id, starts_at);
CREATE INDEX IF NOT EXISTS study_progress_lesson_idx ON public.study_progress (lesson_id);
CREATE INDEX IF NOT EXISTS study_resources_program_visibility_idx ON public.study_resources (program_id, visibility, order_index);
CREATE INDEX IF NOT EXISTS study_resources_lesson_idx ON public.study_resources (lesson_id) WHERE lesson_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.can_manage_study_programs()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.banned IS NOT TRUE
      AND (
        profile.role::text IN ('admin', 'pastor')
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR COALESCE((profile.permissions_override->'study_programs'->>'edit')::boolean, false)
        OR EXISTS (
          SELECT 1
          FROM public.role_permissions permission
          WHERE permission.role::text = ANY(array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[])))
            AND COALESCE((permission.permissions->'study_programs'->>'edit')::boolean, false)
        )
        OR EXISTS (
          SELECT 1
          FROM public.access_roles access_role
          WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, '{}'::uuid[]))
            AND access_role.is_active
            AND COALESCE((access_role.permissions->'study_programs'->>'edit')::boolean, false)
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION private.can_view_study_program_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.can_manage_study_programs() OR EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.banned IS NOT TRUE
      AND (
        COALESCE((profile.permissions_override->'study_programs'->>'view')::boolean, false)
        OR EXISTS (
          SELECT 1 FROM public.role_permissions permission
          WHERE permission.role::text = ANY(array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[])))
            AND COALESCE((permission.permissions->'study_programs'->>'view')::boolean, false)
        )
        OR EXISTS (
          SELECT 1 FROM public.access_roles access_role
          WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, '{}'::uuid[]))
            AND access_role.is_active
            AND COALESCE((access_role.permissions->'study_programs'->>'view')::boolean, false)
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION private.can_facilitate_study_program(target_program_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.can_manage_study_programs() OR EXISTS (
    SELECT 1
    FROM public.study_memberships membership
    WHERE membership.program_id = target_program_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.status = 'active'
      AND membership.member_role IN ('director', 'editor', 'facilitator', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION private.cohort_accepts_member(target_cohort_id uuid, target_program_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.study_cohorts cohort
    WHERE cohort.id = target_cohort_id
      AND cohort.program_id = target_program_id
      AND cohort.status IN ('open', 'active')
      AND (
        cohort.capacity IS NULL OR cohort.capacity > (
          SELECT count(*) FROM public.study_memberships membership
          WHERE membership.cohort_id = cohort.id AND membership.status = 'active'
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION private.can_manage_study_programs() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_view_study_program_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_facilitate_study_program(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.cohort_accepts_member(uuid, uuid) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_study_programs() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_study_program_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_facilitate_study_program(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.cohort_accepts_member(uuid, uuid) TO authenticated;

ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_program_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_program_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_lesson_facilitator_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_cohort_private_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published study programs are public" ON public.study_programs FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Managers read all study programs" ON public.study_programs FOR SELECT TO authenticated
  USING ((SELECT private.can_view_study_program_admin()));
CREATE POLICY "Managers create study programs" ON public.study_programs FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.can_manage_study_programs()));
CREATE POLICY "Managers update study programs" ON public.study_programs FOR UPDATE TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));
CREATE POLICY "Managers delete study programs" ON public.study_programs FOR DELETE TO authenticated
  USING ((SELECT private.can_manage_study_programs()));

CREATE POLICY "Published study sections are public" ON public.study_program_sections FOR SELECT TO anon, authenticated
  USING (is_published AND EXISTS (SELECT 1 FROM public.study_programs p WHERE p.id = program_id AND p.status = 'published'));
CREATE POLICY "Program viewers read all study sections" ON public.study_program_sections FOR SELECT TO authenticated
  USING ((SELECT private.can_view_study_program_admin()));
CREATE POLICY "Managers manage study sections" ON public.study_program_sections FOR ALL TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));

CREATE POLICY "Published study lessons are public" ON public.study_program_lessons FOR SELECT TO anon, authenticated
  USING (is_published AND EXISTS (
    SELECT 1 FROM public.study_program_sections section
    JOIN public.study_programs program ON program.id = section.program_id
    WHERE section.id = study_program_lessons.section_id AND section.is_published AND program.status = 'published'
      AND (program.access_type = 'public' OR study_program_lessons.is_preview)
  ));
CREATE POLICY "Active participants read study lessons" ON public.study_program_lessons FOR SELECT TO authenticated
  USING (is_published AND EXISTS (
    SELECT 1 FROM public.study_program_sections section
    JOIN public.study_memberships membership ON membership.program_id = section.program_id
    WHERE section.id = study_program_lessons.section_id
      AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
  ));
CREATE POLICY "Program viewers read all study lessons" ON public.study_program_lessons FOR SELECT TO authenticated
  USING ((SELECT private.can_view_study_program_admin()));
CREATE POLICY "Managers manage study lessons" ON public.study_program_lessons FOR ALL TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));

CREATE POLICY "Facilitators read private lesson content" ON public.study_lesson_facilitator_content FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.study_program_lessons lesson
    JOIN public.study_program_sections section ON section.id = lesson.section_id
    WHERE lesson.id = study_lesson_facilitator_content.lesson_id AND (SELECT private.can_facilitate_study_program(section.program_id))
  ));
CREATE POLICY "Managers manage private lesson content" ON public.study_lesson_facilitator_content FOR ALL TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));

CREATE POLICY "Published cohorts are public" ON public.study_cohorts FOR SELECT TO anon, authenticated
  USING (study_cohorts.status IN ('open', 'active') AND EXISTS (SELECT 1 FROM public.study_programs p WHERE p.id = study_cohorts.program_id AND p.status = 'published'));
CREATE POLICY "Program viewers read all cohorts" ON public.study_cohorts FOR SELECT TO authenticated
  USING ((SELECT private.can_view_study_program_admin()));
CREATE POLICY "Managers manage cohorts" ON public.study_cohorts FOR ALL TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));

CREATE POLICY "Members read private cohort access" ON public.study_cohort_private_access FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.study_memberships membership
    WHERE membership.cohort_id = study_cohort_private_access.cohort_id
      AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.study_cohorts cohort
    WHERE cohort.id = study_cohort_private_access.cohort_id
      AND (SELECT private.can_facilitate_study_program(cohort.program_id))
  ));
CREATE POLICY "Managers manage private cohort access" ON public.study_cohort_private_access FOR ALL TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));

CREATE POLICY "Users read own memberships" ON public.study_memberships FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.can_facilitate_study_program(program_id)));
CREATE POLICY "Users request eligible programs" ON public.study_memberships FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND member_role = 'participant'
    AND EXISTS (
      SELECT 1 FROM public.study_programs p
      WHERE p.id = study_memberships.program_id AND p.status = 'published' AND p.access_type <> 'invitation'
        AND ((p.access_type IN ('public', 'account') AND study_memberships.status = 'active') OR (p.access_type = 'approval' AND study_memberships.status = 'pending'))
    )
    AND (study_memberships.cohort_id IS NULL OR (SELECT private.cohort_accepts_member(study_memberships.cohort_id, study_memberships.program_id)))
  );
CREATE POLICY "Managers manage memberships" ON public.study_memberships FOR ALL TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));

CREATE POLICY "Cohort members read sessions" ON public.study_sessions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.study_memberships membership
    WHERE membership.cohort_id = study_sessions.cohort_id AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
  ) OR (SELECT private.can_manage_study_programs()));
CREATE POLICY "Facilitators manage sessions" ON public.study_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.study_cohorts cohort WHERE cohort.id = study_sessions.cohort_id AND (SELECT private.can_facilitate_study_program(cohort.program_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.study_cohorts cohort WHERE cohort.id = study_sessions.cohort_id AND (SELECT private.can_facilitate_study_program(cohort.program_id))));

CREATE POLICY "Users manage own study progress" ON public.study_progress FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Facilitators read participant progress" ON public.study_progress FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.study_program_lessons lesson
    JOIN public.study_program_sections section ON section.id = lesson.section_id
    WHERE lesson.id = study_progress.lesson_id AND (SELECT private.can_facilitate_study_program(section.program_id))
  ));

CREATE POLICY "Public study resources are visible" ON public.study_resources FOR SELECT TO anon, authenticated
  USING (visibility = 'public' AND EXISTS (SELECT 1 FROM public.study_programs p WHERE p.id = program_id AND p.status = 'published'));
CREATE POLICY "Members read participant resources" ON public.study_resources FOR SELECT TO authenticated
  USING (visibility = 'participant' AND EXISTS (
    SELECT 1 FROM public.study_memberships membership
    WHERE membership.program_id = study_resources.program_id AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
  ));
CREATE POLICY "Facilitators read facilitator resources" ON public.study_resources FOR SELECT TO authenticated
  USING (visibility = 'facilitator' AND (SELECT private.can_facilitate_study_program(study_resources.program_id)));
CREATE POLICY "Managers manage study resources" ON public.study_resources FOR ALL TO authenticated
  USING ((SELECT private.can_manage_study_programs())) WITH CHECK ((SELECT private.can_manage_study_programs()));

GRANT SELECT ON public.study_programs, public.study_program_sections, public.study_program_lessons,
  public.study_cohorts, public.study_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_programs, public.study_program_sections,
  public.study_program_lessons, public.study_lesson_facilitator_content, public.study_cohorts,
  public.study_cohort_private_access, public.study_memberships, public.study_sessions, public.study_progress, public.study_resources TO authenticated;

CREATE OR REPLACE FUNCTION public.set_study_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['study_programs','study_program_sections','study_program_lessons','study_lesson_facilitator_content','study_cohorts','study_cohort_private_access','study_memberships','study_sessions','study_progress','study_resources']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_study_updated_at()', table_name);
  END LOOP;
END $$;

-- Migra recursos abiertos existentes sin alterar ni borrar las tablas anteriores.
INSERT INTO public.study_programs (id, slug, title, summary, description, cover_image_url, program_type, modality, access_type, status, published_at, created_at, updated_at)
SELECT resource.id,
       trim(both '-' from regexp_replace(lower(translate(resource.title, 'áéíóúñü', 'aeiounu')), '[^a-z0-9]+', '-', 'g')) || '-' || left(resource.id::text, 8),
       resource.title, COALESCE(resource.description, ''), COALESCE(resource.description, ''), resource.cover_image_url,
       'self_guided', 'online', 'public', CASE WHEN resource.is_published THEN 'published' ELSE 'draft' END,
       CASE WHEN resource.is_published THEN resource.created_at ELSE NULL END, resource.created_at, resource.updated_at
FROM public.open_resources resource
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.study_program_sections (id, program_id, title, description, order_index, created_at)
SELECT section.id, section.resource_id, section.title, COALESCE(section.description, ''), section.order_index, section.created_at
FROM public.open_sections section
JOIN public.study_programs program ON program.id = section.resource_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.study_program_lessons (id, section_id, title, lesson_type, content_blocks, order_index, created_at, updated_at)
SELECT activity.id, activity.section_id, activity.title,
       CASE WHEN activity.type IN ('video_link', 'h5p_embed') THEN 'activity' ELSE 'lesson' END,
       private.safe_jsonb_array(activity.content),
       activity.order_index, activity.created_at, activity.updated_at
FROM public.open_activities activity
JOIN public.study_program_sections section ON section.id = activity.section_id
ON CONFLICT (id) DO NOTHING;

-- Corrige la exposición previa de contenido hijo perteneciente a borradores.
DROP POLICY IF EXISTS "Authenticated users can view all resources" ON public.open_resources;
DROP POLICY IF EXISTS "Public can view sections of published resources" ON public.open_sections;
CREATE POLICY "Public can view sections of published resources" ON public.open_sections FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.open_resources resource WHERE resource.id = resource_id AND resource.is_published));
DROP POLICY IF EXISTS "Public can view activities of published resources" ON public.open_activities;
CREATE POLICY "Public can view activities of published resources" ON public.open_activities FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.open_sections section
    JOIN public.open_resources resource ON resource.id = section.resource_id
    WHERE section.id = section_id AND resource.is_published
  ));

COMMENT ON TABLE public.study_programs IS 'Programas flexibles de discipulado, independientes del LMS académico.';
COMMENT ON TABLE public.study_lesson_facilitator_content IS 'Guías, respuestas y notas privadas; nunca se incluyen en consultas públicas de lecciones.';

-- Conserva los permisos que ya existían para Programas/Recursos Abiertos.
UPDATE public.role_permissions
SET permissions = jsonb_set(
  permissions,
  '{study_programs}',
  COALESCE(permissions->'open_resources', permissions->'programs', '{"view": false, "edit": false}'::jsonb),
  true
)
WHERE NOT (permissions ? 'study_programs');

UPDATE public.access_roles
SET permissions = jsonb_set(
  permissions,
  '{study_programs}',
  COALESCE(permissions->'open_resources', permissions->'programs', '{"view": false, "edit": false}'::jsonb),
  true
)
WHERE NOT (permissions ? 'study_programs');

UPDATE public.profiles
SET permissions_override = jsonb_set(
  COALESCE(permissions_override, '{}'::jsonb),
  '{study_programs}',
  COALESCE(permissions_override->'open_resources', permissions_override->'programs'),
  true
)
WHERE NOT (COALESCE(permissions_override, '{}'::jsonb) ? 'study_programs')
  AND (COALESCE(permissions_override, '{}'::jsonb) ?| ARRAY['open_resources', 'programs']);

-- Borrador basado únicamente en la información confirmada por la iglesia.
-- Fechas, facilitadora, libro y enlace de Meet quedan pendientes para evitar datos inventados.
INSERT INTO public.study_programs (
  slug, title, summary, description, program_type, modality, access_type,
  audience, category, requires_facilitator, allows_guest_progress, status, tags
) VALUES (
  'chicas-sabias',
  'Chicas Sabias',
  'Grupo en línea para chicas jóvenes que se reúnen, leen un libro y realizan juntas su devocional matutino.',
  'Espacio comunitario de lectura y crecimiento espiritual mediante encuentros en Google Meet. Completa los datos reales del grupo antes de publicarlo.',
  'community_group', 'online', 'approval', 'Chicas jóvenes', 'Grupos de crecimiento', true, false, 'draft',
  ARRAY['devocional', 'lectura', 'comunidad']::text[]
)
ON CONFLICT (slug) DO NOTHING;
