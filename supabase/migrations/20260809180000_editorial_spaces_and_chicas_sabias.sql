-- Editorial hub shared by church pages, ministries and study programs.
-- Public clients consume RPCs so protected bodies and password hashes never leave Postgres.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.editorial_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 140),
  description text NOT NULL DEFAULT '',
  owner_type text NOT NULL DEFAULT 'church' CHECK (owner_type IN ('church', 'ministry', 'study_program')),
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.study_programs(id) ON DELETE CASCADE,
  cover_image_url text,
  accent_color text NOT NULL DEFAULT '#C99A49' CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_published boolean NOT NULL DEFAULT false,
  allow_comments boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT editorial_space_owner_ck CHECK (
    (owner_type = 'church' AND ministry_id IS NULL AND program_id IS NULL)
    OR (owner_type = 'ministry' AND ministry_id IS NOT NULL AND program_id IS NULL)
    OR (owner_type = 'study_program' AND program_id IS NOT NULL AND ministry_id IS NULL)
  )
);

CREATE UNIQUE INDEX editorial_spaces_ministry_uidx ON public.editorial_spaces (ministry_id) WHERE ministry_id IS NOT NULL;
CREATE UNIQUE INDEX editorial_spaces_program_uidx ON public.editorial_spaces (program_id) WHERE program_id IS NOT NULL;

CREATE TABLE public.editorial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.editorial_spaces(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#C99A49' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  UNIQUE (space_id, slug)
);

CREATE TABLE public.editorial_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.editorial_spaces(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.editorial_documents(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.editorial_categories(id) ON DELETE SET NULL,
  document_type text NOT NULL DEFAULT 'post' CHECK (document_type IN ('page', 'post')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 180),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text NOT NULL DEFAULT '',
  cover_image_url text,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(content_blocks) = 'array'),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members', 'password', 'editors')),
  password_hash text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at timestamptz,
  scheduled_at timestamptz,
  is_featured boolean NOT NULL DEFAULT false,
  allow_comments boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  depth smallint NOT NULL DEFAULT 0 CHECK (depth BETWEEN 0 AND 4),
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT editorial_password_ck CHECK (
    (visibility = 'password' AND password_hash IS NOT NULL)
    OR (visibility <> 'password' AND password_hash IS NULL)
  )
);

CREATE UNIQUE INDEX editorial_documents_root_slug_uidx ON public.editorial_documents (space_id, slug) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX editorial_documents_child_slug_uidx ON public.editorial_documents (parent_id, slug) WHERE parent_id IS NOT NULL;
CREATE INDEX editorial_documents_feed_idx ON public.editorial_documents (space_id, status, document_type, published_at DESC);
CREATE INDEX editorial_documents_parent_idx ON public.editorial_documents (parent_id, order_index);
CREATE INDEX editorial_documents_category_idx ON public.editorial_documents (category_id, published_at DESC) WHERE category_id IS NOT NULL;

CREATE TABLE public.editorial_space_editors (
  space_id uuid NOT NULL REFERENCES public.editorial_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  editor_role text NOT NULL DEFAULT 'editor' CHECK (editor_role IN ('owner', 'editor', 'author', 'moderator')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id)
);
CREATE INDEX editorial_space_editors_user_idx ON public.editorial_space_editors (user_id, space_id);

CREATE TABLE public.editorial_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.editorial_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  parent_id uuid REFERENCES public.editorial_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX editorial_comments_document_idx ON public.editorial_comments (document_id, status, created_at);

