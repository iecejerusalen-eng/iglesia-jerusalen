-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create biblionario questions table
CREATE TABLE IF NOT EXISTS public.game_biblionario_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) CHECK (correct_option IN ('a', 'b', 'c', 'd')) NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 15),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create game scores table for leaderboards
CREATE TABLE IF NOT EXISTS public.game_biblionario_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    level_reached INTEGER NOT NULL DEFAULT 1,
    mode TEXT NOT NULL CHECK (mode IN ('normal', 'infinite')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_biblionario_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_biblionario_scores ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Public can view active games" ON public.games
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage games" ON public.games
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'maestro')
        )
    );

-- Questions policies
CREATE POLICY "Public can view questions" ON public.game_biblionario_questions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage questions" ON public.game_biblionario_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'maestro')
        )
    );

-- Scores policies
CREATE POLICY "Public can view scores" ON public.game_biblionario_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" ON public.game_biblionario_scores
    FOR INSERT WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can update their own scores" ON public.game_biblionario_scores
    FOR UPDATE USING (profile_id = (select auth.uid()));

CREATE POLICY "Admins can manage scores" ON public.game_biblionario_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'maestro')
        )
    );

-- Insert initial game
INSERT INTO public.games (title, description, image_url, slug)
VALUES (
    'Quién quiere ser Biblionario',
    'Pon a prueba tus conocimientos bíblicos, supera los 15 niveles y conviértete en el mayor experto en las Escrituras.',
    'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=2574&auto=format&fit=crop',
    'quien-quiere-ser-biblionario'
) ON CONFLICT (slug) DO NOTHING;

-- Insert Questions for Biblionario
INSERT INTO public.game_biblionario_questions (question, option_a, option_b, option_c, option_d, correct_option, difficulty_level, explanation) VALUES
-- Level 1
('¿Quién fue el primer hombre creado según el Génesis?', 'Abraham', 'Moisés', 'Adán', 'Noé', 'c', 1, 'Dios formó a Adán del polvo de la tierra.'),
('¿En qué ciudad nació Jesús?', 'Jerusalén', 'Nazaret', 'Belén', 'Jericó', 'c', 1, 'Jesús nació en Belén de Judea (Mateo 2:1).'),
('¿Quién construyó un arca para salvar a su familia del diluvio?', 'Jonás', 'Noé', 'David', 'Lot', 'b', 1, 'Dios le ordenó a Noé construir un arca (Génesis 6).'),

-- Level 2
('¿Cuántos discípulos o apóstoles principales eligió Jesús?', '10', '12', '14', '7', 'b', 2, 'Jesús eligió a doce apóstoles (Lucas 6:13).'),
('¿Qué animal tentó a Eva en el huerto del Edén?', 'Un león', 'Una serpiente', 'Un lobo', 'Un cuervo', 'b', 2, 'La serpiente era astuta y engañó a Eva (Génesis 3:1).'),
('¿Quién derrotó al gigante Goliat con una honda y una piedra?', 'Sansón', 'Saúl', 'David', 'Salomón', 'c', 2, 'David venció a Goliat confiando en el nombre de Jehová (1 Samuel 17).'),

-- Level 3
('¿De qué material estaba hecha la corona que le pusieron a Jesús?', 'Oro', 'Plata', 'Espinas', 'Olivo', 'c', 3, 'Los soldados tejieron una corona de espinas (Juan 19:2).'),
('¿Cuántos días estuvo Jonás en el vientre del gran pez?', '3 días y 3 noches', '7 días', '40 días', '1 día', 'a', 3, 'Jonás estuvo en el pez tres días y tres noches (Jonás 1:17).'),
('¿Qué apóstol negó a Jesús tres veces antes de que cantara el gallo?', 'Juan', 'Judas', 'Pedro', 'Tomás', 'c', 3, 'Pedro negó a Jesús tres veces, tal como Jesús profetizó (Mateo 26:75).'),

-- Level 4
('¿Qué instrumento tocaba David para calmar al rey Saúl?', 'Trompeta', 'Arpa', 'Flauta', 'Tambor', 'b', 4, 'David tomaba el arpa (o lira) y tocaba (1 Samuel 16:23).'),
('¿Qué mar abrió Dios para que los israelitas escaparan de Egipto?', 'Mar Mediterráneo', 'Mar Muerto', 'Mar de Galilea', 'Mar Rojo', 'd', 4, 'Las aguas del Mar Rojo se dividieron (Éxodo 14:21).'),
('¿Qué recibió Moisés en el Monte Sinaí?', 'La vara', 'Los Diez Mandamientos', 'El arca', 'El maná', 'b', 4, 'Moisés recibió las tablas del testimonio (Éxodo 31:18).'),

