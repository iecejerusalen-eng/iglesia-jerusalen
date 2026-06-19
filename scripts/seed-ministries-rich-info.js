import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local no encontrado.');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey || !supabaseUrl) {
  console.error('Error: Las credenciales de Supabase no están completas en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const richMinistries = [
  {
    slug: 'dep-cadetes',
    image_url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El <strong>Departamento de Cadetes del Evangelio Cuadrangular</strong> es un ministerio especializado de discipulado, liderazgo e instrucción integral diseñado para adolescentes y pre-jóvenes de 12 a 17 años.</p>
<h3>¿Qué hacen los Cadetes y qué es lo que estudian?</h3>
<p>Los Cadetes se enfocan en forjar el carácter de Cristo en la juventud a través de tres áreas esenciales de desarrollo:</p>
<ul>
  <li><strong>Estudios Bíblicos y Doctrinas Cuadrangulares:</strong> Estudian las doctrinas fundamentales del Evangelio de Jesucristo, profundizando en el mensaje de los 4 pilares: Jesús como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey Venidero. También estudian la apologética cristiana, la mayordomía espiritual, valores bíblicos y ética práctica para la adolescencia.</li>
  <li><strong>Técnicas de Campamento y Supervivencia:</strong> Aprenden cabuyería (nudos y amarres), primeros auxilios básicos, orientación por mapas y brújula, construcción de refugios temporales y preservación del medio ambiente. Periódicamente organizan campamentos e itinerarios al aire libre que fomentan la autoconfianza y la comunión con Dios.</li>
  <li><strong>Liderazgo y Servicio Comunitario:</strong> Los cadetes se forman para dirigir grupos pequeños, dar testimonios de fe y participar en actividades de apoyo social, llevando ayuda a hogares de ancianos, orfanatos y comunidades vulnerables.</li>
</ul>
<blockquote>
  <p><strong>Lema de los Cadetes:</strong> "Siempre Listos para Cristo y su Iglesia"<br/>
  <strong>Versículo Clave:</strong> 1 Timoteo 4:12 — <em>"Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza."</em><br/>
  <strong>Coro Oficial:</strong> "Adelante Cadetes marchad, con la antorcha encendida de amor..."</p>
</blockquote>
<h3>Valores Fundamentales</h3>
<ul>
  <li><strong>Lealtad:</strong> A Dios por encima de todo, a la familia y a su congregación local.</li>
  <li><strong>Disciplina:</strong> Entrenar el carácter y las decisiones cotidianas bajo la dirección del Espíritu Santo.</li>
  <li><strong>Servicio Altruista:</strong> Considerar al prójimo y actuar en consecuencia mediante el amor de Dios.</li>
</ul>`
  },
  {
    slug: 'dep-escuela-dominical',
    image_url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El <strong>Departamento de Escuela Dominical</strong> es el corazón de la educación cristiana infantil de nuestra iglesia. Diseñamos clases interactivas y material bíblico graduado para niños de todas las edades (desde cuneros hasta los 11 años).</p>
<h3>Enseñanza y Propósitos</h3>
<p>Nuestro propósito es sembrar la semilla de la palabra de Dios en las mentes y corazones de los niños desde su más tierna edad, utilizando pedagogía cristiana, dinámicas creativas, cantos ilustrados y manualidades.</p>
<ul>
  <li><strong>Lo que se estudia:</strong> Historias bíblicas del Antiguo y Nuevo Testamento, doctrinas elementales sobre el amor de Dios, el plan de salvación, el fruto del Espíritu Santo, la obediencia filial y el respeto al prójimo.</li>
  <li><strong>Clases Graduadas:</strong> Los niños son distribuidos por niveles (Cuneros, Párvulos, Primarios y Juveniles) para asegurar que el mensaje sea entendible y adaptado a su desarrollo cognitivo.</li>
</ul>
<blockquote>
  <p><strong>Lema de la Escuela Dominical:</strong> "Instruyendo al niño en su camino hoy, para un futuro bendecido mañana"<br/>
  <strong>Versículo Clave:</strong> Proverbios 22:6 — <em>"Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él."</em></p>
</blockquote>
<h3>Valores Clave</h3>
<ul>
  <li><strong>Amor por las Escrituras:</strong> Cimentar el hábito de leer la Biblia.</li>
  <li><strong>Obediencia:</strong> A Dios y a los padres como principio de sabiduría.</li>
  <li><strong>Fe Genuina:</strong> Relación personal e interactiva con Jesús desde la infancia.</li>
</ul>`
  },
  {
    slug: 'exploradores-del-reino',
    image_url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80',
    description: `<p><strong>Exploradores del Reino</strong> es el programa especializado de discipulado de niños de nuestra iglesia. Acompañamos a los más pequeños en la gran aventura de conocer a Dios de manera divertida y práctica.</p>
<h3>¿Qué hacen y qué estudian los Exploradores?</h3>
<p>Inspirado en el crecimiento integral de Jesús (Lucas 2:52: en sabiduría, en estatura, y en gracia para con Dios y los hombres), nuestro programa combina la instrucción bíblica con destrezas recreativas.</p>
<ul>
  <li><strong>Estudio del Reino:</strong> Los niños memorizan versículos clave, estudian la vida de los héroes de la fe y aprenden a aplicar principios bíblicos en la escuela, el hogar y con sus amigos.</li>
  <li><strong>Actividades Prácticas:</strong> Realizamos excursiones, dinámicas grupales, juegos de roles y dinámicas de servicio para fomentar el compañerismo y el amor por la obra de Dios.</li>
</ul>
<blockquote>
  <p><strong>Lema de los Exploradores:</strong> "Explorando la Palabra, Viviendo la Aventura con Jesús"<br/>
  <strong>Versículo Clave:</strong> Lucas 2:52 — <em>"Y Jesús crecía en sabiduría y en estatura, y en gracia para con Dios y los hombres."</em></p>
</blockquote>
<h3>Valores de los Exploradores</h3>
<ul>
  <li><strong>Pureza:</strong> Vivir con integridad y honestidad.</li>
  <li><strong>Compañerismo:</strong> Trabajar en unidad y respetar a los demás.</li>
  <li><strong>Valentía:</strong> Compartir el amor de Cristo sin temor.</li>
</ul>`
  },
  {
    slug: 'gdf-jovenes',
    image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    description: `<p><strong>Generación de Fuego (GDF)</strong> es el ministerio que reúne a los jóvenes y adolescentes de la congregación con el fin de levantar una generación apasionada por Dios, santa e influyente en la sociedad contemporánea.</p>
<h3>Propósitos y Estudios</h3>
<p>Llevamos a cabo cultos dinámicos, campamentos juveniles, vigilias de fuego y grupos de discipulado donde los jóvenes encuentran respuestas bíblicas y relevantes a los desafíos que enfrentan en su vida académica, profesional y emocional.</p>
<ul>
  <li><strong>Áreas de Enfoque:</strong> Identidad en Cristo, pureza sexual, apologética, liderazgo, servicio en la iglesia, evangelismo creativo y misiones juveniles.</li>
  <li><strong>Estudios de Liderazgo:</strong> Discipulado uno a uno para capacitar a los jóvenes como futuros ministros, líderes de células y servidores en el altar.</li>
</ul>
<blockquote>
  <p><strong>Lema de GDF:</strong> "Encendidos por el Espíritu Santo para impactar las naciones"<br/>
  <strong>Versículo Clave:</strong> 1 Juan 2:14 — <em>"Os he escrito a vosotros, jóvenes, porque sois fuertes, y la palabra de Dios permanece en vosotros, y habéis vencido al maligno."</em></p>
</blockquote>
<h3>Valores de Generación de Fuego</h3>
<ul>
  <li><strong>Pasión Radical:</strong> Entrega total y adoración ferviente a Dios.</li>
  <li><strong>Santidad:</strong> Vivir consagrados para los propósitos divinos.</li>
  <li><strong>Fraternidad:</strong> Comunión genuina y cuidado mutuo entre jóvenes.</li>
</ul>`
  },
  {
    slug: 'dep-jovenes',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El <strong>Departamento de Jóvenes</strong> coordina las actividades de la juventud de la Iglesia Jerusalén, alineándose con las directrices de la Juventud del Evangelio Cuadrangular (JEC). Formamos líderes juveniles apasionados por la expansión del reino.</p>
<h3>¿Qué hacemos?</h3>
<p>A través de cultos mensuales de jóvenes, retiros espirituales y brigadas misioneras urbanas, conectamos a los jóvenes con su propósito eterno en Cristo Jesús.</p>
<blockquote>
  <p><strong>Lema de los Jóvenes:</strong> "Llevando la antorcha de la verdad a todo lugar"<br/>
  <strong>Versículo Clave:</strong> Eclesiastés 12:1 — <em>"Acuérdate de tu Creador en los días de tu juventud, antes que vengan los días malos, y lleguen los años de los cuales digas: No tengo en ellos contentamiento."</em></p>
</blockquote>`
  },
  {
    slug: 'mujeres-de-fe',
    image_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El ministerio de damas <strong>Mujeres de Fe</strong> de la Iglesia Jerusalén reúne a las mujeres de la congregación para consolidar su vida espiritual, su rol en el hogar, el cuidado de la familia y el servicio misionero local.</p>
<h3>Propósitos y Discipulado</h3>
<p>A través de oraciones comunitarias, estudios especializados para madres y esposas, y talleres de emprendimiento y consejería, equipamos a la mujer en todas sus dimensiones.</p>
<ul>
  <li><strong>Lo que se estudia:</strong> La mujer ejemplar de Proverbios 31, relaciones familiares saludables, oración intercesora, principios de consejería familiar y educación de los hijos en la fe cristiana.</li>
</ul>
<blockquote>
  <p><strong>Lema del Ministerio de Damas:</strong> "Mujeres firmes en la fe, prudentes en amor y constantes en el servicio"<br/>
  <strong>Versículo Clave:</strong> Proverbios 31:30 — <em>"Engañosa es la gracia, y vana la hermosura; la mujer que teme a Jehová, esa será alabada."</em></p>
</blockquote>
<h3>Valores del Ministerio</h3>
<ul>
  <li><strong>Prudencia y Sabiduría:</strong> Edificar el hogar y las relaciones con sabiduría celestial.</li>
  <li><strong>Intercesión:</strong> Columnas de oración por las familias e iglesia.</li>
  <li><strong>Compasión:</strong> Apoyo práctico a las viudas, huérfanos y necesitados.</li>
</ul>`
  },
  {
    slug: 'dep-damas',
    image_url: 'https://res.cloudinary.com/degrlmvsq/image/upload/v1781147664/iglesia-jerusalen/ministries/fumait2x4xeho0qop0ny.jpg',
    description: `<p>El <strong>Departamento de Damas</strong> coordina la Sociedad de Damas de la Iglesia Cuadrangular. Fomentamos el crecimiento y comunión de la mujer cristiana bajo la palabra de Dios.</p>
<blockquote>
  <p><strong>Lema de las Damas:</strong> "Por Cristo y por la Iglesia"<br/>
  <strong>Versículo Clave:</strong> Ruth 3:11 — <em>"No temas pues; yo haré contigo lo que tú digas, pues toda la gente de mi pueblo sabe que eres mujer virtuosa."</em></p>
</blockquote>`
  },
  {
    slug: 'hombres-de-integridad',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El ministerio de caballeros <strong>Hombres de Integridad</strong> congrega a los hombres de la iglesia con el objetivo de restaurar y fortalecer su rol como sacerdotes del hogar, líderes sabios y servidores íntegros en la comunidad.</p>
<h3>Propósitos y Formación</h3>
<p>Desarrollamos desayunos de oración mensuales, retiros espirituales y discipulados en grupos pequeños enfocados en la masculinidad bíblica e integridad.</p>
<ul>
  <li><strong>Áreas de Estudio:</strong> Carácter del líder cristiano, finanzas bíblicas en el hogar, el sacerdocio familiar, mayordomía moral y el rol de esposo y padre de pacto.</li>
</ul>
<blockquote>
  <p><strong>Lema del Ministerio de Caballeros:</strong> "Hombres íntegros, familias fuertes, iglesia victoriosa"<br/>
  <strong>Versículo Clave:</strong> Salmo 112:1-2 — <em>"Bienaventurado el hombre que teme a Jehová, y en sus mandamientos se deleita en gran manera. Su descendencia será poderosa en la tierra; la generación de los rectos será bendita."</em></p>
</blockquote>
<h3>Valores Clave</h3>
<ul>
  <li><strong>Integridad:</strong> Vivir de acuerdo a las Escrituras tanto en público como en lo privado.</li>
  <li><strong>Responsabilidad:</strong> Asumir el rol de guías espirituales en el hogar.</li>
  <li><strong>Compañerismo de Hierro:</strong> Hombres que apoyan y edifican a otros hombres.</li>
</ul>`
  },
  {
    slug: 'dep-caballeros',
    image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El <strong>Departamento de Caballeros</strong> organiza las actividades de la Sociedad de Caballeros de nuestra iglesia, promoviendo el discipulado y el fortalecimiento espiritual mutuo.</p>
<blockquote>
  <p><strong>Lema de Caballeros:</strong> "Varones en la brecha por nuestras familias"<br/>
  <strong>Versículo Clave:</strong> 1 Corintios 16:13 — <em>"Velad, estad firmes en la fe; portaos varonilmente, y esforzaos."</em></p>
</blockquote>`
  },
  {
    slug: 'dep-misiones-y-evangelismo',
    image_url: 'https://images.unsplash.com/photo-1508847154043-be12a62861c1?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El <strong>Departamento de Misiones y Evangelismo</strong> canaliza los esfuerzos de la iglesia por cumplir con la Gran Comisión, tanto en el área urbana como en la plantación de nuevas obras y filiales cuadrangulares en el país.</p>
<h3>Evangelismo, Obra Social y Expansión</h3>
<p>Coordinamos brigadas médicas y de auxilio, campañas al aire libre, visitas casa por casa y programas de plantación celular en sectores necesitados.</p>
<ul>
  <li><strong>Lo que se estudia:</strong> Métodos de evangelismo personal, plantación de iglesias, historia de las misiones mundiales y compasión social en las Escrituras.</li>
</ul>
<blockquote>
  <p><strong>Lema de Misiones:</strong> "La mies es mucha, los obreros pocos; ¡envíame a mí!"<br/>
  <strong>Versículo Clave:</strong> Mateo 28:19 — <em>"Por tanto, id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo."</em></p>
</blockquote>
<h3>Valores de Misiones</h3>
<ul>
  <li><strong>Obediencia Radical:</strong> Responder al mandato directo del Salvador.</li>
  <li><strong>Amor Compasivo:</strong> Demostrar el Evangelio en palabra y en hechos prácticos.</li>
  <li><strong>Visión de Cosecha:</strong> Mantener la urgencia en la proclamación del mensaje de fe.</li>
</ul>`
  },
  {
    slug: 'ministerio-de-alabanza',
    image_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El <strong>Ministerio de Alabanza y Adoración</strong> de la Iglesia Jerusalén es el equipo llamado a dirigir a la congregación en una adoración bíblica, Cristocéntrica y ungida por el Espíritu Santo en cada uno de nuestros cultos y actividades especiales.</p>
<h3>Disposición y Preparación</h3>
<p>Combinamos la excelencia técnica en la ejecución instrumental y el canto con una sólida consagración de vida.</p>
<ul>
  <li><strong>Doctrina y Preparación:</strong> Estudiamos la teología de la adoración bíblica, el rol de la alabanza en la guerra espiritual, y realizamos capacitaciones de técnica musical y armonía vocal.</li>
</ul>
<blockquote>
  <p><strong>Lema de Alabanza:</strong> "Adoradores del Padre en espíritu y en verdad"<br/>
  <strong>Versículo Clave:</strong> Juan 4:23-24 — <em>"Mas la hora viene, y ahora es, cuando los verdaderos adoradores adorarán al Padre en espíritu y en verdad; porque también el Padre tales adoradores busca que le adoren."</em></p>
</blockquote>
<h3>Valores del Adorador</h3>
<ul>
  <li><strong>Consagración:</strong> Vida de oración y santidad previa al servicio en el altar.</li>
  <li><strong>Excelencia:</strong> Ofrecer a Dios la mejor ejecución técnica posible (Salmo 33:3).</li>
  <li><strong>Humildad:</strong> Reconocer que la gloria y la atención pertenecen únicamente a Jesucristo.</li>
</ul>`
  },
  {
    slug: 'multimedia',
    image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El ministerio de <strong>Multimedia y Medios de Comunicación</strong> se encarga de usar las tecnologías digitales, el sonido, la proyección visual y las redes sociales para amplificar el alcance del mensaje de salvación.</p>
<h3>Operación Técnica y Misión</h3>
<p>Transmitimos los cultos en vivo, operamos las consolas de mezcla de sonido, coordinamos las letras y pasajes bíblicos proyectados en pantalla y mantenemos la comunicación digital de la congregación.</p>
<blockquote>
  <p><strong>Lema de Multimedia:</strong> "Usando la tecnología para que las piedras no tengan que hablar"<br/>
  <strong>Versículo Clave:</strong> Salmo 19:4 — <em>"Por toda la tierra salió su voz, y hasta el extremo del mundo sus palabras."</em></p>
</blockquote>`
  },
  {
    slug: 'altar-de-oracion',
    image_url: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El **Altar de Oración** es el pilar de intercesión y guerra espiritual de la Iglesia Jerusalén. Nos reunimos diariamente para clamar por el pastorado, las familias de la iglesia, nuestra nación y la expansión misionera.</p>
<h3>Qué hacemos</h3>
<p>Mantenemos una cadena de intercesión diaria y coordinamos vigilias mensuales de clamor y adoración intercesora.</p>
<blockquote>
  <p><strong>Lema de Intercesión:</strong> "Clama a mí, y yo te responderé"<br/>
  <strong>Versículo Clave:</strong> Jeremías 33:3 — <em>"Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces."</em></p>
</blockquote>`
  },
  {
    slug: 'celulas',
    image_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80',
    description: `<p>El ministerio de <strong>Células Familiares</strong> es la columna vertebral de la comunión y discipulado en nuestra iglesia. Las células son grupos pequeños de hermanos que se reúnen semanalmente en hogares de diferentes sectores.</p>
<h3>Qué hacemos y qué estudiamos</h3>
<p>Nos reunimos para alabar a Dios en un ambiente familiar, orar por las necesidades locales, estudiar la palabra de Dios bajo la guía del tema pastoral semanal y compartir un refrigerio en comunión fraternal.</p>
<blockquote>
  <p><strong>Lema de Células:</strong> "Comunión en las casas, crecimiento en la palabra"<br/>
  <strong>Versículo Clave:</strong> Hechos 2:46-47 — <em>"Y perseverando unánimes cada día en el templo, y partiendo el pan en las casas, comían juntos con alegría y sencillez de corazón..."</em></p>
</blockquote>`
  }
];

async function seed() {
  console.log(`--- Iniciando actualización de descripciones y portadas enriquecidas para ${richMinistries.length} ministerios ---`);

  let updatedCount = 0;

  for (const min of richMinistries) {
    const { error } = await supabase
      .from('ministries')
      .update({
        description: min.description,
        image_url: min.image_url
      })
      .eq('slug', min.slug);

    if (error) {
      console.error(`Error al actualizar el ministerio con slug "${min.slug}":`, error.message);
    } else {
      console.log(`Ministerio "${min.slug}" actualizado correctamente.`);
      updatedCount++;
    }
  }

  console.log(`Actualización finalizada: ${updatedCount} de ${richMinistries.length} ministerios actualizados.`);
}

seed();
