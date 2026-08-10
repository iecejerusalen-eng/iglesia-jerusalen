-- Hierarchical ministry pages with protected content and a four-level limit.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE public.ministry_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.ministry_pages(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 120),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text NOT NULL DEFAULT '' CHECK (char_length(excerpt) <= 320),
  cover_image_url text,
  icon text NOT NULL DEFAULT 'file-text' CHECK (char_length(icon) <= 40),
  depth smallint NOT NULL DEFAULT 1 CHECK (depth BETWEEN 1 AND 4),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_password_protected boolean NOT NULL DEFAULT false,
  seo_title text CHECK (char_length(seo_title) <= 70),
  seo_description text CHECK (char_length(seo_description) <= 170),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ministry_pages_root_slug_uidx
  ON public.ministry_pages (ministry_id, slug)
  WHERE parent_id IS NULL;
CREATE UNIQUE INDEX ministry_pages_child_slug_uidx
  ON public.ministry_pages (parent_id, slug)
  WHERE parent_id IS NOT NULL;
CREATE INDEX ministry_pages_tree_idx
  ON public.ministry_pages (ministry_id, parent_id, sort_order, title);
CREATE INDEX ministry_pages_public_idx
  ON public.ministry_pages (ministry_id, status, parent_id, sort_order);
CREATE INDEX ministry_pages_parent_fk_idx ON public.ministry_pages (parent_id);
CREATE INDEX ministry_pages_created_by_fk_idx ON public.ministry_pages (created_by);
CREATE INDEX ministry_pages_updated_by_fk_idx ON public.ministry_pages (updated_by);

