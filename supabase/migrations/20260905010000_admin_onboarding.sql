-- Onboarding guiado por rol para el panel administrativo.
CREATE TABLE IF NOT EXISTS public.onboarding_pasos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT NOT NULL,
  orden INTEGER NOT NULL CHECK (orden > 0),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  accion_label TEXT NOT NULL,
  accion_ruta TEXT NOT NULL,
  icono TEXT NOT NULL,
  es_obligatorio BOOLEAN NOT NULL DEFAULT true,
  puntos INTEGER NOT NULL DEFAULT 10 CHECK (puntos >= 0),
  UNIQUE (rol, orden)
);

CREATE TABLE IF NOT EXISTS public.onboarding_progreso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paso_id UUID NOT NULL REFERENCES public.onboarding_pasos(id) ON DELETE CASCADE,
  completado_at TIMESTAMPTZ,
  omitido BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (usuario_id, paso_id)
);

CREATE TABLE IF NOT EXISTS public.onboarding_configuracion (
  usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completado BOOLEAN NOT NULL DEFAULT false,
  onboarding_omitido BOOLEAN NOT NULL DEFAULT false,
  porcentaje_completado INTEGER NOT NULL DEFAULT 0 CHECK (porcentaje_completado BETWEEN 0 AND 100),
  ultima_actividad TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_pasos_rol_orden_idx ON public.onboarding_pasos (rol, orden);
CREATE INDEX IF NOT EXISTS onboarding_progreso_usuario_idx ON public.onboarding_progreso (usuario_id);

ALTER TABLE public.onboarding_pasos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding pasos visibles para usuarios autenticados" ON public.onboarding_pasos;
CREATE POLICY "onboarding pasos visibles para usuarios autenticados"
  ON public.onboarding_pasos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "usuarios ven su onboarding" ON public.onboarding_progreso;
CREATE POLICY "usuarios ven su onboarding"
  ON public.onboarding_progreso FOR SELECT TO authenticated
  USING ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "usuarios crean su progreso" ON public.onboarding_progreso;
CREATE POLICY "usuarios crean su progreso"
  ON public.onboarding_progreso FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "usuarios actualizan su progreso" ON public.onboarding_progreso;
CREATE POLICY "usuarios actualizan su progreso"
  ON public.onboarding_progreso FOR UPDATE TO authenticated
  USING ((select auth.uid()) = usuario_id)
  WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "usuarios ven su configuracion" ON public.onboarding_configuracion;
CREATE POLICY "usuarios ven su configuracion"
  ON public.onboarding_configuracion FOR SELECT TO authenticated
  USING ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "usuarios crean su configuracion" ON public.onboarding_configuracion;
CREATE POLICY "usuarios crean su configuracion"
  ON public.onboarding_configuracion FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "usuarios actualizan su configuracion" ON public.onboarding_configuracion;
CREATE POLICY "usuarios actualizan su configuracion"
  ON public.onboarding_configuracion FOR UPDATE TO authenticated
  USING ((select auth.uid()) = usuario_id)
  WITH CHECK ((select auth.uid()) = usuario_id);

INSERT INTO public.onboarding_pasos (rol, orden, titulo, descripcion, accion_label, accion_ruta, icono, puntos) VALUES
('admin', 1, 'Configura tu iglesia', 'Añade el nombre oficial, dirección, logo y datos de contacto de Iglesia Jerusalén.', 'Ir a Configuración', '/admin/configuracion', '⚙️', 20),
('admin', 2, 'Invita a tu equipo', 'Crea cuentas para los líderes de cada ministerio y asígnales su rol.', 'Gestionar usuarios', '/admin/usuarios', '👥', 15),
('admin', 3, 'Registra tu primer miembro', 'Añade al menos un miembro al CRM para que el sistema comience a funcionar.', 'Abrir CRM', '/admin/miembros', '👤', 15),
('admin', 4, 'Configura un método de pago', 'Conecta tu cuenta bancaria o pasarela de pago para recibir diezmos.', 'Configurar pagos', '/admin/pagos-envios', '💳', 20),
('admin', 5, 'Publica tu primer anuncio', 'Crea un anuncio que aparezca en el sitio público de la iglesia.', 'Crear anuncio', '/admin/anuncios', '📢', 10),
('pastor', 1, 'Completa tu perfil pastoral', 'Añade la información pública de liderazgo que aparecerá en el sitio.', 'Editar liderazgo', '/admin/pastores', '👤', 15),
('pastor', 2, 'Sube tu primera prédica', 'Comparte el mensaje del último culto con video, audio o texto.', 'Subir prédica', '/admin/sermones', '🎙️', 20),
('pastor', 3, 'Revisa las peticiones de oración', 'Hay personas esperando respuesta pastoral a sus peticiones.', 'Ver peticiones', '/admin/peticiones', '🙏', 15),
('pastor', 4, 'Agenda tu primera visita pastoral', 'Programa una visita a un miembro en tu agenda personal.', 'Abrir agenda', '/admin/eventos', '📅', 10),
('leader', 1, 'Configura tu ministerio', 'Añade descripción, miembros y foto de portada a tu ministerio.', 'Editar ministerio', '/admin/ministerios', '✝️', 20),
('leader', 2, 'Registra a tu equipo', 'Añade los miembros que forman parte de tu ministerio al CRM.', 'Ir al CRM', '/admin/miembros', '👥', 15),
('leader', 3, 'Publica una idea o necesidad', 'Usa el panel de ideas para comunicar lo que necesita tu ministerio.', 'Panel de ideas', '/admin/ideas', '💡', 10),
('leader', 4, 'Crea tu primer evento', 'Programa la próxima actividad de tu ministerio.', 'Crear evento', '/admin/eventos', '📅', 15),
('secretaria', 1, 'Importa el directorio de miembros', 'Sube el listado de miembros desde un archivo Excel o CSV.', 'Importar miembros', '/admin/miembros', '📊', 25),
('secretaria', 2, 'Configura las categorías de ofrenda', 'Define los tipos de ofrenda y diezmo que maneja la iglesia.', 'Gestión financiera', '/admin/finanzas', '💰', 15),
('secretaria', 3, 'Activa el sistema de check-in', 'Configura el kiosco de check-in para el próximo culto.', 'Check-in kiosko', '/admin/checkin-kiosk', '✅', 20),
('secretary', 1, 'Importa el directorio de miembros', 'Sube el listado de miembros desde un archivo Excel o CSV.', 'Importar miembros', '/admin/miembros', '📊', 25),
('secretary', 2, 'Configura las categorías de ofrenda', 'Define los tipos de ofrenda y diezmo que maneja la iglesia.', 'Gestión financiera', '/admin/finanzas', '💰', 15),
('secretary', 3, 'Activa el sistema de check-in', 'Configura el kiosco de check-in para el próximo culto.', 'Check-in kiosko', '/admin/checkin-kiosk', '✅', 20),
('musico', 1, 'Sube tu primera alabanza', 'Añade letra, acordes o archivo de audio de una canción.', 'Biblioteca alabanzas', '/admin/alabanzas', '🎵', 15),
('musico', 2, 'Conecta con ProPresenter o Holyrics', 'Sincroniza tu biblioteca de canciones con tu software de presentación.', 'Conectar software', '/admin/propresenter', '🖥️', 20)
ON CONFLICT (rol, orden) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, accion_label = EXCLUDED.accion_label, accion_ruta = EXCLUDED.accion_ruta, icono = EXCLUDED.icono, puntos = EXCLUDED.puntos;
