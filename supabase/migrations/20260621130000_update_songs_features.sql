-- =======================================================
-- SQL MIGRATION: UPDATE SONGS FEATURES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- Agregar columnas para estilos de batería, links de recursos e información estructurada en public.songs
ALTER TABLE public.songs 
  ADD COLUMN IF NOT EXISTS drum_style text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resource_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS structure_blocks jsonb DEFAULT '[]'::jsonb;
