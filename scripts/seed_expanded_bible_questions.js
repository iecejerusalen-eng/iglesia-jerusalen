import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const questions = [
  // ==========================================
  // NIVEL 1: PRINCIPIANTES (FÁCIL)
  // ==========================================
  { difficulty_level: 1, question: '¿Quién construyó el arca por mandato de Dios?', option_a: 'Moisés', option_b: 'Noé', option_c: 'Abraham', option_d: 'David', correct_option: 'b', explanation: 'Génesis 6:14 - Dios le ordenó a Noé construir un arca de madera de gofer para salvar a su familia y a las especies del diluvio.' },
  { difficulty_level: 1, question: '¿Cuál es el primer libro de la Biblia?', option_a: 'Éxodo', option_b: 'Mateo', option_c: 'Génesis', option_d: 'Apocalipsis', correct_option: 'c', explanation: 'Génesis 1:1 - Génesis significa "principio" u "origen" y es el primer libro del Pentateuco.' },
  { difficulty_level: 1, question: '¿En qué ciudad nació Jesús?', option_a: 'Nazaret', option_b: 'Jerusalén', option_c: 'Belén', option_d: 'Jericó', correct_option: 'c', explanation: 'Lucas 2:11 / Miqueas 5:2 - Jesús nació en Belén de Judea, cumpliendo la profecía mesiánica.' },
  { difficulty_level: 1, question: '¿Cuántos apóstoles principales eligió Jesús?', option_a: '10', option_b: '12', option_c: '7', option_d: '14', correct_option: 'b', explanation: 'Marcos 3:14 - Jesús estableció a doce apóstoles para que estuviesen con él y para enviarlos a predicar.' },
  { difficulty_level: 1, question: '¿Con qué arma venció David al gigante Goliat?', option_a: 'Una espada de bronce', option_b: 'Una lanza', option_c: 'Una honda y una piedra', option_d: 'Un arco y una flecha', correct_option: 'c', explanation: '1 Samuel 17:50 - David venció al filisteo Goliat con una honda y una piedra en el valle de Elah.' },
  { difficulty_level: 1, question: '¿Quién fue el primer hombre creado por Dios?', option_a: 'Adán', option_b: 'Abel', option_c: 'Set', option_d: 'Enoc', correct_option: 'a', explanation: 'Génesis 2:7 - Dios formó a Adán del polvo de la tierra y sopló en su nariz aliento de vida.' },
  { difficulty_level: 1, question: '¿Qué gran criatura tragó al profeta Jonás?', option_a: 'Un cocodrilo gigante', option_b: 'Un gran pez', option_c: 'Una serpiente marina', option_d: 'Un dragón', correct_option: 'b', explanation: 'Jonás 1:17 - Jonás estuvo en el vientre del gran pez tres días y tres noches antes de ser depositado en tierra.' },
  { difficulty_level: 1, question: '¿Qué mar dividió Moisés con la ayuda de Dios?', option_a: 'Mar Mediterráneo', option_b: 'Mar Muerto', option_c: 'Mar Rojo', option_d: 'Mar de Galilea', correct_option: 'c', explanation: 'Éxodo 14:21 - El Señor hizo que el Mar Rojo se dividiera mediante un fuerte viento oriental.' },
  { difficulty_level: 1, question: '¿Cuántos Mandamientos dio Dios a Moisés en el Sinaí?', option_a: '5', option_b: '10', option_c: '12', option_d: '40', correct_option: 'b', explanation: 'Éxodo 20:1-17 - Dios entregó los 10 Mandamientos grabados en dos tablas de piedra.' },
  { difficulty_level: 1, question: '¿A quién resucitó Jesús tras llevar 4 días en la tumba?', option_a: 'Lázaro', option_b: 'Esteban', option_c: 'Zaqueo', option_d: 'Nicodemo', correct_option: 'a', explanation: 'Juan 11:43 - Jesús clamó a gran voz: "¡Lázaro, ven fuera!" y el que había muerto salió.' },

  // ==========================================
  // NIVEL 2: BÁSICO +
  // ==========================================
  { difficulty_level: 2, question: '¿Cómo se llamaba el alimento milagroso que caía del cielo en el desierto?', option_a: 'Maná', option_b: 'Néctar', option_c: 'Pan de los ángeles', option_d: 'Trigo divino', correct_option: 'a', explanation: 'Éxodo 16:14-15 - Los israelitas llamaron maná a este alimento que parecía semilla de cilantro blanca.' },
  { difficulty_level: 2, question: '¿Qué rey le pidió a Dios sabiduría en lugar de riquezas o larga vida?', option_a: 'Saúl', option_b: 'David', option_c: 'Salomón', option_d: 'Ezequías', correct_option: 'c', explanation: '1 Reyes 3:12 - Salomón pidió un corazón entendido para juzgar al pueblo, y Dios le otorgó sabiduría incomparable.' },
  { difficulty_level: 2, question: '¿Qué le regaló Jacob a su hijo amado José?', option_a: 'Una corona de oro', option_b: 'Una túnica de diversos colores', option_c: 'Un anillo de sello', option_d: 'Un báculo de cedro', correct_option: 'b', explanation: 'Génesis 37:3 - Israel amaba a José más que a todos sus hijos y le hizo una túnica de diversos colores.' },
  { difficulty_level: 2, question: '¿Por qué fue arrojado Daniel al foso de los leones?', option_a: 'Por robar en el palacio', option_b: 'Por no adorar al estatua del rey y orar a su Dios', option_c: 'Por huir del rey', option_d: 'Por destruir un templo', correct_option: 'b', explanation: 'Daniel 6:16 - Daniel continuó orando a Dios tres veces al día en contra del edicto del rey Darío.' },
  { difficulty_level: 2, question: '¿Cuál discípulo caminó sobre el agua hacia Jesús?', option_a: 'Juan', option_b: 'Pedro', option_c: 'Santiago', option_d: 'Andrés', correct_option: 'b', explanation: 'Mateo 14:29 - Pedro descendió de la barca y caminó sobre las aguas para ir a Jesús.' },
  { difficulty_level: 2, question: '¿Qué guió a los magos del Oriente hasta el lugar donde estaba el niño Jesús?', option_a: 'Un ángel visible', option_b: 'Una estrella', option_c: 'Un mapa antiguo', option_d: 'Una columna de fuego', correct_option: 'b', explanation: 'Mateo 2:1 - Vieron su estrella en el oriente y vinieron para adorarle.' },
  { difficulty_level: 2, question: '¿Las murallas de qué ciudad cayeron tras marchar 7 días alrededor de ella?', option_a: 'Jericó', option_b: 'Jerusalén', option_c: 'Babilonia', option_d: 'Samaria', correct_option: 'a', explanation: 'Josué 6:20 - Al séptimo día, el pueblo gritó y los sacerdotes tocaron las bocinas, y el muro de Jericó se derrumbó.' },
  { difficulty_level: 2, question: '¿Quién era el hombre de corta estatura que subió a un árbol sicómoro para ver a Jesús?', option_a: 'Zaqueo', option_b: 'Bartimeo', option_c: 'Cornelio', option_d: 'Mateo', correct_option: 'a', explanation: 'Lucas 19:2-4 - Zaqueo, jefe de los publicanos y rico, subió al sicómoro para ver pasar a Jesús.' },
  { difficulty_level: 2, question: 'Según Juan 3:16, ¿por qué entregó Dios a su Hijo unigénito?', option_a: 'Para juzgar al mundo', option_b: 'Porque tanto amó Dios al mundo', option_c: 'Para mostrar sus milagros', option_d: 'Para castigar la desobediencia', correct_option: 'b', explanation: 'Juan 3:16 - Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree no se pierda.' },
  { difficulty_level: 2, question: '¿Qué señal puso Dios en las nubes como pacto de que no habría otro diluvio universal?', option_a: 'El arco iris', option_b: 'Una paloma blanca', option_c: 'Un rayo de sol dorado', option_d: 'Una nube de gloria', correct_option: 'a', explanation: 'Génesis 9:13 - Mi arco he puesto en las nubes, el cual será por señal del pacto entre mí y la tierra.' },

  // ==========================================
  // NIVEL 3: INTERMEDIO 1
  // ==========================================
  { difficulty_level: 3, question: '¿En qué residía la gran fuerza física de Sansón?', option_a: 'En su armadura divina', option_b: 'En su consagración como nazareo y su cabello no cortado', option_c: 'En su cinturón de oro', option_d: 'En su espada especial', correct_option: 'b', explanation: 'Jueces 16:17 - Sansón confesó a Dalila que era nazareo de Dios desde el vientre de su madre.' },
  { difficulty_level: 3, question: '¿Cuántos jóvenes fueron arrojados al horno de fuego por el rey Nabucodonosor?', option_a: '2', option_b: '3', option_c: '4', option_d: '7', correct_option: 'b', explanation: 'Daniel 3:23-25 - Sadrac, Mesac y Abed-nego fueron arrojados, pero Dios los libró milagrosamente.' },
  { difficulty_level: 3, question: '¿Cuál fue el primer milagro público registrado de Jesús?', option_a: 'Sanar a un ciego', option_b: 'Multiplicar los panes', option_c: 'Convertir el agua en vino en Caná', option_d: 'Caminar sobre el agua', correct_option: 'c', explanation: 'Juan 2:1-11 - Este principio de señales hizo Jesús en Caná de Galilea, y manifestó su gloria.' },
  { difficulty_level: 3, question: '¿En el camino a qué ciudad tuvo Saulo de Tarso su visión transformadora de Jesús?', option_a: 'Antioquía', option_b: 'Damasco', option_c: 'Tarso', option_d: 'Roma', correct_option: 'b', explanation: 'Hechos 9:3-4 - Rodeándole de repente un resplandor de luz del cielo, oyó una voz: "Saulo, Saulo, ¿por qué me persigues?"' },
  { difficulty_level: 3, question: '¿Cuántas plagas envió Dios sobre Egipto para que el Faraón dejara ir a su pueblo?', option_a: '7', option_b: '10', option_c: '12', option_d: '40', correct_option: 'b', explanation: 'Éxodo 7-12 - Fueron 10 plagas en total, terminando con la institución de la Pascua.' },
  { difficulty_level: 3, question: '¿Cómo comienza el famoso Salmo 23 escrito por David?', option_a: 'El Señor es mi luz y mi salvación', option_b: 'El Señor es mi pastor; nada me faltará', option_c: 'Dios es nuestro amparo y fortaleza', option_d: 'Bendice, alma mía, al Señor', correct_option: 'b', explanation: 'Salmo 23:1 - Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar.' },
  { difficulty_level: 3, question: '¿En qué monte le pidió Dios a Abraham que sacrificara a su hijo Isaac?', option_a: 'Monte Sinaí', option_b: 'Monte Moriah', option_c: 'Monte Carmelo', option_d: 'Monte de los Olivos', correct_option: 'b', explanation: 'Génesis 22:2 - Dios probó la fe de Abraham en la tierra de Moriah, sobre uno de los montes.' },
  { difficulty_level: 3, question: '¿Por cuántas monedas de plata traicionó Judas Iscariote a Jesús?', option_a: '20', option_b: '30', option_c: '50', option_d: '100', correct_option: 'b', explanation: 'Mateo 26:15 - Los principales sacerdotes le asignaron treinta piezas de plata por entregarle.' },
  { difficulty_level: 3, question: '¿Quién le dijo a su suegra Noemí: "Tu pueblo será mi pueblo, y tu Dios mi Dios"?', option_a: 'Orfa', option_b: 'Rut', option_c: 'Ana', option_d: 'Rebeca', correct_option: 'b', explanation: 'Rut 1:16 - La moabita Rut demostró una lealtad profunda a Noemí y al Dios de Israel.' },
  { difficulty_level: 3, question: '¿Qué parábola narra la historia del hijo que malgastó su herencia y regresó arrepentido a su padre?', option_a: 'El Buen Samaritano', option_b: 'El Hijo Pródigo', option_c: 'El Sembrador', option_d: 'El Siervo Incompasivo', correct_option: 'b', explanation: 'Lucas 15:11-32 - El padre corrió, se echó sobre su cuello y le besó cuando vio regresar al hijo pródigo.' },

  // ==========================================
  // NIVEL 4: INTERMEDIO 2
  // ==========================================
  { difficulty_level: 4, question: '¿Qué instrumento tocaba David para aliviar el espíritu atormentado del rey Saúl?', option_a: 'Flauta', option_b: 'Arpa / Lira', option_c: 'Tamboril', option_d: 'Trompeta de plata', correct_option: 'b', explanation: '1 Samuel 16:23 - David tomaba el arpa y tocaba con su mano; y Saúl tenía alivio y se sentía mejor.' },
  { difficulty_level: 4, question: '¿Qué profeta hizo caer fuego del cielo en el Monte Carmelo para demostrar que Dios es el único verdadero?', option_a: 'Eliseo', option_b: 'Elías', option_c: 'Isaías', option_d: 'Jeremías', correct_option: 'b', explanation: '1 Reyes 18:38 - Elías desafió a los 450 profetas de Baal, y el fuego del Señor cayó y consumió el holocausto.' },
  { difficulty_level: 4, question: '¿En qué fiesta judía descendió el Espíritu Santo sobre los discípulos en forma de lenguas de fuego?', option_a: 'Pascua', option_b: 'Pentecostés', option_c: 'Tabernáculos', option_d: 'Purim', correct_option: 'b', explanation: 'Hechos 2:1-4 - Cuando llegó el día de Pentecostés, estaban todos unánimes juntos y fueron llenos del Espíritu Santo.' },
  { difficulty_level: 4, question: '¿Qué personaje bíblico caminó con Dios y desapareció porque Dios se lo llevó sin ver la muerte?', option_a: 'Enoc', option_b: 'Matusalén', option_c: 'Abel', option_d: 'Melquisedec', correct_option: 'a', explanation: 'Génesis 5:24 - Caminó, pues, Enoc con Dios, y desapareció, porque le llevó Dios.' },
  { difficulty_level: 4, question: '¿Con cuántos panes y peces alimentó Jesús a más de 5,000 hombres?', option_a: '7 panes y 2 peces', option_b: '5 panes y 2 peces', option_c: '3 panes y 5 peces', option_d: '12 panes y 2 peces', correct_option: 'b', explanation: 'Mateo 14:19-21 - Un muchacho tenía cinco panes de cebada y dos pececillos, y Jesús los bendijo multiplicándolos.' },
  { difficulty_level: 4, question: 'En la parábola del Buen Samaritano, ¿quiénes pasaron de largo antes de que el samaritano ayudara al herido?', option_a: 'Un soldado y un fariseo', option_b: 'Un sacerdote y un levita', option_c: 'Un escriba y un cobrador de impuestos', option_d: 'Un comerciante y un romano', correct_option: 'b', explanation: 'Lucas 10:30-37 - Un sacerdote y un levita bajaban por el mismo camino y viéndole, pasaron de largo.' },
  { difficulty_level: 4, question: '¿Cuál era el nombre original de Abraham antes de que Dios se lo cambiara?', option_a: 'Abram', option_b: 'Abner', option_c: 'Abinadab', option_d: 'Abimelec', correct_option: 'a', explanation: 'Génesis 17:5 - Dios le dijo: "No se llamará más tu nombre Abram, sino que será tu nombre Abraham."' },
  { difficulty_level: 4, question: '¿Qué nombre babilónico le pusieron al profeta Daniel en la corte de Nabucodonosor?', option_a: 'Sadrac', option_b: 'Beltsasar', option_c: 'Abed-nego', option_d: 'Mesac', correct_option: 'b', explanation: 'Daniel 1:7 - El jefe de los eunucos puso a Daniel el nombre de Beltsasar.' },
  { difficulty_level: 4, question: '¿A qué edad aproximada comenzó Jesús su ministerio terrenal público?', option_a: '12 años', option_b: '20 años', option_c: '30 años', option_d: '33 años', correct_option: 'c', explanation: 'Lucas 3:23 - Jesús mismo al comenzar su ministerio era como de treinta años.' },
  { difficulty_level: 4, question: '¿Qué hacían Pablo y Silas a medianoche en la cárcel de Filipos cuando ocurrió un gran terremoto?', option_a: 'Dormían profundamente', option_b: 'Oraban y cantaban himnos a Dios', option_c: 'Planeaban una fuga', option_d: 'Discutían con los guardias', correct_option: 'b', explanation: 'Hechos 16:25-26 - A medianoche, orando Pablo y Silas, cantaban himnos a Dios; y vino un gran terremoto.' },

  // ==========================================
  // NIVEL 5: AVANZADO 1
  // ==========================================
  { difficulty_level: 5, question: '¿Cuál es el capítulo más largo de toda la Biblia con 176 versículos?', option_a: 'Salmo 23', option_b: 'Isaías 53', option_c: 'Salmo 119', option_d: 'Génesis 1', correct_option: 'c', explanation: 'Salmo 119 - Es un acróstico hebreo dedicado íntegramente a exaltar la palabra y ley de Dios.' },
  { difficulty_level: 5, question: '¿Qué oficio o profesión tenía el evangelista Lucas según el apóstol Pablo?', option_a: 'Pescador', option_b: 'Médico amado', option_c: 'Cobrador de impuestos', option_d: 'Carpintero', correct_option: 'b', explanation: 'Colosenses 4:14 - Pablo se refiere a él en Colosenses 4:14 diciendo: "Os saluda Lucas, el médico amado."' },
  { difficulty_level: 5, question: '¿Cuántos años reinó en total el rey David sobre Israel (Hebrón y Jerusalén)?', option_a: '20 años', option_b: '30 años', option_c: '40 años', option_d: '50 años', correct_option: 'c', explanation: '1 Reyes 2:11 - David reinó cuarenta años: siete años en Hebrón, y treinta y tres años en Jerusalén.' },
  { difficulty_level: 5, question: '¿Quién fue el hombre más longevo registrado en la Biblia, viviendo 969 años?', option_a: 'Enoc', option_b: 'Matusalén', option_c: 'Noé', option_d: 'Jared', correct_option: 'b', explanation: 'Génesis 5:27 - Fueron todos los días de Matusalén novecientos sesenta y nueve años; y murió.' },
  { difficulty_level: 5, question: '¿Qué importante cargo ocupaba Nehemías en el palacio del rey persa Artajerjes?', option_a: 'Gran Visir', option_b: 'Copero del rey', option_c: 'General del ejército', option_d: 'Escriba real', correct_option: 'b', explanation: 'Nehemías 1:11 - Nehemías era el copero del rey, puesto de alta confianza que le permitió reconstruir los muros.' },
  { difficulty_level: 5, question: '¿En el año de la muerte de qué rey vio el profeta Isaías al Señor sentado sobre un trono alto y sublime?', option_a: 'Rey Saúl', option_b: 'Rey Uzías', option_c: 'Rey Acaz', option_d: 'Rey Manasés', correct_option: 'b', explanation: 'Isaías 6:1 - En el año que murió el rey Uzías vi yo al Señor sentado sobre un trono alto y sublime.' },
  { difficulty_level: 5, question: '¿En qué isla estaba exiliado el apóstol Juan cuando escribió el libro de Apocalipsis?', option_a: 'Chipre', option_b: 'Patmos', option_c: 'Malta', option_d: 'Creta', correct_option: 'b', explanation: 'Apocalipsis 1:9 - Yo Juan... estaba en la isla llamada Patmos, por causa de la palabra de Dios y el testimonio de Jesucristo.' },
  { difficulty_level: 5, question: '¿Quién era el rey de Salem y sacerdote del Dios Altísimo a quien Abraham dio los diezmos?', option_a: 'Melquisedec', option_b: 'Abimelec', option_c: 'Jetro', option_d: 'Balaam', correct_option: 'a', explanation: 'Génesis 14:18 - Melquisedec, rey de Salem y sacerdote del Dios Altísimo, sacó pan y vino y bendijo a Abram.' },
  { difficulty_level: 5, question: '¿A qué piadoso rey de Judá le añadió Dios 15 años más de vida tras llorar y orar en su enfermedad?', option_a: 'Josías', option_b: 'Ezequías', option_c: 'Joash', option_d: 'Jehosafat', correct_option: 'b', explanation: 'Isaías 38:5 - He oído tu oración... he aquí que yo añado a tus días quince años (dicho al rey Ezequías).' },
  { difficulty_level: 5, question: '¿Qué apodos o título dio Jesús a los hermanos Santiago y Juan, hijos de Zebedeo?', option_a: 'Columnas de la fe', option_b: 'Boanerges (Hijos del trueno)', option_c: 'Leones de Judá', option_d: 'Pescadores de hombres', correct_option: 'b', explanation: 'Marcos 3:17 - A Jacobo y a Juan los apellidó Boanerges, que es: Hijos del trueno.' },

  // ==========================================
  // NIVEL 6 A 15: NIVELES AVANZADOS Y MAGISTERIO BÍBLICO
  // ==========================================
  { difficulty_level: 6, question: '¿Qué tres cosas había preparado el escriba Esdras en su corazón respecto a la Ley del Señor?', option_a: 'Leerla, guardarla y quemar ídolos', option_b: 'Escudriñarla, cumplirla y enseñarla', option_c: 'Memorizarla, traducirla y cantarla', option_d: 'Escribirla, sellarla y esconderla', correct_option: 'b', explanation: 'Esdras 7:10 - Esdras había preparado su corazón para inquisir la ley de Jehová y para cumplirla y enseñarla.' },
  { difficulty_level: 6, question: '¿En qué isla naufragó la nave en la que el apóstol Pablo era llevado prisionero a Roma?', option_a: 'Sicilia', option_b: 'Malta', option_c: 'Rodas', option_d: 'Samos', correct_option: 'b', explanation: 'Hechos 28:1 - Estando ya a salvo, supimos que la isla se llamaba Malta.' },
  { difficulty_level: 6, question: '¿Cuántos capítulos contiene en total el libro del profeta Isaías?', option_a: '52', option_b: '66', option_c: '70', option_d: '150', correct_option: 'b', explanation: 'Isaías 66:1 - El libro de Isaías cuenta con 66 capítulos, comparado simbólicamente con los 66 libros de la Biblia.' },
  { difficulty_level: 6, question: '¿Cuál era el nombre original de la esposa de Abraham antes de ser llamada Sara?', option_a: 'Sarai', option_b: 'Milca', option_c: 'Cetura', option_d: 'Agar', correct_option: 'a', explanation: 'Génesis 17:15 - A Sarai tu mujer no la llamarás Sarai, mas Sara será su nombre.' },
  { difficulty_level: 7, question: '¿Cuántos frutos o virtudes componen el "Fruto del Espíritu" según Gálatas 5?', option_a: '7', option_b: '9', option_c: '12', option_d: '10', correct_option: 'b', explanation: 'Gálatas 5:22-23 - El fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza (9 virtudes).' },
  { difficulty_level: 7, question: '¿Qué nombre egipcio le dio el Faraón a José cuando lo nombró gobernador de Egipto?', option_a: 'Zafnat-panea', option_b: 'Potifera', option_c: 'Ramsés', option_d: 'Sisenac', correct_option: 'a', explanation: 'Génesis 41:45 - Y llamó Faraón el nombre de José, Zafnat-panea (revelador de secretos).' },
  { difficulty_level: 8, question: '¿En qué lugar de Atenas dio Pablo su famoso discurso sobre el "Dios No Conocido"?', option_a: 'El Coliseo', option_b: 'El Areópago (Colina de Marte)', option_c: 'El Partenón', option_d: 'El Ágora Romana', correct_option: 'b', explanation: 'Hechos 17:22-23 - Pablo, puesto en pie en medio del Areópago, predicó a Cristo a los filósofos atenienses.' },
  { difficulty_level: 8, question: '¿Tras luchar toda la noche con un ángel en Peniel, qué nuevo nombre recibió Jacob?', option_a: 'Israel', option_b: 'Jeshurún', option_c: 'Efraín', option_d: 'Judá', correct_option: 'a', explanation: 'Génesis 32:28 - No se llamará más tu nombre Jacob, sino Israel; porque has luchado con Dios y con los hombres.' },
  { difficulty_level: 9, question: '¿Qué afirma Pablo sobre toda la Escritura en 2 Timoteo 3:16?', option_a: 'Que fue escrita por reyes sabios', option_b: 'Que toda la Escritura es inspirada por Dios', option_c: 'Que contiene misterios indescifrables', option_d: 'Que es un compendio de tradiciones humanas', correct_option: 'b', explanation: '2 Timoteo 3:16 - Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir.' },
  { difficulty_level: 9, question: '¿Cómo se le conoce a la gran declaración de fe judía en Deuteronomio 6:4: "Oye, Israel: Jehová nuestro Dios, Jehová uno es"?', option_a: 'La Menorá', option_b: 'El Shemá', option_c: 'El Kaddish', option_d: 'La Torá', correct_option: 'b', explanation: 'Deuteronomio 6:4 - Esta confesión monoteísta fundamental es conocida como el Shemá ("Escucha").' },
  { difficulty_level: 10, question: '¿Qué profecía mesiánica afirma: "Mas él herido fue por nuestras rebeliones, molido por nuestros pecados"?', option_a: 'Jeremías 31', option_b: 'Isaías 53', option_c: 'Salmo 22', option_d: 'Zacarías 12', correct_option: 'b', explanation: 'Isaías 53:5 - El capítulo 53 de Isaías describe proféticamente el sacrificio vicario del Señor Jesús.' },
  { difficulty_level: 10, question: 'En el Día de la Expiación (Yom Kipur), ¿cómo se llamaba el macho cabrío enviado al desierto?', option_a: 'Holocausto', option_b: 'Azazel (cabrío expiatorio)', option_c: 'Maná de expiación', option_d: 'Ofrenda mecida', correct_option: 'b', explanation: 'Levítico 16:8-10 - El macho cabrío sobre el cual cayere la suerte por Azazel será enviado al desierto para expiación.' },
  { difficulty_level: 11, question: '¿Quién era Febe, encomendada por Pablo al inicio del capítulo 16 de Romanos?', option_a: 'Una diaconisa de la iglesia en Cencrea', option_b: 'La esposa de Filemón', option_c: 'Una profetisa de Antioquía', option_d: 'La madre de Timoteo', correct_option: 'a', explanation: 'Romanos 16:1-2 - Os recomiendo además a nuestra hermana Febe, la cual es diaconisa de la iglesia en Cencrea.' },
  { difficulty_level: 12, question: '¿Cuántos proverbios y cantares se le atribuyen al sabio rey Salomón en 1 Reyes 4?', option_a: '1,000 proverbios y 100 cantares', option_b: '3,000 proverbios y 1,005 cantares', option_c: '5,000 proverbios y 500 cantares', option_d: '150 proverbios y 70 cantares', correct_option: 'b', explanation: '1 Reyes 4:32 - Y compuso tres mil proverbios, y sus cantares fueron mil cinco.' },
  { difficulty_level: 13, question: '¿Qué joven cayó por la ventana desde un tercer piso rendido de sueño mientras Pablo predicaba largamente?', option_a: 'Eutico', option_b: 'Tíquico', option_c: 'Trófimo', option_d: 'Erasto', correct_option: 'a', explanation: 'Hechos 20:9 - Un joven llamado Eutico cayo del tercer piso abajo mientras Pablo predicaba, y fue revivido.' },
  { difficulty_level: 14, question: '¿Cuántos soldados del ejército asirio de Senaquerib fueron heridos por el ángel del Señor en una sola noche?', option_a: '50,000', option_b: '185,000', option_c: '100,000', option_d: '250,000', correct_option: 'b', explanation: '2 Reyes 19:35 - El ángel de Jehová hirió en el campamento de los asirios a ciento ochenta y cinco mil.' },
  { difficulty_level: 15, question: 'En la promesa a la iglesia en Pérgamo, ¿qué se dará al que venciere junto con el maná escondido?', option_a: 'Una corona de doce estrellas', option_b: 'Una piedrecita blanca y en la piedrecita escrito un nombre nuevo', option_c: 'Un cetro de hierro purificado', option_d: 'Una vestidura de lino fino', correct_option: 'b', explanation: 'Apocalipsis 2:17 - Le daré una piedrecita blanca, y en la piedrecita escrito un nombre nuevo.' }
];

async function seed() {
  console.log(`🚀 Iniciando inserción de ${questions.length} preguntas bíblicas...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const q of questions) {
    // First check if question exists to prevent duplicate insertion
    const { data: existing } = await supabase
      .from('game_biblionario_questions')
      .select('id')
      .eq('question', q.question)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('game_biblionario_questions')
        .update(q)
        .eq('id', existing.id);
      if (error) {
        console.error(`❌ Error actualizando "${q.question.substring(0, 30)}...":`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } else {
      const { error } = await supabase
        .from('game_biblionario_questions')
        .insert([q]);

      if (error) {
        console.error(`❌ Error insertando "${q.question.substring(0, 30)}...":`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    }
  }

  console.log(`\n✅ Proceso completado exitosamente:`);
  console.log(`   - Preguntas insertadas/actualizadas: ${successCount}`);
  console.log(`   - Errores: ${errorCount}`);
}

seed();