CREATE TABLE public.ministry_page_contents (
  page_id uuid PRIMARY KEY REFERENCES public.ministry_pages(id) ON DELETE CASCADE,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(content_blocks) = 'array'),
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery) = 'array'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE private.ministry_page_secrets (
  page_id uuid PRIMARY KEY REFERENCES public.ministry_pages(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE private.ministry_page_secrets FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.can_manage_ministry_page(target_ministry_id uuid)
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
        profile.role::text = 'admin'
        OR 'admin' = ANY(COALESCE(profile.roles::text[], '{}'::text[]))
        OR (
          (
            profile.ministry_id = target_ministry_id
            AND (
              profile.role::text = 'leader'
              OR 'leader' = ANY(COALESCE(profile.roles::text[], '{}'::text[]))
            )
          )
          OR (
            (
              COALESCE((profile.permissions_override->'ministries'->>'edit')::boolean, false)
              OR EXISTS (
                SELECT 1
                FROM public.role_permissions permission
                WHERE permission.role::text = ANY(
                  ARRAY[profile.role::text] || COALESCE(profile.roles::text[], '{}'::text[])
                )
                  AND COALESCE((permission.permissions->'ministries'->>'edit')::boolean, false)
              )
              OR EXISTS (
                SELECT 1
                FROM public.access_roles access_role
                WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, '{}'::uuid[]))
                  AND access_role.is_active
                  AND COALESCE((access_role.permissions->'ministries'->>'edit')::boolean, false)
              )
            )
            AND (
              COALESCE(cardinality(profile.allowed_ministries), 0) = 0
              OR target_ministry_id = ANY(profile.allowed_ministries)
              OR profile.ministry_id = target_ministry_id
            )
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION private.can_manage_ministry_page(uuid) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_ministry_page(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_ministry_page_tree()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  parent_page public.ministry_pages%ROWTYPE;
  creates_cycle boolean;
  deepest_descendant_depth smallint;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 1;
  ELSE
    SELECT * INTO parent_page
    FROM public.ministry_pages
    WHERE id = NEW.parent_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'La página superior ya no existe.';
    END IF;
    IF parent_page.ministry_id <> NEW.ministry_id THEN
      RAISE EXCEPTION 'La página superior pertenece a otro ministerio.';
    END IF;
    IF NEW.id IS NOT NULL AND NEW.parent_id = NEW.id THEN
      RAISE EXCEPTION 'Una página no puede depender de sí misma.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      WITH RECURSIVE descendants AS (
        SELECT page.id FROM public.ministry_pages page WHERE page.parent_id = NEW.id
        UNION ALL
        SELECT child.id
        FROM public.ministry_pages child
        JOIN descendants parent ON child.parent_id = parent.id
      )
      SELECT EXISTS (SELECT 1 FROM descendants WHERE id = NEW.parent_id)
      INTO creates_cycle;
      IF creates_cycle THEN
        RAISE EXCEPTION 'La jerarquía produciría un ciclo.';
      END IF;

      SELECT max(page.depth) INTO deepest_descendant_depth
      FROM public.ministry_pages page
      WHERE page.id = NEW.id OR page.id IN (
        WITH RECURSIVE descendants AS (
          SELECT child.id FROM public.ministry_pages child WHERE child.parent_id = NEW.id
          UNION ALL
          SELECT child.id FROM public.ministry_pages child JOIN descendants parent ON child.parent_id = parent.id
        )
        SELECT id FROM descendants
      );
      IF COALESCE(deepest_descendant_depth, OLD.depth) - OLD.depth + NEW.depth > 4 THEN
        RAISE EXCEPTION 'Al mover esta rama se superarían los cuatro niveles permitidos.';
      END IF;
    END IF;

    NEW.depth := parent_page.depth + 1;
  END IF;

  IF NEW.depth > 4 THEN
    RAISE EXCEPTION 'Las subpáginas admiten un máximo de cuatro niveles.';
  END IF;

  NEW.updated_at := now();
  NEW.updated_by := COALESCE((SELECT auth.uid()), NEW.updated_by);
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status <> 'published') THEN
    NEW.published_at := now();
  ELSIF NEW.status = 'draft' THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_ministry_page_tree_before_write
  BEFORE INSERT OR UPDATE ON public.ministry_pages
  FOR EACH ROW EXECUTE FUNCTION public.validate_ministry_page_tree();

CREATE OR REPLACE FUNCTION public.refresh_ministry_page_descendant_depths()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.depth IS DISTINCT FROM NEW.depth THEN
    WITH RECURSIVE descendants AS (
      SELECT child.id, NEW.depth + 1 AS calculated_depth
      FROM public.ministry_pages child
      WHERE child.parent_id = NEW.id
      UNION ALL
      SELECT child.id, parent.calculated_depth + 1
      FROM public.ministry_pages child
      JOIN descendants parent ON child.parent_id = parent.id
    )
    UPDATE public.ministry_pages page
    SET depth = descendants.calculated_depth
    FROM descendants
    WHERE page.id = descendants.id
      AND page.depth IS DISTINCT FROM descendants.calculated_depth;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_ministry_page_descendant_depths_after_update
  AFTER UPDATE OF parent_id, depth ON public.ministry_pages
  FOR EACH ROW EXECUTE FUNCTION public.refresh_ministry_page_descendant_depths();

CREATE OR REPLACE FUNCTION public.touch_ministry_page_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_ministry_page_content_before_update
  BEFORE UPDATE ON public.ministry_page_contents
  FOR EACH ROW EXECUTE FUNCTION public.touch_ministry_page_content();

ALTER TABLE public.ministry_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_page_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published ministry pages are public"
  ON public.ministry_pages FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Ministry managers read every page"
  ON public.ministry_pages FOR SELECT TO authenticated
  USING ((SELECT private.can_manage_ministry_page(ministry_id)));
CREATE POLICY "Ministry managers insert pages"
  ON public.ministry_pages FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.can_manage_ministry_page(ministry_id)));
CREATE POLICY "Ministry managers update pages"
  ON public.ministry_pages FOR UPDATE TO authenticated
  USING ((SELECT private.can_manage_ministry_page(ministry_id)))
  WITH CHECK ((SELECT private.can_manage_ministry_page(ministry_id)));
CREATE POLICY "Ministry managers delete pages"
  ON public.ministry_pages FOR DELETE TO authenticated
  USING ((SELECT private.can_manage_ministry_page(ministry_id)));

