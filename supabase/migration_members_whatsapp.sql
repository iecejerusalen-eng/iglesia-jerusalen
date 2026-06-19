-- =======================================================
-- SQL MIGRATION: CÓDIGO DE PAÍS DE TELÉFONO PARA MIEMBROS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE PARA APLICAR
-- =======================================================

-- 1. Modificar la tabla de miembros (members) para guardar el código de país del teléfono
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS phone_country_code text DEFAULT '+593';

-- 2. Actualizar registros existentes para que tengan por defecto el código de Ecuador
UPDATE public.members SET phone_country_code = '+593' WHERE phone_country_code IS NULL;
