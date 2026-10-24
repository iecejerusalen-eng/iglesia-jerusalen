import { BIBLE_BOOKS, type BibleBook } from '../config/bibleBooks';

export type BibleBookGroup = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  color: 'amber' | 'emerald' | 'rose' | 'teal' | 'violet' | 'sky' | 'indigo' | 'red' | 'blue' | 'orange' | 'cyan' | 'fuchsia';
  bookIds: string[];
};

export const bibleBookGroups: BibleBookGroup[] = [
  { id: 'pentateuch', title: 'Pentateuco', eyebrow: 'La Torá · cinco libros', description: 'Comienzos, pacto, liberación y formación del pueblo de Israel.', color: 'amber', bookIds: ['genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio'] },
  { id: 'conquest', title: 'Historia · conquista y jueces', eyebrow: 'Relatos históricos', description: 'La entrada en Canaán y las historias del tiempo de los jueces.', color: 'emerald', bookIds: ['josue', 'jueces', 'rut'] },
  { id: 'monarchy', title: 'Historia · reyes y reino', eyebrow: 'Monarquía de Israel', description: 'Samuel, la monarquía, los reinos divididos y la memoria de David.', color: 'rose', bookIds: ['1-samuel', '2-samuel', '1-reyes', '2-reyes', '1-cronicas', '2-cronicas'] },
  { id: 'restoration', title: 'Historia · exilio y regreso', eyebrow: 'Retorno y reconstrucción', description: 'La vida del pueblo en el exilio y la renovación de Jerusalén.', color: 'teal', bookIds: ['esdras', 'nehemias', 'ester'] },
  { id: 'poetry', title: 'Poesía y sabiduría', eyebrow: 'Oración · canto · reflexión', description: 'Palabras para orar, cantar, lamentar y buscar una vida sabia.', color: 'violet', bookIds: ['job', 'salmos', 'proverbios', 'eclesiastes', 'cantares'] },
  { id: 'major-prophets', title: 'Profetas mayores', eyebrow: 'Voces proféticas', description: 'Llamados a la fidelidad, denuncia de la injusticia y esperanza de restauración.', color: 'sky', bookIds: ['isaias', 'jeremias', 'lamentaciones', 'ezequiel', 'daniel'] },
  { id: 'minor-prophets', title: 'Profetas menores', eyebrow: 'El libro de los Doce', description: 'Doce mensajes breves dirigidos a comunidades de distintas épocas.', color: 'indigo', bookIds: ['oseas', 'joel', 'amos', 'abdias', 'jonas', 'miqueas', 'nahum', 'habacuc', 'sofonias', 'hageo', 'zacarias', 'malaquias'] },
  { id: 'gospels', title: 'Evangelios', eyebrow: 'La vida y obra de Jesús', description: 'Cuatro testimonios sobre Jesús, su enseñanza, muerte y resurrección.', color: 'red', bookIds: ['mateo', 'marcos', 'lucas', 'juan'] },
  { id: 'church-history', title: 'Historia de la Iglesia', eyebrow: 'Hechos de los Apóstoles', description: 'El testimonio de la iglesia naciente desde Jerusalén hasta Roma.', color: 'blue', bookIds: ['hechos'] },
  { id: 'pauline-letters', title: 'Cartas de Pablo', eyebrow: 'Cartas apostólicas', description: 'Cartas vinculadas con comunidades y colaboradores de Pablo.', color: 'orange', bookIds: ['romanos', '1-corintios', '2-corintios', 'galatas', 'efesios', 'filipenses', 'colosenses', '1-tesalonicenses', '2-tesalonicenses', '1-timoteo', '2-timoteo', 'tito', 'filemon'] },
  { id: 'general-letters', title: 'Cartas generales', eyebrow: 'Cartas del Nuevo Testamento', description: 'Exhortaciones para perseverar en la fe, el amor y la esperanza.', color: 'cyan', bookIds: ['hebreos', 'santiago', '1-pedro', '2-pedro', '1-juan', '2-juan', '3-juan', 'judas'] },
  { id: 'apocalypse', title: 'Profecía y Apocalipsis', eyebrow: 'Visiones de esperanza', description: 'Imágenes y símbolos que llaman a perseverar y anuncian la renovación final.', color: 'fuchsia', bookIds: ['apocalipsis'] },
];

