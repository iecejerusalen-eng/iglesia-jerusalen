-- =======================================================
-- SCRIPT SQL: RBAC, EVENTOS Y MIEMBROS (CRM)
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- =======================================================
-- FASE A: ALTERAR EL ENUM (EJECUTAR PRIMERO Y HACER CLIC EN RUN)
-- =======================================================
-- En Supabase/PostgreSQL, dado que el campo 'role' es de tipo enum 'user_role',
-- debemos agregar los nuevos roles y confirmarlos antes de poder usarlos.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'secretaria';

-- =======================================================
-- FASE B: CREAR TABLAS Y RLS (EJECUTAR DESPUÉS DE LA FASE A)
-- =======================================================

-- Asegurar que la columna email exista en public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Asignar el rol 'admin' al superusuario especificado
INSERT INTO public.profiles (id, email, role, first_name, last_name)
VALUES ('2e523d97-61c5-45b5-a424-938be3dddd67', 'estebanico10@gmail.com', 'admin', 'Esteban', '')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Añadir ministry_id a public.profiles si no existe para vincular líderes a su ministerio
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL;


-- 2. Módulo de Eventos
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  is_recurring boolean DEFAULT false NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
  leaders_in_charge text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para Eventos
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de eventos" ON public.events;
CREATE POLICY "Permitir lectura pública de eventos"
  ON public.events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir gestión completa a admin, pastor y secretaria" ON public.events;
CREATE POLICY "Permitir gestión completa a admin, pastor y secretaria"
  ON public.events FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de eventos a líderes sobre su ministerio" ON public.events;
CREATE POLICY "Permitir gestión de eventos a líderes sobre su ministerio"
  ON public.events FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'leader' and ministry_id = events.ministry_id
    )
  );


-- 3. Base de Datos de Miembros (CRM)
CREATE TABLE IF NOT EXISTS public.members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  photo_url text,
  birth_date date,
  conversion_date date,
  baptism_date date,
  phone text,
  dni text UNIQUE,
  address text,
  maps_link text,
  is_leader boolean DEFAULT false NOT NULL,
  leadership_role text,
  tithes_sum numeric(10, 2) DEFAULT 0.00 CHECK (tithes_sum >= 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para Miembros
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de miembros a personal autorizado" ON public.members;
CREATE POLICY "Permitir lectura de miembros a personal autorizado"
  ON public.members FOR SELECT
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de miembros a admin y secretaria" ON public.members;
CREATE POLICY "Permitir gestión de miembros a admin y secretaria"
  ON public.members FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );


-- 4. Tablas M2M y Entidades de Relación
-- Áreas de Servicio (service_areas)
CREATE TABLE IF NOT EXISTS public.service_areas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de áreas de servicio" ON public.service_areas;
CREATE POLICY "Permitir lectura de áreas de servicio"
  ON public.service_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestión de áreas a admin y secretaria" ON public.service_areas;
CREATE POLICY "Permitir gestión de áreas a admin y secretaria"
  ON public.service_areas FOR ALL USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );

-- Talentos (talents)
CREATE TABLE IF NOT EXISTS public.talents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de talentos" ON public.talents;
CREATE POLICY "Permitir lectura de talentos"
  ON public.talents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestión de talentos a admin y secretaria" ON public.talents;
CREATE POLICY "Permitir gestión de talentos a admin y secretaria"
  ON public.talents FOR ALL USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );

-- Dones Espirituales (spiritual_gifts)
CREATE TABLE IF NOT EXISTS public.spiritual_gifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.spiritual_gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de dones" ON public.spiritual_gifts;
CREATE POLICY "Permitir lectura de dones"
  ON public.spiritual_gifts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestión de dones a admin y secretaria" ON public.spiritual_gifts;
CREATE POLICY "Permitir gestión de dones a admin y secretaria"
  ON public.spiritual_gifts FOR ALL USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );


-- Tablas de relación (Junction)
-- member_service_areas
CREATE TABLE IF NOT EXISTS public.member_service_areas (
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  service_area_id uuid REFERENCES public.service_areas(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, service_area_id)
);

ALTER TABLE public.member_service_areas ENABLE ROW LEVEL SECURITY;

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

-- member_talents
CREATE TABLE IF NOT EXISTS public.member_talents (
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES public.talents(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, talent_id)
);

ALTER TABLE public.member_talents ENABLE ROW LEVEL SECURITY;

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

-- member_spiritual_gifts
CREATE TABLE IF NOT EXISTS public.member_spiritual_gifts (
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES public.spiritual_gifts(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, gift_id)
);

ALTER TABLE public.member_spiritual_gifts ENABLE ROW LEVEL SECURITY;

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


-- 5. Tabla de Correos de Miembros (member_emails)
CREATE TABLE IF NOT EXISTS public.member_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.member_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de correos a autorizados" ON public.member_emails;
CREATE POLICY "Permitir lectura de correos a autorizados"
  ON public.member_emails FOR SELECT USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor', 'secretary', 'secretaria')
    )
  );

DROP POLICY IF EXISTS "Permitir gestión de correos a admin y secretaria" ON public.member_emails;
CREATE POLICY "Permitir gestión de correos a admin y secretaria"
  ON public.member_emails FOR ALL USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'secretary', 'secretaria')
    )
  );


-- 6. Política de RLS para que Líderes editen su propio departamento en ministries
DROP POLICY IF EXISTS "Permitir a líderes actualizar su propio ministerio" ON public.ministries;
CREATE POLICY "Permitir a líderes actualizar su propio ministerio"
  ON public.ministries FOR UPDATE
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'leader' and ministry_id = public.ministries.id
    )
  );


-- 7. Carga de Semillas Iniciales (Seed Data)
INSERT INTO public.service_areas (name, description) VALUES
  ('Alabanza', 'Apoyo musical en cultos y eventos especiales'),
  ('Ujieres y Protocolo', 'Atención y orden para los asistentes'),
  ('Multimedia y Medios', 'Transmisión, sonido y redes sociales'),
  ('Acción Social', 'Ayuda comunitaria y visitas a enfermos'),
  ('Escuela Dominical', 'Educación bíblica infantil')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.talents (name, description) VALUES
  ('Cantar/Instrumentos', 'Habilidades de interpretación musical y vocal'),
  ('Diseño Gráfico', 'Diseño de afiches, anuncios y visuales'),
  ('Cocina y Logística', 'Preparación de alimentos y organización de eventos'),
  ('Enseñanza/Oratoria', 'Facilidad para instruir o guiar grupos de estudio'),
  ('Administración', 'Gestión de finanzas, inventarios y documentos')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.spiritual_gifts (name, description) VALUES
  ('Sabiduría', 'Entendimiento profundo de los misterios divinos'),
  ('Fe', 'Confianza inquebrantable en las promesas del Señor'),
  ('Sanidad y Milagros', 'Instrumentos del mover milagroso del Espíritu Santo'),
  ('Profecía', 'Proclamación clara de la verdad y voluntad divina'),
  ('Servicio y Ayuda', 'Disposición abnegada para suplir las necesidades del prójimo')
ON CONFLICT (name) DO NOTHING;
