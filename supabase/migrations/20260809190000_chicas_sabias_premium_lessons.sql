-- Migration: Add premium lessons and structured stages for Chicas Sabias
-- Created At: 2026-08-09

UPDATE public.study_programs SET
  summary = 'Club de formación y comunidad online para chicas jóvenes. Un espacio guiado para cultivar hábitos devocionales, edificar el carácter bíblico, cuidar el corazón en la era digital y construir amistades leales.',
  description = 'Chicas Sabias es una experiencia formativa y de acompañamiento espiritual diseñada para chicas jóvenes. En este club aprenderás a desarrollar una rutina de devocional matutino, proteger tus emociones frente a la presión social, tomar decisiones con discernimiento bíblico y cultivar amistades transformadoras. A través de lecturas guiadas, retos interactivos y encuentros en vivo por Google Meet, crecerás en fe y sabiduría junto a una comunidad de chicas apasionadas por Dios.',
  duration_label = 'Encuentros matutinos semanales · Modalidad online',
  updated_at = now()
WHERE slug = 'chicas-sabias';

-- Section 1: Etapa 1: Cimientos y Propósito del Club
INSERT INTO public.study_program_sections (id, program_id, title, description, order_index, is_published)
SELECT 'a71cbbb0-0000-4000-8000-000000000001', program.id,
  'Etapa 1: Cimientos y Propósito del Club',
  'Bienvenida, llamado a la sabiduría y principios fundamentales para construir una vida sobre la roca.', 0, true
FROM public.study_programs program WHERE program.slug = 'chicas-sabias'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  is_published = true;

-- Section 2: Etapa 2: Sabiduría Práctica en la Vida Diaria
INSERT INTO public.study_program_sections (id, program_id, title, description, order_index, is_published)
SELECT 'a71cbbb0-0000-4000-8000-000000000002', program.id,
  'Etapa 2: Sabiduría Práctica en la Vida Diaria',
  'Aprende a guardar tu corazón frente a la presión digital y cultiva relaciones sanas y transformadoras.', 1, true
FROM public.study_programs program WHERE program.slug = 'chicas-sabias'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  is_published = true;

