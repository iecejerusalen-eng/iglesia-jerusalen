// src/config/bibleIndexesData.ts

export interface BibleCharacter {
  id: string;
  name: string;
  meaning: string;
  historicalContext: string;
  keyEvents: string[];
  interestingFacts: string[];
  imageUrl?: string;
  firstMention: string;
}

export interface BiblePlace {
  id: string;
  name: string;
  location: string;
  significance: string;
  keyEvents: string[];
  interestingFacts: string[];
  firstMention: string;
  imageUrl?: string;
}

export interface BibleBookInfo {
  id: string;
  name: string;
  testament: 'Antiguo Testamento' | 'Nuevo Testamento';
  group: string;
  author: string;
  dateWritten: string;
  historicalContext: string;
  keyThemes: string[];
  chapters: number;
  interestingFacts: string[];
}

export const bibleBookIntroductions: Record<string, string> = {
  genesis: 'Génesis presenta los comienzos de la creación, la humanidad y el pueblo de Israel. A través de las historias de los patriarcas, introduce el pacto y la promesa que recorren el resto de la Biblia.',
  exodo: 'Éxodo narra la liberación de Israel de la esclavitud y su camino hacia el Sinaí. Allí el pueblo recibe la Ley y aprende a vivir como comunidad del pacto con Dios.',
  levitico: 'Levítico reúne instrucciones para el culto, el sacerdocio y la vida comunitaria de Israel. Su llamado a la santidad enseña cómo acercarse a Dios y tratar al prójimo.',
  numeros: 'Números sigue a Israel durante su travesía por el desierto, desde el Sinaí hasta las llanuras de Moab. Alterna organización, pruebas, rebelión y cuidado de Dios.',
  deuteronomio: 'En las llanuras de Moab, Moisés repasa la historia y la Ley ante una nueva generación. El libro invita a recordar el pacto y escoger la fidelidad al entrar en Canaán.',
  josue: 'Josué cuenta la entrada de Israel en Canaán y la distribución de la tierra entre las tribus. Concluye renovando el compromiso del pueblo con el pacto.',
  jueces: 'Jueces describe ciclos de infidelidad, opresión y liberación antes de la monarquía. Sus relatos muestran la fragilidad del pueblo y la necesidad de una dirección fiel.',
  rut: 'Rut cuenta cómo la lealtad de una mujer moabita y la bondad de Booz sostienen a Noemí en tiempos difíciles. Su historia familiar se enlaza con la genealogía de David.',
  '1-samuel': 'Primera de Samuel sigue el paso de Israel desde los jueces hasta la monarquía. Presenta a Samuel, el reinado de Saúl y el surgimiento de David.',
  '2-samuel': 'Segunda de Samuel relata el reinado de David, la consolidación de Jerusalén y las promesas hechas a su casa. También expone los efectos de sus decisiones y conflictos familiares.',
  '1-reyes': 'Primera de Reyes comienza con Salomón y la construcción del templo, y continúa con la división del reino. Evalúa a sus gobernantes a la luz de su fidelidad al pacto.',
  '2-reyes': 'Segunda de Reyes recorre la historia de Israel y Judá hasta sus respectivos exilios. Los ministerios proféticos acompañan las advertencias y los llamados al arrepentimiento.',
  '1-cronicas': 'Primera de Crónicas presenta genealogías de Israel y vuelve a narrar el reinado de David. Destaca la adoración, el orden del culto y los preparativos para el templo.',
  '2-cronicas': 'Segunda de Crónicas se centra en los reyes de Judá, desde Salomón hasta el exilio. El templo y la respuesta del pueblo a Dios marcan el relato.',
  esdras: 'Esdras narra el regreso de grupos de exiliados y la reconstrucción del templo en Jerusalén. La enseñanza de la Ley orienta la renovación de la comunidad.',
  nehemias: 'Nehemías cuenta la reconstrucción de las murallas de Jerusalén y la reorganización de la ciudad. La oración, el trabajo compartido y la lectura pública de la Ley impulsan la renovación.',
  ester: 'En la corte persa, Ester y Mardoqueo intervienen para proteger a su pueblo de una amenaza de exterminio. El libro relata el origen de la fiesta de Purim.',
  job: 'Job explora el sufrimiento de una persona íntegra y las preguntas que surgen cuando el dolor no parece tener explicación. El diálogo conduce a una reflexión sobre los límites humanos ante Dios.',
  salmos: 'Salmos reúne oraciones y cantos para expresar alabanza, lamento, gratitud, confianza y arrepentimiento. Sus voces acompañan la vida personal y comunitaria de fe.',
  proverbios: 'Proverbios recopila enseñanzas para formar sabiduría práctica, dominio propio y justicia. Invita a vivir con reverencia a Dios en las decisiones cotidianas.',
  eclesiastes: 'Eclesiastés observa los logros, placeres y trabajos humanos frente al paso del tiempo. Sus reflexiones llaman a reconocer los límites de la vida y a vivir con reverencia a Dios.',
  cantares: 'Cantar de los Cantares celebra el amor y el deseo entre dos personas mediante poesía e imágenes de la naturaleza. Su lenguaje invita a contemplar la belleza de la relación.',
  isaias: 'Isaías combina advertencias a Judá con esperanza de restauración y justicia. Sus visiones anuncian consuelo para el pueblo y presentan la expectativa de un rey justo.',
  jeremias: 'Jeremías reúne los mensajes de un profeta que advirtió sobre la caída de Jerusalén y acompañó a su pueblo durante la crisis. También anuncia esperanza y un pacto renovado.',
  lamentaciones: 'Lamentaciones expresa el duelo por la destrucción de Jerusalén en cinco poemas. El dolor por la pérdida convive con la súplica y la esperanza en la misericordia de Dios.',
  ezequiel: 'Ezequiel comunica visiones y señales a los exiliados en Babilonia. Anuncia juicio, pero también renovación, un corazón nuevo y la restauración de la presencia de Dios entre su pueblo.',
  daniel: 'Daniel reúne relatos de fidelidad en cortes extranjeras y visiones sobre reinos y tiempos futuros. Sostiene la esperanza de quienes viven bajo imperios cambiantes.',
  oseas: 'La vida familiar de Oseas sirve como señal del vínculo herido entre Dios e Israel. El libro denuncia la infidelidad y mantiene abierta la posibilidad del regreso y la restauración.',
  joel: 'Joel parte de una devastadora plaga para llamar al arrepentimiento y anunciar el día del Señor. También promete restauración y el derramamiento del Espíritu.',
  amos: 'Amós denuncia la injusticia, la explotación de los pobres y un culto separado de la rectitud. Sus oráculos llaman a buscar justicia y anuncian una futura restauración.',
  abdias: 'Abdías pronuncia juicio contra Edom por su violencia y orgullo frente a Judá. Su mensaje afirma que las naciones también responderán por sus acciones.',
  jonas: 'Jonás relata la resistencia de un profeta enviado a Nínive y la respuesta inesperada de la ciudad. La historia cuestiona los límites de la compasión y la misericordia.',
  miqueas: 'Miqueas confronta a los dirigentes por la injusticia y anuncia tanto juicio como restauración. El libro relaciona la esperanza futura con practicar justicia, amar misericordia y caminar humildemente con Dios.',
  nahum: 'Nahúm anuncia la caída de Nínive y el fin del dominio que oprimía a otros pueblos. Su poesía presenta el juicio contra la violencia imperial.',
  habacuc: 'Habacuc dialoga con Dios ante la injusticia y el avance de Babilonia. El profeta pasa de la pregunta y la espera a una declaración de confianza.',
  sofonias: 'Sofonías advierte sobre el día del Señor y llama a buscar justicia y humildad. Después del juicio, anuncia la reunión y el gozo renovado del pueblo.',
  hageo: 'Hageo anima a quienes regresaron del exilio a retomar la reconstrucción del templo. Sus mensajes relacionan la renovación del culto con el futuro de la comunidad.',
  zacarias: 'Zacarías combina visiones de ánimo para quienes reconstruyen Jerusalén con promesas de restauración. Sus imágenes miran hacia la esperanza de un rey y un futuro renovado.',
  malaquias: 'Malaquías confronta la apatía religiosa y las prácticas injustas de la comunidad después del exilio. El libro llama a renovar la fidelidad y espera la llegada de un mensajero.',
  mateo: 'Mateo presenta a Jesús como el Mesías y organiza su enseñanza en grandes discursos. Conecta su vida y misión con las Escrituras de Israel y concluye con el envío de sus discípulos.',
  marcos: 'Marcos narra con ritmo ágil las acciones y enseñanzas de Jesús. El camino hacia la cruz revela qué significa seguirlo y reconocer su identidad.',
  lucas: 'Lucas ofrece un relato ordenado de la vida y misión de Jesús, con atención a quienes suelen quedar al margen. La historia continúa en Hechos con la expansión de la Iglesia.',
  juan: 'Juan reúne señales y conversaciones que invitan a reconocer quién es Jesús y a creer en él. El relato conduce a la cruz y la resurrección, y explica el propósito de su testimonio.',
  hechos: 'Hechos relata cómo el mensaje de Jesús se extendió desde Jerusalén hacia otras regiones. Sigue el trabajo de los apóstoles y la formación de comunidades guiadas por el Espíritu.',
  romanos: 'Romanos expone el alcance del evangelio para judíos y gentiles, la justificación por la fe y la vida nueva. Cierra con orientaciones para la unidad y el servicio comunitario.',
  '1-corintios': 'Primera de Corintios responde a divisiones y preguntas concretas de una iglesia diversa. Pablo trata la vida comunitaria, los dones, el amor y la esperanza de la resurrección.',
  '2-corintios': 'Segunda de Corintios muestra la relación cercana y difícil entre Pablo y la iglesia. Defiende su ministerio y reflexiona sobre consuelo, generosidad y fortaleza en la debilidad.',
  galatas: 'Gálatas defiende que las personas son recibidas por la fe en Cristo y no por adoptar las marcas de la Ley. Contrasta la libertad cristiana con una vida guiada por el Espíritu.',
  efesios: 'Efesios contempla la reconciliación en Cristo y la unidad de la Iglesia como un solo cuerpo. De esa identidad deriva una vida de servicio, amor y firmeza.',
  filipenses: 'Filipenses es una carta de gratitud y ánimo escrita desde la prisión. Invita a la unidad, la humildad siguiendo el ejemplo de Cristo y el gozo aun en la dificultad.',
  colosenses: 'Colosenses afirma la centralidad y suficiencia de Cristo frente a enseñanzas que inquietaban a la comunidad. Describe una vida renovada en relaciones y prácticas cotidianas.',
  '1-tesalonicenses': 'Primera de Tesalonicenses anima a una comunidad joven que atraviesa oposición. Pablo agradece su fe, orienta su vida santa y responde preguntas sobre quienes han muerto.',
  '2-tesalonicenses': 'Segunda de Tesalonicenses busca dar claridad y firmeza ante confusiones sobre el día del Señor. También anima a perseverar y a trabajar responsablemente.',
  '1-timoteo': 'Primera de Timoteo ofrece orientaciones para cuidar la enseñanza, el culto y el liderazgo de la comunidad en Éfeso. Reúne consejos prácticos para una iglesia ordenada.',
  '2-timoteo': 'Segunda de Timoteo es una exhortación a perseverar en la enseñanza y el servicio pese al sufrimiento. Pablo anima a transmitir fielmente el mensaje recibido.',
  tito: 'Tito orienta la organización de las iglesias en Creta y la elección de sus líderes. Vincula la enseñanza de la gracia con una vida dedicada a las buenas obras.',
  filemon: 'Filemón es una petición personal para recibir a Onésimo como hermano. La carta muestra cómo el evangelio transforma una relación marcada por desigualdad y deuda.',
  hebreos: 'Hebreos anima a una comunidad cansada a perseverar. Presenta a Jesús como mediador y sumo sacerdote, y recorre la historia de la fe para sostener la esperanza.',
  santiago: 'Santiago reúne exhortaciones prácticas sobre pruebas, sabiduría, palabras y trato justo. Insiste en que la fe se reconoce en acciones coherentes y cuidado del prójimo.',
  '1-pedro': 'Primera de Pedro fortalece a comunidades que enfrentan sufrimiento y rechazo. Les recuerda su esperanza en Cristo y les orienta a vivir con santidad y bondad.',
  '2-pedro': 'Segunda de Pedro llama a crecer en virtud y conocimiento, y advierte contra maestros engañosos. Invita a esperar con responsabilidad el día del Señor.',
  '1-juan': 'Primera de Juan ofrece criterios para vivir en comunión con Dios y con la comunidad: creer en Jesús, andar en la luz y practicar el amor.',
  '2-juan': 'Segunda de Juan une el llamado a amarse con la fidelidad a la enseñanza sobre Cristo. También aconseja discernimiento frente a quienes la distorsionan.',
  '3-juan': 'Tercera de Juan agradece la hospitalidad de Gayo y contrasta su ejemplo con el liderazgo autoritario de Diótrefes. Anima a apoyar a quienes sirven al evangelio.',
  judas: 'Judas exhorta a defender la fe recibida frente a enseñanzas que justifican una conducta destructiva. Recuerda ejemplos de juicio y concluye con esperanza en Dios.',
  apocalipsis: 'Apocalipsis transmite visiones de Juan a comunidades que viven bajo presión. Mediante símbolos de conflicto, juicio y adoración, anuncia la victoria de Dios y una creación renovada.',
};

