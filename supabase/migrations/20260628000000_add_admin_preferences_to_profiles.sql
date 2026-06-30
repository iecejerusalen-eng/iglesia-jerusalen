-- =======================================================
-- SCRIPT SQL: PREFERENCIAS DEL PANEL ADMIN POR USUARIO
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Añadir columna JSONB para guardar las preferencias del panel de admin por usuario.
-- Usamos JSONB para tener flexibilidad sin necesidad de alterar la tabla si agregamos más configuraciones.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_preferences JSONB DEFAULT '{}'::jsonb;

-- 2. Asegurarse de que el RLS permita a los usuarios leer y actualizar su propia columna.
-- Dado que perfiles (profiles) generalmente ya tiene una política "Users can view own profile" 
-- y "Users can update own profile", el campo jsonb estará cubierto. 

-- Si no existe una función de trigger para actualizar el updated_at de la tabla profiles, 
-- normalmente ya está gestionada en la base de datos de Supabase inicial.

COMMENT ON COLUMN public.profiles.admin_preferences IS 'Stores admin panel UI preferences for the user (theme, layout, sidebar mode, accent color)';
