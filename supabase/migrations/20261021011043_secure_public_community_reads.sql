DROP POLICY IF EXISTS "Public community comments read" ON public.community_comments;
CREATE POLICY "Public can read comments on published community posts"
  ON public.community_comments
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_posts AS post
      WHERE post.id = community_comments.post_id
        AND post.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Allow public read prayer wall" ON public.prayer_wall_posts;
REVOKE SELECT ON TABLE public.prayer_wall_posts FROM anon;

DROP POLICY IF EXISTS "Allow auth insert prayer wall" ON public.prayer_wall_posts;
CREATE POLICY "Members can submit their own prayer wall posts"
  ON public.prayer_wall_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow author update prayer wall" ON public.prayer_wall_posts;
CREATE POLICY "Authors and pastoral staff can update prayer wall posts"
  ON public.prayer_wall_posts
  FOR UPDATE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role IN ('admin', 'pastor')
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role IN ('admin', 'pastor')
    )
  );

CREATE POLICY "Authors and pastoral staff can read prayer wall posts"
  ON public.prayer_wall_posts
  FOR SELECT
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role IN ('admin', 'pastor')
    )
  );
