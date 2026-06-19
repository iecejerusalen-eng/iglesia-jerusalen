-- =======================================================
-- SQL MIGRATION: SISTEMA DE PETICIONES Y ROLES/PERMISOS GRANULARES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. AGREGAR NUEVOS VALORES AL ENUM DE ROLES (Si no existen)
-- Nota: En Postgres, ALTER TYPE ADD VALUE no puede ejecutarse dentro de bloques de transacciones de múltiples comandos.
-- Si da error, ejecute esta sección de forma independiente primero.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'apoyo';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'multimedia';

-- 2. TABLA DE CATEGORÍAS DE PETICIONES
CREATE TABLE IF NOT EXISTS public.petition_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar categorías por defecto
INSERT INTO public.petition_categories (name) VALUES
  ('Sanidad'),
  ('Oración'),
  ('Trabajo'),
  ('Necesidades varias'),
  ('Problemas matrimoniales'),
  ('Crianza de hijos'),
  ('Vicios')
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS en categorías
ALTER TABLE public.petition_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de categorías" ON public.petition_categories;
CREATE POLICY "Permitir lectura pública de categorías"
  ON public.petition_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir gestión completa de categorías a administradores" ON public.petition_categories;
CREATE POLICY "Permitir gestión completa de categorías a administradores"
  ON public.petition_categories FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. TABLA DE PETICIONES DE ORACIÓN
CREATE TABLE IF NOT EXISTS public.petitions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.petition_categories(id) ON DELETE SET NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_oracion', 'respondida')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en peticiones
ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir crear peticiones a usuarios autenticados" ON public.petitions;
CREATE POLICY "Permitir crear peticiones a usuarios autenticados"
  ON public.petitions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir lectura de peticiones propias o por personal autorizado" ON public.petitions;
CREATE POLICY "Permitir lectura de peticiones propias o por personal autorizado"
  ON public.petitions FOR SELECT
  USING (
    auth.uid() = user_id OR
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'leader', 'editor', 'apoyo', 'multimedia')
    )
  );

DROP POLICY IF EXISTS "Permitir actualización de peticiones a personal autorizado" ON public.petitions;
CREATE POLICY "Permitir actualización de peticiones a personal autorizado"
  ON public.petitions FOR UPDATE
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'leader', 'editor', 'apoyo', 'multimedia')
    )
  );

DROP POLICY IF EXISTS "Permitir eliminación de peticiones a administradores" ON public.petitions;
CREATE POLICY "Permitir eliminación de peticiones a administradores"
  ON public.petitions FOR DELETE
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. TABLA DE PERMISOS POR ROL
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role public.user_role PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en permisos por rol
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de permisos a usuarios autenticados" ON public.role_permissions;
CREATE POLICY "Permitir lectura de permisos a usuarios autenticados"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir modificación de permisos a administradores" ON public.role_permissions;
CREATE POLICY "Permitir modificación de permisos a administradores"
  ON public.role_permissions FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Insertar/actualizar permisos por defecto para cada rol
