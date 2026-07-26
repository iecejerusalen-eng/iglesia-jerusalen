-- Migration: Create public_menu_items for dynamic navigation and seed initial data

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.public_menu_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    label text NOT NULL,
    url text NOT NULL,
    icon text,
    order_index integer NOT NULL DEFAULT 0,
    parent_id uuid REFERENCES public.public_menu_items(id) ON DELETE CASCADE,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.public_menu_items ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Lectura pública (todos, incluyendo anonimos pueden ver el menú)
DROP POLICY IF EXISTS "Permitir lectura a todos" ON public.public_menu_items;
CREATE POLICY "Permitir lectura a todos" ON public.public_menu_items FOR SELECT USING (true);

-- Escritura solo admin
DROP POLICY IF EXISTS "Permitir escritura a administradores" ON public.public_menu_items;
CREATE POLICY "Permitir escritura a administradores" ON public.public_menu_items FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Seed Data (Replicating Navigation.tsx)

DO $$ 
DECLARE
  comunidad_id uuid := gen_random_uuid();
  recursos_id uuid := gen_random_uuid();
BEGIN
  -- TOP LEVEL
  INSERT INTO public.public_menu_items (id, label, url, order_index) VALUES 
  (gen_random_uuid(), 'Inicio', '/', 10),
  (gen_random_uuid(), 'Nosotros', '/nosotros', 20);

  -- COMUNIDAD (Dropdown)
  INSERT INTO public.public_menu_items (id, label, url, order_index) VALUES 
  (comunidad_id, 'Comunidad', '#', 30);
  
  -- COMUNIDAD CHILDREN
  INSERT INTO public.public_menu_items (label, url, order_index, parent_id) VALUES 
  ('Ministerios', '/ministerios', 10, comunidad_id),
  ('Eventos (Calendario)', '/eventos', 20, comunidad_id),
  ('Peticiones', '/peticiones', 30, comunidad_id),
  ('Cumpleaños 🎂', '/cumanoes', 40, comunidad_id),
  ('Misiones 🌍', '/misiones', 50, comunidad_id);

  -- RECURSOS (Dropdown)
  INSERT INTO public.public_menu_items (id, label, url, order_index) VALUES 
  (recursos_id, 'Recursos', '#', 40);

  -- RECURSOS CHILDREN
  INSERT INTO public.public_menu_items (label, url, order_index, parent_id) VALUES 
  ('La Santa Biblia', '/recursos/biblia', 10, recursos_id),
  ('Prédicas', '/predicas', 20, recursos_id),
  ('Alabanzas e Himnos', '/recursos/alabanzas', 30, recursos_id),
  ('Programas / Estudios', '/programas', 40, recursos_id),
  ('Juegos Bíblicos 🎮', '/recursos/juegos', 50, recursos_id);

  -- TOP LEVEL OTHERS
  INSERT INTO public.public_menu_items (label, url, order_index) VALUES 
  ('Aula Virtual', '/aula-virtual', 50),
  ('Tienda', '/tienda', 60),
  ('Contacto', '/contacto', 70);

END $$;
