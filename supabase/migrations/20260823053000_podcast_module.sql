-- Migración: Módulo Podcast y extensión de Audio en Sermones
-- Fecha: 2026-08-23

-- 1. Tabla de Configuración de Podcast Show
CREATE TABLE IF NOT EXISTS podcast_show (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  language VARCHAR(10) DEFAULT 'es',
  itunes_category VARCHAR(100) DEFAULT 'Religion & Spirituality',
  itunes_subcategory VARCHAR(100) DEFAULT 'Christianity',
  author VARCHAR(255) DEFAULT 'Iglesia Jerusalén',
  email VARCHAR(255),
  website_url TEXT,
  spotify_url TEXT,
  apple_podcasts_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Series / Temporadas de Podcast
CREATE TABLE IF NOT EXISTS podcast_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Episodios de Podcast
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES podcast_show(id) ON DELETE SET NULL,
  series_id UUID REFERENCES podcast_series(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  show_notes TEXT,
  audio_url TEXT NOT NULL,
  audio_source_type VARCHAR(50) DEFAULT 'url', -- 'upload', 'url', 'embed'
  audio_duration_seconds INT DEFAULT 0,
  cover_image_url TEXT,
  transcript TEXT,
  ai_summary JSONB DEFAULT '{}'::jsonb,
  chapters JSONB DEFAULT '[]'::jsonb,
  season_number INT DEFAULT 1,
  episode_number INT,
  status VARCHAR(50) DEFAULT 'published', -- 'draft', 'published', 'scheduled'
  published_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Extensión de la tabla sermones para soporte de Audio y Resumen IA
ALTER TABLE sermons 
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_source_type VARCHAR(50) DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS audio_duration_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_summary JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS transcript TEXT;

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE podcast_show ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Lectura pública de podcast_show" ON podcast_show;
CREATE POLICY "Lectura pública de podcast_show" ON podcast_show FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Gestión admin de podcast_show" ON podcast_show;
CREATE POLICY "Gestión admin de podcast_show" ON podcast_show FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura pública de podcast_series" ON podcast_series;
CREATE POLICY "Lectura pública de podcast_series" ON podcast_series FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestión admin de podcast_series" ON podcast_series;
CREATE POLICY "Gestión admin de podcast_series" ON podcast_series FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura pública de podcast_episodes" ON podcast_episodes;
CREATE POLICY "Lectura pública de podcast_episodes" ON podcast_episodes FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Gestión admin de podcast_episodes" ON podcast_episodes;
CREATE POLICY "Gestión admin de podcast_episodes" ON podcast_episodes FOR ALL TO authenticated USING (true);
