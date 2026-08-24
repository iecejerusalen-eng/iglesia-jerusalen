-- Catálogo común para que los módulos no dependan de un único proveedor.
ALTER TABLE public.media_vault_files
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS folder TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.media_vault_files
  DROP CONSTRAINT IF EXISTS media_vault_files_provider_check;

ALTER TABLE public.media_vault_files
  ADD CONSTRAINT media_vault_files_provider_check
  CHECK (provider IN ('cloudinary', 'supabase', 'r2', 'external', 'legacy'));

CREATE INDEX IF NOT EXISTS idx_media_vault_files_provider
  ON public.media_vault_files (provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_vault_files_folder
  ON public.media_vault_files (folder, created_at DESC);

DROP POLICY IF EXISTS "media_vault_manage_update" ON public.media_vault_files;
CREATE POLICY "media_vault_manage_update" ON public.media_vault_files
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'pastor', 'leader', 'multimedia')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'pastor', 'leader', 'multimedia')
  ));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media_library',
  'media_library',
  true,
  26214400,
  ARRAY['image/*', 'video/*', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_library_public_read" ON storage.objects;
CREATE POLICY "media_library_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media_library');

DROP POLICY IF EXISTS "media_library_staff_insert" ON storage.objects;
CREATE POLICY "media_library_staff_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media_library'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'pastor', 'leader', 'multimedia')
    )
  );

DROP POLICY IF EXISTS "media_library_staff_delete" ON storage.objects;
CREATE POLICY "media_library_staff_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media_library'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'pastor', 'leader', 'multimedia')
    )
  );
