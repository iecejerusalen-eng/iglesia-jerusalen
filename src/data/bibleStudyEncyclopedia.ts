export type BibleStudyPlaceEntry = {
  id: string;
  placeId: string;
  atlasMapId?: string;
  atlasLocationId?: string;
  title: string;
  region: string;
  summary: string;
  context: string;
  references: string[];
  sceneIds?: string[];
  dictionaryEntry?: string;
};

export type BibleStudyPersonEntry = {
  id: string;
  placeId?: string;
  mapId?: string;
  title: string;
  region: string;
  summary: string;
  context: string;
  references: string[];
  dictionaryEntry?: string;
};

export type BibleStudyEventEntry = {
  id: string;
  placeId: string;
  placeIds: string[];
  title: string;
  region: string;
  summary: string;
  context: string;
  references: string[];
  date: string;
  places: string;
  atlasAction?: string;
  people: string[];
  studyPrompt: string;
  dictionaryEntry?: never;
};

export type BibleStudyQuadrangularEntry = {
  id: string;
  symbol: 'cross' | 'dove' | 'cup' | 'crown';
  title: string;
  region: string;
  summary: string;
  context: string;
  references: string[];
  dictionaryEntry?: never;
  placeId?: string;
};

export type BibleStudyQuadrangularCoreValue = {
  id: string;
  title: string;
  references: string[];
};

export type BibleStudyAtlasMapEntry = {
  id: string;
  title: string;
  period: string;
  summary: string;
  imagePath: string;
  imageAlt: string;
  references: string[];
  studyPrompt: string;
  note: string;
  sourceVersion: string;
};

export type BibleStudyMapLocationEntry = {
  id: string;
  title: string;
  region: string;
  x: number;
  y: number;
  summary: string;
  references: string[];
  people: string[];
  sceneIds: string[];
  image?: {
    src: string;
    alt: string;
    caption: string;
    author: string;
    sourceUrl: string;
    license: string;
    licenseUrl?: string;
    width: number;
    height: number;
  };
  identificationSource?: {
    url: string;
    candidates: Array<{ name: string; confidence: string }>;
  };
};

export type BibleStudyPatriarchLocationEntry = {
  id: string;
  title: string;
  region: string;
  x: number;
  y: number;
  summary: string;
  references: string[];
  people: string[];
  sceneIds: string[];
};

/** Maps published for reuse by ChurchMaps; the route map is the interactive Acts 27–28 view. */
export const bibleStudyAtlasMapEntries: BibleStudyAtlasMapEntry[] = [
  {
    id: 'paul-journeys', title: 'El viaje a Roma', period: 'Hechos · siglo I',
    summary: 'Sigue el tramo narrado en Hechos 27–28 con paradas vinculadas a personas, acontecimientos y referencias bíblicas.',
    imagePath: '/images/bible-study/paul-journey-map.webp', imageAlt: 'Mapa de los viajes de Pablo por el Mediterráneo; el tramo final del viaje a Roma se explora con paradas interactivas.',
    references: ['Hechos 27:1-12', 'Hechos 27:13-44', 'Hechos 28:1-16'], studyPrompt: '¿Qué lugares nombra el relato y qué cambia en cada escala del viaje?',
    note: 'La ruta orienta la lectura y no pretende reconstruir cada maniobra. Hechos no precisa la trayectoria exacta durante la deriva.', sourceVersion: 'Apostle Paul’s Journeys · v1.5 (2020)',
  },
  {
    id: 'palestine-new-testament', title: 'Palestina en el Nuevo Testamento', period: 'Evangelios · mundo romano',
    summary: 'Un mapa regional para ubicar Judea, Galilea y los territorios nombrados en los relatos del Nuevo Testamento.',
    imagePath: '/images/bible-study/palestine-new-testament.webp', imageAlt: 'Mapa regional de Palestina en tiempos del Nuevo Testamento, con lugares y regiones mencionados en los Evangelios.',
    references: ['Mateo 4:23-25', 'Mateo 16:13-20', 'Lucas 23:33'], studyPrompt: '¿En qué regiones y localidades transcurre cada escena que estás leyendo?',
    note: 'Es un mapa de orientación bíblica. Las fronteras y nombres corresponden a una representación didáctica de la época, no a límites políticos actuales.', sourceVersion: 'Palestine · New Testament · v1.3 (2017)',
  },
  {
    id: 'patriarchs', title: 'El mundo de los patriarcas', period: 'Génesis · relatos patriarcales',
    summary: 'Sitúa el mundo antiguo y algunas de las regiones asociadas con los relatos de Abraham, Isaac y Jacob.',
    imagePath: '/images/bible-study/ancient-world-patriarchs.webp', imageAlt: 'Mapa del mundo antiguo que sirve de referencia geográfica para los relatos patriarcales de Génesis.',
    references: ['Génesis 12:1-9', 'Génesis 13:1-18', 'Génesis 28:10-15'], studyPrompt: '¿Qué desplazamientos aparecen en el texto y qué lugares puedes ubicar en el mapa?',
    note: 'El mapa ofrece contexto geográfico general. Las identificaciones y rutas antiguas pueden tener distintos grados de certeza; el texto bíblico mantiene prioridad.', sourceVersion: 'Ancient World · Age of Patriarchs · v1.3 (2020)',
  },
  {
    id: 'exodus-canaan', title: 'Éxodo y Canaán', period: 'Éxodo · travesía y conquista',
    summary: 'Una vista general de los lugares y trayectos que aparecen en la salida de Egipto y la entrada a Canaán.',
    imagePath: '/images/bible-study/exodus-canaan.webp', imageAlt: 'Mapa de referencia sobre el Éxodo de Israel y la conquista de Canaán narrados en Éxodo y Josué.',
    references: ['Éxodo 13:17-22', 'Éxodo 14:1-4', 'Josué 1:1-9'], studyPrompt: '¿Qué etapas y topónimos menciona el pasaje? Compara el recorrido del mapa con el orden del relato.',
    note: 'El mapa resume una propuesta de recorrido; la ubicación exacta de algunos lugares y el itinerario se discuten. No lo tomes como reconstrucción definitiva.', sourceVersion: 'Exodus and the Conquest of Canaan · v1.2 (2020)',
  },
];

