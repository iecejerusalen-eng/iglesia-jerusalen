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

const batch1Songs = {
  "Gracia Sublime Es": `[Estrofa 1]
¿Quién rompe el po[C]der del pecado?
Su amor es fuer[F]te y poderoso
El Rey de glo[Am]ria, el Rey ma[G]jestuoso

[Estrofa 2]
Conmueve el mun[C]do con su estruendo
Y nos asom[F]bra con maravillas
El Rey de glo[Am]ria, el Rey ma[G]jestuoso

[Coro]
Gra[C]cia sublime es, per[F]fecto es tu amor
Tomaste mi lu[Am]gar, llevaste mi do[G]lor
Tú me has he[C]cho libre, tu san[F]gre me limpió
Jesús, entre[Am]go mi vi[G]da a ti[C]

[Estrofa 3]
Tú pones or[C]den en el caos
Nos haces hi[F]jos, nos haces tuyos
El Rey de glo[Am]ria, el Rey ma[G]jestuoso

[Estrofa 4]
Tú goberna[C]rás con justicia
Y resplande[F]ces en todo el mundo
El Rey de glo[Am]ria, el Rey ma[G]jestuoso

[Puente]
Digno es el Cor[C]dero de Dios
Digno es el Rey que la [F]muerte venció
Digno es el Cor[Am]dero de Dios
Digno es el Rey que la [G]muerte venció`,

  "Grande y Fuerte": `[Intro]
[Em] [C] [G] [D]

[Estrofa 1]
Grande y fuer[Em]te es nuestro Dios
Grande y fuer[C]te es nuestro Dios
Grande y fuer[G]te es nuestro Dios
Grande y fuer[D]te es nuestro Dios

[Coro]
Vestido en glo[Em]ria, corona de po[C]der
La creación pro[G]clama su ma[D]jestad
Alelu[Em]ya, a nuestro [C]Rey
Alelu[G]ya, al Dios de [D]Israel

[Estrofa 2]
Grande y fuer[Em]te es nuestro Dios
Grande y fuer[C]te es nuestro Dios
Grande y fuer[G]te es nuestro Dios
Grande y fuer[D]te es nuestro Dios

[Puente]
Todos te adora[Em]rán, todos te exalta[C]rán
Poderoso Dios de [G]Israel [D]
Todos te adora[Em]rán, todos te exalta[C]rán
Poderoso Dios de [G]Israel [D]`,

  "Tu Fidelidad Es Grande": `[Estrofa]
Tu fi[C]delidad es grande
Tu fi[F]delidad incompa[G]rable es
Nadie co[Dm]mo Tú, bendito [G]Dios
Grande es tu fi[G7]deli[C]dad

[Coro]
Tu fi[C]delidad es grande
Tu fi[F]delidad incompa[G]rable es
Nadie co[Dm]mo Tú, bendito [G]Dios
Grande es tu fi[G7]deli[C]dad`,

  "Cuán Grande es Dios": `[Estrofa 1]
El es[G]plendor de un Rey, ves[Em]tido en majestad
La tie[C]rra se alegrará, la tierra se alegrará
Se cu[G]bre de luz, ven[Em]ció a la oscuridad
Y tiem[C]bla a su voz, y tiembla a su voz

[Coro]
¡Cuán gran[G]de es Dios! Can[Em]taré
¡Cuán gran[C]de es Dios! Y to[D]dos lo verán
¡Cuán gran[G]de es Dios!

[Estrofa 2]
Día a [G]día Él está, y el [Em]tiempo en Él está
Prin[C]cipio y el fin, principio y el fin
La Tri[G]nidad en Dios, el [Em]Padre, Hijo, Espíritu
Cor[C]dero y el León, Cordero y el León

[Puente]
Y tu [G]Nombre sobre todo es
E[Em]res digno de alabar
Y mi [C]ser dirá: ¡Cuán [D]grande es [G]Dios!`,

  "Digno es el Señor": `[Estrofa]
[G]Gracias por la cruz, oh [C]Dios
[G]El precio que pagaste por [C]mí
Levando mi pe[Em]cado y mi dolor
Tu amor me re[D]dimió

[G]Gracias por tu amor, oh [C]Dios
[G]Tus manos clavadas por [C]mí
Me has lavado, oh [Em]Señor,
Conozco hoy tu [D]perdón

[Coro]
[G]Digno es el Se[D]ñor, [Am]en su [G]trono es[C]tá
[D]Coro[C]nado de m[D]ajes[Em]tad, [C]reina para si[D]empre
[G]Cristo el Salva[D]dor, [Am]Hijo del[G] gran Di[C]os
[D]El ven[C]cedor cru[D]cifi[Em]cado por [C]mí
[Am]Digno es el Se[G]ñor [C]
[Am]Digno es el Se[D]ñor`,

  "Oh, Qué Amigo nos es Cristo": `[Estrofa 1]
¡Oh, qué a[C]migo nos es [F]Cristo! 
Él lle[C]vó nuestro do[G]lor
Y nos [C]manda que lle[F]vemos 
Todo a [C]Dios en o[G]ra[C]ción

[Estrofa 2]
¿Vive el [G]hombre despro[C]visto 
De paz, [F]gozo y santo a[G]mor?
Esto es [C]porque no lle[F]vamos 
Todo a [C]Dios en o[G]ra[C]ción

[Estrofa 3]
¿Vives [C]débil y car[F]gado 
De cui[C]dados y te[G]mor?
A Je[C]sús, refugio e[F]terno 
Dile [C]todo en o[G]ra[C]ción

[Estrofa 4]
¿Te des[G]precian tus a[C]migos? 
Cuénta[F]selo en ora[G]ción
En sus [C]brazos de amor [F]tierno 
Paz ten[C]drá tu co[G]ra[C]zón`,

  "Alabaré": `[Coro]
Alaba[G]ré, alaba[Em]ré, alaba[Am]ré, alaba[D]ré
Alaba[G]ré a mi Señor
Alaba[G]ré, alaba[Em]ré, alaba[Am]ré, alaba[D]ré
Alaba[G]ré a mi Señor

[Estrofa 1]
Juan [G]vio el número de los redimidos
De los [D]que alababan al Señor
[D]Unos cantaban, otros oraban
Pero [G]todos alababan al Señor

[Estrofa 2]
[G]Todos unidos, alegres cantamos
[D]Glorias y alabanzas al Señor
[D]Gloria al Padre, gloria al Hijo
Y [G]gloria al Espíritu de Amor`,

  "La Bondad de Dios": `[Estrofa 1]
Te a[G]mo, Dios
Tu amor nunca me [C]ha fa[G]llado
Mis [Em]días en tus [C]manos es[D]tán
Desde que des[Em]pierto has[C]ta el ano[G]che[D/F#]cer [Em]
[C]Cantaré de la bon[D]dad de [G]Dios

[Coro]
Toda mi [C]vida has sido [G]fiel
Toda mi [C]vida has sido tan, tan [G]bueno [D]
Con cada a[C]liento que hay en [G]mí [D/F#] [Em]
[C]Cantaré de la bon[D]dad de [G]Dios

[Estrofa 2]
A[G]mo tu voz
A través del [C]fuego me [G]guías
En la os[Em]curidad tu pro[C]ximidad es[D]tá
Te conozco co[Em]mo un Pa[C]dre
Y co[G]mo un a[D/F#]migo [Em]
He vi[C]vido en la bon[D]dad de [G]Dios

[Puente]
[G/B]Tu bondad me [C]sigue, me persigue a [D]donde [G]voy
[G/B]Tu bondad me [C]sigue, me persigue a [D]donde [G]voy
Rindo mi [G/B]vida hoy, te en[C]trego todo, te la [D]doy a [Em]ti
[G/B]Tu bondad me [C]sigue, me persigue a [D]donde [G]voy`,

  "Abre Mis Ojos Oh Cristo": `[Estrofa]
Abre mis [E]ojos, oh Cristo
Abre mis [B]ojos, Señor
Yo quiero [A]verte
Yo quiero [E]verte
Abre mis [E]ojos, oh Cristo
Abre mis [B]ojos, Señor
Yo quiero [A]verte
Yo quiero [E]verte

[Coro]
Y verte al[B]to y sub[C#m]lime
Bri[A]llando en la luz de tu [B]gloria
Derra[B]ma tu poder y a[C#m]mor
Mientas canta[A]mos, santo, [B]santo

[Puente]
Santo, santo, [E]santo
Santo, santo, [B]santo
Santo, santo, [A]santo
Yo quiero [E]verte`,

  "Sublime Gracia": `[Estrofa 1]
Su[C]blime [F]gracia del Se[C]ñor
Que un in[Am]feliz sal[G]vó
Fui [C]ciego, [F]mas hoy miro [C]yo
Per[Am]dido y [G]Él me ha[C]lló

[Estrofa 2]
Su [C]gracia me [F]enseñó a te[C]mer
Mis [Am]dudas ahu[G]yentó
Oh, [C]cuán pre[F]cioso fue a mi [C]ser
Al [Am]dar mi [G]cora[C]zón

[Estrofa 3]
En [C]los pe[F]ligros o aflic[C]ción
Que [Am]yo he teni[G]do aquí
Su [C]gracia [F]siempre me li[C]bró
Y [Am]me guia[G]rá fe[C]liz

[Estrofa 4]
Y [C]cuando [F]en Sion por [C]siglos mil
Bri[Am]llando esté cual [G]sol
Yo [C]canta[F]ré por siem[C]pre allí
Su [Am]amor que [G]me sal[C]vó`,

  "A Dios sea la Gloria": `[Estrofa 1]
¿Cómo po[C]dré agra[Em]decer
Todo lo [F]que has he[G]cho por [C]mí?
Cosas tan in[Em]merecidas 
Que has [F]dado para [E]mostrar tu [Am]amor por mí.
Las vo[F]ces de millo[Em]nes de án[Am]geles
No ex[F]presarán mi grati[G]tud.
Lo que [C]soy y lo [Am]que anhelo [Dm]ser,
Se lo [F]debo [G]todo a [C]Ti.

[Coro]
¡A [C]Dios sea la [Am]gloria! ¡A [F]Dios sea la [G]gloria!
¡A [E]Dios sea la [Am]gloria, por lo [D7]que Él [G7]hizo por mí!
Con su [C]sangre [Am]me ha salvado,
Su po[F]der me [E]ha levantado.
¡A [Am]Dios sea la [Dm]gloria, [G7]por lo que Él hizo por [C]mí!

[Puente]
Quiero vi[E]vir mi vida agra[Am]dándote solo a Ti.
Si algo [F]bueno hay [Em]en mi, toda la [Dm]gloria [G7]sea para [C]Ti.`,

  "Tú estás aquí": `[Estrofa 1]
Aun[G]que mis ojos no te pue[D]dan ver,
Te pue[Em]do sentir, sé que es[C]tás aquí.
Aun[G]que mis manos no pueden to[D]car,
Tu ros[Em]tro Señor, sé que es[C]tás aquí.

[Coro]
Mi cora[G]zón, puede sen[D]tir tu presen[Em]cia,
Tú es[C]tás aquí, Tú es[G]tás aquí.
Puedo sen[G]tir, tu majes[D]tad
Tú es[Em]tás aquí, Tú es[C]tás aquí.

[Estrofa 2]
Mi [G]corazón, puede mi[D]rar tu belle[Em]za,
Tú es[C]tás aquí, Tú es[G]tás aquí.
Puedo sen[G]tir, tu gran a[D]mor
Tú es[Em]tás aquí, Tú es[C]tás aquí.`,

  "Santo, Santo, Santo": `[Estrofa 1]
[C]Santo, santo, [G]santo
[F]Señor Omnipo[C]tente
[F]Siempre el [C]labio [Am]mío
[G]Loores te da[G7]rá

[Estrofa 2]
[C]Santo, santo, [G]santo
[F]Te adoro reve[C]rente
[Am]Dios en tres [F]perso[C]nas
[F]Bendi[G]ta Trini[C]dad

[Estrofa 3]
[C]Santo, santo, [G]santo
La [F]inmensa muche[C]dumbre
[F]De ánge[C]les que [Am]cumplen
Tu [G]santa volun[G7]tad

[Estrofa 4]
[C]Ante Ti se pos[G]tran
Ba[F]ñados de tu [C]lumbre
[Am]Ante Ti que [F]has si[C]do,
Que [F]eres [G]y se[C]rás`,

  "Tu Fidelidad": `[Estrofa]
Tu fi[C]delidad es grande
Tu fi[F]delidad incompa[G]rable es
Nadie co[Dm]mo Tú, bendito [G]Dios
Grande es tu fi[G7]deli[C]dad

[Coro]
Tu fi[C]delidad es grande
Tu fi[F]delidad incompa[G]rable es
Nadie co[Dm]mo Tú, bendito [G]Dios
Grande es tu fi[G7]deli[C]dad`,

  "Cerca de Ti, Señor": `[Estrofa 1]
Cer[G]ca de Ti, Se[C]ñor, yo quiero es[G]tar,
Aunque sea una [D]cruz que me haga an[G]dar;
Este mi [G]canto a[C]sí, cerca de [G]Ti, Se[D]ñor,
Yo quiero es[G]tar.

[Estrofa 2]
Mi [G]pobre cora[C]zón, inquieto es[G]tá,
Hasta que su man[D]sión en Ti ha[G]llará;
Viviré [G]en la [C]luz, cerca de [G]Ti, Se[D]ñor,
Por mi Je[G]sús.

[Estrofa 3]
Pa[G]sos inciertos [C]doy, el sol se [G]va;
Mas si contigo es[D]toy, no teme[G]rá.
Himnos de [G]grati[C]tud, alegre [G]canta[D]ré,
Por tu vir[G]tud.`
};

async function completeBatch1() {
  console.log('Completando letras de la Fase 1...');
  let successCount = 0;
  for (const [title, fullLyrics] of Object.entries(batch1Songs)) {
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
  console.log(`\nFase 1 terminada. ${successCount} canciones actualizadas.`);
}

completeBatch1();
