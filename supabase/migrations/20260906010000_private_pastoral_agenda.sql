-- Agenda pastoral privada por propietario. Todo registro es privado por defecto.
CREATE TABLE IF NOT EXISTS public.agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('visita', 'reunion', 'consejeria', 'llamada', 'evento', 'tarea', 'recordatorio', 'cumpleanos', 'bautismo', 'seguimiento')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  persona_crm_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  persona_nombre TEXT,
  ubicacion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  todo_el_dia BOOLEAN NOT NULL DEFAULT false,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'cancelado', 'reagendado')),
  prioridad TEXT NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  recordatorio_minutos INTEGER NOT NULL DEFAULT 60 CHECK (recordatorio_minutos >= 0),
  notas_resultado TEXT,
  color TEXT NOT NULL DEFAULT '#1e1558',
  fuente TEXT NOT NULL DEFAULT 'manual' CHECK (fuente IN ('manual', 'crm', 'pipeline', 'evento', 'cumpleanos', 'sistema')),
  es_publico BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agenda_items_fecha_valida CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX IF NOT EXISTS agenda_items_usuario_fecha_idx ON public.agenda_items (usuario_id, fecha_inicio);
CREATE INDEX IF NOT EXISTS agenda_items_publicos_fecha_idx ON public.agenda_items (fecha_inicio) WHERE es_publico = true;

ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda privada del propietario" ON public.agenda_items;
CREATE POLICY "agenda privada del propietario"
  ON public.agenda_items FOR SELECT TO authenticated
  USING ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "propietario crea agenda" ON public.agenda_items;
CREATE POLICY "propietario crea agenda"
  ON public.agenda_items FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "propietario actualiza agenda" ON public.agenda_items;
CREATE POLICY "propietario actualiza agenda"
  ON public.agenda_items FOR UPDATE TO authenticated
  USING ((select auth.uid()) = usuario_id)
  WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "propietario elimina agenda" ON public.agenda_items;
CREATE POLICY "propietario elimina agenda"
  ON public.agenda_items FOR DELETE TO authenticated
  USING ((select auth.uid()) = usuario_id);

-- La vista pública no contiene descripción, notas ni IDs CRM.
CREATE OR REPLACE VIEW public.agenda_publica
  WITH (security_invoker = true)
AS
SELECT id, tipo, titulo, persona_nombre, ubicacion, fecha_inicio, fecha_fin,
       todo_el_dia, estado, prioridad, color, fuente
FROM public.agenda_items
WHERE es_publico = true AND estado <> 'cancelado';

GRANT SELECT ON public.agenda_publica TO anon, authenticated;

DROP POLICY IF EXISTS "agenda pública explícita" ON public.agenda_items;
CREATE POLICY "agenda pública explícita"
  ON public.agenda_items FOR SELECT TO anon, authenticated
  USING (es_publico = true);

CREATE OR REPLACE FUNCTION public.set_agenda_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agenda_items_updated_at ON public.agenda_items;
CREATE TRIGGER agenda_items_updated_at
  BEFORE UPDATE ON public.agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.set_agenda_items_updated_at();
