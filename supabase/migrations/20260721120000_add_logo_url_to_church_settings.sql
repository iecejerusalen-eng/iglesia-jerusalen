-- Migración: Añadir columna logo_url a church_settings para favicon/logo personalizado y evitar error 400
ALTER TABLE public.church_settings ADD COLUMN IF NOT EXISTS logo_url text;