export const bibleCharacters: BibleCharacter[] = [
  {
    id: 'jesus',
    imageUrl: '/assets/encyclopedia/characters/jesus.png',
    name: 'Jesús',
    meaning: 'Yahveh es salvación',
    historicalContext: 'Nació en Belén bajo el imperio romano durante el reinado de Herodes el Grande. Vivió y ministró principalmente en Galilea y Judea.',
    keyEvents: ['Nacimiento virginal', 'Bautismo por Juan el Bautista', 'Sermón del Monte', 'Crucifixión y Resurrección', 'Ascensión'],
    interestingFacts: [
      'Los evangelios presentan su vida, muerte y resurrección en relación con las promesas mesiánicas de las Escrituras.',
      'Su ministerio público duró aproximadamente 3 años.',
      'A menudo enseñaba usando parábolas.'
    ],
    firstMention: 'Mateo 1:1'
  },
  {
    id: 'moises',
    imageUrl: '/assets/encyclopedia/characters/moises.png',
    name: 'Moisés',
    meaning: 'Rescatado de las aguas',
    historicalContext: 'Vivió durante la opresión israelita en Egipto. Fue criado como príncipe egipcio pero huyó a Madián antes de regresar para liberar a su pueblo.',
    keyEvents: ['La zarza ardiente', 'Las 10 plagas de Egipto', 'Apertura del Mar Rojo', 'Recepción de los Diez Mandamientos', 'Travesía de 40 años por el desierto'],
    interestingFacts: [
      'Era el hombre más manso de la tierra (Números 12:3).',
      'No se le permitió entrar a la Tierra Prometida, solo verla desde el monte Nebo.',
      'La tradición atribuye a Moisés los cinco libros del Pentateuco.'
    ],
    firstMention: 'Éxodo 2:2'
  },
  {
    id: 'david',
    imageUrl: '/assets/encyclopedia/characters/david.png',
    name: 'David',
    meaning: 'Amado',
    historicalContext: 'Segundo rey de Israel unido, sucediendo a Saúl. Vivió alrededor del año 1000 a.C. y estableció Jerusalén como la capital.',
    keyEvents: ['Unción por Samuel', 'Derrota de Goliat', 'Amistad con Jonatán', 'Pecado con Betsabé', 'Promesa del pacto davídico'],
    interestingFacts: [
      'Fue descrito como "un hombre conforme al corazón de Dios".',
      'Se le atribuye la autoría de aproximadamente la mitad de los Salmos.',
      'Era un hábil músico que tocaba el arpa para calmar al rey Saúl.'
    ],
    firstMention: 'Rut 4:17'
  },
  {
    id: 'pablo',
    imageUrl: '/assets/encyclopedia/characters/pablo.jpg',
    name: 'Pablo (Saulo)',
    meaning: 'Pequeño / Humilde',
    historicalContext: 'Ciudadano romano nacido en Tarso. Fariseo instruido por Gamaliel, inicialmente un feroz perseguidor de la Iglesia primitiva antes de su conversión.',
    keyEvents: ['Conversión en el camino a Damasco', 'Tres viajes misioneros', 'Concilio de Jerusalén', 'Arresto en Jerusalén y viaje a Roma', 'Martirio en Roma'],
    interestingFacts: [
      'Escribió 13 (posiblemente 14 si se incluye Hebreos) epístolas del Nuevo Testamento.',
      'Se sostenía económicamente fabricando tiendas.',
      'Predicó el evangelio a los gentiles a lo largo de todo el Imperio Romano.'
    ],
    firstMention: 'Hechos 7:58'
  },
  {
    id: 'abraham',
    imageUrl: '/images/games/characters/abraham.webp',
    name: 'Abraham',
    meaning: 'Padre de multitudes',
    historicalContext: 'Vivió alrededor del año 2000 a.C. en Ur de los Caldeos antes de ser llamado por Dios a Canaán.',
    keyEvents: ['Llamamiento a dejar Ur', 'Pacto con Dios', 'Nacimiento de Isaac en su vejez', 'Prueba de sacrificar a Isaac'],
    interestingFacts: [
      'Es considerado el patriarca del judaísmo, cristianismo e islam.',
      'Su nombre original era Abram antes de que Dios lo cambiara.',
      'Fue justificado por la fe (Romanos 4).'
    ],
    firstMention: 'Génesis 11:26'
  },
  {
    id: 'maria',
    imageUrl: '/images/games/characters/maria-madre-de-jesus.webp',
    name: 'María',
    meaning: 'Amada / Rebelión / Gota del mar',
    historicalContext: 'Una joven judía de Nazaret en Galilea, desposada con José el carpintero en el siglo I d.C.',
    keyEvents: ['La Anunciación', 'Nacimiento de Jesús', 'Boda en Caná', 'Crucifixión de Jesús', 'Presencia en el aposento alto en Pentecostés'],
    interestingFacts: [
      'Es la mujer más mencionada en el Nuevo Testamento.',
      'Entregó el cuidado de su hijo al apóstol Juan en la cruz.',
      'Su canto de alabanza se conoce como el Magnificat.'
    ],
    firstMention: 'Mateo 1:16'
  },
  {
    id: 'pedro',
    imageUrl: '/assets/encyclopedia/characters/pedro.jpg',
    name: 'Pedro (Simón)',
    meaning: 'Piedra / Roca',
    historicalContext: 'Pescador de Betsaida que vivía en Capernaúm. Uno de los discípulos más cercanos a Jesús.',
    keyEvents: ['Llamamiento al discipulado', 'Caminar sobre el agua', 'Confesión de Jesús como el Cristo', 'Negación a Jesús', 'Sermón de Pentecostés'],
    interestingFacts: [
      'Formaba parte del círculo íntimo de Jesús (con Juan y Jacobo).',
      'Fue el primer apóstol en predicar a los gentiles (Cornelio).',
      'Según la tradición, fue crucificado cabeza abajo en Roma.'
    ],
    firstMention: 'Juan 1:42'
  },
  {
    id: 'elias',
    imageUrl: '/images/games/characters/elias.webp',
    name: 'Elías',
    meaning: 'Mi Dios es Yahveh',
    historicalContext: 'Profeta que ministró en el Reino del Norte (Israel) durante el reinado del malvado rey Acab y la reina Jezabel (siglo IX a.C.).',
    keyEvents: ['Predicción de la sequía', 'Reto a los profetas de Baal en el Monte Carmelo', 'Huida a Horeb', 'Arrebatamiento al cielo en un torbellino'],
    interestingFacts: [
      'No experimentó la muerte física.',
      'Apareció junto con Moisés en el Monte de la Transfiguración.',
      'Su regreso se profetiza antes del "día del Señor" (Malaquías 4:5).'
    ],
    firstMention: '1 Reyes 17:1'
  },
  {
    id: 'daniel',
    imageUrl: '/images/games/characters/daniel.webp',
    name: 'Daniel',
    meaning: 'Dios es mi juez',
    historicalContext: 'Joven noble judío exiliado a Babilonia en el 605 a.C., que sirvió fielmente bajo múltiples reyes babilónicos y medopersas.',
    keyEvents: ['Interpretación del sueño de Nabucodonosor', 'El foso de los leones', 'La escritura en la pared', 'Visiones del futuro (bestias, 70 semanas)'],
    interestingFacts: [
      'Mantuvo una dieta kosher en la corte babilónica.',
      'Oraba tres veces al día mirando hacia Jerusalén.',
      'Sobrevivió ileso a la guarida de los leones.'
    ],
    firstMention: 'Daniel 1:6'
  },
  {
    id: 'juan_bautista',
    imageUrl: '/images/games/characters/juan-el-bautista.webp',
    name: 'Juan el Bautista',
    meaning: 'Dios es clemente',
    historicalContext: 'Hijo del sacerdote Zacarías y Elisabet, pariente de Jesús. Ministró en el desierto de Judea preparando el camino para el Mesías.',
    keyEvents: ['Salto en el vientre ante María', 'Predicación del arrepentimiento', 'Bautismo de Jesús', 'Encarcelamiento y decapitación por Herodes Antipas'],
    interestingFacts: [
      'Vestía ropa de pelo de camello y comía langostas y miel silvestre.',
      'Jesús lo consideró el profeta más grande (Mateo 11:11).',
      'Actuó con el espíritu y poder de Elías.'
    ],
    firstMention: 'Mateo 3:1'
  },
  {
    id: 'noe',
    imageUrl: '/assets/encyclopedia/characters/noe.jpg',
    name: 'Noé',
    meaning: 'Descanso / Consuelo',
    historicalContext: 'Vivió en una época de gran corrupción antes del diluvio. Décima generación desde Adán.',
    keyEvents: ['Construcción del Arca', 'El Diluvio universal', 'Pacto del Arcoíris', 'Maldición de Canaán'],
    interestingFacts: [
      'Le tomó décadas construir el Arca.',
      'Es mencionado como un predicador de justicia.',
      'Fue el primer hombre en plantar una viña y embriagarse.'
    ],
    firstMention: 'Génesis 5:29'
  },
  {
    id: 'jose',
    imageUrl: '/images/games/characters/jose-hijo-de-jacob.webp',
    name: 'José (hijo de Jacob)',
    meaning: 'Él añade / Que Dios añada',
    historicalContext: 'Vivió alrededor de 1900-1800 a.C. Fue vendido por sus hermanos como esclavo en Egipto, pero llegó a ser el segundo al mando de Faraón.',
    keyEvents: ['Vendido a los ismaelitas', 'Prisión tras la acusación de la esposa de Potifar', 'Interpretación de los sueños de Faraón', 'Reencuentro con sus hermanos'],
    interestingFacts: [
      'Recibió una túnica de colores de su padre, lo que generó envidia.',
      'Salvo a Egipto y a su propia familia de siete años de hambre.',
      'Perdonó a sus hermanos diciendo: "Vosotros pensasteis mal contra mí, mas Dios lo encaminó a bien".'
    ],
    firstMention: 'Génesis 30:24'
  },
  {
    id: 'rut',
    imageUrl: '/images/games/characters/rut.webp',
    name: 'Rut',
    meaning: 'Amiga / Compañera',
    historicalContext: 'Una mujer moabita que vivió durante el tiempo de los jueces en Israel.',
    keyEvents: ['Decisión de seguir a Noemí', 'Recogida de espigas en el campo de Booz', 'Petición a Booz como pariente redentor', 'Matrimonio con Booz'],
    interestingFacts: [
      'A pesar de ser extranjera (moabita), fue bisabuela del Rey David.',
      'Su declaración "tu pueblo será mi pueblo, y tu Dios mi Dios" es una de las más famosas de la Biblia.',
      'Es una de las cinco mujeres mencionadas en la genealogía de Jesús (Mateo 1).'
    ],
    firstMention: 'Rut 1:4'
  },
  {
    id: 'salomon',
    imageUrl: '/assets/encyclopedia/characters/salomon.png',
    name: 'Salomón',
    meaning: 'Pacífico',
    historicalContext: 'Tercer rey del Reino Unido de Israel, hijo de David y Betsabé. Gobernó durante la "edad de oro" de Israel (970–931 a.C.).',
    keyEvents: ['Petición de sabiduría a Dios', 'Juicio de las dos madres', 'Construcción del Primer Templo', 'Visita de la Reina de Sabá', 'Caída en idolatría en su vejez'],
    interestingFacts: [
      'Fue considerado el hombre más sabio de la tierra.',
      'Escribió 3,000 proverbios y 1,005 cantares.',
      'Tuvo 700 esposas y 300 concubinas, quienes desviaron su corazón hacia dioses ajenos.'
    ],
    firstMention: '2 Samuel 5:14'
  },
  {
    id: 'samuel',
    imageUrl: '/images/games/characters/samuel.webp',
    name: 'Samuel',
    meaning: 'Oído por Dios / Pedido a Dios',
    historicalContext: 'El último de los jueces y el primero de los profetas principales. Transicionó la nación de una federación tribal a una monarquía.',
    keyEvents: ['Llamado de Dios de niño', 'Derrota a los filisteos en Mizpa', 'Unción de Saúl como rey', 'Unción de David como rey'],
    interestingFacts: [
      'Su madre, Ana, era estéril y se lo dedicó al Señor antes de nacer.',
      'Ministró bajo el sumo sacerdote Elí en Silo.',
      'Apareció en espíritu después de su muerte cuando el rey Saúl visitó a la adivina de Endor.'
    ],
    firstMention: '1 Samuel 1:20'
  }
,

  {
    id: 'isaac',
    imageUrl: '/assets/encyclopedia/characters/isaac.jpg',
    name: 'Isaac',
    meaning: 'El que ríe',
    historicalContext: 'Hijo de Abraham y Sara en su vejez. Patriarca de Israel.',
    keyEvents: ['Casi sacrificado por Abraham', 'Matrimonio con Rebeca', 'Bendición a Jacob en lugar de Esaú'],
    interestingFacts: ['Su nombre proviene de la risa de Sara al escuchar que sería madre.', 'Fue pacífico y evitó conflictos por pozos de agua.'],
    firstMention: 'Génesis 17:19',
  },
  {
    id: 'jacob',
    imageUrl: '/assets/encyclopedia/characters/jacob.jpg',
    name: 'Jacob / Israel',
    meaning: 'Sostenido por el talón / El que lucha con Dios',
    historicalContext: 'Hijo de Isaac. Padre de las 12 tribus de Israel.',
    keyEvents: ['Compra de la primogenitura a Esaú', 'Sueño de la escalera al cielo', 'Lucha con el ángel', 'Reconciliación con Esaú'],
    interestingFacts: ['Trabajó 14 años por Raquel.', 'Dios le cambió el nombre a Israel.'],
    firstMention: 'Génesis 25:26',
  },
  {
    id: 'isaias_profeta',
    imageUrl: '/assets/encyclopedia/characters/isaias.jpg',
    name: 'Isaías',
    meaning: 'Yahveh es salvación',
    historicalContext: 'Profetizó en Judá durante los reinados de Uzías, Jotam, Acaz y Ezequías.',
    keyEvents: ['Llamamiento en el templo', 'Profecías mesiánicas', 'Advertencias a Ezequías'],
    interestingFacts: ['Conocido como el "Profeta Evangélico".', 'Menciona a Ciro el Grande por nombre 150 años antes de su nacimiento.'],
    firstMention: 'Isaías 1:1',
  },
  {
    id: 'jeremias_profeta',
    imageUrl: '/assets/encyclopedia/characters/jeremias.jpg',
    name: 'Jeremías',
    meaning: 'Yahveh levanta',
    historicalContext: 'Conocido como el profeta llorón. Ministró antes y durante la caída de Jerusalén.',
    keyEvents: ['Llamamiento en su juventud', 'Profecía de los 70 años de exilio', 'Encarcelamiento en la cisterna'],
    interestingFacts: ['Se le prohibió casarse como señal de juicio a Judá.', 'Escribió también el libro de Lamentaciones.'],
    firstMention: 'Jeremías 1:1',
  },
  {
    id: 'ezequiel_profeta',
    imageUrl: '/assets/encyclopedia/characters/ezequiel.jpg',
    name: 'Ezequiel',
    meaning: 'Dios fortalece',
    historicalContext: 'Sacerdote y profeta durante el exilio en Babilonia.',
    keyEvents: ['Visión de los querubines y la gloria de Dios', 'Valle de los huesos secos', 'Visión del nuevo templo'],
    interestingFacts: ['Actuaba sus profecías mediante señales dramáticas.', 'Quedó mudo durante un tiempo por mandato divino.'],
    firstMention: 'Ezequiel 1:3',
  },
  {
    id: 'mateo_apostol',
    imageUrl: '/assets/encyclopedia/characters/mateo.jpg',
    name: 'Mateo (Leví)',
    meaning: 'Don de Dios',
    historicalContext: 'Recaudador de impuestos judío para el Imperio Romano antes de seguir a Jesús.',
    keyEvents: ['Llamamiento por Jesús', 'Banquete en su casa', 'Autoría del primer evangelio'],
    interestingFacts: ['Su profesión lo hacía despreciado por los judíos religiosos.', 'Escribió su evangelio dirigido a los judíos.'],
    firstMention: 'Mateo 9:9',
  },
  {
    id: 'juan_apostol',
    imageUrl: '/assets/encyclopedia/characters/juan-apostol.jpg',
    name: 'Juan (El Amado)',
    meaning: 'Dios es misericordioso',
    historicalContext: 'Pescador, hermano de Jacobo. Parte del círculo íntimo de Jesús.',
    keyEvents: ['Llamamiento', 'En la transfiguración', 'Al pie de la cruz', 'Exilio en Patmos'],
    interestingFacts: ['Se describe a sí mismo como "el discípulo a quien Jesús amaba".', 'La tradición cristiana lo vincula con el Evangelio según Juan, tres cartas y Apocalipsis.'],
    firstMention: 'Marcos 1:19',
  },
  {
    id: 'maria_magdalena',
    imageUrl: '/assets/encyclopedia/characters/maria-magdalena.jpg',
    name: 'María Magdalena',
    meaning: 'María de Magdala',
    historicalContext: 'Mujer de la que Jesús expulsó 7 demonios, devota seguidora.',
    keyEvents: ['Liberación demoníaca', 'Presente en la crucifixión', 'Primera testigo de la resurrección'],
    interestingFacts: ['Ayudaba a financiar el ministerio de Jesús.', 'Jesús le encargó anunciar su resurrección a los apóstoles.'],
    firstMention: 'Lucas 8:2',
  },
  {
    id: 'lazaro',
    imageUrl: '/assets/encyclopedia/characters/lazaro-betania.jpg',
    name: 'Lázaro de Betania',
    meaning: 'Dios ha ayudado',
    historicalContext: 'Hermano de Marta y María, amigo íntimo de Jesús.',
    keyEvents: ['Enfermedad y muerte', 'Resurrección al cuarto día', 'Cena de celebración'],
    interestingFacts: ['Su resurrección fue el milagro que detonó el complot para matar a Jesús.', 'Los fariseos también quisieron matarlo a él por ser testigo del milagro.'],
    firstMention: 'Juan 11:1',
  },
  {
    id: 'esteban',
    imageUrl: '/assets/encyclopedia/characters/esteban.jpg',
    name: 'Esteban',
    meaning: 'Corona / Coronado',
    historicalContext: 'Uno de los 7 diáconos originales de la iglesia primitiva en Jerusalén.',
    keyEvents: ['Elección como diácono', 'Discurso ante el Sanedrín', 'Muerte por apedreamiento'],
    interestingFacts: ['El primer mártir de la iglesia cristiana.', 'Tuvo una visión del cielo abierto y Jesús de pie antes de morir.'],
    firstMention: 'Hechos 6:5',
  },
  {
    id: 'josue_lider',
    imageUrl: '/images/games/characters/josue.webp',
    name: 'Josué',
    meaning: 'Yahveh salva',
    historicalContext: 'Sucesor de Moisés, lideró la conquista de la Tierra Prometida.',
    keyEvents: ['Espía en Canaán', 'Cruce del Jordán', 'Caída de Jericó', 'Repartición de la tierra'],
    interestingFacts: ['Su nombre original era Oseas.', 'Junto a Caleb, fue el único de su generación en entrar a Canaán.'],
    firstMention: 'Éxodo 17:9',
  },
  {
    id: 'ester_reina',
    imageUrl: '/images/games/characters/ester.webp',
    name: 'Ester',
    meaning: 'Estrella',
    historicalContext: 'Joven judía que llegó a ser reina del Imperio Persa bajo el rey Asuero.',
    keyEvents: ['Coronación como reina', 'Descubrimiento del complot de Amán', 'Ayuno de tres días', 'Salvación del pueblo judío'],
    interestingFacts: ['Su nombre hebreo era Hadasa.', 'Instituyó la fiesta de Purim que se celebra hasta hoy.'],
    firstMention: 'Ester 2:7',
  },
  {
    id: 'adan', imageUrl: '/assets/encyclopedia/characters/adan.jpg', name: 'Adán', meaning: 'Humano / hecho de tierra',
    historicalContext: 'En el relato de Génesis, es el primer ser humano y recibe la tarea de cultivar y cuidar el jardín. Su historia introduce la desobediencia y sus consecuencias.',
    keyEvents: ['Creación y encargo en el jardín', 'Nombramiento de los animales', 'Desobediencia junto con Eva', 'Vida fuera del Edén'],
    interestingFacts: ['Génesis vincula su nombre con la palabra hebrea para humanidad y tierra.', 'Las genealogías de Génesis y Lucas trazan su lugar en la historia humana.'], firstMention: 'Génesis 2:7',
  },
  {
    id: 'eva', imageUrl: '/assets/encyclopedia/characters/eva.jpg', name: 'Eva', meaning: 'Vida / madre de todos los vivientes',
    historicalContext: 'Primera mujer del relato de Génesis y compañera de Adán. La narración bíblica la presenta como madre de la humanidad después de la vida en el Edén.',
    keyEvents: ['Creación como compañera de Adán', 'Decisión de comer del fruto prohibido', 'Nacimiento de Caín, Abel y Set'],
    interestingFacts: ['Adán le da el nombre Eva después de la salida del jardín.', 'Su nombre se relaciona en Génesis con la vida.'], firstMention: 'Génesis 2:22',
  },
  {
    id: 'sara', imageUrl: '/assets/encyclopedia/characters/sara.jpg', name: 'Sara', meaning: 'Princesa',
    historicalContext: 'Esposa de Abraham y madre de Isaac. Viajó desde Mesopotamia hacia Canaán y vivió la espera del hijo prometido.',
    keyEvents: ['Viaje con Abraham a Canaán', 'Cambio de nombre de Sarai a Sara', 'Nacimiento de Isaac en su vejez', 'Muerte y sepultura en Macpela'],
    interestingFacts: ['Su historia destaca la promesa de un hijo cuando ella y Abraham ya eran ancianos.', 'El Nuevo Testamento la recuerda como ejemplo de fe.'], firstMention: 'Génesis 11:29',
  },
  {
    id: 'aaron', imageUrl: '/images/games/characters/aaron.webp', name: 'Aarón', meaning: 'Nombre de origen incierto',
    historicalContext: 'Hermano de Moisés y portavoz ante Faraón durante el Éxodo. Fue consagrado como primer sumo sacerdote de Israel.',
    keyEvents: ['Llamado para acompañar a Moisés', 'Señales ante Faraón', 'Consagración sacerdotal', 'El becerro de oro', 'Muerte en el monte Hor'],
    interestingFacts: ['Su vara floreció como señal de la elección sacerdotal.', 'Sus hijos Nadab, Abiú, Eleazar e Itamar también sirvieron como sacerdotes.'], firstMention: 'Éxodo 4:14',
  },
  {
    id: 'abigail', imageUrl: '/images/games/characters/abigail.webp', name: 'Abigail', meaning: 'La alegría de mi padre',
    historicalContext: 'Mujer prudente de Carmel, casada primero con Nabal y luego con David. Intervino para evitar una represalia violenta.',
    keyEvents: ['Encuentro con los mensajeros de David', 'Regalos y palabras que apaciguan a David', 'Matrimonio con David'],
    interestingFacts: ['La narración la describe como inteligente y de buen entendimiento.', 'Su intervención evita que David derrame sangre por venganza.'], firstMention: '1 Samuel 25:3',
  },
  {
    id: 'hagar', imageUrl: '/images/games/characters/agar.webp', name: 'Agar', meaning: 'Extranjera / fugitiva (interpretación tradicional)',
    historicalContext: 'Sierva egipcia de Sara y madre de Ismael. Su relato incluye una huida al desierto y el cuidado de Dios para ella y su hijo.',
    keyEvents: ['Huida al desierto', 'Encuentro con el mensajero de Dios', 'Nacimiento de Ismael', 'Partida con Ismael hacia el desierto'],
    interestingFacts: ['Agar llama a Dios “El-Roi”, el Dios que la ve.', 'Génesis cuenta dos momentos distintos en que recibe promesa y ayuda en el desierto.'], firstMention: 'Génesis 16:1',
  },
  {
    id: 'andres', imageUrl: '/images/games/characters/andres.webp', name: 'Andrés', meaning: 'Varonil / valiente',
    historicalContext: 'Pescador de Galilea, hermano de Simón Pedro y uno de los primeros discípulos llamados por Jesús.',
    keyEvents: ['Sigue primero a Jesús', 'Presenta a Pedro a Jesús', 'Participa en el llamado junto al lago', 'Ayuda a acercar a unos griegos a Jesús'],
    interestingFacts: ['El Evangelio de Juan lo presenta primero como discípulo de Juan el Bautista.', 'En los relatos suele acercar a otras personas a Jesús.'], firstMention: 'Juan 1:40',
  },
  {
    id: 'bartimeo', imageUrl: '/images/games/characters/bartimeo.webp', name: 'Bartimeo', meaning: 'Hijo de Timeo',
    historicalContext: 'Hombre ciego que pedía limosna junto al camino de Jericó. Jesús lo sanó cuando se dirigía a Jerusalén.',
    keyEvents: ['Clama a Jesús desde el camino', 'Recobra la vista', 'Sigue a Jesús por el camino'],
    interestingFacts: ['Marcos conserva su nombre, aunque otros relatos paralelos no lo mencionan.', 'Su petición “Ten misericordia de mí” se repite en el relato.'], firstMention: 'Marcos 10:46',
  },
  {
    id: 'bernabe', imageUrl: '/images/games/characters/bernabe.webp', name: 'Bernabé', meaning: 'Hijo de consolación / aliento',
    historicalContext: 'Levita de Chipre y colaborador destacado de la iglesia de Antioquía. Acompañó a Pablo en el primer viaje misionero.',
    keyEvents: ['Comparte sus bienes con la comunidad', 'Apoya a Pablo ante los apóstoles', 'Sirve en Antioquía', 'Viaja con Pablo y luego con Juan Marcos'],
    interestingFacts: ['Su nombre original era José; los apóstoles lo llamaron Bernabé.', 'Defendió la oportunidad de que Juan Marcos volviera a servir.'], firstMention: 'Hechos 4:36',
  },
  {
    id: 'cornelio', imageUrl: '/images/games/characters/cornelio.webp', name: 'Cornelio', meaning: 'Nombre romano de familia',
    historicalContext: 'Centurión romano en Cesarea, descrito como devoto y generoso. Su encuentro con Pedro marca la acogida explícita de gentiles en la comunidad cristiana.',
    keyEvents: ['Recibe una visión en Cesarea', 'Envía por Pedro', 'Escucha el evangelio con su casa', 'Él y los suyos reciben el Espíritu Santo y el bautismo'],
    interestingFacts: ['La historia de Cornelio aparece en Hechos 10 y se recuerda en Hechos 11 y 15.', 'Su conversión impulsa a la iglesia a reconocer que Dios recibe también a los gentiles.'], firstMention: 'Hechos 10:1',
  },
  {
    id: 'debora', imageUrl: '/images/games/characters/debora.webp', name: 'Débora', meaning: 'Abeja',
    historicalContext: 'Profetisa y jueza de Israel durante la opresión de Jabín, rey cananeo. Convocó a Barac para enfrentar al ejército de Sísara.',
    keyEvents: ['Juzga al pueblo bajo una palmera', 'Llama a Barac', 'Victoria sobre Sísara', 'Canta junto a Barac'],
    interestingFacts: ['El cántico de Débora en Jueces 5 es uno de los poemas más antiguos de la Biblia.', 'Jael completa la derrota de Sísara tras la batalla.'], firstMention: 'Jueces 4:4',
  },
  {
    id: 'esdras_personaje', imageUrl: '/images/games/characters/esdras.webp', name: 'Esdras', meaning: 'Ayuda',
    historicalContext: 'Sacerdote y escriba que regresó de Babilonia a Jerusalén en el período persa. Enseñó la Ley y promovió la renovación de la comunidad.',
    keyEvents: ['Regresa a Jerusalén con un grupo de exiliados', 'Enseña la Ley al pueblo', 'Convoca a la renovación del pacto'],
    interestingFacts: ['Esdras 7 lo presenta como experto en la Ley de Moisés.', 'Nehemías 8 lo muestra leyendo y explicando la Ley en público.'], firstMention: 'Esdras 7:1',
  },
  {
    id: 'gedeon', imageUrl: '/images/games/characters/gedeon.webp', name: 'Gedeón', meaning: 'Talador / guerrero',
    historicalContext: 'Juez de Israel llamado por Dios cuando los madianitas oprimían al pueblo. Su historia enfatiza que la victoria no dependió de un ejército numeroso.',
    keyEvents: ['Llamamiento mientras trilla trigo', 'Señal del vellón', 'Reduce el ejército', 'Derrota a Madián'],
    interestingFacts: ['El ejército se redujo a 300 hombres antes de la batalla.', 'Después de la victoria rechazó ser rey, aunque hizo un efod que llegó a ser tropiezo.'], firstMention: 'Jueces 6:11',
  },
  {
    id: 'jairo', imageUrl: '/images/games/characters/jairo.webp', name: 'Jairo', meaning: 'Él ilumina / despierta',
    historicalContext: 'Dirigente de una sinagoga que pidió ayuda a Jesús por su hija gravemente enferma.',
    keyEvents: ['Pide a Jesús que vaya a su casa', 'Recibe la noticia de la muerte de su hija', 'Presencia cómo Jesús la levanta'],
    interestingFacts: ['El episodio aparece en los tres evangelios sinópticos.', 'La historia se intercala con la sanidad de una mujer que padecía hemorragias.'], firstMention: 'Marcos 5:22',
  },
  {
    id: 'jonas', imageUrl: '/images/games/characters/jonas.webp', name: 'Jonás', meaning: 'Paloma',
    historicalContext: 'Profeta de Gat-hefer enviado a Nínive. Su relato confronta su resistencia a la misión y revela la compasión de Dios hacia la ciudad.',
    keyEvents: ['Huye en dirección opuesta', 'Es arrojado al mar y tragado por un gran pez', 'Predica en Nínive', 'Aprende sobre la compasión divina'],
    interestingFacts: ['2 Reyes 14:25 menciona a Jonás hijo de Amitai como profeta en Israel.', 'Jesús usa la señal de Jonás al hablar de su muerte y resurrección.'], firstMention: '2 Reyes 14:25',
  },
  {
    id: 'felipe_evangelista', imageUrl: '/images/games/characters/felipe-el-evangelista.webp', name: 'Felipe el evangelista', meaning: 'Amigo de los caballos',
    historicalContext: 'Uno de los siete servidores escogidos en Jerusalén. Anunció el evangelio en Samaria y explicó las Escrituras a un funcionario etíope.',
    keyEvents: ['Elegido entre los siete', 'Predica en Samaria', 'Bautiza al funcionario etíope', 'Evangeliza en ciudades costeras'],
    interestingFacts: ['Hechos 21:8 lo llama “Felipe el evangelista”.', 'Su relato enlaza la expansión del mensaje desde Samaria hacia otros pueblos.'], firstMention: 'Hechos 6:5',
  },
  {
    id: 'lidia', imageUrl: '/images/games/characters/lidia.webp', name: 'Lidia', meaning: 'Mujer de Lidia',
    historicalContext: 'Vendedora de púrpura originaria de Tiatira que vivía en Filipos. Escuchó a Pablo y ofreció hospitalidad a los misioneros.',
    keyEvents: ['Escucha a Pablo junto al río', 'Recibe el mensaje y es bautizada con su casa', 'Hospeda a Pablo y sus compañeros'],
    interestingFacts: ['Su casa se convierte en lugar de encuentro para la comunidad de Filipos.', 'Es la primera conversión narrada durante la misión de Pablo en esa ciudad.'], firstMention: 'Hechos 16:14',
  },
  {
    id: 'matias', imageUrl: '/images/games/characters/matias.webp', name: 'Matías', meaning: 'Don de Dios',
    historicalContext: 'Discípulo que fue elegido para ocupar el lugar de Judas Iscariote entre los Doce, antes de Pentecostés.',
    keyEvents: ['Es presentado entre los candidatos', 'Es elegido mediante oración y sorteo'],
    interestingFacts: ['Hechos indica que había acompañado a Jesús desde el bautismo de Juan hasta la ascensión.', 'Es la última elección de un apóstol narrada en Hechos.'], firstMention: 'Hechos 1:23',
  },
  {
    id: 'micaias_imla', imageUrl: '/images/games/characters/micaias-hijo-de-imla.webp', name: 'Micaías hijo de Imla', meaning: '¿Quién como Yahveh?',
    historicalContext: 'Profeta de Israel que habló con franqueza ante Acab y Josafat cuando otros profetas anunciaban una victoria segura.',
    keyEvents: ['Es convocado desde la prisión', 'Anuncia la derrota de Acab', 'Describe la visión del consejo celestial'],
    interestingFacts: ['Su relato contrasta la palabra profética con los mensajes que el rey deseaba oír.', 'Acab ordenó devolverlo a prisión y darle ración escasa.'], firstMention: '1 Reyes 22:8',
  },
  {
    id: 'miriam', imageUrl: '/images/games/characters/miriam.webp', name: 'Miriam', meaning: 'Significado discutido',
    historicalContext: 'Hermana de Moisés y Aarón, profetisa que acompañó a Israel durante el éxodo y el camino por el desierto.',
    keyEvents: ['Vigila a Moisés cuando es bebé', 'Dirige el canto tras cruzar el mar', 'Es reprendida en el desierto', 'Muere en Cades'],
    interestingFacts: ['Éxodo la identifica como profetisa y menciona su pandero.', 'Miqueas 6:4 recuerda a Miriam junto con Moisés y Aarón como líderes del éxodo.'], firstMention: 'Éxodo 2:4',
  },
  {
    id: 'naaman', imageUrl: '/images/games/characters/naaman.webp', name: 'Naamán', meaning: 'Agradable / placentero',
    historicalContext: 'Comandante del ejército de Siria que padecía una enfermedad de la piel. Fue enviado al profeta Eliseo por recomendación de una joven israelita.',
    keyEvents: ['Busca sanidad en Israel', 'Se resiste a bañarse en el Jordán', 'Se sumerge siete veces y queda limpio', 'Confiesa al Dios de Israel'],
    interestingFacts: ['La historia resalta la humildad y obediencia como respuesta a la palabra de Dios.', 'Jesús menciona a Naamán al hablar de la gracia ofrecida a extranjeros.'], firstMention: '2 Reyes 5:1',
  },
  {
    id: 'nicodemo', imageUrl: '/images/games/characters/nicodemo.webp', name: 'Nicodemo', meaning: 'Victoria del pueblo',
    historicalContext: 'Fariseo y dirigente judío que conversó con Jesús de noche. Más tarde intervino en su defensa y participó en su sepultura.',
    keyEvents: ['Conversación sobre el nuevo nacimiento', 'Pide que Jesús sea escuchado con justicia', 'Ayuda a preparar el cuerpo de Jesús'],
    interestingFacts: ['Juan 3 contiene el diálogo donde aparece la enseñanza “nacer de nuevo”.', 'Su evolución narrativa va de una visita privada a una intervención pública y al servicio en la sepultura.'], firstMention: 'Juan 3:1',
  },
  {
    id: 'onesimo', imageUrl: '/images/games/characters/onesimo.webp', name: 'Onésimo', meaning: 'Útil / provechoso',
    historicalContext: 'Persona vinculada a Filemón que llegó a ser colaborador de Pablo. La carta a Filemón pide recibirlo como hermano en Cristo.',
    keyEvents: ['Se encuentra con Pablo', 'Es enviado de regreso con la carta a Filemón', 'Es reconocido como hermano y colaborador'],
    interestingFacts: ['Pablo juega con el significado de su nombre al llamarlo útil.', 'La carta no detalla todos los pormenores de su pasado, por lo que conviene evitar afirmaciones no escritas en el texto.'], firstMention: 'Filemón 1:10',
  },
  {
    id: 'priscila', imageUrl: '/images/games/characters/priscila.webp', name: 'Priscila', meaning: 'Antigua / venerable',
    historicalContext: 'Colaboradora cristiana, esposa de Aquila y compañera de trabajo y misión de Pablo. Junto con su esposo ayudó a Apolos a comprender mejor el camino de Dios.',
    keyEvents: ['Conoce a Pablo en Corinto', 'Trabaja junto a Aquila', 'Instruye a Apolos en Éfeso', 'Es saludada por Pablo en sus cartas'],
    interestingFacts: ['En varias menciones su nombre aparece antes que el de Aquila.', 'La pareja abrió su casa para reuniones de la iglesia.'], firstMention: 'Hechos 18:2',
  },
  {
    id: 'simeon_jerusalen', imageUrl: '/images/games/characters/simeon-de-jerusalen.webp', name: 'Simeón', meaning: 'Dios ha oído',
    historicalContext: 'Hombre justo y piadoso de Jerusalén que esperaba el consuelo de Israel. Reconoció al niño Jesús cuando fue presentado en el templo.',
    keyEvents: ['Es guiado al templo por el Espíritu', 'Toma a Jesús en brazos', 'Pronuncia una bendición y una profecía sobre María'],
    interestingFacts: ['El cántico de Simeón se conoce tradicionalmente como Nunc dimittis.', 'Lucas dice que esperaba ver al Mesías antes de morir.'], firstMention: 'Lucas 2:25',
  },
  {
    id: 'timoteo', imageUrl: '/images/games/characters/timoteo.webp', name: 'Timoteo', meaning: 'El que honra a Dios',
    historicalContext: 'Discípulo de Listra, hijo de madre judía creyente y padre griego. Fue compañero de misión de Pablo y recibió dos cartas pastorales.',
    keyEvents: ['Se une al equipo misionero de Pablo', 'Es enviado a fortalecer iglesias', 'Recibe consejos pastorales en las cartas'],
    interestingFacts: ['Su fe fue transmitida por su abuela Loida y su madre Eunice.', 'Pablo lo llama su hijo en la fe y destaca su servicio probado.'], firstMention: 'Hechos 16:1',
  },
  {
    id: 'zaqueo', imageUrl: '/images/games/characters/zaqueo.webp', name: 'Zaqueo', meaning: 'Puro / justo',
    historicalContext: 'Jefe de recaudadores de impuestos en Jericó. Quiso ver a Jesús y respondió a su encuentro con arrepentimiento y restitución.',
    keyEvents: ['Sube a un sicómoro para ver a Jesús', 'Recibe a Jesús en su casa', 'Promete devolver y compartir sus bienes'],
    interestingFacts: ['Lucas es el único evangelio que relata su encuentro.', 'Jesús declara que la salvación llegó a su casa.'], firstMention: 'Lucas 19:2',
  },
  {
    id: 'marta', imageUrl: '/images/games/characters/marta.webp', name: 'Marta', meaning: 'Señora / ama de casa',
    historicalContext: 'Hermana de María y Lázaro, amiga de Jesús y anfitriona en Betania. En el Evangelio de Juan expresa su fe antes de la resurrección de Lázaro.',
    keyEvents: ['Recibe a Jesús en su casa', 'Conversación sobre el servicio y la escucha', 'Confiesa que Jesús es el Cristo', 'Presencia la resurrección de Lázaro'],
    interestingFacts: ['Lucas y Juan ofrecen retratos complementarios de su relación con Jesús.', 'Su confesión en Juan 11 precede a la salida de Lázaro de la tumba.'], firstMention: 'Lucas 10:38',
  }
];

