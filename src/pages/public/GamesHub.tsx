import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { BrainCircuit, BookOpen, Gamepad2, Lightbulb, Play, RefreshCw, Sparkles, Target } from 'lucide-react';
import { supabase } from '../../config/supabase';

interface Game {
  id: string;
  slug: string;
}

interface GameMeta {
  title: string;
  activity: string;
  skill: string;
  description: string;
  route: string;
  cover: string;
}

const GAME_META: Record<string, GameMeta> = {
  'descubre-el-personaje': { title: 'Descubre el Personaje', activity: 'Pistas progresivas', skill: 'Deducción bíblica', description: 'Deduce quién es el personaje con cuatro pistas; cada pista extra y cada error reducen los puntos.', route: '/recursos/juegos/descubre-el-personaje', cover: '/images/games/covers/personaje.webp' },
  'memorama-biblico': { title: 'Memorama Bíblico', activity: 'Parejas con explicación', skill: 'Memoria y aprendizaje', description: 'Relaciona historias y personajes bíblicos con imágenes, explicación y referencia.', route: '/recursos/juegos/memorama-biblico', cover: '/images/games/covers/memorama.webp' },
  'ahorcado-biblico': { title: 'Adivina la palabra', activity: 'Letras por descubrir', skill: 'Vocabulario bíblico', description: 'Elige o escribe letras para descubrir palabras bíblicas. Cada error resta una oportunidad y al acertar conocerás el pasaje.', route: '/recursos/juegos/reto-de-letras-biblicas', cover: '/images/games/covers/reto-letras.webp' },
  'quien-quiere-ser-biblionario': { title: 'Quién quiere ser Biblionario', activity: 'Preguntas por niveles', skill: 'Conocimiento bíblico', description: 'Responde preguntas en quince niveles clásicos o prueba cuánto resistes en el modo de supervivencia.', route: '/recursos/juegos/quien-quiere-ser-biblionario', cover: '/images/games/covers/biblionario.webp' },
};

const GAME_ORDER = Object.keys(GAME_META);

export const GamesHub = () => {
  const reduceMotion = useReducedMotion();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id,slug,is_active')
        .eq('is_active', true);
      if (error) throw error;
      const supported = (data ?? []).filter((game) => Object.hasOwn(GAME_META, game.slug));
      const uniqueBySlug = new Map<string, Game>();
      supported.forEach((game) => {
        if (!uniqueBySlug.has(game.slug)) uniqueBySlug.set(game.slug, game as Game);
      });
      setGames([...uniqueBySlug.values()].sort((first, second) => GAME_ORDER.indexOf(first.slug) - GAME_ORDER.indexOf(second.slug)));
    } catch (error) {
      console.error('No se pudo cargar el catálogo de juegos:', error);
      setErrorMessage('No pudimos cargar el catálogo de juegos. Revisa tu conexión e inténtalo nuevamente.');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchGames(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchGames]);

  const learningModes = useMemo(() => new Set(games.map((game) => GAME_META[game.slug].skill)).size, [games]);

  return <>
    <Helmet>
      <title>Juegos Bíblicos | Iglesia Jerusalén</title>
      <meta name="description" content="Aprende la Biblia mediante preguntas, parejas, pistas y desafíos para toda la familia." />
    </Helmet>
    <main className="relative min-h-[80vh] overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 px-4 pb-20 pt-24 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 top-20 size-80 rounded-full bg-indigo-400/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-[34rem] size-80 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/70 bg-white/75 px-5 py-10 text-center shadow-[0_24px_80px_-44px_rgba(15,23,42,.48)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70 sm:px-10 sm:py-14">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-950 text-amber-300 shadow-lg"><Gamepad2 size={27} /></div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">Aprender juntos</p>
          <h1 className="mx-auto mt-2 max-w-3xl font-serif text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">Juegos para descubrir la Biblia</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Elige una actividad, aprende a tu ritmo y vuelve a las historias y referencias que forman cada desafío.</p>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat icon={Gamepad2} value={String(games.length)} label="juegos disponibles" />
            <Stat icon={BrainCircuit} value={String(learningModes)} label="formas de aprender" />
            <Stat icon={BookOpen} value="Biblia" label="contenido y referencias" />
          </div>
        </section>

        <section className="scroll-mt-28 pt-12" aria-labelledby="games-title">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Escoge una actividad</p><h2 id="games-title" className="mt-1 font-serif text-3xl font-bold text-slate-950 dark:text-white">Biblioteca de juegos</h2></div>
            <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Cada juego explica su dinámica y ofrece una forma distinta de repasar el contenido bíblico.</p>
          </div>

          {loading ? <GamesSkeleton /> : errorMessage ? (
            <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center dark:border-rose-400/20 dark:bg-rose-400/10">
              <Target className="mx-auto text-rose-600 dark:text-rose-300" /><p className="mt-3 text-sm font-bold text-rose-900 dark:text-rose-100">{errorMessage}</p>
              <button type="button" onClick={() => void fetchGames()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-950 px-5 text-xs font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:bg-amber-400 dark:text-slate-950"><RefreshCw size={14} /> Reintentar</button>
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-white/15"><Sparkles className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No hay juegos activos publicados todavía.</p><p className="mt-2 text-xs text-slate-500">Vuelve más tarde para consultar las actividades disponibles.</p></div>
          ) : (
            <motion.div initial={reduceMotion ? false : 'initial'} animate="animate" variants={{ initial: {}, animate: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }} className="grid gap-5 md:grid-cols-2">
              {games.map((game) => <GameCard key={game.id} game={game} reduceMotion={Boolean(reduceMotion)} />)}
            </motion.div>
          )}
        </section>
      </div>
    </main>
  </>;
};

