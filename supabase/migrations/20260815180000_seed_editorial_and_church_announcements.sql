-- Contenido inicial editable para Iglesia general, ministerios/departamentos
-- y anuncios importantes. La semilla es conservadora: nunca reemplaza
-- espacios, categorías, documentos ni anuncios creados previamente.

-- ---------------------------------------------------------------------------
-- Iglesia general
-- ---------------------------------------------------------------------------
INSERT INTO public.editorial_spaces (
  id, slug, name, description, owner_type, ministry_id, program_id,
  cover_image_url, accent_color, is_published, allow_comments
)
VALUES (
  'ed180000-0000-4000-8000-000000000001',
  'iglesia-general',
  'Iglesia general',
  'Comunicaciones, visión, vida comunitaria y oportunidades para servir en toda la congregación.',
  'church', NULL, NULL, NULL, '#C99A49', true, true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.editorial_categories (id, space_id, name, slug, description, color, order_index)
SELECT 'ed181000-0000-4000-8000-000000000001', space.id, 'Vida de Iglesia', 'vida-de-iglesia',
  'Historias, visión y noticias que nos unen como congregación.', '#C99A49', 0
FROM public.editorial_spaces AS space
WHERE space.slug = 'iglesia-general'
ON CONFLICT (space_id, slug) DO NOTHING;

INSERT INTO public.editorial_categories (id, space_id, name, slug, description, color, order_index)
SELECT 'ed181000-0000-4000-8000-000000000002', space.id, 'Servicio y comunidad', 'servicio-y-comunidad',
  'Formas prácticas de participar, servir y acompañarnos.', '#2563EB', 1
FROM public.editorial_spaces AS space
WHERE space.slug = 'iglesia-general'
ON CONFLICT (space_id, slug) DO NOTHING;

INSERT INTO public.editorial_documents (
  id, space_id, category_id, document_type, title, slug, excerpt,
  cover_image_url, content_blocks, visibility, status, published_at,
  is_featured, allow_comments, order_index
)
VALUES (
  'ed182000-0000-4000-8000-000000000001',
  (SELECT id FROM public.editorial_spaces WHERE slug = 'iglesia-general'),
  (SELECT category.id FROM public.editorial_categories AS category
   JOIN public.editorial_spaces AS space ON space.id = category.space_id
   WHERE space.slug = 'iglesia-general' AND category.slug = 'vida-de-iglesia'),
  'page', 'Bienvenidos a la Iglesia Jerusalén', 'bienvenidos',
  'Un punto de encuentro para conocer nuestra identidad, caminar en comunidad y servir con propósito.',
  NULL,
  '[
    {"id":"church-welcome-section","type":"section","title":"Una familia que sigue a Jesús"},
    {"id":"church-welcome-text","type":"text","text":"<p>La Iglesia Jerusalén es una comunidad que desea vivir el evangelio con sencillez, alegría y compromiso. Aquí encontrarás noticias, recursos y oportunidades para acompañar la vida de la congregación.</p><p>Te invitamos a participar en los cultos, grupos, ministerios y acciones de servicio. Cada persona puede aportar sus dones para edificar a otros y hacer visible el amor de Cristo.</p>"},
    {"id":"church-welcome-note","type":"reflection_note","question_text":"¿En qué área de la vida de Iglesia te gustaría crecer o servir durante esta temporada?"}
  ]'::jsonb,
  'public', 'published', now(), true, true, 0
), (
  'ed182000-0000-4000-8000-000000000002',
  (SELECT id FROM public.editorial_spaces WHERE slug = 'iglesia-general'),
  (SELECT category.id FROM public.editorial_categories AS category
   JOIN public.editorial_spaces AS space ON space.id = category.space_id
   WHERE space.slug = 'iglesia-general' AND category.slug = 'vida-de-iglesia'),
  'post', 'Nuestra visión para este año', 'nuestra-vision',
  'Tres movimientos sencillos para seguir creciendo: adorar, formar discípulos y servir a la ciudad.',
  NULL,
  '[
    {"id":"church-vision-section","type":"section","title":"Adorar, formar y servir"},
    {"id":"church-vision-text","type":"text","text":"<p>Durante este año queremos fortalecer una Iglesia que adora a Dios, forma discípulos y sirve con misericordia. La visión se vuelve práctica cuando oramos juntos, cuidamos a las familias y abrimos espacio para que nuevas personas conozcan a Jesús.</p><ul><li><strong>Adorar:</strong> cultivar una relación sincera con Dios.</li><li><strong>Formar:</strong> aprender la Palabra y acompañarnos en el camino.</li><li><strong>Servir:</strong> responder a las necesidades de nuestra comunidad.</li></ul>"},
    {"id":"church-vision-question","type":"question","question_text":"¿Qué paso concreto puedes dar para vivir esta visión con tu familia o equipo?"}
  ]'::jsonb,
  'public', 'published', now(), false, true, 1
), (
  'ed182000-0000-4000-8000-000000000003',
  (SELECT id FROM public.editorial_spaces WHERE slug = 'iglesia-general'),
  (SELECT category.id FROM public.editorial_categories AS category
   JOIN public.editorial_spaces AS space ON space.id = category.space_id
   WHERE space.slug = 'iglesia-general' AND category.slug = 'servicio-y-comunidad'),
  'post', 'Cuerpo de Apoyo: servir juntos', 'cuerpo-de-apoyo-servir-juntos',
  'Conoce cómo el Cuerpo de Apoyo acompaña las necesidades prácticas de la Iglesia y sus actividades.',
  NULL,
  '[
    {"id":"support-section","type":"section","title":"Disponibilidad para ayudar"},
    {"id":"support-text","type":"text","text":"<p>El Cuerpo de Apoyo reúne a personas dispuestas a colaborar antes, durante y después de las actividades de la Iglesia. Su servicio puede incluir bienvenida, orden, logística, cuidado de espacios y apoyo a las familias.</p><p>Si deseas participar, acércate al equipo pastoral o comunícate con la coordinación. Servir también es una manera de cuidar a quienes Dios ha puesto a nuestro lado.</p>"}
  ]'::jsonb,
  'public', 'published', now(), false, true, 2
)
ON CONFLICT (space_id, slug) WHERE parent_id IS NULL DO NOTHING;

