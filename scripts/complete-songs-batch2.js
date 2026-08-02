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

const batch2Songs = {
  "Oh, Cabeza Ensangrentada": `[Estrofa 1]
Oh, ca[Am]beza ensangren[E]tada, herida por [Am]mi mal
De e[C]spinas coro[G]nada, en [F]burla [E]despiada[Am]
[F]Oh, ros[C]tro tan sub[G]lime, que he[Am]riste con [E]dolor
Aun[Am]que el mundo te de[E]sestime, te a[F]doro, mi [E]Señor[Am]

[Estrofa 2]
Cúbre[Am]me, gracia in[E]mensa, que ofreces [Am]sin igual
Haz [C]fuerte mi de[G]fensa, lí[F]brame [E]del [Am]mal
[F]Tú que e[C]res mi res[G]piro, mi [Am]único re[E]fugio
Oh [Am]Cristo, en ti yo [E]miro el [F]más puro [E]amor[Am]`,

  "Oh, Profunda Riqueza": `[Estrofa 1]
¡Oh, pro[G]funda ri[C]queza, de la [D]gracia de [G]Dios!
Inson[Em]dable es su [C]ciencia, sin i[Am]gual es su [D]amor
¿Quién po[G]drá com[C]prender los juicios [D]del Se[Em]ñor?
Y sus [C]caminos [G]siempre [D]son de per[G]fección

[Coro]
A [C]Él sea la [G]gloria, [D]a Él sea el [Em]honor
Por[C]que de Él y [G]por Él es la [Am]crea[D]ción
A [C]Él sea la [G]gloria, [D]a Él sea el [Em]honor
A[C]mén, Alelu[G]ya, a[D]mén y a[G]mén`,

  "Canta al Señor": `[Estrofa 1]
Mi [A]Cristo, [E]mi Rey
[F#m]Nadie es [E]como [D]Tú
Toda mi [A]vida [D]quiero exal[A]tar
Las [F#m]maravi[G]llas de [D]tu a[E]mor

[Estrofa 2]
Con[A]suelo, [E]refugio
[F#m]Torre de [E]fuerza y po[D]der
Todo mi [A]ser, [D]lo que yo [A]soy
[F#m]Nunca ce[G]se de a[D]dora[E]r

[Coro]
[A]Canta al Se[F#m]ñor toda la [D]crea[E]ción
[A]Honra y po[F#m]der, majestad [D]sea al [E]Rey
[F#m]Montes caerán y el [E]mar rugirá
Al so[D]nar de tu [E]nombre
[A]Canto con [F#m]gozo al mi[D]rar tu po[E]der
[A]Por siempre yo [F#m]te ama[D]ré y di[E]ré
[F#m]Incompara[E]bles prome[D]sas me [E]diste Se[A]ñor`,

  "El Amor de mi Vida": `[Estrofa]
Tú [G]eres el amor de mi [C]vida, Señor
Tú e[Em]res la luz que [D]alumbra mi andar
No [G]hay nadie más co[C]mo Tú
Yo te e[Em]xalto a [D]Ti

[Coro]
Jesús, mi [C]salva[G]dor, Jesús, mi [D]reden[Em]tor
Eres el [C]centro de [G]mi cora[D]zón
En ti en[C]cuentro la [G]paz, en ti en[D]cuentro el a[Em]mor
Tú eres el [C]amor de [D]mi vi[G]da`,

  "Majestad": `[Coro]
Ma[G]jes[C]tad, ado[G]rad a su majes[Em]tad
A Je[G]sús [Em]sea la gloria, [Am]honra y [D]poder
Ma[G]jes[C]tad, reino [G]y auto[Em]ridad
Desde su [G]trono, fluye el [D]río de vi[G]da

[Estrofa 1]
Exal[D]tad, levantad el [G]nombre de Cristo
Magnifi[D]cad, glorificad al [G]Rey salva[D]dor
Ma[G]jes[C]tad, ado[G]rad a su majes[Em]tad
Jesús quien mu[G]rió, glori[D]ficado [G]es`,

  "Hay Poder en la Sangre": `[Estrofa 1]
¿Quieres ser [G]salvo de toda maldad?
Tan solo hay po[C]der en mi Je[G]sús
¿Quieres vi[G]vir y gozar santi[Em]dad?
Tan solo hay po[D]der en Je[G]sús

[Coro]
Hay po[G]der, poder, sin igual po[C]der
En Je[G]sús, que mu[D]rió
Hay po[G]der, poder, sin igual po[C]der
En la [G]sangre [D]que Él ver[G]tió

[Estrofa 2]
¿Quieres ser [G]libre de orgullo y pasión?
Tan solo hay po[C]der en mi Je[G]sús
¿Quieres ven[G]cer toda cruel tenta[Em]ción?
Tan solo hay po[D]der en Je[G]sús

[Estrofa 3]
¿Quieres ser[G]vir a tu Rey y Señor?
Tan solo hay po[C]der en mi Je[G]sús
Ven y ser [G]salvo por su inmenso a[Em]mor
Tan solo hay po[D]der en Je[G]sús`,

  "Roca de la Eternidad": `[Estrofa 1]
[C]Roca de la e[F]terni[C]dad
Fuiste a[F]bierta para [C]mí
Sé mi [C]escondede[G]ro [C]fiel
Solo en[C]cuentro paz en [G]Ti
[C]Rico y [F]limpio manan[C]tial
En el [F]cual la[G]vado [C]fui

[Estrofa 2]
[C]Aunque fuese [F]siempre [C]fiel
Aunque [F]llore sin ce[C]sar
Del pe[C]cado no po[G]dré[C]
Justifi[C]cación lo[G]grar
[C]Solo en [F]Ti teniendo [C]fe
Deuda [F]tal po[G]dré pa[C]gar

[Estrofa 3]
[C]Mientras tenga [F]que vi[C]vir
Y al ins[F]tante de expi[C]rar
Cuando [C]vaya a res[G]pon[C]der
En tu au[C]gusto tribu[G]nal
[C]Roca [F]de la eterni[C]dad
Fuiste a[F]bierta [G]para [C]mí`,

  "Canta, Oh Buen Cristiano": `[Estrofa 1]
[G]Canta, oh [C]buen cris[G]tiano,
[D]Dulce será can[G]tar;
[G]Hace el ca[C]mino [G]llano,
[D]Libra del pesa[G]r;
[D]Canta en las noches [G]tristes,
[D]Canta en el sol y [G]en [D]la [G]luz;
[G]El mal a[C]sí resis[G]tes,
[D]Canta de tu Je[G]sús.

[Estrofa 2]
[G]Canta con [C]toda el [G]alma,
[D]Canta de co[G]razón;
[G]Trae tu [C]canto la [G]calma,
[D]Llena de bendi[G]ción;
[D]Canta a los que es[G]tán tristes,
[D]Y halla[G]rán el cons[D]ue[G]lo;
[G]Diles que a [C]Cristo vis[G]tes,
[D]Diles que hay luz en el [G]cielo.`,

  "Grato es Contar la Historia": `[Estrofa 1]
Grato [G]es contar la historia 
Del celes[C]tial fa[G]vor,
De Cristo y de [Em]su gloria, 
De Cristo y de [A]su a[D]mor.
Me a[G]grada referirla, 
Pues sé que es [C]la ver[G]dad;
Y na[C]da sa[G]tisface 
[D]Cual ella mi an[G]siedad.

[Coro]
¡Cuán [D]bella es esa [G]historia! 
Mi [C]tema allá en la [G]gloria
Se[G]rá ensal[Em]zar la historia 
[C]De Cristo y de [D]su a[G]mor.

[Estrofa 2]
Grato [G]es contar la historia 
Más bella [C]que el fu[G]lgor,
Que el oro y [Em]las riquezas, 
Más dulce y con [A]más va[D]lor.
Me a[G]grada referirla, 
Pues sé que me [C]hizo [G]bien;
Por e[C]so, a ti, [G]te anhelo 
[D]Oírla a ti tam[G]bién.`,

  "Firme y Adelante": `[Estrofa 1]
[C]Firme y ade[G]lan[C]te, huestes de la fe,
Sin temor [G]algu[C]no, que Jesús nos ve.
[G]Jefe sobe[C]rano, [D]Cristo al frente [G]va,
Y la regia en[C]se[F]ña tremo[G]lando es[C]tá.

[Coro]
[C]Firme y ade[G]lan[C]te, huestes de la fe,
[F]Sin temor [C]algu[G]no, [C]que Jesús nos [G]ve. [C]

[Estrofa 2]
[C]Al sagrado [G]nom[C]bre de nuestro Adalid,
Tiembla el [G]enemi[C]go y huye de la lid.
[G]Nuestra es la [C]victo[D]ria, dad a Dios lo[G]or;
Y óigalo el [C]aver[F]no lleno [G]de te[C]rror.`,

  "Ved al Cristo en la Cruz": `[Estrofa 1]
[G]Ved al Cristo en la [C]cruz, el Hijo [G]de Dios
Que sufriendo está por nues[A]tro peca[D]do
Es a[G]mor tan inmen[C]so que dio su fa[G]vor
Para darnos per[D]dón en su [G]sangre

[Coro]
Alelu[C]ya, ¡cuán grande a[G]mor!
Alelu[Em]ya, su sangre ver[D]tió
El mu[G]rió en la cruz y la [C]vida nos dio
Alelu[G]ya, a[D]laba a [G]Dios

[Estrofa 2]
[G]De su lado vertió, por el [C]mundo per[G]dido
Sangre y agua purifi[A]cando el [D]alma
Y nos [G]da redención con un [C]solo de[G]seo
Darle al hombre la [D]paz inmor[G]tal`,

  "Qué Gran Salvador es Jesús": `[Estrofa 1]
Qué [G]gran Salvador es Je[C]sús mi Se[G]ñor,
¡Qué [G]gran Salva[Em]dor para [A]mí! [D]
Me [G]guarda en la roca do [C]siempre es[G]toy
Cubier[G]to de a[D]mor e[G]terno,
Cu[C]bierto [G]de amor [D]eter[G]no.

[Estrofa 2]
Con [G]tierno amor a su [C]Hijo o[G]freció,
Un [G]gran Salva[Em]dor para [A]mí; [D]
Con [G]sangre la deuda de [C]mi alma pa[G]gó,
A[G]hora soy [D]libre al [G]fin,
A[C]hora [G]soy libre [D]al [G]fin.

[Coro]
Ocul[D]to en la roca que el [G]mundo no ve,
Me [C]guarda en per[G]fecto a[D]mor;
O[G]culto en su [C]mano se[G]guro yo [Em]voy,
Ya [C]nada a mi [G]alma da [D]terror,
Ya [C]nada a mi [G]alma da [D]te[G]rror.`,

  "Sentado en su Trono": `[Estrofa 1]
Sen[G]tado en su [D/F#]trono, ro[Em]deado de luz[C]
A la [G]diestra del [D]Padre, go[Em]bierna Je[C]sús
Con [G]ojos de [D/F#]fuego, con [Em]rostro de sol[C]
Cuando a[G]bre su [D]boca, es [Em]trueno su [C]voz

[Coro]
Pode[G]roso en [D]majestad y [Em]reino,
Pode[C]roso [G]Poderoso en po[D]testad e im[Em]perio,
Pode[C]roso

[Estrofa 2]
Un [G]gran arco[D/F#]íris, co[Em]rona su ser[C]
Él [G]es el Prin[D]cipio, Él [Em]es el a[C]mén
A[G]laba tu [D/F#]nombre, la [Em]gran multi[C]tud
De án[G]geles que can[D]tan al [Em]Rey de la luz[C]`,

  "Hermoso Eres": `[Estrofa]
En mi [G]corazón hay una [D]canción
Que demues[Em]tra mi pa[C]sión
Para mi [G]Rey y mi Se[D]ñor
Para [C]aquel que [D]me a[G]mó

[Coro]
Hermoso [G]eres, [D]mi Señor
Hermoso [Em]eres [C]Tú, amado [G]mío
Tú e[D]res la fuente de [C]mi [D]vida
Y el an[G]helo de [D]mi cora[Em]zón[C]
Y el an[G]helo de [D]mi cora[C]zón`,

  "Revelación": `[Estrofa 1]
[D]Digno es el [Am]Cordero [C]Santo,
[D]Santo es [Am]Él [C]
[D]Cantamos [Am]una nueva can[C]ción,
[D]Al que se sient[Am]a en el trono de l[C]uz.

[Coro]
S[G]anto, santo, s[D]anto
Dios Todopod[Em]eroso
Qui[C]en fue, quien es y qui[D]en vendrá
T[G]oda la crea[D]ción te canta l[Em]oores a Ti
E[C]res mi todo y [D]yo te a[G]doraré

[Estrofa 2]
[D]Llena es[Am]tá la ti[C]erra,
[D]De su [Am]gloria y po[C]der
[D]De un m[Am]ar de cristal con luz y colo[C]res
[D]Al rey su[Am]premo aso[C]mbra

[Puente]
Toda aso[Am]mbro y marav[G/B]illa,
Toda h[C]onra y poder y p[D]erfecta adorac[G]ión
Sea al c[Am]ordero [G/B]santo,
Sea al R[C]ey en el tr[D]ono de luz.`
};

async function completeBatch2() {
  console.log('Completando letras de la Fase 2...');
  let successCount = 0;
  for (const [title, fullLyrics] of Object.entries(batch2Songs)) {
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
  console.log(`\nFase 2 terminada. ${successCount} canciones actualizadas.`);
}

completeBatch2();
