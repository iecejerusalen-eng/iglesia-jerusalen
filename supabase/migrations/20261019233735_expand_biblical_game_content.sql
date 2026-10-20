-- Enriches the games with illustrated, self-contained Bible learning content.
-- Every insert is idempotent by its human-readable key; existing rows are kept.

ALTER TABLE public.game_memory_cards
  ADD COLUMN IF NOT EXISTS match_image_url text,
  ADD COLUMN IF NOT EXISTS card_label text NOT NULL DEFAULT 'Símbolo',
  ADD COLUMN IF NOT EXISTS match_label text NOT NULL DEFAULT 'Relato',
  ADD COLUMN IF NOT EXISTS learning_question text,
  ADD COLUMN IF NOT EXISTS learning_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_answer text;

ALTER TABLE public.game_guess_characters
  ADD COLUMN IF NOT EXISTS bible_reference text;

UPDATE public.game_memory_cards AS card
SET image_url = seed.image_url,
    match_image_url = seed.match_image_url,
    card_label = seed.card_label,
    match_label = seed.match_label,
    learning_question = seed.learning_question,
    learning_options = jsonb_build_array(seed.option_a, seed.option_b, seed.option_c),
    learning_answer = seed.answer,
    is_active = true
FROM (VALUES
  ('Arca de Noé','/images/games/memory/arca.jpg','/images/games/memory/noe.jpg','Símbolo','Personajes','¿A quién pidió Dios construir el arca?','Noé','Noé','Moisés','Abraham'),
  ('Tablas de la Ley','/images/games/memory/tablas.jpg','/images/games/memory/moises.jpg','Objeto','Personaje','¿Quién recibió las tablas de piedra?','Moisés','Moisés','Josué','David'),
  ('Paloma (Espíritu Santo)','/images/games/memory/paloma.jpg','/images/games/memory/bautismo.jpg','Símbolo','Acontecimiento','¿En qué momento descendió el Espíritu como paloma?','En el bautismo de Jesús','En el bautismo de Jesús','En la entrada a Jerusalén','En la pesca milagrosa'),
  ('Estrella de Belén','/images/games/memory/estrella.jpg','/images/games/memory/sabios.jpg','Símbolo','Personajes','¿Quiénes siguieron la estrella para buscar a Jesús?','Los sabios de Oriente','Los sabios de Oriente','Los pastores de Belén','Los discípulos de Emaús'),
  ('Cruz de Jesús','/images/games/memory/cruz.jpg','/images/games/memory/tumba.jpg','Símbolo','Acontecimiento','¿Qué anunciaron los mensajeros junto a la tumba?','Que Jesús había resucitado','Que Jesús había resucitado','Que los discípulos debían volver a Galilea','Que Lázaro había salido de Betania'),
  ('Corona de Espinas','/images/games/memory/corona.jpg','/images/games/memory/soldados.jpg','Objeto','Acontecimiento','¿Quiénes pusieron una corona de espinas a Jesús?','Los soldados','Los soldados','Los sabios de Oriente','Los pescadores de Galilea'),
  ('León de Judá','/images/games/memory/leon.jpg','/images/games/memory/sello-leon.jpg','Símbolo','Referencia','¿A quién llama Apocalipsis el León de la tribu de Judá?','A Jesús','A Jesús','A David','A Juan el Bautista'),
  ('Pez (Ichthys)','/images/games/memory/panes-peces.jpg','/images/games/memory/multiplicacion.jpg','Alimento','Acontecimiento','¿Qué llevó el muchacho a la multitud?','Cinco panes y dos peces','Cinco panes y dos peces','Siete panes y una red','Un cántaro y dos monedas')
) AS seed(pair_name,image_url,match_image_url,card_label,match_label,learning_question,answer,option_a,option_b,option_c)
WHERE lower(card.pair_name) = lower(seed.pair_name);

