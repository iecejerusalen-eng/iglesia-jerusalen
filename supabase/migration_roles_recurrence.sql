-- =======================================================
-- SQL MIGRATION: CATALOG ROLES, MEMBERS CASCADE & EVENT EXTENSIONS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Crear la tabla de catálogos unificados
CREATE TABLE IF NOT EXISTS public.catalog_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Roles', 'Talentos', 'Dones', 'Área de Servicios')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_name_category UNIQUE (name, category)
);

-- Habilitar RLS en catalog_roles
ALTER TABLE public.catalog_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de catálogo" ON public.catalog_roles;
CREATE POLICY "Permitir lectura pública de catálogo"
  ON public.catalog_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestión completa de catálogo a admin, pastor y secretaria" ON public.catalog_roles;
CREATE POLICY "Permitir gestión completa de catálogo a admin, pastor y secretaria"
  ON public.catalog_roles FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

-- 2. Poblar catalog_roles con valores iniciales
INSERT INTO public.catalog_roles (name, category) VALUES
  -- Roles
  ('Pastor', 'Roles'),
  ('Coordinador', 'Roles'),
  ('Secretario', 'Roles'),
  ('Tesorero', 'Roles'),
  ('Líder', 'Roles'),
  ('Director', 'Roles'),
  ('Ujier', 'Roles'),
  
  -- Talentos
  ('Cantar/Instrumentos', 'Talentos'),
  ('Diseño Gráfico', 'Talentos'),
  ('Cocina y Logística', 'Talentos'),
  ('Enseñanza/Oratoria', 'Talentos'),
  ('Administración', 'Talentos'),
  
  -- Dones Espirituales (1 Corintios 12)
  ('Palabra de sabiduría', 'Dones'),
  ('Palabra de ciencia', 'Dones'),
  ('Fe', 'Dones'),
  ('Dones de sanidades', 'Dones'),
  ('Operación de milagros', 'Dones'),
  ('Profecía', 'Dones'),
  ('Discernimiento de espíritus', 'Dones'),
  ('Diversos géneros de lenguas', 'Dones'),
  ('Interpretación de lenguas', 'Dones'),
  
  -- Área de Servicios (Incluyendo Pastor)
  ('Alabanza', 'Área de Servicios'),
  ('Ujieres y Protocolo', 'Área de Servicios'),
  ('Multimedia y Medios', 'Área de Servicios'),
  ('Acción Social', 'Área de Servicios'),
  ('Escuela Dominical', 'Área de Servicios'),
  ('Pastor', 'Área de Servicios')
ON CONFLICT (name, category) DO NOTHING;

-- 3. Modificar la tabla de miembros (members) para guardar ministry_id y role_id
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.catalog_roles(id) ON DELETE SET NULL;

-- 4. Redefinir las tablas de relación Many-to-Many
-- Drop de las tablas antiguas y sus referencias
DROP TABLE IF EXISTS public.member_service_areas;
DROP TABLE IF EXISTS public.member_talents;
DROP TABLE IF EXISTS public.member_spiritual_gifts;

-- Drop de las tablas de catálogos anteriores redundantes
DROP TABLE IF EXISTS public.service_areas;
DROP TABLE IF EXISTS public.talents;
DROP TABLE IF EXISTS public.spiritual_gifts;

-- Recreación de las tablas de unión apuntando a catalog_roles
CREATE TABLE public.member_service_areas (
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  service_area_id uuid REFERENCES public.catalog_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, service_area_id)
);

CREATE TABLE public.member_talents (
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES public.catalog_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, talent_id)
);

CREATE TABLE public.member_spiritual_gifts (
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES public.catalog_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, gift_id)
);

-- Habilitar RLS en las nuevas tablas M2M
ALTER TABLE public.member_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_spiritual_gifts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para member_service_areas
DROP POLICY IF EXISTS "Permitir lectura de relaciones a autorizados" ON public.member_service_areas;
CREATE POLICY "Permitir lectura de relaciones a autorizados"
  ON public.member_service_areas FOR SELECT USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de relaciones a admin y secretaria" ON public.member_service_areas;
CREATE POLICY "Permitir gestión de relaciones a admin y secretaria"
  ON public.member_service_areas FOR ALL USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );

-- Políticas de RLS para member_talents
DROP POLICY IF EXISTS "Permitir lectura de relaciones a autorizados" ON public.member_talents;
CREATE POLICY "Permitir lectura de relaciones a autorizados"
  ON public.member_talents FOR SELECT USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de relaciones a admin y secretaria" ON public.member_talents;
CREATE POLICY "Permitir gestión de relaciones a admin y secretaria"
  ON public.member_talents FOR ALL USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );

-- Políticas de RLS para member_spiritual_gifts
DROP POLICY IF EXISTS "Permitir lectura de relaciones a autorizados" ON public.member_spiritual_gifts;
CREATE POLICY "Permitir lectura de relaciones a autorizados"
  ON public.member_spiritual_gifts FOR SELECT USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de relaciones a admin y secretaria" ON public.member_spiritual_gifts;
CREATE POLICY "Permitir gestión de relaciones a admin y secretaria"
  ON public.member_spiritual_gifts FOR ALL USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );

-- 5. Ampliar la tabla de eventos con nuevas columnas
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_type text CHECK (recurrence_type IN ('diario', 'semanal', 'anual'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_days integer[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS emoji text;

-- 6. Crear el bucket de almacenamiento público para portadas de eventos en supabase storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear políticas para permitir subir y ver imágenes del bucket
DROP POLICY IF EXISTS "Permitir acceso público a imágenes de eventos" ON storage.objects;
CREATE POLICY "Permitir acceso público a imágenes de eventos"
  ON storage.objects FOR SELECT USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Permitir carga de imágenes de eventos a autorizados" ON storage.objects;
CREATE POLICY "Permitir carga de imágenes de eventos a autorizados"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'event-images')
  WITH CHECK (bucket_id = 'event-images');