export const biblePlaces: BiblePlace[] = [
  {
    id: 'jerusalen',
    imageUrl: '/assets/encyclopedia/places/jerusalem.png',
    name: 'Jerusalén',
    location: 'Montañas de Judea, entre el Mediterráneo y el Mar Muerto.',
    significance: 'El centro espiritual y político del judaísmo bíblico, y el lugar central de los eventos de redención en el Nuevo Testamento.',
    keyEvents: ['Capturada por David', 'Construcción del Templo por Salomón', 'Destruida por Babilonia (586 a.C.)', 'Crucifixión y resurrección de Jesús', 'Día de Pentecostés'],
    interestingFacts: [
      'Se menciona más de 800 veces en la Biblia.',
      'Su nombre significa "Ciudad de Paz".',
      'Apocalipsis describe una "Nueva Jerusalén" descendiendo del cielo.'
    ],
    firstMention: 'Josué 10:1'
  },
  {
    id: 'eden',
    imageUrl: '/assets/encyclopedia/places/eden.png',
    name: 'Edén',
    location: 'Desconocida exactamente; la Biblia menciona que de él salían cuatro ríos (Pisón, Gihón, Hidekel, y Éufrates).',
    significance: 'El jardín paradisíaco original creado por Dios para el hombre.',
    keyEvents: ['Creación de Adán y Eva', 'El engaño de la serpiente', 'La Caída del hombre', 'Expulsión de Adán y Eva'],
    interestingFacts: [
      'Contenía el Árbol de la Vida y el Árbol del Conocimiento del Bien y del Mal.',
      'Fue custodiado por querubines y una espada llameante tras la expulsión humana.',
      'La palabra "Edén" significa "delicia" o "placer".'
    ],
    firstMention: 'Génesis 2:8'
  },
  {
    id: 'babilonia',
    imageUrl: '/assets/encyclopedia/places/babilonia.png',
    name: 'Babilonia',
    location: 'Mesopotamia, a orillas del río Éufrates (actual Irak).',
    significance: 'Símbolo del orgullo y rebelión humana contra Dios. Imperio que exilió a los judíos.',
    keyEvents: ['La Torre de Babel', 'Cautiverio babilónico de Judá', 'Ministerio de Daniel', 'Caída ante los medopersas'],
    interestingFacts: [
      'Fue famosa por sus Jardines Colgantes y gruesos muros.',
      'En Apocalipsis, "Babilonia" representa un sistema mundial corrupto.',
      'El rey Nabucodonosor fue su gobernante más prominente.'
    ],
    firstMention: 'Génesis 10:10'
  },
  {
    id: 'egipto',
    name: 'Egipto',
    location: 'Noreste de África, a lo largo del río Nilo.',
    significance: 'Un lugar de refugio (para Abraham, Jacob, y Jesús) pero también un lugar de esclavitud y opresión para Israel.',
    keyEvents: ['Venta de José como esclavo', 'Esclavitud de los hebreos', 'Las diez plagas', 'El Éxodo', 'Refugio de la sagrada familia'],
    interestingFacts: [
      'Gobernado por faraones, muchos de los cuales se consideraban divinos.',
      'A menudo se usa como símbolo del mundo y el pecado de los cuales Dios libera a su pueblo.',
      'Su geografía dependía totalmente del río Nilo para sobrevivir.'
    ],
    firstMention: 'Génesis 12:10'
  },
  {
    id: 'belen',
    name: 'Belén',
    location: 'A unos 9 km al sur de Jerusalén, en la región montañosa de Judea.',
    significance: 'El lugar de nacimiento de Jesucristo, cumpliendo la profecía de Miqueas 5:2.',
    keyEvents: ['Muerte de Raquel', 'Historia de Rut y Booz', 'Nacimiento de David y su unción', 'Nacimiento de Jesús', 'Adoración de los pastores y magos'],
    interestingFacts: [
      'El nombre "Belén" (Beth-Lehem) significa "Casa de Pan".',
      'También se le llamaba la "Ciudad de David".',
      'Fue el escenario de la trágica matanza de los inocentes por Herodes.'
    ],
    firstMention: 'Génesis 35:19'
  },
  {
    id: 'nazaret',
    name: 'Nazaret',
    location: 'Baja Galilea, al norte de Israel.',
    significance: 'El pueblo donde Jesús creció y pasó la mayor parte de su vida antes de iniciar su ministerio.',
    keyEvents: ['La Anunciación a María', 'Infancia y juventud de Jesús', 'Rechazo de Jesús en la sinagoga'],
    interestingFacts: [
      'Tenía una mala reputación en la época bíblica ("¿De Nazaret puede salir algo bueno?" - Juan 1:46).',
      'No se menciona en el Antiguo Testamento ni en el Talmud judío antiguo.',
      'Los seguidores de Jesús fueron llamados "nazarenos".'
    ],
    firstMention: 'Mateo 2:23'
  },
  {
    id: 'galilea',
    name: 'Mar de Galilea',
    location: 'Valle del Jordán, norte de Israel.',
    significance: 'El principal centro del ministerio público de Jesucristo.',
    keyEvents: ['Llamamiento de los pescadores', 'Calma de la tormenta', 'Jesús camina sobre el agua', 'Pescas milagrosas'],
    interestingFacts: [
      'Es un lago de agua dulce, no un mar (también llamado Mar de Tiberíades o Lago de Genesaret).',
      'Está situado a 212 metros bajo el nivel del mar, siendo el lago de agua dulce más bajo del mundo.',
      'Es famoso por sus repentinas y violentas tormentas.'
    ],
    firstMention: 'Números 34:11'
  },
  {
    id: 'sinai',
    name: 'Monte Sinaí',
    location: 'Península del Sinaí (ubicación exacta debatida, tradicionalmente Jebel Musa).',
    significance: 'Lugar donde Dios estableció su pacto con Israel y entregó la Ley.',
    keyEvents: ['La zarza ardiente', 'Entrega de los Diez Mandamientos', 'Adoración del becerro de oro', 'Construcción del Tabernáculo'],
    interestingFacts: [
      'También se le conoce como Horeb.',
      'Dios descendió sobre él en fuego, humo y temblores.',
      'El profeta Elías huyó a este monte siglos después.'
    ],
    firstMention: 'Éxodo 16:1'
  },
  {
    id: 'jordan',
    name: 'Río Jordán',
    location: 'Atraviesa la falla siro-africana, desde el Monte Hermón hasta el Mar Muerto.',
    significance: 'Frontera natural de la Tierra Prometida y un lugar de transiciones y milagros.',
    keyEvents: ['Cruce liderado por Josué', 'Ascensión de Elías al cielo', 'Curación de Naamán el sirio', 'Bautismo de Jesús por Juan'],
    interestingFacts: [
      'Juan el Bautista realizaba la mayoría de sus bautismos allí.',
      'Su nombre significa "el que desciende".',
      'Sus aguas se detuvieron milagrosamente para que Israel lo cruzara en tierra seca.'
    ],
    firstMention: 'Génesis 13:10'
  },
  {
    id: 'capernaum',
    name: 'Capernaúm',
    location: 'Orilla noroeste del Mar de Galilea.',
    significance: 'El "cuartel general" del ministerio de Jesús en Galilea, adoptada como "su propia ciudad".',
    keyEvents: ['Sanidad de la suegra de Pedro', 'Curación del paralítico bajado por el techo', 'Sermón del Pan de Vida', 'Curación del siervo del centurión'],
    interestingFacts: [
      'A pesar de los muchos milagros allí, Jesús pronunció ayes contra la ciudad por su falta de arrepentimiento.',
      'Albergaba una guarnición militar romana y una aduana donde trabajaba Mateo.',
      'Hoy en día solo quedan ruinas de lo que fue un próspero pueblo pesquero.'
    ],
    firstMention: 'Mateo 4:13'
  }
,

  {
    id: 'jerico',
    name: 'Jericó',
    location: 'Valle del Jordán, cerca del Mar Muerto.',
    significance: 'Una de las ciudades habitadas más antiguas del mundo, puerta de entrada a la Tierra Prometida.',
    keyEvents: ['Caída de sus muros bajo Josué', 'Curación del ciego Bartimeo', 'Conversión de Zaqueo'],
    interestingFacts: ['Sus muros cayeron al sonido de las trompetas y los gritos de Israel.', 'Elisa sanó sus aguas.'],
    firstMention: 'Números 22:1',
  },
  {
    id: 'montecarmelo',
    name: 'Monte Carmelo',
    location: 'Cadena montañosa costera en el norte de Israel.',
    significance: 'Símbolo de belleza y fertilidad. Sitio del enfrentamiento entre Yahveh y Baal.',
    keyEvents: ['Desafío de Elías a los profetas de Baal', 'Oración por lluvia tras la sequía'],
    interestingFacts: ['Su nombre significa "viña de Dios".', 'Refugio tradicional para profetas y ermitaños.'],
    firstMention: 'Josué 12:22',
  },
  {
    id: 'marmuerto',
    name: 'Mar Muerto',
    location: 'Frontera oriental de Judá.',
    significance: 'El punto más bajo de la tierra. Símbolo de juicio (Sodoma y Gomorra).',
    keyEvents: ['Destrucción de Sodoma y Gomorra en sus alrededores', 'Visión profética de Ezequiel de aguas sanadoras'],
    interestingFacts: ['Es unas 10 veces más salado que los océanos, impidiendo la vida acuática.', 'Famoso por los rollos de Qumrán encontrados en cuevas cercanas.'],
    firstMention: 'Génesis 14:3',
  },
  {
    id: 'samaria',
    name: 'Samaria',
    location: 'Región central entre Judea y Galilea.',
    significance: 'Capital del Reino del Norte. Sus habitantes (samaritanos) eran despreciados por los judíos.',
    keyEvents: ['Caída ante Asiria', 'Encuentro de Jesús con la mujer samaritana', 'Avivamiento predicado por Felipe'],
    interestingFacts: ['Los samaritanos construyeron su propio templo en el Monte Gerizim.', 'Jesús los puso como ejemplo de amor al prójimo en una parábola.'],
    firstMention: '1 Reyes 16:24',
  },
  {
    id: 'betania',
    name: 'Betania',
    location: 'Aldea en la ladera este del Monte de los Olivos, a 3 km de Jerusalén.',
    significance: 'Refugio pacífico para Jesús cerca de Jerusalén. Hogar de Lázaro, Marta y María.',
    keyEvents: ['Resurrección de Lázaro', 'Ungimiento de Jesús por María', 'Ascensión de Cristo (cercanías)'],
    interestingFacts: ['Jesús se hospedaba aquí durante la semana de la crucifixión.', 'Significa "casa del pobre" o "casa de higos".'],
    firstMention: 'Mateo 21:17',
  },
  {
    id: 'antioquia',
    name: 'Antioquía (de Siria)',
    location: 'A orillas del río Orontes, actual Turquía.',
    significance: 'Centro principal del cristianismo gentil y base misionera de Pablo.',
    keyEvents: ['Primer lugar donde los discípulos fueron llamados "cristianos"', 'Iglesia base de Pablo y Bernabé'],
    interestingFacts: ['Era la tercera ciudad más grande del Imperio Romano.', 'La primera iglesia verdaderamente multiétnica de la antigüedad.'],
    firstMention: 'Hechos 6:5',
  },
  {
    id: 'efeso',
    name: 'Éfeso',
    location: 'Costa occidental de Asia Menor (Turquía).',
    significance: 'Importante centro comercial y religioso. Sede del Templo de Artemisa.',
    keyEvents: ['Ministerio de 3 años de Pablo', 'Disturbios de los plateros', 'Destinataria de una carta paulina y del Apocalipsis'],
    interestingFacts: ['El Apóstol Juan vivió y pastoreó allí en sus últimos años.', 'Una de las Siete Iglesias de Apocalipsis, acusada de "perder su primer amor".'],
    firstMention: 'Hechos 18:19',
  },
  {
    id: 'roma',
    name: 'Roma',
    location: 'Capital del Imperio Romano (Península itálica).',
    significance: 'Centro del poder político y de severas persecuciones a los cristianos.',
    keyEvents: ['Encarcelamiento de Pablo', 'Martirio de Pedro y Pablo', 'Destinataria de la epístola a los Romanos'],
    interestingFacts: ['Todos los caminos llevaban a Roma, facilitando la expansión del evangelio.', 'Sufrió un gran incendio bajo Nerón, del cual se culpó a los cristianos.'],
    firstMention: 'Hechos 2:10',
  },
  {
    id: 'corinto',
    name: 'Corinto',
    location: 'Grecia, en el istmo de Corinto.',
    significance: 'Ciudad portuaria rica y sumamente inmoral.',
    keyEvents: ['Pablo trabajó allí haciendo tiendas', 'Destinataria de dos epístolas paulinas'],
    interestingFacts: ['Conocida por el templo de Afrodita y sus mil prostitutas sagradas.', '"Vivir como un corintio" era sinónimo de inmoralidad en la antigüedad.'],
    firstMention: 'Hechos 18:1',
  },
  {
    id: 'monte_olivos',
    name: 'Monte de los Olivos',
    location: 'Al este de Jerusalén, separado por el valle del Cedrón.',
    significance: 'Lugar de profunda agonía espiritual y enseñanza de Jesús.',
    keyEvents: ['Entrada triunfal', 'Discurso de los Olivos', 'Agonía en Getsemaní', 'Ascensión'],
    interestingFacts: ['Zacarías profetiza que el Mesías pondrá sus pies en este monte a su regreso.', 'Aún hoy está lleno de antiguos olivos, algunos quizás de la época romana.'],
    firstMention: '2 Samuel 15:30',
  },
  {
    id: 'ninive',
    name: 'Nínive',
    location: 'A orillas del río Tigris, capital del antiguo Imperio Asirio.',
    significance: 'Ciudad enemiga de Israel conocida por su crueldad, objeto de la misión de Jonás.',
    keyEvents: ['Predicación de Jonás', 'Arrepentimiento de toda la ciudad', 'Profecía de su destrucción por Nahúm'],
    interestingFacts: ['Era tan grande que tomaba tres días recorrerla.', 'Finalmente fue destruida por babilonios y medos en 612 a.C.'],
    firstMention: 'Génesis 10:11',
  },
  {
    id: 'patmos',
    name: 'Isla de Patmos',
    location: 'Pequeña isla volcánica en el Mar Egeo, frente a la costa de Turquía.',
    significance: 'Lugar de exilio donde el apóstol Juan recibió la revelación del Apocalipsis.',
    keyEvents: ['Exilio de Juan', 'Visión del Cristo glorificado', 'Recepción del libro de Apocalipsis'],
    interestingFacts: ['El exilio fue bajo el emperador Domiciano.', 'Hoy en día se conoce como la "Jerusalén del Egeo".'],
    firstMention: 'Apocalipsis 1:9',
  }
];

