-- =============================================================================
-- SEED: Escuela Dominical - Datos completos de demostración
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================================
-- IMPORTANTE: Reemplaza 'TU_USER_ID_AQUI' con tu UUID de auth.users
-- Para obtenerlo, ejecuta primero: SELECT id, email FROM auth.users;
-- =============================================================================

DO $$
DECLARE
  -- Cambia este valor por tu user_id real
  v_admin_id        UUID := (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

  -- Escuela Dominical
  v_school_id       UUID;

  -- Cursos
  v_curso_biblia    UUID;
  v_curso_doctrina  UUID;
  v_curso_vida      UUID;

  -- Subjects (Materias) - Biblia
  v_subj_at         UUID; -- Antiguo Testamento
  v_subj_nt         UUID; -- Nuevo Testamento

  -- Subjects - Doctrina
  v_subj_trinitaria UUID;
  v_subj_salvacion  UUID;

  -- Subjects - Vida Cristiana
  v_subj_oracion    UUID;
  v_subj_mayordom   UUID;

  -- Modules
  v_mod_id          UUID;

BEGIN

  -- ============================================================
  -- 1. ESCUELA DOMINICAL
  -- ============================================================
  INSERT INTO public.lms_schools (name, slug, description, is_active, color, sort_order)
  VALUES (
    'Escuela Dominical',
    'escuela-dominical',
    'Formación bíblica y espiritual para todas las edades en la Iglesia Jerusalén',
    true,
    '#C4930A',
    1
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description
  RETURNING id INTO v_school_id;

  RAISE NOTICE 'Escuela Dominical creada: %', v_school_id;

  -- ============================================================
  -- 2. CURSOS
  -- ============================================================

  -- Curso 1: Fundamentos Bíblicos
  INSERT INTO public.lms_courses (title, description, format, grading_scale, is_published, school_id)
  VALUES (
    'Fundamentos Bíblicos',
    'Un recorrido sistemático por las Sagradas Escrituras: desde el Génesis hasta el Apocalipsis. Conoce la trama redentora de Dios a través de su Palabra.',
    'topics',
    '10/10',
    true,
    v_school_id
  ) RETURNING id INTO v_curso_biblia;

  -- Curso 2: Doctrina Cristiana
  INSERT INTO public.lms_courses (title, description, format, grading_scale, is_published, school_id)
  VALUES (
    'Doctrina Cristiana',
    'Estudio profundo de las doctrinas fundamentales de la fe cristiana: la Trinidad, la Salvación, la Iglesia, los Sacramentos y las Últimas Cosas.',
    'topics',
    '10/10',
    true,
    v_school_id
  ) RETURNING id INTO v_curso_doctrina;

  -- Curso 3: Vida Cristiana Práctica
  INSERT INTO public.lms_courses (title, description, format, grading_scale, is_published, school_id)
  VALUES (
    'Vida Cristiana Práctica',
    'Aprende a vivir los principios bíblicos en tu vida diaria: oración, mayordomía, servicio, evangelismo y santidad.',
    'topics',
    '10/10',
    true,
    v_school_id
  ) RETURNING id INTO v_curso_vida;

  RAISE NOTICE 'Cursos creados: %, %, %', v_curso_biblia, v_curso_doctrina, v_curso_vida;

  -- ============================================================
  -- 3. ENROLLAR AL ADMIN COMO DOCENTE en los 3 cursos
  -- ============================================================
  INSERT INTO public.lms_enrollments (course_id, user_id, role)
  VALUES
    (v_curso_biblia,   v_admin_id, 'teacher'),
    (v_curso_doctrina, v_admin_id, 'teacher'),
    (v_curso_vida,     v_admin_id, 'teacher')
  ON CONFLICT (course_id, user_id) DO UPDATE SET role = 'teacher';

  INSERT INTO public.lms_course_teachers (course_id, user_id)
  VALUES
    (v_curso_biblia,   v_admin_id),
    (v_curso_doctrina, v_admin_id),
    (v_curso_vida,     v_admin_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Docente asignado a todos los cursos';

  -- ============================================================
  -- 4. MATERIAS (SUBJECTS) - Curso: Fundamentos Bíblicos
  -- ============================================================
  INSERT INTO public.lms_subjects (course_id, title, description, order_index)
  VALUES (v_curso_biblia, 'Antiguo Testamento', 'De la Creación al período intertestamentario: Ley, Historia, Sabiduría y Profetas.', 0)
  RETURNING id INTO v_subj_at;

  INSERT INTO public.lms_subjects (course_id, title, description, order_index)
  VALUES (v_curso_biblia, 'Nuevo Testamento', 'Evangelios, Hechos, Cartas Paulinas, Cartas Generales y Apocalipsis.', 1)
  RETURNING id INTO v_subj_nt;

  -- ============================================================
  -- 4b. MATERIAS - Curso: Doctrina Cristiana
  -- ============================================================
  INSERT INTO public.lms_subjects (course_id, title, description, order_index)
  VALUES (v_curso_doctrina, 'La Trinidad', 'El Padre, el Hijo y el Espíritu Santo: tres Personas, un solo Dios.', 0)
  RETURNING id INTO v_subj_trinitaria;

  INSERT INTO public.lms_subjects (course_id, title, description, order_index)
  VALUES (v_curso_doctrina, 'Salvación y Gracia', 'Pecado, redención, fe, justificación, santificación y glorificación.', 1)
  RETURNING id INTO v_subj_salvacion;

  -- ============================================================
  -- 4c. MATERIAS - Curso: Vida Cristiana
  -- ============================================================
  INSERT INTO public.lms_subjects (course_id, title, description, order_index)
  VALUES (v_curso_vida, 'La Oración', 'Principios, tipos y práctica de la oración en la vida del creyente.', 0)
  RETURNING id INTO v_subj_oracion;

  INSERT INTO public.lms_subjects (course_id, title, description, order_index)
  VALUES (v_curso_vida, 'Mayordomía Cristiana', 'El manejo fiel del tiempo, talento y tesoro que Dios nos ha confiado.', 1)
  RETURNING id INTO v_subj_mayordom;

  RAISE NOTICE 'Materias creadas exitosamente';

  -- ============================================================
  -- 5. MÓDULOS Y LECCIONES — Antiguo Testamento
  -- ============================================================

  -- Módulo 1: El Pentateuco
  INSERT INTO public.lms_modules (subject_id, title, description, order_index)
  VALUES (v_subj_at, 'El Pentateuco', 'Los cinco libros de Moisés: la base de toda la revelación bíblica.', 0)
  RETURNING id INTO v_mod_id;

  INSERT INTO public.lms_lessons (module_id, title, type, content, description, order_index)
  VALUES
    (v_mod_id, 'Génesis: El libro de los orígenes', 'document',
     '<h2>Génesis</h2><p>El libro de Génesis nos relata la creación del universo, la caída del hombre, el diluvio universal y el llamado de Abraham. Es el fundamento de toda la teología bíblica.</p><h3>Temas clave:</h3><ul><li>La Creación (cap. 1-2)</li><li>La Caída (cap. 3)</li><li>El Diluvio (cap. 6-9)</li><li>La Torre de Babel (cap. 11)</li><li>El llamado de Abraham (cap. 12)</li></ul>',
     'Primer libro de la Biblia y del Pentateuco.', 0),
    (v_mod_id, 'Éxodo: La liberación de Israel', 'document',
     '<h2>Éxodo</h2><p>El libro del Éxodo narra la liberación del pueblo de Israel de la esclavitud en Egipto bajo el liderazgo de Moisés. Es la historia tipo de la salvación.</p><h3>Temas clave:</h3><ul><li>El nacimiento y llamado de Moisés</li><li>Las 10 plagas</li><li>La Pascua</li><li>El cruce del Mar Rojo</li><li>Los 10 Mandamientos</li></ul>',
     'La salida de Egipto y la Ley entregada en el Sinaí.', 1),
    (v_mod_id, 'Quiz: El Pentateuco', 'quiz',
     NULL,
     'Evaluación sobre los cinco primeros libros de la Biblia.', 2);

  -- Módulo 2: Libros Históricos
  INSERT INTO public.lms_modules (subject_id, title, description, order_index)
  VALUES (v_subj_at, 'Libros Históricos', 'Josué, Jueces, Rut, Samuel, Reyes y Crónicas: la historia de Israel en la Tierra Prometida.', 1)
  RETURNING id INTO v_mod_id;

  INSERT INTO public.lms_lessons (module_id, title, type, content, description, order_index)
  VALUES
    (v_mod_id, 'Josué: La conquista de Canaán', 'document',
     '<h2>Josué</h2><p>El libro de Josué registra la conquista de la tierra de Canaán por parte del pueblo de Israel bajo el liderazgo de Josué, sucesor de Moisés.</p>',
     'La entrada y reparto de la Tierra Prometida.', 0),
    (v_mod_id, 'El ciclo de los Jueces', 'video',
     NULL,
     '¿Por qué Israel repetía siempre el mismo ciclo de pecado? Análisis del período de los jueces.', 1),
    (v_mod_id, 'Foro: ¿Qué aprendemos del liderazgo en los libros históricos?', 'forum',
     NULL,
     'Discusión y reflexión grupal sobre el liderazgo en el AT.', 2);

  -- Módulo 3: Libros Proféticos
  INSERT INTO public.lms_modules (subject_id, title, description, order_index)
  VALUES (v_subj_at, 'Libros Proféticos', 'Profetas mayores y menores: el corazón de Dios hacia su pueblo.', 2)
  RETURNING id INTO v_mod_id;

  INSERT INTO public.lms_lessons (module_id, title, type, content, description, order_index)
  VALUES
    (v_mod_id, 'Introducción a la profecía bíblica', 'document',
     '<h2>Profecía Bíblica</h2><p>La profecía no es solo predicción del futuro. Es principalmente el mensaje de Dios a su pueblo en su contexto histórico, llamándoles al arrepentimiento y a la fidelidad.</p>',
     'Qué es la profecía y cómo interpretarla.', 0),
    (v_mod_id, 'Isaías: El evangelio del AT', 'document',
     '<h2>Isaías</h2><p>Isaías es el profeta más citado en el Nuevo Testamento. Sus profecías sobre el Mesías son increíblemente detalladas (Isaías 53).</p>',
     'El gran profeta mesiánico del Antiguo Testamento.', 1),
    (v_mod_id, 'Tarea: Análisis de Miqueas 6:8', 'assignment',
     NULL,
     'Escribe un ensayo de 500 palabras analizando Miqueas 6:8 y su aplicación hoy.', 2);

  -- ============================================================
  -- 6. MÓDULOS Y LECCIONES — Nuevo Testamento
  -- ============================================================

  -- Módulo 4: Los Evangelios
  INSERT INTO public.lms_modules (subject_id, title, description, order_index)
  VALUES (v_subj_nt, 'Los Cuatro Evangelios', 'Mateo, Marcos, Lucas y Juan: cuatro perspectivas de un mismo Señor.', 0)
  RETURNING id INTO v_mod_id;

  INSERT INTO public.lms_lessons (module_id, title, type, content, description, order_index)
  VALUES
    (v_mod_id, 'Introducción a los Evangelios', 'document',
     '<h2>Los Evangelios</h2><p>Los cuatro evangelios presentan a Jesucristo desde cuatro perspectivas complementarias. Mateo: el Rey. Marcos: el Siervo. Lucas: el Hombre perfecto. Juan: el Hijo de Dios.</p>',
     'Una visión panorámica de los cuatro evangelios.', 0),
    (v_mod_id, 'El Sermón del Monte', 'document',
     '<h2>El Sermón del Monte (Mateo 5-7)</h2><p>El discurso más largo de Jesús en los evangelios sinópticos. Incluye las Bienaventuranzas, el Padre Nuestro y el llamado a ser sal y luz del mundo.</p>',
     'La enseñanza central de Jesús sobre el Reino de Dios.', 1),
    (v_mod_id, 'Foro: Las Bienaventuranzas en contexto moderno', 'forum',
     NULL,
     '¿Cómo aplican las Bienaventuranzas a nuestra vida hoy? Comparte tu perspectiva.', 2),
    (v_mod_id, 'Quiz: Los Evangelios', 'quiz', NULL, 'Evaluación sobre los cuatro evangelios.', 3);

  -- ============================================================
  -- 7. MÓDULOS — Doctrina Cristiana / La Trinidad
  -- ============================================================
  INSERT INTO public.lms_modules (subject_id, title, description, order_index)
  VALUES (v_subj_trinitaria, 'El Padre y su soberanía', 'Conociendo a Dios el Padre: sus atributos, sus nombres y su voluntad soberana.', 0)
  RETURNING id INTO v_mod_id;

  INSERT INTO public.lms_lessons (module_id, title, type, content, description, order_index)
  VALUES
    (v_mod_id, 'Los atributos de Dios', 'document',
     '<h2>Atributos de Dios</h2><p>Omnipotencia, Omnisciencia, Omnipresencia, Santidad, Amor, Justicia, Gracia, Fidelidad... Conocer a Dios transforma nuestra vida.</p>',
     'Las características esenciales del ser de Dios.', 0),
    (v_mod_id, 'Los nombres de Dios en el AT', 'document',
     '<h2>Los Nombres de Dios</h2><p>Elohim, YHWH, El Shaddai, Adonai, Yahweh Jireh, Yahweh Rapha... Cada nombre revela un aspecto del carácter de Dios.</p>',
     'Los nombres divinos y su significado teológico.', 1);

  INSERT INTO public.lms_modules (subject_id, title, description, order_index)
  VALUES (v_subj_trinitaria, 'Jesucristo: Señor y Salvador', 'La persona y obra de Jesucristo: su naturaleza divino-humana y sus tres oficios.', 1)
  RETURNING id INTO v_mod_id;

  INSERT INTO public.lms_lessons (module_id, title, type, content, description, order_index)
  VALUES
    (v_mod_id, 'La encarnación del Hijo de Dios', 'document',
     '<h2>La Encarnación</h2><p>"El Verbo se hizo carne y habitó entre nosotros" (Juan 1:14). La encarnación es el evento central de la historia humana: Dios se hace hombre sin dejar de ser Dios.</p>',
     '¿Por qué Jesús es 100% Dios y 100% hombre?', 0),
    (v_mod_id, 'La obra redentora de Cristo', 'document',
     '<h2>La Redención</h2><p>La muerte y resurrección de Jesucristo es el evento fundacional de la fe cristiana. Cristo murió por nuestros pecados, fue sepultado y resucitó al tercer día.</p>',
     'La cruz, la muerte y la resurrección.', 1),
    (v_mod_id, 'Tarea: Cristología personal', 'assignment', NULL, '¿Quién es Jesús para ti? Escribe una cristología personal de al menos 300 palabras.', 2);

  -- ============================================================
  -- 8. MÓDULOS — Vida Cristiana / La Oración
  -- ============================================================
  INSERT INTO public.lms_modules (subject_id, title, description, order_index)
  VALUES (v_subj_oracion, 'Fundamentos de la Oración', 'Qué es orar, por qué orar y cómo orar según la enseñanza bíblica.', 0)
  RETURNING id INTO v_mod_id;

  INSERT INTO public.lms_lessons (module_id, title, type, content, description, order_index)
  VALUES
    (v_mod_id, 'El Padre Nuestro como modelo de oración', 'document',
     '<h2>El Padre Nuestro (Mateo 6:9-13)</h2><p>Jesús no nos dio una oración para repetir mecánicamente, sino un modelo estructurado de cómo dirigirnos a Dios. Adoración → Intercesión → Petición → Confesión → Liberación → Alabanza.</p>',
     'El modelo de oración que Jesús nos enseñó.', 0),
    (v_mod_id, 'Tipos de oración bíblica', 'document',
     '<h2>Tipos de Oración</h2><ul><li>Adoración y alabanza</li><li>Gratitud</li><li>Confesión</li><li>Intercesión</li><li>Petición</li><li>Lamentación</li></ul>',
     'Las distintas formas de oración en la Escritura.', 1),
    (v_mod_id, 'Foro: Mi experiencia con la oración', 'forum',
     NULL,
     'Comparte cómo ha transformado la oración tu vida cotidiana.', 2),
    (v_mod_id, 'Reto: 7 días de oración matutina', 'assignment',
     NULL,
     'Compromiso de orar cada mañana por 7 días y llevar un diario de lo que Dios te habla.', 3);

  RAISE NOTICE '✅ ¡Escuela Dominical, cursos, materias, módulos y lecciones creados exitosamente!';
  RAISE NOTICE '📌 Escuela ID: %', v_school_id;
  RAISE NOTICE '📚 Cursos: % | % | %', v_curso_biblia, v_curso_doctrina, v_curso_vida;
  RAISE NOTICE '👨‍🏫 Docente (admin) asignado: %', v_admin_id;

END $$;