-- ---------------------------------------------------------------------------
-- Ministerios y departamentos
-- ---------------------------------------------------------------------------
-- Se crea un espacio para cada ministerio existente, excepto Cuerpo de Apoyo,
-- que pertenece a Iglesia general según la organización definida por la Iglesia.
INSERT INTO public.editorial_spaces (
  slug, name, description, owner_type, ministry_id, program_id,
  cover_image_url, accent_color, is_published, allow_comments
)
SELECT
  'ministerio-' || ministry.slug,
  'Publicaciones de ' || ministry.name,
  'Noticias, recursos, testimonios y agenda de ' || ministry.name || '.',
  'ministry', ministry.id, NULL,
  ministry.image_url,
  COALESCE(ministry.theme_color, '#2563EB'),
  true, true
FROM public.ministries AS ministry
WHERE lower(ministry.name) NOT LIKE '%cuerpo%de%apoyo%'
  AND lower(ministry.slug) NOT LIKE '%cuerpo-de-apoyo%'
  AND NOT EXISTS (
    SELECT 1 FROM public.editorial_spaces AS existing
    WHERE existing.ministry_id = ministry.id
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.editorial_categories (space_id, name, slug, description, color, order_index)
SELECT space.id, 'Bienvenida', 'bienvenida', 'Identidad, propósito y novedades del equipo.', '#2563EB', 0
FROM public.editorial_spaces AS space
WHERE space.owner_type = 'ministry' AND space.ministry_id IS NOT NULL
ON CONFLICT (space_id, slug) DO NOTHING;

INSERT INTO public.editorial_categories (space_id, name, slug, description, color, order_index)
SELECT space.id, 'Recursos y agenda', 'recursos-y-agenda', 'Materiales, reuniones y próximos pasos del ministerio.', '#0EA5E9', 1
FROM public.editorial_spaces AS space
WHERE space.owner_type = 'ministry' AND space.ministry_id IS NOT NULL
ON CONFLICT (space_id, slug) DO NOTHING;

INSERT INTO public.editorial_documents (
  space_id, category_id, document_type, title, slug, excerpt,
  cover_image_url, content_blocks, visibility, status, published_at,
  is_featured, allow_comments, order_index
)
SELECT
  space.id,
  welcome_category.id,
  'page',
  'Bienvenidos a ' || ministry.name,
  'bienvenidos',
  'Conoce el propósito, el corazón y las formas de participar en ' || ministry.name || '.',
  NULL,
  jsonb_build_array(
    jsonb_build_object('id', 'ministry-welcome-section', 'type', 'section', 'title', 'Un equipo para edificar'),
    jsonb_build_object('id', 'ministry-welcome-text', 'type', 'text', 'text',
      '<p>' || ministry.name || ' existe para servir a Dios y cuidar a las personas desde sus dones y responsabilidades. Este espacio reunirá noticias, testimonios, recursos y próximos pasos del equipo.</p><p>Si deseas conocer más o sumarte, conversa con la coordinación del ministerio. Hay un lugar para aprender, ayudar y crecer junto a otros.</p>'),
    jsonb_build_object('id', 'ministry-welcome-note', 'type', 'reflection_note', 'question_text', '¿Qué don o experiencia te gustaría poner al servicio de este ministerio?')
  ),
  'public', 'published', now(), true, true, 0
FROM public.editorial_spaces AS space
JOIN public.ministries AS ministry ON ministry.id = space.ministry_id
JOIN public.editorial_categories AS welcome_category
  ON welcome_category.space_id = space.id AND welcome_category.slug = 'bienvenida'
WHERE space.owner_type = 'ministry'
  AND NOT EXISTS (
    SELECT 1 FROM public.editorial_documents AS existing
    WHERE existing.space_id = space.id AND existing.parent_id IS NULL AND existing.slug = 'bienvenidos'
  );

INSERT INTO public.editorial_documents (
  space_id, category_id, document_type, title, slug, excerpt,
  cover_image_url, content_blocks, visibility, status, published_at,
  is_featured, allow_comments, order_index
)
SELECT
  space.id,
  resource_category.id,
  'post',
  'Agenda y recursos de ' || ministry.name,
  'agenda-y-recursos',
  'Un tablero sencillo para organizar reuniones, materiales y acciones del equipo.',
  NULL,
  jsonb_build_array(
    jsonb_build_object('id', 'ministry-agenda-section', 'type', 'section', 'title', 'Prepararnos para servir mejor'),
    jsonb_build_object('id', 'ministry-agenda-text', 'type', 'text', 'text',
      '<p>Usa este espacio para publicar la agenda del ministerio, acuerdos de reunión, materiales de formación y testimonios de servicio. Mantén las fechas actualizadas y enlaza cada actividad con el calendario general cuando corresponda.</p><p><strong>Próximo paso:</strong> agrega aquí el horario de reunión, el contacto de coordinación y el recurso que el equipo necesita revisar.</p>')
  ),
  'public', 'published', now(), false, true, 1
FROM public.editorial_spaces AS space
JOIN public.ministries AS ministry ON ministry.id = space.ministry_id
JOIN public.editorial_categories AS resource_category
  ON resource_category.space_id = space.id AND resource_category.slug = 'recursos-y-agenda'
WHERE space.owner_type = 'ministry'
  AND NOT EXISTS (
    SELECT 1 FROM public.editorial_documents AS existing
    WHERE existing.space_id = space.id AND existing.parent_id IS NULL AND existing.slug = 'agenda-y-recursos'
  );

-- ---------------------------------------------------------------------------
-- Eventos y anuncios importantes de Iglesia general
-- ---------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS emoji text;

INSERT INTO public.events (
  id, title, description, start_date, end_date, start_time, end_time,
  is_recurring, ministry_id, leaders_in_charge, is_public, emoji
)
VALUES
  (
    'e1800000-0000-4000-8000-000000000001',
    'Venta de comidas: Sabores que construyen',
    'Jornada solidaria para recaudar fondos destinados a la construcción y adecuación de la Iglesia.',
    '2026-09-05', '2026-09-05', '10:00', '15:00', false, NULL, ARRAY['Iglesia Jerusalén'], true, '🍲'
  ),
  (
    'e1800000-0000-4000-8000-000000000002',
    'Culto de acción de gracias y visión',
    'Celebramos juntos la fidelidad de Dios y compartimos los próximos pasos de la congregación.',
    '2026-08-30', '2026-08-30', '09:00', '11:30', false, NULL, ARRAY['Equipo pastoral'], true, '🙌'
  ),
  (
    'e1800000-0000-4000-8000-000000000003',
    'Escuela de servidores',
    'Encuentro de formación práctica para quienes sirven o desean integrarse a un equipo de la Iglesia.',
    '2026-09-12', '2026-09-12', '16:00', '18:00', false, NULL, ARRAY['Liderazgo de la Iglesia'], true, '📚'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.church_announcements (
  id, title, summary, body, image_url, event_id, status, is_featured,
  publish_at, expires_at
)
VALUES
  (
    'a1800000-0000-4000-8000-000000000001',
    'Sabores que construyen: únete a la jornada solidaria',
    'Compra, comparte y ayúdanos a avanzar en la construcción de nuestra Iglesia.',
    'El sábado 5 de septiembre tendremos una venta de comidas preparada con mucho cariño por la congregación. Puedes colaborar comprando, donando insumos o ayudando en la organización. Cada aporte suma y nos permite seguir construyendo un lugar para adorar, aprender y recibir a más familias.',
    NULL, 'e1800000-0000-4000-8000-000000000001', 'published', true, now(), NULL
  ),
  (
    'a1800000-0000-4000-8000-000000000002',
    'Una mañana para agradecer y mirar hacia adelante',
    'Acompáñanos en nuestro culto especial de acción de gracias y visión de Iglesia.',
    'Este encuentro será un momento para reconocer la fidelidad de Dios, orar por nuestras familias y conocer los próximos pasos de la Iglesia Jerusalén. Invita a alguien y ven con el corazón dispuesto para celebrar juntos.',
    NULL, 'e1800000-0000-4000-8000-000000000002', 'published', true, now(), NULL
  ),
  (
    'a1800000-0000-4000-8000-000000000003',
    'Inscripciones abiertas para la Escuela de servidores',
    'Prepárate para servir con humildad, orden y excelencia en la obra de Dios.',
    'Abrimos un nuevo encuentro de formación para todas las personas que ya sirven o desean integrarse a un ministerio. Conversaremos sobre carácter, trabajo en equipo, cuidado de las personas y herramientas prácticas para servir mejor.',
    NULL, 'e1800000-0000-4000-8000-000000000003', 'published', false, now(), NULL
  )
ON CONFLICT (id) DO NOTHING;
