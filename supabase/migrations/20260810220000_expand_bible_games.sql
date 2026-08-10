-- Expand the Bible games catalog and align the admin editors with the database.

ALTER TABLE public.game_hangman_words
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'easy';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'game_hangman_words_difficulty_check'
      AND conrelid = 'public.game_hangman_words'::regclass
  ) THEN
    ALTER TABLE public.game_hangman_words
      ADD CONSTRAINT game_hangman_words_difficulty_check
      CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;
END $$;

ALTER TABLE public.game_biblionario_questions
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS public.game_guess_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  clues jsonb NOT NULL,
  category text NOT NULL DEFAULT 'Personajes',
  difficulty text NOT NULL DEFAULT 'medium',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT game_guess_characters_clues_check
    CHECK (jsonb_typeof(clues) = 'array' AND jsonb_array_length(clues) >= 4),
  CONSTRAINT game_guess_characters_difficulty_check
    CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

CREATE INDEX IF NOT EXISTS idx_game_guess_characters_active_name
  ON public.game_guess_characters (is_active, name);

ALTER TABLE public.game_guess_characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active guess characters" ON public.game_guess_characters;
CREATE POLICY "Public can view active guess characters"
  ON public.game_guess_characters FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage guess characters" ON public.game_guess_characters;
CREATE POLICY "Admins can manage guess characters"
  ON public.game_guess_characters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'maestro')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'maestro')
    )
  );

-- PostgREST/Data API privileges are explicit for newly created tables.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.game_guess_characters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.game_guess_characters TO authenticated;
GRANT SELECT ON public.games, public.game_biblionario_questions,
  public.game_hangman_words, public.game_memory_cards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.games, public.game_biblionario_questions,
  public.game_hangman_words, public.game_memory_cards TO authenticated;