WITH seed(pair_name,match_text,explanation,bible_reference,difficulty,image_url,match_image_url,card_label,match_label,learning_question,option_a,option_b,option_c,answer) AS (VALUES
  ('Arco de Jonatán','Jonatán entregó su arco a David','Jonatán hizo un pacto de amistad con David y le entregó, entre otras prendas, su arco.','1 Samuel 18:1-4','easy','/images/games/memory/objects/arco-jonatan-objeto.png','/images/games/memory/objects/arco-jonatan-relato.webp','Objeto','Amistad','¿Qué entregó Jonatán a David como parte de su pacto?','Su arco y otras prendas','Su corona y su cetro','Una vasija de aceite','Su arco y otras prendas'),
  ('Espada de Goliat','David tomó la espada del gigante','Después de vencer a Goliat, David tomó su espada. El relato destaca la victoria y no requiere representar una escena gráfica.','1 Samuel 17:50-51','easy','/images/games/memory/objects/espada-david-objeto.png','/images/games/memory/objects/espada-david-relato.webp','Objeto','Acontecimiento','¿De quién tomó David la espada después de la victoria?','De Goliat','De Saúl','De Jonatán','De Goliat'),
  ('Pez con moneda','Pedro encontró una moneda en el pez','Jesús indicó a Pedro que pescara; en el primer pez encontraría una moneda para pagar el impuesto del templo.','Mateo 17:24-27','easy','/images/games/memory/objects/pez-moneda-objeto.png','/images/games/memory/objects/pez-moneda-relato.webp','Objeto','Milagro','¿Para qué debía usar Pedro la moneda encontrada?','Para pagar el impuesto del templo','Para comprar una barca','Para alimentar a cinco mil personas','Para pagar el impuesto del templo'),
  ('Vara de Moisés','Moisés extendió su vara sobre el mar','Dios mandó a Moisés extender su vara; el mar se abrió y el pueblo cruzó por terreno seco.','Éxodo 14:16,21-22','medium','/images/games/memory/objects/vara-moises-objeto.png','/images/games/memory/objects/vara-moises-relato.webp','Objeto','Acontecimiento','¿Qué ocurrió cuando Moisés extendió su vara sobre el mar?','El mar se abrió para que el pueblo cruzara','Cayó maná en el desierto','El Jordán se convirtió en vino','El mar se abrió para que el pueblo cruzara'),
  ('Tinajas de Caná','Jesús convirtió agua en vino','En una boda en Caná, Jesús pidió llenar tinajas de agua; el agua se convirtió en vino.','Juan 2:1-11','easy','/images/games/memory/objects/tinajas-cana-objeto.png','/images/games/memory/objects/tinajas-cana-relato.webp','Objeto','Milagro','¿Qué contenían las tinajas antes del milagro?','Agua','Aceite','Leche','Agua'),
  ('Trompetas de Jericó','El pueblo rodeó Jericó y sus muros cayeron','Tras rodear la ciudad como se indicó, el pueblo gritó y los muros de Jericó cayeron.','Josué 6:4-5,20','medium','/images/games/memory/objects/trompetas-jerico-objeto.png','/images/games/memory/objects/trompetas-jerico-relato.webp','Objeto','Acontecimiento','¿Qué ocurrió después del grito del pueblo en Jericó?','Cayeron los muros de la ciudad','Se abrió el Mar Rojo','El Jordán se volvió en dirección contraria','Cayeron los muros de la ciudad'),
  ('Manto de Elías','Eliseo recogió el manto de Elías','Después de que Elías fue llevado, Eliseo recogió su manto y volvió al Jordán.','2 Reyes 2:11-14','medium','/images/games/memory/objects/manto-elias-objeto.png','/images/games/memory/objects/manto-elias-relato.webp','Objeto','Personaje','¿Quién recogió el manto de Elías?','Eliseo','Elías','Isaías','Eliseo'),
  ('Cadenas de Pablo y Silas','Pablo y Silas oraron y cantaron en prisión','En la cárcel de Filipos, Pablo y Silas oraban y cantaban himnos; los demás presos los escuchaban.','Hechos 16:23-26','hard','/images/games/memory/objects/cadenas-pablo-objeto.png','/images/games/memory/objects/cadenas-pablo-relato.webp','Objeto','Relato','¿Qué hacían Pablo y Silas en la cárcel?','Oraban y cantaban himnos','Discutían sobre quién sería rey','Escribían a la iglesia de Roma','Oraban y cantaban himnos')
)
INSERT INTO public.game_memory_cards
  (pair_name,match_text,explanation,bible_reference,difficulty,image_url,match_image_url,card_label,match_label,learning_question,learning_options,learning_answer,is_active)
SELECT seed.pair_name,seed.match_text,seed.explanation,seed.bible_reference,seed.difficulty,seed.image_url,seed.match_image_url,seed.card_label,seed.match_label,seed.learning_question,
       jsonb_build_array(seed.option_a,seed.option_b,seed.option_c),seed.answer,true
FROM seed
WHERE NOT EXISTS (SELECT 1 FROM public.game_memory_cards old WHERE lower(old.pair_name)=lower(seed.pair_name));

WITH seed(question,difficulty_level,option_a,option_b,option_c,option_d,correct_option,explanation) AS (VALUES
  ('¿Qué señal puso Dios en el cielo después del diluvio?',1,'El arcoíris','Una estrella nueva','Una nube de fuego','Una paloma','a','El arcoíris fue la señal del pacto de Dios con Noé.'),
  ('¿En qué ciudad nació Jesús?',1,'Nazaret','Belén','Jericó','Betania','b','Los Evangelios sitúan el nacimiento de Jesús en Belén.'),
  ('¿Quién recibió los Diez Mandamientos en el Sinaí?',2,'Josué','Aarón','Moisés','Samuel','c','Moisés recibió las tablas del testimonio en el monte Sinaí.'),
  ('¿Qué joven venció a Goliat?',2,'David','Jonatán','Salomón','Gedeón','a','David enfrentó a Goliat confiando en Dios y usando una honda.'),
  ('¿Qué alimento cayó del cielo para Israel en el desierto?',3,'Uvas','Maná','Pescado','Aceitunas','b','Éxodo relata que el pueblo recogía maná cada mañana.'),
  ('¿Quién interpretó los sueños del faraón?',3,'Daniel','Aarón','José','Nehemías','c','José explicó los sueños del faraón sobre años de abundancia y hambre.'),
  ('¿Qué juez de Israel fue conocida como profetisa?',4,'Débora','Rut','Ester','Abigail','a','Débora juzgaba a Israel y acompañó a Barac.'),
  ('¿Qué reina visitó a Salomón para probar su sabiduría?',4,'La reina de Egipto','La reina de Sabá','La reina Ester','La reina Atalía','b','La reina de Sabá viajó para escuchar la sabiduría de Salomón.'),
  ('¿Qué profeta fue enviado a Nínive?',5,'Amós','Jonás','Oseas','Miqueas','b','Dios envió a Jonás a anunciar su mensaje a Nínive.'),
  ('¿Quién fue la suegra de Rut?',5,'Raquel','Marta','Noemí','Elisabet','c','Rut permaneció junto a Noemí y la acompañó a Belén.'),
  ('¿Qué discípulo caminó sobre el agua hacia Jesús?',6,'Pedro','Tomás','Felipe','Mateo','a','Mateo 14 narra que Pedro salió de la barca y caminó hacia Jesús.'),
  ('¿Cuántos panes tenía el muchacho en la alimentación de los cinco mil?',6,'Dos','Cinco','Siete','Doce','b','El relato de Juan menciona cinco panes de cebada y dos peces.'),
  ('¿Qué hizo Zaqueo para poder ver a Jesús?',7,'Subió a un sicómoro','Entró al templo','Se escondió en una barca','Pidió una escalera a Pedro','a','Zaqueo subió a un sicómoro porque era de baja estatura.'),
  ('¿En qué camino tuvo Saulo un encuentro que cambió su vida?',7,'A Jericó','A Damasco','A Emaús','A Samaria','b','Hechos describe el encuentro de Saulo con Jesús camino a Damasco.'),
  ('¿Quién pidió sabiduría a Dios para gobernar?',8,'Saúl','Ezequías','Salomón','Ciro','c','Salomón pidió sabiduría para gobernar al pueblo.'),
  ('¿Quién explicó al eunuco el pasaje de Isaías?',8,'Felipe','Esteban','Bernabé','Andrés','a','Felipe explicó las Escrituras al funcionario etíope.'),
  ('¿Qué profeta desafió a los profetas de Baal en el Carmelo?',9,'Eliseo','Elías','Jeremías','Ezequiel','b','Elías reunió al pueblo y a los profetas en el monte Carmelo.'),
  ('¿Quién reconstruyó los muros de Jerusalén tras el exilio?',9,'Nehemías','Esdras','Zorobabel','Hageo','a','Nehemías organizó la reconstrucción de los muros de Jerusalén.'),
  ('¿Qué iglesia recibió la carta que trata sobre la armadura de Dios?',10,'Corinto','Éfeso','Filipos','Colosas','b','La imagen de la armadura de Dios aparece en Efesios 6.'),
  ('¿Quién acompañó a Pablo en la cárcel de Filipos?',10,'Bernabé','Silas','Tito','Apolos','b','Pablo y Silas oraban y cantaban en la cárcel de Filipos.'),
  ('¿Qué ciudad tenía una iglesia a la que se escribió sobre el amor como vínculo perfecto?',11,'Colosas','Roma','Tesalónica','Galacia','a','Colosenses 3 habla del amor como vínculo perfecto.'),
  ('¿Quién fue escogido para ocupar el lugar de Judas entre los apóstoles?',11,'José Barsabás','Matías','Esteban','Timoteo','b','Hechos 1 cuenta la elección de Matías para completar el grupo.'),
  ('¿Qué profeta vio un valle de huesos secos?',12,'Daniel','Ezequiel','Isaías','Joel','b','La visión del valle de huesos secos está en Ezequiel 37.'),
  ('¿Qué mujer fue jueza y profetisa en Israel?',12,'Abigail','Débora','Lidia','Priscila','b','Débora aparece como jueza y profetisa en Jueces 4.'),
  ('¿Qué nombre recibió Jacob después de luchar en Peniel?',13,'Judá','Israel','Edom','Betel','b','En Génesis 32 Jacob recibe el nombre Israel.'),
  ('¿Qué comunidad examinaba cada día las Escrituras después de escuchar a Pablo?',13,'La de Berea','La de Corinto','La de Éfeso','La de Listra','a','Hechos 17 describe a los bereanos examinando las Escrituras.'),
  ('¿Qué rey encontró el libro de la Ley durante una reparación del templo?',14,'Josías','Acab','Ezequías','Uzías','a','Durante el reinado de Josías se encontró el libro de la Ley.'),
  ('¿En qué isla recibió Juan la visión del Apocalipsis?',14,'Creta','Patmos','Chipre','Malta','b','Juan dice que estaba en la isla llamada Patmos.'),
  ('¿Qué evangelio empieza con la frase sobre el Verbo?',15,'Mateo','Marcos','Lucas','Juan','d','El prólogo del Evangelio de Juan comienza hablando del Verbo.'),
  ('¿Qué iglesia compartió con Pablo en sus dificultades y necesidades?',15,'La iglesia de Filipos','La iglesia de Laodicea','La iglesia de Sardis','La iglesia de Atenas','a','Pablo agradece a los filipenses por su colaboración y apoyo.')
)
INSERT INTO public.game_biblionario_questions
  (question,difficulty_level,option_a,option_b,option_c,option_d,correct_option,explanation)
SELECT seed.question,seed.difficulty_level,seed.option_a,seed.option_b,seed.option_c,seed.option_d,seed.correct_option,seed.explanation
FROM seed
WHERE NOT EXISTS (SELECT 1 FROM public.game_biblionario_questions old WHERE lower(old.question)=lower(seed.question));

WITH seed(word,hint,category,difficulty,bible_reference) AS (VALUES
  ('AARON','Hermano de Moisés y primer sumo sacerdote','Personaje','easy','Éxodo 4:14-16; 28:1'),
  ('ABIGAIL','Mujer sabia que luego fue esposa de David','Personaje','medium','1 Samuel 25:32-42'),
  ('ANDRES','Hermano de Simón Pedro y discípulo de Jesús','Personaje','easy','Juan 1:40-42'),
  ('APOLOS','Predicador judío de Alejandría instruido por Priscila y Aquila','Personaje','hard','Hechos 18:24-28'),
  ('AQUILA','Esposo de Priscila y colaborador de Pablo','Personaje','medium','Hechos 18:1-3'),
  ('BARTIMEO','Ciego que pidió misericordia a Jesús cerca de Jericó','Personaje','medium','Marcos 10:46-52'),
  ('BERENICE','Mujer presente cuando Pablo habló ante Agripa','Personaje','hard','Hechos 25:13; 26:30'),
  ('CORNELIO','Centurión cuya casa recibió a Pedro','Personaje','hard','Hechos 10:1-8,44-48'),
  ('EFESO','Ciudad donde Pablo enseñó por un tiempo prolongado','Lugar','medium','Hechos 19:1-10'),
  ('ENOC','Caminó con Dios y fue tomado por Dios','Personaje','medium','Génesis 5:21-24'),
  ('ESDRAS','Escriba que enseñó la Ley al pueblo','Personaje','medium','Esdras 7:6,10; Nehemías 8:1-8'),
  ('FELIPE','Evangelista que anunció a Jesús al viajero etíope','Personaje','medium','Hechos 8:26-39'),
  ('GABRIEL','Ángel que anunció nacimientos a Zacarías y María','Personaje','easy','Lucas 1:11-20,26-38'),
  ('GOMER','Esposa mencionada en el libro de Oseas','Personaje','hard','Oseas 1:2-3'),
  ('HABACUC','Profeta que dialogó con Dios sobre la justicia','Personaje','hard','Habacuc 1:1-4; 2:1-4'),
  ('ISAAC','Hijo de Abraham y Sara, padre de Jacob y Esaú','Personaje','easy','Génesis 21:1-3; 25:19-26'),
  ('JACOB','Hijo de Isaac que recibió el nombre Israel','Personaje','easy','Génesis 32:27-28'),
  ('JAFET','Hijo de Noé mencionado en el relato del arca','Personaje','hard','Génesis 6:10; 9:18-19'),
  ('JAIRO','Principal de la sinagoga que pidió ayuda para su hija','Personaje','medium','Marcos 5:22-24,35-43'),
  ('JONATAN','Hijo de Saúl que hizo pacto de amistad con David','Personaje','medium','1 Samuel 18:1-4'),
  ('LIDIA','Vendedora de púrpura que creyó en Filipos','Personaje','medium','Hechos 16:14-15'),
  ('LOIDA','Abuela de Timoteo, reconocida por su fe','Personaje','medium','2 Timoteo 1:5'),
  ('MARCOS','Evangelista que acompañó a Bernabé y luego a Pablo','Personaje','medium','Hechos 12:25; 15:37-39'),
  ('MARTA','Hermana de María y Lázaro, amiga de Jesús','Personaje','easy','Juan 11:1-5,20-27'),
  ('MATIAS','Discípulo escogido para ocupar el lugar de Judas','Personaje','medium','Hechos 1:21-26'),
  ('MICAH','Profeta que anunció esperanza para Belén','Personaje','hard','Miqueas 5:2'),
  ('NAAMAN','Comandante sirio sanado al lavarse en el Jordán','Personaje','medium','2 Reyes 5:1-14'),
  ('NICODEMO','Maestro de Israel que visitó a Jesús de noche','Personaje','easy','Juan 3:1-10'),
  ('ONÉSIMO','Esclavo fugitivo a quien Pablo llamó hermano amado','Personaje','hard','Filemón 10-16'),
  ('PRISCILA','Maestra cristiana que junto a Aquila instruyó a Apolos','Personaje','medium','Hechos 18:24-26'),
  ('SIMEON','Anciano que reconoció al niño Jesús en el templo','Personaje','medium','Lucas 2:25-32'),
  ('TITO','Colaborador de Pablo destinatario de una carta pastoral','Personaje','medium','Tito 1:4-5'),
  ('URIA','Esposo de Betsabé y soldado del ejército de David','Personaje','hard','2 Samuel 11:3-17'),
  ('ZAQUEO','Jefe de recaudadores que subió a un árbol en Jericó','Personaje','easy','Lucas 19:1-10'),
  ('BEREA','Ciudad donde se examinaban las Escrituras cada día','Lugar','medium','Hechos 17:10-12'),
  ('PENIEL','Lugar donde Jacob dijo haber visto a Dios cara a cara','Lugar','hard','Génesis 32:30')
)
INSERT INTO public.game_hangman_words(word,hint,category,difficulty,bible_reference)
SELECT seed.word,seed.hint,seed.category,seed.difficulty,seed.bible_reference
FROM seed
WHERE NOT EXISTS (SELECT 1 FROM public.game_hangman_words old WHERE upper(old.word)=upper(seed.word));

WITH seed(name,option_a,option_b,option_c,option_d,clues,category,difficulty) AS (VALUES
  ('Agar','Agar','Sara','Rebeca','Raquel',jsonb_build_array('Fui sierva de Sara.','Tuve un hijo con Abraham.','Mi hijo se llamó Ismael.','Dios me encontró en el desierto.'),'Personajes del Antiguo Testamento','medium'),
  ('Aarón','Aarón','Moisés','Josué','Caleb',jsonb_build_array('Soy hermano mayor de Moisés.','Hablé ante el faraón junto a mi hermano.','Fui escogido para servir como sacerdote.','Mi vara floreció como señal.'),'Personajes del Antiguo Testamento','medium'),
  ('Abigail','Abigail','Ester','Rut','Débora',jsonb_build_array('Fui esposa de Nabal.','Preparé alimentos para David y sus hombres.','David elogió mi prudencia.','Después llegué a ser esposa de David.'),'Personajes del Antiguo Testamento','medium'),
  ('Andrés','Andrés','Felipe','Pedro','Tomás',jsonb_build_array('Fui discípulo de Juan el Bautista.','Seguí a Jesús después de escuchar a Juan.','Llevé a mi hermano Simón ante Jesús.','Mi hermano fue llamado Pedro.'),'Discípulos','easy'),
  ('Bartimeo','Bartimeo','Zaqueo','Jairo','Nicodemo',jsonb_build_array('Era ciego y mendigaba cerca de Jericó.','Oí que Jesús pasaba por el camino.','Grité: Hijo de David, ten misericordia de mí.','Jesús me devolvió la vista.'),'Personajes del Nuevo Testamento','medium'),
  ('Bernabé','Bernabé','Silas','Marcos','Timoteo',jsonb_build_array('Mi nombre significa hijo de consolación.','Vendí un campo y entregué el dinero a los apóstoles.','Acompañé a Pablo en viajes misioneros.','Defendí que Marcos viajara conmigo.'),'Personajes del Nuevo Testamento','medium'),
  ('Cornelio','Cornelio','Sergio Paulo','Jairo','Lisimaco',jsonb_build_array('Era centurión romano en Cesarea.','Era devoto y daba limosnas.','Un ángel me indicó que buscara a Pedro.','El Espíritu Santo descendió sobre mi familia.'),'Personajes del Nuevo Testamento','hard'),
  ('Esdras','Esdras','Nehemías','Zorobabel','Hageo',jsonb_build_array('Fui escriba y sacerdote.','Regresé del exilio a Jerusalén.','Me dediqué a estudiar y enseñar la Ley.','Leí la Ley ante el pueblo junto a otros levitas.'),'Personajes del Antiguo Testamento','medium'),
  ('Felipe el evangelista','Felipe el evangelista','Felipe el apóstol','Esteban','Bernabé',jsonb_build_array('Fui uno de los siete escogidos para servir.','Anuncié a Jesús en Samaria.','El Espíritu me llevó al camino de Gaza.','Expliqué Isaías a un funcionario etíope.'),'Personajes del Nuevo Testamento','hard'),
  ('Gedeón','Gedeón','Sansón','Barac','Abimelec',jsonb_build_array('Al principio me consideré el menor de mi familia.','Dios me llamó mientras sacudía trigo.','Pedí una señal con un vellón.','Vencí a Madián con solo trescientos hombres.'),'Personajes del Antiguo Testamento','medium'),
  ('Jairo','Jairo','Bartimeo','Cornelio','Zaqueo',jsonb_build_array('Era principal de una sinagoga.','Me postré ante Jesús y le pedí ayuda.','Mi hija estaba muy enferma.','Jesús dijo a mi hija que se levantara.'),'Personajes del Nuevo Testamento','medium'),
  ('Lidia','Lidia','Priscila','Dorcas','Febe',jsonb_build_array('Era vendedora de púrpura.','Procedía de Tiatira.','Escuché a Pablo junto al río en Filipos.','Fui bautizada con los de mi casa.'),'Personajes del Nuevo Testamento','medium'),
  ('Matías','Matías','Esteban','Bernabé','Silas',jsonb_build_array('Acompañé a los discípulos desde el bautismo de Juan.','Fui testigo de la resurrección de Jesús.','Fui presentado junto con José Barsabás.','Fui escogido para completar el grupo de los Doce.'),'Discípulos','hard'),
  ('Micaías hijo de Imla','Micaías hijo de Imla','Miqueas','Elías','Natán',jsonb_build_array('Fui profeta en tiempos del rey Acab.','Anuncié una visión del ejército de Israel disperso.','Acab no quería oír mis palabras.','Mi relato está en 1 Reyes 22.'),'Personajes del Antiguo Testamento','hard'),
  ('Miriam','Miriam','Débora','Ester','Abigail',jsonb_build_array('Soy hermana de Moisés y Aarón.','Vigilé la canasta de mi hermano junto al río.','Guié a las mujeres con panderos tras cruzar el mar.','El libro de Éxodo me llama profetisa.'),'Personajes del Antiguo Testamento','medium'),
  ('Naaman','Naamán','Giezi','Ben-adad','Hazael',jsonb_build_array('Era comandante del ejército de Siria.','Tenía lepra.','El profeta Eliseo me mandó lavarme siete veces.','Regresé a Eliseo diciendo que no hay Dios sino en Israel.'),'Personajes del Antiguo Testamento','hard'),
  ('Nicodemo','Nicodemo','José de Arimatea','Gamaliel','Zaqueo',jsonb_build_array('Era fariseo y dirigente judío.','Fui a ver a Jesús de noche.','Jesús habló conmigo del nuevo nacimiento.','Ayudé a preparar el cuerpo de Jesús para sepultarlo.'),'Personajes del Nuevo Testamento','medium'),
  ('Onésimo','Onésimo','Tíquico','Epafrodito','Filemón',jsonb_build_array('Fui conocido por Pablo durante su prisión.','Pablo escribió una carta acerca de mí.','Mi nombre se relaciona con ser útil.','Pablo pidió que me recibieran como hermano amado.'),'Personajes del Nuevo Testamento','hard'),
  ('Priscila','Priscila','Lidia','Febe','Marta',jsonb_build_array('Mi esposo se llamaba Aquila.','Trabajé haciendo tiendas.','Junto a mi esposo expliqué con más exactitud el camino de Dios.','Apolos fue nuestro aprendiz en Éfeso.'),'Personajes del Nuevo Testamento','medium'),
  ('Simeón de Jerusalén','Simeón','Zacarías','José','Elí',jsonb_build_array('Era justo y esperaba el consuelo de Israel.','El Espíritu Santo estaba sobre mí.','Tomé al niño Jesús en mis brazos en el templo.','Dije que mis ojos habían visto la salvación de Dios.'),'Personajes del Nuevo Testamento','hard')
)
INSERT INTO public.game_guess_characters(name,option_a,option_b,option_c,option_d,clues,category,difficulty,is_active)
SELECT seed.name,seed.option_a,seed.option_b,seed.option_c,seed.option_d,seed.clues,seed.category,seed.difficulty,true
FROM seed
WHERE NOT EXISTS (SELECT 1 FROM public.game_guess_characters old WHERE lower(old.name)=lower(seed.name));

