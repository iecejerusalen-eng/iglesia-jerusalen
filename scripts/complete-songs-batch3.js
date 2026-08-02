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

const batch3Songs = {
  "Salvo en los Tiernos Brazos": `[Estrofa 1]
Salvo en los [G]tiernos brazos de mi Jesús se[D]ré
Y en su a[D]moroso pecho siempre [C]dulce repo[G]saré
Este es el [G]son más tierno que en mi [C]corazón resue[Am]na
Lleno de [D]su consuelo que por siempre en [C]mí encon[G]tré

[Coro]
Salvo en los [G]tiernos brazos de mi Jesús se[D]ré
Y en su a[D]moroso pecho dulce [C]yo repo[G]saré

[Estrofa 2]
Salvo en los [G]tiernos brazos, me cuida del te[D]mor
De pruebas [D]y fracasos, de an[C]gustia y de do[G]lor
Cesa la [G]duda triste y ya no [C]temo el maña[Am]na
Cristo, mi [D]Rey, reviste mi vi[C]da de esplen[G]dor`,

  "Oh Jóvenes Venid": `[Estrofa 1]
¡Oh, [D]jóvenes, ve[A]nid! Su [G]brillante pabe[D]llón
Cris[D]to ha desple[A]gado ante [G]la na[D]ción.
A [D]todos en sus [A]filas os [G]quiere reci[D]bir,
Y [D]con Él a la [A]pelea [G]os ha[A]rá sa[D]lir.

[Coro]
¡Va[D]mos a Jesús, alis[G]tados sin te[D]mor!
¡Va[D]mos a la lid, infla[G]mados de va[A]lor!
Jóve[D]nes, luchemos [A]todos con[G]tra el [A]mal;
Que en Je[D]sús tene[A]mos nues[G]tro [A]Gene[D]ral.

[Estrofa 2]
Las [D]armas inven[A]cibles del [G]Jefe Salva[D]dor
Son [D]el evange[A]lio y su [G]grande a[D]mor.
Con [D]ellas reves[A]tidos y [G]llenos de po[D]der,
Com[D]pañeros va[A]lerosos, [G]¡viva el [A]de[D]ber!`,

  "Renuévame": `[Estrofa]
Renuéva[D]me, [G]Señor Je[A]sús, [D] [A/C#] [Bm]
Ya no [Em]quiero ser [A]igual
Renuéva[D]me, [G]Señor Je[A]sús, [D] [A/C#] [Bm]
Pon en [Em]mí tu cora[A]zón

[Coro]
Porque [D]todo lo que [A/C#]hay den[Bm]tro de [F#m]mí
Nece[G]sita ser cam[Em]biado Se[A]ñor
Porque [D]todo lo que [A/C#]hay
Dentro [Bm]de mi cora[F#m]zón
Nece[G]sita [A]más de [D]Ti`,

  "Dios Manda Lluvia": `[Estrofa]
[G]Dios manda [C]lluvia, [G]derrama de tu Es[C]píritu
Envía [Em]hoy tu fuego, [Am]sana mis he[D]ridas
Restáu[C]rame, [D]Se[G]ñor

[Coro]
Manda la [C]llu[D]via, [Bm]el rocío de tu a[Em]mor
Llenando las [Am]vi[D]das de la tierra oh Se[G]ñor
Manda la [C]llu[D]via, [Bm]el rocío de tu a[Em]mor
Visita mi [Am]vi[D]da, cámbiame Se[G]ñor`,

  "Quiero Levantar mis Manos": `[Estrofa 1]
Quiero levan[G]tar mis [D/F#]manos
Quiero levan[Em]tar mi [C]voz
Ofrecerte a [G]Ti mi [D]vida
En santi[Am]dad y [D]amor

[Estrofa 2]
Padre sólo a [G]Ti te o[D/F#]frezco
Mi vida y mi [Em]cora[C]zón
Y me postro en [G]tu pre[D]sencia
En adora[C]ción [D]

[Coro]
[G]Hijo de [D/F#]Dios, reci[Em]be hoy
[C]Toda la [G]gloria, [Am]la honra y [D]honor
[G]Hijo de [D/F#]Dios, reci[Em]be hoy
[C]Toda la [G]gloria, [Am]la [D]honra y [G]honor`,

  "¡Cuán Firmes Cimientos!": `[Estrofa 1]
¡Cuán [G]firmes ci[C]mientos, oh [G]santos de Dios!
Te[G]néis por la [C]fe en la [D]palabra [G]suya
¿Qué [G]más puede [C]daros la [G]voz de su a[Em]mor?
A [C]los que al refu[G]gio del [D]Cristo sa[G]lvador.

[Estrofa 2]
"No [G]temas, con[C]tigo yo [G]siempre esta[Em]ré
Yo [G]soy tu Dios, [C]fuerzas y a[D]yuda te [G]daré
Tus [G]dudas y an[C]gustias yo [G]disipa[Em]ré
Pues [C]siempre por mi [G]diestra sus[D]tentado se[G]rás."`,

  "Bellas Palabras de Vida": `[Estrofa 1]
¡Oh, [G]cantádmelas otra [D]vez!
Bellas pa[D]labras de vi[G]da
Hallo [G]en ellas mi gozo y [D]luz
Bellas pa[D]labras de vi[G]da
[C]Sí, de luz y [G]vida
[C]Son sostén y [G]guía

[Coro]
¡Qué be[D]llas son, qué be[G]llas son!
Bellas pa[D]labras de vi[G]da
¡Qué be[D]llas son, qué be[G]llas son!
Bellas pa[D]labras de vi[G]da

[Estrofa 2]
Jesu[G]cristo a todos [D]da
Bellas pa[D]labras de vi[G]da
Hoy [G]escúchalas peca[D]dor
Bellas pa[D]labras de vi[G]da
[C]Bondadoso te [G]salva
[C]Y al cielo te [G]llama`,

  "Mansión de Luz": `[Estrofa 1]
Hay un [C]país de ra[F]diante [C]luz, 
Do vi[F]viré por [C]siem[G]pre allí; 
Con mi [C]Señor, con el [F]buen Je[C]sús, 
Que de [F]su a[C]mor me ha[G]bla[C]rá. 

[Coro]
Más allá del [C]sol, [F]más allá del [C]sol 
Yo ten[C]go un ho[F]gar, ho[C]gar, bello ho[G]gar 
Más allá del [C]sol. 
Más allá del [C]sol, [F]más allá del [C]sol 
Yo ten[C]go un ho[F]gar, ho[C]gar, bello ho[G]gar 
Más allá del [C]sol. 

[Estrofa 2]
Así [C]por el mundo [F]yo voy a[C]cá, 
Pensa[F]ndo en lo [C]cele[G]stial; 
Las per[C]secuciones que [F]veo [C]allí, 
Termi[F]na[C]rán en el [G]más a[C]llá.`,

  "Solamente en Cristo": `[Estrofa 1]
Solamente en [G]Cristo, solamente en [C]Él
La sal[D]vación se en[G]cuentra en [D]Él
No hay [G]otro nombre, dado a los [C]hombres
Solamente en [D]Cristo, sola[G]mente en [D]Él

[Estrofa 2]
En [G]Jesucristo el Salvador
No hay [D]nada igual a su [G]amor
Él ha [C]cambiado [G]mi corazón
Sola[D]mente en Cristo el [G]Señor`,

  "A Cualquiera Parte Iré": `[Estrofa 1]
A cual[G]quier lugar con [C]Cristo yo [G]iré
Él me [C]cuidará en [G]donde yo [D]esté
Su [G]presencia me [C]acompaña sin [G]cesar
A cual[D]quier lugar con [G]Cristo [D]puedo an[G]dar

[Coro]
A cual[C]quier lu[G]gar, a cual[C]quier lu[G]gar
Con Je[C]sús mi [G]Guía siempre voy a es[D]tar
Pode[G]roso es Él y me [C]guiará su a[G]mor
A cual[C]quier lu[G]gar, i[D]ré con mi Se[G]ñor

[Estrofa 2]
Confi[G]ando siempre en [C]su pro[G]mesa fiel
Yo le [C]seguiré y [G]siempre [D]creeré en Él
En o[G]scuridad Él [C]es mi [G]luz y paz
A cual[D]quier lugar i[G]ré y [D]no ce[G]saré`,

  "Tuya es la Gloria": `[Estrofa 1]
Tuya [G]es la gloria, [C]tuya la hon[G]ra
Porque tú eres [Em]Digno, de su[C]prema alaba[D]nza
Oh [G]Jesucristo, [C]Cristo mi [G]Rey
Te ado[Em]ramos, proster[C]nados a [D]tus pies

[Coro]
Te co[G]rona[D]mos [Em]Rey de [C]reyes
Señor de [G]seño[D]res, Dios E[Em]manuel [C]
Príncipe de [G]paz, [D]admira[Em]ble Conse[C]jero
Dios Fuer[G]te, Padre E[D]terno, mi Je[G]sús

[Estrofa 2]
Tuya [G]es la gloria, [C]poder y do[G]minio
Por los si[Em]glos de los [C]siglos a[D]mén
Porque [G]tú eres Dios y no [C]hay otro [G]como tú
Mi salva[Em]dor, mi luz, [C]mi salva[D]ción`,

  "Despierta, Alma Mía": `[Estrofa 1]
Despierta [G]alma [C]mía, despier[G]ta a can[D]tar
A[G]laba al Se[C]ñor con [G]gran e[D]mo[G]ción
No que[G]des dor[C]mida en [G]la oscuri[D]dad
A[G]laba a Je[C]sús por [G]su [D]majes[G]tad

[Coro]
¡Alelu[C]ya, [G]gloria a [D]Dios!
Nuestra [G]alma a[C]laba [G]al Se[D]ñor
Despier[C]ta y [G]canta al [D]Salva[Em]dor
¡Alelu[C]ya, a [D]nuestro [G]Rey!

[Estrofa 2]
Despierta [G]alma [C]mía, y [G]busca al Se[D]ñor
Él [G]es tu re[C]fugio y [G]tu Sal[D]va[G]dor
Can[G]temos con [C]gozo en [G]su presen[D]cia
A[G]hora y por [C]siempre su [G]gran e[D]xcelen[G]cia`,

  "Gracias": `[Estrofa 1]
Me has to[G]mado en tus bra[D]zos
Y me has [Em]dado salva[Bm]ción
De tu a[C]mor has de[G/B]rramado
En mi [Am]cora[D]zón

[Estrofa 2]
No sa[G]bré agrade[D]certe
Lo que has [Em]hecho por [Bm]mí
Sólo [C]puedo dar[G/B]te ahora
Mi can[Am]ción [D]

[Coro]
[G]Gra[D/F#]cias,
[Em]Gracias, Se[Bm]ñor
[C]Gracias mi Se[G/B]ñor Je[Am]sús[D]
[G]Gra[D/F#]cias,
[Em]Muchas gracias, Se[Bm]ñor
[C]Gracias mi Se[G/B]ñor Je[Am]sús[D] [G]`,

  "La Casa de Dios": `[Estrofa 1]
Me[G]jor es un día en la ca[D]sa de Dios
Que [Em]mil años le[C]jos de Él
Pre[G]fiero un rincón en la ca[D]sa de Dios
Que [Em]todo el pa[C]lacio de un rey
Que [G]todo el pa[D]lacio de un [G]rey

[Coro]
Ven conmi[G]go a la [D]casa de Dios
Cele[Em]braremos jun[C]tos su amor
Hare[G]mos fies[D]ta en honor de aquel que [C]nos a[D]mó
Estando a[G]quí en la [D]casa de Dios
Alegra[Em]remos su [C]corazón
Le brinda[G]remos o[D]frendas de obedi[C]encia y [D]amor
¡En la ca[C]sa [D]de [G]Dios!`,

  "Al que es Digno": `[Estrofa]
Al que [G]es digno de reci[C]bir la [D]gloria
Al que [G]es digno de reci[C]bir el ho[D]nor
Al que [G]es digno de reci[C]bir la [D]gloria
Al que [G]es digno de reci[C]bir el ho[D]nor

[Coro]
Levante[C]mos nues[D]tras [Em]manos y ado[C]re[D]mos a Je[Em]sús
Corde[C]ro de [D]gloria [G]exa[D/F#]lte[Em]mos su [Am]incompara[D]ble majes[G]tad
Al que [C]vive [D]por [Em]siempre al gran [C]Yo [D]Soy [Em]
A Je[C]sús [D] [G]
A Je[C]sús [D] [G]`
};

async function completeBatch3() {
  console.log('Completando letras de la Fase 3...');
  let successCount = 0;
  for (const [title, fullLyrics] of Object.entries(batch3Songs)) {
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
  console.log(`\nFase 3 terminada. ${successCount} canciones actualizadas.`);
}

completeBatch3();
