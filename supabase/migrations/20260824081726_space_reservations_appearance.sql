-- Reservas, ubicaciones y apariencia pública.
-- Esta migración amplía los modelos existentes de forma compatible con instalaciones previas.

ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS map_url TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS booking_requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_bookable BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;

ALTER TABLE public.volunteer_shifts
  ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;

ALTER TABLE public.space_bookings
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.space_bookings
  DROP CONSTRAINT IF EXISTS space_bookings_valid_time;

ALTER TABLE public.space_bookings
  ADD CONSTRAINT space_bookings_valid_time CHECK (end_time > start_time);

CREATE INDEX IF NOT EXISTS idx_space_bookings_space_time
  ON public.space_bookings (space_id, start_time, end_time)
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_events_space_time
  ON public.events (space_id, start_date, end_date)
  WHERE space_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_space_time
  ON public.volunteer_shifts (space_id, start_time, end_time)
  WHERE space_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_approved_space_booking_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    IF EXISTS (
      SELECT 1
      FROM public.space_bookings AS existing
      WHERE existing.space_id = NEW.space_id
        AND existing.id <> NEW.id
        AND existing.status = 'approved'
        AND tstzrange(existing.start_time, existing.end_time, '[)')
            && tstzrange(NEW.start_time, NEW.end_time, '[)')
    ) THEN
      RAISE EXCEPTION 'El espacio ya está ocupado en ese horario';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS space_booking_conflict_guard ON public.space_bookings;
CREATE TRIGGER space_booking_conflict_guard
  BEFORE INSERT OR UPDATE OF space_id, start_time, end_time, status
  ON public.space_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_approved_space_booking_conflict();

ALTER TABLE public.space_bookings REPLICA IDENTITY FULL;
ALTER TABLE public.spaces REPLICA IDENTITY FULL;

ALTER TABLE public.church_settings
  ADD COLUMN IF NOT EXISTS appearance_config JSONB NOT NULL DEFAULT '{
    "site_name": "Iglesia Jerusalén",
    "tagline": "Una familia de fe",
    "primary_color": "#172554",
    "accent_color": "#D97706",
    "hero_media_type": "image",
    "hero_media_url": null,
    "show_live_badge": true
  }'::jsonb;

COMMENT ON COLUMN public.church_settings.appearance_config IS
  'Configuración editable de identidad y portada pública. No contiene secretos.';
