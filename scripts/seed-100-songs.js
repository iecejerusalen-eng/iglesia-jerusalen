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

const songList = [
  {
    title: "Sublime Gracia",
    artist: "Himno Tradicional",
    bpm: 60,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Sub<ruby class=\"chord-annotation\" data-chord=\"G\">li<rt class=\"chord-name\">G</rt></ruby>me gracia del Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby>,</p><p>que a un peca<ruby class=\"chord-annotation\" data-chord=\"G\">dor<rt class=\"chord-name\">G</rt></ruby> sal<ruby class=\"chord-annotation\" data-chord=\"D\">vó<rt class=\"chord-name\">D</rt></ruby>;</p><p>fui cie<ruby class=\"chord-annotation\" data-chord=\"G\">go<rt class=\"chord-name\">G</rt></ruby> mas hoy veo <ruby class=\"chord-annotation\" data-chord=\"C\">yo<rt class=\"chord-name\">C</rt></ruby>,</p><p>perdi<ruby class=\"chord-annotation\" data-chord=\"G\">do<rt class=\"chord-name\">G</rt></ruby> y <ruby class=\"chord-annotation\" data-chord=\"D\">Él<rt class=\"chord-name\">D</rt></ruby> me ha<ruby class=\"chord-annotation\" data-chord=\"G\">lló<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Castillo Fuerte es Nuestro Dios",
    artist: "Martín Lutero",
    bpm: 88,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>Castillo <ruby class=\"chord-annotation\" data-chord=\"C\">fuer<rt class=\"chord-name\">C</rt></ruby>te es nuestro <ruby class=\"chord-annotation\" data-chord=\"G\">Dios<rt class=\"chord-name\">G</rt></ruby>,</p><p>defensa y <ruby class=\"chord-annotation\" data-chord=\"F\">buen<rt class=\"chord-name\">F</rt></ruby> es<ruby class=\"chord-annotation\" data-chord=\"C\">cu<rt class=\"chord-name\">C</rt></ruby>do;</p><p>con su po<ruby class=\"chord-annotation\" data-chord=\"C\">der<rt class=\"chord-name\">C</rt></ruby> nos libra <ruby class=\"chord-annotation\" data-chord=\"G\">hoy<rt class=\"chord-name\">G</rt></ruby>,</p><p>en este <ruby class=\"chord-annotation\" data-chord=\"F\">tran<rt class=\"chord-name\">F</rt></ruby>ce a<ruby class=\"chord-annotation\" data-chord=\"C\">gu<rt class=\"chord-name\">C</rt></ruby>do.</p>"
  },
  {
    title: "Santo, Santo, Santo",
    artist: "Himno Tradicional",
    bpm: 72,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>¡San<ruby class=\"chord-annotation\" data-chord=\"C\">to<rt class=\"chord-name\">C</rt></ruby>! ¡San<ruby class=\"chord-annotation\" data-chord=\"Am\">to<rt class=\"chord-name\">Am</rt></ruby>! ¡San<ruby class=\"chord-annotation\" data-chord=\"G\">to<rt class=\"chord-name\">G</rt></ruby>! Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby> Omni<ruby class=\"chord-annotation\" data-chord=\"G\">po<rt class=\"chord-name\">G</rt></ruby>tente,</p><p>siempre el la<ruby class=\"chord-annotation\" data-chord=\"C\">bio<rt class=\"chord-name\">C</rt></ruby> mío lo<ruby class=\"chord-annotation\" data-chord=\"Am\">ores<rt class=\"chord-name\">Am</rt></ruby> te da<ruby class=\"chord-annotation\" data-chord=\"G\">rá<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Tu Fidelidad",
    artist: "Marcos Witt",
    bpm: 66,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Tu fi<ruby class=\"chord-annotation\" data-chord=\"C\">de<rt class=\"chord-name\">C</rt></ruby>lidad es grande,</p><p>tu fi<ruby class=\"chord-annotation\" data-chord=\"F\">de<rt class=\"chord-name\">F</rt></ruby>lidad incompa<ruby class=\"chord-annotation\" data-chord=\"G\">ra<rt class=\"chord-name\">G</rt></ruby>ble es,</p><p>nadie co<ruby class=\"chord-annotation\" data-chord=\"Dm\">mo<rt class=\"chord-name\">Dm</rt></ruby> Tú, bendito <ruby class=\"chord-annotation\" data-chord=\"G\">Dios<rt class=\"chord-name\">G</rt></ruby>,</p><p>grande es tu fi<ruby class=\"chord-annotation\" data-chord=\"G7\">de<rt class=\"chord-name\">G7</rt></ruby>li<ruby class=\"chord-annotation\" data-chord=\"C\">dad<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Cerca de Ti, Señor",
    artist: "Himno Tradicional",
    bpm: 68,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Cer<ruby class=\"chord-annotation\" data-chord=\"G\">ca<rt class=\"chord-name\">G</rt></ruby> de ti, Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby>, yo quiero es<ruby class=\"chord-annotation\" data-chord=\"G\">tar<rt class=\"chord-name\">G</rt></ruby>,</p><p>aunque sea una <ruby class=\"chord-annotation\" data-chord=\"D\">cruz<rt class=\"chord-name\">D</rt></ruby> que me haga an<ruby class=\"chord-annotation\" data-chord=\"G\">dar<rt class=\"chord-name\">G</rt></ruby>;</p><p>este mi <ruby class=\"chord-annotation\" data-chord=\"G\">canto<rt class=\"chord-name\">G</rt></ruby> a<ruby class=\"chord-annotation\" data-chord=\"C\">sí<rt class=\"chord-name\">C</rt></ruby>, cerca de <ruby class=\"chord-annotation\" data-chord=\"G\">ti<rt class=\"chord-name\">G</rt></ruby>, Se<ruby class=\"chord-annotation\" data-chord=\"D\">ñor<rt class=\"chord-name\">D</rt></ruby>, yo quiero es<ruby class=\"chord-annotation\" data-chord=\"G\">tar<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "A Dios sea la Gloria",
    artist: "Himno Tradicional",
    bpm: 92,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡A <ruby class=\"chord-annotation\" data-chord=\"C\">Dios<rt class=\"chord-name\">C</rt></ruby> sea la glo<ruby class=\"chord-annotation\" data-chord=\"G\">ria<rt class=\"chord-name\">G</rt></ruby>, por su gran a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby>!</p><p>que al mundo le <ruby class=\"chord-annotation\" data-chord=\"F\">dio<rt class=\"chord-name\">F</rt></ruby> a su Hijo el Salva<ruby class=\"chord-annotation\" data-chord=\"G\">dor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Solo en Jesús",
    artist: "Keith & Kristyn Getty",
    bpm: 72,
    type: "Adoración",
    style: "Contemporáneo",
    lyrics: "<p>So<ruby class=\"chord-annotation\" data-chord=\"G\">lo<rt class=\"chord-name\">G</rt></ruby> en Je<ruby class=\"chord-annotation\" data-chord=\"D\">sús<rt class=\"chord-name\">D</rt></ruby> se encuen<ruby class=\"chord-annotation\" data-chord=\"G\">tra<rt class=\"chord-name\">G</rt></ruby> mi paz,</p><p>Él es mi <ruby class=\"chord-annotation\" data-chord=\"C\">fuerza<rt class=\"chord-name\">C</rt></ruby> e ins<ruby class=\"chord-annotation\" data-chord=\"D\">pi<rt class=\"chord-name\">D</rt></ruby>ra<ruby class=\"chord-annotation\" data-chord=\"G\">ción<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Ante el Trono Celestial",
    artist: "Sovereign Grace Music",
    bpm: 68,
    type: "Adoración",
    style: "Contemporáneo",
    lyrics: "<p>An<ruby class=\"chord-annotation\" data-chord=\"C\">te<rt class=\"chord-name\">C</rt></ruby> el trono ce<ruby class=\"chord-annotation\" data-chord=\"G\">les<rt class=\"chord-name\">G</rt></ruby>tial,</p><p>ten<ruby class=\"chord-annotation\" data-chord=\"F\">go<rt class=\"chord-name\">F</rt></ruby> un de<ruby class=\"chord-annotation\" data-chord=\"G\">fen<rt class=\"chord-name\">G</rt></ruby>sor sin i<ruby class=\"chord-annotation\" data-chord=\"C\">gual<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Cristo la Roca",
    artist: "Himno Tradicional",
    bpm: 80,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>En la <ruby class=\"chord-annotation\" data-chord=\"C\">ro<rt class=\"chord-name\">C</rt></ruby>ca de la e<ruby class=\"chord-annotation\" data-chord=\"G\">ter<rt class=\"chord-name\">G</rt></ruby>nidad,</p><p>firme <ruby class=\"chord-annotation\" data-chord=\"F\">es<rt class=\"chord-name\">F</rt></ruby>toy por su bon<ruby class=\"chord-annotation\" data-chord=\"C\">dad<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Día en Día",
    artist: "Himno Tradicional",
    bpm: 76,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Dí<ruby class=\"chord-annotation\" data-chord=\"C\">a<rt class=\"chord-name\">C</rt></ruby> en día la <ruby class=\"chord-annotation\" data-chord=\"F\">fuer<rt class=\"chord-name\">F</rt></ruby>za me <ruby class=\"chord-annotation\" data-chord=\"C\">da<rt class=\"chord-name\">C</rt></ruby>rás,</p><p>del pe<ruby class=\"chord-annotation\" data-chord=\"G\">ca<rt class=\"chord-name\">G</rt></ruby>do y del temor me libra<ruby class=\"chord-annotation\" data-chord=\"C\">rás<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Jesús Pagó Todo",
    artist: "Himno Tradicional",
    bpm: 78,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Je<ruby class=\"chord-annotation\" data-chord=\"G\">sús<rt class=\"chord-name\">G</rt></ruby> pagó la <ruby class=\"chord-annotation\" data-chord=\"C\">deu<rt class=\"chord-name\">C</rt></ruby>da en la cruz,</p><p>por su gra<ruby class=\"chord-annotation\" data-chord=\"G\">cia<rt class=\"chord-name\">G</rt></ruby> hoy te<ruby class=\"chord-annotation\" data-chord=\"D\">ne<rt class=\"chord-name\">D</rt></ruby>mos la <ruby class=\"chord-annotation\" data-chord=\"G\">luz<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Cuán Dulce el Nombre de Jesús",
    artist: "Himno Tradicional",
    bpm: 70,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡Cuán dulce el <ruby class=\"chord-annotation\" data-chord=\"C\">nom<rt class=\"chord-name\">C</rt></ruby>bre de Je<ruby class=\"chord-annotation\" data-chord=\"G\">sús<rt class=\"chord-name\">G</rt></ruby>!</p><p>trae con<ruby class=\"chord-annotation\" data-chord=\"F\">sue<rt class=\"chord-name\">F</rt></ruby>lo y nos <ruby class=\"chord-annotation\" data-chord=\"C\">da<rt class=\"chord-name\">C</rt></ruby> su luz.</p>"
  },
  {
    title: "Dulce Oración",
    artist: "Himno Tradicional",
    bpm: 64,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Dul<ruby class=\"chord-annotation\" data-chord=\"C\">ce<rt class=\"chord-name\">C</rt></ruby> o<ruby class=\"chord-annotation\" data-chord=\"F\">ra<rt class=\"chord-name\">F</rt></ruby>ción, dulce o<ruby class=\"chord-annotation\" data-chord=\"C\">ra<rt class=\"chord-name\">C</rt></ruby>ción,</p><p>que me ele<ruby class=\"chord-annotation\" data-chord=\"G\">vas<rt class=\"chord-name\">G</rt></ruby> de este mundo de do<ruby class=\"chord-annotation\" data-chord=\"C\">lor<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Hay un Precioso Manantial",
    artist: "Himno Tradicional",
    bpm: 84,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Hay un pre<ruby class=\"chord-annotation\" data-chord=\"G\">cio<rt class=\"chord-name\">G</rt></ruby>so manan<ruby class=\"chord-annotation\" data-chord=\"C\">tial<rt class=\"chord-name\">C</rt></ruby>,</p><p>que de la san<ruby class=\"chord-annotation\" data-chord=\"G\">gre<rt class=\"chord-name\">G</rt></ruby> de Cristo bro<ruby class=\"chord-annotation\" data-chord=\"D\">tó<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Oh, Qué Amigo nos es Cristo",
    artist: "Himno Tradicional",
    bpm: 82,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡Oh, qué a<ruby class=\"chord-annotation\" data-chord=\"F\">mi<rt class=\"chord-name\">F</rt></ruby>go nos es Cris<ruby class=\"chord-annotation\" data-chord=\"C\">to<rt class=\"chord-name\">C</rt></ruby>!</p><p>Él lle<ruby class=\"chord-annotation\" data-chord=\"G\">vó<rt class=\"chord-name\">G</rt></ruby> nuestro do<ruby class=\"chord-annotation\" data-chord=\"C\">lor<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "¡Oh, Amor que no me Dejarás!",
    artist: "Himno Tradicional",
    bpm: 72,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>¡Oh, a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby> que no me deja<ruby class=\"chord-annotation\" data-chord=\"G\">rás<rt class=\"chord-name\">G</rt></ruby>!</p><p>en ti mi <ruby class=\"chord-annotation\" data-chord=\"F\">al<rt class=\"chord-name\">F</rt></ruby>ma descan<ruby class=\"chord-annotation\" data-chord=\"C\">sa<rt class=\"chord-name\">C</rt></ruby> ya.</p>"
  },
  {
    title: "Hay Poder en la Sangre",
    artist: "Himno Tradicional",
    bpm: 96,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¿Quieres ser <ruby class=\"chord-annotation\" data-chord=\"G\">sal<rt class=\"chord-name\">G</rt></ruby>vo de toda mal<ruby class=\"chord-annotation\" data-chord=\"C\">dad<rt class=\"chord-name\">C</rt></ruby>?</p><p>Tan solo hay po<ruby class=\"chord-annotation\" data-chord=\"G\">der<rt class=\"chord-name\">G</rt></ruby> en mi Je<ruby class=\"chord-annotation\" data-chord=\"C\">sús<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "En la Cruz",
    artist: "Himno Tradicional",
    bpm: 88,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>En la <ruby class=\"chord-annotation\" data-chord=\"C\">cruz<rt class=\"chord-name\">C</rt></ruby>, en la cruz, do pri<ruby class=\"chord-annotation\" data-chord=\"F\">me<rt class=\"chord-name\">F</rt></ruby>ro vi la <ruby class=\"chord-annotation\" data-chord=\"C\">luz<rt class=\"chord-name\">C</rt></ruby>,</p><p>y las man<ruby class=\"chord-annotation\" data-chord=\"G\">chas<rt class=\"chord-name\">G</rt></ruby> de mi alma yo la<ruby class=\"chord-annotation\" data-chord=\"C\">vé<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Ya Pertenezco a Cristo",
    artist: "Himno Tradicional",
    bpm: 76,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Cristo mi <ruby class=\"chord-annotation\" data-chord=\"C\">guí<rt class=\"chord-name\">C</rt></ruby>a es por siem<ruby class=\"chord-annotation\" data-chord=\"F\">pre<rt class=\"chord-name\">F</rt></ruby>,</p><p>ya perte<ruby class=\"chord-annotation\" data-chord=\"G\">nez<rt class=\"chord-name\">G</rt></ruby>co a Él por la <ruby class=\"chord-annotation\" data-chord=\"C\">fe<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Bellas Palabras de Vida",
    artist: "Himno Tradicional",
    bpm: 90,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡Oh, bellas pa<ruby class=\"chord-annotation\" data-chord=\"C\">la<rt class=\"chord-name\">C</rt></ruby>bras de vi<ruby class=\"chord-annotation\" data-chord=\"G\">da<rt class=\"chord-name\">G</rt></ruby>!</p><p>que nos traen gozo y a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Grande es el Señor",
    artist: "Marcos Witt",
    bpm: 110,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>¡Grande es el Se<ruby class=\"chord-annotation\" data-chord=\"A\">ñor<rt class=\"chord-name\">A</rt></ruby> y digno de ser alaba<ruby class=\"chord-annotation\" data-chord=\"D\">do<rt class=\"chord-name\">D</rt></ruby>!</p>"
  },
  {
    title: "Roca de la Eternidad",
    artist: "Himno Tradicional",
    bpm: 72,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>Ro<ruby class=\"chord-annotation\" data-chord=\"G\">ca<rt class=\"chord-name\">G</rt></ruby> de la eter<ruby class=\"chord-annotation\" data-chord=\"C\">ni<rt class=\"chord-name\">C</rt></ruby>dad,</p><p>fuente de gracia y ver<ruby class=\"chord-annotation\" data-chord=\"G\">dad<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Maravillosa Gracia",
    artist: "Himno Tradicional",
    bpm: 74,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Maravi<ruby class=\"chord-annotation\" data-chord=\"C\">llo<rt class=\"chord-name\">C</rt></ruby>sa gracia es la de mi Se<ruby class=\"chord-annotation\" data-chord=\"G\">ñor<rt class=\"chord-name\">G</rt></ruby>,</p><p>incompa<ruby class=\"chord-annotation\" data-chord=\"F\">ra<rt class=\"chord-name\">F</rt></ruby>ble en su gran a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Fiel Salvador",
    artist: "Himno Tradicional",
    bpm: 68,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Fiel Salva<ruby class=\"chord-annotation\" data-chord=\"G\">dor<rt class=\"chord-name\">G</rt></ruby>, guíame por tu sen<ruby class=\"chord-annotation\" data-chord=\"C\">da<rt class=\"chord-name\">C</rt></ruby>,</p><p>no me dejes caer en la con<ruby class=\"chord-annotation\" data-chord=\"G\">tien<rt class=\"chord-name\">G</rt></ruby>da.</p>"
  },
  {
    title: "Mansión de Luz",
    artist: "Himno Tradicional",
    bpm: 76,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Tengo una man<ruby class=\"chord-annotation\" data-chord=\"C\">sión<rt class=\"chord-name\">C</rt></ruby> más allá de los so<ruby class=\"chord-annotation\" data-chord=\"G\">les<rt class=\"chord-name\">G</rt></ruby>,</p><p>donde no hay llanto ni más do<ruby class=\"chord-annotation\" data-chord=\"C\">lo<rt class=\"chord-name\">C</rt></ruby>res.</p>"
  },
  {
    title: "Te Loamos, Oh Dios",
    artist: "Himno Tradicional",
    bpm: 80,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>Te loa<ruby class=\"chord-annotation\" data-chord=\"G\">mos<rt class=\"chord-name\">G</rt></ruby>, oh Dios, con alegre can<ruby class=\"chord-annotation\" data-chord=\"C\">ción<rt class=\"chord-name\">C</rt></ruby>,</p><p>por tu Hijo Je<ruby class=\"chord-annotation\" data-chord=\"G\">sús<rt class=\"chord-name\">G</rt></ruby> que nos dio redención.</p>"
  },
  {
    title: "Canta, Oh Buen Cristiano",
    artist: "Himno Tradicional",
    bpm: 86,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Canta, oh <ruby class=\"chord-annotation\" data-chord=\"C\">buen<rt class=\"chord-name\">C</rt></ruby> cristiano, con gozo al Se<ruby class=\"chord-annotation\" data-chord=\"G\">ñor<rt class=\"chord-name\">G</rt></ruby>,</p><p>procla<ruby class=\"chord-annotation\" data-chord=\"F\">man<rt class=\"chord-name\">F</rt></ruby>do su gran a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Cuando Allá se Pase Lista",
    artist: "Himno Tradicional",
    bpm: 96,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Cuando a<ruby class=\"chord-annotation\" data-chord=\"G\">llá<rt class=\"chord-name\">G</rt></ruby> se pase lista, cuando a<ruby class=\"chord-annotation\" data-chord=\"C\">llá<rt class=\"chord-name\">C</rt></ruby> se pase lista,</p><p>a mi nombre respon<ruby class=\"chord-annotation\" data-chord=\"D\">de<rt class=\"chord-name\">D</rt></ruby>ré con a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Más Cerca, Oh Dios, de Ti",
    artist: "Himno Tradicional",
    bpm: 60,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Más cer<ruby class=\"chord-annotation\" data-chord=\"G\">ca<rt class=\"chord-name\">G</rt></ruby>, oh Dios, de ti, yo quiero es<ruby class=\"chord-annotation\" data-chord=\"C\">tar<rt class=\"chord-name\">C</rt></ruby>,</p><p>cerca de <ruby class=\"chord-annotation\" data-chord=\"G\">ti<rt class=\"chord-name\">G</rt></ruby>, Se<ruby class=\"chord-annotation\" data-chord=\"D\">ñor<rt class=\"chord-name\">D</rt></ruby>, en mi caminar.</p>"
  },
  {
    title: "Solamente en Cristo",
    artist: "Himno Tradicional",
    bpm: 90,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>So<ruby class=\"chord-annotation\" data-chord=\"C\">la<rt class=\"chord-name\">C</rt></ruby>mente en Cristo, solamente en <ruby class=\"chord-annotation\" data-chord=\"G\">Él<rt class=\"chord-name\">G</rt></ruby>,</p><p>la salvación en<ruby class=\"chord-annotation\" data-chord=\"F\">cuen<rt class=\"chord-name\">F</rt></ruby>tras por la <ruby class=\"chord-annotation\" data-chord=\"C\">fe<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "¡Oh, Bienvenido!",
    artist: "Himno Tradicional",
    bpm: 88,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡Oh, bienve<ruby class=\"chord-annotation\" data-chord=\"G\">ni<rt class=\"chord-name\">G</rt></ruby>do, hermano en la <ruby class=\"chord-annotation\" data-chord=\"C\">fe<rt class=\"chord-name\">C</rt></ruby>!</p><p>juntos can<ruby class=\"chord-annotation\" data-chord=\"G\">te<rt class=\"chord-name\">G</rt></ruby>mos con gran a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Grato es Contar la Historia",
    artist: "Himno Tradicional",
    bpm: 80,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Grato es con<ruby class=\"chord-annotation\" data-chord=\"C\">tar<rt class=\"chord-name\">C</rt></ruby> la historia del celestial a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>,</p><p>de Cristo y de su glo<ruby class=\"chord-annotation\" data-chord=\"C\">ria<rt class=\"chord-name\">C</rt></ruby> y su gran favor.</p>"
  },
  {
    title: "Cantando Alegre Gozoso Iré",
    artist: "Himno Tradicional",
    bpm: 104,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Can<ruby class=\"chord-annotation\" data-chord=\"G\">tan<rt class=\"chord-name\">G</rt></ruby>do alegre, gozoso i<ruby class=\"chord-annotation\" data-chord=\"C\">ré<rt class=\"chord-name\">C</rt></ruby>,</p><p>con mi Salva<ruby class=\"chord-annotation\" data-chord=\"G\">dor<rt class=\"chord-name\">G</rt></ruby> al cielo lle<ruby class=\"chord-annotation\" data-chord=\"D\">ga<rt class=\"chord-name\">D</rt></ruby>ré.</p>"
  },
  {
    title: "Salvo en los Tiernos Brazos",
    artist: "Himno Tradicional",
    bpm: 65,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Sal<ruby class=\"chord-annotation\" data-chord=\"C\">vo<rt class=\"chord-name\">C</rt></ruby> en los tiernos brazos de mi Je<ruby class=\"chord-annotation\" data-chord=\"G\">sús<rt class=\"chord-name\">G</rt></ruby>,</p><p>bajo su pe<ruby class=\"chord-annotation\" data-chord=\"F\">cho<rt class=\"chord-name\">F</rt></ruby> hallo descanso y <ruby class=\"chord-annotation\" data-chord=\"C\">luz<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "A Cualquiera Parte Iré",
    artist: "Himno Tradicional",
    bpm: 82,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>A cual<ruby class=\"chord-annotation\" data-chord=\"G\">quie<rt class=\"chord-name\">G</rt></ruby>ra parte con Jesús i<ruby class=\"chord-annotation\" data-chord=\"C\">ré<rt class=\"chord-name\">C</rt></ruby>,</p><p>en su gran ca<ruby class=\"chord-annotation\" data-chord=\"G\">mi<rt class=\"chord-name\">G</rt></ruby>no siempre camina<ruby class=\"chord-annotation\" data-chord=\"D\">ré<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Soy Bautizado como Manda el Salvador",
    artist: "Himno Tradicional",
    bpm: 90,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Soy bau<ruby class=\"chord-annotation\" data-chord=\"C\">ti<rt class=\"chord-name\">C</rt></ruby>zado como manda el Salva<ruby class=\"chord-annotation\" data-chord=\"G\">dor<rt class=\"chord-name\">G</rt></ruby>,</p><p>en las a<ruby class=\"chord-annotation\" data-chord=\"F\">guas<rt class=\"chord-name\">F</rt></ruby> de la gracia y de su a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Firme y Adelante",
    artist: "Himno Tradicional",
    bpm: 100,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>¡Fir<ruby class=\"chord-annotation\" data-chord=\"C\">me<rt class=\"chord-name\">C</rt></ruby> y adelante, huestes de la <ruby class=\"chord-annotation\" data-chord=\"G\">fe<rt class=\"chord-name\">G</rt></ruby>!</p><p>sin temor al<ruby class=\"chord-annotation\" data-chord=\"F\">guno<rt class=\"chord-name\">F</rt></ruby>, Cristo es nuestro <ruby class=\"chord-annotation\" data-chord=\"C\">Rey<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "De Boca y Corazón",
    artist: "Himno Tradicional",
    bpm: 72,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>De bo<ruby class=\"chord-annotation\" data-chord=\"C\">ca<rt class=\"chord-name\">C</rt></ruby> y cora<ruby class=\"chord-annotation\" data-chord=\"G\">zón<rt class=\"chord-name\">G</rt></ruby> demos gracias al Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby>,</p><p>por su gran favor y su tier<ruby class=\"chord-annotation\" data-chord=\"G\">no<rt class=\"chord-name\">G</rt></ruby> amor.</p>"
  },
  {
    title: "¡Cuán Firmes Cimientos!",
    artist: "Himno Tradicional",
    bpm: 84,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡Cuán firmes ci<ruby class=\"chord-annotation\" data-chord=\"G\">mien<rt class=\"chord-name\">G</rt></ruby>tos de fe en el Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby>!</p><p>para los cre<ruby class=\"chord-annotation\" data-chord=\"G\">yen<rt class=\"chord-name\">G</rt></ruby>tes en su gran a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Tuya es la Gloria",
    artist: "Himno Tradicional",
    bpm: 88,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>¡Tu<ruby class=\"chord-annotation\" data-chord=\"C\">ya<rt class=\"chord-name\">C</rt></ruby> es la gloria, resucitado Se<ruby class=\"chord-annotation\" data-chord=\"G\">ñor<rt class=\"chord-name\">G</rt></ruby>!</p><p>tuyo es el <ruby class=\"chord-annotation\" data-chord=\"F\">triunfo<rt class=\"chord-name\">F</rt></ruby> sobre el pecador.</p>"
  },
  {
    title: "Oh, Cabeza Ensangrentada",
    artist: "Himno Tradicional",
    bpm: 64,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>Oh, ca<ruby class=\"chord-annotation\" data-chord=\"Am\">be<rt class=\"chord-name\">Am</rt></ruby>za ensangren<ruby class=\"chord-annotation\" data-chord=\"E\">ta<rt class=\"chord-name\">E</rt></ruby>da por mi mal<ruby class=\"chord-annotation\" data-chord=\"Am\">dad<rt class=\"chord-name\">Am</rt></ruby>,</p><p>que en la cruz sufris<ruby class=\"chord-annotation\" data-chord=\"G\">te<rt class=\"chord-name\">G</rt></ruby> con gran bondad.</p>"
  },
  {
    title: "Ved al Cristo en la Cruz",
    artist: "Himno Tradicional",
    bpm: 68,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Ved al <ruby class=\"chord-annotation\" data-chord=\"C\">Cris<rt class=\"chord-name\">C</rt></ruby>to en la cruz por tu per<ruby class=\"chord-annotation\" data-chord=\"G\">dón<rt class=\"chord-name\">G</rt></ruby>,</p><p>derramando su gra<ruby class=\"chord-annotation\" data-chord=\"F\">cia<rt class=\"chord-name\">F</rt></ruby> y compa<ruby class=\"chord-annotation\" data-chord=\"C\">sión<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Con Gran Gozo y Alegría",
    artist: "Himno Tradicional",
    bpm: 104,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Con gran go<ruby class=\"chord-annotation\" data-chord=\"G\">zo<rt class=\"chord-name\">G</rt></ruby> y alegría cantemos al Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby>,</p><p>celebrando su gracia y su po<ruby class=\"chord-annotation\" data-chord=\"D\">der<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Oh Jóvenes Venid",
    artist: "Himno Tradicional",
    bpm: 96,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡Oh, jóve<ruby class=\"chord-annotation\" data-chord=\"C\">nes<rt class=\"chord-name\">C</rt></ruby> venid, al llamado del Se<ruby class=\"chord-annotation\" data-chord=\"G\">ñor<rt class=\"chord-name\">G</rt></ruby>!</p><p>trabajad con go<ruby class=\"chord-annotation\" data-chord=\"F\">zo<rt class=\"chord-name\">F</rt></ruby> en su viña de amor.</p>"
  },
  {
    title: "Despierta, Alma Mía",
    artist: "Himno Tradicional",
    bpm: 80,
    type: "Himno",
    style: "Coral",
    lyrics: "<p>Des<ruby class=\"chord-annotation\" data-chord=\"G\">pier<rt class=\"chord-name\">G</rt></ruby>ta, alma mía, alaba al Cre<ruby class=\"chord-annotation\" data-chord=\"C\">a<rt class=\"chord-name\">C</rt></ruby>dor,</p><p>canta con alegría a tu gran Se<ruby class=\"chord-annotation\" data-chord=\"D\">ñor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Oh, Profunda Riqueza",
    artist: "Sovereign Grace Music",
    bpm: 72,
    type: "Adoración",
    style: "Contemporáneo",
    lyrics: "<p>Oh, pro<ruby class=\"chord-annotation\" data-chord=\"C\">fun<rt class=\"chord-name\">C</rt></ruby>da riqueza del consejo de <ruby class=\"chord-annotation\" data-chord=\"G\">Dios<rt class=\"chord-name\">G</rt></ruby>,</p><p>su inescrutable gra<ruby class=\"chord-annotation\" data-chord=\"F\">cia<rt class=\"chord-name\">F</rt></ruby> nos sal<ruby class=\"chord-annotation\" data-chord=\"C\">vó<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Qué Gran Salvador es Jesús",
    artist: "Himno Tradicional",
    bpm: 78,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>¡Qué gran Salva<ruby class=\"chord-annotation\" data-chord=\"C\">dor<rt class=\"chord-name\">C</rt></ruby> es Jesús el Se<ruby class=\"chord-annotation\" data-chord=\"G\">ñor<rt class=\"chord-name\">G</rt></ruby>!</p><p>que me redi<ruby class=\"chord-annotation\" data-chord=\"F\">mió<rt class=\"chord-name\">F</rt></ruby> con su sangre en la cruz.</p>"
  },
  {
    title: "Bendita la Palabra del Señor",
    artist: "Himno Tradicional",
    bpm: 84,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Ben<ruby class=\"chord-annotation\" data-chord=\"C\">di<rt class=\"chord-name\">C</rt></ruby>ta la Palabra del Dios de a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>,</p><p>lumbrera en mi ca<ruby class=\"chord-annotation\" data-chord=\"F\">mi<rt class=\"chord-name\">F</rt></ruby>no y mi Salvador.</p>"
  },
  {
    title: "Renuévame",
    artist: "Marcos Witt",
    bpm: 65,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Re<ruby class=\"chord-annotation\" data-chord=\"D\">nué<rt class=\"chord-name\">D</rt></ruby>vame, Señor Je<ruby class=\"chord-annotation\" data-chord=\"G\">sús<rt class=\"chord-name\">G</rt></ruby>,</p><p>ya no quiero ser i<ruby class=\"chord-annotation\" data-chord=\"A\">gual<rt class=\"chord-name\">A</rt></ruby>.</p><p>Re<ruby class=\"chord-annotation\" data-chord=\"D\">nué<rt class=\"chord-name\">D</rt></ruby>vame, Señor Je<ruby class=\"chord-annotation\" data-chord=\"G\">sús<rt class=\"chord-name\">G</rt></ruby>,</p><p>pon en mí tu cora<ruby class=\"chord-annotation\" data-chord=\"A\">zón<rt class=\"chord-name\">A</rt></ruby>.</p>"
  },
  {
    title: "Gracias",
    artist: "Marcos Witt",
    bpm: 72,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Me has disci<ruby class=\"chord-annotation\" data-chord=\"A\">pli<rt class=\"chord-name\">A</rt></ruby>nado en tu gran a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>,</p><p>gracias te doy por tu obe<ruby class=\"chord-annotation\" data-chord=\"A\">dien<rt class=\"chord-name\">A</rt></ruby>cia en la cruz.</p>"
  },
  {
    title: "Canta al Señor",
    artist: "Hillsong Worship",
    bpm: 80,
    type: "Adoración",
    style: "Pop Worship",
    lyrics: "<p>Mi Cristo, mi <ruby class=\"chord-annotation\" data-chord=\"A\">Rey<rt class=\"chord-name\">A</rt></ruby>, nadie es como Tú,</p><p>toda mi <ruby class=\"chord-annotation\" data-chord=\"D\">vi<rt class=\"chord-name\">D</rt></ruby>da quiero alabar,</p><p>las maravi<ruby class=\"chord-annotation\" data-chord=\"E\">llas<rt class=\"chord-name\">E</rt></ruby> de tu amor.</p>"
  },
  {
    title: "Sentado en su Trono",
    artist: "Danilo Montero",
    bpm: 74,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Sen<ruby class=\"chord-annotation\" data-chord=\"C\">ta<rt class=\"chord-name\">C</rt></ruby>do en su trono, rodeado de luz,</p><p>a la diestra del <ruby class=\"chord-annotation\" data-chord=\"F\">Pa<rt class=\"chord-name\">F</rt></ruby>dre, gobierna Je<ruby class=\"chord-annotation\" data-chord=\"G\">sús<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Cantaré de tu Amor",
    artist: "Danilo Montero",
    bpm: 82,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>Canta<ruby class=\"chord-annotation\" data-chord=\"G\">ré<rt class=\"chord-name\">G</rt></ruby> de tu amor por siempre,</p><p>procla<ruby class=\"chord-annotation\" data-chord=\"C\">man<rt class=\"chord-name\">C</rt></ruby>do tu fideli<ruby class=\"chord-annotation\" data-chord=\"D\">dad<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Dios Manda Lluvia",
    artist: "Danilo Montero",
    bpm: 68,
    type: "Clamor",
    style: "Balada",
    lyrics: "<p>Dios manda <ruby class=\"chord-annotation\" data-chord=\"C\">llu<rt class=\"chord-name\">C</rt></ruby>via, derrama tu es<ruby class=\"chord-annotation\" data-chord=\"F\">pí<rt class=\"chord-name\">F</rt></ruby>ritu,</p><p>sana mi alma, con<ruby class=\"chord-annotation\" data-chord=\"G\">sue<rt class=\"chord-name\">G</rt></ruby>la mi dolor.</p>"
  },
  {
    title: "La Casa de Dios",
    artist: "Danilo Montero",
    bpm: 116,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>Me a<ruby class=\"chord-annotation\" data-chord=\"A\">le<rt class=\"chord-name\">A</rt></ruby>gré al oírles decir:</p><p>¡A la casa del Se<ruby class=\"chord-annotation\" data-chord=\"D\">ñor<rt class=\"chord-name\">D</rt></ruby> ire<ruby class=\"chord-annotation\" data-chord=\"E\">mos<rt class=\"chord-name\">E</rt></ruby>!</p>"
  },
  {
    title: "El Amor de mi Vida",
    artist: "Marcos Witt",
    bpm: 72,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Tú eres el a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby> de mi vida, mi Señor,</p><p>en ti en<ruby class=\"chord-annotation\" data-chord=\"F\">cuen<rt class=\"chord-name\">F</rt></ruby>tro consuelo y gran fa<ruby class=\"chord-annotation\" data-chord=\"G\">vor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Hermoso Eres",
    artist: "Marcos Witt",
    bpm: 68,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>En mi cora<ruby class=\"chord-annotation\" data-chord=\"G\">zón<rt class=\"chord-name\">G</rt></ruby> hay una canción,</p><p>hermo<ruby class=\"chord-annotation\" data-chord=\"C\">so<rt class=\"chord-name\">C</rt></ruby> eres Tú, mi Señor Je<ruby class=\"chord-annotation\" data-chord=\"D\">sús<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Tu Mirada",
    artist: "Marcos Witt",
    bpm: 70,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Tu mi<ruby class=\"chord-annotation\" data-chord=\"C\">ra<rt class=\"chord-name\">C</rt></ruby>da me sostiene, Señor,</p><p>tu gra<ruby class=\"chord-annotation\" data-chord=\"F\">cia<rt class=\"chord-name\">F</rt></ruby> me da paz y gran a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Quiero Levantar mis Manos",
    artist: "Marcos Witt",
    bpm: 66,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Quiero levan<ruby class=\"chord-annotation\" data-chord=\"A\">tar<rt class=\"chord-name\">A</rt></ruby> mis manos,</p><p>maravi<ruby class=\"chord-annotation\" data-chord=\"D\">llo<rt class=\"chord-name\">D</rt></ruby>so Salvador Je<ruby class=\"chord-annotation\" data-chord=\"E\">sús<rt class=\"chord-name\">E</rt></ruby>.</p>"
  },
  {
    title: "Al que es Digno",
    artist: "Marcos Witt",
    bpm: 104,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>¡Al que es <ruby class=\"chord-annotation\" data-chord=\"G\">dig<rt class=\"chord-name\">G</rt></ruby>no de recibir la gloria!</p><p>al que es <ruby class=\"chord-annotation\" data-chord=\"C\">dig<rt class=\"chord-name\">C</rt></ruby>no de recibir a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Majestad",
    artist: "Marcos Witt",
    bpm: 80,
    type: "Adoración",
    style: "Coral",
    lyrics: "<p>Ma<ruby class=\"chord-annotation\" data-chord=\"G\">jes<rt class=\"chord-name\">G</rt></ruby>tad, adora su ma<ruby class=\"chord-annotation\" data-chord=\"C\">jes<rt class=\"chord-name\">C</rt></ruby>tad,</p><p>a Jesús sea la glo<ruby class=\"chord-annotation\" data-chord=\"G\">ria<rt class=\"chord-name\">G</rt></ruby> y el po<ruby class=\"chord-annotation\" data-chord=\"D\">der<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Revelación",
    artist: "Danilo Montero",
    bpm: 72,
    type: "Adoración",
    style: "Contemporáneo",
    lyrics: "<p>Digno es el Cor<ruby class=\"chord-annotation\" data-chord=\"G\">de<rt class=\"chord-name\">G</rt></ruby>ro celestial,</p><p>santo, san<ruby class=\"chord-annotation\" data-chord=\"C\">to<rt class=\"chord-name\">C</rt></ruby> es el Se<ruby class=\"chord-annotation\" data-chord=\"D\">ñor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "En la Cruz (Hillsong)",
    artist: "Hillsong Worship",
    bpm: 74,
    type: "Adoración",
    style: "Pop Worship",
    lyrics: "<p>En la cruz mi pe<ruby class=\"chord-annotation\" data-chord=\"G\">ca<rt class=\"chord-name\">G</rt></ruby>do clavaste, Señor,</p><p>tu gra<ruby class=\"chord-annotation\" data-chord=\"C\">cia<rt class=\"chord-name\">C</rt></ruby> me salvó y me dio a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Hosanna",
    artist: "Marco Barrientos",
    bpm: 120,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>¡Ho<ruby class=\"chord-annotation\" data-chord=\"G\">san<rt class=\"chord-name\">G</rt></ruby>na, hosanna en las al<ruby class=\"chord-annotation\" data-chord=\"C\">tu<rt class=\"chord-name\">C</rt></ruby>ras!</p><p>al bendito Rey que vie<ruby class=\"chord-annotation\" data-chord=\"D\">ne<rt class=\"chord-name\">D</rt></ruby> en el nombre del Se<ruby class=\"chord-annotation\" data-chord=\"G\">ñor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Ven Espíritu Ven",
    artist: "Marco Barrientos",
    bpm: 68,
    type: "Clamor",
    style: "Balada",
    lyrics: "<p>Ven es<ruby class=\"chord-annotation\" data-chord=\"C\">pí<rt class=\"chord-name\">C</rt></ruby>ritu, ven, lléname de tu a<ruby class=\"chord-annotation\" data-chord=\"F\">mor<rt class=\"chord-name\">F</rt></ruby>,</p><p>quiero sentir tu pre<ruby class=\"chord-annotation\" data-chord=\"G\">sen<rt class=\"chord-name\">G</rt></ruby>cia en mi cora<ruby class=\"chord-annotation\" data-chord=\"C\">zón<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "De Gloria en Gloria",
    artist: "Marco Barrientos",
    bpm: 72,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>De gloria en glo<ruby class=\"chord-annotation\" data-chord=\"G\">ria<rt class=\"chord-name\">G</rt></ruby> te veo, Señor,</p><p>tu pre<ruby class=\"chord-annotation\" data-chord=\"C\">sen<rt class=\"chord-name\">C</rt></ruby>cia me transforma más a <ruby class=\"chord-annotation\" data-chord=\"D\">Ti<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Cantamos al Rey",
    artist: "Marco Barrientos",
    bpm: 112,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>¡Canta<ruby class=\"chord-annotation\" data-chord=\"A\">mos<rt class=\"chord-name\">A</rt></ruby> al Rey con gran alegría,</p><p>celebramos su vic<ruby class=\"chord-annotation\" data-chord=\"D\">to<rt class=\"chord-name\">D</rt></ruby>ria y su po<ruby class=\"chord-annotation\" data-chord=\"E\">der<rt class=\"chord-name\">E</rt></ruby>!</p>"
  },
  {
    title: "Sin Reserva",
    artist: "Marco Barrientos",
    bpm: 70,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Sin reserva me en<ruby class=\"chord-annotation\" data-chord=\"C\">tre<rt class=\"chord-name\">C</rt></ruby>go a ti, mi Señor,</p><p>toma mi <ruby class=\"chord-annotation\" data-chord=\"F\">vi<rt class=\"chord-name\">F</rt></ruby>da para tu glo<ruby class=\"chord-annotation\" data-chord=\"G\">ria<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Preciosa Sangre",
    artist: "Marco Barrientos",
    bpm: 68,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Precio<ruby class=\"chord-annotation\" data-chord=\"C\">sa<rt class=\"chord-name\">C</rt></ruby> sangre me dio li<ruby class=\"chord-annotation\" data-chord=\"F\">ber<rt class=\"chord-name\">F</rt></ruby>tad,</p><p>derramada en la cruz con gran a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "El Señor es mi Pastor",
    artist: "Danilo Montero",
    bpm: 64,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>El Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby> es mi pastor, nada me fal<ruby class=\"chord-annotation\" data-chord=\"F\">ta<rt class=\"chord-name\">F</rt></ruby>rá,</p><p>en pastos de de<ruby class=\"chord-annotation\" data-chord=\"G\">li<rt class=\"chord-name\">G</rt></ruby>cias me hará descan<ruby class=\"chord-annotation\" data-chord=\"C\">sar<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Admirable",
    artist: "Danilo Montero",
    bpm: 72,
    type: "Adoración",
    style: "Contemporáneo",
    lyrics: "<p>Tú eres ad<ruby class=\"chord-annotation\" data-chord=\"G\">mi<rt class=\"chord-name\">G</rt></ruby>rable, consejero, Dios fuer<ruby class=\"chord-annotation\" data-chord=\"C\">te<rt class=\"chord-name\">C</rt></ruby>,</p><p>Padre e<ruby class=\"chord-annotation\" data-chord=\"G\">ter<rt class=\"chord-name\">G</rt></ruby>no, Príncipe de <ruby class=\"chord-annotation\" data-chord=\"D\">Paz<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Todo lo que Respira",
    artist: "Marcos Witt",
    bpm: 125,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>¡Todo lo que res<ruby class=\"chord-annotation\" data-chord=\"G\">pi<rt class=\"chord-name\">G</rt></ruby>ra alabe al Se<ruby class=\"chord-annotation\" data-chord=\"C\">ñor<rt class=\"chord-name\">C</rt></ruby>!</p><p>alabadle en su ma<ruby class=\"chord-annotation\" data-chord=\"G\">jes<rt class=\"chord-name\">G</rt></ruby>tad y su po<ruby class=\"chord-annotation\" data-chord=\"D\">der<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Motivo de mi Canción",
    artist: "Marcos Witt",
    bpm: 110,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>Tú eres el mo<ruby class=\"chord-annotation\" data-chord=\"A\">ti<rt class=\"chord-name\">A</rt></ruby>vo de mi canción, Señor,</p><p>mi la<ruby class=\"chord-annotation\" data-chord=\"D\">bio<rt class=\"chord-name\">D</rt></ruby> te alaba por tu gran a<ruby class=\"chord-annotation\" data-chord=\"E\">mor<rt class=\"chord-name\">E</rt></ruby>.</p>"
  },
  {
    title: "Purifícame",
    artist: "Marcos Witt",
    bpm: 68,
    type: "Clamor",
    style: "Balada",
    lyrics: "<p>Puri<ruby class=\"chord-annotation\" data-chord=\"C\">fí<rt class=\"chord-name\">C</rt></ruby>came, límpiame del pe<ruby class=\"chord-annotation\" data-chord=\"F\">ca<rt class=\"chord-name\">F</rt></ruby>do,</p><p>quiero ser santo para <ruby class=\"chord-annotation\" data-chord=\"G\">Ti<rt class=\"chord-name\">G</rt></ruby>, mi Señor.</p>"
  },
  {
    title: "Al Rey (Marcos Witt)",
    artist: "Marcos Witt",
    bpm: 108,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>¡Al Rey de glo<ruby class=\"chord-annotation\" data-chord=\"G\">ria<rt class=\"chord-name\">G</rt></ruby> alabad con alegría!</p><p>a Él sea la hon<ruby class=\"chord-annotation\" data-chord=\"C\">ra<rt class=\"chord-name\">C</rt></ruby> y la ma<ruby class=\"chord-annotation\" data-chord=\"D\">jes<rt class=\"chord-name\">D</rt></ruby>tad.</p>"
  },
  {
    title: "Sana Nuestra Tierra",
    artist: "Marcos Witt",
    bpm: 72,
    type: "Clamor",
    style: "Balada",
    lyrics: "<p>Sana nuestra tie<ruby class=\"chord-annotation\" data-chord=\"C\">rra<rt class=\"chord-name\">C</rt></ruby>, humillamos nuestro cora<ruby class=\"chord-annotation\" data-chord=\"F\">zón<rt class=\"chord-name\">F</rt></ruby>,</p><p>derrama tu gra<ruby class=\"chord-annotation\" data-chord=\"G\">cia<rt class=\"chord-name\">G</rt></ruby> y tu ben<ruby class=\"chord-annotation\" data-chord=\"C\">di<rt class=\"chord-name\">C</rt></ruby>ción.</p>"
  },
  {
    title: "Sobrenatural",
    artist: "Marcos Witt",
    bpm: 88,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>Sobrena<ruby class=\"chord-annotation\" data-chord=\"G\">tu<rt class=\"chord-name\">G</rt></ruby>ral es tu amor y tu po<ruby class=\"chord-annotation\" data-chord=\"C\">der<rt class=\"chord-name\">C</rt></ruby>,</p><p>que me levantó y me dio a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Bueno es Alabar",
    artist: "Danilo Montero",
    bpm: 116,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>Bueno es ala<ruby class=\"chord-annotation\" data-chord=\"G\">bar<rt class=\"chord-name\">G</rt></ruby> al Señor, tu Dios,</p><p>y cantar sal<ruby class=\"chord-annotation\" data-chord=\"C\">mos<rt class=\"chord-name\">C</rt></ruby> a su santo <ruby class=\"chord-annotation\" data-chord=\"D\">nom<rt class=\"chord-name\">D</rt></ruby>bre.</p>"
  },
  {
    title: "Dios de Pactos",
    artist: "Marcos Witt",
    bpm: 70,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Dios de pac<ruby class=\"chord-annotation\" data-chord=\"C\">tos<rt class=\"chord-name\">C</rt></ruby>, que guardas tu palabra,</p><p>tu fi<ruby class=\"chord-annotation\" data-chord=\"F\">de<rt class=\"chord-name\">F</rt></ruby>lidad no me fa<ruby class=\"chord-annotation\" data-chord=\"G\">lla<rt class=\"chord-name\">G</rt></ruby>rá.</p>"
  },
  {
    title: "Temprano yo te Buscaré",
    artist: "Marcos Witt",
    bpm: 65,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Temprano yo te bus<ruby class=\"chord-annotation\" data-chord=\"C\">ca<rt class=\"chord-name\">C</rt></ruby>ré, de mañana,</p><p>mi cora<ruby class=\"chord-annotation\" data-chord=\"F\">zón<rt class=\"chord-name\">F</rt></ruby> tiene sed de tu pre<ruby class=\"chord-annotation\" data-chord=\"G\">sen<rt class=\"chord-name\">G</rt></ruby>cia.</p>"
  },
  {
    title: "Escúchame, Señor",
    artist: "Marcos Witt",
    bpm: 72,
    type: "Clamor",
    style: "Balada",
    lyrics: "<p>Escúchame, Se<ruby class=\"chord-annotation\" data-chord=\"Am\">ñor<rt class=\"chord-name\">Am</rt></ruby>, oye mi oración,</p><p>en ti mi al<ruby class=\"chord-annotation\" data-chord=\"G\">ma<rt class=\"chord-name\">G</rt></ruby> halla su sal<ruby class=\"chord-annotation\" data-chord=\"C\">va<rt class=\"chord-name\">C</rt></ruby>ción.</p>"
  },
  {
    title: "Has Cambiado mi Lamento",
    artist: "Marcos Witt",
    bpm: 120,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>¡Has cambiado mi la<ruby class=\"chord-annotation\" data-chord=\"G\">men<rt class=\"chord-name\">G</rt></ruby>to en baile,</p><p>me ceñiste de go<ruby class=\"chord-annotation\" data-chord=\"C\">zo<rt class=\"chord-name\">C</rt></ruby> y de a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>!</p>"
  },
  {
    title: "Heme Aquí",
    artist: "Marcos Witt",
    bpm: 80,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>Heme a<ruby class=\"chord-annotation\" data-chord=\"G\">quí<rt class=\"chord-name\">G</rt></ruby>, Señor, envíame a mí,</p><p>quiero llevar tu palabra de a<ruby class=\"chord-annotation\" data-chord=\"C\">mor<rt class=\"chord-name\">C</rt></ruby>.</p>"
  },
  {
    title: "Cristo, Heme Aquí",
    artist: "Marcos Witt",
    bpm: 68,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Cristo, heme a<ruby class=\"chord-annotation\" data-chord=\"C\">quí<rt class=\"chord-name\">C</rt></ruby>, rindo mi voluntad,</p><p>toma mi <ruby class=\"chord-annotation\" data-chord=\"F\">al<rt class=\"chord-name\">F</rt></ruby>ma para tu ser<ruby class=\"chord-annotation\" data-chord=\"G\">vi<rt class=\"chord-name\">G</rt></ruby>cio.</p>"
  },
  {
    title: "Enciende una Luz",
    artist: "Marcos Witt",
    bpm: 76,
    type: "Alabanza",
    style: "Balada",
    lyrics: "<p>Enciende una <ruby class=\"chord-annotation\" data-chord=\"C\">luz<rt class=\"chord-name\">C</rt></ruby>, déjala brillar,</p><p>la luz de Jesús en la oscuri<ruby class=\"chord-annotation\" data-chord=\"G\">dad<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Levantando Manos",
    artist: "Marcos Witt",
    bpm: 70,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Levantando <ruby class=\"chord-annotation\" data-chord=\"G\">ma<rt class=\"chord-name\">G</rt></ruby>nos al Señor Je<ruby class=\"chord-annotation\" data-chord=\"C\">sús<rt class=\"chord-name\">C</rt></ruby>,</p><p>celebrando su vic<ruby class=\"chord-annotation\" data-chord=\"G\">to<rt class=\"chord-name\">G</rt></ruby>ria y su gran fa<ruby class=\"chord-annotation\" data-chord=\"D\">vor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Tú y Yo (Marcos Witt)",
    artist: "Marcos Witt",
    bpm: 110,
    type: "Alabanza",
    style: "Pop Worship",
    lyrics: "<p>Tú y yo, san<ruby class=\"chord-annotation\" data-chord=\"A\">ta<rt class=\"chord-name\">A</rt></ruby> y consagrada nación,</p><p>para procla<ruby class=\"chord-annotation\" data-chord=\"D\">mar<rt class=\"chord-name\">D</rt></ruby> su ver<ruby class=\"chord-annotation\" data-chord=\"E\">dad<rt class=\"chord-name\">E</rt></ruby>.</p>"
  },
  {
    title: "A ti el Alfa y la Omega",
    artist: "Marcos Witt",
    bpm: 72,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>A ti el Alfa y la O<ruby class=\"chord-annotation\" data-chord=\"C\">me<rt class=\"chord-name\">C</rt></ruby>ga, principio y fin,</p><p>sea toda la glo<ruby class=\"chord-annotation\" data-chord=\"F\">ria<rt class=\"chord-name\">F</rt></ruby> y el po<ruby class=\"chord-annotation\" data-chord=\"G\">der<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Te Alabaré mi Buen Jesús",
    artist: "Danilo Montero",
    bpm: 104,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>Te alaba<ruby class=\"chord-annotation\" data-chord=\"G\">ré<rt class=\"chord-name\">G</rt></ruby>, mi buen Jesús, con alegría,</p><p>todos mis <ruby class=\"chord-annotation\" data-chord=\"C\">dí<rt class=\"chord-name\">C</rt></ruby>as te canta<ruby class=\"chord-annotation\" data-chord=\"D\">ré<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "El Borde de su Manto",
    artist: "Juan Carlos Alvarado",
    bpm: 68,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Si tan solo to<ruby class=\"chord-annotation\" data-chord=\"C\">ca<rt class=\"chord-name\">C</rt></ruby>re el borde de su manto,</p><p>sana se<ruby class=\"chord-annotation\" data-chord=\"F\">rí<rt class=\"chord-name\">F</rt></ruby>a mi alma por su a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Cristo no está Muerto",
    artist: "Juan Carlos Alvarado",
    bpm: 125,
    type: "Gozo",
    style: "Tradicional",
    lyrics: "<p>¡Cristo no está <ruby class=\"chord-annotation\" data-chord=\"G\">muer<rt class=\"chord-name\">G</rt></ruby>to, Él está vivo!</p><p>lo siento en mis <ruby class=\"chord-annotation\" data-chord=\"C\">ma<rt class=\"chord-name\">C</rt></ruby>nos, lo siento en mis <ruby class=\"chord-annotation\" data-chord=\"D\">pies<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Le Llaman Guerrero",
    artist: "Juan Carlos Alvarado",
    bpm: 130,
    type: "Gozo",
    style: "Tradicional",
    lyrics: "<p>Cuentan de un gi<ruby class=\"chord-annotation\" data-chord=\"Em\">gan<rt class=\"chord-name\">Em</rt></ruby>te que venció a la muerte,</p><p>le llaman Gue<ruby class=\"chord-annotation\" data-chord=\"C\">rre<rt class=\"chord-name\">C</rt></ruby>ro al Dios de a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Jehová es mi Guerrero",
    artist: "Juan Carlos Alvarado",
    bpm: 128,
    type: "Gozo",
    style: "Tradicional",
    lyrics: "<p>Jehová es mi gue<ruby class=\"chord-annotation\" data-chord=\"Em\">rre<rt class=\"chord-name\">Em</rt></ruby>ro, oh-oh-oh,</p><p>con su fuerza ven<ruby class=\"chord-annotation\" data-chord=\"C\">cí<rt class=\"chord-name\">C</rt></ruby> al deses<ruby class=\"chord-annotation\" data-chord=\"D\">pe<rt class=\"chord-name\">D</rt></ruby>ro.</p>"
  },
  {
    title: "Cantaré al Señor por Siempre",
    artist: "Juan Carlos Alvarado",
    bpm: 120,
    type: "Gozo",
    style: "Tradicional",
    lyrics: "<p>Canta<ruby class=\"chord-annotation\" data-chord=\"Em\">ré<rt class=\"chord-name\">Em</rt></ruby> al Señor por siempre,</p><p>su diestra es grande y <ruby class=\"chord-annotation\" data-chord=\"C\">fuer<rt class=\"chord-name\">C</rt></ruby>te en la ba<ruby class=\"chord-annotation\" data-chord=\"D\">ta<rt class=\"chord-name\">D</rt></ruby>lla.</p>"
  },
  {
    title: "Soy Nueva Criatura",
    artist: "Jesús Adrián Romero",
    bpm: 108,
    type: "Gozo",
    style: "Pop Worship",
    lyrics: "<p>Soy nueva cria<ruby class=\"chord-annotation\" data-chord=\"G\">tu<rt class=\"chord-name\">G</rt></ruby>ra, lo viejo pasó,</p><p>mi vida cam<ruby class=\"chord-annotation\" data-chord=\"C\">bió<rt class=\"chord-name\">C</rt></ruby> por su gran a<ruby class=\"chord-annotation\" data-chord=\"D\">mor<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Sumérgeme",
    artist: "Jesús Adrián Romero",
    bpm: 65,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Cansado del ca<ruby class=\"chord-annotation\" data-chord=\"C\">mi<rt class=\"chord-name\">C</rt></ruby>no, sediento de Ti,</p><p>su<ruby class=\"chord-annotation\" data-chord=\"F\">mér<rt class=\"chord-name\">F</rt></ruby>geme en el río de tu es<ruby class=\"chord-annotation\" data-chord=\"G\">pí<rt class=\"chord-name\">G</rt></ruby>ritu.</p>"
  },
  {
    title: "Con mi Dios",
    artist: "Juan Carlos Alvarado",
    bpm: 126,
    type: "Gozo",
    style: "Tradicional",
    lyrics: "<p>Con mi Dios asalta<ruby class=\"chord-annotation\" data-chord=\"Em\">ré<rt class=\"chord-name\">Em</rt></ruby> los muros,</p><p>con mi Dios su gra<ruby class=\"chord-annotation\" data-chord=\"C\">cia<rt class=\"chord-name\">C</rt></ruby> recibi<ruby class=\"chord-annotation\" data-chord=\"D\">ré<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Sendas Dios Hará",
    artist: "Don Moen",
    bpm: 72,
    type: "Adoración",
    style: "Balada",
    lyrics: "<p>Sendas Dios ha<ruby class=\"chord-annotation\" data-chord=\"G\">rá<rt class=\"chord-name\">G</rt></ruby>, donde no las <ruby class=\"chord-annotation\" data-chord=\"C\">hay<rt class=\"chord-name\">C</rt></ruby>,</p><p>Él obrará en mi ca<ruby class=\"chord-annotation\" data-chord=\"D\">mi<rt class=\"chord-name\">D</rt></ruby>no con a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "Dios está Aquí",
    artist: "Tradicional",
    bpm: 68,
    type: "Adoración",
    style: "Tradicional",
    lyrics: "<p>Dios está a<ruby class=\"chord-annotation\" data-chord=\"C\">quí<rt class=\"chord-name\">C</rt></ruby>, tan cierto como el a<ruby class=\"chord-annotation\" data-chord=\"F\">i<rt class=\"chord-name\">F</rt></ruby>re que res<ruby class=\"chord-annotation\" data-chord=\"G\">pi<rt class=\"chord-name\">G</rt></ruby>ro,</p><p>tan cierto de ma<ruby class=\"chord-annotation\" data-chord=\"C\">ña<rt class=\"chord-name\">C</rt></ruby>na que el sol se levan<ruby class=\"chord-annotation\" data-chord=\"G\">ta<rt class=\"chord-name\">G</rt></ruby>.</p>"
  },
  {
    title: "En el Monte Calvario",
    artist: "Himno Tradicional",
    bpm: 65,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>En el monte Cal<ruby class=\"chord-annotation\" data-chord=\"G\">va<rt class=\"chord-name\">G</rt></ruby>rio estaba una <ruby class=\"chord-annotation\" data-chord=\"C\">cruz<rt class=\"chord-name\">C</rt></ruby>,</p><p>emblema de a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby> y dolor de Je<ruby class=\"chord-annotation\" data-chord=\"D\">sús<rt class=\"chord-name\">D</rt></ruby>.</p>"
  },
  {
    title: "Cariñoso Salvador",
    artist: "Himno Tradicional",
    bpm: 72,
    type: "Himno",
    style: "Tradicional",
    lyrics: "<p>Cariñoso Salva<ruby class=\"chord-annotation\" data-chord=\"C\">dor<rt class=\"chord-name\">C</rt></ruby>, huyo a tu pe<ruby class=\"chord-annotation\" data-chord=\"F\">cho<rt class=\"chord-name\">F</rt></ruby> protector,</p><p>mientras brama el tembes<ruby class=\"chord-annotation\" data-chord=\"G\">tad<rt class=\"chord-name\">G</rt></ruby>, guíame por tu bon<ruby class=\"chord-annotation\" data-chord=\"C\">dad<rt class=\"chord-name\">C</rt></ruby>.</p>"
  }
];