function Stat({ icon: Icon, value, label }: { icon: typeof Gamepad2; value: string; label: string }) {
  return <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white/65 px-4 py-3 text-left dark:border-white/10 dark:bg-white/5"><Icon size={17} className="text-blue-800 dark:text-amber-300" /><span><strong className="block text-sm text-slate-900 dark:text-white">{value}</strong><span className="text-[11px] text-slate-600 dark:text-slate-400">{label}</span></span></div>;
}

function GameCard({ game, reduceMotion }: { game: Game; reduceMotion: boolean }) {
  const meta = GAME_META[game.slug];
  const title = meta.title;
  return <motion.article variants={{ initial: { opacity: 0, y: reduceMotion ? 0 : 12 }, animate: { opacity: 1, y: 0 } }} transition={{ duration: reduceMotion ? 0 : 0.3 }} className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 shadow-[0_18px_60px_-36px_rgba(15,23,42,.46)] backdrop-blur-xl transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-slate-900/75">
    <div className="relative aspect-[16/9] overflow-hidden bg-blue-950">
      <img src={meta.cover} alt={`Escena bíblica para ${title}`} width="1440" height="810" sizes="(max-width: 767px) 100vw, 50vw" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-blue-950/15 via-transparent to-blue-950/10" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-slate-950/0" />
      <div className="absolute bottom-4 left-4 right-4"><span className="rounded-full border border-white/15 bg-slate-950/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">{meta.activity}</span><h3 className="mt-3 break-words font-serif text-2xl font-bold text-white sm:text-3xl">{title}</h3></div>
    </div>
    <div className="p-5 sm:p-6">
      <p className="min-h-12 text-sm leading-6 text-slate-700 dark:text-slate-300">{meta.description}</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:bg-white/5 dark:text-slate-300"><Lightbulb size={13} className="text-amber-600 dark:text-amber-300" />{meta.skill}</div>
      <Link to={meta.route} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 text-xs font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"><Play size={15} fill="currentColor" /> Ver instrucciones y jugar</Link>
    </div>
  </motion.article>;
}

function GamesSkeleton() {
  return <div className="grid gap-5 md:grid-cols-2" aria-label="Cargando juegos" aria-busy="true" role="status">{[0, 1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/5"><div className="aspect-[16/9] animate-pulse motion-reduce:animate-none bg-slate-200 dark:bg-slate-800" /><div className="space-y-3 p-6"><div className="h-4 w-2/3 animate-pulse motion-reduce:animate-none rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 animate-pulse motion-reduce:animate-none rounded bg-slate-100 dark:bg-slate-800" /><div className="h-11 animate-pulse motion-reduce:animate-none rounded-xl bg-slate-200 dark:bg-slate-700" /></div></div>)}</div>;
}
