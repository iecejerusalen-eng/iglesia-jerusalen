-- ============================================================
-- FASE 9: Ecosistema Multi-Escuela
-- Migración: lms_schools, lms_levels, ALTER lms_courses
-- ============================================================

-- 1. Tabla de Escuelas / Facultades / Academias
CREATE TABLE IF NOT EXISTS lms_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_image_url TEXT,
    color TEXT DEFAULT '#D4AF37',
    leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Niveles / Ciclos por Escuela
CREATE TABLE IF NOT EXISTS lms_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES lms_schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Agregar columnas school_id y level_id a lms_courses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lms_courses' AND column_name = 'school_id'
    ) THEN
        ALTER TABLE lms_courses ADD COLUMN school_id UUID REFERENCES lms_schools(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lms_courses' AND column_name = 'level_id'
    ) THEN
        ALTER TABLE lms_courses ADD COLUMN level_id UUID REFERENCES lms_levels(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_lms_levels_school_id ON lms_levels(school_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_school_id ON lms_courses(school_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_level_id ON lms_courses(level_id);
CREATE INDEX IF NOT EXISTS idx_lms_schools_leader_id ON lms_schools(leader_id);
CREATE INDEX IF NOT EXISTS idx_lms_schools_ministry_id ON lms_schools(ministry_id);

-- 5. RLS para lms_schools
ALTER TABLE lms_schools ENABLE ROW LEVEL SECURITY;

-- Lectura pública (las escuelas activas son visibles para todos los autenticados)
CREATE POLICY "Authenticated users can view active schools"
    ON lms_schools FOR SELECT
    USING (is_active = true OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role::text IN ('admin', 'editor', 'pastor')
    ));

-- Solo admin/editor/pastor pueden insertar escuelas
CREATE POLICY "Admins can insert schools"
    ON lms_schools FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role::text IN ('admin', 'editor', 'pastor')
    ));

-- Admin/editor/pastor pueden actualizar cualquier escuela; líderes solo la suya
CREATE POLICY "Admins and leaders can update schools"
    ON lms_schools FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role::text IN ('admin', 'editor', 'pastor')
        )
        OR leader_id = auth.uid()
    );

-- Solo admin puede eliminar escuelas
CREATE POLICY "Admins can delete schools"
    ON lms_schools FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role::text IN ('admin', 'editor', 'pastor')
    ));

-- 6. RLS para lms_levels
ALTER TABLE lms_levels ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden ver niveles
CREATE POLICY "Authenticated users can view levels"
    ON lms_levels FOR SELECT
    USING (true);

-- Admin/editor/pastor y líderes de la escuela pueden gestionar niveles
CREATE POLICY "Admins and school leaders can insert levels"
    ON lms_levels FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role::text IN ('admin', 'editor', 'pastor')
        )
        OR EXISTS (
            SELECT 1 FROM lms_schools
            WHERE id = lms_levels.school_id
            AND leader_id = auth.uid()
        )
    );

CREATE POLICY "Admins and school leaders can update levels"
    ON lms_levels FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role::text IN ('admin', 'editor', 'pastor')
        )
        OR EXISTS (
            SELECT 1 FROM lms_schools
            WHERE id = lms_levels.school_id
            AND leader_id = auth.uid()
        )
    );

CREATE POLICY "Admins and school leaders can delete levels"
    ON lms_levels FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role::text IN ('admin', 'editor', 'pastor')
        )
        OR EXISTS (
            SELECT 1 FROM lms_schools
            WHERE id = lms_levels.school_id
            AND leader_id = auth.uid()
        )
    );

-- 7. Datos semilla: Escuelas Fundacionales
INSERT INTO lms_schools (name, slug, description, color, sort_order) VALUES
    ('Escuela de Cadetes', 'cadetes', 'Formación especializada para niños, preadolescentes y líderes del ministerio de cadetes.', '#4F46E5', 1),
    ('Escuela Dominical', 'dominical', 'Educación bíblica sistemática por edades, niveles o discipulado general.', '#059669', 2),
    ('Escuela de Teología y Ministerio', 'teologia', 'Formación de grado superior, liderazgo cristiano y seminario teológico.', '#D4AF37', 3)
ON CONFLICT (slug) DO NOTHING;

-- 8. Niveles semilla para cada escuela
DO $$
DECLARE
    v_cadetes_id UUID;
    v_dominical_id UUID;
    v_teologia_id UUID;
BEGIN
    SELECT id INTO v_cadetes_id FROM lms_schools WHERE slug = 'cadetes';
    SELECT id INTO v_dominical_id FROM lms_schools WHERE slug = 'dominical';
    SELECT id INTO v_teologia_id FROM lms_schools WHERE slug = 'teologia';

    -- Niveles de Cadetes
    IF v_cadetes_id IS NOT NULL THEN
        INSERT INTO lms_levels (school_id, name, description, sort_order) VALUES
            (v_cadetes_id, 'Explorador', 'Nivel introductorio para nuevos cadetes.', 1),
            (v_cadetes_id, 'Compañero', 'Segundo nivel de formación en cadetes.', 2),
            (v_cadetes_id, 'Guía', 'Nivel intermedio con responsabilidades de servicio.', 3),
            (v_cadetes_id, 'Conquistador', 'Nivel avanzado de liderazgo juvenil.', 4),
            (v_cadetes_id, 'Líder', 'Nivel máximo: formación de líderes de cadetes.', 5)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Niveles de Escuela Dominical
    IF v_dominical_id IS NOT NULL THEN
        INSERT INTO lms_levels (school_id, name, description, sort_order) VALUES
            (v_dominical_id, 'Párvulos', 'Niños de 3 a 5 años.', 1),
            (v_dominical_id, 'Principiantes', 'Niños de 6 a 8 años.', 2),
            (v_dominical_id, 'Primarios', 'Niños de 9 a 11 años.', 3),
            (v_dominical_id, 'Intermedios', 'Preadolescentes de 12 a 14 años.', 4),
            (v_dominical_id, 'Jóvenes', 'Adolescentes y jóvenes de 15 a 17 años.', 5),
            (v_dominical_id, 'Adultos', 'Discipulado general para adultos.', 6)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Niveles de Teología
    IF v_teologia_id IS NOT NULL THEN
        INSERT INTO lms_levels (school_id, name, description, sort_order) VALUES
            (v_teologia_id, 'Nivel Básico', 'Fundamentos de la fe y doctrina cristiana.', 1),
            (v_teologia_id, 'Nivel Intermedio', 'Estudios bíblicos intermedios y hermenéutica.', 2),
            (v_teologia_id, 'Nivel Avanzado', 'Teología sistemática y liderazgo pastoral.', 3),
            (v_teologia_id, 'Seminario', 'Formación ministerial y pastoral de grado superior.', 4)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
