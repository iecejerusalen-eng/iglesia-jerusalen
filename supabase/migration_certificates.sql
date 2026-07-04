-- Plantillas de certificado
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  pdf_url TEXT NOT NULL, -- URL pública en Cloudinary u otro servicio
  cloudinary_public_id TEXT, -- Para gestionar el archivo externamente
  page_width NUMERIC NOT NULL DEFAULT 612,
  page_height NUMERIC NOT NULL DEFAULT 792,
  field_mappings JSONB NOT NULL DEFAULT '[]',
  font_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fuentes personalizadas subidas
CREATE TABLE certificate_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  family TEXT NOT NULL,
  weight TEXT DEFAULT 'regular',
  font_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  format TEXT NOT NULL DEFAULT 'ttf',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de generación (auditoría)
CREATE TABLE certificate_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  generated_by UUID REFERENCES auth.users(id),
  field_data JSONB NOT NULL,
  batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_generations ENABLE ROW LEVEL SECURITY;

-- Políticas (Lectura para autenticados, Escritura para usuarios en general o con permisos)
-- En tu aplicación controlas los accesos desde el Frontend, pero puedes asegurar RLS
CREATE POLICY "Lectura para todos los autenticados (templates)" ON certificate_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura (templates)" ON certificate_templates FOR ALL TO authenticated USING (true);

CREATE POLICY "Lectura para todos los autenticados (fonts)" ON certificate_fonts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura (fonts)" ON certificate_fonts FOR ALL TO authenticated USING (true);

CREATE POLICY "Lectura (generations)" ON certificate_generations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura (generations)" ON certificate_generations FOR ALL TO authenticated USING (true);
