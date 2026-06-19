-- =======================================================
-- SQL MIGRATION: CARRERAS, EDUCACIÓN Y TALENTOS CATEGORIZADOS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE PARA APLICAR
-- =======================================================

-- 1. Crear la tabla de carreras universitarias
CREATE TABLE IF NOT EXISTS public.careers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de carreras
DROP POLICY IF EXISTS "Permitir lectura pública de carreras" ON public.careers;
CREATE POLICY "Permitir lectura pública de carreras"
  ON public.careers FOR SELECT USING (true);

-- Permitir gestión completa de carreras a administradores, pastores y secretarios
DROP POLICY IF EXISTS "Permitir gestión completa de carreras a personal autorizado" ON public.careers;
CREATE POLICY "Permitir gestión completa de carreras a personal autorizado"
  ON public.careers FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

-- 2. Modificar la tabla de miembros (members) para guardar información académica
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS education_level text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS career_id uuid REFERENCES public.careers(id) ON DELETE SET NULL;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_studying boolean DEFAULT false;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS studying_career_id uuid REFERENCES public.careers(id) ON DELETE SET NULL;

-- 3. Poblar la tabla de carreras universitarias con un catálogo completo
INSERT INTO public.careers (name) VALUES
  ('Ingeniería en Sistemas / Computación / Software'),
  ('Ingeniería Civil'),
  ('Ingeniería Industrial'),
  ('Ingeniería Mecánica'),
  ('Ingeniería Eléctrica'),
  ('Ingeniería Electrónica y Telecomunicaciones'),
  ('Ingeniería Química'),
  ('Ingeniería Agrónoma / Agropecuaria'),
  ('Ingeniería Ambiental'),
  ('Ingeniería en Alimentos'),
  ('Ingeniería Biomédica'),
  ('Ingeniería en Biotecnología'),
  ('Doctor en Medicina / Licenciatura en Medicina'),
  ('Licenciatura en Enfermería'),
  ('Licenciatura en Psicología Clínica'),
  ('Licenciatura en Psicología Organizacional'),
  ('Licenciatura en Odontología'),
  ('Licenciatura en Obstetricia'),
  ('Licenciatura en Fisioterapia / Terapia Física'),
  ('Licenciatura en Nutrición y Dietética'),
  ('Licenciatura en Medicina Veterinaria'),
  ('Licenciatura en Derecho / Abogado'),
  ('Licenciatura en Administración de Empresas'),
  ('Licenciatura en Contabilidad y Auditoría (CPA)'),
  ('Licenciatura en Economía'),
  ('Licenciatura en Marketing / Mercadotecnia'),
  ('Licenciatura en Negocios Internacionales / Comercio Exterior'),
  ('Licenciatura en Comunicación Social / Periodismo'),
  ('Licenciatura en Educación Básica / Primaria'),
  ('Licenciatura en Educación Inicial / Parvularia'),
  ('Licenciatura en Psicopedagogía'),
  ('Licenciatura en Arquitectura'),
  ('Licenciatura en Diseño Gráfico'),
  ('Licenciatura en Diseño de Interiores'),
  ('Licenciatura en Gastronomía'),
  ('Licenciatura en Turismo y Hotelería'),
  ('Licenciatura en Sociología'),
  ('Licenciatura en Trabajo Social'),
  ('Licenciatura en Teología / Ministerio Pastoral'),
  ('Licenciatura en Artes Visuales / Plásticas'),
  ('Licenciatura en Música / Producción Musical'),
  ('Licenciatura en Multimedia y Producción Audiovisual'),
  ('Licenciatura en Ciberseguridad / Seguridad Informática'),
  ('Licenciatura en Ciencia de Datos / Inteligencia Artificial')
ON CONFLICT (name) DO NOTHING;

