-- Migration: Add roles and allowed_ministries permission control
-- 0. Add values to the user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'docente';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'estudiante';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'musico';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'maestro';

-- 1. Add allowed_ministries column to public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allowed_ministries UUID[] DEFAULT NULL;

-- 2. Populate default permissions for the new roles: 'docente', 'estudiante', 'student', 'musico'
DELETE FROM public.role_permissions WHERE role IN ('docente', 'estudiante', 'student', 'musico');

INSERT INTO public.role_permissions (role, permissions) VALUES
  ('docente', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": false, "edit": false},
    "sermons": {"view": true, "edit": false},
    "members": {"view": false, "edit": false},
    "map": {"view": false, "edit": false},
    "events": {"view": true, "edit": false},
    "ministries": {"view": true, "edit": false},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "songs": {"view": true, "edit": false},
    "programs": {"view": true, "edit": false},
    "courses": {"view": true, "edit": true},
    "lms": {"view": true, "edit": true},
    "announcements": {"view": true, "edit": false},
    "chat": {"view": true, "edit": true}
  }'::jsonb),
  ('estudiante', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": false, "edit": false},
    "sermons": {"view": false, "edit": false},
    "members": {"view": false, "edit": false},
    "map": {"view": false, "edit": false},
    "events": {"view": false, "edit": false},
    "ministries": {"view": false, "edit": false},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "songs": {"view": false, "edit": false},
    "programs": {"view": false, "edit": false},
    "courses": {"view": true, "edit": false},
    "lms": {"view": true, "edit": false},
    "announcements": {"view": true, "edit": false},
    "chat": {"view": true, "edit": false}
  }'::jsonb),
  ('student', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": false, "edit": false},
    "sermons": {"view": false, "edit": false},
    "members": {"view": false, "edit": false},
    "map": {"view": false, "edit": false},
    "events": {"view": false, "edit": false},
    "ministries": {"view": false, "edit": false},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "songs": {"view": false, "edit": false},
    "programs": {"view": false, "edit": false},
    "courses": {"view": true, "edit": false},
    "lms": {"view": true, "edit": false},
    "announcements": {"view": true, "edit": false},
    "chat": {"view": true, "edit": false}
  }'::jsonb),
  ('musico', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": false, "edit": false},
    "sermons": {"view": false, "edit": false},
    "members": {"view": false, "edit": false},
    "map": {"view": false, "edit": false},
    "events": {"view": true, "edit": false},
    "ministries": {"view": true, "edit": false},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "songs": {"view": true, "edit": false},
    "programs": {"view": true, "edit": false},
    "courses": {"view": false, "edit": false},
    "lms": {"view": false, "edit": false},
    "announcements": {"view": true, "edit": false},
    "chat": {"view": true, "edit": true}
  }'::jsonb);
