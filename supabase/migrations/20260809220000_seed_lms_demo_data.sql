-- Migration: Seed LMS Demo Data (School, Levels, Courses, Weeks, Activities, Submissions, Sessions & Attendance)
-- Created At: 2026-08-09

-- 1. School
INSERT INTO public.lms_schools (id, name, slug, description, color, school_type, is_active, sort_order)
VALUES (
  '066575b1-149a-45d9-95fb-1fd0a0d7e461',
  'Escuela de Teología y Ministerio Pastoral',
  'teologia',
  'Formación bíblica, teológica y pastoral de alto nivel para líderes, servidores y miembros comprometidos de la Iglesia Jerusalén.',
  '#2563EB',
  'custom',
  true,
  1
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  is_active = true;

-- 2. Levels
INSERT INTO public.lms_levels (id, school_id, name, sort_order) VALUES
  ('11111111-0000-4000-8000-000000000001', '066575b1-149a-45d9-95fb-1fd0a0d7e461', 'Nivel I: Fundamentos Teológicos', 1),
  ('11111111-0000-4000-8000-000000000002', '066575b1-149a-45d9-95fb-1fd0a0d7e461', 'Nivel II: Liderazgo y Cuidado Pastoral', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- 3. Courses
INSERT INTO public.lms_courses (id, title, description, school_id, level_id, format, grading_scale, is_published) VALUES
  ('c0010000-0000-4000-8000-000000000001', 'Teología Sistemática I: Bibliología y Teontología', 'Estudio analítico sobre la revelación de las Escrituras, la naturaleza de Dios y sus atributos divinos.', '066575b1-149a-45d9-95fb-1fd0a0d7e461', '11111111-0000-4000-8000-000000000001', 'weekly', '10/10', true),
  ('c0020000-0000-4000-8000-000000000002', 'Liderazgo Pastoral y Cuidado Comunitario', 'Principios bíblicos de pastoreo, consejería, mentoría y gestión de equipos ministeriales.', '066575b1-149a-45d9-95fb-1fd0a0d7e461', '11111111-0000-4000-8000-000000000002', 'weekly', '10/10', true),
  ('c0030000-0000-4000-8000-000000000003', 'Hermenéutica y Exégesis Bíblica Aplicada', 'Métodos de interpretación bíblica, contexto gramático-histórico y herramientas para la predicación expositiva.', '066575b1-149a-45d9-95fb-1fd0a0d7e461', '11111111-0000-4000-8000-000000000001', 'weekly', '10/10', true)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, school_id = EXCLUDED.school_id, is_published = true;

-- 4. Weekly Sections for Course 1
INSERT INTO public.lms_sections (id, course_id, title, description, order_index) VALUES
  ('b1010000-0000-4000-8000-000000000001', 'c0010000-0000-4000-8000-000000000001', 'Semana 1: Introducción a la Bibliología y la Revelación Divina', 'La necesidad de la revelación general y especial de Dios en la historia de la salvación.', 1),
  ('b1020000-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000001', 'Semana 2: Inspiración, Inerrancia y el Canon de las Escrituras', 'Estudio del proceso histórico y divino del desarrollo del canon bíblico.', 2),
  ('b1030000-0000-4000-8000-000000000003', 'c0010000-0000-4000-8000-000000000001', 'Semana 3: La Doctrina de Dios: Atributos Incomunicables y Comunicables', 'Análisis teológico de la soberanía, omnisciencia, santidad y amor de Dios.', 3),
  ('b1040000-0000-4000-8000-000000000004', 'c0010000-0000-4000-8000-000000000001', 'Semana 4: La Doctrina de la Trinidad y la Vida Cristiana', 'Comprensión trinitaria en el culto, la oración y el servicio en la iglesia local.', 4)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, order_index = EXCLUDED.order_index;

-- 5. Activities (Resources, Forums, Assignments, Quizzes)
INSERT INTO public.lms_activities (id, section_id, title, type, content, teacher_content, settings, weighting, order_index) VALUES
  ('a1010000-0000-4000-8000-000000000001', 'b1010000-0000-4000-8000-000000000001', 'Guía de Lectura: Definiciones de Bibliología', 'resource', '<h4>Lectura Obligatoria</h4><p>Lee el capítulo 1 del texto guía sobre la Revelación General en el Salmo 19 y Romanos 1:18-20.</p>', NULL, '{}'::jsonb, 0, 1),
  ('a1010000-0000-4000-8000-000000000002', 'b1010000-0000-4000-8000-000000000001', 'Foro 1: ¿Cómo se manifiesta la Revelación General en la Creación?', 'forum', '<p>Comparte tu reflexión en al menos 200 palabras respondiendo cómo la creación testimonia la gloria de Dios.</p>', NULL, '{}'::jsonb, 15, 2),
  ('a1020000-0000-4000-8000-000000000003', 'b1020000-0000-4000-8000-000000000002', 'Tarea 1: Ensayo sobre la Inerrancia e Inspiración de las Escrituras', 'assignment', '<p>Redacta un ensayo reflexivo de 2 a 3 páginas explicando la doctrina de la inspiración verbal y plenaria según 2 Timoteo 3:16-17 y 2 Pedro 1:20-21.</p>', 'Rúbrica: Claridad argumentativa (40%), citas bíblicas relevantes (30%), aplicación pastoral (30%).', '{"max_score": 10, "deadline": "2026-08-20T23:59:00Z"}'::jsonb, 25, 1),
  ('a1030000-0000-4000-8000-000000000004', 'b1030000-0000-4000-8000-000000000003', 'Tarea 2: Cuadro Comparativo de los Atributos Divinos', 'assignment', '<p>Elabora una tabla clasificando 5 atributos incomunicables y 5 atributos comunicables de Dios con su respaldo bíblico.</p>', NULL, '{"max_score": 10, "deadline": "2026-08-27T23:59:00Z"}'::jsonb, 25, 1),
  ('a1040000-0000-4000-8000-000000000005', 'b1040000-0000-4000-8000-000000000004', 'Examen Integrador de Bibliología y Teontología', 'quiz', '<p>Evaluación final del curso con preguntas de opción múltiple, desarrollo corto y casos prácticos.</p>', NULL, '{"max_score": 10, "deadline": "2026-09-05T23:59:00Z"}'::jsonb, 35, 1)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, settings = EXCLUDED.settings;

-- 6. Class Sessions for Attendance
INSERT INTO public.lms_class_sessions (id, course_id, title, session_date) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'c0010000-0000-4000-8000-000000000001', 'Clase 1: Introducción a la Bibliología', '2026-08-01'),
  ('e1000000-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000001', 'Clase 2: Canon y Transmisión del Texto', '2026-08-08'),
  ('e1000000-0000-4000-8000-000000000003', 'c0010000-0000-4000-8000-000000000001', 'Clase 3: Atributos de Dios', '2026-08-15')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, session_date = EXCLUDED.session_date;
