-- Migración SQL: Auto-corrección de Nombres y Apellidos (Title Case)
-- Limpia espacios innecesarios y capitaliza iniciales automáticamente.

CREATE OR REPLACE FUNCTION public.clean_and_format_name(val text)
RETURNS text AS $$
BEGIN
  IF val IS NULL OR trim(val) = '' THEN
    RETURN val;
  END IF;
  -- Elimina espacios al inicio y final, colapsa múltiples espacios internos a uno solo, y capitaliza cada palabra
  RETURN initcap(regexp_replace(trim(val), '\s+', ' ', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función del trigger para public.profiles
CREATE OR REPLACE FUNCTION public.trg_format_profile_names()
RETURNS trigger AS $$
BEGIN
  NEW.first_name := public.clean_and_format_name(NEW.first_name);
  NEW.last_name := public.clean_and_format_name(NEW.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función del trigger para public.members
CREATE OR REPLACE FUNCTION public.trg_format_member_names()
RETURNS trigger AS $$
BEGIN
  NEW.first_name := public.clean_and_format_name(NEW.first_name);
  NEW.last_name := public.clean_and_format_name(NEW.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en public.profiles
DROP TRIGGER IF EXISTS format_profile_names ON public.profiles;
CREATE TRIGGER format_profile_names
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_format_profile_names();

-- Crear trigger en public.members
DROP TRIGGER IF EXISTS format_member_names ON public.members;
CREATE TRIGGER format_member_names
  BEFORE INSERT OR UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_format_member_names();

-- Corrección retroactiva de registros existentes
UPDATE public.profiles
SET first_name = public.clean_and_format_name(first_name),
    last_name = public.clean_and_format_name(last_name)
WHERE first_name IS NOT NULL OR last_name IS NOT NULL;

UPDATE public.members
SET first_name = public.clean_and_format_name(first_name),
    last_name = public.clean_and_format_name(last_name)
WHERE first_name IS NOT NULL OR last_name IS NOT NULL;
