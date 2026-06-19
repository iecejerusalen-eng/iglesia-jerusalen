-- =======================================================
-- SQL MIGRATION: BIBLIOTECA DE ALABANZAS, PROGRAMAS DE ESTUDIO Y ROL MAESTRO
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- -------------------------------------------------------
-- 1. NUEVO ROL: MAESTRO
-- Nota: ALTER TYPE ADD VALUE no puede estar en un bloque de transacción.
-- Si da error, ejecute esta línea sola primero.
-- -------------------------------------------------------
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'maestro';

-- -------------------------------------------------------
-- 2. CATÁLOGOS DE CANCIONES
-- -------------------------------------------------------

-- 2a. Tipos de canción (Gozo, Adoración, Himno, etc.)
CREATE TABLE IF NOT EXISTS public.song_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.song_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de tipos de canción" ON public.song_types;
CREATE POLICY "Lectura pública de tipos de canción"
  ON public.song_types FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de tipos de canción por roles autorizados" ON public.song_types;
CREATE POLICY "Gestión de tipos de canción por roles autorizados"
  ON public.song_types FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor', 'maestro')
    )
  );

-- Insertar tipos por defecto
INSERT INTO public.song_types (name) VALUES
  ('Gozo'),
  ('Adoración'),
  ('Himno'),
  ('Alabanza'),
  ('Clamor'),
  ('Ofrenda'),
  ('Apertura')
ON CONFLICT (name) DO NOTHING;

-- 2b. Estilos de canción (Contemporáneo, Balada, Folclore, etc.)
CREATE TABLE IF NOT EXISTS public.song_styles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.song_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de estilos de canción" ON public.song_styles;
CREATE POLICY "Lectura pública de estilos de canción"
  ON public.song_styles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de estilos de canción por roles autorizados" ON public.song_styles;
CREATE POLICY "Gestión de estilos de canción por roles autorizados"
  ON public.song_styles FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor', 'maestro')
    )
  );

-- Insertar estilos por defecto
INSERT INTO public.song_styles (name) VALUES
  ('Contemporáneo'),
  ('Balada'),
  ('Folclore'),
  ('Coral'),
  ('Rock'),
  ('Pop Worship'),
  ('Cumbia Cristiana'),
  ('Tradicional')
ON CONFLICT (name) DO NOTHING;

-- -------------------------------------------------------
-- 3. TABLA DE CANCIONES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.songs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  artist text,
  bpm integer,
  type_id uuid REFERENCES public.song_types(id) ON DELETE SET NULL,
  style_id uuid REFERENCES public.song_styles(id) ON DELETE SET NULL,
  lyrics text DEFAULT '',
  has_chords boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de canciones" ON public.songs;
CREATE POLICY "Lectura pública de canciones"
  ON public.songs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de canciones por roles autorizados" ON public.songs;
CREATE POLICY "Gestión de canciones por roles autorizados"
  ON public.songs FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor', 'maestro')
    )
  );

-- -------------------------------------------------------
-- 4. TABLA DE PROGRAMAS (Estudios Bíblicos / Escuela Dominical)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  cover_image text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de programas" ON public.programs;
CREATE POLICY "Lectura pública de programas"
  ON public.programs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de programas por roles autorizados" ON public.programs;
CREATE POLICY "Gestión de programas por roles autorizados"
  ON public.programs FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor', 'maestro')
    )
  );

-- -------------------------------------------------------
-- 5. TABLA DE LECCIONES DE PROGRAMAS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  public_content text DEFAULT '',
  teacher_content text DEFAULT '',
  "order" integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.program_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de lecciones" ON public.program_lessons;
CREATE POLICY "Lectura pública de lecciones"
  ON public.program_lessons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestión de lecciones por roles autorizados" ON public.program_lessons;
CREATE POLICY "Gestión de lecciones por roles autorizados"
  ON public.program_lessons FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'editor', 'maestro')
    )
  );

-- -------------------------------------------------------
-- 6. ACTUALIZAR PERMISOS POR ROL (agregar módulos songs y programs)
-- -------------------------------------------------------

-- Admin: acceso total
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": true, "edit": true}, "programs": {"view": true, "edit": true}}'::jsonb
WHERE role = 'admin';

-- Pastor: puede ver y editar canciones y programas
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": true, "edit": true}, "programs": {"view": true, "edit": true}}'::jsonb
WHERE role = 'pastor';

-- Editor: puede ver y editar canciones y programas
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": true, "edit": true}, "programs": {"view": true, "edit": true}}'::jsonb
WHERE role = 'editor';

-- Apoyo: solo lectura
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": true, "edit": false}, "programs": {"view": true, "edit": false}}'::jsonb
WHERE role = 'apoyo';

-- Multimedia: puede editar canciones (letras para proyectar), lectura de programas
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": true, "edit": true}, "programs": {"view": true, "edit": false}}'::jsonb
WHERE role = 'multimedia';

-- Leader: solo lectura
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": true, "edit": false}, "programs": {"view": true, "edit": false}}'::jsonb
WHERE role = 'leader';

-- Secretary/Secretaria: sin acceso
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": false, "edit": false}, "programs": {"view": false, "edit": false}}'::jsonb
WHERE role IN ('secretary', 'secretaria');

-- Member: sin acceso admin
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": false, "edit": false}, "programs": {"view": false, "edit": false}}'::jsonb
WHERE role = 'member';

-- Guest: sin acceso admin
UPDATE public.role_permissions
SET permissions = permissions
  || '{"songs": {"view": false, "edit": false}, "programs": {"view": false, "edit": false}}'::jsonb
WHERE role = 'guest';

-- Maestro: acceso completo a canciones y programas, lectura de otros módulos
INSERT INTO public.role_permissions (role, permissions) VALUES
  ('maestro', '{
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
    "settings": {"view": false, "edit": false},
    "petitions": {"view": true, "edit": false},
    "songs": {"view": true, "edit": true},
    "programs": {"view": true, "edit": true}
  }'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;
