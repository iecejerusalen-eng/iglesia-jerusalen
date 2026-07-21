-- =======================================================
-- SQL MIGRATION: ECOISISTEMAS DE DISCIPULADO, PRODUCCIÓN Y EN VIVO
-- =======================================================

-- -------------------------------------------------------
-- 1. ÉPICA 1: DISCIPULADO Y GAMIFICACIÓN
-- -------------------------------------------------------

-- 1a. Planes de Lectura
CREATE TABLE IF NOT EXISTS public.reading_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  total_chapters integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de planes de lectura" ON public.reading_plans;
CREATE POLICY "Lectura pública de planes de lectura"
  ON public.reading_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de planes de lectura por Admin" ON public.reading_plans;
CREATE POLICY "Gestión de planes de lectura por Admin"
  ON public.reading_plans FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- 1b. Progreso de Lectura por Usuario
CREATE TABLE IF NOT EXISTS public.user_reading_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.reading_plans(id) ON DELETE CASCADE NOT NULL,
  completed_chapters integer DEFAULT 0 NOT NULL,
  last_read_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, plan_id)
);

ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de propio progreso" ON public.user_reading_progress;
CREATE POLICY "Lectura de propio progreso"
  ON public.user_reading_progress FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Lectura de progreso global por todos" ON public.user_reading_progress;
CREATE POLICY "Lectura de progreso global por todos"
  ON public.user_reading_progress FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Modificación de propio progreso" ON public.user_reading_progress;
CREATE POLICY "Modificación de propio progreso"
  ON public.user_reading_progress FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 1c. Insignias (Badges)
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de insignias" ON public.badges;
CREATE POLICY "Lectura pública de insignias"
  ON public.badges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de insignias por Admin" ON public.badges;
CREATE POLICY "Gestión de insignias por Admin"
  ON public.badges FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- 1d. Insignias Ganadas por Usuario
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de propias insignias" ON public.user_badges;
CREATE POLICY "Lectura de propias insignias"
  ON public.user_badges FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Lectura pública de insignias de otros" ON public.user_badges;
CREATE POLICY "Lectura pública de insignias de otros"
  ON public.user_badges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Adquisición de insignias por usuario" ON public.user_badges;
CREATE POLICY "Adquisición de insignias por usuario"
  ON public.user_badges FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- -------------------------------------------------------
-- 2. ÉPICA 2: LOGÍSTICA Y PRODUCCIÓN INTERNA
-- -------------------------------------------------------

-- 2a. Estatus de producción tipo Kanban
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'production_ticket_status') THEN
    CREATE TYPE public.production_ticket_status AS ENUM ('backlog', 'todo', 'in_progress', 'done');
  END IF;
END
$$;

-- 2b. Tabla de Tickets de Producción
CREATE TABLE IF NOT EXISTS public.production_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  material_type text, -- acrílico, madera MDF de 3mm, vinil, etc.
  dimensions text,    -- medidas, ej. 100x150cm
  machinery_required text, -- corte láser, plotter, etc.
  status public.production_ticket_status DEFAULT 'todo' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.production_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de tickets para usuarios autenticados" ON public.production_tickets;
CREATE POLICY "Lectura de tickets para usuarios autenticados"
  ON public.production_tickets FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Gestión total de tickets por roles de staff" ON public.production_tickets;
CREATE POLICY "Gestión total de tickets por roles de staff"
  ON public.production_tickets FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('admin', 'multimedia', 'editor', 'secretary', 'pastor')
    )
  );

-- 2c. Storage Bucket: media_vault (Privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media_vault', 'media_vault', false, 104857600, NULL) -- límite de 100MB
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para media_vault
DROP POLICY IF EXISTS "Acceso total a media_vault para Admin y Multimedia" ON storage.objects;
CREATE POLICY "Acceso total a media_vault para Admin y Multimedia"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'media_vault' AND
  exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'multimedia')
  )
);

-- -------------------------------------------------------
-- 3. ÉPICA 3: EXPERIENCIA DOMINICAL (MODO EN VIVO)
-- -------------------------------------------------------

-- 3a. Notas privadas de Sermones por usuario
CREATE TABLE IF NOT EXISTS public.sermon_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sermon_id uuid REFERENCES public.sermons(id) ON DELETE CASCADE, -- opcional si es un sermón guardado en BD, o null para notas generales del domingo
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sermon_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de propias notas de sermones" ON public.sermon_notes;
CREATE POLICY "Lectura de propias notas de sermones"
  ON public.sermon_notes FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Modificación de propias notas" ON public.sermon_notes;
CREATE POLICY "Modificación de propias notas"
  ON public.sermon_notes FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Sembrar insignias iniciales de muestra
INSERT INTO public.badges (name, description, image_url) VALUES
  ('Primeros Pasos', 'Completa tu primer capítulo del plan de lectura bíblica.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=150'),
  ('Explorador Bíblico', 'Completa el 50% de tu plan de lectura bíblica.', 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=150'),
  ('Erudito de la Palabra', 'Completa el 100% de tu plan de lectura bíblica.', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=150'),
  ('Campeón Dominical', 'Completa la lección de Escuela Dominical o juego de aprendizaje.', 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=150')
ON CONFLICT (name) DO NOTHING;

-- Sembrar plan de lectura de muestra
INSERT INTO public.reading_plans (title, description, total_chapters) VALUES
  ('Plan de Lectura del Nuevo Testamento', 'Acompaña a la iglesia a leer el Nuevo Testamento completo capítulo por capítulo.', 260)
ON CONFLICT DO NOTHING;
