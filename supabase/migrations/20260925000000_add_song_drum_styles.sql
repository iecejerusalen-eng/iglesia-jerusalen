-- Migration: Add song_drum_styles table for custom drum rhythms and patterns
CREATE TABLE IF NOT EXISTS public.song_drum_styles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.song_drum_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de toques de batería" ON public.song_drum_styles;
CREATE POLICY "Lectura pública de toques de batería"
  ON public.song_drum_styles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de toques de batería por roles autorizados" ON public.song_drum_styles;
CREATE POLICY "Gestión de toques de batería por roles autorizados"
  ON public.song_drum_styles FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'leader', 'editor', 'maestro')
    )
  );

-- Insert default drum styles
INSERT INTO public.song_drum_styles (name) VALUES
  ('Balada Worship'),
  ('Pop Worship 4/4'),
  ('Rock 1/4 (Marcado en Negras)'),
  ('Rock 1/2 (Marcado en Corcheas)'),
  ('Worship 6/8'),
  ('Worship 4/4 (Balada Rítmica)'),
  ('Pop/Rock 4/4'),
  ('Funk / Gospel'),
  ('Disco / Folk (Corito Rápido)'),
  ('Cumbia Cristiana'),
  ('Vals 3/4'),
  ('Marcha'),
  ('Acústico / Sin Batería')
ON CONFLICT (name) DO NOTHING;
