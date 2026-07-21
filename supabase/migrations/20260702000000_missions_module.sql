-- Tabla de Misiones y Proyectos Evangelísticos
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  goal_amount NUMERIC(12,2),
  current_amount NUMERIC(12,2) DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'active', -- active, completed, paused
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
DROP POLICY IF EXISTS "missions_public_read" ON public.missions;
CREATE POLICY "missions_public_read" ON public.missions FOR SELECT USING (true);

-- Políticas de escritura para administradores y pastores
DROP POLICY IF EXISTS "missions_admin_insert" ON public.missions;
CREATE POLICY "missions_admin_insert" ON public.missions FOR INSERT WITH CHECK (
  (select auth.role()) = 'authenticated' AND 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'))
);

DROP POLICY IF EXISTS "missions_admin_update" ON public.missions;
CREATE POLICY "missions_admin_update" ON public.missions FOR UPDATE USING (
  (select auth.role()) = 'authenticated' AND 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'))
);

DROP POLICY IF EXISTS "missions_admin_delete" ON public.missions;
CREATE POLICY "missions_admin_delete" ON public.missions FOR DELETE USING (
  (select auth.role()) = 'authenticated' AND 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'))
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_missions_updated_at ON public.missions;
CREATE TRIGGER trg_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW EXECUTE FUNCTION update_missions_updated_at();
