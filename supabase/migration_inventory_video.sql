-- =======================================================
-- SQL MIGRATION: ADICIÓN DE VIDEO EN INVENTARIO
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS video_url text;
