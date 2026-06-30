-- migration_consolidate_roles.sql
-- Consolidate duplicate roles to use a single standard naming convention.
-- 'secretaria' -> 'secretary'
-- 'estudiante' -> 'student'
-- 'docente' -> 'teacher'

UPDATE public.profiles
SET role = 'secretary'
WHERE role = 'secretaria';

UPDATE public.profiles
SET role = 'student'
WHERE role = 'estudiante';

UPDATE public.profiles
SET role = 'teacher'
WHERE role = 'docente';

-- For array of roles (if applicable)
UPDATE public.profiles
SET roles = array_replace(roles, 'secretaria', 'secretary')
WHERE 'secretaria' = ANY(roles);

UPDATE public.profiles
SET roles = array_replace(roles, 'estudiante', 'student')
WHERE 'estudiante' = ANY(roles);

UPDATE public.profiles
SET roles = array_replace(roles, 'docente', 'teacher')
WHERE 'docente' = ANY(roles);

-- Ensure role_permissions table only has standard roles
-- (Assuming we just clean them up, the role_permissions insert is already handled in other migrations)
DELETE FROM public.role_permissions WHERE role IN ('secretaria', 'estudiante', 'docente');