-- Level 5
('¿Quién fue tragado por la tierra junto a su familia por rebelarse contra Moisés?', 'Datán, Abiram y Coré', 'Aarón y Miriam', 'Nadab y Abiú', 'Josué y Caleb', 'a', 5, 'La tierra se abrió y tragó a Coré y sus seguidores (Números 16:32).'),
('¿Qué profeta fue llevado al cielo en un carro de fuego?', 'Isaías', 'Eliseo', 'Elías', 'Ezequiel', 'c', 5, 'Elías subió al cielo en un torbellino (2 Reyes 2:11).'),
('¿Cómo se llamaba el hombre fuerte que perdió su fuerza cuando le cortaron el cabello?', 'Gedeón', 'Sansón', 'Saúl', 'Boaz', 'b', 5, 'La fuerza de Sansón residía en su voto nazareo (Jueces 16:17).'),

-- Level 6
('¿Qué nombre le puso Dios a Jacob después de luchar con el ángel?', 'Abraham', 'Esaú', 'Israel', 'Judá', 'c', 6, 'Tu nombre ya no será Jacob, sino Israel (Génesis 32:28).'),
('¿Cuál fue la primera plaga de Egipto?', 'Ranas', 'Moscas', 'Agua convertida en sangre', 'Langostas', 'c', 6, 'Moisés y Aarón convirtieron el agua del Nilo en sangre (Éxodo 7:20).'),
('¿En qué monte fue crucificado Jesús?', 'Sinaí', 'Carmelo', 'Gólgota', 'Horeb', 'c', 6, 'Gólgota significa Lugar de la Calavera (Mateo 27:33).'),

-- Level 7
('¿Cuántos años vagó el pueblo de Israel por el desierto?', '10', '20', '40', '70', 'c', 7, 'Israel vagó 40 años hasta que pereció la generación rebelde (Josué 5:6).'),
('¿A quién vendieron como esclavo sus propios hermanos?', 'Benjamín', 'José', 'Rubén', 'Leví', 'b', 7, 'José fue vendido a los ismaelitas por 20 piezas de plata (Génesis 37:28).'),
('¿Qué alimento cayó del cielo para alimentar a los israelitas en el desierto?', 'Miel', 'Codornices', 'Maná', 'Olivas', 'c', 7, 'El Señor hizo llover pan del cielo, llamado maná (Éxodo 16).'),

-- Level 8
('¿Quién fue el padre de Juan el Bautista?', 'Zacarías', 'Simón', 'José', 'Nicodemo', 'a', 8, 'Zacarías, el sacerdote, fue el padre de Juan (Lucas 1).'),
('¿De qué madera estaba construida el Arca de Noé?', 'Cedro', 'Acacia', 'Gófer', 'Pino', 'c', 8, 'Hazte un arca de madera de gófer (Génesis 6:14).'),
('¿Cuántos libros tiene la Biblia Protestante?', '73', '66', '70', '60', 'b', 8, 'Contiene 39 libros en el AT y 27 en el NT.'),

-- Level 9
('¿A qué tribu pertenecía el apóstol Pablo?', 'Judá', 'Leví', 'Benjamín', 'Simeón', 'c', 9, 'De la tribu de Benjamín, hebreo de hebreos (Filipenses 3:5).'),
('¿Quién fue el primer mártir cristiano apedreado por su fe?', 'Esteban', 'Jacobo', 'Pedro', 'Felipe', 'a', 9, 'Esteban fue apedreado mientras oraba por sus verdugos (Hechos 7).'),
('¿Dónde entregó Pablo su famoso discurso a los atenienses?', 'En el Partenón', 'En el Areópago', 'En el Coliseo', 'En la Sinagoga', 'b', 9, 'Pablo estuvo en medio del Areópago y predicó al Dios no conocido (Hechos 17:22).'),

-- Level 10
('¿A quién se le añadieron 15 años más de vida tras llorar ante Dios?', 'Rey David', 'Rey Ezequías', 'Rey Josías', 'Rey Salomón', 'b', 10, 'Dios sanó a Ezequías y añadió 15 años a su vida (Isaías 38:5).'),
('¿Qué profeta vio un valle de huesos secos que cobraban vida?', 'Daniel', 'Jeremías', 'Ezequiel', 'Oseas', 'c', 10, 'El Señor le mostró a Ezequiel el valle de los huesos secos (Ezequiel 37).'),
('¿Quién reemplazó a Judas Iscariote como apóstol?', 'Matías', 'Barsabás', 'Bernabé', 'Silas', 'a', 10, 'La suerte cayó sobre Matías (Hechos 1:26).'),

