ALTER TABLE public.editorial_documents
  ADD COLUMN IF NOT EXISTS cover_media_type text NOT NULL DEFAULT 'image'
    CHECK (cover_media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS cover_video_url text;

CREATE OR REPLACE FUNCTION public.get_public_editorial_index(p_limit integer DEFAULT 12)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'spaces', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', space.id, 'name', space.name, 'slug', space.slug, 'description', space.description,
      'owner_type', space.owner_type, 'accent_color', space.accent_color,
      'cover_image_url', space.cover_image_url, 'allow_comments', space.allow_comments,
      'document_count', (SELECT count(*)::integer FROM public.editorial_documents document
        WHERE document.space_id = space.id AND (document.status = 'published' OR (document.status = 'scheduled' AND document.scheduled_at <= now()))
        AND (document.published_at IS NULL OR document.published_at <= now()) AND document.visibility IN ('public', 'password'))
    ) ORDER BY space.created_at DESC) FROM public.editorial_spaces space WHERE space.is_published), '[]'::jsonb),
    'recent_documents', COALESCE((SELECT jsonb_agg(item.payload ORDER BY item.published_at DESC NULLS LAST) FROM (
      SELECT document.published_at, jsonb_build_object(
        'id', document.id, 'space_id', document.space_id, 'title', document.title, 'slug', document.slug,
        'excerpt', document.excerpt, 'cover_image_url', document.cover_image_url,
        'cover_media_type', document.cover_media_type, 'cover_video_url', document.cover_video_url,
        'published_at', document.published_at, 'is_featured', document.is_featured,
        'space', jsonb_build_object('name', space.name, 'slug', space.slug, 'owner_type', space.owner_type, 'accent_color', space.accent_color)
      ) AS payload
      FROM public.editorial_documents document JOIN public.editorial_spaces space ON space.id = document.space_id
      WHERE space.is_published AND (document.status = 'published' OR (document.status = 'scheduled' AND document.scheduled_at <= now()))
        AND (document.published_at IS NULL OR document.published_at <= now()) AND document.visibility IN ('public', 'password')
      ORDER BY document.is_featured DESC, document.published_at DESC NULLS LAST LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 48))
    ) item), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_editorial_index(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_editorial_index(integer) TO anon, authenticated;

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
      'excerpt', document.excerpt, 'cover_image_url', document.cover_image_url,
      'cover_media_type', document.cover_media_type, 'cover_video_url', document.cover_video_url,
      'visibility', document.visibility,
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
      'cover_image_url', document_row.cover_image_url, 'cover_media_type', document_row.cover_media_type,
      'cover_video_url', document_row.cover_video_url, 'visibility', document_row.visibility,
      'published_at', document_row.published_at, 'allow_comments', document_row.allow_comments,
      'content_blocks', CASE WHEN allowed THEN document_row.content_blocks ELSE NULL END)
  );
END;
$$;
