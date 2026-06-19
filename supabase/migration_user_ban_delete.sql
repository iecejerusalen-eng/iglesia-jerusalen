-- =======================================================
-- SQL MIGRATION: SEGURIDAD DE USUARIOS (BANEAR Y ELIMINAR)
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Agregar columna "banned" (baneado/suspendido) a la tabla de perfiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false;

-- 2. Crear función para eliminar usuarios desde el cliente (con bypass de privilegios)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Permite ejecutar con privilegios de administrador de la base de datos
AS $$
BEGIN
  -- Validar que el usuario que invoca la función (auth.uid()) sea un administrador activo
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND banned = false
  ) THEN
    RAISE EXCEPTION 'Operación denegada. Solo los administradores pueden eliminar usuarios.';
  END IF;

  -- Eliminar de la tabla pública de perfiles
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Eliminar de la tabla interna de autenticación (auth.users)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
