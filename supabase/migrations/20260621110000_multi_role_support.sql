-- Migration: Add multi-role support array column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roles public.user_role[] DEFAULT NULL;

-- Inicializar roles existentes con el valor de su columna role principal
UPDATE public.profiles SET roles = ARRAY[role] WHERE roles IS NULL AND role IS NOT NULL;

-- Función y Trigger para mantener roles inicializados en inserción/actualización
CREATE OR REPLACE FUNCTION public.handle_profile_roles_default()
RETURNS trigger AS $$
BEGIN
  IF NEW.roles IS NULL AND NEW.role IS NOT NULL THEN
    NEW.roles := ARRAY[NEW.role];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profile_roles_default ON public.profiles;
CREATE TRIGGER tr_profile_roles_default
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_roles_default();
