import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const batch4Songs = {
  "Soy Nueva Criatura": `[Estrofa 1]
Soy nueva cri[G]atura, lo de[C]clara las Es[D]crituras
Él me per[G]donó, con su [C]sangre me la[D]vó
Todos mis pe[G]cados [Em]por su [Am]sangre son bo[D]rrados
Libre [G]soy [Em]del pe[Am]cado y del te[D]mor

[Coro]
Libre [G]soy, del pe[C]cado y [D]la maldad
Libre [G]soy, Él ha [C]roto mi se[D]quedad
Soy nueva cri[G]atura, [Em]lo de[Am]clara la Es[D]critura
Libre [G]soy, [Em]libre [C]soy [D]en Je[G]sús

[Estrofa 2]
Ahora vi[G]vo para Cristo, Él me [C]ha dado su [D]amor
Él me [G]guía con su Espíritu, Él [C]es mi Salva[D]dor
Ya no [G]vivo yo, [Em]mas Cristo [Am]vive en [D]mí
Libre [G]soy, [Em]para [Am]siempre a Él ser[D]vir`,

  "En el Monte Calvario": `[Estrofa 1]
En el [G]monte Calvario es[C]taba una [G]cruz,
Emble[D]ma de a[C]frenta y do[G]lor,
Y yo [G]amo esa cruz do mu[C]rió mi Je[G]sús,
Por sal[D]var al más [C]vil peca[G]dor.

[Coro]
Oh, yo [D]siempre a[C]maré esa [G]cruz,
En sus [C]triunfos mi gloria se[G]rá;
Y alg[G]ún día en [G7]vez de una [C]cruz,
Mi co[G]rona Je[D]sús me da[G]rá.

[Estrofa 2]
Aunque el [G]mundo desprecie la [C]cruz de Je[G]sús,
Para [D]mí tiene [C]suma atrac[G]ción;
Pues en [G]ella llevó el Cor[C]dero de [G]Dios,
De mi [D]alma la [C]conde[G]nación.`,

  "Fuerte Consolador": `[Estrofa 1]
Fuerte [G]Consola[D]dor, [Em]Tú eres [C]mi guía
Tu pre[G]sencia es en [D]mí, [Em]luz de cada [C]día
Al in[G]vocar tu [D]nombre, [Em]huye la an[C]siedad
Santo Es[G]píritu [D]de Dios, [C]llena mi he[G]redad

[Coro]
Consola[G]dor, amigo [D]fiel
Espíritu de [Em]Dios, ven con po[C]der
Derrama tu [G]unción, llena [D]mi ser
Precioso [C]Consola[D]dor, [G]amén`,

  "El gran Yo Soy": `[Estrofa]
Quiero [Em]estar, cerca de ti [C]
Que el cielo [G]escuche, lo que hay en mi [D]
Quiero [Em]estar, cerca de ti [C]
Que el cielo [G]escuche, mi cora[D]zón

[Coro]
A[C]lelu[Em]ya, Santo [D]Santo
Dios Todo[C]poderoso [Em]el gran Yo [D]Soy
A[C]lelu[Em]ya, Santo [D]Santo
Dios Todo[C]poderoso [Em]el gran Yo [D]Soy
El gran Yo [C]Soy, el gran Yo [Em]Soy [D]`,

  "El Shaddai": `[Coro]
El Shad[Am]dai, El Shad[D]dai, El Ely[G]on na Ado[C]nai,
Age to [F]age You're still the [Bdim]same,
By the [E]power of the [Am]name.
El Shad[Am]dai, El Shad[D]dai, Erkam[G]ka na Ado[C]nai,
We will [F]praise and lift You [Bdim]high,
El Shad[C]dai.

[Estrofa 1]
Through Your [Am]love and through the [D]ram,
You saved the [G]son of Abra[C]ham;
Through the [F]power of Your [Bdim]hand,
Turned the [E]sea into dry [Am]land.
To the [Am]outcast on her [D]knees,
You were the [G]God who really [C]sees,
And by Your [F]might,
You set Your [Bdim]children free. [C]`,

  "Fidelidad Eterna": `[Estrofa]
Tu fide[G]lidad e[D]terna es [Em]para con[C]migo
Tus pro[G]mesas [D]no falla[Em]rán [C]
En la a[G]flicción Tú [D]eres [Em]mi amparo [C]
Tu gracia [G]nunca [D]me deja[Em]rá [C]

[Coro]
Fideli[G]dad, [D]eterna fideli[Em]dad [C]
De gene[G]ración en ge[D]neración, [Em]te exalta[C]ré
Tu miseri[G]cordia [D]es nueva [Em]cada ma[C]ñana
Grande [G]es tu [D]fideli[G]dad`,

  "Tu Amor me Levantó": `[Estrofa 1]
En pa[G]siones del mundo yo va[D]gaba
Sin Dios y [C]sin consola[G]ción [D]
Pero [G]Cristo con su [D]inmensa gracia
Me sal[C]vó de [D]perdi[G]ción

[Coro]
Tu a[G]mor me levan[D]tó
Cuando no [C]había espe[G]ran[D]za
Tu a[G]mor me levan[D]tó
Me dio la [C]paz [D]y la sal[G]vación`,

  "Encuentro mi Paz": `[Estrofa 1]
Cuando a[G]rrecian las [D]olas del [Em]mar [C]
Y el [G]viento a[D]zota sin ce[Em]sar [C]
A Ti, Se[G]ñor, yo [D]clama[Em]ré [C]
Y en tus [G]brazos [D]yo des[Em]cansa[C]ré

[Coro]
Encuentro mi [G]paz [D]solamente en [Em]Ti [C]
Encuentro el re[G]fugio [D]que hay para [Em]mí [C]
No teme[G]ré [D]la tem[Em]pes[C]tad
Encuentro mi [G]paz [D]en tu bon[G]dad`,

  "Altar de Adoración": `[Estrofa 1]
Quiero ser un [G]altar de adora[D]ción
Para [Em]Ti, mi Rey y Se[C]ñor
Donde [G]arda el fuego [D]de tu amor
Y flu[Em]ya con gozo [C]mi clamor

[Coro]
Toma mi [G]vida, [D]es para [Em]Ti [C]
Toma mi [G]ser, [D]habita en [Em]mí [C]
Como ofren[G]da de [D]olor fra[Em]gan[C]te
Quiero [G]ser un [D]altar para [G]Ti`,

  "Sana Nuestra Tierra": `[Estrofa 1]
Si mi [G]pueblo se humi[D]llare
Y cla[Em]mare a [C]mí
Si bus[G]caren mi [D]rostro
Y se [Em]volvieren de sus malos ca[C]minos

[Coro]
Sana [G]nuestra tierra, [D]sana nuestra tierra
Oh Se[Em]ñor, derra[C]ma de tu amor
Perdo[G]na nues[D]tro pe[Em]ca[C]do
Y [G]sana nues[D]tra tie[G]rra`,

  "Escúchame, Señor": `[Estrofa 1]
Escúcha[G]me, Se[D]ñor, mi o[Em]ración [C]
Presta o[G]ído a [D]mi cla[Em]mor [C]
Porque [G]solo Tú [D]eres mi es[Em]peran[C]za
A [G]Ti, oh [D]Dios, ele[Em]vo mi [C]voz

[Coro]
Escúcha[G]me, [D]cuando te in[Em]voco [C]
Escúcha[G]me, [D]Dios de mi jus[Em]ticia [C]
En la an[G]gustia [D]Tú me has en[Em]sancha[C]do
Ten miseri[G]cordia de [D]mí, y oye mi ora[G]ción`,

  "Levantando Manos": `[Estrofa 1]
Levan[G]tando ma[D]nos al Se[Em]ñor [C]
Le a[G]dora[D]mos con a[Em]mor [C]
Procla[G]mando [D]su bon[Em]dad [C]
Y su [G]gran [D]fide[Em]li[C]dad

[Coro]
Te a[G]dora[D]mos, te e[Em]xalta[C]mos
Rey de [G]reyes, [D]Señor de se[Em]ño[C]res
Levan[G]tando [D]manos a [Em]Ti [C]
Te brin[G]damos [D]nuestro a[G]mor`,

  "Cristo no está Muerto": `[Coro]
Cristo no está [G]muerto, Él está vivo
Cristo no está [C]muerto, Él está [G]vivo
Cristo no está mu[G]erto, Él está vivo
Lo siento en mis [D]manos, lo siento en mis [C]pies
Lo siento en todo mi [G]ser

[Estrofa 1]
La [G]tumba está vacía, Él ya resucitó
La [C]muerte no ha podido, la [G]tumba Él venció
[G]Alabemos todos juntos a nuestro Salvador
Por[D]que Él vive, [C]vive el Se[G]ñor`,

  "Sumérgeme": `[Estrofa 1]
[G]Cansado del ca[D/F#]mino, se[Em]diento de [C]Ti
[G]Un desierto he cru[D/F#]zado, sin [Em]fuerzas he que[C]dado, vengo a [D]Ti
[G]Luché como sol[D/F#]dado, y a [Em]veces su[C]frí
[G]Y aunque la lucha he ga[D/F#]nado, mi arm[Em]adura he des[C]gastado, vengo a [D]Ti

[Coro]
Su[G]mérgeme[D/F#]
En el [Em]río de tu Es[Bm]píritu
Nece[C]sito refres[Am]car este seco [D]corazón,
Sediento de [G]Ti`,

  "Sobrenatural": `[Estrofa 1]
[G]Sobrenatural e[D]res Dios,
Sin i[Em]gual, sin compa[C]ración
Eres [G]Dios de mila[D]gros,
Pode[Em]roso, Salva[C]dor

[Coro]
Tú eres so[G]bre[D]natu[Em]ral[C]
No hay [G]nadie co[D]mo Tú, mi [Em]Dios[C]
Haces mara[G]villas, [D]sanidad y [Em]paz[C]
Tú eres so[G]bre[D]natu[Em]ral[C]`,

  "Has Cambiado mi Lamento": `[Estrofa 1]
[G]Has cambiado mi la[D]mento en baile,
[C]Me ceñiste de ale[G]gría [D]
[G]Por tanto a Ti can[D]taré
[C]Gloria mía, gloria [G]mía [D]

[Coro]
Y [G]solo a [D]Ti can[Em]taré [C]
[G]Gloria [D]mía, gloria [Em]mía [C]
Oh [G]Señor, [D]Dios mío
Te a[Em]labaré por [C]siempre
[G]Porque has cambiado mi [D]lamento en [G]baile`,

  "Jehová es mi Guerrero": `[Estrofa 1]
Jeho[Em]vá es mi guerrero, [C]oh, oh, oh
Jeho[D]vá es mi guerrero, [Em]oh, oh, oh
Jeho[Em]vá es mi guerrero, [C]oh, oh, oh
Jeho[D]vá es mi guerrero, [Em]oh, oh, oh

[Coro]
Con mi ala[C]banza pelea[D]ré
Pues no es mi [Em]guerra, sino la de [D]Dios
Danza y pan[C]dero, yo toca[D]ré
Pues no es mi [Em]guerra, sino la de [D]Dios
Címbalo y [C]trompeta sona[D]ré
Pues no es mi [B7]guerra, sino la de [Em]Dios`
};

async function completeBatch4() {
  console.log('Completando letras de la Fase 4...');
  let successCount = 0;
  for (const [title, fullLyrics] of Object.entries(batch4Songs)) {
    const { data, error } = await supabase
      .from('songs')
      .select('id, title')
      .ilike('title', title)
      .limit(1);

    if (error) {
      console.error(`Error buscando ${title}:`, error);
      continue;
    }

    if (data && data.length > 0) {
      const songId = data[0].id;
      const { error: updateError } = await supabase
        .from('songs')
        .update({ lyrics: fullLyrics })
        .eq('id', songId);

      if (updateError) {
        console.error(`Error actualizando ${title}:`, updateError);
      } else {
        console.log(`✅ Completada: ${title}`);
        successCount++;
      }
    } else {
      console.log(`❌ No encontrada: ${title}`);
    }
  }
  console.log(`\nFase 4 terminada. ${successCount} canciones actualizadas.`);
}

completeBatch4();
