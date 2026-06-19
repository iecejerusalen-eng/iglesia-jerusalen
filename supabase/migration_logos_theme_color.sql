-- =======================================================
-- SQL MIGRATION: CATÁLOGO DE LOGOS Y COLOR DE TEMA PARA MINISTERIOS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Actualizar la tabla ministries con la columna theme_color
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) DEFAULT '#1E3A8A';

-- 2. Crear los tipos ENUM para variantes y modos de color si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'logo_variant') THEN
    CREATE TYPE logo_variant AS ENUM ('cuadrado', 'circular', 'vertical', 'horizontal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'logo_color_mode') THEN
    CREATE TYPE logo_color_mode AS ENUM ('color', 'blanco_y_negro', 'blanco_solido', 'negro_solido');
  END IF;
END $$;

-- 3. Crear la tabla logos
CREATE TABLE IF NOT EXISTS public.logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE, -- NULL indica logo general de la Iglesia
  variant logo_variant NOT NULL,
  color_mode logo_color_mode NOT NULL,
  format VARCHAR(10) NOT NULL, -- 'png', 'svg', 'webp', 'ai', 'jpg', etc.
  storage_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para la tabla logos
ALTER TABLE public.logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de logos" ON public.logos;
CREATE POLICY "Permitir lectura pública de logos"
  ON public.logos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir gestión de logos a administradores" ON public.logos;
CREATE POLICY "Permitir gestión de logos a administradores"
  ON public.logos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pastor')
    )
  );

-- 4. Crear el Bucket de Almacenamiento "logos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para el Bucket de logos
DROP POLICY IF EXISTS "Permitir lectura pública de logos en storage" ON storage.objects;
CREATE POLICY "Permitir lectura pública de logos en storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Permitir subir logos a administradores" ON storage.objects;
CREATE POLICY "Permitir subir logos a administradores"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pastor')
    )
  ));

DROP POLICY IF EXISTS "Permitir actualizar/eliminar logos a administradores" ON storage.objects;
CREATE POLICY "Permitir actualizar/eliminar logos a administradores"
  ON storage.objects FOR ALL
  USING (bucket_id = 'logos' AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'pastor')
    )
  ));
