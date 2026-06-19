-- =======================================================
-- SQL MIGRATION: MAP EXTENSIONS, AUDIT LOGS & SOFT DELETES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Ampliar la tabla de miembros (members) con campos geográficos y soft delete
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Ampliar la tabla de productos (products) con campo soft delete
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 3. Crear las tablas de catalogación de Iglesias (del proyecto Mapa Interactivo)
CREATE TABLE IF NOT EXISTS public.denominations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  icon_type text NOT NULL DEFAULT 'emoji' CHECK (icon_type IN ('emoji', 'svg')),
  icon_value text NOT NULL DEFAULT '⛪',
  gmaps_link text,
  address_street text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  denomination_id uuid REFERENCES public.denominations(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  category_ids jsonb DEFAULT '[]'::jsonb,
  denomination_ids jsonb DEFAULT '[]'::jsonb,
  leaders jsonb DEFAULT '[]'::jsonb,
  phones jsonb DEFAULT '[]'::jsonb,
  emails jsonb DEFAULT '[]'::jsonb,
  service_hours jsonb DEFAULT '[]'::jsonb,
  departments jsonb DEFAULT '[]'::jsonb,
  anniversary_date date,
  description text,
  members_approx integer,
  baptized_members integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en tablas de iglesias
ALTER TABLE public.denominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lectura pública y gestión autorizada de iglesias (locations)
DROP POLICY IF EXISTS "locations_public_read" ON public.locations;
CREATE POLICY "locations_public_read" ON public.locations FOR SELECT USING (true);

DROP POLICY IF EXISTS "locations_auth_write" ON public.locations;
CREATE POLICY "locations_auth_write" ON public.locations FOR ALL 
  USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')));

-- Políticas RLS para denominaciones, categorías y zonas
DROP POLICY IF EXISTS "denominations_public_read" ON public.denominations;
CREATE POLICY "denominations_public_read" ON public.denominations FOR SELECT USING (true);
DROP POLICY IF EXISTS "denominations_auth" ON public.denominations;
CREATE POLICY "denominations_auth" ON public.denominations FOR ALL USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')));

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_auth" ON public.categories;
CREATE POLICY "categories_auth" ON public.categories FOR ALL USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')));

DROP POLICY IF EXISTS "zones_public_read" ON public.zones;
CREATE POLICY "zones_public_read" ON public.zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "zones_auth" ON public.zones;
CREATE POLICY "zones_auth" ON public.zones FOR ALL USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')));


-- 4. Crear la tabla de células (cells)
CREATE TABLE IF NOT EXISTS public.cells (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  leader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sector text,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en cells
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de células a autorizados" ON public.cells;
CREATE POLICY "Permitir lectura de células a autorizados"
  ON public.cells FOR SELECT
  USING (
    (deleted_at IS NULL) AND
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria', 'leader')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de células a admin y secretaria" ON public.cells;
CREATE POLICY "Permitir gestión de células a admin y secretaria"
  ON public.cells FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );

-- 5. Actualizar políticas RLS de lectura para filtrar registros borrados lógicamente (deleted_at IS NULL)
-- Tabla: members
DROP POLICY IF EXISTS "Permitir lectura de miembros a personal autorizado" ON public.members;
CREATE POLICY "Permitir lectura de miembros a personal autorizado"
  ON public.members FOR SELECT
  USING (
    (deleted_at IS NULL) AND
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

-- Tabla: products
DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON public.products;
CREATE POLICY "Permitir lectura pública de productos" 
  ON public.products FOR SELECT 
  USING (deleted_at IS NULL);


-- 6. Crear la tabla de Logs de Auditoría (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  performed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de logs a personal de confianza" ON public.audit_logs;
CREATE POLICY "Permitir lectura de logs a personal de confianza"
  ON public.audit_logs FOR SELECT
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );


-- 7. Crear la función del Trigger de Auditoría
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Intentar obtener el user_id de la sesión de Supabase Auth
  current_user_id := auth.uid();
  
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    current_user_id,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Asignar los triggers a las tablas críticas
-- Trigger para members
DROP TRIGGER IF EXISTS audit_members_trigger ON public.members;
CREATE TRIGGER audit_members_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Trigger para donations
DROP TRIGGER IF EXISTS audit_donations_trigger ON public.donations;
CREATE TRIGGER audit_donations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Trigger para products
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
