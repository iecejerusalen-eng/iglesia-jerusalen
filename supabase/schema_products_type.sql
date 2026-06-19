-- =======================================================
-- SCRIPT SQL: ADICIÓN DE TIPO A PRODUCTOS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Añadir columna type a la tabla products si no existe
alter table public.products add column if not exists type text default 'Físico' check (type in ('Físico', 'Digital'));