INSERT INTO public.games (title, description, image_url, slug, is_active) VALUES
  ('Descubre el Personaje', 'Descifra cuatro pistas progresivas y reconoce a los personajes que transformaron la historia bíblica.', 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=84&w=1400', 'descubre-el-personaje', true),
  ('Memorama Bíblico', 'Entrena la memoria relacionando símbolos, lugares y relatos esenciales de las Escrituras.', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=84&w=1400', 'memorama-biblico', true),
  ('Ahorcado Bíblico', 'Descubre palabras, personajes, lugares y libros con pistas que enseñan mientras juegas.', 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=84&w=1400', 'ahorcado-biblico', true),
  ('Quién quiere ser Biblionario', 'Supera quince niveles de dificultad con preguntas, referencias y explicaciones bíblicas.', 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=84&w=1400', 'quien-quiere-ser-biblionario', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.game_guess_characters
  (name, option_a, option_b, option_c, option_d, clues, category, difficulty)
VALUES
  ('Moisés', 'Moisés', 'Abraham', 'Noé', 'Josué', '["Fui rescatado de las aguas cuando era un bebé.","Me crié en el palacio del faraón.","Dios me habló desde una zarza ardiente.","Abrí el Mar Rojo con mi vara."]'::jsonb, 'Pentateuco', 'easy'),
  ('David', 'Salomón', 'David', 'Saúl', 'Samuel', '["Fui pastor de ovejas.","Toqué el arpa para un rey.","Derroté a un gigante con una honda.","Escribí muchos salmos."]'::jsonb, 'Reyes', 'easy'),
  ('Pedro', 'Juan', 'Pablo', 'Pedro', 'Andrés', '["Era pescador.","Caminé sobre el agua hacia Jesús.","Negué a Jesús tres veces.","Jesús me llamó roca."]'::jsonb, 'Nuevo Testamento', 'easy'),
  ('María (madre de Jesús)', 'María Magdalena', 'Marta', 'María (madre de Jesús)', 'Elisabet', '["Un ángel me anunció una noticia.","Visité a mi parienta Elisabet.","Di a luz en Belén.","Estuve al pie de la cruz."]'::jsonb, 'Nuevo Testamento', 'easy'),
  ('Pablo', 'Pedro', 'Lucas', 'Esteban', 'Pablo', '["Antes me llamaba Saulo.","Perseguí a los cristianos.","Quedé ciego camino a Damasco.","Escribí varias cartas del Nuevo Testamento."]'::jsonb, 'Nuevo Testamento', 'easy'),
  ('José (hijo de Jacob)', 'José (hijo de Jacob)', 'Judá', 'Benjamín', 'Moisés', '["Recibí una túnica especial de mi padre.","Mis hermanos me vendieron.","Interpreté sueños en Egipto.","Llegué a gobernar bajo el faraón."]'::jsonb, 'Patriarcas', 'medium'),
  ('Ester', 'Rut', 'Ester', 'Débora', 'Noemí', '["Mardoqueo me crió.","Fui reina en Persia.","Ayuné antes de presentarme ante el rey.","Intercedí para salvar a mi pueblo."]'::jsonb, 'Mujeres de la Biblia', 'medium'),
  ('Jonás', 'Daniel', 'Elías', 'Jeremías', 'Jonás', '["Intenté huir hacia Tarsis.","Una tormenta amenazó mi barco.","Un gran pez me tragó.","Prediqué en Nínive."]'::jsonb, 'Profetas', 'easy'),
  ('Noé', 'Adán', 'Noé', 'Abraham', 'Lot', '["Viví en una época de gran maldad.","Hallé gracia ante Dios.","Construí un arca.","Mi familia sobrevivió al diluvio."]'::jsonb, 'Pentateuco', 'easy'),
  ('Daniel', 'Ezequiel', 'Isaías', 'Daniel', 'José', '["Fui llevado a Babilonia.","Rechacé la comida del rey.","Interpreté sueños.","Sobreviví al foso de los leones."]'::jsonb, 'Profetas', 'easy'),
  ('Rut', 'Ana', 'Rut', 'Noemí', 'Raquel', '["Quedé viuda en Moab.","Acompañé a mi suegra a Belén.","Recogí espigas en un campo.","Me casé con Booz."]'::jsonb, 'Mujeres de la Biblia', 'medium'),
  ('Abraham', 'Isaac', 'Jacob', 'Abraham', 'Lot', '["Dios me llamó a dejar mi tierra.","Recibí una promesa de descendencia.","Mi esposa fue Sara.","Soy conocido como padre de la fe."]'::jsonb, 'Patriarcas', 'easy'),
  ('Josué', 'Caleb', 'Josué', 'Gedeón', 'Samuel', '["Fui ayudante de Moisés.","Exploré Canaán.","Guié a Israel después de Moisés.","Vi caer los muros de Jericó."]'::jsonb, 'Conquista', 'medium'),
  ('Débora', 'Jael', 'Ester', 'Débora', 'Miriam', '["Viví durante los jueces.","Era profetisa.","Juzgaba bajo una palmera.","Acompañé a Barac contra Sísara."]'::jsonb, 'Mujeres de la Biblia', 'hard'),
  ('Elías', 'Eliseo', 'Isaías', 'Elías', 'Jeremías', '["Los cuervos me llevaron alimento.","Desafié a los profetas de Baal.","Oré y cayó fuego del cielo.","Fui llevado en un torbellino."]'::jsonb, 'Profetas', 'medium'),
  ('Samuel', 'Natán', 'Samuel', 'Saúl', 'Elí', '["Mi madre Ana oró por mí.","Serví desde niño en el tabernáculo.","Dios me llamó de noche.","Ungí a Saúl y a David."]'::jsonb, 'Profetas', 'medium'),
  ('Juan el Bautista', 'Juan el Bautista', 'Juan el apóstol', 'Santiago', 'Andrés', '["Mi padre fue Zacarías.","Prediqué en el desierto.","Preparé el camino del Señor.","Bauticé a Jesús en el Jordán."]'::jsonb, 'Nuevo Testamento', 'medium'),
  ('Marta', 'María Magdalena', 'Marta', 'Lidia', 'Dorcas', '["Vivía en Betania.","Lázaro era mi hermano.","Recibí a Jesús en casa.","Confesé que Jesús es el Cristo."]'::jsonb, 'Nuevo Testamento', 'medium'),
  ('Zaqueo', 'Nicodemo', 'Mateo', 'Bartimeo', 'Zaqueo', '["Vivía en Jericó.","Era jefe de publicanos.","Era de baja estatura.","Subí a un sicómoro para ver a Jesús."]'::jsonb, 'Nuevo Testamento', 'easy'),
  ('Timoteo', 'Tito', 'Silas', 'Timoteo', 'Marcos', '["Mi madre fue Eunice.","Conocí las Escrituras desde niño.","Acompañé a Pablo.","Dos cartas pastorales llevan mi nombre."]'::jsonb, 'Nuevo Testamento', 'hard')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.game_hangman_words (word, hint, category, difficulty)
SELECT seed.word, seed.hint, seed.category, seed.difficulty
FROM (VALUES
  ('BETANIA', 'Aldea donde vivían Marta, María y Lázaro', 'Lugar', 'easy'),
  ('NAZARET', 'Ciudad donde creció Jesús', 'Lugar', 'easy'),
  ('CORINTO', 'Ciudad que recibió dos cartas de Pablo', 'Lugar', 'medium'),
  ('FILIPOS', 'Ciudad macedonia donde Pablo y Silas estuvieron presos', 'Lugar', 'hard'),
  ('ECLESIASTÉS', 'Libro que declara que todo tiene su tiempo', 'Libro', 'hard'),
  ('DEUTERONOMIO', 'Quinto libro de la Biblia', 'Libro', 'hard'),
  ('NEHEMÍAS', 'Libro sobre la reconstrucción de los muros de Jerusalén', 'Libro', 'medium'),
  ('HABACUC', 'Profeta que aprendió a vivir por fe', 'Libro', 'hard'),
  ('BARTIMEO', 'Ciego que clamó a Jesús cerca de Jericó', 'Personaje', 'medium'),
  ('MELQUISEDEC', 'Rey de Salem y sacerdote del Dios Altísimo', 'Personaje', 'hard'),
  ('DORCAS', 'Discípula conocida por sus buenas obras', 'Personaje', 'medium'),
  ('PRISCILA', 'Colaboradora de Pablo y esposa de Aquila', 'Personaje', 'hard'),
  ('GEDEÓN', 'Juez que venció con trescientos hombres', 'Personaje', 'medium'),
  ('PENTATEUCO', 'Nombre dado a los primeros cinco libros bíblicos', 'Concepto', 'medium'),
  ('REDENCIÓN', 'Liberación obtenida mediante un rescate', 'Concepto', 'medium'),
  ('RESURRECCIÓN', 'Victoria de Jesús sobre la muerte', 'Evento', 'medium'),
  ('TRANSFIGURACIÓN', 'Jesús mostró su gloria ante tres discípulos', 'Evento', 'hard'),
  ('BIENAVENTURANZAS', 'Enseñanzas con las que inicia el Sermón del Monte', 'Enseñanza', 'hard'),
  ('GETSEMANÍ', 'Huerto donde Jesús oró antes de ser arrestado', 'Lugar', 'medium'),
  ('EMANUEL', 'Nombre que significa Dios con nosotros', 'Título', 'easy')
) AS seed(word, hint, category, difficulty)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_hangman_words existing
  WHERE upper(existing.word) = upper(seed.word)
);

INSERT INTO public.game_memory_cards (pair_name)
SELECT seed.pair_name
FROM (VALUES
  ('Zarza ardiente'),
  ('Arpa de David'),
  ('Honda y piedra'),
  ('Pozo de Jacob'),
  ('Muro de Jericó'),
  ('Maná del desierto'),
  ('Lámpara encendida'),
  ('Aceite de la unción'),
  ('Pan y peces'),
  ('Tumba vacía'),
  ('Rollo de la Escritura'),
  ('Camino a Damasco')
) AS seed(pair_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_memory_cards existing
  WHERE lower(existing.pair_name) = lower(seed.pair_name)
);

INSERT INTO public.game_biblionario_questions
  (question, option_a, option_b, option_c, option_d, correct_option, difficulty_level, explanation)
SELECT seed.question, seed.option_a, seed.option_b, seed.option_c, seed.option_d,
  seed.correct_option, seed.difficulty_level, seed.explanation
FROM (VALUES
  ('¿Cuál fue la primera señal de Jesús según el Evangelio de Juan?', 'Sanar a un ciego', 'Calmar la tormenta', 'Convertir agua en vino', 'Multiplicar panes', 'c', 1, 'Jesús convirtió el agua en vino en Caná de Galilea (Juan 2:1-11).'),
  ('¿Cómo se llamaba la suegra de Rut?', 'Ana', 'Noemí', 'Débora', 'Miriam', 'b', 2, 'Rut decidió permanecer junto a Noemí (Rut 1:16-17).'),
  ('¿Con cuántos panes y peces alimentó Jesús a una multitud?', 'Cinco panes y dos peces', 'Siete panes y tres peces', 'Doce panes y un pez', 'Dos panes y cinco peces', 'a', 3, 'Un muchacho tenía cinco panes de cebada y dos peces (Juan 6:9).'),
  ('¿A qué árbol subió Zaqueo para ver a Jesús?', 'Olivo', 'Cedro', 'Sicómoro', 'Higuera', 'c', 4, 'Zaqueo subió a un sicómoro porque era pequeño de estatura (Lucas 19:4).'),
  ('¿Con cuántos hombres venció Gedeón a los madianitas?', '30', '300', '3.000', '12.000', 'b', 5, 'Dios redujo el ejército de Gedeón a trescientos hombres (Jueces 7:7).'),
  ('¿Qué ciudad conquistó Israel después de marchar alrededor de sus muros?', 'Hai', 'Hebrón', 'Jericó', 'Siquem', 'c', 6, 'Los muros de Jericó cayeron después del clamor del pueblo (Josué 6:20).'),
  ('¿Qué reina arriesgó su vida al presentarse sin invitación ante el rey?', 'Vasti', 'Ester', 'Jezabel', 'Atalía', 'b', 7, 'Ester entró ante el rey para interceder por su pueblo (Ester 5:1-2).'),
  ('¿A qué se dedicaba Lidia, la primera convertida de Filipos mencionada en Hechos?', 'Vendía púrpura', 'Fabricaba tiendas', 'Preparaba perfumes', 'Cuidaba ovejas', 'a', 8, 'Lidia era vendedora de púrpura de la ciudad de Tiatira (Hechos 16:14).'),
  ('¿Qué matrimonio explicó con mayor precisión el camino de Dios a Apolos?', 'Ananías y Safira', 'Zacarías y Elisabet', 'Aquila y Priscila', 'Félix y Drusila', 'c', 9, 'Priscila y Aquila tomaron aparte a Apolos y le explicaron el camino de Dios (Hechos 18:26).'),
  ('¿Cómo se llamaba el esclavo por quien Pablo intercedió ante Filemón?', 'Onésimo', 'Epafras', 'Aristarco', 'Tíquico', 'a', 10, 'Pablo pidió a Filemón recibir a Onésimo como hermano amado (Filemón 10-16).'),
  ('¿Qué juez de Israel era zurdo y derrotó al rey Eglón?', 'Otoniel', 'Aod', 'Jefté', 'Samgar', 'b', 11, 'Aod, hijo de Gera, era zurdo y liberó a Israel de Eglón (Jueces 3:15-21).'),
  ('¿Cuál es el capítulo más extenso de la Biblia?', 'Salmo 23', 'Salmo 91', 'Salmo 119', 'Isaías 53', 'c', 12, 'El Salmo 119 tiene 176 versículos organizados como acróstico hebreo.'),
  ('¿Quién fue lleno del Espíritu de Dios para diseñar el tabernáculo?', 'Bezaleel', 'Jetro', 'Eleazar', 'Hur', 'a', 13, 'Dios llenó a Bezaleel de sabiduría y capacidad artística (Éxodo 31:1-5).'),
  ('¿Quién cayó de una ventana mientras Pablo hablaba y luego volvió a vivir?', 'Trófimo', 'Eutico', 'Gayo', 'Sópater', 'b', 14, 'Eutico cayó desde el tercer piso; Pablo lo abrazó y fue hallado vivo (Hechos 20:9-12).'),
  ('¿Qué rey de Judá cortó y quemó el rollo escrito por Baruc al dictado de Jeremías?', 'Joacim', 'Sedequías', 'Josías', 'Manasés', 'a', 15, 'El rey Joacim cortó el rollo y lo arrojó al fuego (Jeremías 36:23).')
) AS seed(question, option_a, option_b, option_c, option_d, correct_option, difficulty_level, explanation)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_biblionario_questions existing
  WHERE existing.question = seed.question
);

NOTIFY pgrst, 'reload schema';
