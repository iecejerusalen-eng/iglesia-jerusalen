-- =======================================================
-- SQL MIGRATION: ROL EDITOR, RESPUESTAS CUESTIONARIO Y LOG DE NOTIFICACIONES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Agregar el rol 'editor' al enum 'user_role'
-- Nota: En PostgreSQL, la alteración de enums se realiza con ALTER TYPE.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'editor';

-- 2. Crear la tabla de respuestas a cuestionarios/trivias (form_responses)
CREATE TABLE IF NOT EXISTS public.form_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id text NOT NULL,
  page_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_name text,
  member_email text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer DEFAULT 0,
  max_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en form_responses
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para form_responses
DROP POLICY IF EXISTS "Permitir lectura de respuestas a personal autorizado" ON public.form_responses;
CREATE POLICY "Permitir lectura de respuestas a personal autorizado"
  ON public.form_responses FOR SELECT
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
    )
  );

DROP POLICY IF EXISTS "Permitir lectura de respuestas propias" ON public.form_responses;
CREATE POLICY "Permitir lectura de respuestas propias"
  ON public.form_responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir inserción pública de respuestas" ON public.form_responses;
CREATE POLICY "Permitir inserción pública de respuestas"
  ON public.form_responses FOR INSERT
  WITH CHECK (true);


-- 3. Crear la tabla de historial de notificaciones (notification_logs)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('whatsapp', 'push')),
  title text NOT NULL,
  message text NOT NULL,
  recipient_group text NOT NULL,
  status text DEFAULT 'enviado' NOT NULL CHECK (status IN ('enviado', 'fallido', 'programado')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para notification_logs
DROP POLICY IF EXISTS "Permitir gestión de notificaciones a personal autorizado" ON public.notification_logs;
CREATE POLICY "Permitir gestión de notificaciones a personal autorizado"
  ON public.notification_logs FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
    )
  );


-- 4. Actualizar Políticas de RLS de las tablas de contenido para incorporar al Rol 'editor'

-- A. Contenidos de Página (page_contents)
DROP POLICY IF EXISTS "Permitir gestión completa de page_contents a admin y pastor" ON public.page_contents;
CREATE POLICY "Permitir gestión completa de page_contents a admin, pastor y editor"
  ON public.page_contents FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor')
    )
  );

-- B. Sermones (sermons)
DROP POLICY IF EXISTS "Permitir gestión de sermones a administradores" ON public.sermons;
CREATE POLICY "Permitir gestión de sermones a administradores y editores"
  ON public.sermons FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor')
    )
  );

-- C. Ministerios (ministries)
DROP POLICY IF EXISTS "Permitir gestión de ministerios a administradores" ON public.ministries;
CREATE POLICY "Permitir gestión de ministerios a administradores y editores"
  ON public.ministries FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor')
    )
  );

-- D. Eventos (events)
DROP POLICY IF EXISTS "Permitir gestión completa a admin, pastor y secretaria" ON public.events;
CREATE POLICY "Permitir gestión completa a admin, pastor, secretaria y editor"
  ON public.events FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
    )
  );