CREATE POLICY "Ministry managers read page contents"
  ON public.ministry_page_contents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministry_pages page
      WHERE page.id = page_id
        AND (SELECT private.can_manage_ministry_page(page.ministry_id))
    )
  );
CREATE POLICY "Ministry managers insert page contents"
  ON public.ministry_page_contents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ministry_pages page
      WHERE page.id = page_id
        AND (SELECT private.can_manage_ministry_page(page.ministry_id))
    )
  );
CREATE POLICY "Ministry managers update page contents"
  ON public.ministry_page_contents FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministry_pages page
      WHERE page.id = page_id
        AND (SELECT private.can_manage_ministry_page(page.ministry_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ministry_pages page
      WHERE page.id = page_id
        AND (SELECT private.can_manage_ministry_page(page.ministry_id))
    )
  );
CREATE POLICY "Ministry managers delete page contents"
  ON public.ministry_page_contents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministry_pages page
      WHERE page.id = page_id
        AND (SELECT private.can_manage_ministry_page(page.ministry_id))
    )
  );

GRANT SELECT ON public.ministry_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ministry_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ministry_page_contents TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ministry_page_content(
  p_page_id uuid,
  p_password text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_page public.ministry_pages%ROWTYPE;
  target_content public.ministry_page_contents%ROWTYPE;
  stored_hash text;
BEGIN
  SELECT * INTO target_page
  FROM public.ministry_pages
  WHERE id = p_page_id AND status = 'published';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Página no disponible.' USING ERRCODE = 'P0002';
  END IF;

  IF target_page.is_password_protected THEN
    SELECT secret.password_hash INTO stored_hash
    FROM private.ministry_page_secrets secret
    WHERE secret.page_id = p_page_id;
    IF stored_hash IS NULL OR p_password IS NULL
      OR extensions.crypt(p_password, stored_hash) <> stored_hash THEN
      RAISE EXCEPTION 'Contraseña incorrecta.' USING ERRCODE = '28000';
    END IF;
  END IF;

  SELECT * INTO target_content
  FROM public.ministry_page_contents
  WHERE page_id = p_page_id;

  RETURN jsonb_build_object(
    'content_blocks', COALESCE(target_content.content_blocks, '[]'::jsonb),
    'gallery', COALESCE(target_content.gallery, '[]'::jsonb),
    'updated_at', target_content.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_ministry_page_content(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ministry_page_content(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_ministry_page_password(
  p_page_id uuid,
  p_password text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_ministry_id uuid;
  normalized_password text := NULLIF(trim(COALESCE(p_password, '')), '');
BEGIN
  SELECT page.ministry_id INTO target_ministry_id
  FROM public.ministry_pages page
  WHERE page.id = p_page_id;

  IF target_ministry_id IS NULL OR NOT private.can_manage_ministry_page(target_ministry_id) THEN
    RAISE EXCEPTION 'No tienes permiso para proteger esta página.' USING ERRCODE = '42501';
  END IF;
  IF normalized_password IS NOT NULL AND char_length(normalized_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres.' USING ERRCODE = '22023';
  END IF;

  IF normalized_password IS NULL THEN
    DELETE FROM private.ministry_page_secrets WHERE page_id = p_page_id;
    UPDATE public.ministry_pages SET is_password_protected = false WHERE id = p_page_id;
  ELSE
    INSERT INTO private.ministry_page_secrets (page_id, password_hash, updated_at)
    VALUES (p_page_id, extensions.crypt(normalized_password, extensions.gen_salt('bf', 10)), now())
    ON CONFLICT (page_id) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, updated_at = now();
    UPDATE public.ministry_pages SET is_password_protected = true WHERE id = p_page_id;
  END IF;
  RETURN normalized_password IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.set_ministry_page_password(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_ministry_page_password(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.validate_ministry_page_tree() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_ministry_page_descendant_depths() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_ministry_page_content() FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.ministry_pages IS 'Árbol público de subpáginas de ministerios, con un máximo de cuatro niveles.';
COMMENT ON TABLE public.ministry_page_contents IS 'Bloques editoriales y galerías; el acceso público ocurre exclusivamente mediante RPC.';
