-- Shared photo galleries for each public ministry and department.
CREATE TABLE IF NOT EXISTS public.ministry_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '' CHECK (char_length(alt_text) <= 160),
  caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 180),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ministry_gallery_items_public_order_idx
  ON public.ministry_gallery_items (ministry_id, sort_order, created_at DESC);

ALTER TABLE public.ministry_gallery_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.ministry_gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ministry_gallery_items TO authenticated;

DROP POLICY IF EXISTS "Public can read ministry gallery photos" ON public.ministry_gallery_items;
CREATE POLICY "Public can read ministry gallery photos"
  ON public.ministry_gallery_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Ministry managers add gallery photos" ON public.ministry_gallery_items;
CREATE POLICY "Ministry managers add gallery photos"
  ON public.ministry_gallery_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.can_manage_ministry_page(ministry_id)));

DROP POLICY IF EXISTS "Ministry managers edit gallery photos" ON public.ministry_gallery_items;
CREATE POLICY "Ministry managers edit gallery photos"
  ON public.ministry_gallery_items
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.can_manage_ministry_page(ministry_id)))
  WITH CHECK ((SELECT private.can_manage_ministry_page(ministry_id)));

DROP POLICY IF EXISTS "Ministry managers remove gallery photos" ON public.ministry_gallery_items;
CREATE POLICY "Ministry managers remove gallery photos"
  ON public.ministry_gallery_items
  FOR DELETE
  TO authenticated
  USING ((SELECT private.can_manage_ministry_page(ministry_id)));
