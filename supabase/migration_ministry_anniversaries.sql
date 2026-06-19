-- =======================================================
-- SQL MIGRATION: FECHA DE ANIVERSARIO EN MINISTERIOS Y SINCRONIZACIÓN DE EVENTOS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Agregar la columna anniversary_date a la tabla ministries
ALTER TABLE public.ministries ADD COLUMN IF NOT EXISTS anniversary_date DATE;

-- 2. Crear la función para sincronizar automáticamente el aniversario con la tabla de eventos
CREATE OR REPLACE FUNCTION public.sync_ministry_anniversary_to_events()
RETURNS TRIGGER AS $$
DECLARE
  event_id_var UUID;
  anniversary_title TEXT;
  anniversary_desc TEXT;
BEGIN
  anniversary_title := 'Aniversario - ' || NEW.name;
  anniversary_desc := 'Celebración del aniversario del ministerio/departamento ' || NEW.name || '.';

  -- Buscar si ya existe un evento de aniversario para este ministerio
  SELECT id INTO event_id_var 
  FROM public.events 
  WHERE ministry_id = NEW.id 
    AND (
      title = 'Aniversario - ' || OLD.name 
      OR title = 'Aniversario - ' || NEW.name 
      OR title LIKE 'Aniversario - %'
    );

  IF NEW.anniversary_date IS NOT NULL THEN
    IF event_id_var IS NOT NULL THEN
      -- Actualizar evento de aniversario existente
      UPDATE public.events
      SET 
        title = anniversary_title,
        description = anniversary_desc,
        start_date = NEW.anniversary_date,
        end_date = NEW.anniversary_date,
        is_recurring = true,
        recurrence_type = 'anual',
        emoji = '🎉'
      WHERE id = event_id_var;
    ELSE
      -- Insertar nuevo evento de aniversario
      INSERT INTO public.events (
        title, 
        description, 
        start_date, 
        end_date, 
        is_recurring, 
        recurrence_type, 
        ministry_id,
        emoji
      ) VALUES (
        anniversary_title,
        anniversary_desc,
        NEW.anniversary_date,
        NEW.anniversary_date,
        true,
        'anual',
        NEW.id,
        '🎉'
      );
    END IF;
  ELSE
    -- Si la fecha de aniversario se elimina (se pone en NULL), eliminar el evento
    IF event_id_var IS NOT NULL THEN
      DELETE FROM public.events WHERE id = event_id_var;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el trigger para insertar y actualizar
DROP TRIGGER IF EXISTS trg_sync_ministry_anniversary_to_events ON public.ministries;
CREATE TRIGGER trg_sync_ministry_anniversary_to_events
  AFTER INSERT OR UPDATE OF name, anniversary_date
  ON public.ministries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_ministry_anniversary_to_events();

-- 4. Crear la función y trigger para eliminar eventos de aniversario al borrar un ministerio
CREATE OR REPLACE FUNCTION public.delete_ministry_anniversary_event()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.events WHERE ministry_id = OLD.id AND title LIKE 'Aniversario - %';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_delete_ministry_anniversary_event ON public.ministries;
CREATE TRIGGER trg_delete_ministry_anniversary_event
  BEFORE DELETE ON public.ministries
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_ministry_anniversary_event();
