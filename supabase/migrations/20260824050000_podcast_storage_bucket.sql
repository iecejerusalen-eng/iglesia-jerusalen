-- Create podcasts storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'podcasts',
  'podcasts',
  true,
  104857600, -- 100MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/m4a'];

-- RLS for podcasts bucket
DROP POLICY IF EXISTS "Podcasts Public Read" ON storage.objects;
CREATE POLICY "Podcasts Public Read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'podcasts');

DROP POLICY IF EXISTS "Podcasts Authenticated Insert" ON storage.objects;
CREATE POLICY "Podcasts Authenticated Insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'podcasts');

DROP POLICY IF EXISTS "Podcasts Authenticated Update" ON storage.objects;
CREATE POLICY "Podcasts Authenticated Update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'podcasts');

DROP POLICY IF EXISTS "Podcasts Authenticated Delete" ON storage.objects;
CREATE POLICY "Podcasts Authenticated Delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'podcasts');