/** Selectable Gospel locations placed approximately over the public-domain ChurchMaps Palestine map. */
export const bibleStudyMapLocationEntries: BibleStudyMapLocationEntry[] = [
  { id: 'caesarea-philippi', title: 'Cesarea de Filipo', region: 'Norte · al pie del Hermón', x: 0.62, y: 0.215, summary: 'En este entorno, Pedro confiesa que Jesús es el Mesías. El relato sitúa allí una conversación decisiva con los discípulos.', references: ['Mateo 16:13-20', 'Marcos 8:27-30'], people: ['jesus', 'peter'], sceneIds: ['messiah-confessed'] },
  { id: 'capernaum', title: 'Capernaúm', region: 'Galilea · orilla noroeste del lago', x: 0.56, y: 0.325, summary: 'Los Evangelios relacionan Capernaúm con la enseñanza y el ministerio de Jesús en Galilea.', references: ['Mateo 4:12-17', 'Marcos 1:21-34', 'Marcos 2:1-12'], people: ['jesus', 'peter'], sceneIds: ['ministry-galilee', 'parables-and-disciples'], image: { src: '/images/bible-study/places/capernaum-ruins.jpg', alt: 'Restos de muros y viviendas excavadas en el sitio arqueológico de Capernaúm.', caption: 'Ruinas arqueológicas visibles hoy en Capernaúm; no son una reconstrucción completa del poblado del siglo I.', author: 'Brett Wagner', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ruins_of_Capernaum.jpg', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', width: 800, height: 533 }, identificationSource: { url: 'https://www.openbible.info/geo/ancient/af2161c/capernaum', candidates: [{ name: 'Tell Hum', confidence: '85 %' }, { name: 'Khirbet Minyeh', confidence: 'menos de 10 %' }] } },
  { id: 'bethsaida', title: 'Betsaida', region: 'Galilea · norte del lago', x: 0.60, y: 0.323, summary: 'El mapa la ubica junto al lago de Galilea. Los relatos la nombran en episodios del ministerio de Jesús y entre las ciudades que escucharon su enseñanza.', references: ['Marcos 6:45-52', 'Marcos 8:22-26', 'Lucas 10:13-15'], people: ['jesus', 'peter'], sceneIds: ['ministry-galilee'], image: { src: '/images/bible-study/places/bethsaida-et-tell-ruins.jpg', alt: 'Ruinas de una antigua puerta y una estela de piedra en el sitio de Et-Tell.', caption: 'Et-Tell, uno de los sitios propuestos para Betsaida; su identificación como la ciudad de los Evangelios sigue en debate.', author: 'Chmee2', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ruins_of_Bethsaida_village_in_summer_2011_(7).JPG', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/', width: 1200, height: 800 }, identificationSource: { url: 'https://www.openbible.info/geo/ancient/a91b732/bethsaida-1', candidates: [{ name: 'At Tell', confidence: '50 %' }, { name: 'Al Araj', confidence: '20 %' }, { name: 'El Mess’adiyye', confidence: 'menos de 10 %' }, { name: 'Tabgha', confidence: 'menos de 10 %' }] } },
  { id: 'cana', title: 'Caná', region: 'Galilea · al norte de Nazaret', x: 0.48, y: 0.366, summary: 'Juan sitúa en Caná la primera señal de Jesús en una boda. El Evangelio dice que allí manifestó su gloria y sus discípulos creyeron en él.', references: ['Juan 2:1-11'], people: ['jesus', 'mary-mother-jesus'], sceneIds: ['first-sign-cana'], image: { src: '/images/bible-study/places/cana-kafr-kanna-1903.jpg', alt: 'Fotografía panorámica en blanco y negro, con el rótulo histórico «Cana? (Kefr Kenna)».', caption: 'Kafr Kanna en una publicación de 1903; el rótulo refleja una identificación histórica propuesta, no una certeza sobre la Caná bíblica.', author: 'W. Sanday y Paul Waterhouse', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kafr_Kanna_1903.jpg', license: 'Dominio público', width: 668, height: 435 }, identificationSource: { url: 'https://www.openbible.info/geo/ancient/a031bda/cana', candidates: [{ name: 'Horbat Qana', confidence: '70 %' }, { name: 'Kefr Kenna', confidence: 'menos de 10 %' }, { name: 'Ain Qana', confidence: 'menos de 10 %' }] } },
  { id: 'nazareth', title: 'Nazaret', region: 'Galilea · hogar de Jesús', x: 0.465, y: 0.383, summary: 'En la sinagoga de Nazaret, Jesús lee al profeta Isaías y explica la misión que comienza a desarrollar.', references: ['Lucas 4:14-30', 'Mateo 2:19-23'], people: ['jesus', 'mary-mother-jesus'], sceneIds: ['kingdom-announced'], image: { src: '/images/bible-study/places/nazareth-north-view.jpg', alt: 'Vista panorámica de la ciudad actual de Nazaret desde el norte.', caption: 'Nazaret contemporánea vista desde el norte; fotografía del paisaje urbano moderno, no de la aldea antigua.', author: 'Juandev', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nazareth,_view_from_north.JPG', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', width: 1200, height: 458 }, identificationSource: { url: 'https://www.openbible.info/geo/ancient/af5884f/nazareth', candidates: [{ name: 'Nazaret', confidence: 'confianza muy alta' }] } },
  { id: 'caesarea-maritima', title: 'Cesarea Marítima', region: 'Judea · costa mediterránea', x: 0.305, y: 0.442, summary: 'Puerto y centro administrativo romano en la costa. Hechos la relaciona con el encuentro de Pedro y Cornelio.', references: ['Hechos 10:1-8', 'Hechos 10:24-48'], people: ['peter'], sceneIds: [] },
  { id: 'jericho', title: 'Jericó', region: 'Valle del Jordán · camino a Jerusalén', x: 0.53, y: 0.637, summary: 'Lucas cuenta que Jesús atravesó Jericó y se encontró con Zaqueo antes de continuar hacia Jerusalén.', references: ['Lucas 18:35-43', 'Lucas 19:1-10'], people: ['jesus', 'zacchaeus'], sceneIds: ['zacchaeus-jericho'] },
  { id: 'jerusalem', title: 'Jerusalén', region: 'Judea · centro de los últimos relatos', x: 0.44, y: 0.67, summary: 'Los Evangelios narran aquí la entrada de Jesús, sus últimos días, la crucifixión y la resurrección. Hechos inicia en Jerusalén el testimonio de sus discípulos.', references: ['Lucas 19:28-48', 'Lucas 22:14-23', 'Lucas 23:26-49', 'Lucas 24:1-12', 'Hechos 2:1-21'], people: ['jesus', 'peter', 'mary-magdalene'], sceneIds: ['jerusalem-entry', 'last-supper', 'cross', 'resurrection', 'pentecost'], image: { src: '/images/bible-study/places/jerusalem-old-city.jpg', alt: 'Vista panorámica del casco antiguo de Jerusalén y sus edificios de piedra.', caption: 'Vista moderna de la Ciudad Vieja de Jerusalén; sirve como orientación visual y no como reconstrucción histórica.', author: 'Jfragments', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jerusalem_Old_City.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', width: 1200, height: 920 }, identificationSource: { url: 'https://www.openbible.info/geo/ancient/a15257a/jerusalem', candidates: [{ name: 'Jerusalén', confidence: 'confianza muy alta' }] } },
  { id: 'bethany', title: 'Betania', region: 'Judea · cerca de Jerusalén', x: 0.465, y: 0.672, summary: 'Juan relata que Jesús visitó a Marta, María y Lázaro en Betania. Allí, frente al duelo de la familia, narra la resurrección de Lázaro. Lucas también sitúa en sus inmediaciones la escena final antes de la ascensión.', references: ['Juan 11:1-44', 'Juan 12:1-8', 'Lucas 24:50-53', 'Hechos 1:12'], people: ['jesus', 'lazarus', 'martha', 'mary-bethany'], sceneIds: ['bethany-lazarus', 'commission-and-promise'] },
  { id: 'bethlehem', title: 'Belén', region: 'Judea · lugar del nacimiento', x: 0.423, y: 0.696, summary: 'Mateo y Lucas sitúan en Belén el nacimiento de Jesús y relacionan el lugar con la historia de David.', references: ['Mateo 2:1-6', 'Lucas 2:1-20'], people: ['jesus', 'mary-mother-jesus'], sceneIds: ['jesus-birth'] },
];

/** Orientation pins for Genesis locations on the ChurchMaps patriarchs map; positions are illustrative. */
export const bibleStudyPatriarchLocationEntries: BibleStudyPatriarchLocationEntry[] = [
  { id: 'ur', title: 'Ur de los caldeos', region: 'Mesopotamia · sur', x: 0.735, y: 0.742, summary: 'Génesis incluye Ur de los caldeos en el itinerario familiar de Abram. El pin orienta sobre la región representada en el mapa; no fija coordenadas arqueológicas.', references: ['Génesis 11:28-31', 'Génesis 15:7'], people: ['abraham'], sceneIds: ['abraham-departs'] },
  { id: 'haran', title: 'Harán', region: 'Alta Mesopotamia · norte', x: 0.485, y: 0.374, summary: 'La familia de Abram se detiene en Harán. Desde allí Abram continúa hacia Canaán, según Génesis; Hechos 7 recuerda el llamado desde una etapa anterior del relato.', references: ['Génesis 11:31-12:5', 'Hechos 7:2-4'], people: ['abraham'], sceneIds: ['abraham-departs'] },
  { id: 'shechem', title: 'Siquem', region: 'Canaán central', x: 0.311, y: 0.658, summary: 'Al llegar a Siquem, Abram recibe una promesa sobre la tierra y levanta un altar. El pasaje nombra la encina de More, sin precisar coordenadas modernas.', references: ['Génesis 12:6-7'], people: ['abraham'], sceneIds: ['abraham-departs'] },
  { id: 'bethel', title: 'Betel', region: 'Canaán central · cerca de Hai', x: 0.322, y: 0.68, summary: 'Abram acampa entre Betel y Hai. Más adelante Jacob vuelve a Betel y allí responde a lo que vivió durante el viaje hacia Harán.', references: ['Génesis 12:8', 'Génesis 13:3-4', 'Génesis 28:10-22'], people: ['abraham', 'jacob'], sceneIds: ['abraham-departs', 'jacob-bethel'] },
  { id: 'hebron', title: 'Hebrón y Mamre', region: 'Canaán meridional', x: 0.282, y: 0.704, summary: 'Génesis sitúa a Abram junto a los encinares de Mamre, cerca de Hebrón. Los relatos familiares vuelven a nombrar Hebrón en generaciones posteriores.', references: ['Génesis 13:18', 'Génesis 18:16-33', 'Génesis 23:1-20', 'Génesis 35:27-29', 'Génesis 50:12-14'], people: ['abraham', 'isaac', 'jacob'], sceneIds: ['abraham-intercedes', 'jacob-and-joseph-final-days'] },
  { id: 'beersheba', title: 'Beerseba', region: 'Néguev · sur de Canaán', x: 0.292, y: 0.724, summary: 'Génesis relaciona Beerseba con la historia de Abraham y con Isaac, quien se establece allí y hace un acuerdo de paz con Abimélec.', references: ['Génesis 21:31-34', 'Génesis 26:23-33'], people: ['abraham', 'isaac'], sceneIds: ['isaac-beersheba'] },
  { id: 'peniel', title: 'Peniel / Penuel', region: 'Transjordania · junto al Jaboc', x: 0.389, y: 0.646, summary: 'Jacob nombra Peniel el lugar donde dice haber visto a Dios y haber sobrevivido. La escena ocurre antes de su encuentro con Esaú.', references: ['Génesis 32:22-32'], people: ['jacob'], sceneIds: ['jacob-israel'] },
  { id: 'egypt', title: 'Egipto', region: 'Noreste de África', x: 0.166, y: 0.858, summary: 'José es llevado a Egipto y, años después, su familia desciende allí durante la hambruna. El mapa ofrece un marco regional, no un recorrido detallado.', references: ['Génesis 37:25-36', 'Génesis 39:20-41:57', 'Génesis 46:1-7', 'Génesis 50:22-26'], people: ['joseph', 'jacob'], sceneIds: ['joseph-sold', 'joseph-prison-to-palace', 'joseph-reconciles', 'jacob-and-joseph-final-days'] },
  { id: 'goshen', title: 'Gosén', region: 'Delta oriental del Nilo · según Génesis', x: 0.239, y: 0.755, summary: 'Génesis cuenta que la familia de Jacob se establece en Gosén. El pasaje la relaciona con los pastos y la vida de la familia en Egipto.', references: ['Génesis 45:9-10', 'Génesis 46:28-34', 'Génesis 47:1-6', 'Génesis 47:27-31'], people: ['joseph', 'jacob'], sceneIds: ['joseph-reconciles', 'jacob-and-joseph-final-days'] },
];

/** Spanish summaries adapted from the CC BY-SA 4.0 Tyndale Open Bible Dictionary. */
const actsPlaceEntries: BibleStudyPlaceEntry[] = [
  {
    id: 'caesarea', placeId: 'caesarea', title: 'Cesarea Marítima', region: 'Judea · costa mediterránea',
    summary: 'Puerto principal de Judea en tiempos del Nuevo Testamento. Herodes el Grande desarrolló allí un puerto protegido y la ciudad llegó a ser un centro administrativo romano.',
    context: 'Pablo permaneció preso en Cesarea antes de apelar a Roma. Desde esta ciudad comenzó el viaje que narra Hechos 27.',
    references: ['Hechos 24:27-25:1', 'Hechos 27:1-2'], dictionaryEntry: 'Caesarea',
  },
  {
    id: 'sidon', placeId: 'sidon', title: 'Sidón', region: 'Fenicia · costa del Levante',
    summary: 'Antigua ciudad portuaria fenicia al norte de Tiro, vinculada al comercio marítimo del Mediterráneo oriental.',
    context: 'Durante la primera escala del viaje, el centurión Julio permitió a Pablo visitar a sus amigos y recibir atención en Sidón.',
    references: ['Hechos 27:3'], dictionaryEntry: 'Sidon (Place), Sidonian',
  },
  {
    id: 'myra', placeId: 'myra', title: 'Mira', region: 'Licia · costa de Asia Menor',
    summary: 'Ciudad portuaria de Licia, en la costa sur de Asia Menor; hoy se identifica con el área de Demre, en Turquía.',
    context: 'En Mira, Pablo y quienes lo acompañaban cambiaron a una nave alejandrina que viajaba hacia Italia.',
    references: ['Hechos 27:5-6'], dictionaryEntry: 'Myra',
  },
  {
    id: 'cnidus', placeId: 'cnidus', title: 'Cnido', region: 'Caria · suroeste de Asia Menor',
    summary: 'Puerto situado en el extremo suroeste de Asia Menor, junto a una península que se adentra en el Egeo.',
    context: 'Los vientos contrarios impidieron que la nave mantuviera el rumbo previsto; desde allí continuó con dificultad hacia Creta.',
    references: ['Hechos 27:7'], dictionaryEntry: 'Cnidus',
  },
  {
    id: 'fair-havens', placeId: 'fair-havens', title: 'Buenos Puertos', region: 'Creta · costa sur',
    summary: 'Ensenada de Creta donde la nave encontró refugio temporal. El relato la sitúa cerca de Lasea y la describe como un puerto poco adecuado para pasar el invierno.',
    context: 'La tripulación debatió si permanecer allí o intentar llegar a Fenice. Hechos registra la decisión y el aviso de Pablo antes de que el viaje continuara.',
    references: ['Hechos 27:8-12'], dictionaryEntry: 'Crete',
  },
  {
    id: 'malta', placeId: 'malta', title: 'Malta', region: 'Mediterráneo central · al sur de Sicilia',
    summary: 'Isla mediterránea al sur de Sicilia. Hechos la identifica como Melita en algunas traducciones y relata que allí alcanzaron tierra quienes viajaban con Pablo.',
    context: 'Tras el naufragio, los habitantes recibieron al grupo. Pablo ayudó a los enfermos mientras permanecieron en la isla durante el invierno.',
    references: ['Hechos 27:39-44', 'Hechos 28:1-10'], dictionaryEntry: 'Malta',
  },
  {
    id: 'syracuse', placeId: 'syracuse', title: 'Siracusa', region: 'Sicilia · costa oriental',
    summary: 'Puerto destacado de la costa oriental de Sicilia, con un abrigo natural para las embarcaciones.',
    context: 'Después de dejar Malta, la nave hizo una escala de tres días en Siracusa antes de seguir hacia Italia.',
    references: ['Hechos 28:11-12'], dictionaryEntry: 'Syracuse',
  },
  {
    id: 'rhegium', placeId: 'rhegium', title: 'Regio', region: 'Italia · estrecho de Mesina',
    summary: 'Puerto de la costa italiana frente a Sicilia, junto al estrecho de Mesina.',
    context: 'Hechos cuenta que el barco llegó a Regio y, al día siguiente, aprovechó un viento favorable para continuar hacia Puteoli.',
    references: ['Hechos 28:13'], dictionaryEntry: 'Rhegium',
  },
  {
    id: 'puteoli', placeId: 'puteoli', title: 'Puteoli', region: 'Campania · bahía de Nápoles',
    summary: 'Puerto italiano usado por viajeros y cargamentos que se dirigían a Roma. La ciudad actual se conoce como Pozzuoli.',
    context: 'Pablo encontró allí a otros creyentes y permaneció con ellos siete días antes de continuar hacia Roma.',
    references: ['Hechos 28:13-14'], dictionaryEntry: 'Puteoli',
  },
  {
    id: 'rome', placeId: 'rome', title: 'Roma', region: 'Italia · destino del viaje',
    summary: 'Capital del Imperio romano y destino al que Pablo había apelado. Hechos presenta la llegada como el cierre de este trayecto marítimo y terrestre.',
    context: 'Los creyentes de Roma salieron al encuentro de Pablo por el camino. Allí se le permitió permanecer bajo custodia y recibir visitas.',
    references: ['Hechos 28:14-16', 'Hechos 28:30-31'], dictionaryEntry: 'Rome, City of',
  },
];

/** Personas mencionadas explícitamente en Hechos 27–28; las relaciones siguen el relato bíblico. */
export const bibleStudyPeopleEntries: BibleStudyPersonEntry[] = [
  {
    id: 'creator', title: 'Dios, Creador', region: 'Génesis · los comienzos',
    summary: 'El relato presenta a Dios como quien crea, ordena, bendice y da propósito a la vida.',
    context: 'Génesis 1 destaca la palabra de Dios y la bondad de lo creado. Génesis 2 enfoca su acción al formar al ser humano, plantar el jardín y establecer relaciones. Esta ficha sigue lo que afirman esos pasajes sin resolver aquí las distintas interpretaciones sobre la relación literaria entre ambos relatos.',
    references: ['Génesis 1:1-31', 'Génesis 2:4-25'],
  },
  {
    id: 'humanity', title: 'La humanidad: varón y mujer', region: 'Creación · imagen de Dios',
    summary: 'Génesis 1 presenta a la humanidad creada a imagen de Dios, como varón y mujer, y le confía una responsabilidad dentro de la creación.',
    context: 'El pasaje los bendice y les encarga fructificar, llenar la tierra y ejercer dominio sobre los seres vivos. La ficha conserva el lenguaje de Génesis 1, que todavía no los nombra como Adán y Eva.',
    references: ['Génesis 1:26-28'],
  },
  {
    id: 'human', title: 'El ser humano', region: 'Edén · cultivador y cuidador',
    summary: 'Dios forma al ser humano del polvo, le da aliento de vida y lo coloca en el jardín para trabajarlo y cuidarlo.',
    context: 'En Génesis 2:19-20 el ser humano nombra a los animales. El capítulo lo describe principalmente con términos que significan hombre/ser humano; el texto no presenta aquí «Adán» como un nombre propio inequívoco. Génesis 3:20 identifica a Eva por nombre.',
    references: ['Génesis 2:7-8', 'Génesis 2:15-20'],
  },
  {
    id: 'woman-genesis', title: 'La mujer', region: 'Edén · compañera correspondiente',
    summary: 'En el relato, Dios forma a la mujer y el hombre la reconoce como parte de su propia humanidad.',
    context: 'Génesis 2:23 registra las palabras del hombre y 2:24 formula la unión de marido y mujer. El nombre Eva aparece más adelante, en Génesis 3:20; por eso esta entrada usa «la mujer» al seguir el capítulo 2.',
    references: ['Génesis 2:21-25'],
  },
  {
    id: 'paul', placeId: 'malta', title: 'Pablo', region: 'Apóstol · viajero bajo custodia',
    summary: 'Prisionero que apela al César y es trasladado por mar hacia Roma. Durante la tormenta anima a quienes viajan con él y comparte el mensaje que recibe.',
    context: 'En Malta sirve a los enfermos y, al llegar a Roma, recibe permiso para vivir bajo custodia y atender a quienes lo visitan. El relato destaca su confianza en Dios y su servicio en medio de circunstancias difíciles.',
    references: ['Hechos 27:1-2', 'Hechos 27:21-25', 'Hechos 28:7-10', 'Hechos 28:30-31'],
  },
  {
    id: 'julius', placeId: 'caesarea', title: 'Julio', region: 'Centurión · cohorte Augusta',
    summary: 'Oficial romano encargado de conducir a Pablo y a otros prisioneros hacia Italia.',
    context: 'En Sidón trata a Pablo con consideración y le permite visitar a sus amigos. Más adelante escucha las advertencias de Pablo, aunque la nave continúa el viaje. Hechos presenta decisiones concretas de Julio sin describir una conversión.',
    references: ['Hechos 27:1-3', 'Hechos 27:9-12', 'Hechos 27:42-44'],
  },
  {
    id: 'aristarchus', placeId: 'caesarea', title: 'Aristarco', region: 'Compañero de viaje · macedonio de Tesalónica',
    summary: 'Acompaña a Pablo en el viaje a Roma junto con el narrador, identificado en el texto como parte del grupo que embarcó.',
    context: 'Su presencia enlaza esta travesía con otros episodios del ministerio de Pablo. En este pasaje, Hechos solo señala que viajó con ellos; no atribuye a Aristarco acciones adicionales durante la tormenta.',
    references: ['Hechos 27:1-2'],
  },
  {
    id: 'publius', placeId: 'malta', title: 'Publio', region: 'Principal de Malta',
    summary: 'Recibe al grupo durante tres días y hospeda a quienes llegan a la isla después del naufragio.',
    context: 'Pablo ora por el padre de Publio y lo sana; después llegan otros enfermos de la isla. El relato registra la hospitalidad de Publio y el servicio de Pablo, sin convertir la escena en una afirmación sobre el estado espiritual de Publio.',
    references: ['Hechos 28:1-10'],
  },
  {
    id: 'abraham', mapId: 'patriarchs', title: 'Abraham', region: 'Patriarca · llamado y pacto',
    summary: 'Abram deja su tierra y viaja a Canaán. Génesis presenta las promesas de Dios de acompañarlo y bendecir a familias por medio de su descendencia.',
    context: 'Su historia incluye salidas, conflictos familiares, dudas y renovación de la promesa. Génesis interpreta el cambio de nombre como señal de la alianza; Hechos recuerda el llamado desde Mesopotamia. Leídos juntos, los textos conservan sus distintos momentos y énfasis.',
    references: ['Génesis 12:1-9', 'Génesis 15:1-6', 'Génesis 17:1-8', 'Hechos 7:2-4'], dictionaryEntry: 'Abraham',
  },
  {
    id: 'isaac', mapId: 'patriarchs', title: 'Isaac', region: 'Patriarca · hijo de Abraham y Sara',
    summary: 'Hijo de Abraham y Sara, Isaac forma parte de la generación en que la promesa familiar continúa en Canaán.',
    context: 'Génesis cuenta su nacimiento, su vida junto a Rebeca y la confirmación de la promesa en Beerseba. El relato lo presenta como padre de Jacob y Esaú; su historia se lee dentro de una familia marcada por tensiones y decisiones humanas.',
    references: ['Génesis 21:1-7', 'Génesis 24:1-67', 'Génesis 25:19-26', 'Génesis 26:23-25'], dictionaryEntry: 'Isaac',
  },
  {
    id: 'rebecca', mapId: 'patriarchs', title: 'Rebeca', region: 'Matriarca · esposa de Isaac',
    summary: 'Génesis narra cómo Rebeca acepta dejar su familia para viajar y casarse con Isaac. Más adelante la presenta como madre de Esaú y Jacob.',
    context: 'La historia destaca su decisión y la hospitalidad de su familia en Génesis 24; después relata decisiones que afectan la relación entre sus hijos. La ficha se limita a los pasajes citados y no añade detalles posteriores.',
    references: ['Génesis 24:1-67', 'Génesis 25:19-28', 'Génesis 27:1-17'],
  },
  {
    id: 'jacob', mapId: 'patriarchs', title: 'Jacob / Israel', region: 'Patriarca · hijo de Isaac y Rebeca',
    summary: 'Jacob es hijo de Isaac y Rebeca; después de una vida de conflictos y viajes, recibe el nombre Israel en el relato de Génesis.',
    context: 'Génesis vincula su historia con Betel, donde sueña con una escalera, y con Peniel, donde lucha durante la noche. El texto explica el nombre Israel dentro de ese encuentro; sus hijos pasan a ser antepasados de las tribus de Israel.',
    references: ['Génesis 28:10-22', 'Génesis 32:22-32', 'Génesis 35:9-15'], dictionaryEntry: 'Jacob',
  },
  {
    id: 'joseph', mapId: 'patriarchs', title: 'José', region: 'Hijo de Jacob · historia en Egipto',
    summary: 'José, hijo de Jacob y Raquel, es vendido por sus hermanos y llevado a Egipto. Allí interpreta sueños y llega a administrar alimentos durante una hambruna.',
    context: 'Génesis narra tanto el daño que sufre como las decisiones posteriores de José y la reconciliación con su familia. El cierre del libro conecta su historia con el asentamiento de los descendientes de Jacob en Egipto.',
    references: ['Génesis 37:1-36', 'Génesis 41:37-49', 'Génesis 45:1-15', 'Génesis 50:15-21'], dictionaryEntry: 'Joseph',
  },
  {
    id: 'jesus', mapId: 'palestine-new-testament', title: 'Jesús', region: 'Mesías · centro de los Evangelios',
    summary: 'Los Evangelios narran la vida de Jesús: su anuncio del Reino, su compasión, su muerte y la proclamación de su resurrección.',
    context: 'Las cuatro fichas de Fe Cuadrangular confiesan a Jesús como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto. Esta síntesis recorre los relatos evangélicos y conecta cada énfasis con pasajes para leer en su contexto.',
    references: ['Marcos 1:14-15', 'Lucas 4:14-21', 'Marcos 10:45', 'Lucas 24:1-12', 'Hechos 1:1-11'],
  },
  {
    id: 'mary-mother-jesus', mapId: 'palestine-new-testament', title: 'María', region: 'Madre de Jesús · Galilea y Judea',
    summary: 'María recibe el anuncio del nacimiento de Jesús, lo acompaña en episodios de su vida y aparece junto a la cruz en el Evangelio de Juan.',
    context: 'Los pasajes permiten seguir escenas concretas de María sin completar con tradición posterior los detalles que el texto no menciona.',
    references: ['Lucas 1:26-38', 'Lucas 2:1-20', 'Juan 2:1-11', 'Juan 19:25-27'],
  },
  {
    id: 'john-baptist', mapId: 'palestine-new-testament', title: 'Juan el Bautista', region: 'Profeta · prepara el camino',
    summary: 'Juan llama al arrepentimiento, bautiza en el Jordán y señala a Jesús en el inicio de los Evangelios.',
    context: 'Los relatos distinguen el bautismo de Juan en agua del anuncio de que Jesús bautizará con el Espíritu Santo. Esa diferencia conecta la historia con el énfasis Cuadrangular sin confundir sus funciones.',
    references: ['Marcos 1:1-11', 'Juan 1:19-34', 'Hechos 1:4-8'],
  },
  {
    id: 'peter', mapId: 'palestine-new-testament', title: 'Pedro', region: 'Discípulo · testigo de Jesús',
    summary: 'Pedro sigue a Jesús, confiesa que es el Mesías, lo niega durante su arresto y después vuelve a recibir una tarea entre sus discípulos.',
    context: 'Los Evangelios presentan sus aciertos y fallas dentro del discipulado. Hechos añade su encuentro con Cornelio en Cesarea. La ficha se limita a episodios narrados y enlaza sus referencias para leerlas completas.',
    references: ['Mateo 4:18-20', 'Mateo 16:13-20', 'Lucas 22:54-62', 'Juan 21:15-19', 'Hechos 10:9-48'],
  },
  {
    id: 'mary-magdalene', mapId: 'palestine-new-testament', title: 'María Magdalena', region: 'Discípula · testigo de la resurrección',
    summary: 'María Magdalena acompaña el ministerio de Jesús y los Evangelios la sitúan entre quienes presencian la crucifixión y anuncian la tumba vacía.',
    context: 'Juan relata que encuentra a Jesús resucitado y lleva la noticia a los discípulos. No la identificamos con otras mujeres llamadas María en los Evangelios.',
    references: ['Lucas 8:1-3', 'Marcos 15:40-47', 'Juan 20:1-18'],
  },
  {
    id: 'lazarus', mapId: 'palestine-new-testament', title: 'Lázaro', region: 'Hermano de Marta y María · Betania',
    summary: 'Juan narra que Jesús llegó a Betania después de la muerte de Lázaro y lo llamó fuera de la tumba.',
    context: 'El episodio se cuenta en Juan 11, antes de la última entrada de Jesús en Jerusalén. Esta ficha sigue ese pasaje y no agrega detalles de relatos posteriores.',
    references: ['Juan 11:1-44', 'Juan 12:1-11'],
  },
  {
    id: 'martha', mapId: 'palestine-new-testament', title: 'Marta', region: 'Discípula · familia de Betania',
    summary: 'Marta recibe a Jesús en Betania y conversa con él durante la enfermedad y muerte de su hermano Lázaro.',
    context: 'Juan recoge la confesión de Marta y la conversación sobre la resurrección. Lucas también la presenta en una escena de hospitalidad. Leemos cada episodio en su propio contexto.',
    references: ['Lucas 10:38-42', 'Juan 11:17-27', 'Juan 12:1-3'],
  },
  {
    id: 'mary-bethany', mapId: 'palestine-new-testament', title: 'María de Betania', region: 'Discípula · familia de Betania',
    summary: 'María, hermana de Marta y Lázaro, aparece en escenas de hospitalidad y en el relato de la visita de Jesús a Betania.',
    context: 'No se la identifica con María Magdalena ni con María, madre de Jesús. Los Evangelios ofrecen episodios distintos y los presentamos con sus propios nombres y referencias.',
    references: ['Lucas 10:38-42', 'Juan 11:1-32', 'Juan 12:1-8'],
  },
  {
    id: 'zacchaeus', mapId: 'palestine-new-testament', title: 'Zaqueo', region: 'Habitante de Jericó · jefe de publicanos',
    summary: 'Lucas presenta a Zaqueo como jefe de publicanos en Jericó. Se sube a un árbol para ver a Jesús y después lo recibe en su casa.',
    context: 'El pasaje describe su respuesta y la declaración de Jesús sobre la salvación que llega a esa casa. No se añaden datos de su vida fuera del relato.',
    references: ['Lucas 19:1-10'],
  },
  {
    id: 'moses', title: 'Moisés', region: 'Líder de Israel · Éxodo y desierto',
    summary: 'Éxodo presenta a Moisés como el líder llamado para sacar a Israel de Egipto y guiar al pueblo por el desierto.',
    context: 'El relato muestra sus temores, su intercesión y su liderazgo, además de episodios en que desobedece. La ficha no lo idealiza: reúne escenas para leer su papel dentro de la historia bíblica.',
    references: ['Éxodo 2:1-10', 'Éxodo 3:1-15', 'Éxodo 14:10-31', 'Éxodo 19:1-8', 'Números 20:1-13', 'Deuteronomio 34:1-12'],
  },
  {
    id: 'aaron', title: 'Aarón', region: 'Hermano de Moisés · sacerdote de Israel',
    summary: 'Aarón acompaña a Moisés ante Faraón y sirve como portavoz en las primeras conversaciones. Más adelante, su familia recibe responsabilidades sacerdotales.',
    context: 'Éxodo también lo incluye en la escena del becerro de oro. Leer ambos pasajes permite observar sus responsabilidades y fallas tal como aparecen en la narración, sin reducir su historia a una sola escena.',
    references: ['Éxodo 4:10-16', 'Éxodo 4:27-31', 'Éxodo 28:1-4', 'Éxodo 32:1-6'],
  },
  {
    id: 'miriam', title: 'Miriam', region: 'Profetisa · hermana de Moisés y Aarón',
    summary: 'Miriam aparece primero en la historia de la infancia de Moisés; después guía a las mujeres en el canto tras el paso del mar.',
    context: 'Números relata también un conflicto entre Miriam, Aarón y Moisés, así como sus consecuencias. La secuencia deja ver distintos momentos de su vida sin completar los silencios del texto.',
    references: ['Éxodo 2:1-8', 'Éxodo 15:20-21', 'Números 12:1-15', 'Números 20:1'],
  },
  {
    id: 'joshua', title: 'Josué', region: 'Servidor de Moisés · sucesor en Canaán',
    summary: 'Josué aparece como ayudante de Moisés, participa en la exploración de Canaán y recibe la tarea de guiar al pueblo en una nueva etapa.',
    context: 'El libro que lleva su nombre cuenta la entrada a Canaán y concluye con una renovación del compromiso del pueblo en Siquem. La ficha enlaza esos episodios sin convertir el orden narrativo en fechas absolutas.',
    references: ['Éxodo 17:8-16', 'Números 13:1-16', 'Números 14:6-9', 'Deuteronomio 31:1-8', 'Josué 1:1-9', 'Josué 24:1-28'],
  },
  {
    id: 'caleb', title: 'Caleb', region: 'Explorador · compañero de Josué',
    summary: 'Caleb es uno de los exploradores enviados a Canaán. Junto con Josué presenta una respuesta distinta al temor del pueblo.',
    context: 'Números destaca su fidelidad en aquella crisis, y Josué relata la herencia que recibe más adelante. No se añaden hazañas fuera de los episodios citados.',
    references: ['Números 13:1-33', 'Números 14:6-24', 'Josué 14:6-14'],
  },
  {
    id: 'pharaoh-exodus', title: 'Faraón del Éxodo', region: 'Gobernante de Egipto · identidad no indicada',
    summary: 'El libro del Éxodo habla del faraón que somete a Israel y se resiste a dejar salir al pueblo, pero no proporciona su nombre personal.',
    context: 'Esta ficha conserva el anonimato del relato. No identifica a este gobernante con un faraón histórico concreto; esa propuesta requeriría evidencia independiente.',
    references: ['Éxodo 1:8-22', 'Éxodo 5:1-2', 'Éxodo 7:1-13', 'Éxodo 12:29-42', 'Éxodo 14:5-31'],
  },
];

/** Hitos basados en la secuencia narrativa de Hechos; no se asignan fechas de calendario que el texto no da. */
export const bibleStudyEventEntries: BibleStudyEventEntry[] = [
  {
    id: 'creation-order', placeId: 'creation', placeIds: ['creation'], title: 'Dios ordena y llena la creación', region: 'Secuencia del relato', date: 'Orden narrativo · sin fecha de calendario', places: 'Cielos, aguas y tierra',
    summary: 'La narración organiza la creación en seis días, distingue ámbitos y los llena de vida; culmina con la humanidad a imagen de Dios.',
    context: 'Génesis 2:1-3 presenta el séptimo día como cierre de la semana narrativa. Esta secuencia describe la forma del relato y no asigna fechas históricas verificables.',
    references: ['Génesis 1:1-2:3'], people: ['creator', 'humanity'], studyPrompt: '¿Qué patrones se repiten y cómo cambia la escena cuando aparece la humanidad?',
  },
  {
    id: 'human-formed', placeId: 'eden', placeIds: ['eden'], title: 'El ser humano recibe vida', region: 'Secuencia del relato', date: 'Génesis 2:4-7 · sin fecha de calendario', places: 'Edén · la tierra',
    summary: 'Dios forma al ser humano del polvo de la tierra y le da aliento de vida.',
    context: 'El texto introduce una escena enfocada en la tierra, la labor y la vida humana. Su orden narrativo no establece por sí solo una fecha de calendario ni resuelve la relación cronológica con Génesis 1.',
    references: ['Génesis 2:4-7'], people: ['creator', 'human'], studyPrompt: '¿Qué relación establece el pasaje entre la tierra, el aliento y la vida?',
  },
  {
    id: 'garden-commission', placeId: 'garden', placeIds: ['eden', 'garden', 'four-rivers'], title: 'El jardín y la tarea confiada', region: 'Secuencia del relato', date: 'Génesis 2:8-17 · sin fecha de calendario', places: 'Edén · el jardín · los cuatro ríos',
    summary: 'Dios planta un jardín, coloca allí al ser humano y le encarga trabajarlo y cuidarlo; también le comunica un mandato.',
    context: 'El pasaje nombra Pisón, Gihón, Tigris y Éufrates, pero no proporciona coordenadas para ubicar el jardín. La identificación de los dos primeros ríos y de las regiones de Havila y Cus es debatida.',
    references: ['Génesis 2:8-17'], people: ['creator', 'human'], studyPrompt: '¿Qué responsabilidades y límites aparecen en la tarea que recibe el ser humano?',
  },
  {
    id: 'animals-named', placeId: 'garden', placeIds: ['garden'], title: 'Los animales reciben nombre', region: 'Secuencia del relato', date: 'Génesis 2:18-20 · sin fecha de calendario', places: 'El jardín',
    summary: 'Dios trae los animales al ser humano, que les da nombre; el relato señala que no encuentra entre ellos una compañía correspondiente.',
    context: 'La escena pertenece a Génesis 2:18-20 y cumple una función distinta de la creación de los animales en Génesis 1:20-25. Las ilustraciones del proyecto son interpretaciones artísticas, no reconstrucciones históricas.',
    references: ['Génesis 2:18-20'], people: ['creator', 'human'], studyPrompt: '¿Qué muestra esta escena sobre observar, nombrar y buscar una relación correspondiente?',
  },
  {
    id: 'woman-and-union', placeId: 'garden', placeIds: ['garden'], title: 'La mujer y la unión humana', region: 'Secuencia del relato', date: 'Génesis 2:21-25 · sin fecha de calendario', places: 'El jardín',
    summary: 'Dios forma a la mujer; el hombre la reconoce como «hueso de mis huesos» y el pasaje concluye con una reflexión sobre la unión.',
    context: 'El capítulo la llama mujer; el nombre Eva se introduce en Génesis 3:20. La ficha no fija una fecha histórica para la escena ni convierte el poema en una cronología de calendario.',
    references: ['Génesis 2:21-25'], people: ['creator', 'human', 'woman-genesis'], studyPrompt: '¿Qué lenguaje usa el pasaje para expresar parentesco, reconocimiento y unión?',
  },
  {
    id: 'departure', placeId: 'caesarea', placeIds: ['caesarea', 'sidon', 'myra'], title: 'De Cesarea hacia Asia Menor', region: 'Primera etapa', date: 'Primera etapa', places: 'Cesarea · Sidón · Mira',
    summary: 'Pablo embarca bajo custodia, la nave se detiene en Sidón y el grupo cambia de embarcación en Mira.',
    context: 'El relato presenta el viaje como un traslado hacia Italia. Julio trata a Pablo con consideración en Sidón, y Aristarco aparece entre quienes acompañan al grupo.',
    references: ['Hechos 27:1-6'], people: ['paul', 'julius', 'aristarchus'], studyPrompt: '¿Qué detalles del primer tramo ayudan a seguir quién acompaña a Pablo y cómo es tratado?',
  },
  {
    id: 'crete-decision', placeId: 'fair-havens', placeIds: ['cnidus', 'fair-havens'], title: 'La escala en Creta', region: 'Vientos contrarios', date: 'Vientos contrarios', places: 'Cnido · Buenos Puertos',
    summary: 'La navegación se dificulta en Cnido. En Buenos Puertos, la tripulación debate si continuar o pasar allí el invierno.',
    context: 'Hechos registra el consejo de Pablo y la decisión de seguir hasta Fenice. El texto presenta la decisión y el cambio de tiempo como parte del desarrollo del viaje.',
    references: ['Hechos 27:7-13'], people: ['paul', 'julius'], studyPrompt: '¿Qué tensión aparece entre la recomendación de Pablo y la decisión de continuar?',
  },
  {
    id: 'storm', placeId: 'fair-havens', placeIds: ['fair-havens'], title: 'A la deriva', region: 'Catorce días', date: 'Catorce días', places: 'Salida desde Buenos Puertos · deriva no definida', atlasAction: 'Ver referencia de salida en el atlas',
    summary: 'Una tormenta empuja la nave durante días. Pablo anima a todos y comunica que las personas sobrevivirán, aunque la nave se perderá.',
    context: 'Hechos describe las acciones a bordo y la duración de la tormenta, pero no fija la trayectoria exacta de la deriva. Por eso el atlas señala este tramo como aproximado.',
    references: ['Hechos 27:14-38'], people: ['paul', 'julius'], studyPrompt: '¿Qué hizo Pablo para sostener la esperanza del grupo y qué no promete el pasaje?',
  },
  {
    id: 'shipwreck', placeId: 'malta', placeIds: ['malta'], title: 'Todos llegan a Malta', region: 'Después del naufragio', date: 'Después del naufragio', places: 'Malta',
    summary: 'La nave encalla y se rompe; los viajeros alcanzan la costa. Hechos afirma que todos llegaron a tierra con vida.',
    context: 'El centurión impide que maten a los prisioneros y ordena que quienes puedan nadar lleguen primero a tierra. La promesa narrada antes se cumple en el desenlace del naufragio.',
    references: ['Hechos 27:39-44'], people: ['paul', 'julius'], studyPrompt: '¿Qué decisión de Julio protege a los prisioneros y cómo termina el naufragio?',
  },
  {
    id: 'malta-ministry', placeId: 'malta', placeIds: ['malta'], title: 'Hospitalidad y servicio en Malta', region: 'Durante el invierno', date: 'Durante el invierno', places: 'Malta',
    summary: 'Los habitantes reciben al grupo. Publio los hospeda y Pablo ora por enfermos de la isla.',
    context: 'El pasaje registra hospitalidad y sanidades durante la estancia. Esta ficha resume el relato sin añadir explicaciones históricas o doctrinales que el texto no presenta.',
    references: ['Hechos 28:1-10'], people: ['paul', 'publius'], studyPrompt: '¿Qué gestos de hospitalidad y servicio aparecen durante la estancia en la isla?',
  },
  {
    id: 'arrival-rome', placeId: 'rome', placeIds: ['syracuse', 'rhegium', 'puteoli', 'rome'], title: 'Sicilia, Puteoli y Roma', region: 'Al reanudar el viaje', date: 'Al reanudar el viaje', places: 'Siracusa · Regio · Puteoli · Roma',
    summary: 'La nave pasa por Siracusa y Regio antes de llegar a Puteoli. Pablo continúa por tierra y llega a Roma, donde recibe visitas bajo custodia.',
    context: 'Hechos cierra el itinerario marítimo con la llegada a Italia y concluye el libro describiendo la enseñanza de Pablo en Roma.',
    references: ['Hechos 28:11-16', 'Hechos 28:30-31'], people: ['paul'], studyPrompt: '¿Quiénes reciben a Pablo en el camino y cómo describe Hechos su labor en Roma?',
  },
];

/** Fourfold Gospel study guide grounded in Ecuador's local regulation and official Foursquare references. */
export const bibleStudyQuadrangularEntries: BibleStudyQuadrangularEntry[] = [
  {
    id: 'jesus-savior', symbol: 'cross', title: 'Jesucristo, nuestro Salvador', region: 'Evangelio Cuadrangular · Salvación',
    summary: 'La fe Cuadrangular anuncia a Jesús como Salvador. Isaías presenta al siervo herido por las rebeliones humanas; el Nuevo Testamento relaciona su entrega con perdón y vida nueva.',
    context: 'La misión y los símbolos de la Iglesia Cuadrangular del Ecuador incluyen este énfasis. Esta síntesis enlaza los pasajes citados por su normativa con el lector bíblico; consulta allí cada texto completo.',
    references: ['Isaías 53:5', '1 Pedro 2:24', 'Tito 2:14', 'Hebreos 7:25', 'Isaías 1:18', 'Isaías 55:7'],
  },
  {
    id: 'jesus-baptizer', symbol: 'dove', title: 'Jesucristo, Bautizador con el Espíritu Santo', region: 'Evangelio Cuadrangular · Espíritu Santo',
    summary: 'La declaración Cuadrangular confiesa a Jesús como quien bautiza con el Espíritu Santo. Hechos conecta la promesa con poder para dar testimonio desde Jerusalén hasta otras naciones.',
    context: 'La ficha presenta el énfasis institucional junto con los pasajes que cita el Reglamento Interno de Ecuador. Lee los textos directamente y observa cómo el relato de Hechos describe la misión y la obra del Espíritu.',
    references: ['Hechos 1:5-8', 'Juan 14:16-17', 'Hechos 2:4', 'Hechos 8:17', 'Hechos 10:44-46', '1 Corintios 3:16'],
  },
  {
    id: 'jesus-healer', symbol: 'cup', title: 'Jesucristo, nuestro Sanador', region: 'Evangelio Cuadrangular · Sanidad',
    summary: 'La fe Cuadrangular reconoce a Jesús como Sanador. Los Evangelios narran su compasión y sanidades; Santiago instruye a la comunidad a orar por quienes están enfermos.',
    context: 'La ficha resume una convicción doctrinal y señala sus referencias bíblicas; no promete un resultado particular ni reemplaza atención médica. Compara el lenguaje del Reglamento Interno con los pasajes del lector.',
    references: ['Mateo 8:16-17', 'Mateo 9:5-6', 'Hechos 4:29-30', 'Santiago 5:14-16'],
  },
  {
    id: 'jesus-coming-king', symbol: 'crown', title: 'Jesucristo, Rey que viene pronto', region: 'Evangelio Cuadrangular · Esperanza futura',
    summary: 'La Iglesia Cuadrangular proclama la esperanza del regreso de Cristo. Las cartas apostólicas llaman a esperar su venida y a vivir con fidelidad, sin fijar una fecha.',
    context: 'Este énfasis aparece en la Declaración de Fe y en el Reglamento Interno de Ecuador. Los pasajes se presentan para lectura y estudio; no se usan para calcular calendarios del fin.',
    references: ['1 Tesalonicenses 4:16-17', 'Tito 2:12-13', 'Mateo 24:36-44', 'Hebreos 9:28', 'Lucas 12:35-37'],
  },
];

/** The twelve central values named in Article 3 of Ecuador's Quadrangular internal regulations. */
export const bibleStudyQuadrangularCoreValues: BibleStudyQuadrangularCoreValue[] = [
  { id: 'holiness', title: 'Santidad', references: ['Hebreos 12:14'] },
  { id: 'truth', title: 'Verdad', references: ['Juan 14:6'] },
  { id: 'peace', title: 'Paz', references: ['1 Pedro 3:11'] },
  { id: 'love', title: 'Amor', references: ['1 Corintios 13:1-13'] },
  { id: 'faith', title: 'Fe', references: ['Hebreos 11:1-40'] },
  { id: 'justice', title: 'Justicia', references: ['Mateo 5:20'] },
  { id: 'forgiveness', title: 'Perdón', references: ['Lucas 17:3-4', 'Mateo 18:21'] },
  { id: 'responsibility', title: 'Responsabilidad', references: ['Lucas 16:10', '1 Corintios 4:1-2'] },
  { id: 'respect', title: 'Respeto', references: ['Efesios 6:1-5', 'Hebreos 13:7'] },
  { id: 'unity', title: 'Unidad', references: ['Juan 17:1-26', 'Efesios 4:3-16'] },
  { id: 'mercy', title: 'Misericordia', references: ['1 Pedro 3:8-9'] },
  { id: 'honesty', title: 'Honestidad', references: ['Lucas 16:10', 'Salmos 112:5'] },
];

/** Places from the patriarchs map share its narrative summaries and references instead of duplicating them. */
const genesisNarrativePlaceEntries: BibleStudyPlaceEntry[] = [
  {
    id: 'genesis-eden', placeId: 'eden', title: 'Edén', region: 'Relato de los comienzos',
    summary: 'La región donde Génesis sitúa el jardín que Dios planta para el ser humano.',
    context: 'Génesis menciona un río que sale de Edén y se divide en cuatro brazos. El texto no da coordenadas modernas y las identificaciones de Pisón, Gihón, Havila y Cus son inciertas; este catálogo no coloca un pin de ubicación comprobada.',
    references: ['Génesis 2:8-14'],
  },
  {
    id: 'genesis-garden', placeId: 'garden', title: 'El jardín', region: 'Dentro del relato de Edén',
    summary: 'El jardín plantado por Dios, donde el ser humano recibe la tarea de trabajarlo y cuidarlo.',
    context: 'El jardín y Edén están relacionados en el relato, pero el texto no los presenta como dos coordenadas modernas identificables. La representación visual del proyecto es esquemática.',
    references: ['Génesis 2:8-17'],
  },
  {
    id: 'genesis-four-rivers', placeId: 'four-rivers', title: 'Los cuatro ríos', region: 'Geografía descrita en Génesis',
    summary: 'Pisón, Gihón, Tigris y Éufrates son los cuatro brazos nombrados en Génesis 2:10-14.',
    context: 'El Tigris y el Éufrates son nombres reconocibles en la geografía de Asia occidental. La identificación de Pisón y Gihón, y la relación de Havila y Cus con regiones actuales, siguen debatidas. El pasaje no permite localizar con certeza el jardín del Edén.',
    references: ['Génesis 2:10-14'],
  },
];

const genesisPlaceEntries: BibleStudyPlaceEntry[] = [...genesisNarrativePlaceEntries, ...bibleStudyPatriarchLocationEntries.map((location) => ({
  id: `genesis-${location.id}`,
  placeId: location.id,
  atlasMapId: 'patriarchs',
  atlasLocationId: location.id,
  title: location.title,
  region: location.region,
  summary: location.summary,
  context: 'Lee los pasajes relacionados y observa qué parte del relato ubica aquí la narración. La ficha conserva los límites del texto bíblico y la posición del pin es orientativa.',
  references: location.references,
  sceneIds: location.sceneIds,
}))];

export const bibleStudyPlaceEntries: BibleStudyPlaceEntry[] = [...actsPlaceEntries, ...genesisPlaceEntries];

