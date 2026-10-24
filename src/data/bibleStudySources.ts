export type BibleStudySourceStatus = 'En uso' | 'Referencia doctrinal' | 'Candidata' | 'Uso condicionado';

export type BibleStudySourceEntry = {
  id: string;
  title: string;
  kind: string;
  url: string;
  status: BibleStudySourceStatus;
  license: string;
  use: string;
};

export const bibleStudySources: BibleStudySourceEntry[] = [
  {
    id: 'tyndale-open-resources',
    title: 'Tyndale Open Resources',
    kind: 'Diccionario y notas de estudio',
    url: 'https://tyndaleopenresources.com/',
    status: 'En uso',
    license: 'CC BY-SA 4.0',
    use: 'Las fichas derivadas indican traducción, síntesis, atribución y licencia compartida. Cada artículo se contrasta con sus pasajes; la licencia no equivale a aprobación doctrinal Cuadrangular.',
  },
  {
    id: 'churchmaps',
    title: 'ChurchMaps',
    kind: 'Mapas bíblicos',
    url: 'https://churchmaps.info/index.html',
    status: 'En uso',
    license: 'Dominio público declarado por la fuente',
    use: 'Se conserva versión y procedencia junto al mapa. Las rutas tradicionales o discutidas se presentan como orientativas, no como reconstrucciones definitivas.',
  },
  {
    id: 'openbible-geocoding',
    title: 'OpenBible.info · Bible Geocoding',
    kind: 'Datos de lugares y ubicaciones candidatas',
    url: 'https://www.openbible.info/geo/',
    status: 'En uso',
    license: 'CC BY para el conjunto, según su fuente',
    use: 'Se atribuye OpenBible.info y se muestran alternativas e incertidumbre por lugar. Algunos datos dependen de OpenStreetMap y conservan sus obligaciones ODbL; no reutilizamos sus mosaicos como si fueran dominio público.',
  },
  {
    id: 'foursquare-beliefs',
    title: 'Iglesia Cuadrangular Internacional · creencias',
    kind: 'Referencia doctrinal primaria',
    url: 'https://www.foursquare.org/about/beliefs/',
    status: 'Referencia doctrinal',
    license: 'Referencia y enlace; no se presume licencia abierta',
    use: 'Orienta las síntesis Cuadrangulares. Se enlaza la fuente institucional y se redactan resúmenes propios con referencias bíblicas, sin presentar la página como material de libre redistribución.',
  },
  {
    id: 'ecuador-regulation',
    title: 'Reglamento Interno · Iglesia Cuadrangular del Ecuador',
    kind: 'Referencia institucional nacional',
    url: '/documentos/reglamento-interno.pdf',
    status: 'Referencia doctrinal',
    license: 'Documento oficial enlazado; no se presume licencia abierta',
    use: 'Sustenta los símbolos y valores propios de la organización ecuatoriana. Se conserva el documento original como fuente y se distingue de la declaración internacional.',
  },
  {
    id: 'ebible-rv1909',
    title: 'eBible.org · Reina-Valera 1909',
    kind: 'Candidata de texto bíblico en español',
    url: 'https://ebible.org/bible/details.php?id=spaRV1909',
    status: 'Candidata',
    license: 'Dominio público declarado por eBible.org',
    use: 'Candidata para evaluar por separado en el lector. Este hub no duplica el texto ni cambia las versiones que ya ofrece /recursos/biblia.',
  },
  {
    id: 'open-bible-images',
    title: 'Open Bible Images',
    kind: 'Ilustraciones bíblicas',
    url: 'https://openbibleimages.org/license',
    status: 'Candidata',
    license: 'Depende de la ficha de cada imagen',
    use: 'No se trata todo el catálogo como una licencia única: revisar archivo, autor, licencia, representación histórica y atribución antes de incorporarlo.',
  },
  {
    id: 'open-bible',
    title: 'Open.Bible',
    kind: 'Catálogo de Biblias, audio e imágenes',
    url: 'https://open.bible/resources',
    status: 'Candidata',
    license: 'Varía por traducción y recurso',
    use: 'El catálogo reúne licencias distintas. Solo se evaluará cada versión o pieza concreta; acceso gratuito no basta para copiar, traducir o alojar.',
  },
  {
    id: 'bibleproject',
    title: 'BibleProject · términos de uso',
    kind: 'Videos y material audiovisual',
    url: 'https://bibleproject.com/terms/',
    status: 'Uso condicionado',
    license: 'Permiso limitado de enlace o inserción bajo sus términos',
    use: 'Si se incorpora un video, se enlaza o inserta el reproductor oficial con atribución visible y sin cobrar ni obtener beneficio financiero. No se edita, copia ni aloja el archivo por cuenta propia.',
  },
  {
    id: 'assemblies-of-god',
    title: 'Asambleas de Dios · declaración de verdades fundamentales',
    kind: 'Fuente evangélica comparativa',
    url: 'https://ag.org/Beliefs/Statement-of-Fundamental-truths',
    status: 'Referencia doctrinal',
    license: 'Referencia comparativa; no se presume licencia abierta',
    use: 'Puede ayudar a identificar coincidencias y diferencias entre tradiciones evangélicas; no se presenta como doctrina de la Iglesia Cuadrangular ni se copia su contenido.',
  },
  {
    id: 'baptist-faith-message',
    title: 'Convención Bautista del Sur · Fe y Mensaje Bautistas',
    kind: 'Fuente evangélica comparativa',
    url: 'https://bfm.sbc.net/bfm2000/',
    status: 'Referencia doctrinal',
    license: 'Referencia comparativa; no se presume licencia abierta',
    use: 'Es una confesión de la Convención Bautista del Sur, no de todas las iglesias bautistas. Sirve para comparar perspectivas sin atribuirla a la Iglesia Cuadrangular ni reproducirla.',
  },
];
