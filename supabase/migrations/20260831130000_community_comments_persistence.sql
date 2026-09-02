-- Comentarios comunitarios: lectura pública, escritura autenticada y contador sincronizado.

DROP POLICY IF EXISTS "Authenticated insert community comments" ON public.community_comments;
DROP POLICY IF EXISTS "Authenticated community comment submission" ON public.community_comments;
CREATE POLICY "Authenticated community comment submission"
  ON public.community_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND length(trim(content)) BETWEEN 1 AND 2000
    AND length(trim(author_name)) BETWEEN 1 AND 120
  );

CREATE OR REPLACE FUNCTION public.create_community_comment(
  p_post_id uuid,
  p_author_name text,
  p_content text
)
RETURNS public.community_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  current_user_id uuid := (select auth.uid());
  created_comment public.community_comments;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para comentar.' USING errcode = '42501';
  END IF;
  IF length(trim(coalesce(p_author_name, ''))) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'El nombre no es válido.' USING errcode = '22023';
  END IF;
  IF length(trim(coalesce(p_content, ''))) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'El comentario debe tener entre 1 y 2000 caracteres.' USING errcode = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.community_posts WHERE id = p_post_id AND status = 'published') THEN
    RAISE EXCEPTION 'La publicación no está disponible.' USING errcode = 'P0002';
  END IF;

  INSERT INTO public.community_comments (post_id, author_name, content)
  VALUES (p_post_id, trim(p_author_name), trim(p_content))
  RETURNING * INTO created_comment;

  UPDATE public.community_posts
  SET comments_count = (
    SELECT count(*)::integer FROM public.community_comments WHERE post_id = p_post_id
  ), updated_at = now()
  WHERE id = p_post_id;

  RETURN created_comment;
END;
$$;

REVOKE ALL ON FUNCTION public.create_community_comment(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_community_comment(uuid, text, text) TO authenticated;
