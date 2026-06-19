-- =======================================================
-- SQL MIGRATION: ADICIÓN DE BLOQUES DE CONTENIDO Y EDITOR DE PÁGINAS (HOME / NOSOTROS)
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Agregar columna content_blocks a la tabla de ministerios para guardar la estructura JSON de bloques
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS content_blocks jsonb;

-- 2. Crear la tabla page_contents para almacenar secciones de páginas públicas (Home, Nosotros, etc.)
CREATE TABLE IF NOT EXISTS public.page_contents (
  id text PRIMARY KEY, -- ej: 'home_hero', 'about_hero', 'about_history', etc.
  page text NOT NULL, -- ej: 'home', 'about'
  section text NOT NULL, -- ej: 'hero', 'history', 'pillars'
  title text,
  subtitle text,
  content_blocks jsonb, -- Estructura JSON de los bloques dinámicos
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en page_contents
ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para page_contents
DROP POLICY IF EXISTS "Permitir lectura pública de page_contents" ON public.page_contents;
CREATE POLICY "Permitir lectura pública de page_contents"
  ON public.page_contents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir gestión completa de page_contents a admin y pastor" ON public.page_contents;
CREATE POLICY "Permitir gestión completa de page_contents a admin y pastor"
  ON public.page_contents FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );
