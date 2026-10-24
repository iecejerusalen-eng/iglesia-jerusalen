export type BibleOverviewTimelineEntry = {
  id: string;
  era: string;
  title: string;
  summary: string;
  references: string[];
  studyPrompt: string;
  mapId?: string;
  people?: string[];
};

export type PatriarchsTimelineEntry = {
  id: string;
  title: string;
  summary: string;
  references: string[];
  studyPrompt: string;
  people: string[];
  locationIds?: string[];
};

export type JesusTimelineEntry = {
  id: string;
  title: string;
  summary: string;
  references: string[];
  studyPrompt: string;
  people: string[];
  locationIds?: string[];
  quadrangularId?: string;
};

/** A narrated reading route through Genesis; numbered sequence is not a calendar chronology. */
export const patriarchsTimeline: PatriarchsTimelineEntry[] = [
  {
    id: 'abraham-departs', title: 'Abram emprende el camino',
    summary: 'Abram deja Harán y se dirige a Canaán en respuesta al llamado de Dios. Hechos 7 recuerda que el llamado ocurrió mientras Abraham aún estaba en Mesopotamia; los pasajes presentan momentos distintos de la salida.',
    references: ['Génesis 11:31-12:9', 'Hechos 7:2-4'], studyPrompt: '¿Qué deja Abram, qué recibe como promesa y cómo relee Esteban ese llamado?', people: ['abraham'], locationIds: ['haran', 'shechem', 'bethel'],
  },
  {
    id: 'abraham-covenant', title: 'La promesa y el pacto',
    summary: 'Génesis presenta la promesa de descendencia, la fe de Abram y el pacto que reafirma su relación con Dios.',
    references: ['Génesis 15:1-6', 'Génesis 17:1-8'], studyPrompt: '¿Qué elementos de la promesa aparecen antes y después del cambio de nombre?', people: ['abraham'],
  },
  {
    id: 'abraham-intercedes', title: 'Abraham intercede por Sodoma',
    summary: 'En Mamre, Abraham conversa con Dios sobre Sodoma y pregunta por los justos que pudieran vivir allí. El diálogo muestra su preocupación por la justicia y la misericordia.',
    references: ['Génesis 18:16-33'], studyPrompt: '¿Cómo cambia la conversación mientras Abraham pregunta por la ciudad?', people: ['abraham'], locationIds: ['hebron'],
  },
  {
    id: 'isaac-born', title: 'Nace Isaac',
    summary: 'Sara da a luz a Isaac en su vejez, como el relato había anunciado. La familia entra en una nueva etapa, con tensiones que el texto también describe.',
    references: ['Génesis 21:1-7', 'Génesis 21:8-21'], studyPrompt: '¿Cómo reúne el capítulo cumplimiento, alegría y conflicto dentro de la familia?', people: ['abraham', 'isaac'],
  },
  {
    id: 'isaac-promised-wife', title: 'Rebeca llega a la familia',
    summary: 'Génesis cuenta cómo Rebeca acepta viajar para conocer a Isaac. El relato se detiene en la oración del siervo, la hospitalidad de su familia y la decisión de ella.',
    references: ['Génesis 24:1-67'], studyPrompt: '¿Qué decisiones toman Rebeca y su familia, y qué detalles destaca el narrador?', people: ['isaac', 'rebecca'],
  },
  {
    id: 'abraham-and-isaac-moriah', title: 'La prueba en la región de Moriah',
    summary: 'Abraham lleva a Isaac al lugar que Dios le indica. El relato narra la prueba, la intervención divina y el carnero ofrecido en lugar del muchacho.',
    references: ['Génesis 22:1-19'], studyPrompt: '¿Qué manda Dios, cómo responde Abraham y qué provisión aparece al final?', people: ['abraham', 'isaac'],
  },
  {
    id: 'isaac-beersheba', title: 'Isaac en Beerseba',
    summary: 'Isaac se establece en Beerseba. Génesis relaciona ese lugar con un encuentro con Dios y con una alianza local de paz.',
    references: ['Génesis 26:23-33'], studyPrompt: '¿Qué sucede en Beerseba y qué acuerdos aparecen en esta escena?', people: ['isaac'], locationIds: ['beersheba'],
  },
  {
    id: 'jacob-bethel', title: 'El sueño de Jacob en Betel',
    summary: 'Mientras viaja hacia Harán, Jacob sueña con una escalera que une cielo y tierra. Al despertar, nombra Betel el lugar y hace un voto.',
    references: ['Génesis 28:10-22'], studyPrompt: '¿Qué promete Dios a Jacob y qué respuesta da Jacob al despertar?', people: ['jacob'], locationIds: ['bethel'],
  },
  {
    id: 'jacob-israel', title: 'Jacob recibe el nombre Israel',
    summary: 'Tras años lejos de Canaán, Jacob cruza el Jaboc. Génesis narra su lucha nocturna y el cambio de nombre Israel antes de que vuelva a Betel.',
    references: ['Génesis 32:22-32', 'Génesis 35:9-15'], studyPrompt: '¿Qué nombres recibe Jacob y cómo explica el relato ese cambio?', people: ['jacob'], locationIds: ['peniel', 'bethel'],
  },
  {
    id: 'jacob-and-esau-reunite', title: 'Jacob y Esaú se reconcilian',
    summary: 'Jacob se acerca a Esaú con temor, pero los hermanos se encuentran y lloran juntos. El pasaje registra el gesto de reconciliación sin borrar los años de conflicto anteriores.',
    references: ['Génesis 32:3-21', 'Génesis 33:1-11'], studyPrompt: '¿Qué hace Jacob antes del encuentro y cómo responde Esaú cuando por fin se ven?', people: ['jacob'],
  },
  {
    id: 'joseph-sold', title: 'José es llevado a Egipto',
    summary: 'La envidia de sus hermanos termina en la venta de José a una caravana. Jacob recibe una noticia falsa sobre su hijo.',
    references: ['Génesis 37:1-36'], studyPrompt: '¿Qué decisiones y engaños conducen a la separación de José y su familia?', people: ['jacob', 'joseph'], locationIds: ['egypt'],
  },
  {
    id: 'joseph-prison-to-palace', title: 'De la prisión al servicio de Faraón',
    summary: 'José interpreta los sueños de Faraón y propone guardar alimentos para los años de abundancia. Faraón lo pone a cargo de la administración durante la hambruna.',
    references: ['Génesis 39:20-23', 'Génesis 40:1-23', 'Génesis 41:1-57'], studyPrompt: '¿Qué capacidades reconoce Faraón en José y qué responsabilidad le confía?', people: ['joseph'], locationIds: ['egypt'],
  },
  {
    id: 'joseph-reconciles', title: 'La familia se reúne en Egipto',
    summary: 'José revela su identidad a sus hermanos y la familia desciende a Egipto durante la hambruna. Génesis cuenta que Jacob se instala en Gosén.',
    references: ['Génesis 45:1-15', 'Génesis 46:1-7', 'Génesis 47:1-12'], studyPrompt: '¿Cómo describe José lo ocurrido y qué condiciones encuentra su familia al llegar a Egipto?', people: ['joseph', 'jacob'], locationIds: ['goshen', 'egypt'],
  },
  {
    id: 'jacob-and-joseph-final-days', title: 'Bendiciones y una esperanza que continúa',
    summary: 'Jacob bendice a sus hijos y muere en Egipto; su familia lo lleva a sepultar en Canaán. Al final, José pide que sus huesos también sean llevados cuando Dios visite a su pueblo.',
    references: ['Génesis 47:27-31', 'Génesis 48:1-22', 'Génesis 49:1-33', 'Génesis 50:1-26'], studyPrompt: '¿Qué promesas y encargos aparecen en las últimas escenas, y cómo deja el final abierta la historia de Israel?', people: ['jacob', 'joseph'], locationIds: ['goshen', 'hebron'],
  },
];

/** Original Spanish narrative summaries grounded in the cited Gospel and Acts passages. */
export const jesusTimeline: JesusTimelineEntry[] = [
  {
    id: 'jesus-birth', title: 'Nace Jesús en Belén',
    summary: 'Lucas narra el nacimiento de Jesús y presenta a pastores que reciben la noticia. Mateo cuenta la visita de unos magos y el peligro que enfrenta la familia.',
    references: ['Lucas 2:1-20', 'Mateo 2:1-12'], studyPrompt: '¿Qué personajes reciben la noticia y cómo reaccionan ante el nacimiento?', people: ['jesus', 'mary-mother-jesus'], locationIds: ['bethlehem'],
  },
  {
    id: 'john-prepares-way', title: 'Juan prepara el camino',
    summary: 'Juan llama al pueblo a volverse a Dios y bautiza en el Jordán. Jesús llega para ser bautizado; el relato asocia su inicio público con la obra del Espíritu.',
    references: ['Marcos 1:1-11', 'Lucas 3:1-22'], studyPrompt: '¿Qué anuncia Juan y qué sucede cuando Jesús es bautizado?', people: ['jesus', 'john-baptist'],
  },
  {
    id: 'first-sign-cana', title: 'Una señal en Caná',
    summary: 'Juan cuenta que, durante una boda en Caná de Galilea, Jesús realizó su primera señal. El relato conecta el episodio con la fe de sus discípulos.',
    references: ['Juan 2:1-11'], studyPrompt: '¿Qué observan los discípulos y qué dice Juan que esta señal les permitió reconocer?', people: ['jesus', 'mary-mother-jesus'], locationIds: ['cana'],
  },
  {
    id: 'kingdom-announced', title: 'Jesús anuncia su misión',
    summary: 'En la sinagoga de Nazaret, Jesús lee a Isaías y aplica el pasaje a su misión. En Galilea anuncia que el Reino de Dios se ha acercado.',
    references: ['Lucas 4:14-30', 'Marcos 1:14-15'], studyPrompt: '¿Qué anuncia Jesús y a quiénes describe como destinatarios de su misión?', people: ['jesus'], locationIds: ['nazareth'], quadrangularId: 'jesus-savior',
  },
  {
    id: 'ministry-galilee', title: 'El Reino se anuncia en Galilea',
    summary: 'Jesús enseña y recorre pueblos de Galilea. Los Evangelios narran sanidades, liberaciones y momentos de compasión junto a su proclamación.',
    references: ['Mateo 4:23-25', 'Marcos 1:29-39', 'Lucas 7:18-23'], studyPrompt: '¿Cómo relacionan estos pasajes las palabras de Jesús con sus acciones?', people: ['jesus', 'peter'], locationIds: ['capernaum', 'bethsaida'], quadrangularId: 'jesus-healer',
  },
  {
    id: 'parables-and-disciples', title: 'Enseña a sus discípulos y a la multitud',
    summary: 'Jesús forma un grupo de discípulos y usa parábolas para enseñar sobre el Reino de Dios. Algunas explicaciones se dan en privado a sus seguidores.',
    references: ['Lucas 5:1-11', 'Marcos 4:1-20', 'Mateo 13:34-36'], studyPrompt: '¿Qué diferencia notas entre contar una parábola y explicar su sentido a los discípulos?', people: ['jesus', 'peter'],
  },
  {
    id: 'messiah-confessed', title: 'Pedro confiesa que Jesús es el Mesías',
    summary: 'En Cesarea de Filipo, Pedro responde que Jesús es el Mesías. Jesús empieza a enseñar a sus discípulos acerca de su sufrimiento y muerte.',
    references: ['Mateo 16:13-28', 'Lucas 9:18-27'], studyPrompt: '¿Qué entiende Pedro y qué corrige Jesús sobre lo que significa seguirlo?', people: ['jesus', 'peter'], locationIds: ['caesarea-philippi'], quadrangularId: 'jesus-savior',
  },
  {
    id: 'bethany-lazarus', title: 'Jesús visita a Marta, María y Lázaro',
    summary: 'Juan narra el duelo de una familia amiga de Jesús y cuenta que él llamó a Lázaro fuera de la tumba. La historia conduce a nuevas reacciones ante su ministerio.',
    references: ['Juan 11:1-44', 'Juan 12:1-8'], studyPrompt: '¿Qué dicen Marta y María, qué hace Jesús frente al duelo y qué afirma sobre sí mismo?', people: ['jesus', 'lazarus', 'martha', 'mary-bethany'], locationIds: ['bethany'], quadrangularId: 'jesus-healer',
  },
  {
    id: 'zacchaeus-jericho', title: 'Zaqueo recibe a Jesús en Jericó',
    summary: 'Al atravesar Jericó, Jesús llama a Zaqueo y se hospeda en su casa. Lucas relata la respuesta de Zaqueo y el propósito que Jesús declara para su misión.',
    references: ['Lucas 19:1-10'], studyPrompt: '¿Qué cambia en la respuesta de Zaqueo y cómo explica Jesús su visita?', people: ['jesus', 'zacchaeus'], locationIds: ['jericho'], quadrangularId: 'jesus-savior',
  },
  {
    id: 'jerusalem-entry', title: 'Entra en Jerusalén',
    summary: 'Jesús llega a Jerusalén y es recibido por una multitud. Después enseña en el templo y confronta prácticas que afectan a la comunidad.',
    references: ['Lucas 19:28-48', 'Marcos 11:1-11'], studyPrompt: '¿Qué título y qué expectativas aparecen en la bienvenida a Jesús?', people: ['jesus'], locationIds: ['jerusalem'], quadrangularId: 'jesus-coming-king',
  },
  {
    id: 'last-supper', title: 'La última cena y la oración',
    summary: 'Durante la cena con sus discípulos, Jesús interpreta el pan y la copa y les enseña a servirse unos a otros. Luego ora antes de ser arrestado.',
    references: ['Lucas 22:14-27', 'Lucas 22:39-46', 'Juan 13:1-17'], studyPrompt: '¿Qué modelo de servicio ofrece Jesús y cómo responden sus discípulos?', people: ['jesus', 'peter'], locationIds: ['jerusalem'],
  },
  {
    id: 'cross', title: 'La cruz',
    summary: 'Los Evangelios narran el juicio, la crucifixión y la muerte de Jesús. Sus discípulos y varias mujeres observan desde distintos lugares.',
    references: ['Lucas 23:26-49', 'Juan 19:16-30'], studyPrompt: '¿Qué palabras y acciones registra cada relato en la muerte de Jesús?', people: ['jesus', 'mary-mother-jesus', 'mary-magdalene'], locationIds: ['jerusalem'], quadrangularId: 'jesus-savior',
  },
  {
    id: 'resurrection', title: 'La tumba vacía y el encuentro',
    summary: 'Las mujeres encuentran la tumba abierta y reciben el anuncio de que Jesús ha resucitado. Los relatos cuentan distintos encuentros con el Resucitado.',
    references: ['Lucas 24:1-12', 'Juan 20:1-18', '1 Corintios 15:3-8'], studyPrompt: '¿Quiénes llevan la noticia y qué hacen los discípulos al escucharla?', people: ['jesus', 'peter', 'mary-magdalene'], locationIds: ['jerusalem'], quadrangularId: 'jesus-savior',
  },
  {
    id: 'commission-and-promise', title: 'Envío y promesa del Espíritu',
    summary: 'Jesús resucitado envía a sus discípulos como testigos y les pide esperar la promesa del Padre. Hechos relata la ascensión y anticipa el testimonio que comenzará en Jerusalén.',
    references: ['Lucas 24:44-53', 'Hechos 1:1-11'], studyPrompt: '¿Qué misión reciben los discípulos y qué deben esperar antes de salir?', people: ['jesus', 'peter'], locationIds: ['jerusalem'], quadrangularId: 'jesus-baptizer',
  },
  {
    id: 'pentecost', title: 'Pentecostés: comienza el testimonio',
    summary: 'En Jerusalén, los discípulos reciben el Espíritu Santo y comienzan a anunciar las obras de Dios. Pedro explica lo sucedido y llama a sus oyentes a responder al mensaje de Jesús.',
    references: ['Hechos 2:1-21', 'Hechos 2:32-41'], studyPrompt: '¿Qué cambia en la manera en que los discípulos dan testimonio y qué respuesta provoca el mensaje?', people: ['peter', 'jesus'], locationIds: ['jerusalem'], quadrangularId: 'jesus-baptizer',
  },
  {
    id: 'return-hope', title: 'La Iglesia espera su regreso',
    summary: 'Los mensajeros de Hechos anuncian que Jesús volverá. Las cartas apostólicas llaman a esperar con fidelidad, sin señalar una fecha.',
    references: ['Hechos 1:9-11', '1 Tesalonicenses 4:13-18', 'Tito 2:11-14'], studyPrompt: '¿Qué actitud relacionan estos pasajes con la esperanza del regreso de Cristo?', people: ['jesus'], quadrangularId: 'jesus-coming-king',
  },
];

/** Canonical narrative overview; labels indicate sequence, not proposed calendar dates. */
export const bibleOverviewTimeline: BibleOverviewTimelineEntry[] = [
  {
    id: 'creation', era: 'Los comienzos', title: 'Creación, caída y promesa',
    summary: 'Génesis presenta a Dios como Creador, relata la entrada del pecado y abre una historia de promesa y esperanza.',
    references: ['Génesis 1:1-2:3', 'Génesis 3:1-15'],
    studyPrompt: '¿Qué muestran estos capítulos sobre Dios, la humanidad y la primera promesa de restauración?',
  },
  {
    id: 'patriarchs', era: 'Los patriarcas', title: 'Una familia llamada por Dios',
    summary: 'Dios llama a Abram y la historia sigue a las familias de Isaac y Jacob, cuyos relatos recorren Canaán y sus alrededores.',
    references: ['Génesis 12:1-9', 'Génesis 28:10-15', 'Génesis 46:1-7'],
    studyPrompt: '¿Cómo se desarrolla la promesa de Dios a través de varias generaciones?', mapId: 'patriarchs',
  },
  {
    id: 'exodus', era: 'Liberación y pacto', title: 'Éxodo, Sinaí y el camino',
    summary: 'Israel sale de Egipto, recibe la ley en el Sinaí y atraviesa el desierto rumbo a la tierra prometida.',
    references: ['Éxodo 12:31-42', 'Éxodo 19:1-8', 'Números 33:1-2'],
    studyPrompt: '¿Qué actos de liberación y qué responsabilidades del pacto destaca el texto?', mapId: 'exodus-canaan',
  },
  {
    id: 'land', era: 'En Canaán', title: 'Entrada y asentamiento',
    summary: 'Josué narra la entrada del pueblo en Canaán y la distribución de territorios entre las tribus.',
    references: ['Josué 1:1-9', 'Josué 21:43-45', 'Jueces 2:6-10'],
    studyPrompt: '¿Cómo conecta Josué la promesa, la obediencia y la vida del pueblo en la tierra?', mapId: 'exodus-canaan',
  },
  {
    id: 'kingdom', era: 'La monarquía', title: 'Reyes, templo y profetas',
    summary: 'La monarquía de Israel incluye el establecimiento de Jerusalén como centro real y el templo construido durante el reinado de Salomón; los profetas llaman al pueblo a volver a Dios.',
    references: ['2 Samuel 5:1-5', '1 Reyes 8:22-30', '2 Reyes 17:13-18'],
    studyPrompt: '¿Qué responsabilidades y límites presentan los relatos para los reyes y el pueblo?',
  },
  {
    id: 'exile', era: 'Exilio', title: 'Pérdida, juicio y esperanza',
    summary: 'Los libros históricos registran la caída de Jerusalén y el exilio; los profetas anuncian juicio y también esperanza de restauración.',
    references: ['2 Reyes 25:1-12', 'Jeremías 29:10-14', 'Ezequiel 36:24-28'],
    studyPrompt: '¿Cómo conviven las consecuencias de la infidelidad y la esperanza de restauración?',
  },
  {
    id: 'return', era: 'Regreso', title: 'Reconstrucción y renovación',
    summary: 'En tiempos de los imperios persas, algunos exiliados regresan, reconstruyen el templo y renuevan el compromiso con la ley.',
    references: ['Esdras 1:1-5', 'Nehemías 6:15-16', 'Nehemías 8:1-8'],
    studyPrompt: '¿Qué papel tienen la adoración, la enseñanza y la comunidad en la reconstrucción?',
  },
  {
    id: 'jesus', era: 'Evangelios', title: 'La vida y el ministerio de Jesús',
    summary: 'Los Evangelios narran el nacimiento, la enseñanza, las obras y el ministerio de Jesús en Galilea, Judea y Jerusalén.',
    references: ['Lucas 4:14-21', 'Mateo 4:23-25', 'Marcos 10:45'],
    studyPrompt: '¿Qué anuncia Jesús y cómo se refleja ese mensaje en sus palabras y acciones?', mapId: 'palestine-new-testament',
  },
  {
    id: 'cross-resurrection', era: 'Evangelios', title: 'La cruz y la resurrección',
    summary: 'Los cuatro Evangelios cuentan la muerte de Jesús y proclaman su resurrección; los discípulos son enviados a dar testimonio.',
    references: ['Lucas 23:32-49', 'Lucas 24:1-12', '1 Corintios 15:3-8'],
    studyPrompt: '¿Qué afirman los testigos sobre la resurrección y qué misión reciben?', mapId: 'palestine-new-testament',
  },
  {
    id: 'church', era: 'La Iglesia', title: 'Pentecostés y el testimonio',
    summary: 'Hechos relata la venida del Espíritu Santo en Pentecostés y la expansión del testimonio de Jesús desde Jerusalén hacia otras regiones.',
    references: ['Hechos 1:6-8', 'Hechos 2:1-12', 'Hechos 9:31'],
    studyPrompt: '¿Cómo describe Hechos el crecimiento de la Iglesia y la obra del Espíritu Santo?',
  },
  {
    id: 'paul', era: 'Misión apostólica', title: 'El mensaje llega a las naciones',
    summary: 'Hechos y las cartas apostólicas muestran comunidades cristianas en distintas ciudades y el trabajo misionero de Pablo y sus colaboradores.',
    references: ['Hechos 13:1-5', 'Hechos 16:6-10', 'Hechos 28:30-31'],
    studyPrompt: '¿Qué personas y comunidades participan en la misión descrita en estos pasajes?', mapId: 'paul-journeys',
  },
  {
    id: 'new-creation', era: 'Esperanza final', title: 'Nueva creación',
    summary: 'La visión final de Apocalipsis anuncia la derrota del mal, la presencia de Dios con su pueblo y la renovación de todas las cosas.',
    references: ['Apocalipsis 21:1-5', 'Apocalipsis 22:1-5'],
    studyPrompt: '¿Qué imágenes de consuelo y esperanza aparecen en la visión final?',
  },
];

/** Secuencia literaria de Génesis 2; no establece una datación de calendario ni resuelve su relación cronológica con Génesis 1. */
export const genesisChapterTwoTimeline: BibleOverviewTimelineEntry[] = [
  {
    id: 'genesis-2-human', era: 'El jardín · Génesis 2:4-7', title: 'El ser humano recibe vida',
    summary: 'Dios forma al ser humano del polvo de la tierra y le da aliento de vida.',
    references: ['Génesis 2:4-7'], studyPrompt: '¿Qué relación presenta el pasaje entre tierra, aliento y vida?', people: ['creator', 'human'],
  },
  {
    id: 'genesis-2-garden', era: 'El jardín · Génesis 2:8-17', title: 'Un lugar, una tarea y un límite',
    summary: 'Dios planta el jardín, coloca allí al ser humano y le encomienda trabajarlo y cuidarlo.',
    references: ['Génesis 2:8-17'], studyPrompt: '¿Qué encargo recibe el ser humano y qué límite forma parte de ese encargo?', people: ['creator', 'human'],
  },
  {
    id: 'genesis-2-animals', era: 'El jardín · Génesis 2:18-20', title: 'Los animales son nombrados',
    summary: 'El ser humano nombra a los animales; el relato dice que no encuentra entre ellos una compañía correspondiente.',
    references: ['Génesis 2:18-20'], studyPrompt: '¿Qué aporta esta escena al desarrollo de la búsqueda de una compañía correspondiente?', people: ['human'],
  },
  {
    id: 'genesis-2-woman', era: 'El jardín · Génesis 2:21-25', title: 'La mujer y la unión humana',
    summary: 'El relato presenta a la mujer y concluye con una reflexión sobre la unión y la vida compartida.',
    references: ['Génesis 2:21-25'], studyPrompt: '¿Qué palabras del pasaje expresan reconocimiento y parentesco?', people: ['human', 'woman-genesis'],
  },
];

/** Secuencia narrativa de Génesis 3; no propone fechas históricas ni de calendario. */
export const genesisChapterThreeTimeline: BibleOverviewTimelineEntry[] = [
  { id: 'genesis-3-dialogue', era: 'El jardín · Génesis 3:1-5', title: 'La palabra de Dios es cuestionada', summary: 'La serpiente conversa con la mujer acerca del mandato recibido y contradice la advertencia de Dios.', references: ['Génesis 2:16-17', 'Génesis 3:1-5'], studyPrompt: '¿Cómo cambia el mandato cuando cada interlocutor lo cita?', people: ['serpent-genesis', 'woman-genesis'] },
  { id: 'genesis-3-rupture', era: 'El jardín · Génesis 3:6-13', title: 'La pareja come y se esconde', summary: 'El hombre y la mujer comen, se cubren y se esconden; Dios los llama y escucha sus respuestas.', references: ['Génesis 3:6-13'], studyPrompt: '¿Qué efectos inmediatos de la decisión narra el pasaje?', people: ['creator', 'human', 'woman-genesis'] },
  { id: 'genesis-3-consequences', era: 'Consecuencias · Génesis 3:14-19', title: 'Dios pronuncia consecuencias', summary: 'Dios se dirige a la serpiente, a la mujer y al hombre; la escena describe conflicto, dolor, trabajo y mortalidad.', references: ['Génesis 3:14-19'], studyPrompt: '¿Qué palabras recibe cada personaje y cómo cambia la vida descrita?', people: ['creator', 'human', 'woman-genesis', 'serpent-genesis'] },
  { id: 'genesis-3-departure', era: 'Cierre · Génesis 3:20-24', title: 'Vestiduras y salida del jardín', summary: 'Dios hace vestiduras para la pareja y guarda el camino al árbol de la vida tras enviarlos fuera del jardín.', references: ['Génesis 3:20-24'], studyPrompt: '¿Cómo conviven en el cierre las consecuencias, el cuidado y el límite?', people: ['creator', 'human', 'woman-genesis'] },
];

/** Exodus-to-Canaan route following the biblical narrative; routes and disputed pins remain illustrative. */
export const exodusTimeline: BibleOverviewTimelineEntry[] = [
  {
    id: 'exodus-oppression', era: 'En Egipto', title: 'El pueblo vive bajo opresión',
    summary: 'Éxodo cuenta que un nuevo faraón somete a Israel a trabajos forzados. Las parteras desobedecen la orden de matar a los niños hebreos y Moisés sobrevive cuando su madre lo pone en una cesta en el río.',
    references: ['Éxodo 1:8-22', 'Éxodo 2:1-10'], studyPrompt: '¿Qué decisiones toman las parteras y la familia de Moisés frente a la violencia del faraón?', mapId: 'exodus-canaan', people: ['moses'],
  },
  {
    id: 'exodus-moses-call', era: 'En Horeb', title: 'Moisés recibe su llamado',
    summary: 'En el monte Horeb, Dios llama a Moisés desde la zarza y lo envía a sacar a Israel de Egipto. Moisés expresa sus temores y recibe una promesa de compañía.',
    references: ['Éxodo 3:1-15', 'Éxodo 4:10-17'], studyPrompt: '¿Cómo se presenta Dios y qué responde cuando Moisés expresa sus objeciones?', mapId: 'exodus-canaan', people: ['moses'],
  },
  {
    id: 'exodus-before-pharaoh', era: 'Liberación', title: 'Moisés y Aarón ante Faraón',
    summary: 'Moisés y Aarón piden que Faraón deje salir al pueblo. Éxodo narra el endurecimiento de la opresión, las señales y los juicios que preceden a la salida.',
    references: ['Éxodo 5:1-23', 'Éxodo 7:1-13', 'Éxodo 11:1-10'], studyPrompt: '¿Qué contrasta el relato entre el poder de Faraón y la palabra de Dios?', mapId: 'exodus-canaan', people: ['moses', 'aaron', 'pharaoh-exodus'],
  },
  {
    id: 'exodus-passover', era: 'La salida de Egipto', title: 'La Pascua y el comienzo del éxodo',
    summary: 'El pueblo recibe instrucciones para la Pascua y sale de Egipto después de la última plaga. El libro presenta la celebración como memoria de la liberación.',
    references: ['Éxodo 12:1-42', 'Éxodo 13:1-16'], studyPrompt: '¿Qué debía recordar Israel mediante la Pascua y cómo cambia su vida después de salir?', mapId: 'exodus-canaan', people: ['moses', 'aaron', 'pharaoh-exodus'],
  },
  {
    id: 'exodus-sea', era: 'En el camino', title: 'El paso por el mar',
    summary: 'Cuando Faraón persigue al pueblo, Israel queda frente al mar. Éxodo relata el cruce y la salvación del pueblo; no ofrece coordenadas modernas que permitan fijar con certeza el lugar.',
    references: ['Éxodo 13:17-22', 'Éxodo 14:1-31'], studyPrompt: '¿Qué temen los israelitas, qué les ordena Moisés y cómo describe el texto su paso?', mapId: 'exodus-canaan', people: ['moses', 'miriam', 'pharaoh-exodus'],
  },
  {
    id: 'exodus-wilderness', era: 'El desierto', title: 'Agua y alimento en el desierto',
    summary: 'Durante el viaje, Israel enfrenta sed y hambre. Los relatos hablan de agua en Mará y en Refidim, del maná y las codornices, y de la provisión cotidiana para el pueblo.',
    references: ['Éxodo 15:22-27', 'Éxodo 16:1-36', 'Éxodo 17:1-7'], studyPrompt: '¿Qué necesidades aparecen y qué instrucciones acompañan la provisión de cada día?', mapId: 'exodus-canaan', people: ['moses', 'aaron'],
  },
  {
    id: 'exodus-sinai-covenant', era: 'En el Sinaí', title: 'El pacto y los mandamientos',
    summary: 'Israel llega al Sinaí y escucha las palabras del pacto. Éxodo presenta la ley dentro de la relación que Dios establece con un pueblo liberado de Egipto.',
    references: ['Éxodo 19:1-8', 'Éxodo 20:1-17', 'Éxodo 24:3-8'], studyPrompt: '¿Qué relación establece el texto entre la liberación, el pacto y la vida del pueblo?', mapId: 'exodus-canaan', people: ['moses', 'aaron', 'joshua'],
  },
  {
    id: 'exodus-golden-calf', era: 'Ruptura y renovación', title: 'El becerro de oro y un pacto renovado',
    summary: 'Mientras Moisés está en el monte, el pueblo hace un becerro de oro. Éxodo relata la confrontación, la intercesión de Moisés y la renovación del pacto.',
    references: ['Éxodo 32:1-35', 'Éxodo 34:1-10'], studyPrompt: '¿Cómo responden Moisés y Dios a la infidelidad del pueblo?', mapId: 'exodus-canaan', people: ['moses', 'aaron'],
  },
  {
    id: 'exodus-tabernacle', era: 'La presencia de Dios', title: 'El tabernáculo en medio del pueblo',
    summary: 'Éxodo describe la construcción del tabernáculo según las instrucciones recibidas y concluye con la nube que cubre la tienda y la gloria de Dios que la llena.',
    references: ['Éxodo 25:1-9', 'Éxodo 35:4-29', 'Éxodo 40:1-38'], studyPrompt: '¿Qué propósito expresa Dios para el santuario y qué sucede cuando queda terminado?', mapId: 'exodus-canaan', people: ['moses', 'aaron'],
  },
  {
    id: 'exodus-spies', era: 'En la frontera', title: 'Los exploradores y la decisión de avanzar',
    summary: 'Números cuenta que doce hombres exploran Canaán. El pueblo escucha informes distintos, teme y se niega a entrar; la siguiente etapa transcurre en el desierto.',
    references: ['Números 13:1-33', 'Números 14:1-38'], studyPrompt: '¿Qué diferencias hay entre los informes y cómo influye el temor en la respuesta del pueblo?', mapId: 'exodus-canaan', people: ['moses', 'joshua', 'caleb'],
  },
  {
    id: 'exodus-joshua-commission', era: 'Cambio de liderazgo', title: 'Josué es comisionado',
    summary: 'Moisés encarga a Josué guiar al pueblo. Deuteronomio termina con la muerte de Moisés y recuerda que Israel entra en una nueva etapa bajo otro líder.',
    references: ['Números 27:12-23', 'Deuteronomio 31:1-8', 'Deuteronomio 34:1-12'], studyPrompt: '¿Qué mandato y qué promesa recibe Josué para continuar la tarea?', mapId: 'exodus-canaan', people: ['moses', 'joshua'],
  },
  {
    id: 'exodus-jordan', era: 'La entrada a Canaán', title: 'El pueblo cruza el Jordán',
    summary: 'Josué relata que Israel cruza el Jordán y levanta piedras para recordar lo ocurrido. El texto conecta la memoria de esta generación con la historia de sus hijos.',
    references: ['Josué 3:1-17', 'Josué 4:1-24'], studyPrompt: '¿Qué debía recordar la señal de las piedras y quiénes debían escuchar su significado?', mapId: 'exodus-canaan', people: ['joshua'],
  },
  {
    id: 'exodus-jericho', era: 'En la tierra', title: 'Jericó y la entrada al relato de Josué',
    summary: 'Josué narra la caída de Jericó después de que el pueblo rodea la ciudad durante siete días. El episodio se presenta dentro de la campaña de entrada a Canaán.',
    references: ['Josué 5:13-15', 'Josué 6:1-27'], studyPrompt: '¿Qué instrucciones reciben los israelitas y qué dice el relato sobre la respuesta del pueblo?', mapId: 'exodus-canaan', people: ['joshua'],
  },
  {
    id: 'exodus-shechem-covenant', era: 'Renovación del pacto', title: 'Israel renueva su compromiso en Siquem',
    summary: 'Al final de Josué, el pueblo se reúne en Siquem. Josué repasa la historia de Israel y llama a servir a Dios; el pueblo responde y el pacto queda registrado.',
    references: ['Josué 24:1-28'], studyPrompt: '¿Qué hace Josué antes del llamado y qué respuesta da el pueblo?', mapId: 'exodus-canaan', people: ['joshua'],
  },
];

