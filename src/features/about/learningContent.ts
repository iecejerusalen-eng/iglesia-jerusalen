export const learningTopics = [
  { slug: 'origen-cuadrangular', title: 'Origen Cuadrangular', summary: 'De la visión de Ezequiel al mensaje que predicó Aimee Semple McPherson.', question: '¿De dónde viene el nombre Cuadrangular?' },
  { slug: 'doctrina', title: 'Nuestra doctrina', summary: 'Conoce los cuatro ministerios de Jesucristo y los principios de nuestra fe.', question: '¿Qué creemos y cómo vivimos nuestra fe?' },
  { slug: 'simbolos', title: 'Símbolos y bandera', summary: 'Descubre el significado de los rostros, los emblemas y sus colores.', question: '¿Qué mensaje expresan nuestros símbolos?' },
  { slug: 'historia', title: 'Nuestra historia', summary: 'Nuestra comunidad en Milagro, la obra en Ecuador y la familia internacional.', question: '¿Cómo se conecta nuestra iglesia con una misión más amplia?' },
  { slug: 'himno', title: 'Nuestro himno', summary: 'Lee las cuatro estrofas y el coro que expresan el mensaje Cuadrangular.', question: '¿Qué confesamos cuando cantamos el himno?' },
  { slug: 'documentos', title: 'Documentos', summary: 'Consulta los estatutos y el reglamento interno en su versión original.', question: '' },
] as const;
export type LearningSlug = Exclude<(typeof learningTopics)[number]['slug'], 'documentos'>;

export const fourMinistries = [
  { id: 'salvador', title: 'Jesucristo, el Salvador', face: 'Hombre', symbol: 'Cruz', color: 'Rojo', image: 'hombre', reference: 'Juan 3:16; Isaías 53:5; Efesios 2:8-9',
    meaning: 'El rostro humano recuerda a Cristo que vino a nosotros y entregó su vida. La cruz y el rojo expresan su sacrificio por nuestra salvación.',
    teaching: 'La salvación comienza en el amor de Dios. Jesucristo nos reconcilia con el Padre por su muerte y resurrección; la recibimos por gracia mediante la fe, no como recompensa por nuestras obras. Arrepentirnos y confiar en Él abre una vida nueva, en la que aprendemos a amar, perdonar y servir.',
    application: 'La respuesta a esa gracia es seguir a Jesús. La iglesia acompaña al creyente mediante la enseñanza, la oración y la comunidad; nuestras buenas obras expresan agradecimiento, sin convertirse en el precio de la salvación.',
    question: '¿Cómo cambia la gracia de Jesús mi manera de tratar a quienes me rodean?' },
  { id: 'bautizador', title: 'Jesucristo, el Bautizador con el Espíritu Santo', face: 'León', symbol: 'Paloma', color: 'Amarillo', image: 'leon', reference: 'Hechos 1:5-8; Hechos 2:4; Gálatas 5:22-23',
    meaning: 'El león expresa el poder de Cristo como Bautizador. La paloma y el amarillo recuerdan al Espíritu Santo y su obra en la iglesia.',
    teaching: 'Jesús prometió el Espíritu Santo para capacitar a sus discípulos como testigos. En la fe Cuadrangular, el bautismo con el Espíritu Santo es una experiencia de poder para la misión. También buscamos vivir cada día bajo su dirección, creciendo en el fruto del Espíritu y usando sus dones para edificar a otros.',
    application: 'El poder espiritual tiene un propósito: dar testimonio de Cristo y servir con amor. La oración, la lectura de la Biblia y la vida en comunidad ayudan a discernir y acompañar esa experiencia.',
    question: '¿Estoy buscando el poder del Espíritu para servir o solo para mi beneficio?' },
  { id: 'sanador', title: 'Jesucristo, el Sanador', face: 'Buey', symbol: 'Copa', color: 'Azul', image: 'buey', reference: 'Mateo 8:17; Santiago 5:14-15; 1 Pedro 2:24',
    meaning: 'El buey recuerda a quien lleva nuestras cargas. La copa identifica el ministerio sanador y el azul representa la sanidad divina.',
    teaching: 'El evangelio muestra a Jesús atendiendo el sufrimiento y sanando. La iglesia Cuadrangular confiesa que Él sigue siendo Sanador: llevamos nuestras necesidades a Dios, oramos por los enfermos y los acompañamos con compasión. La esperanza en Cristo abarca a la persona entera y nos mueve a cuidar de quienes sufren.',
    application: 'Orar por sanidad es también estar presentes: escuchar, acompañar y apoyar a la persona y a su familia. El cuidado pastoral debe expresar amor y respeto, sin medir la dignidad de alguien por su enfermedad.',
    question: '¿Qué gesto concreto de acompañamiento puedo ofrecer a una persona enferma?' },
  { id: 'rey', title: 'Jesucristo, el Rey que viene', face: 'Águila', symbol: 'Corona', color: 'Morado', image: 'aguila', reference: '1 Tesalonicenses 4:16-17; Juan 14:1-3; Tito 2:11-13',
    meaning: 'El águila representa la esperanza del regreso de Cristo. La corona y el morado expresan su realeza y majestad.',
    teaching: 'La esperanza cristiana mira al regreso de Jesucristo. Confesamos que el Señor que salva, llena y sana volverá; esa promesa sostiene a la iglesia y orienta su vida presente. Esperar a nuestro Rey significa permanecer fieles, vivir con sobriedad y anunciar el evangelio con esperanza.',
    application: 'La esperanza del regreso de Cristo nos invita a vivir responsablemente hoy: cuidar nuestras relaciones, servir al prójimo y perseverar. Es una esperanza para compartir y no un motivo para abandonar nuestras responsabilidades.',
    question: '¿Cómo se refleja la esperanza en Cristo en mis decisiones de hoy?' },
] as const;

export const learningSources = {
  regulation: { title: 'Reglamento interno del Ecuador · páginas 1–4', href: '/documentos/reglamento-interno.pdf#page=1' },
  origin: { title: 'Relato de Aimee · Foursquare', href: 'https://resources.foursquare.org/sister_aimee_explains_the_foursquare_gospel/' },
  introduction: { title: 'Introducing the Foursquare Gospel · página 2', href: 'https://foursquare-org.s3.amazonaws.com/resources/Print_Brochure_Introducing_Foursquare_Gospel_English_bw.pdf' },
  biography: { title: 'Aimee Semple McPherson · historia oficial', href: 'https://www.foursquare.org/about/history/aimee-semple-mcpherson/' },
  identity: { title: 'Nombre y símbolos · Foursquare', href: 'https://resources.foursquare.org/foursquare-logo-name-style-guides/' },
} as const;
