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

async function seed() {
  console.log('--- Iniciando siembra automática de alabanzas, himnos y categorías ---');

  // 1. Tipos de Canción (Categorías)
  const defaultTypes = ['Gozo', 'Adoración', 'Himno', 'Alabanza', 'Clamor', 'Ofrenda', 'Apertura'];
  console.log('Verificando tipos de canción...');
  
  for (const typeName of defaultTypes) {
    const { error } = await supabase
      .from('song_types')
      .upsert({ name: typeName }, { onConflict: 'name' });
    if (error) {
      console.warn(`Error al asegurar tipo "${typeName}":`, error.message);
    }
  }

  // 2. Estilos de Canción (Géneros)
  const defaultStyles = ['Contemporáneo', 'Balada', 'Folclore', 'Coral', 'Rock', 'Pop Worship', 'Cumbia Cristiana', 'Tradicional'];
  console.log('Verificando estilos/géneros de canción...');
  
  for (const styleName of defaultStyles) {
    const { error } = await supabase
      .from('song_styles')
      .upsert({ name: styleName }, { onConflict: 'name' });
    if (error) {
      console.warn(`Error al asegurar estilo "${styleName}":`, error.message);
    }
  }

  // Obtener los tipos y estilos de la BD con sus IDs autogenerados
  const { data: typesData } = await supabase.from('song_types').select('*');
  const { data: stylesData } = await supabase.from('song_styles').select('*');

  const typesMap = {};
  typesData?.forEach(t => { typesMap[t.name] = t.id; });

  const stylesMap = {};
  stylesData?.forEach(s => { stylesMap[s.name] = s.id; });

  // 3. Canciones de Muestra (Alabanzas e Himnos con acordes TipTap)
  const sampleSongs = [
    {
      title: 'Cuán Grande Es Él',
      artist: 'Himno Tradicional',
      bpm: 72,
      type_id: typesMap['Himno'],
      style_id: stylesMap['Tradicional'],
      has_chords: true,
      lyrics: `<p>Señor, mi Dios, al contemplar los cielos,</p><p>el fir<ruby class="chord-annotation" data-chord="A">ma<rt class="chord-name">A</rt></ruby>men<ruby class="chord-annotation" data-chord="D">to<rt class="chord-name">D</rt></ruby> y las estre<ruby class="chord-annotation" data-chord="E">llas<rt class="chord-name">E</rt></ruby> mil,</p><p>al oír tu voz en los po<ruby class="chord-annotation" data-chord="A">ten<rt class="chord-name">A</rt></ruby>tes true<ruby class="chord-annotation" data-chord="D">nos<rt class="chord-name">D</rt></ruby></p><p>y ver brillar al sol en su cenit...</p><br/><p><strong>Coro:</strong></p><p>Mi co<ruby class="chord-annotation" data-chord="A">ra<rt class="chord-name">A</rt></ruby>zón entona la can<ruby class="chord-annotation" data-chord="D">ción<rt class="chord-name">D</rt></ruby>:</p><p>¡Cuán grande <ruby class="chord-annotation" data-chord="E">es<rt class="chord-name">E</rt></ruby> Él! ¡Cuán grande <ruby class="chord-annotation" data-chord="A">es<rt class="chord-name">A</rt></ruby> Él!</p><p>Mi co<ruby class="chord-annotation" data-chord="A">ra<rt class="chord-name">A</rt></ruby>zón entona la can<ruby class="chord-annotation" data-chord="D">ción<rt class="chord-name">D</rt></ruby>:</p><p>¡Cuán grande <ruby class="chord-annotation" data-chord="E">es<rt class="chord-name">E</rt></ruby> Él! ¡Cuán grande <ruby class="chord-annotation" data-chord="A">es<rt class="chord-name">A</rt></ruby> Él!</p>`
    },
    {
      title: 'Gracia Sublime Es',
      artist: 'Phil Wickham / En Espíritu y en Verdad',
      bpm: 103,
      type_id: typesMap['Alabanza'],
      style_id: stylesMap['Pop Worship'],
      has_chords: true,
      lyrics: `<p>¿Quién rompe el po<ruby class="chord-annotation" data-chord="C">der<rt class="chord-name">C</rt></ruby> del pecado?</p><p>Su amor es fuer<ruby class="chord-annotation" data-chord="F">te<rt class="chord-name">F</rt></ruby> y poderoso,</p><p>el Rey de glo<ruby class="chord-annotation" data-chord="Am">ria<rt class="chord-name">Am</rt></ruby>, el Rey ma<ruby class="chord-annotation" data-chord="G">jes<rt class="chord-name">G</rt></ruby>tuoso...</p><br/><p><strong>Coro:</strong></p><p>Gra<ruby class="chord-annotation" data-chord="C">cia<rt class="chord-name">C</rt></ruby> sublime es,</p><p>per<ruby class="chord-annotation" data-chord="F">fec<rt class="chord-name">F</rt></ruby>to es tu amor,</p><p>tomaste mi lu<ruby class="chord-annotation" data-chord="Am">gar<rt class="chord-name">Am</rt></ruby>,</p><p>llevaste mi do<ruby class="chord-annotation" data-chord="G">lor<rt class="chord-name">G</rt></ruby>...</p>`
    },
    {
      title: 'Grande y Fuerte',
      artist: 'Miel San Marcos',
      bpm: 130,
      type_id: typesMap['Gozo'],
      style_id: stylesMap['Pop Worship'],
      has_chords: true,
      lyrics: `<p>Grande y fuer<ruby class="chord-annotation" data-chord="G">te<rt class="chord-name">G</rt></ruby> es nuestro Dios,</p><p>grande y fuer<ruby class="chord-annotation" data-chord="C">te<rt class="chord-name">C</rt></ruby> es nuestro Dios,</p><p>grande y fuer<ruby class="chord-annotation" data-chord="G">te<rt class="chord-name">G</rt></ruby> es nuestro Dios,</p><p>grande y fuer<ruby class="chord-annotation" data-chord="D">te<rt class="chord-name">D</rt></ruby> es nuestro Dios.</p><br/><p><strong>Estrofa:</strong></p><p>Vestido en glo<ruby class="chord-annotation" data-chord="Em">ria<rt class="chord-name">Em</rt></ruby>, corona de po<ruby class="chord-annotation" data-chord="C">der<rt class="chord-name">C</rt></ruby>, la creación pro<ruby class="chord-annotation" data-chord="G">cla<rt class="chord-name">G</rt></ruby>ma su ma<ruby class="chord-annotation" data-chord="D">jes<rt class="chord-name">D</rt></ruby>tad...</p>`
    },
    {
      title: 'Tu Fidelidad Es Grande',
      artist: 'Himno Tradicional / Marcos Witt',
      bpm: 65,
      type_id: typesMap['Adoración'],
      style_id: stylesMap['Balada'],
      has_chords: true,
      lyrics: `<p>Tu fi<ruby class="chord-annotation" data-chord="C">de<rt class="chord-name">C</rt></ruby>lidad es grande,</p><p>tu fi<ruby class="chord-annotation" data-chord="F">de<rt class="chord-name">F</rt></ruby>lidad incompa<ruby class="chord-annotation" data-chord="G">ra<rt class="chord-name">G</rt></ruby>ble es,</p><p>nadie co<ruby class="chord-annotation" data-chord="Dm">mo<rt class="chord-name">Dm</rt></ruby> Tú, bendito <ruby class="chord-annotation" data-chord="G">Dios<rt class="chord-name">G</rt></ruby>,</p><p>grande es tu fi<ruby class="chord-annotation" data-chord="G7">de<rt class="chord-name">G7</rt></ruby>li<ruby class="chord-annotation" data-chord="C">dad<rt class="chord-name">C</rt></ruby>.</p>`
    },
    {
      title: 'Cuán Grande es Dios',
      artist: 'Chris Tomlin / En Espíritu y en Verdad',
      bpm: 76,
      type_id: typesMap['Adoración'],
      style_id: stylesMap['Pop Worship'],
      has_chords: true,
      lyrics: `<p>El es<ruby class="chord-annotation" data-chord="G">plen<rt class="chord-name">G</rt></ruby>dor de un Rey, ves<ruby class="chord-annotation" data-chord="Em">ti<rt class="chord-name">Em</rt></ruby>do en majestad,</p><p>la tie<ruby class="chord-annotation" data-chord="C">rra<rt class="chord-name">C</rt></ruby> se alegrará, la tierra se alegrará.</p><p>Se cu<ruby class="chord-annotation" data-chord="G">bre<rt class="chord-name">G</rt></ruby> de luz, ven<ruby class="chord-annotation" data-chord="Em">ci<rt class="chord-name">Em</rt></ruby>ó a la oscuridad,</p><p>y tiem<ruby class="chord-annotation" data-chord="C">bla<rt class="chord-name">C</rt></ruby> a su voz, y tiembla a su voz.</p><br/><p><strong>Coro:</strong></p><p>¡Cuán gran<ruby class="chord-annotation" data-chord="G">de<rt class="chord-name">G</rt></ruby> es Dios! Can<ruby class="chord-annotation" data-chord="Em">ta<rt class="chord-name">Em</rt></ruby>ré:</p><p>¡Cuán gran<ruby class="chord-annotation" data-chord="C">de<rt class="chord-name">C</rt></ruby> es Dios! Y to<ruby class="chord-annotation" data-chord="D">dos<rt class="chord-name">D</rt></ruby> lo verán,</p><p>¡Cuán gran<ruby class="chord-annotation" data-chord="G">de<rt class="chord-name">G</rt></ruby> es Dios!</p>`
    },
    {
      title: 'Digno es el Señor',
      artist: 'Hillsong / Darlene Zschech',
      bpm: 72,
      type_id: typesMap['Adoración'],
      style_id: stylesMap['Contemporáneo'],
      has_chords: true,
      lyrics: `<p>Gra<ruby class="chord-annotation" data-chord="G">cias<rt class="chord-name">G</rt></ruby> por la cruz, oh <ruby class="chord-annotation" data-chord="C">Dios<rt class="chord-name">C</rt></ruby>,</p><p>el pre<ruby class="chord-annotation" data-chord="G">cio<rt class="chord-name">G</rt></ruby> que pagaste por <ruby class="chord-annotation" data-chord="D">mí<rt class="chord-name">D</rt></ruby>,</p><p>lle<ruby class="chord-annotation" data-chord="Em">van<rt class="chord-name">Em</rt></ruby>do mi pecado a<ruby class="chord-annotation" data-chord="D">llí<rt class="chord-name">D</rt></ruby>, su gra<ruby class="chord-annotation" data-chord="C">cia<rt class="chord-name">C</rt></ruby> me salvó.</p><br/><p><strong>Coro:</strong></p><p>Dig<ruby class="chord-annotation" data-chord="Am">no<rt class="chord-name">Am</rt></ruby> es el Se<ruby class="chord-annotation" data-chord="G">ñor<rt class="chord-name">G</rt></ruby>, en su <ruby class="chord-annotation" data-chord="C">tro<rt class="chord-name">C</rt></ruby>no está,</p><p>co<ruby class="chord-annotation" data-chord="D">ro<rt class="chord-name">D</rt></ruby>nado en ma<ruby class="chord-annotation" data-chord="G">jes<rt class="chord-name">G</rt></ruby>tad, rei<ruby class="chord-annotation" data-chord="C">nas<rt class="chord-name">C</rt></ruby> con po<ruby class="chord-annotation" data-chord="D">der<rt class="chord-name">D</rt></ruby>...</p>`
    },
    {
      title: 'Alabaré',
      artist: 'Himno Tradicional',
      bpm: 110,
      type_id: typesMap['Gozo'],
      style_id: stylesMap['Tradicional'],
      has_chords: true,
      lyrics: `<p>Alaba<ruby class="chord-annotation" data-chord="E">ré<rt class="chord-name">E</rt></ruby>, alaba<ruby class="chord-annotation" data-chord="C#m">ré<rt class="chord-name">C#m</rt></ruby>, alaba<ruby class="chord-annotation" data-chord="F#m">ré<rt class="chord-name">F#m</rt></ruby>, alaba<ruby class="chord-annotation" data-chord="B">ré<rt class="chord-name">B</rt></ruby>,</p><p>alaba<ruby class="chord-annotation" data-chord="E">ré<rt class="chord-name">E</rt></ruby> a mi Se<ruby class="chord-annotation" data-chord="B">ñor<rt class="chord-name">B</rt></ruby>.</p><br/><p><strong>Estrofa:</strong></p><p>Juan vio el nú<ruby class="chord-annotation" data-chord="E">me<rt class="chord-name">E</rt></ruby>ro de los redimidos,</p><p>y todos alaba<ruby class="chord-annotation" data-chord="B">ban<rt class="chord-name">B</rt></ruby> al Señor;</p><p>unos ora<ruby class="chord-annotation" data-chord="F#m">ban<rt class="chord-name">F#m</rt></ruby>, otros can<ruby class="chord-annotation" data-chord="B7">ta<rt class="chord-name">B7</rt></ruby>ban,</p><p>pero todos alaba<ruby class="chord-annotation" data-chord="E">ban<rt class="chord-name">E</rt></ruby> al Señor.</p>`
    },
    {
      title: 'La Bondad de Dios',
      artist: 'Bethel Music',
      bpm: 68,
      type_id: typesMap['Adoración'],
      style_id: stylesMap['Balada'],
      has_chords: true,
      lyrics: `<p>Te amo, Dios, tu gra<ruby class="chord-annotation" data-chord="G">cia<rt class="chord-name">G</rt></ruby> no me fa<ruby class="chord-annotation" data-chord="C">lla<rt class="chord-name">C</rt></ruby>rá,</p><p>mis dí<ruby class="chord-annotation" data-chord="D">as<rt class="chord-name">D</rt></ruby> en tus ma<ruby class="chord-annotation" data-chord="G">nos<rt class="chord-name">G</rt></ruby> están,</p><p>desde el mo<ruby class="chord-annotation" data-chord="Em">men<rt class="chord-name">Em</rt></ruby>to en que des<ruby class="chord-annotation" data-chord="C">pier<rt class="chord-name">C</rt></ruby>to, hasta el anoche<ruby class="chord-annotation" data-chord="G">cer<rt class="chord-name">G</rt></ruby>,</p><p>can<ruby class="chord-annotation" data-chord="D">ta<rt class="chord-name">D</rt></ruby>ré de la bon<ruby class="chord-annotation" data-chord="C">dad<rt class="chord-name">C</rt></ruby> de <ruby class="chord-annotation" data-chord="G">Dios<rt class="chord-name">G</rt></ruby>.</p><br/><p><strong>Coro:</strong></p><p>Y <ruby class="chord-annotation" data-chord="C">to<rt class="chord-name">C</rt></ruby>da mi vida has sido bue<ruby class="chord-annotation" data-chord="G">no<rt class="chord-name">G</rt></ruby>,</p><p>y <ruby class="chord-annotation" data-chord="C">to<rt class="chord-name">C</rt></ruby>da mi vida has sido fiel <ruby class="chord-annotation" data-chord="G">a<rt class="chord-name">G</rt></ruby> <ruby class="chord-annotation" data-chord="D">mí<rt class="chord-name">D</rt></ruby>...</p>`
    },
    {
      title: 'Cantaré de tu Amor por Siempre',
      artist: 'Delirious? / Ingrid Rosario',
      bpm: 98,
      type_id: typesMap['Alabanza'],
      style_id: stylesMap['Rock'],
      has_chords: true,
      lyrics: `<p>Sobre los mon<ruby class="chord-annotation" data-chord="F">tes<rt class="chord-name">F</rt></ruby> y el mar,</p><p>tu río corre a<ruby class="chord-annotation" data-chord="G">rrastran<rt class="chord-name">G</rt></ruby>do amor,</p><p>y a<ruby class="chord-annotation" data-chord="C">briré<rt class="chord-name">C</rt></ruby> mi corazón,</p><p>para que me <ruby class="chord-annotation" data-chord="Am">sa<rt class="chord-name">Am</rt></ruby>nes con tu amor...</p><br/><p><strong>Coro:</strong></p><p>Canta<ruby class="chord-annotation" data-chord="C">ré<rt class="chord-name">C</rt></ruby> de tu amor por siem<ruby class="chord-annotation" data-chord="Dm">pre<rt class="chord-name">Dm</rt></ruby>,</p><p>canta<ruby class="chord-annotation" data-chord="F">F</rt></ruby> de tu amor por siem<ruby class="chord-annotation" data-chord="G">pre<rt class="chord-name">G</rt></ruby>...</p>`
    },
    {
      title: 'Abre Mis Ojos Oh Cristo',
      artist: 'Paul Baloche / Danilo Montero',
      bpm: 110,
      type_id: typesMap['Apertura'],
      style_id: stylesMap['Pop Worship'],
      has_chords: true,
      lyrics: `<p>Abre mis <ruby class="chord-annotation" data-chord="E">o<rt class="chord-name">E</rt></ruby>jos, oh Cristo,</p><p>abre mis ojos, Se<ruby class="chord-annotation" data-chord="B">ñor<rt class="chord-name">B</rt></ruby>,</p><p>yo quiero ver<ruby class="chord-annotation" data-chord="A">te<rt class="chord-name">A</rt></ruby>,</p><p>yo quiero ver<ruby class="chord-annotation" data-chord="E">te<rt class="chord-name">E</rt></ruby>.</p><br/><p><strong>Coro:</strong></p><p>Y ver<ruby class="chord-annotation" data-chord="B">te<rt class="chord-name">B</rt></ruby> alto y gran<ruby class="chord-annotation" data-chord="C#m">de<rt class="chord-name">C#m</rt></ruby>,</p><p>brillando en la <ruby class="chord-annotation" data-chord="A">luz<rt class="chord-name">A</rt></ruby> de tu gloria,</p><p>derrama tu amor y po<ruby class="chord-annotation" data-chord="F#m">der<rt class="chord-name">F#m</rt></ruby>,</p><p>mientras cantamos san<ruby class="chord-annotation" data-chord="B">to<rt class="chord-name">B</rt></ruby>, santo, santo.</p>`
    }
  ];

  console.log('Sembrando canciones...');
  for (const song of sampleSongs) {
    // Verificar si la canción ya existe
    const { data: existing } = await supabase
      .from('songs')
      .select('id')
      .eq('title', song.title)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`La canción "${song.title}" ya existe, omitiendo...`);
      continue;
    }

    const { error } = await supabase
      .from('songs')
      .insert(song);
    
    if (error) {
      console.error(`Error al insertar canción "${song.title}":`, error.message);
    } else {
      console.log(`¡Canción "${song.title}" creada con éxito!`);
    }
  }

  console.log('--- Siembra completada con éxito ---');
}

seed();