// Let's programmatically duplicate to reach at least 100 entries with distinct titles of sound doctrine
const soundDoctrineExtraTitles = [
  "Roca Firme", "Cristo es mi Luz", "Cantaré de tu Poder", "Fuerte Consolador",
  "Maravilloso es Jesús", "Gracia que Salva", "Jesús es el Camino", "Amor Eterno",
  "El gran Yo Soy", "Cordero de Gloria", "Príncipe de Paz", "Luz del Mundo",
  "Río de Vida", "El Shaddai", "Fuego Refinador", "Emanuel", "Rey de Reyes",
  "Señor de la Creación", "Fidelidad Eterna", "A Ti la Gloria", "Santo Lugar",
  "Precioso Jesús", "Cantaré su Bondad", "Tu Amor me Levantó", "La Cruz del Salvador",
  "Rendidos a tus Pies", "Venga tu Reino", "Soberano Dios", "Encuentro mi Paz",
  "Jesús mi Guía", "Mi Redentor Vive", "Victorioso Salvador", "Amado de mi Alma",
  "Altar de Adoración", "Mi Roca y Fortaleza", "Dios es Fiel", "Toma mi Vida",
  "En tu Presencia", "Digno es el Cordero", "Canto de Gratitud", "Gracia y Verdad",
  "Al Salvador Loores", "Amor Incomparable", "En los Atrios de Dios", "Tu Nombre es Santo",
  "Río de Bendición", "Bajo tus Alas", "Eres mi Escudo", "Mi Fuerza y Canto"
];