-- 4. Poblar la tabla de roles de catálogo (catalog_roles) con habilidades categorizadas por tipo
-- Se utiliza la categoría 'Talentos' y el formato '[Categoría] Nombre del Talento'
INSERT INTO public.catalog_roles (name, category) VALUES
  -- Manuales / Oficios
  ('[Manuales] Carpintería', 'Talentos'),
  ('[Manuales] Pintura (Interiores y Exteriores)', 'Talentos'),
  ('[Manuales] Electricidad Residencial / Comercial', 'Talentos'),
  ('[Manuales] Plomería / Fontanería', 'Talentos'),
  ('[Manuales] Albañilería / Construcción General', 'Talentos'),
  ('[Manuales] Mecánica Automotriz / Motos', 'Talentos'),
  ('[Manuales] Costura / Confección / Sastrería', 'Talentos'),
  ('[Manuales] Cerrajería', 'Talentos'),
  ('[Manuales] Jardinería / Paisajismo', 'Talentos'),
  ('[Manuales] Soldadura y Metalmecánica', 'Talentos'),

  -- Tecnología / Computación
  ('[Tecnología] Soporte Técnico / Reparación de PC', 'Talentos'),
  ('[Tecnología] Programación de Software / Desarrollo Web', 'Talentos'),
  ('[Tecnología] Administración de Bases de Datos', 'Talentos'),
  ('[Tecnología] Redes y Telecomunicaciones', 'Talentos'),
  ('[Tecnología] Ciberseguridad / Servidores', 'Talentos'),
  ('[Tecnología] Ofimática y Digitación (Excel, Word)', 'Talentos'),
  
  -- Cocina / Alimentos
  ('[Cocina] Repostería y Pastelería', 'Talentos'),
  ('[Cocina] Panadería', 'Talentos'),
  ('[Cocina] Cocina General / Gastronomía', 'Talentos'),
  ('[Cocina] Organización de Banquetes / Catering', 'Talentos'),
  ('[Cocina] Decoración de Mesa y Emplatados', 'Talentos'),

  -- Arte y Creatividad
  ('[Arte] Fotografía Profesional / Edición', 'Talentos'),
  ('[Arte] Edición de Video y Postproducción', 'Talentos'),
  ('[Arte] Diseño Gráfico y Branding', 'Talentos'),
  ('[Arte] Ilustración y Dibujo (Digital/Físico)', 'Talentos'),
  ('[Arte] Pintura Artística / Escultura', 'Talentos'),
  ('[Arte] Decoración de Eventos / Manualidades', 'Talentos'),
  ('[Arte] Redacción de Contenidos / Escritura Creativa', 'Talentos'),

  -- Música y Audio
  ('[Música] Canto (Vocalista / Coros)', 'Talentos'),
  ('[Música] Ejecución de Guitarra (Acústica/Eléctrica)', 'Talentos'),
  ('[Música] Ejecución de Piano / Teclados', 'Talentos'),
  ('[Música] Ejecución de Batería / Percusión', 'Talentos'),
  ('[Música] Ejecución de Bajo Eléctrico', 'Talentos'),
  ('[Música] Sonido en Vivo / Mezcla y Microfonía', 'Talentos'),
  ('[Música] Producción Musical y Grabación en Estudio', 'Talentos'),

  -- Administración y Liderazgo
  ('[Administración] Contabilidad, Finanzas y Presupuestos', 'Talentos'),
  ('[Administración] Oratoria, Locución y Maestría de Ceremonia', 'Talentos'),
  ('[Administración] Enseñanza Académica / Pedagogía / Tutorías', 'Talentos'),
  ('[Administración] Ventas, Marketing y Redes Sociales', 'Talentos'),
  ('[Administración] Logística, Planificación y Coordinación', 'Talentos'),
  ('[Administración] Traducción e Interpretación de Idiomas', 'Talentos'),

  -- Salud y Bienestar
  ('[Salud] Primeros Auxilios / Enfermería básica', 'Talentos'),
  ('[Salud] Consejería Familiar, Psicología o Apoyo Emocional', 'Talentos'),
  ('[Salud] Cuidado y Animación Infantil', 'Talentos'),
  ('[Salud] Acompañamiento y Cuidado de Adultos Mayores', 'Talentos')
ON CONFLICT (name, category) DO NOTHING;