export const bibleBooks: BibleBookInfo[] = [
  { id: 'genesis', name: 'Génesis', testament: 'Antiguo Testamento', group: 'Pentateuco', author: 'Moisés', dateWritten: '~1440-1400 a.C.', historicalContext: 'Desde la creación del mundo hasta la muerte de José en Egipto.', keyThemes: ['Creación', 'Caída', 'Diluvio', 'Patriarcas (Abraham, Isaac, Jacob, José)', 'Pacto de Dios'], chapters: 50, interestingFacts: ['Génesis significa "origen" o "principio".', 'Contiene las primeras promesas mesiánicas (Gn. 3:15).'] },
  { id: 'exodo', name: 'Éxodo', testament: 'Antiguo Testamento', group: 'Pentateuco', author: 'Moisés', dateWritten: '~1440-1400 a.C.', historicalContext: 'La esclavitud en Egipto y la liberación de Israel hacia el Sinaí.', keyThemes: ['Liberación', 'Las Diez Plagas', 'El Éxodo', 'La Ley (Sinaí)', 'El Tabernáculo'], chapters: 40, interestingFacts: ['Éxodo significa "salida".', 'Introduce a Dios revelando su nombre personal, YAHVEH (Yo Soy el que Soy).'] },
  { id: 'levitico', name: 'Levítico', testament: 'Antiguo Testamento', group: 'Pentateuco', author: 'Moisés', dateWritten: '~1440-1400 a.C.', historicalContext: 'Israel acampado al pie del Monte Sinaí.', keyThemes: ['Santidad', 'Sacrificios', 'Sacerdocio', 'Pureza ceremonial', 'Fiestas solemnes'], chapters: 27, interestingFacts: ['El tema principal es "Sed santos, porque yo soy santo".', 'Contiene el mandato de "Amar a tu prójimo como a ti mismo" (Lv 19:18).'] },
  { id: 'numeros', name: 'Números', testament: 'Antiguo Testamento', group: 'Pentateuco', author: 'Moisés', dateWritten: '~1440-1400 a.C.', historicalContext: 'El viaje de 40 años por el desierto desde el Sinaí hasta Moab.', keyThemes: ['Censos de Israel', 'Rebelión en Cades Barnea', 'Desierto', 'La serpiente de bronce'], chapters: 36, interestingFacts: ['El nombre se debe a los dos censos realizados a los israelitas.', 'Registra la historia de Balaam y su asna que habla.'] },
  { id: 'deuteronomio', name: 'Deuteronomio', testament: 'Antiguo Testamento', group: 'Pentateuco', author: 'Moisés', dateWritten: '~1400 a.C.', historicalContext: 'Las llanuras de Moab, justo antes de entrar a la Tierra Prometida.', keyThemes: ['Repaso de la Ley', 'El Shemá', 'Bendiciones y Maldiciones', 'Muerte de Moisés'], chapters: 34, interestingFacts: ['Significa "Segunda Ley".', 'Es el libro del Antiguo Testamento que más citó Jesús.'] },
  
  { id: 'josue', name: 'Josué', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Josué (probablemente)', dateWritten: '~1370 a.C.', historicalContext: 'La conquista y división de Canaán.', keyThemes: ['Conquista', 'Jericó', 'Repartición de tierras', 'Fidelidad de Dios'], chapters: 24, interestingFacts: ['Josué es la forma hebrea de "Jesús", que significa "Yahveh salva".', 'Narra cómo el sol se detuvo durante una batalla.'] },
  { id: 'jueces', name: 'Jueces', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Samuel (tradicional)', dateWritten: '~1050-1000 a.C.', historicalContext: 'Período caótico entre la conquista y la monarquía.', keyThemes: ['Ciclos de apostasía', 'Opresión y liberación', 'Gedeón', 'Sansón'], chapters: 21, interestingFacts: ['El libro concluye diciendo: "Cada uno hacía lo que bien le parecía".', 'Registra las hazañas de 12 jueces diferentes.'] },
  { id: 'rut', name: 'Rut', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Desconocido (quizás Samuel)', dateWritten: '~1000 a.C.', historicalContext: 'Durante la época de los jueces.', keyThemes: ['Redención', 'Lealtad', 'Providencia divina', 'Linaje de David'], chapters: 4, interestingFacts: ['Es uno de los dos únicos libros bíblicos que llevan el nombre de una mujer.', 'Presenta el concepto clave del "pariente redentor" (Goel).'] },
  { id: '1-samuel', name: '1 Samuel', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Desconocido', dateWritten: '~930 a.C.', historicalContext: 'Transición de los jueces a la monarquía (Saúl y luego David).', keyThemes: ['Ministerio de Samuel', 'Reinado de Saúl', 'Juventud de David', 'Ascenso y caída de líderes'], chapters: 31, interestingFacts: ['Registra la famosa batalla entre David y Goliat.', 'Originalmente, 1 y 2 Samuel eran un solo rollo.'] },
  { id: '2-samuel', name: '2 Samuel', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Desconocido', dateWritten: '~930 a.C.', historicalContext: 'El reinado del rey David.', keyThemes: ['Pacto davídico', 'Capital en Jerusalén', 'Pecado con Betsabé', 'Rebelión de Absalón'], chapters: 24, interestingFacts: ['El pacto de Dios con David (capítulo 7) es fundamental para entender el mesianismo.', 'Muestra los triunfos de David pero expone honestamente sus fracasos morales.'] },
  { id: '1-reyes', name: '1 Reyes', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Jeremías (tradicional)', dateWritten: '~560-550 a.C.', historicalContext: 'Desde Salomón hasta la división del reino.', keyThemes: ['Reinado de Salomón', 'Construcción del Templo', 'División del Reino', 'Ministerio de Elías'], chapters: 22, interestingFacts: ['Narra el desafío de Elías a los profetas de Baal en el monte Carmelo.', 'Muestra cómo la idolatría condujo a la ruina de las naciones.'] },
  { id: '2-reyes', name: '2 Reyes', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Jeremías (tradicional)', dateWritten: '~560-550 a.C.', historicalContext: 'La historia de los dos reinos hasta sus respectivos exilios.', keyThemes: ['Ministerio de Eliseo', 'Decadencia espiritual', 'Exilio de Israel (722 a.C.)', 'Exilio de Judá (586 a.C.)'], chapters: 25, interestingFacts: ['Registra la historia del rey Ezequías y el rey Josías, dos de los reyes buenos de Judá.', 'Termina con la destrucción total de Jerusalén.'] },
  { id: '1-cronicas', name: '1 Crónicas', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Esdras (tradicional)', dateWritten: '~450-400 a.C.', historicalContext: 'Desde Adán hasta la muerte de David (escrito post-exilio).', keyThemes: ['Genealogías', 'La adoración en el templo', 'El reinado piadoso de David'], chapters: 29, interestingFacts: ['Los primeros 9 capítulos son extensas genealogías.', 'Se enfoca casi exclusivamente en Judá y el templo, omitiendo los fracasos morales de David.'] },
  { id: '2-cronicas', name: '2 Crónicas', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Esdras (tradicional)', dateWritten: '~450-400 a.C.', historicalContext: 'Desde el reinado de Salomón hasta el decreto de Ciro (post-exilio).', keyThemes: ['Reinado de Salomón', 'Los reyes de Judá', 'Reformas religiosas', 'El Templo'], chapters: 36, interestingFacts: ['Contiene el famoso versículo 2 Crónicas 7:14 sobre el arrepentimiento y la sanidad de la tierra.', 'Termina con un mensaje de esperanza: el edicto para reconstruir el templo.'] },
  { id: 'esdras', name: 'Esdras', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Esdras', dateWritten: '~450-400 a.C.', historicalContext: 'El regreso de los judíos del exilio babilónico y la reconstrucción del Templo.', keyThemes: ['El regreso', 'Reconstrucción del Templo', 'Restauración de la adoración', 'Oposición'], chapters: 10, interestingFacts: ['Originalmente un solo libro junto con Nehemías.', 'Registra dos olas de regreso: bajo Zorobabel y luego bajo Esdras.'] },
  { id: 'nehemias', name: 'Nehemías', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Nehemías / Esdras', dateWritten: '~425 a.C.', historicalContext: 'La tercera ola de regreso y la reconstrucción del muro de Jerusalén.', keyThemes: ['Reconstrucción de muros', 'Liderazgo', 'Renovación del pacto'], chapters: 13, interestingFacts: ['El muro fue reconstruido en solo 52 días a pesar de intensa oposición.', 'Nehemías era el copero del rey persa Artajerjes.'] },
  { id: 'ester', name: 'Ester', testament: 'Antiguo Testamento', group: 'Históricos', author: 'Desconocido', dateWritten: '~470-460 a.C.', historicalContext: 'La corte persa bajo el rey Asuero (Jerjes) durante el exilio.', keyThemes: ['Providencia de Dios', 'Salvación de los judíos', 'Valentía', 'Fiesta de Purim'], chapters: 10, interestingFacts: ['Es uno de los dos libros bíblicos donde el nombre de "Dios" no se menciona explícitamente.', 'Da origen a la festividad judía de Purim.'] },

  { id: 'job', name: 'Job', testament: 'Antiguo Testamento', group: 'Poéticos', author: 'Desconocido', dateWritten: 'Posiblemente época patriarcal', historicalContext: 'Tierra de Uz, probablemente durante o antes de los tiempos patriarcales.', keyThemes: ['Sufrimiento', 'Soberanía de Dios', 'Fe en la prueba', 'Justicia divina'], chapters: 42, interestingFacts: ['Considerado a menudo como el libro más antiguo de la Biblia.', 'Plantea el problema del sufrimiento de los inocentes.'] },
  { id: 'salmos', name: 'Salmos', testament: 'Antiguo Testamento', group: 'Poéticos', author: 'David, Asaf, Coré, Salomón, Moisés', dateWritten: 'Abarca desde 1440 hasta 586 a.C.', historicalContext: 'Diferentes períodos de la historia de Israel.', keyThemes: ['Adoración', 'Alabanza', 'Lamento', 'Profecías mesiánicas'], chapters: 150, interestingFacts: ['Es el libro más largo de la Biblia.', 'El Salmo 119 es el capítulo más largo y es un acróstico hebreo.', 'El Salmo 117 es el capítulo más corto.'] },
  { id: 'proverbios', name: 'Proverbios', testament: 'Antiguo Testamento', group: 'Poéticos', author: 'Salomón, Agur, Lemuel', dateWritten: '~970-700 a.C.', historicalContext: 'Instrucciones para la vida diaria de los jóvenes de Israel.', keyThemes: ['Sabiduría vs. Necedad', 'Temor de Dios', 'Instrucción moral'], chapters: 31, interestingFacts: ['Personifica a la Sabiduría como una mujer que llama en las calles.', 'El capítulo 31 describe a la "mujer virtuosa".'] },
  { id: 'eclesiastes', name: 'Eclesiastés', testament: 'Antiguo Testamento', group: 'Poéticos', author: 'Salomón (tradicional)', dateWritten: '~935 a.C.', historicalContext: 'Reflexiones de un rey sabio al final de su vida.', keyThemes: ['Futilidad (Vanidad)', 'Sentido de la vida', 'Disfrute de los dones de Dios'], chapters: 12, interestingFacts: ['Usa frecuentemente la frase "debajo del sol" para describir la perspectiva terrenal.', 'Concluye que el propósito de la vida es temer a Dios y guardar sus mandamientos.'] },
  { id: 'cantares', name: 'Cantar de los Cantares', testament: 'Antiguo Testamento', group: 'Poéticos', author: 'Salomón', dateWritten: '~965 a.C.', historicalContext: 'Un poema de amor entre un esposo y su esposa.', keyThemes: ['Amor marital', 'Intimidad', 'Belleza del amor humano'], chapters: 8, interestingFacts: ['Alegóricamente, ha sido interpretado como el amor de Dios por Israel o de Cristo por su Iglesia.', 'No menciona explícitamente a Dios.'] },

  { id: 'isaias', name: 'Isaías', testament: 'Antiguo Testamento', group: 'Profetas Mayores', author: 'Isaías', dateWritten: '~740-680 a.C.', historicalContext: 'Ministró en Judá durante los reinados de Uzías, Jotam, Acaz y Ezequías.', keyThemes: ['Juicio', 'Consuelo', 'El Mesías venidero', 'El Siervo Sufriente'], chapters: 66, interestingFacts: ['Llamado "el Quinto Evangelio" por sus detalladas profecías mesiánicas (especialmente el cap. 53).', 'Tiene la misma estructura que la Biblia (39 capítulos de juicio, 27 de consuelo).'] },
  { id: 'jeremias', name: 'Jeremías', testament: 'Antiguo Testamento', group: 'Profetas Mayores', author: 'Jeremías', dateWritten: '~627-586 a.C.', historicalContext: 'Las últimas décadas antes de la caída de Jerusalén ante Babilonia.', keyThemes: ['Arrepentimiento', 'Juicio inminente', 'El Nuevo Pacto'], chapters: 52, interestingFacts: ['Conocido como el "Profeta Llorón".', 'Profetizó que el exilio babilónico duraría exactamente 70 años.'] },
  { id: 'lamentaciones', name: 'Lamentaciones', testament: 'Antiguo Testamento', group: 'Profetas Mayores', author: 'Jeremías (tradicional)', dateWritten: '~586 a.C.', historicalContext: 'Inmediatamente después de la destrucción de Jerusalén.', keyThemes: ['Luto', 'Juicio de Dios', 'Esperanza en la misericordia divina'], chapters: 5, interestingFacts: ['Los capítulos 1, 2, 3 y 4 son acrósticos del alfabeto hebreo.', 'En medio del dolor declara: "Nuevas son cada mañana; grande es tu fidelidad" (Lm. 3:23).'] },
  { id: 'ezequiel', name: 'Ezequiel', testament: 'Antiguo Testamento', group: 'Profetas Mayores', author: 'Ezequiel', dateWritten: '~593-571 a.C.', historicalContext: 'Ministró a los exiliados judíos en Babilonia.', keyThemes: ['La gloria de Dios', 'Juicio', 'Restauración', 'El valle de los huesos secos', 'El nuevo templo'], chapters: 48, interestingFacts: ['Usaba muchas demostraciones visuales y actos simbólicos extremos.', 'Tuvo la visión del valle de los huesos secos que cobran vida.'] },
  { id: 'daniel', name: 'Daniel', testament: 'Antiguo Testamento', group: 'Profetas Mayores', author: 'Daniel', dateWritten: '~536 a.C.', historicalContext: 'La corte imperial en Babilonia y Persia.', keyThemes: ['Soberanía de Dios sobre las naciones', 'Fidelidad en el exilio', 'Profecías escatológicas'], chapters: 12, interestingFacts: ['Escrito parcialmente en arameo.', 'Contiene la profecía exacta de las 70 semanas que predecía cuándo vendría el Mesías.'] },

  { id: 'oseas', name: 'Oseas', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Oseas', dateWritten: '~750-715 a.C.', historicalContext: 'El declive del Reino del Norte (Israel).', keyThemes: ['Amor inquebrantable de Dios', 'Infidelidad espiritual (prostitución)'], chapters: 14, interestingFacts: ['Dios le ordenó casarse con una prostituta (Gómer) para ilustrar el amor de Dios por el Israel infiel.'] },
  { id: 'joel', name: 'Joel', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Joel', dateWritten: 'Debatida (835 a.C. o ~400 a.C.)', historicalContext: 'Después de una devastadora plaga de langostas en Judá.', keyThemes: ['El Día del Señor', 'Invasión de langostas', 'Derramamiento del Espíritu'], chapters: 3, interestingFacts: ['Pedro citó a Joel en el día de Pentecostés respecto al derramamiento del Espíritu Santo.'] },
  { id: 'amos', name: 'Amós', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Amós', dateWritten: '~760-750 a.C.', historicalContext: 'Tiempos de prosperidad en Israel, pero gran injusticia social.', keyThemes: ['Justicia social', 'Juicio divino contra las naciones', 'Juicio contra Israel'], chapters: 9, interestingFacts: ['Amós no era profeta de profesión, sino un pastor de ovejas y recogedor de higos silvestres.'] },
  { id: 'abdias', name: 'Abdías', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Abdías', dateWritten: '~840 o 586 a.C.', historicalContext: 'Juicio sobre la nación de Edom (descendientes de Esaú).', keyThemes: ['Juicio sobre Edom', 'Vindicación de Israel'], chapters: 1, interestingFacts: ['Es el libro más corto del Antiguo Testamento (solo 21 versículos).'] },
  { id: 'jonas', name: 'Jonás', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Jonás', dateWritten: '~760 a.C.', historicalContext: 'Llamado a predicar a Nínive, la cruel capital asiria.', keyThemes: ['Misericordia de Dios hacia los gentiles', 'Desobediencia', 'Arrepentimiento'], chapters: 4, interestingFacts: ['Jonás huyó de Dios, fue tragado por un gran pez, y luego predicó el mayor avivamiento registrado.', 'Termina con Dios reprendiendo a Jonás por preocuparse más por una planta que por las almas humanas.'] },
  { id: 'miqueas', name: 'Miqueas', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Miqueas', dateWritten: '~735-700 a.C.', historicalContext: 'Contemporáneo de Isaías, ministró a Israel y Judá.', keyThemes: ['Juicio por injusticia social', 'Esperanza de salvación', 'El Mesías de Belén'], chapters: 7, interestingFacts: ['Profetizó específicamente que el Mesías nacería en Belén (Miqueas 5:2).'] },
  { id: 'nahum', name: 'Nahúm', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Nahúm', dateWritten: '~663-612 a.C.', historicalContext: 'Profecía de la destrucción de Nínive.', keyThemes: ['Juicio inminente sobre Nínive', 'La venganza divina'], chapters: 3, interestingFacts: ['Es una secuela de Jonás: unos 100 años después, Nínive volvió a su maldad y Nahúm decreta su fin absoluto.'] },
  { id: 'habacuc', name: 'Habacuc', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Habacuc', dateWritten: '~615-605 a.C.', historicalContext: 'Cerca del ascenso del imperio babilónico.', keyThemes: ['Diálogo con Dios', 'Fe en tiempos oscuros', 'Justicia divina'], chapters: 3, interestingFacts: ['Declaró "el justo por su fe vivirá", una frase crucial citada por Pablo para la doctrina de la justificación por la fe.'] },
  { id: 'sofonias', name: 'Sofonías', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Sofonías', dateWritten: '~640-621 a.C.', historicalContext: 'Durante el reinado del rey Josías en Judá.', keyThemes: ['El Día del Señor', 'Juicio universal', 'Restauración del remanente'], chapters: 3, interestingFacts: ['Sofonías tenía ascendencia real; era tataranieto del buen rey Ezequías.'] },
  { id: 'hageo', name: 'Hageo', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Hageo', dateWritten: '~520 a.C.', historicalContext: 'Post-exilio; los judíos habían dejado de construir el templo.', keyThemes: ['Reconstrucción del Templo', 'Prioridades espirituales'], chapters: 2, interestingFacts: ['Exhortó al pueblo preguntando si era tiempo para que ellos vivieran en casas artesonadas mientras el templo de Dios estaba en ruinas.'] },
  { id: 'zacarias', name: 'Zacarías', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Zacarías', dateWritten: '~520-480 a.C.', historicalContext: 'Contemporáneo de Hageo; animó la finalización del templo.', keyThemes: ['Visiones apocalípticas', 'El Mesías venidero', 'Restauración futura'], chapters: 14, interestingFacts: ['Contiene muchas profecías sobre Jesús: su entrada triunfal en un pollino, su venta por 30 piezas de plata, y el mirar a "quien traspasaron".'] },
  { id: 'malaquias', name: 'Malaquías', testament: 'Antiguo Testamento', group: 'Profetas Menores', author: 'Malaquías', dateWritten: '~430 a.C.', historicalContext: 'Un pueblo espiritualmente apático tras la reconstrucción del templo.', keyThemes: ['Corrupción sacerdotal', 'El diezmo', 'El precursor del Mesías'], chapters: 4, interestingFacts: ['El último libro del AT. Tras él, hubo 400 años de silencio profético hasta Juan el Bautista.', 'Profetiza la venida de "Elías" antes del día del Señor.'] },

  { id: 'mateo', name: 'Mateo', testament: 'Nuevo Testamento', group: 'Evangelios', author: 'Mateo (Leví)', dateWritten: '~50-70 d.C.', historicalContext: 'Escrito principalmente para una audiencia judía para probar que Jesús es el Mesías.', keyThemes: ['El Rey y su Reino', 'Cumplimiento de profecías', 'Enseñanzas de Jesús (5 discursos)'], chapters: 28, interestingFacts: ['Cita el Antiguo Testamento más de 60 veces.', 'Contiene el Sermón del Monte completo (capítulos 5-7).'] },
  { id: 'marcos', name: 'Marcos', testament: 'Nuevo Testamento', group: 'Evangelios', author: 'Juan Marcos (bajo Pedro)', dateWritten: '~50-60 d.C.', historicalContext: 'Escrito para los romanos, destaca la acción y el servicio de Jesús.', keyThemes: ['Jesús como Siervo Sufriente', 'Acción y milagros', 'Discipulado'], chapters: 16, interestingFacts: ['Es el evangelio más corto y probablemente el primero en ser escrito.', 'Usa la palabra "inmediatamente" (euthys) constantemente.'] },
  { id: 'lucas', name: 'Lucas', testament: 'Nuevo Testamento', group: 'Evangelios', author: 'Lucas (médico)', dateWritten: '~60-61 d.C.', historicalContext: 'Escrito a Teófilo, enfocado en mostrar la humanidad perfecta de Jesús y su amor por los marginados.', keyThemes: ['El Hijo del Hombre', 'Salvación para todos', 'El Espíritu Santo', 'Oración'], chapters: 24, interestingFacts: ['Contiene las parábolas más famosas: El Buen Samaritano y El Hijo Pródigo.', 'Es el único evangelio escrito por un gentil.'] },
  { id: 'juan', name: 'Juan', testament: 'Nuevo Testamento', group: 'Evangelios', author: 'Juan el Apóstol', dateWritten: '~85-90 d.C.', historicalContext: 'Escrito para que los lectores crean que Jesús es el Hijo de Dios.', keyThemes: ['Deidad de Cristo', 'Vida eterna', 'Creer', 'Luz y oscuridad', 'Los 7 "Yo Soy"'], chapters: 21, interestingFacts: ['El 90% de su contenido es único, diferente a los otros tres evangelios (sinópticos).', 'No incluye el nacimiento de Jesús ni las parábolas.'] },
  { id: 'hechos', name: 'Hechos', testament: 'Nuevo Testamento', group: 'Historia', author: 'Lucas', dateWritten: '~62-64 d.C.', historicalContext: 'La secuela del Evangelio de Lucas. El nacimiento de la Iglesia.', keyThemes: ['El Espíritu Santo', 'Expansión de la Iglesia', 'Ministerio de Pedro y Pablo'], chapters: 28, interestingFacts: ['Traza la expansión del evangelio desde Jerusalén hasta Roma.', 'Registra la conversión de Saulo (Pablo).'] },
  { id: 'romanos', name: 'Romanos', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~57 d.C.', historicalContext: 'Escrito desde Corinto a los creyentes en Roma, preparando su visita.', keyThemes: ['Justificación por fe', 'Gracia', 'La justicia de Dios', 'Israel y la Iglesia'], chapters: 16, interestingFacts: ['Es considerada la exposición teológica más brillante y profunda del Nuevo Testamento.', 'Desató la Reforma Protestante a través de Martín Lutero.'] },
  { id: '1-corintios', name: '1 Corintios', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~55 d.C.', historicalContext: 'Para corregir problemas en una iglesia dividida y carnal en la ciudad pagana de Corinto.', keyThemes: ['Unidad', 'Pureza moral', 'Dones espirituales', 'El Amor', 'La Resurrección'], chapters: 16, interestingFacts: ['Contiene el famoso "capítulo del amor" (1 Corintios 13).', 'Ofrece la explicación más profunda de la resurrección física (capítulo 15).'] },
  { id: '2-corintios', name: '2 Corintios', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~56 d.C.', historicalContext: 'Una carta muy personal donde Pablo defiende su apostolado.', keyThemes: ['Consuelo en la aflicción', 'El ministerio del Nuevo Pacto', 'Defensa del apostolado', 'Ofrenda'], chapters: 13, interestingFacts: ['Es la carta más autobiográfica de Pablo, revelando su "aguijón en la carne".'] },
  { id: 'galatas', name: 'Gálatas', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~49 o 55 d.C.', historicalContext: 'Para combatir a los judaizantes que enseñaban que los cristianos debían guardar la ley de Moisés.', keyThemes: ['Libertad en Cristo', 'Justificación por fe sola', 'El fruto del Espíritu'], chapters: 6, interestingFacts: ['Llamada la "Carta Magna de la libertad cristiana".', 'No tiene la usual sección de alabanza y acción de gracias al principio.'] },
  { id: 'efesios', name: 'Efesios', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~60-62 d.C.', historicalContext: 'Escrita desde prisión, enfocada en la Iglesia como el cuerpo de Cristo.', keyThemes: ['Bendiciones espirituales', 'Gracia', 'Unidad en la Iglesia', 'Armadura de Dios'], chapters: 6, interestingFacts: ['Se divide perfectamente a la mitad: capítulos 1-3 doctrinales, 4-6 prácticos.', 'Describe detalladamente la Armadura de Dios (cap. 6).'] },
  { id: 'filipenses', name: 'Filipenses', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~60-62 d.C.', historicalContext: 'Escrita desde prisión como un agradecimiento por el apoyo financiero de la iglesia.', keyThemes: ['Gozo', 'Humildad de Cristo', 'Regocijo en el sufrimiento'], chapters: 4, interestingFacts: ['Conocida como "La Epístola del Gozo", la palabra "gozo" o "regocijaos" aparece unas 16 veces.', 'Contiene un himno primitivo sobre el vaciamiento de Cristo (Kenosis) en el capítulo 2.'] },
  { id: 'colosenses', name: 'Colosenses', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~60-62 d.C.', historicalContext: 'Escrita desde prisión para combatir herejías incipientes que menospreciaban a Cristo.', keyThemes: ['La supremacía de Cristo', 'Libertad de regulaciones humanas'], chapters: 4, interestingFacts: ['Presenta a Jesucristo como el Creador y Sustentador del universo.', 'Es una carta gemela de Efesios, compartiendo mucho material.'] },
  { id: '1-tesalonicenses', name: '1 Tesalonicenses', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~51 d.C.', historicalContext: 'Para alentar a los creyentes perseguidos y explicar sobre el regreso de Cristo.', keyThemes: ['El rapto de la iglesia', 'Santidad', 'Esperanza del regreso de Cristo'], chapters: 5, interestingFacts: ['Probablemente el primer documento del Nuevo Testamento que escribió Pablo.', 'Cada capítulo termina con una referencia al regreso de Cristo.'] },
  { id: '2-tesalonicenses', name: '2 Tesalonicenses', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~51-52 d.C.', historicalContext: 'Para corregir falsas enseñanzas de que el "Día del Señor" ya había llegado.', keyThemes: ['El hombre de pecado (Anticristo)', 'Laboriosidad', 'El Día del Señor'], chapters: 3, interestingFacts: ['Habla del misterio de la iniquidad y de "aquel que lo detiene".'] },
  { id: '1-timoteo', name: '1 Timoteo', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~62-64 d.C.', historicalContext: 'Instrucciones pastorales para Timoteo, líder de la iglesia en Éfeso.', keyThemes: ['Requisitos para obispos y diáconos', 'Falsa doctrina', 'Conducta en la iglesia'], chapters: 6, interestingFacts: ['Es una de las tres "Epístolas Pastorales".', 'Da directrices claras sobre el liderazgo eclesiástico y el orden.'] },
  { id: '2-timoteo', name: '2 Timoteo', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~67 d.C.', historicalContext: 'La última carta de Pablo, escrita desde un calabozo romano antes de su ejecución.', keyThemes: ['Fidelidad', 'La inspiración de las Escrituras', 'Soportar el sufrimiento'], chapters: 4, interestingFacts: ['Las últimas palabras escritas registradas por Pablo: "He peleado la buena batalla".', 'Afirma que "toda la Escritura es inspirada por Dios" (3:16).'] },
  { id: 'tito', name: 'Tito', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~62-64 d.C.', historicalContext: 'Instrucciones para Tito, que organizaba iglesias en la isla de Creta.', keyThemes: ['Buenas obras', 'Liderazgo en la iglesia', 'La gracia salvadora'], chapters: 3, interestingFacts: ['Resume magistralmente el evangelio como el rescate y la regeneración por el Espíritu (3:4-7).'] },
  { id: 'filemon', name: 'Filemón', testament: 'Nuevo Testamento', group: 'Cartas Paulinas', author: 'Pablo', dateWritten: '~60-62 d.C.', historicalContext: 'Un ruego personal al amo de un esclavo fugitivo (Onésimo) que se convirtió.', keyThemes: ['Perdón', 'Hermandad cristiana', 'Reconciliación'], chapters: 1, interestingFacts: ['Es la carta más corta de Pablo.', 'Muestra cómo el evangelio transforma las barreras sociales y culturales.'] },
  
  { id: 'hebreos', name: 'Hebreos', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Desconocido', dateWritten: '~65-69 d.C.', historicalContext: 'A cristianos judíos tentados a volver al judaísmo bajo persecución.', keyThemes: ['Superioridad de Cristo', 'El Nuevo Pacto', 'El Sumo Sacerdote', 'Fe'], chapters: 13, interestingFacts: ['Su autoría es un misterio (Orígenes dijo: "Sólo Dios sabe").', 'El capítulo 11 es el "Salón de la Fama de la Fe".'] },
  { id: 'santiago', name: 'Santiago', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Santiago (hermano de Jesús)', dateWritten: '~45-49 d.C.', historicalContext: 'Carta práctica a los judíos dispersos.', keyThemes: ['Fe y obras', 'Sabiduría', 'Pruebas', 'La lengua'], chapters: 5, interestingFacts: ['Considerado el "Proverbios del Nuevo Testamento".', 'Argumenta enérgicamente que "la fe sin obras está muerta".'] },
  { id: '1-pedro', name: '1 Pedro', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Pedro', dateWritten: '~60-63 d.C.', historicalContext: 'Para alentar a los creyentes esparcidos que enfrentaban sufrimiento.', keyThemes: ['Sufrimiento injusto', 'Santidad', 'Sometimiento', 'Esperanza viva'], chapters: 5, interestingFacts: ['Llama a los creyentes "linaje escogido, real sacerdocio".', 'Instruye sobre la actitud correcta frente al fuego de la prueba.'] },
  { id: '2-pedro', name: '2 Pedro', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Pedro', dateWritten: '~65-68 d.C.', historicalContext: 'Escrita poco antes del martirio de Pedro para advertir de falsos maestros.', keyThemes: ['Falsos profetas', 'El regreso de Cristo', 'El día del Señor'], chapters: 3, interestingFacts: ['Reconoce los escritos de Pablo como "Escrituras" (3:15-16).', 'Su estilo y temática es muy similar al libro de Judas.'] },
  { id: '1-juan', name: '1 Juan', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Juan', dateWritten: '~85-95 d.C.', historicalContext: 'Escrita para dar seguridad de salvación y combatir el gnosticismo incipiente.', keyThemes: ['Luz y amor', 'Comunión con Dios', 'Seguridad de la salvación', 'El Anticristo'], chapters: 5, interestingFacts: ['Define a Dios: "Dios es luz" (1:5) y "Dios es amor" (4:8).', 'Escrita para que sepamos que tenemos vida eterna (5:13).'] },
  { id: '2-juan', name: '2 Juan', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Juan', dateWritten: '~85-95 d.C.', historicalContext: 'Escrita "a la señora elegida y a sus hijos" (probablemente una iglesia local).', keyThemes: ['Andar en la verdad', 'Amor', 'Rechazar a los falsos maestros'], chapters: 1, interestingFacts: ['Advierte estrictamente no hospedar a quienes no traen la doctrina de Cristo.'] },
  { id: '3-juan', name: '3 Juan', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Juan', dateWritten: '~85-95 d.C.', historicalContext: 'Escrita a un líder piadoso llamado Gayo.', keyThemes: ['Hospitalidad', 'El orgullo eclesiástico (Diótrefes)'], chapters: 1, interestingFacts: ['El libro más corto de la Biblia por recuento de palabras.', 'Contrasta el buen ejemplo de Gayo y Demetrio con el mal ejemplo de Diótrefes.'] },
  { id: 'judas', name: 'Judas', testament: 'Nuevo Testamento', group: 'Cartas Generales', author: 'Judas (hermano de Jesús)', dateWritten: '~65-80 d.C.', historicalContext: 'Un ferviente llamado a "contender ardientemente por la fe" contra los apóstatas.', keyThemes: ['Apostasía', 'Juicio divino', 'Contender por la fe'], chapters: 1, interestingFacts: ['Cita escritos no canónicos (El Libro de Enoc, La Asunción de Moisés).', 'Termina con una de las doxologías más hermosas de la Biblia.'] },
  { id: 'apocalipsis', name: 'Apocalipsis', testament: 'Nuevo Testamento', group: 'Libro Profético', author: 'Juan', dateWritten: '~90-95 d.C.', historicalContext: 'Escrito durante el destierro en la isla de Patmos por la persecución bajo Domiciano.', keyThemes: ['El triunfo de Cristo', 'Juicio final', 'Cielos nuevos y tierra nueva'], chapters: 22, interestingFacts: ['Es el único libro de la Biblia que promete una bendición especial a quien lo lee y escucha.', 'El nombre significa "Revelación" o "Descorrer el velo".'] }
];

// Alias de compatibilidad para componentes de la enciclopedia que consumen
// una forma resumida de los índices.
export const booksData = bibleBooks.map((book) => ({
  ...book,
  description: book.historicalContext,
  imageUrl: undefined as string | undefined,
}));

export const charactersData = bibleCharacters.map((character) => ({
  ...character,
  description: character.historicalContext,
}));

export const locationsData = biblePlaces.map((place) => ({
  ...place,
  description: place.significance,
  imageUrl: undefined as string | undefined,
}));
