-- Persistencia segura de reacciones de comunidad.
-- Requiere que 20260824000000_competitive_suite_core.sql ya exista.

CREATE INDEX IF NOT EXISTS idx_community_likes_user_post
  ON public.community_likes (user_id, post_id);

DROP POLICY IF EXISTS "Public community likes read" ON public.community_likes;
DROP POLICY IF EXISTS "Authenticated read own community likes" ON public.community_likes;
CREATE POLICY "Authenticated read own community likes"
  ON public.community_likes
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated insert community likes" ON public.community_likes;
CREATE POLICY "Authenticated insert own community likes"
  ON public.community_likes
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated delete own community likes" ON public.community_likes;
CREATE POLICY "Authenticated delete own community likes"
  ON public.community_likes
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.toggle_community_like(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  current_user_id uuid := (select auth.uid());
  next_state boolean;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para reaccionar.' USING errcode = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.community_posts
    WHERE id = p_post_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'La publicación no está disponible.' USING errcode = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.community_likes
    WHERE post_id = p_post_id AND user_id = current_user_id
  ) THEN
    DELETE FROM public.community_likes
    WHERE post_id = p_post_id AND user_id = current_user_id;
    next_state := false;
  ELSE
    INSERT INTO public.community_likes (post_id, user_id)
    VALUES (p_post_id, current_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    next_state := true;
  END IF;

  UPDATE public.community_posts
  SET likes_count = (
    SELECT count(*)::integer FROM public.community_likes
    WHERE post_id = p_post_id
  ), updated_at = now()
  WHERE id = p_post_id;

  RETURN next_state;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_community_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_community_like(uuid) TO authenticated;
