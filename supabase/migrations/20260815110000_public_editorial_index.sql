-- Índice público editorial: una sola fuente de verdad para el hub público.
-- No expone cuerpos privados ni depende de lecturas directas sobre tablas con RLS.

CREATE OR REPLACE FUNCTION public.get_public_editorial_index(p_limit integer DEFAULT 12)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'spaces', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', space.id,
        'name', space.name,
        'slug', space.slug,
        'description', space.description,
        'owner_type', space.owner_type,
        'accent_color', space.accent_color,
        'cover_image_url', space.cover_image_url,
        'allow_comments', space.allow_comments,
        'document_count', (
          SELECT count(*)::integer FROM public.editorial_documents document
          WHERE document.space_id = space.id
            AND (document.status = 'published' OR (document.status = 'scheduled' AND document.scheduled_at <= now()))
            AND (document.published_at IS NULL OR document.published_at <= now())
            AND document.visibility IN ('public', 'password')
        )
      ) ORDER BY space.created_at DESC)
      FROM public.editorial_spaces space
      WHERE space.is_published
    ), '[]'::jsonb),
    'recent_documents', COALESCE((
      SELECT jsonb_agg(item.payload ORDER BY item.published_at DESC NULLS LAST)
      FROM (
        SELECT document.published_at,
          jsonb_build_object(
            'id', document.id,
            'space_id', document.space_id,
            'title', document.title,
            'slug', document.slug,
            'excerpt', document.excerpt,
            'cover_image_url', document.cover_image_url,
            'published_at', document.published_at,
            'is_featured', document.is_featured,
            'space', jsonb_build_object(
              'name', space.name,
              'slug', space.slug,
              'owner_type', space.owner_type,
              'accent_color', space.accent_color
            )
          ) AS payload
        FROM public.editorial_documents document
        JOIN public.editorial_spaces space ON space.id = document.space_id
        WHERE space.is_published
          AND (document.status = 'published' OR (document.status = 'scheduled' AND document.scheduled_at <= now()))
          AND (document.published_at IS NULL OR document.published_at <= now())
          AND document.visibility IN ('public', 'password')
        ORDER BY document.is_featured DESC, document.published_at DESC NULLS LAST
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 48))
      ) item
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_editorial_index(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_editorial_index(integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_editorial_index(integer) IS
  'Devuelve solo metadatos públicos del centro editorial; nunca expone content_blocks ni hashes.';