CREATE TABLE public.editorial_access_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.editorial_documents(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX editorial_access_sessions_lookup_idx ON public.editorial_access_sessions (document_id, token, expires_at);

CREATE TABLE public.editorial_unlock_attempts (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.editorial_documents(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX editorial_unlock_attempts_lookup_idx ON public.editorial_unlock_attempts (document_id, client_id, attempted_at DESC);

CREATE OR REPLACE FUNCTION private.can_manage_editorial()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid()) AND profile.banned IS NOT TRUE AND (
      profile.role::text IN ('admin', 'pastor')
      OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
      OR COALESCE((profile.permissions_override->'editorial'->>'edit')::boolean, false)
      OR EXISTS (
        SELECT 1 FROM public.role_permissions permission
        WHERE permission.role::text = ANY(array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[])))
          AND COALESCE((permission.permissions->'editorial'->>'edit')::boolean, false)
      )
      OR EXISTS (
        SELECT 1 FROM public.access_roles access_role
        WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, '{}'::uuid[]))
          AND access_role.is_active
          AND COALESCE((access_role.permissions->'editorial'->>'edit')::boolean, false)
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION private.can_edit_editorial_space(target_space_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.can_manage_editorial() OR EXISTS (
    SELECT 1 FROM public.editorial_space_editors editor
    WHERE editor.space_id = target_space_id
      AND editor.user_id = (SELECT auth.uid())
      AND editor.editor_role IN ('owner', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.editorial_spaces space
    JOIN public.profiles profile ON profile.id = (SELECT auth.uid())
    WHERE space.id = target_space_id AND space.owner_type = 'ministry' AND (
      profile.ministry_id = space.ministry_id
      OR space.ministry_id = ANY(COALESCE(profile.allowed_ministries, '{}'::uuid[]))
    )
  ) OR EXISTS (
    SELECT 1 FROM public.editorial_spaces space
    JOIN public.study_memberships membership ON membership.program_id = space.program_id
    WHERE space.id = target_space_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.status = 'active'
      AND membership.member_role IN ('director', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION private.can_author_editorial_space(target_space_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.can_edit_editorial_space(target_space_id) OR EXISTS (
    SELECT 1 FROM public.editorial_space_editors editor
    WHERE editor.space_id = target_space_id
      AND editor.user_id = (SELECT auth.uid())
      AND editor.editor_role IN ('author', 'moderator')
  ) OR EXISTS (
    SELECT 1 FROM public.editorial_spaces space
    JOIN public.study_memberships membership ON membership.program_id = space.program_id
    WHERE space.id = target_space_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.status = 'active'
      AND membership.member_role IN ('facilitator', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION private.can_read_editorial_members(target_space_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.can_author_editorial_space(target_space_id)
  OR EXISTS (
    SELECT 1 FROM public.editorial_spaces space
    JOIN public.study_memberships membership ON membership.program_id = space.program_id
    WHERE space.id = target_space_id AND space.owner_type = 'study_program'
      AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.editorial_spaces space
    JOIN public.profiles profile ON profile.id = (SELECT auth.uid())
    JOIN public.ministry_members member ON member.ministry_id = space.ministry_id AND member.member_id = profile.member_id
    WHERE space.id = target_space_id AND space.owner_type = 'ministry'
  );
$$;

REVOKE ALL ON FUNCTION private.can_manage_editorial() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_edit_editorial_space(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_author_editorial_space(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_read_editorial_members(uuid) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_editorial() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_edit_editorial_space(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_author_editorial_space(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_read_editorial_members(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_editorial_document_tree()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE parent_row public.editorial_documents%ROWTYPE;
BEGIN
  NEW.slug := lower(trim(NEW.slug));
  IF NEW.parent_id IS NULL THEN NEW.depth := 0; RETURN NEW; END IF;
  IF NEW.parent_id = NEW.id THEN RAISE EXCEPTION 'Un documento no puede ser su propio padre'; END IF;
  SELECT * INTO parent_row FROM public.editorial_documents WHERE id = NEW.parent_id;
  IF NOT FOUND OR parent_row.space_id <> NEW.space_id THEN RAISE EXCEPTION 'La página padre no pertenece al mismo espacio'; END IF;
  IF parent_row.depth >= 4 THEN RAISE EXCEPTION 'Solo se permiten cinco niveles de páginas'; END IF;
  IF TG_OP = 'UPDATE' AND EXISTS (
    WITH RECURSIVE descendants AS (
      SELECT id FROM public.editorial_documents WHERE parent_id = NEW.id
      UNION ALL SELECT child.id FROM public.editorial_documents child JOIN descendants d ON child.parent_id = d.id
    ) SELECT 1 FROM descendants WHERE id = NEW.parent_id
  ) THEN RAISE EXCEPTION 'No se puede crear un ciclo de páginas'; END IF;
  NEW.depth := parent_row.depth + 1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_editorial_document_tree_before_write
  BEFORE INSERT OR UPDATE OF parent_id, space_id, slug ON public.editorial_documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_editorial_document_tree();

ALTER TABLE public.editorial_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_space_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_access_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_unlock_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editorial managers read spaces" ON public.editorial_spaces FOR SELECT TO authenticated
  USING ((SELECT private.can_author_editorial_space(id)));
CREATE POLICY "Editorial managers create spaces" ON public.editorial_spaces FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.can_manage_editorial())
    OR (owner_type = 'ministry' AND EXISTS (
      SELECT 1 FROM public.profiles profile WHERE profile.id = (SELECT auth.uid())
        AND (profile.ministry_id = ministry_id OR ministry_id = ANY(COALESCE(profile.allowed_ministries, '{}'::uuid[])))
    ))
    OR (owner_type = 'study_program' AND EXISTS (
      SELECT 1 FROM public.study_memberships membership WHERE membership.program_id = program_id
        AND membership.user_id = (SELECT auth.uid()) AND membership.status = 'active'
        AND membership.member_role IN ('director', 'editor')
    ))
  );
CREATE POLICY "Editorial editors update spaces" ON public.editorial_spaces FOR UPDATE TO authenticated
  USING ((SELECT private.can_edit_editorial_space(id))) WITH CHECK ((SELECT private.can_edit_editorial_space(id)));
CREATE POLICY "Editorial managers delete spaces" ON public.editorial_spaces FOR DELETE TO authenticated
  USING ((SELECT private.can_manage_editorial()));

CREATE POLICY "Editorial authors manage categories" ON public.editorial_categories FOR ALL TO authenticated
  USING ((SELECT private.can_author_editorial_space(space_id))) WITH CHECK ((SELECT private.can_author_editorial_space(space_id)));
CREATE POLICY "Editorial authors read documents" ON public.editorial_documents FOR SELECT TO authenticated
  USING ((SELECT private.can_author_editorial_space(space_id)));
CREATE POLICY "Editorial authors create documents" ON public.editorial_documents FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.can_author_editorial_space(space_id)));
CREATE POLICY "Editorial authors update own documents" ON public.editorial_documents FOR UPDATE TO authenticated
  USING ((SELECT private.can_edit_editorial_space(space_id)) OR author_id = (SELECT auth.uid()))
  WITH CHECK ((SELECT private.can_edit_editorial_space(space_id)) OR author_id = (SELECT auth.uid()));
CREATE POLICY "Editorial editors delete documents" ON public.editorial_documents FOR DELETE TO authenticated
  USING ((SELECT private.can_edit_editorial_space(space_id)));

CREATE POLICY "Editorial editors manage editor assignments" ON public.editorial_space_editors FOR ALL TO authenticated
  USING ((SELECT private.can_edit_editorial_space(space_id))) WITH CHECK ((SELECT private.can_edit_editorial_space(space_id)));
CREATE POLICY "Editors read own assignment" ON public.editorial_space_editors FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Members read visible comments" ON public.editorial_comments FOR SELECT TO authenticated
  USING (status = 'published' AND EXISTS (
    SELECT 1 FROM public.editorial_documents document
    WHERE document.id = document_id AND (SELECT private.can_read_editorial_members(document.space_id))
  ));
CREATE POLICY "Members create comments" ON public.editorial_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.editorial_documents document
    JOIN public.editorial_spaces space ON space.id = document.space_id
    WHERE document.id = document_id AND document.allow_comments AND space.allow_comments
      AND (SELECT private.can_read_editorial_members(document.space_id))
  ));
CREATE POLICY "Authors moderate comments" ON public.editorial_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.editorial_documents document WHERE document.id = document_id AND (SELECT private.can_author_editorial_space(document.space_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.editorial_documents document WHERE document.id = document_id AND (SELECT private.can_author_editorial_space(document.space_id))));

CREATE POLICY "Editorial managers inspect sessions" ON public.editorial_access_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.editorial_documents document WHERE document.id = document_id AND (SELECT private.can_edit_editorial_space(document.space_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.editorial_documents document WHERE document.id = document_id AND (SELECT private.can_edit_editorial_space(document.space_id))));
CREATE POLICY "Editorial managers inspect attempts" ON public.editorial_unlock_attempts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.editorial_documents document WHERE document.id = document_id AND (SELECT private.can_edit_editorial_space(document.space_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.editorial_documents document WHERE document.id = document_id AND (SELECT private.can_edit_editorial_space(document.space_id))));

CREATE OR REPLACE FUNCTION public.get_editorial_space(p_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'space', jsonb_build_object('id', space.id, 'slug', space.slug, 'name', space.name, 'description', space.description,
      'owner_type', space.owner_type, 'ministry_id', space.ministry_id, 'program_id', space.program_id,
      'cover_image_url', space.cover_image_url, 'accent_color', space.accent_color, 'allow_comments', space.allow_comments),
    'categories', COALESCE((SELECT jsonb_agg(to_jsonb(category) ORDER BY category.order_index, category.name)
      FROM public.editorial_categories category WHERE category.space_id = space.id), '[]'::jsonb),
    'documents', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', document.id, 'parent_id', document.parent_id, 'category_id', document.category_id,
      'document_type', document.document_type, 'title', document.title, 'slug', document.slug,
      'excerpt', document.excerpt, 'cover_image_url', document.cover_image_url, 'visibility', document.visibility,
      'is_locked', document.visibility IN ('password', 'members', 'editors'), 'is_featured', document.is_featured,
      'published_at', document.published_at, 'depth', document.depth, 'order_index', document.order_index)
      ORDER BY document.is_featured DESC, document.order_index, document.published_at DESC)
      FROM public.editorial_documents document
      WHERE document.space_id = space.id
        AND (document.status = 'published' OR (document.status = 'scheduled' AND document.scheduled_at <= now()))
        AND (document.published_at IS NULL OR document.published_at <= now())
        AND (document.visibility IN ('public', 'password') OR private.can_read_editorial_members(space.id))), '[]'::jsonb)
  )
  FROM public.editorial_spaces space WHERE space.slug = p_slug AND space.is_published;
$$;

CREATE OR REPLACE FUNCTION public.get_editorial_document(p_space_slug text, p_document_id uuid, p_access_token uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE space_row public.editorial_spaces%ROWTYPE; document_row public.editorial_documents%ROWTYPE; allowed boolean := false;
BEGIN
  SELECT * INTO space_row FROM public.editorial_spaces WHERE slug = p_space_slug AND is_published;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO document_row FROM public.editorial_documents
    WHERE id = p_document_id AND space_id = space_row.id
      AND (status = 'published' OR (status = 'scheduled' AND scheduled_at <= now()))
      AND (published_at IS NULL OR published_at <= now());
  IF NOT FOUND THEN RETURN NULL; END IF;
  allowed := document_row.visibility = 'public'
    OR (document_row.visibility = 'members' AND private.can_read_editorial_members(space_row.id))
    OR (document_row.visibility = 'editors' AND private.can_author_editorial_space(space_row.id))
    OR (document_row.visibility = 'password' AND EXISTS (
      SELECT 1 FROM public.editorial_access_sessions session
      WHERE session.document_id = document_row.id AND session.token = p_access_token AND session.expires_at > now()
    ));
  RETURN jsonb_build_object(
    'is_locked', NOT allowed,
    'lock_reason', CASE WHEN allowed THEN NULL ELSE document_row.visibility END,
    'document', jsonb_build_object('id', document_row.id, 'parent_id', document_row.parent_id,
      'category_id', document_row.category_id, 'document_type', document_row.document_type,
      'title', document_row.title, 'slug', document_row.slug, 'excerpt', document_row.excerpt,
      'cover_image_url', document_row.cover_image_url, 'visibility', document_row.visibility,
      'published_at', document_row.published_at, 'allow_comments', document_row.allow_comments,
      'content_blocks', CASE WHEN allowed THEN document_row.content_blocks ELSE NULL END)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_editorial_document(p_document_id uuid, p_password text, p_client_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE document_row public.editorial_documents%ROWTYPE; new_token uuid; new_expiry timestamptz := now() + interval '12 hours';
BEGIN
  SELECT document.* INTO document_row FROM public.editorial_documents document
  JOIN public.editorial_spaces space ON space.id = document.space_id
  WHERE document.id = p_document_id AND document.status = 'published' AND document.visibility = 'password' AND space.is_published;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid'); END IF;
  IF (SELECT count(*) FROM public.editorial_unlock_attempts attempt WHERE attempt.document_id = p_document_id
      AND attempt.client_id = p_client_id AND NOT attempt.succeeded AND attempt.attempted_at > now() - interval '15 minutes') >= 8 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'rate_limited');
  END IF;
  IF extensions.crypt(p_password, document_row.password_hash) IS DISTINCT FROM document_row.password_hash THEN
    INSERT INTO public.editorial_unlock_attempts (document_id, client_id, succeeded) VALUES (p_document_id, p_client_id, false);
    RETURN jsonb_build_object('success', false, 'reason', 'incorrect');
  END IF;
  DELETE FROM public.editorial_unlock_attempts WHERE document_id = p_document_id AND client_id = p_client_id;
  DELETE FROM public.editorial_access_sessions WHERE expires_at <= now();
  INSERT INTO public.editorial_access_sessions (document_id, expires_at) VALUES (p_document_id, new_expiry) RETURNING token INTO new_token;
  RETURN jsonb_build_object('success', true, 'token', new_token, 'expires_at', new_expiry);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_editorial_document_password(p_document_id uuid, p_password text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_space_id uuid;
BEGIN
  SELECT space_id INTO target_space_id FROM public.editorial_documents WHERE id = p_document_id;
  IF target_space_id IS NULL OR NOT private.can_edit_editorial_space(target_space_id) THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  IF p_password IS NULL OR length(trim(p_password)) = 0 THEN
    UPDATE public.editorial_documents SET password_hash = NULL, visibility = 'public', updated_at = now() WHERE id = p_document_id;
  ELSIF length(p_password) < 8 THEN RAISE EXCEPTION 'La contraseña debe tener al menos 8 caracteres';
  ELSE UPDATE public.editorial_documents SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 11)), visibility = 'password', updated_at = now() WHERE id = p_document_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_editorial_space(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_editorial_document(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlock_editorial_document(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_editorial_document_password(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_editorial_space(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_editorial_document(text, uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_editorial_document(uuid, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_editorial_document_password(uuid, text) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.editorial_spaces, public.editorial_categories,
  public.editorial_documents, public.editorial_space_editors, public.editorial_comments TO authenticated;
GRANT SELECT ON public.editorial_access_sessions, public.editorial_unlock_attempts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.editorial_unlock_attempts_id_seq TO authenticated;

UPDATE public.role_permissions SET permissions = jsonb_set(COALESCE(permissions, '{}'::jsonb), '{editorial}', '{"view":true,"edit":true}'::jsonb, true)
WHERE role::text IN ('admin', 'pastor');

UPDATE public.role_permissions SET permissions = jsonb_set(COALESCE(permissions, '{}'::jsonb), '{editorial}', '{"view":true,"edit":false}'::jsonb, true)
WHERE role::text IN ('leader', 'editor');

UPDATE public.study_programs SET
  title = 'Chicas Sabias',
  summary = 'Club online para chicas jóvenes que desean leer, cultivar un devocional matutino y crecer juntas en una comunidad de fe.',
  description = 'Chicas Sabias es un espacio de acompañamiento para leer en comunidad, conversar con propósito y desarrollar una rutina devocional. Los encuentros se realizan por Google Meet; el libro, la facilitadora, el horario definitivo y el enlace privado se configuran desde el panel cuando estén confirmados.',
  cover_image_url = '/images/programs/chicas-sabias-hero.webp',
  program_type = 'community_group', modality = 'online', access_type = 'approval',
  audience = 'Chicas jóvenes', category = 'Grupos de crecimiento',
  tags = ARRAY['lectura', 'devocional', 'comunidad', 'online'],
  duration_label = 'Encuentros matutinos · horario por confirmar',
  requires_facilitator = true, is_featured = true, status = 'published',
  published_at = COALESCE(published_at, now()), updated_at = now()
WHERE slug = 'chicas-sabias';

INSERT INTO public.study_cohorts (id, program_id, name, description, status, timezone, schedule_text, meeting_provider)
SELECT 'a71caaa0-0000-4000-8000-000000000001', program.id, 'Club Chicas Sabias',
  'Grupo online de lectura, conversación y devocional. El horario y el enlace se compartirán cuando hayan sido confirmados.',
  'planned', 'America/Guayaquil', 'Horario por confirmar con las participantes', 'google_meet'
FROM public.study_programs program WHERE program.slug = 'chicas-sabias'
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description, timezone = EXCLUDED.timezone,
  schedule_text = EXCLUDED.schedule_text, meeting_provider = EXCLUDED.meeting_provider;

INSERT INTO public.study_cohort_private_access (cohort_id, meeting_url, internal_notes)
VALUES ('a71caaa0-0000-4000-8000-000000000001', NULL, 'Agrega aquí el enlace real de Google Meet. Solo lo reciben integrantes activas.')
ON CONFLICT (cohort_id) DO UPDATE SET internal_notes = EXCLUDED.internal_notes;

INSERT INTO public.study_program_sections (id, program_id, title, description, order_index, is_published)
SELECT 'a71cbbb0-0000-4000-8000-000000000001', program.id, 'Comenzamos juntas',
  'Una bienvenida clara antes de iniciar la lectura y los encuentros.', 0, true
FROM public.study_programs program WHERE program.slug = 'chicas-sabias'
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, is_published = true;

INSERT INTO public.study_program_lessons (id, section_id, title, summary, lesson_type, content_blocks, estimated_minutes, order_index, is_preview, is_published)
VALUES (
  'a71cccc0-0000-4000-8000-000000000001', 'a71cbbb0-0000-4000-8000-000000000001',
  'Bienvenida a Chicas Sabias', 'Conoce el propósito del club y prepara tu espacio de lectura.', 'devotional',
  '[{"id":"cs-title","type":"section","title":"Leer, orar y crecer acompañadas"},{"id":"cs-text","type":"text","text":"<p>Este club reúne a chicas jóvenes que desean sostener una práctica de lectura y devocional matutino en comunidad. Cada encuentro abre un espacio para escuchar, reflexionar y acompañarnos con respeto.</p>"},{"id":"cs-note","type":"reflection_note","question_text":"¿Qué esperas cultivar durante tu participación en Chicas Sabias?"}]'::jsonb,
  10, 0, true, true
) ON CONFLICT (id) DO UPDATE SET content_blocks = EXCLUDED.content_blocks, is_published = true;

INSERT INTO public.editorial_spaces (id, slug, name, description, owner_type, program_id, cover_image_url, accent_color, is_published, allow_comments)
SELECT 'ed170000-0000-4000-8000-000000000001', 'chicas-sabias', 'Bitácora de Chicas Sabias',
  'Lecturas, devocionales, anuncios y conversaciones del club.', 'study_program', program.id,
  '/images/programs/chicas-sabias-hero.webp', '#D6A84B', true, true
FROM public.study_programs program WHERE program.slug = 'chicas-sabias'
ON CONFLICT (slug) DO UPDATE SET program_id = EXCLUDED.program_id, cover_image_url = EXCLUDED.cover_image_url, is_published = true;

INSERT INTO public.editorial_categories (id, space_id, name, slug, description, color, order_index) VALUES
  ('ed171000-0000-4000-8000-000000000001', 'ed170000-0000-4000-8000-000000000001', 'Devocionales', 'devocionales', 'Reflexiones para comenzar el día.', '#D6A84B', 0),
  ('ed171000-0000-4000-8000-000000000002', 'ed170000-0000-4000-8000-000000000001', 'Lecturas', 'lecturas', 'Guías y conversaciones sobre la lectura compartida.', '#8B7CF6', 1),
  ('ed171000-0000-4000-8000-000000000003', 'ed170000-0000-4000-8000-000000000001', 'Anuncios', 'anuncios', 'Información práctica del club.', '#38BDF8', 2)
ON CONFLICT (space_id, slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO public.editorial_documents (id, space_id, category_id, document_type, title, slug, excerpt, cover_image_url, content_blocks, visibility, status, published_at, is_featured, order_index)
VALUES (
  'ed172000-0000-4000-8000-000000000001', 'ed170000-0000-4000-8000-000000000001', 'ed171000-0000-4000-8000-000000000003',
  'page', 'Cómo funciona el club', 'como-funciona', 'Una guía breve para conocer la dinámica de Chicas Sabias.', '/images/programs/chicas-sabias-hero.webp',
  '[{"id":"about-title","type":"section","title":"Un club para caminar acompañadas"},{"id":"about-text","type":"text","text":"<p>Nos reunimos online para leer, conversar y cultivar un devocional matutino. El contenido público explica el propósito; los materiales, anuncios y conversaciones del grupo se mantienen dentro del espacio de integrantes.</p>"},{"id":"about-question","type":"question","question_text":"¿Qué tema te gustaría conversar en el club?"}]'::jsonb,
  'public', 'published', now(), true, 0
), (
  'ed172000-0000-4000-8000-000000000002', 'ed170000-0000-4000-8000-000000000001', 'ed171000-0000-4000-8000-000000000003',
  'post', 'Bienvenidas a la bitácora', 'bienvenidas', 'Este será el punto de encuentro interno entre reuniones.', NULL,
  '[{"id":"welcome-title","type":"section","title":"Este espacio también es suyo"},{"id":"welcome-text","type":"text","text":"<p>Aquí podremos publicar anuncios, preguntas para conversar, apuntes de lectura y devocionales. Solo las integrantes autorizadas acceden al contenido interno y pueden participar en los comentarios.</p>"},{"id":"welcome-note","type":"reflection_note","question_text":"Comparte una intención de oración para esta etapa."}]'::jsonb,
  'members', 'published', now(), false, 1
)
ON CONFLICT (space_id, slug) WHERE parent_id IS NULL DO UPDATE SET excerpt = EXCLUDED.excerpt, content_blocks = EXCLUDED.content_blocks, status = 'published';

COMMENT ON TABLE public.editorial_spaces IS 'Espacios editoriales reutilizables para iglesia, ministerios y programas de estudio.';
COMMENT ON TABLE public.editorial_documents IS 'Páginas jerárquicas y publicaciones por bloques; las contraseñas se almacenan únicamente como hash.';
