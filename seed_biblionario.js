import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env natively
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const questions = [
  // Nivel 1
  { difficulty_level: 1, question: '¿Quién construyó el arca?', option_a: 'Moisés', option_b: 'Noé', option_c: 'Abraham', option_d: 'David', correct_option: 'b', explanation: 'Dios le ordenó a Noé construir un arca para salvar a su familia y a los animales del diluvio (Génesis 6:14).' },
  { difficulty_level: 1, question: '¿Cuál es el primer libro de la Biblia?', option_a: 'Éxodo', option_b: 'Mateo', option_c: 'Génesis', option_d: 'Apocalipsis', correct_option: 'c', explanation: 'Génesis es el primer libro de la Biblia y significa "origen" o "principio".' },
  // Nivel 2
  { difficulty_level: 2, question: '¿Quién derrotó al gigante Goliat?', option_a: 'Saúl', option_b: 'Salomón', option_c: 'David', option_d: 'Josué', correct_option: 'c', explanation: 'David, siendo un joven pastor, derrotó a Goliat con una honda y una piedra (1 Samuel 17).' },
  { difficulty_level: 2, question: '¿Cuántos apóstoles tenía Jesús?', option_a: '10', option_b: '12', option_c: '14', option_d: '7', correct_option: 'b', explanation: 'Jesús eligió a 12 apóstoles para que estuvieran con él y para enviarlos a predicar (Marcos 3:14).' },
  // Nivel 3
  { difficulty_level: 3, question: '¿Qué animal se tragó a Jonás?', option_a: 'Un cocodrilo', option_b: 'Un gran pez', option_c: 'Un león', option_d: 'Un dragón', correct_option: 'b', explanation: 'Dios dispuso un gran pez que se tragó a Jonás, donde estuvo tres días y tres noches (Jonás 1:17).' },
  { difficulty_level: 3, question: '¿En qué ciudad nació Jesús?', option_a: 'Nazaret', option_b: 'Jerusalén', option_c: 'Belén', option_d: 'Jericó', correct_option: 'c', explanation: 'Jesús nació en Belén de Judea, cumpliendo la profecía (Miqueas 5:2, Mateo 2:1).' },
  // Nivel 4
  { difficulty_level: 4, question: '¿Cuál de estos mares dividió Moisés?', option_a: 'Mar Mediterráneo', option_b: 'Mar Muerto', option_c: 'Mar Rojo', option_d: 'Mar de Galilea', correct_option: 'c', explanation: 'Moisés extendió su mano sobre el Mar Rojo y Dios lo dividió para que los israelitas cruzaran en seco (Éxodo 14:21).' },
  { difficulty_level: 4, question: '¿Quién fue el primer hombre creado?', option_a: 'Abraham', option_b: 'Adán', option_c: 'Set', option_d: 'Caín', correct_option: 'b', explanation: 'Adán fue el primer hombre, creado por Dios del polvo de la tierra (Génesis 2:7).' },
  // Nivel 5
  { difficulty_level: 5, question: '¿Qué profeta fue arrojado a un foso de leones?', option_a: 'Jeremías', option_b: 'Isaías', option_c: 'Ezequiel', option_d: 'Daniel', correct_option: 'd', explanation: 'Daniel fue arrojado al foso de los leones por orar a Dios, pero Dios cerró la boca de los leones (Daniel 6).' },
  { difficulty_level: 5, question: '¿Cuántas plagas cayeron sobre Egipto?', option_a: '7', option_b: '10', option_c: '12', option_d: '40', correct_option: 'b', explanation: 'Fueron 10 plagas en total, terminando con la muerte de los primogénitos (Éxodo 7-12).' },
  // Nivel 6
  { difficulty_level: 6, question: '¿A quién le dio Dios los 10 Mandamientos?', option_a: 'Aarón', option_b: 'Josué', option_c: 'Moisés', option_d: 'Elías', correct_option: 'c', explanation: 'Dios le entregó a Moisés las tablas de la ley en el Monte Sinaí (Éxodo 20).' },
  { difficulty_level: 6, question: '¿Qué pan especial comieron los israelitas en el desierto?', option_a: 'Pan de vida', option_b: 'Maná', option_c: 'Pan ácimo', option_d: 'Trigo del cielo', correct_option: 'b', explanation: 'Dios les proporcionó maná, que caía del cielo cada mañana (Éxodo 16).' },
  // Nivel 7
  { difficulty_level: 7, question: '¿Quién fue conocido por su gran sabiduría?', option_a: 'Salomón', option_b: 'David', option_c: 'Saúl', option_d: 'Samuel', correct_option: 'a', explanation: 'El rey Salomón pidió sabiduría a Dios, y Dios se la concedió en abundancia (1 Reyes 3).' },
  { difficulty_level: 7, question: '¿De qué árbol no podían comer Adán y Eva?', option_a: 'El árbol de la vida', option_b: 'El árbol del conocimiento del bien y del mal', option_c: 'El manzano', option_d: 'El árbol de las naciones', correct_option: 'b', explanation: 'Dios les prohibió comer del árbol de la ciencia del bien y del mal (Génesis 2:17).' },
  // Nivel 8
  { difficulty_level: 8, question: '¿Cuál era el nombre babilónico de Daniel?', option_a: 'Sadrac', option_b: 'Mesac', option_c: 'Abed-nego', option_d: 'Beltsasar', correct_option: 'd', explanation: 'El jefe de los eunucos puso a Daniel el nombre de Beltsasar (Daniel 1:7).' },
  { difficulty_level: 8, question: '¿Qué instrumento tocaba David para el rey Saúl?', option_a: 'Flauta', option_b: 'Arpa', option_c: 'Trompeta', option_d: 'Pandero', correct_option: 'b', explanation: 'David tocaba el arpa para calmar el espíritu atormentado del rey Saúl (1 Samuel 16:23).' },
  // Nivel 9
  { difficulty_level: 9, question: '¿Qué discípulo caminó sobre el agua hacia Jesús?', option_a: 'Juan', option_b: 'Pedro', option_c: 'Santiago', option_d: 'Andrés', correct_option: 'b', explanation: 'Pedro pidió a Jesús ir hacia él caminando sobre las aguas, aunque luego dudó y se hundió (Mateo 14:29).' },
  { difficulty_level: 9, question: '¿Quién sobrevivió tras ser arrojado a un horno de fuego ardiente?', option_a: 'Sadrac, Mesac y Abed-nego', option_b: 'Daniel y sus amigos', option_c: 'Jeremías y Baruc', option_d: 'Pablo y Silas', correct_option: 'a', explanation: 'Fueron arrojados por no adorar la estatua de oro, pero Dios los protegió (Daniel 3).' },
  // Nivel 10
  { difficulty_level: 10, question: '¿Cuál de los Evangelios fue escrito por un médico?', option_a: 'Mateo', option_b: 'Marcos', option_c: 'Lucas', option_d: 'Juan', correct_option: 'c', explanation: 'Lucas, conocido como "el médico amado" (Colosenses 4:14), escribió el Evangelio de Lucas y Hechos.' },
  { difficulty_level: 10, question: '¿A qué edad comenzó Jesús su ministerio público?', option_a: '25 años', option_b: '30 años', option_c: '33 años', option_d: '12 años', correct_option: 'b', explanation: 'Jesús tenía unos 30 años cuando fue bautizado y comenzó su ministerio (Lucas 3:23).' },
  // Nivel 11
  { difficulty_level: 11, question: '¿Cuál es el capítulo más largo de la Biblia?', option_a: 'Salmo 23', option_b: 'Isaías 53', option_c: 'Salmo 119', option_d: 'Salmo 150', correct_option: 'c', explanation: 'El Salmo 119 es el capítulo más largo, con 176 versículos dedicados a la ley de Dios.' },
  { difficulty_level: 11, question: '¿Quién escribió el libro de Apocalipsis?', option_a: 'Pablo', option_b: 'Pedro', option_c: 'Juan', option_d: 'Mateo', correct_option: 'c', explanation: 'El apóstol Juan escribió el libro de Apocalipsis estando exiliado en la isla de Patmos (Apocalipsis 1:9).' },
  // Nivel 12
  { difficulty_level: 12, question: '¿Cuánto tiempo reinó David sobre Israel?', option_a: '20 años', option_b: '30 años', option_c: '40 años', option_d: '50 años', correct_option: 'c', explanation: 'David reinó sobre Israel durante 40 años: 7 en Hebrón y 33 en Jerusalén (1 Reyes 2:11).' },
  { difficulty_level: 12, question: '¿Quién fue el padre de Matusalén?', option_a: 'Enoc', option_b: 'Lamec', option_c: 'Noé', option_d: 'Set', correct_option: 'a', explanation: 'Enoc fue el padre de Matusalén, y caminó con Dios (Génesis 5:21-22).' },
  // Nivel 13
  { difficulty_level: 13, question: '¿Qué isla naufragó el apóstol Pablo?', option_a: 'Chipre', option_b: 'Creta', option_c: 'Patmos', option_d: 'Malta', correct_option: 'd', explanation: 'El barco donde iba Pablo naufragó y llegaron a salvo a la isla de Malta (Hechos 28:1).' },
  { difficulty_level: 13, question: '¿Cuál era el oficio de Nehemías en la corte del rey Artajerjes?', option_a: 'Escriba', option_b: 'Copero', option_c: 'General', option_d: 'Consejero', correct_option: 'b', explanation: 'Nehemías era el copero del rey, una posición de alta confianza (Nehemías 1:11).' },
  // Nivel 14
  { difficulty_level: 14, question: '¿Cuántos capítulos tiene el libro de Isaías?', option_a: '66', option_b: '52', option_c: '150', option_d: '40', correct_option: 'a', explanation: 'El libro del profeta Isaías contiene exactamente 66 capítulos.' },
  { difficulty_level: 14, question: '¿Qué rey de Judá fue sanado y se le añadieron 15 años de vida?', option_a: 'Josías', option_b: 'Acaz', option_c: 'Ezequías', option_d: 'Manasés', correct_option: 'c', explanation: 'Ezequías oró a Dios cuando estaba a punto de morir, y Dios le añadió 15 años más de vida (Isaías 38).' },
  // Nivel 15
  { difficulty_level: 15, question: '¿Quién era el padre de los hijos del trueno (Boanerges)?', option_a: 'Jonás', option_b: 'Zebedeo', option_c: 'Alfeo', option_d: 'Zacarías', correct_option: 'b', explanation: 'Jacobo y Juan, los hijos del trueno, eran hijos de Zebedeo (Marcos 3:17).' },
  { difficulty_level: 15, question: '¿Cuál era el nombre original de la esposa de Abraham?', option_a: 'Sara', option_b: 'Sarai', option_c: 'Hagar', option_d: 'Milca', correct_option: 'b', explanation: 'Su nombre original era Sarai, y Dios se lo cambió a Sara, que significa princesa (Génesis 17:15).' }
];

async function seed() {
  console.log('Insertando preguntas...');
  let successCount = 0;
  for (const q of questions) {
    const { error } = await supabase.from('game_biblionario_questions').insert([q]);
    if (error) {
      console.error('Error insertando pregunta:', q.question, error.message);
    } else {
      successCount++;
    }
  }
  console.log(`¡Proceso completado! ${successCount}/${questions.length} preguntas insertadas.`);
}

seed();