-- Lesson 1: Bienvenida a Chicas Sabias
INSERT INTO public.study_program_lessons (id, section_id, title, summary, lesson_type, content_blocks, estimated_minutes, order_index, is_preview, is_published)
VALUES (
  'a71cccc0-0000-4000-8000-000000000001', 'a71cbbb0-0000-4000-8000-000000000001',
  'Bienvenida a Chicas Sabias',
  'Conoce el propósito del club, la visión bíblica y prepara tu espacio personal de lectura y oración.',
  'devotional',
  '[{"id":"cs-title","type":"section","title":"Leer, orar y crecer acompañadas"},{"id":"cs-text","type":"text","text":"<p>Este club reúne a chicas jóvenes que desean sostener una práctica de lectura y devocional matutino en comunidad. Cada encuentro abre un espacio para escuchar, reflexionar y acompañarnos con respeto y amor cristiano.</p>"},{"id":"cs-note","type":"reflection_note","question_text":"¿Qué esperas cultivar durante tu participación en el club Chicas Sabias?"}]'::jsonb,
  10, 0, true, true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_blocks = EXCLUDED.content_blocks,
  is_published = true;

-- Lesson 2: La Mujer Sabia Edifica su Vida (Proverbios 14:1)
INSERT INTO public.study_program_lessons (id, section_id, title, summary, lesson_type, content_blocks, estimated_minutes, order_index, is_preview, is_published)
VALUES (
  'a71cccc0-0000-4000-8000-000000000002', 'a71cbbb0-0000-4000-8000-000000000001',
  'La Mujer Sabia Edifica su Vida (Proverbios 14:1)',
  'Descubre la diferencia entre la sabiduría del mundo y la sabiduría que construye un carácter inquebrantable.',
  'devotional',
  '[{"id":"cs2-sec1","type":"section","title":"El Arte de Edificar sobre la Roca"},{"id":"cs2-txt1","type":"text","text":"<p>En <strong>Proverbios 14:1</strong>, la Palabra de Dios nos enseña: <em>«La mujer sabia edifica su casa; mas la necia con sus manos la derriba»</em>. Edificar no es un evento fortuito que ocurre de la noche a la mañana; es el resultado de decisiones diarias, pequeñas conversaciones, hábitos espirituales y la forma en que reaccionamos frente a las dificultades.</p><p>Como chicas jóvenes, a menudo nos enfrentamos a presiones para encajar, modas pasajeras o impulsos emocionales. Sin embargo, una mujer sabia aprende a construir su vida sobre la Roca firme de Cristo (Mateo 7:24), cultivando un carácter sereno, prudente y lleno de la gracia de Dios.</p>"},{"id":"cs2-fill1","type":"fill_blank","text":"La mujer [sabia] edifica su casa; mas la necia con sus manos la [derriba]."},{"id":"cs2-mc1","type":"multiple_choice","question_text":"¿Cuál de las siguientes actitudes demuestra una sabiduría bíblica práctica en momentos de tensión o conflicto?","options":["Responder inmediatamente impulsada por la emoción del momento para no quedarse callada.","Pausar, orar, examinar el asunto a la luz de la Palabra y responder con mansedumbre y verdad.","Guardar resentimiento en silencio y distanciarse sin dialogar con la otra persona.","Buscar la aprobación u opiniones de terceros en redes sociales antes que la guía de Dios."],"correct_option_idx":1},{"id":"cs2-slider1","type":"reflection_slider","question_text":"¿En qué medida sientes que tus conversaciones y hábitos de esta semana están edificando tu fe y la de quienes te rodean?"},{"id":"cs2-note1","type":"reflection_note","question_text":"Escribe una palabra o hábito concreto que deseas comenzar a edificar esta semana con la ayuda de Dios."}]'::jsonb,
  15, 1, false, true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_blocks = EXCLUDED.content_blocks,
  is_published = true;

-- Lesson 3: Guardando el Corazón en la Era Digital (Proverbios 4:23)
INSERT INTO public.study_program_lessons (id, section_id, title, summary, lesson_type, content_blocks, estimated_minutes, order_index, is_preview, is_published)
VALUES (
  'a71cccc0-0000-4000-8000-000000000003', 'a71cbbb0-0000-4000-8000-000000000002',
  'Guardando el Corazón en la Era Digital (Proverbios 4:23)',
  'Aprende a proteger tus pensamientos, emociones y tiempo frente al ruido, las comparaciones y la presión social.',
  'lesson',
  '[{"id":"cs3-sec1","type":"section","title":"Filtros de Luz en un Mundo Hiperconectado"},{"id":"cs3-txt1","type":"text","text":"<p>En <strong>Proverbios 4:23</strong> encontramos uno de los consejos más valiosos de las Escrituras: <em>«Sobre toda cosa guardada, guarda tu corazón; porque de él mana la vida»</em>. En la era digital, nuestro corazón y nuestra mente reciben miles de estímulos diarios: estándares irreales de belleza, comparaciones de estilo de vida, noticias estresantes y opiniones constantes.</p><p>Guardar el corazón no significa aislarnos del mundo, sino ser guardianas conscientes de lo que permitimos que entre en nuestra mente y en nuestras emociones. En Filipenses 4:8 se nos invita a pensar en todo lo que es verdadero, honesto, justo, puro, amable y de buen nombre.</p>"},{"id":"cs3-tf1","type":"true_false","question_text":"Verdadero o Falso: La verdadera belleza, dignidad y valor de una mujer joven aumentan o disminuyen según el número de likes, seguidores o comentarios que reciba en redes sociales.","correct_boolean":false},{"id":"cs3-dice1","type":"dice","question_text":"¡Lanza el dado de salud espiritual y reflexiona en la pregunta que te corresponda!","dice_options":["¿Qué cuenta o contenido en redes sociales necesitas dejar de seguir para cuidar tu paz mental?","¿Cómo reaccionas cuando sientes la tentación de compararte con los logros de alguien más?","¿Qué pasaje bíblico o promesa de Dios te devuelve la firmeza cuando sientes dudas sobre tu identidad?","¿En qué área de tu tiempo digital necesitas poner un límite saludable esta semana?","¿Qué amistad o conversación te inspira y motiva a acercarte más a Dios?","Da gracias a Dios en oración por 3 virtudes o talentos únicos que Él te regaló."]},{"id":"cs3-question1","type":"question","question_text":"¿Qué compromiso o filtro bíblico aplicarás a partir de hoy antes de consumir o compartir información en tu día a día?"}]'::jsonb,
  18, 0, false, true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_blocks = EXCLUDED.content_blocks,
  is_published = true;

-- Lesson 4: Amistades que Transforman e Inspiran (Rut y Noemí)
INSERT INTO public.study_program_lessons (id, section_id, title, summary, lesson_type, content_blocks, estimated_minutes, order_index, is_preview, is_published)
VALUES (
  'a71cccc0-0000-4000-8000-000000000004', 'a71cbbb0-0000-4000-8000-000000000002',
  'Amistades que Transforman e Inspiran (Rut y Noemí)',
  'Cultiva relaciones leales, maduras y empáticas que fortalezcan tu caminar cristiano.',
  'activity',
  '[{"id":"cs4-sec1","type":"section","title":"Caminar Acompañadas: El Valor de la Lealtad Cristiana"},{"id":"cs4-txt1","type":"text","text":"<p>La historia bíblica de <strong>Rut y Noemí</strong> (Rut 1:16-17) nos demuestra el impacto poderoso de una amistad madura y leal: <em>«Tu pueblo será mi pueblo, y tu Dios mi Dios»</em>. En Proverbios 27:17 también leemos: <em>«Hierro con hierro se aguza; y así el hombre aguza el rostro de su amigo»</em>.</p><p>Las verdaderas amigas no solo comparten momentos divertidos; se sostienen mutuamente en oración durante los días difíciles, celebran las victorias ajenas sin envidia y se dicen la verdad en amor para ayudarse a crecer. En Chicas Sabias valoramos un ambiente donde cada chica sea escuchada, respetada y animada en su fe.</p>"},{"id":"cs4-poll1","type":"poll","question_text":"¿Qué virtudes aprecias más en una amiga de fe en tu etapa de crecimiento actual?","options":["Lealtad y absoluta confidencialidad para guardar secretos y momentos personales.","Capacidad de escuchar con profunda empatía sin emitir juicios apresurados.","Iniciativa para orar juntas, compartir pasajes bíblicos y buscar a Dios.","Alegría, sentido del humor y disposición constante para apoyarse mutuamente."],"allow_other":true},{"id":"cs4-wordsearch1","type":"word_search","question_text":"Sopa de Letras de Virtudes: Encuentra y haz clic en las virtudes bíblicas de una amistad sabia:","word_search_words":["LEALTAD","EMPATÍA","ORACIÓN","GRACIA","PERDÓN","CONSEJO"]},{"id":"cs4-note1","type":"reflection_note","question_text":"Escribe el nombre de 2 amigas por las que vas a interceder esta semana y una acción concreta de aliento o cariño que tendrás con ellas."}]'::jsonb,
  20, 1, false, true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_blocks = EXCLUDED.content_blocks,
  is_published = true;
