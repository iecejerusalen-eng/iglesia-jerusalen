import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../config/supabase';
import { BrainCircuit, Clock3, Gamepad2, Play, RefreshCw, Sparkles, Target, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Helmet } from 'react-helmet-async';

interface Game {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  slug: string;
  is_active: boolean;
}

interface GameMeta {
  duration: string;
  level: string;
  mode: string;
  accent: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=82&w=1200';

const GAME_META: Record<string, GameMeta> = {
  'descubre-el-personaje': { duration: '8–12 min', level: 'Todos', mode: 'Pistas', accent: 'from-violet-500/80 to-indigo-700/90' },
  'memorama-biblico': { duration: '5–10 min', level: 'Fácil', mode: 'Memoria', accent: 'from-emerald-500/80 to-teal-700/90' },
  'ahorcado-biblico': { duration: '8–15 min', level: 'Intermedio', mode: 'Palabras', accent: 'from-amber-500/80 to-orange-700/90' },
  'quien-quiere-ser-biblionario': { duration: '15–25 min', level: 'Progresivo', mode: 'Preguntas', accent: 'from-sky-500/80 to-blue-800/90' },
};

const DEFAULT_META: GameMeta = { duration: '10 min', level: 'Todos', mode: 'Conocimiento', accent: 'from-slate-500/80 to-slate-900/90' };

export const GamesHub = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const { data, error } = await supabase
      .from('games')
      .select('id,title,description,image_url,slug,is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('No se pudo cargar el catálogo de juegos:', error);
      setErrorMessage('No pudimos cargar los juegos en este momento. Revisa tu conexión e inténtalo nuevamente.');
      setGames([]);
    } else {
      setGames((data ?? []) as Game[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchGames(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchGames]);

  const learningModes = useMemo(() => new Set(games.map((game) => (GAME_META[game.slug] ?? DEFAULT_META).mode)).size, [games]);

  return (
    <>
      <Helmet>
        <title>Juegos Bíblicos | Iglesia Jerusalén</title>
        <meta name="description" content="Aprende la Palabra de Dios con preguntas, memoria, pistas y desafíos bíblicos interactivos." />
      </Helmet>

      <main className="relative min-h-[80vh] overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 px-4 pb-20 pt-24 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 sm:px-6">
        <div className="pointer-events-none absolute -left-36 top-20 size-80 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-[34rem] size-80 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <motion.section id="games_hero" initial="initial" animate="animate" variants={fadeInUp} className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 px-5 py-10 text-center shadow-[0_24px_80px_-44px_rgba(15,23,42,.48)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65 sm:px-10 sm:py-14">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><Gamepad2 size={27} /></div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">Aprende jugando</p>
            <h1 className="mx-auto mt-2 max-w-3xl text-balance font-serif text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">Desafíos bíblicos para cada generación</h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600 dark:text-slate-300">Pon a prueba tu memoria, descubre personajes y recorre la Biblia mediante experiencias breves, claras y entretenidas.</p>
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
              <Stat icon={Gamepad2} value={String(games.length)} label="juegos activos" />
              <Stat icon={BrainCircuit} value={String(learningModes)} label="formas de aprender" />
              <Stat icon={Users} value="Familia" label="individual o en grupo" />
            </div>
          </motion.section>

          <section id="games_grid" className="scroll-mt-28 pt-12">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Elige tu desafío</p><h2 className="mt-1 font-serif text-3xl font-bold text-slate-950 dark:text-white">Biblioteca de juegos</h2></div><p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Cada partida combina conocimiento bíblico, retroalimentación inmediata y progresión.</p></div>

            {loading ? <GamesSkeleton /> : errorMessage ? <div className="rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center dark:border-red-400/20 dark:bg-red-400/10"><Target className="mx-auto text-red-500" /><p className="mt-3 text-sm font-bold text-red-800 dark:text-red-200">{errorMessage}</p><button type="button" onClick={() => void fetchGames()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-black text-white dark:bg-white dark:text-slate-950"><RefreshCw size={14} /> Reintentar</button></div> : games.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-white/15"><Sparkles className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">No hay juegos activos publicados todavía.</p></div> : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-5 md:grid-cols-2">
                {games.map((game) => <GameCard key={game.id} game={game} />)}
              </motion.div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

function Stat({ icon: Icon, value, label }: { icon: typeof Gamepad2; value: string; label: string }) {
  return <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white/65 px-4 py-3 text-left dark:border-white/10 dark:bg-white/5"><Icon size={17} className="text-indigo-500" /><span><strong className="block text-sm text-slate-900 dark:text-white">{value}</strong><span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span></span></div>;
}

function GameCard({ game }: { game: Game }) {
  const meta = GAME_META[game.slug] ?? DEFAULT_META;
  return (
    <motion.article variants={fadeInUp} className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 shadow-[0_18px_60px_-36px_rgba(15,23,42,.46)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/70">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-900"><img src={game.image_url || FALLBACK_IMAGE} alt={`Portada de ${game.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} /><div className={`absolute inset-0 bg-gradient-to-t ${meta.accent} mix-blend-multiply opacity-70`} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" /><div className="absolute bottom-4 left-4 right-4"><span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">{meta.mode}</span><h3 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">{game.title}</h3></div></div>
      <div className="p-5 sm:p-6"><p className="min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">{game.description}</p><div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/5"><Clock3 size={13} />{meta.duration}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/5"><Trophy size={13} />{meta.level}</span></div><Link to={`/recursos/juegos/${game.slug}`} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-400"><Play size={15} className="fill-current" /> Comenzar partida</Link></div>
    </motion.article>
  );
}

function GamesSkeleton() {
  return <div className="grid gap-5 md:grid-cols-2" aria-label="Cargando juegos">{[0, 1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/5"><div className="aspect-[16/9] animate-pulse bg-slate-200 dark:bg-slate-800" /><div className="space-y-3 p-6"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /><div className="h-11 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" /></div></div>)}</div>;
}
