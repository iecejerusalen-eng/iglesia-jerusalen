CREATE TABLE IF NOT EXISTS public.presentation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.presentation_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published presentation documents" ON public.presentation_documents;
CREATE POLICY "Public can read published presentation documents"
  ON public.presentation_documents FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Authenticated users manage presentation documents" ON public.presentation_documents;
CREATE POLICY "Authenticated users manage presentation documents"
  ON public.presentation_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS presentation_documents_published_idx
  ON public.presentation_documents (updated_at DESC)
  WHERE is_published = true;
