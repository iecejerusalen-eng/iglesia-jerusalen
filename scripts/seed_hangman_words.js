import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const words = [
  { word: 'JERUSALEN', category: 'LUGAR BÍBLICO', hint: 'La ciudad santa de David y capital espiritual de Israel.' },
  { word: 'BETLEHEM', category: 'LUGAR BÍBLICO', hint: 'Lugar de nacimiento del rey David y del Señor Jesús.' },
  { word: 'BETHANIA', category: 'LUGAR BÍBLICO', hint: 'Aldea donde vivían Lázaro, Marta y María.' },
  { word: 'MOISES', category: 'PERSONAJE BÍBLICO', hint: 'Líder que guiós a Israel fuera de Egipto y recibió los Diez Mandamientos.' },
  { word: 'ABRAHAM', category: 'PERSONAJE BÍBLICO', hint: 'Padre de la fe y de una multitud de naciones.' },
  { word: 'SALOMON', category: 'PERSONAJE BÍBLICO', hint: 'Rey de Israel famoso por su sabiduría e hijo de David.' },
  { word: 'DEBORA', category: 'PERSONAJE BÍBLICO', hint: 'Profetisa y única mujer juez de Israel.' },
  { word: 'ESTER', category: 'PERSONAJE BÍBLICO', hint: 'Reina judía que salvó a su pueblo del decreto de Hamán.' },
  { word: 'APOCALIPSIS', category: 'LIBRO BÍBLICO', hint: 'Último libro del Nuevo Testamento escrito por Juan en Patmos.' },
  { word: 'PROVERBIOS', category: 'LIBRO BÍBLICO', hint: 'Libro de sabiduría práctica escrito principalmente por Salomón.' },
  { word: 'GENESIS', category: 'LIBRO BÍBLICO', hint: 'El libro de los comienzos y la creación del mundo.' },
  { word: 'PENTECOSTES', category: 'FECHA / FESTIVIDAD', hint: 'Día en que descendió el Espíritu Santo sobre los discípulos.' },
  { word: 'REDENCION', category: 'CONCEPTO TEOLÓGICO', hint: 'Rescate y liberación del pecado a través de la sangre de Cristo.' },
  { word: 'JUSTIFICACION', category: 'CONCEPTO TEOLÓGICO', hint: 'Declaración judicial por la cual Dios perdona al pecador por la fe.' },
  { word: 'MISERICORDIA', category: 'ATRIBUTO DIVINO', hint: 'Compasión entrañable por el necesitado y perdón inmerecido.' },
  { word: 'SANTIDAD', category: 'ATRIBUTO DIVINO', hint: 'Pureza absoluta y separación total del mal.' },
  { word: 'GETSEMANI', category: 'LUGAR BÍBLICO', hint: 'Huerto de los olivos donde Jesús oró en su noche de agonía.' },
  { word: 'NAZARET', category: 'LUGAR BÍBLICO', hint: 'Ciudad de Galilea donde creció Jesús.' },
  { word: 'SAMARIA', category: 'LUGAR BÍBLICO', hint: 'Región central entre Judea y Galilea.' },
  { word: 'MELQUISEDEC', category: 'PERSONAJE BÍBLICO', hint: 'Rey de Salem y sacerdote del Dios Altísimo sin genealogía.' },
  { word: 'BABILONIA', category: 'IMPERIO / CIUDAD', hint: 'Imperio donde los judíos estuvieron desterrados 70 años.' },
  { word: 'EZEQUIEL', category: 'PROFETA', hint: 'Profeta que vio la visión del valle de los huesos secos.' },
  { word: 'HABACUC', category: 'PROFETA', hint: 'Profeta que proclamó: "El justo por su fe vivirá".' },
  { word: 'SANTIAGO', category: 'APÓSTOL', hint: 'Hermano de Juan y uno de los tres discípulos del círculo íntimo.' },
  { difficulty_level: 1, word: 'JONAS', category: 'PROFETA', hint: 'Profeta tragado por un gran pez tras huir de Dios.' }
];

async function seed() {
  console.log(`🚀 Sembrando ${words.length} palabras bíblicas para el juego del Ahorcado...`);
  let count = 0;
  for (const w of words) {
    const { data: existing } = await supabase
      .from('biblical_words')
      .select('id')
      .eq('word', w.word)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('biblical_words').insert([w]);
      if (!error) count++;
    } else {
      count++;
    }
  }
  console.log(`✅ Palabras sembradas exitosamente: ${count}`);
}

seed();
