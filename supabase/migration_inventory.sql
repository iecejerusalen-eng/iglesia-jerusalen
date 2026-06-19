-- =======================================================
-- SQL MIGRATION: SISTEMA DE INVENTARIO Y CATEGORIZACIÓN
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. CREAR LA TABLA DE CATEGORÍAS DE INVENTARIO
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar categorías iniciales
INSERT INTO public.inventory_categories (name) VALUES
  ('Sonido'),
  ('Cocina'),
  ('Multimedia'),
  ('Herramientas'),
  ('Utensilios'),
  ('Mobiliario'),
  ('Instrumentos'),
  ('Otros')
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS en categorías
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de categorías a usuarios autenticados" ON public.inventory_categories;
CREATE POLICY "Permitir lectura de categorías a usuarios autenticados"
  ON public.inventory_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir gestión de categorías a personal autorizado" ON public.inventory_categories;
CREATE POLICY "Permitir gestión de categorías a personal autorizado"
  ON public.inventory_categories FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
    )
  );

-- 2. CREAR LA TABLA DE ARTÍCULOS DE INVENTARIO
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category_id uuid REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  photo_url text,
  purchase_date date,
  product_link text,
  price numeric(10, 2) DEFAULT 0.00 NOT NULL,
  status text NOT NULL DEFAULT 'buen_estado' CHECK (status IN ('buen_estado', 'reparacion', 'critico')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en artículos
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de inventario a personal autorizado" ON public.inventory_items;
CREATE POLICY "Permitir lectura de inventario a personal autorizado"
  ON public.inventory_items FOR SELECT
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'leader', 'editor', 'apoyo', 'multimedia')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de inventario a personal autorizado" ON public.inventory_items;
CREATE POLICY "Permitir gestión de inventario a personal autorizado"
  ON public.inventory_items FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
    )
  );

-- Trigger para mantener updated_at actualizado automáticamente
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_items_timestamp ON public.inventory_items;
CREATE TRIGGER trigger_update_inventory_items_timestamp
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_timestamp();

-- 3. REGISTRAR EL MÓDULO EN LA TABLA DE PERMISOS (RBAC)
-- Modificar dinámicamente el JSONB de permisos agregando la clave 'inventory'

UPDATE public.role_permissions
SET permissions = jsonb_set(permissions, '{inventory}', '{"view": true, "edit": true}'::jsonb)
WHERE role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor');

UPDATE public.role_permissions
SET permissions = jsonb_set(permissions, '{inventory}', '{"view": true, "edit": false}'::jsonb)
WHERE role IN ('leader', 'apoyo', 'multimedia');

UPDATE public.role_permissions
SET permissions = jsonb_set(permissions, '{inventory}', '{"view": false, "edit": false}'::jsonb)
WHERE role IN ('member', 'guest');

-- 4. CREAR EL BUCKET DE ALMACENAMIENTO "inventory" EN STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory', 'inventory', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para el Bucket de inventario
DROP POLICY IF EXISTS "Permitir lectura pública de fotos de inventario en storage" ON storage.objects;
CREATE POLICY "Permitir lectura pública de fotos de inventario en storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inventory');

DROP POLICY IF EXISTS "Permitir subir fotos de inventario a autorizados" ON storage.objects;
CREATE POLICY "Permitir subir fotos de inventario a autorizados"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inventory' AND (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Permitir actualizar/eliminar fotos de inventario a autorizados" ON storage.objects;
CREATE POLICY "Permitir actualizar/eliminar fotos de inventario a autorizados"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'inventory' AND (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'editor')
      )
    )
  );