WITH seed(name,bible_reference) AS (VALUES
  ('Moisés','Éxodo 14:21-22'),('David','1 Samuel 17:49-50'),('Pedro','Mateo 14:28-31'),
  ('María (madre de Jesús)','Lucas 1:26-38'),('Pablo','Hechos 9:1-19'),('José (hijo de Jacob)','Génesis 41:39-43'),
  ('Ester','Ester 4:14-16'),('Jonás','Jonás 3:1-5'),('Noé','Génesis 6:14-22'),('Daniel','Daniel 6:16-23'),
  ('Rut','Rut 1:16-17'),('Abraham','Génesis 12:1-4'),('Josué','Josué 6:1-20'),('Débora','Jueces 4:4-10'),
  ('Elías','1 Reyes 18:36-39'),('Samuel','1 Samuel 3:1-10'),('Juan el Bautista','Mateo 3:1-6,13-17'),
  ('Marta','Juan 11:20-27'),('Zaqueo','Lucas 19:1-10'),('Timoteo','2 Timoteo 1:5; 3:14-15'),
  ('Agar','Génesis 16:7-13'),('Aarón','Éxodo 4:14-16; 28:1'),('Abigail','1 Samuel 25:32-42'),
  ('Andrés','Juan 1:40-42'),('Bartimeo','Marcos 10:46-52'),('Bernabé','Hechos 4:36-37; 15:36-39'),
  ('Cornelio','Hechos 10:1-8,44-48'),('Esdras','Esdras 7:6,10'),('Felipe el evangelista','Hechos 8:26-39'),
  ('Gedeón','Jueces 7:7-22'),('Jairo','Marcos 5:22-24,35-43'),('Lidia','Hechos 16:14-15'),
  ('Matías','Hechos 1:21-26'),('Micaías hijo de Imla','1 Reyes 22:13-28'),('Miriam','Éxodo 15:20-21'),
  ('Naamán','2 Reyes 5:1-14'),('Nicodemo','Juan 3:1-10; 19:39-40'),('Onésimo','Filemón 10-16'),
  ('Priscila','Hechos 18:24-26'),('Simeón de Jerusalén','Lucas 2:25-32')
)
UPDATE public.game_guess_characters AS character
SET bible_reference = seed.bible_reference
FROM seed
WHERE lower(character.name)=lower(seed.name)
  AND nullif(btrim(character.bible_reference),'') IS NULL;

DROP POLICY IF EXISTS "Public can view complete active memory cards" ON public.game_memory_cards;
DROP POLICY IF EXISTS "Public can view memory cards" ON public.game_memory_cards;
DROP POLICY IF EXISTS "Public read access for memory cards" ON public.game_memory_cards;
CREATE POLICY "Public can view complete active memory cards"
  ON public.game_memory_cards
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND nullif(btrim(match_text), '') IS NOT NULL
    AND nullif(btrim(explanation), '') IS NOT NULL
    AND nullif(btrim(bible_reference), '') IS NOT NULL
    AND nullif(btrim(image_url), '') IS NOT NULL
    AND nullif(btrim(match_image_url), '') IS NOT NULL
    AND nullif(btrim(learning_question), '') IS NOT NULL
    AND nullif(btrim(learning_answer), '') IS NOT NULL
    AND jsonb_typeof(learning_options) = 'array'
    AND jsonb_array_length(learning_options) >= 3
    AND learning_options @> jsonb_build_array(learning_answer)
  );

GRANT SELECT ON public.game_memory_cards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.game_memory_cards TO authenticated;
NOTIFY pgrst, 'reload schema';