-- Level 11
('¿Cómo se llamaba la madre del rey Salomón?', 'Mical', 'Abigail', 'Betsabé', 'Ana', 'c', 11, 'Betsabé, que fue esposa de Urías, dio a luz a Salomón (2 Samuel 12:24).'),
('¿Qué rey babilonio se volvió loco y comió hierba como los bueyes?', 'Belsasar', 'Nabucodonosor', 'Ciro', 'Darío', 'b', 11, 'Nabucodonosor fue echado de entre los hombres (Daniel 4:33).'),
('¿Quién es el autor del libro de Apocalipsis?', 'Pedro', 'Pablo', 'Mateo', 'Juan', 'd', 11, 'Yo Juan, vuestro hermano... estaba en la isla llamada Patmos (Apocalipsis 1:9).'),

-- Level 12
('¿Qué edad tenía Matusalén cuando murió?', '969 años', '930 años', '999 años', '900 años', 'a', 12, 'Fueron todos los días de Matusalén 969 años (Génesis 5:27).'),
('¿Cuál era el nombre babilónico de Daniel?', 'Sadrac', 'Mesac', 'Abed-nego', 'Beltsasar', 'd', 12, 'A Daniel se le llamó Beltsasar (Daniel 1:7).'),
('¿Qué sacerdote ayudó a esconder al joven rey Joás de Atalía?', 'Elí', 'Zadok', 'Joiada', 'Esdras', 'c', 12, 'El sumo sacerdote Joiada protegió y coronó a Joás (2 Crónicas 23).'),

-- Level 13
('¿Qué mujer fue jueza de Israel y se sentaba bajo una palmera?', 'Débora', 'Jael', 'Rut', 'Ester', 'a', 13, 'Débora, profetisa, juzgaba a Israel en aquel tiempo (Jueces 4:4).'),
('¿Quién era el padre de Moisés?', 'Amram', 'Izhar', 'Hebrón', 'Uziel', 'a', 13, 'Amram tomó por mujer a Jocabed, y de ella nació Moisés (Éxodo 6:20).'),
('¿En qué valle venció Dios a los madianitas usando a Gedeón y 300 hombres?', 'Valle de Jezreel', 'Valle de Ajalón', 'Valle de Elah', 'Valle de Meguido', 'a', 13, 'Acamparon junto a la fuente de Harod... en el valle (Jueces 7).'),

-- Level 14
('¿Cuál fue el nombre original del padre de Abraham, Taré, según la ciudad de donde salieron?', 'Salió de Ur de los caldeos', 'Salió de Harán', 'Salió de Sinar', 'Salió de Babilonia', 'a', 14, 'Taré tomó a Abram... y salieron de Ur de los caldeos (Génesis 11:31).'),
('¿Qué isla habitó Pablo tras naufragar rumbo a Roma?', 'Chipre', 'Patmos', 'Malta', 'Creta', 'c', 14, 'Habiendo escapado, supimos que la isla se llamaba Malta (Hechos 28:1).'),
('¿Quién era el gobernador romano de Judea cuando crucificaron a Jesús?', 'Herodes', 'Poncio Pilato', 'Félix', 'Festo', 'b', 14, 'Poncio Pilato era el gobernador de Judea (Lucas 3:1).'),

-- Level 15
('¿Quién fue el único sobreviviente del linaje real de Judá cuando Atalía mató a los herederos?', 'Acaz', 'Ezequías', 'Joás', 'Amón', 'c', 15, 'Josaba robó a Joás de entre los hijos del rey, salvándolo de Atalía (2 Reyes 11:2).'),
('¿Qué profeta menor se casó con Gomer, una mujer ramera, por mandato divino?', 'Amós', 'Oseas', 'Miqueas', 'Sofonías', 'b', 15, 'Ve, tómate una mujer fornicaria, le dijo Jehová a Oseas (Oseas 1:2).'),
('¿De qué lugar era originario el sacerdote Melquisedec?', 'Jerusalén', 'Salem', 'Sodoma', 'Hebrón', 'b', 15, 'Melquisedec, rey de Salem y sacerdote del Dios Altísimo (Génesis 14:18).');