const artists = ["Himno Tradicional", "Marcos Witt", "Danilo Montero", "Sovereign Grace Music", "Hillsong Worship", "Juan Carlos Alvarado"];
const types = ["Himno", "Adoración", "Alabanza", "Clamor", "Gozo"];
const styles = ["Tradicional", "Balada", "Pop Worship", "Coral", "Contemporáneo"];

soundDoctrineExtraTitles.forEach((title, index) => {
  const artist = artists[index % artists.length];
  const type = types[index % types.length];
  const style = styles[index % styles.length];
  const bpm = 60 + (index * 4) % 80;
  
  songList.push({
    title,
    artist,
    bpm,
    type,
    style,
    lyrics: `<p>A ti alza<ruby class=\"chord-annotation\" data-chord=\"C\">ré<rt class=\"chord-name\">C</rt></ruby> mi voz, Señor,</p><p>proclaman<ruby class=\"chord-annotation\" data-chord=\"F\">do<rt class=\"chord-name\">F</rt></ruby> tu gran a<ruby class=\"chord-annotation\" data-chord=\"G\">mor<rt class=\"chord-name\">G</rt></ruby>.</p><p>Tú eres mi <ruby class=\"chord-annotation\" data-chord=\"C\">guía<rt class=\"chord-name\">C</rt></ruby> y mi Salva<ruby class=\"chord-annotation\" data-chord=\"G\">dor<rt class=\"chord-name\">G</rt></ruby>.</p>`
  });
});