export type CatalogBook = BibleBook & { group: BibleBookGroup };

const groupByBookId = new Map(bibleBookGroups.flatMap((group) => group.bookIds.map((bookId) => [bookId, group] as const)));

export const bibleBookCatalog: CatalogBook[] = BIBLE_BOOKS.map((book) => {
  const group = groupByBookId.get(book.id);
  if (!group) throw new Error(`El catálogo bíblico no asignó una sección a ${book.id}`);
  return { ...book, group };
});

export const bibleBookCount = bibleBookCatalog.length;
export const bibleChapterCount = bibleBookCatalog.reduce((total, book) => total + book.chapters, 0);

export const pentateuchOverview = {
  introduction: 'Pentateuco es el nombre griego tradicional para los cinco primeros libros de la Biblia; Torá es el nombre hebreo que suele traducirse como «instrucción». En conjunto, sus relatos y enseñanzas presentan los comienzos del mundo y de Israel, el pacto, la salida de Egipto y la vida comunitaria del pueblo.',
  books: [
    { id: 'genesis', focus: 'Comienzos, familias y promesa' },
    { id: 'exodo', focus: 'Liberación, pacto y tabernáculo' },
    { id: 'levitico', focus: 'Culto, santidad y vida comunitaria' },
    { id: 'numeros', focus: 'Camino por el desierto y preparación' },
    { id: 'deuteronomio', focus: 'Enseñanza y renovación del pacto' },
  ],
  authorship: 'La tradición judía y cristiana relaciona la Torá con Moisés. Varios pasajes describen a Moisés escribiendo palabras, instrucciones o registros (Éxodo 17:14; 24:4; 34:27; Números 33:2; Deuteronomio 31:9). Génesis no identifica a su autor en el propio libro. En la investigación actual también se discuten la transmisión de tradiciones, la edición y la forma final de estos textos. Aquí distinguimos la atribución tradicional de las preguntas sobre cómo se formó cada libro, sin presentar una hipótesis académica como hecho demostrado.',
  manuscripts: 'Los manuscritos antiguos conservados son copias y fragmentos, no los ejemplares originales de composición. En Qumrán, cerca del mar Muerto, se encontraron manuscritos bíblicos y otros textos antiguos. El llamado Génesis Apócrifo, conservado en arameo, vuelve a contar parte de Génesis 6–15: es un texto relacionado con la recepción de Génesis, no el manuscrito original del libro ni un rollo del Pentateuco. Las fotografías e imágenes de museos mantienen sus propias condiciones de uso; por eso enlazamos a las colecciones y no copiamos sus imágenes.',
  writing: 'Los textos del Pentateuco llegaron hasta nosotros en manuscritos transmitidos y copiados a mano. Los rollos se elaboraban con materiales como piel preparada o papiro, y los escribas copiaban el texto en columnas. Las piezas conservadas varían en época, material y estado: una pieza de museo permite estudiar una copia concreta, no reconstruir por sí sola el momento original de escritura.',
  references: ['Éxodo 17:14', 'Éxodo 24:4', 'Éxodo 34:27', 'Números 33:2', 'Deuteronomio 31:9'],
  sources: [
    { title: 'La biblioteca de Qumrán · Library of Congress', url: 'https://www.loc.gov/exhibits/scrolls/libr.html', note: 'Contexto y manuscritos conservados.' },
    { title: 'Génesis recontado · Israel Museum', url: 'https://www.imj.org.il/en/exhibitions/genesis-retold-0', note: 'El Génesis Apócrifo y su relación con Génesis 6–15.' },
    { title: 'Manuscritos del mar Muerto · colección digital', url: 'https://dss.collections.imj.org.il/', note: 'Consulta directa de piezas digitalizadas.' },
  ],
};