INSERT INTO public.role_permissions (role, permissions) VALUES
  ('admin', '{
    "dashboard": {"view": true, "edit": true},
    "analytics": {"view": true, "edit": true},
    "notifications": {"view": true, "edit": true},
    "sermons": {"view": true, "edit": true},
    "members": {"view": true, "edit": true},
    "map": {"view": true, "edit": true},
    "events": {"view": true, "edit": true},
    "ministries": {"view": true, "edit": true},
    "finances": {"view": true, "edit": true},
    "products": {"view": true, "edit": true},
    "pages": {"view": true, "edit": true},
    "users": {"view": true, "edit": true},
    "settings": {"view": true, "edit": true},
    "petitions": {"view": true, "edit": true}
  }'::jsonb),
  ('pastor', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": true, "edit": false},
    "notifications": {"view": true, "edit": false},
    "sermons": {"view": true, "edit": true},
    "members": {"view": true, "edit": false},
    "map": {"view": true, "edit": false},
    "events": {"view": true, "edit": false},
    "ministries": {"view": true, "edit": false},
    "finances": {"view": true, "edit": false},
    "products": {"view": true, "edit": false},
    "pages": {"view": true, "edit": false},
    "users": {"view": false, "edit": false},
    "settings": {"view": true, "edit": false},
    "petitions": {"view": true, "edit": true}
  }'::jsonb),
  ('apoyo', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": true, "edit": false},
    "notifications": {"view": true, "edit": false},
    "sermons": {"view": true, "edit": false},
    "members": {"view": true, "edit": false},
    "map": {"view": true, "edit": false},
    "events": {"view": true, "edit": false},
    "ministries": {"view": true, "edit": false},
    "finances": {"view": true, "edit": false},
    "products": {"view": true, "edit": false},
    "pages": {"view": true, "edit": false},
    "users": {"view": false, "edit": false},
    "settings": {"view": true, "edit": false},
    "petitions": {"view": true, "edit": false}
  }'::jsonb),
  ('multimedia', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": true, "edit": true},
    "notifications": {"view": true, "edit": true},
    "sermons": {"view": true, "edit": true},
    "members": {"view": true, "edit": false},
    "map": {"view": true, "edit": false},
    "events": {"view": true, "edit": true},
    "ministries": {"view": true, "edit": false},
    "finances": {"view": false, "edit": false},
    "products": {"view": true, "edit": false},
    "pages": {"view": true, "edit": true},
    "users": {"view": false, "edit": false},
    "settings": {"view": false, "edit": false},
    "petitions": {"view": true, "edit": false}
  }'::jsonb),
  ('leader', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": false, "edit": false},
    "sermons": {"view": true, "edit": false},
    "members": {"view": true, "edit": false},
    "map": {"view": true, "edit": false},
    "events": {"view": true, "edit": false},
    "ministries": {"view": true, "edit": true},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "settings": {"view": false, "edit": false},
    "petitions": {"view": true, "edit": false}
  }'::jsonb),
  ('editor', '{
    "dashboard": {"view": true, "edit": true},
    "analytics": {"view": true, "edit": true},
    "notifications": {"view": true, "edit": true},
    "sermons": {"view": true, "edit": true},
    "members": {"view": true, "edit": true},
    "map": {"view": true, "edit": true},
    "events": {"view": true, "edit": true},
    "ministries": {"view": true, "edit": true},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": true, "edit": true},
    "users": {"view": false, "edit": false},
    "settings": {"view": false, "edit": false},
    "petitions": {"view": true, "edit": true}
  }'::jsonb),
  ('secretary', '{
    "dashboard": {"view": true, "edit": true},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": true, "edit": true},
    "sermons": {"view": false, "edit": false},
    "members": {"view": true, "edit": true},
    "map": {"view": true, "edit": true},
    "events": {"view": true, "edit": true},
    "ministries": {"view": true, "edit": true},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "settings": {"view": false, "edit": false},
    "petitions": {"view": true, "edit": true}
  }'::jsonb),
  ('secretaria', '{
    "dashboard": {"view": true, "edit": true},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": true, "edit": true},
    "sermons": {"view": false, "edit": false},
    "members": {"view": true, "edit": true},
    "map": {"view": true, "edit": true},
    "events": {"view": true, "edit": true},
    "ministries": {"view": true, "edit": true},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "settings": {"view": false, "edit": false},
    "petitions": {"view": true, "edit": true}
  }'::jsonb),
  ('member', '{
    "dashboard": {"view": false, "edit": false},
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
    "settings": {"view": false, "edit": false},
    "petitions": {"view": false, "edit": false}
  }'::jsonb),
  ('guest', '{
    "dashboard": {"view": false, "edit": false},
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
    "settings": {"view": false, "edit": false},
    "petitions": {"view": false, "edit": false}
  }'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 5. ADICIONAR COLUMNA DE CONTROL DE PERMISOS PERSONALIZADOS A PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions_override jsonb DEFAULT NULL;
