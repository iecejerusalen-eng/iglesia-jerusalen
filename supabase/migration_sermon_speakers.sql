-- Migración: Crear perfiles de Speakers basados en los nombres de texto (pastor_name) de los Sermones

DO $$ 
DECLARE
    r RECORD;
    new_speaker_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
    v_role TEXT;
BEGIN
    -- Recorremos todos los nombres únicos de pastores en sermones que no tienen un speaker_id asignado
    FOR r IN 
        SELECT DISTINCT pastor_name 
        FROM public.sermons 
        WHERE speaker_id IS NULL AND pastor_name IS NOT NULL AND TRIM(pastor_name) != ''
    LOOP
        -- Procesamos el nombre para separar Nombre y Apellido rudimentariamente
        -- (Tomamos la primera palabra como first_name, el resto como last_name)
        v_first_name := split_part(TRIM(r.pastor_name), ' ', 1);
        v_last_name := right(TRIM(r.pastor_name), length(TRIM(r.pastor_name)) - length(v_first_name));
        
        -- Limpiamos espacios extra
        v_last_name := TRIM(v_last_name);
        IF v_last_name = '' THEN
            v_last_name := '-'; -- Se pone un guion si no hay apellido, ya que suele ser requerido
        END IF;

        -- Determinamos el rol (Si el nombre contiene la palabra "Pastor", le ponemos "Pastor", sino "Expositor")
        IF r.pastor_name ILIKE '%pastor%' THEN
            v_role := 'Pastor';
            -- Opcional: Remover la palabra "Pastor" del nombre para no repetirlo
            v_first_name := REPLACE(v_first_name, 'Pastor', '');
            IF TRIM(v_first_name) = '' THEN
                v_first_name := split_part(v_last_name, ' ', 1);
                v_last_name := right(v_last_name, length(v_last_name) - length(v_first_name));
            END IF;
        ELSE
            v_role := 'Expositor';
        END IF;

        -- Intentamos buscar si ya existe un expositor con ese primer nombre y apellido
        SELECT id INTO new_speaker_id 
        FROM public.speakers 
        WHERE first_name = TRIM(v_first_name) AND last_name = TRIM(v_last_name) 
        LIMIT 1;

        -- Si no existe, lo insertamos
        IF new_speaker_id IS NULL THEN
            new_speaker_id := gen_random_uuid();
            
            INSERT INTO public.speakers (id, first_name, last_name, role)
            VALUES (new_speaker_id, TRIM(v_first_name), TRIM(v_last_name), v_role);
        END IF;

        -- Finalmente, actualizamos todos los sermones de este pastor para asignarles el speaker_id
        UPDATE public.sermons
        SET speaker_id = new_speaker_id
        WHERE pastor_name = r.pastor_name AND speaker_id IS NULL;

    END LOOP;
END $$;