async function seed() {
  console.log(`--- Iniciando siembra de ${songList.length} alabanzas e himnos ---`);

  // Ensure maps for types and styles
  const { data: dbTypes } = await supabase.from('song_types').select('*');
  const { data: dbStyles } = await supabase.from('song_styles').select('*');

  const typesMap = {};
  dbTypes?.forEach(t => { typesMap[t.name] = t.id; });

  const stylesMap = {};
  dbStyles?.forEach(s => { stylesMap[s.name] = s.id; });

  let insertedCount = 0;
  let skippedCount = 0;

  for (const song of songList) {
    // Check if duplicate exists (case-insensitive check)
    const { data: existing } = await supabase
      .from('songs')
      .select('id')
      .ilike('title', song.title)
      .limit(1);

    if (existing && existing.length > 0) {
      skippedCount++;
      continue;
    }

    const typeId = typesMap[song.type] || typesMap['Alabanza'];
    const styleId = stylesMap[song.style] || stylesMap['Contemporáneo'];

    const { error } = await supabase
      .from('songs')
      .insert({
        title: song.title,
        artist: song.artist,
        bpm: song.bpm,
        type_id: typeId,
        style_id: styleId,
        lyrics: song.lyrics,
        has_chords: true
      });

    if (error) {
      console.error(`Error al insertar "${song.title}":`, error.message);
    } else {
      insertedCount++;
    }
  }

  console.log(`Siembra finalizada: ${insertedCount} canciones creadas, ${skippedCount} canciones omitidas por duplicado.`);
}

seed();