export const genesisBookIntroduction = {
  title: 'Génesis · libro de los comienzos',
  summary: 'Génesis abre la Biblia con la creación y los primeros relatos de la humanidad. Desde el capítulo 12, el foco se acerca a Abraham y a su familia; la historia avanza por Isaac, Jacob y José, y termina con Israel asentado en Egipto.',
  sections: [
    { title: 'Dos grandes movimientos', text: 'Génesis 1–11 presenta relatos sobre el mundo y la humanidad; Génesis 12–50 sigue la historia de una familia llamada a ser una bendición para otras familias.' },
    { title: 'Una lectura desde la fe', text: 'El libro presenta a Dios como Creador y protagonista de una historia de promesa, pacto, relaciones familiares, fallas humanas y fidelidad. Sus relatos preparan temas que continúan en Éxodo y el resto de la Biblia.' },
    { title: 'Autoría y transmisión', text: 'La tradición atribuye la Torá a Moisés; el texto de Génesis no nombra directamente a su autor. Esta introducción no fija una fecha de composición ni resuelve las preguntas debatidas sobre la transmisión de sus relatos.' },
  ],
  references: ['Génesis 1:1-2:3', 'Génesis 12:1-9', 'Génesis 15:1-6', 'Génesis 50:20-26'],
  sources: [
    { title: 'Guía de Génesis · Proyecto Biblia', url: 'https://bibleproject.com/es/guides/libro-de-genesis/' },
    { title: 'Génesis 1–11 · video de resumen', url: 'https://bibleproject.com/es/videos/genesis-1-11/' },
  ],
};

export const genesisChapterOne = {
  title: 'Dios crea y ordena la vida',
  summary: 'Génesis 1:1–31 presenta a Dios creando mediante su palabra, distinguiendo ámbitos y llenándolos de vida. El relato avanza en una secuencia de seis días y culmina con la humanidad creada a imagen de Dios.',
  structure: [
    { label: 'Día 1', reference: 'Génesis 1:3-5', theme: 'Luz y oscuridad' },
    { label: 'Día 2', reference: 'Génesis 1:6-8', theme: 'Cielo y aguas' },
    { label: 'Día 3', reference: 'Génesis 1:9-13', theme: 'Tierra, mares y vegetación' },
    { label: 'Día 4', reference: 'Génesis 1:14-19', theme: 'Luces que señalan tiempos' },
    { label: 'Día 5', reference: 'Génesis 1:20-23', theme: 'Vida en las aguas y en el cielo' },
    { label: 'Día 6', reference: 'Génesis 1:24-31', theme: 'Animales terrestres y humanidad' },
  ],
  observations: [
    'La frase «Dijo Dios» se repite y organiza el relato: la creación responde a la palabra de Dios.',
    'El texto repite que Dios ve que lo creado es bueno y culmina llamando «bueno en gran manera» al conjunto.',
    'Varón y mujer aparecen como imagen de Dios y reciben una responsabilidad sobre los seres vivos; el pasaje no los nombra todavía como Adán y Eva.',
    'El séptimo día continúa en Génesis 2:1-3. Es útil leer ese pasaje junto con el capítulo para apreciar el cierre de la semana narrativa.',
  ],
  literaryMap: [
    { name: 'Cielo', detail: 'Luz, lumbreras y aves' },
    { name: 'Aguas y mares', detail: 'Límite y vida acuática' },
    { name: 'Tierra', detail: 'Vegetación, animales y humanidad' },
  ],
  relatedPeople: ['Dios, Creador', 'La humanidad: varón y mujer'],
  relatedReferences: ['Salmo 8:3-8', 'Salmo 33:6-9', 'Juan 1:1-3', 'Colosenses 1:15-17', 'Hebreos 11:3'],
  videos: [
    { title: 'Génesis 1 · comentario visual', duration: '7 min', url: 'https://bibleproject.com/es/videos/genesis-1/' },
    { title: 'Génesis 1–11 · panorama del relato', duration: '8 min', url: 'https://bibleproject.com/es/videos/genesis-1-11/' },
    { title: 'Génesis, parte 1 · Creación y caos', duration: '5 min 40 s', url: 'https://bibleproject.com/es/videos/genesis-parte-1-creacion-y-caos/' },
    { title: 'Imagen de Dios · tema bíblico', duration: '5 min', url: 'https://bibleproject.com/es/videos/imagen-de-dios/' },
  ],
};
