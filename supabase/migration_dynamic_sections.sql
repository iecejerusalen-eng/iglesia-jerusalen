-- =======================================================
-- SQL MIGRATION: SECCIONES DINÁMICAS Y REORDENABLES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Agregar columnas adicionales a page_contents
ALTER TABLE public.page_contents ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
ALTER TABLE public.page_contents ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.page_contents ADD COLUMN IF NOT EXISTS section_type text DEFAULT 'custom';

-- 2. Semillar secciones por defecto para la página de Inicio (Home)
INSERT INTO public.page_contents (id, page, section, name, order_index, section_type, title, subtitle)
VALUES
  ('home_hero', 'home', 'hero', 'Sección Principal (Héroe)', 10, 'custom', 'Bienvenido a la Iglesia Jerusalén', 'Una Casa de Restauración y Bendición'),
  ('home_welcome', 'home', 'welcome', 'Nuestra Doctrina (4 Pilares)', 20, 'custom', 'Nuestra Doctrina', 'Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.'),
  ('home_schedules', 'home', 'schedules', 'Horarios de Reunión', 30, 'system_schedules', 'Horarios de Reunión', 'Te invitamos a acompañarnos en nuestras diversas actividades de la semana. ¡Nuestras puertas están abiertas!'),
  ('home_events', 'home', 'events', 'Próximos Eventos', 40, 'system_events', 'Próximos Eventos', 'Entérate de las próximas actividades especiales, conferencias y reuniones planificadas en nuestra iglesia.'),
  ('home_sermons', 'home', 'sermons', 'Últimas Prédicas', 50, 'system_sermons', 'Últimas Prédicas', 'Escucha y comparte los últimos mensajes y sermones dominicales de nuestros pastores.'),
  ('home_birthdays', 'home', 'birthdays', 'Cumpleaños de la Semana', 60, 'system_birthdays', 'Cumpleaños de la Semana', 'Celebramos la vida de nuestros hermanos que cumplen años en esta semana. ¡Que Dios les bendiga!'),
  ('home_donations', 'home', 'donations', 'Llamado a Ofrendas / Donativos', 70, 'custom', 'Apoya la Obra de Dios', 'Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio.')
ON CONFLICT (id) DO UPDATE SET 
  order_index = EXCLUDED.order_index,
  name = COALESCE(public.page_contents.name, EXCLUDED.name),
  section_type = EXCLUDED.section_type;

-- 3. Semillar secciones por defecto para la página Nosotros (About)
INSERT INTO public.page_contents (id, page, section, name, order_index, section_type, title, subtitle)
VALUES
  ('about_hero', 'about', 'hero', 'Héroe Principal', 10, 'custom', 'Quiénes Somos', 'Conoce la historia, misión, principios de fe y las personas llamadas por Dios a guiar a la Iglesia del Evangelio Cuadrangular Jerusalén.'),
  ('about_vision_mission', 'about', 'vision_mission', 'Misión y Visión', 20, 'custom', 'Misión & Visión', 'Nuestra guía en la expansión del evangelio.'),
  ('about_history', 'about', 'history', 'Nuestra Historia', 30, 'custom', 'Nuestra Historia', 'La trayectoria y cimientos de la congregación.'),
  ('about_pillars', 'about', 'pillars', 'Los 4 Pilares Cuadrangulares', 40, 'system_about_pillars', 'Los 4 Pilares Cuadrangulares', 'Fundamentados firmemente en el mensaje bíblico de la verdad eterna.'),
  ('about_pastoral', 'about', 'pastoral', 'Liderazgo Pastoral', 50, 'custom', 'Liderazgo Pastoral', 'Nuestros pastores principales llamados a guiar y cuidar espiritualmente a la congregación.')
ON CONFLICT (id) DO UPDATE SET 
  order_index = EXCLUDED.order_index,
  name = COALESCE(public.page_contents.name, EXCLUDED.name),
  section_type = EXCLUDED.section_type;
