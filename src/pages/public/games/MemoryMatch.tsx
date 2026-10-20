import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  ArrowLeft, BookOpen, BookOpenCheck, Check, Clock3, Compass, Crown, Hand, Play,
  RefreshCw, RotateCcw, Sparkles, Target, Timer, Trophy, Users, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import BibleVersePreview from '../../../components/ui/BibleVersePreview';
import { useAuthStore } from '../../../store/useAuthStore';
import { drawContent } from '../../../features/games/utils/contentDeck';
import { useGameKeyboardShortcuts } from '../../../features/games/hooks/useGameKeyboardShortcuts';
import { GameKeyboardHint } from '../../../features/games/components/GameKeyboardHint';
import {
  awardFamilyPoint, buildMemoryCards, calculateMemoryScore, DIFFICULTY_CONFIG, isMemoryMatch, nextMemoryPlayer, prepareMemoryPairs,
  type MemoryCard, type MemoryDifficulty, type MemoryMode, type MemoryPair, type RawMemoryPair,
} from './memoryMatchLogic';

interface LeaderboardEntry {
  id: string;
  score: number;
  time_seconds: number;
  moves: number;
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
}

type GameState = 'menu' | 'loading' | 'playing' | 'won' | 'leaderboard';

const PLAYER_NAMES = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'];

const MEMORY_SCENES: Record<string, readonly [string, string]> = {
  'arca de noe': ['arca', 'noe'],
  'tablas de la ley': ['tablas', 'moises'],
  'paloma (espiritu santo)': ['paloma', 'bautismo'],
  'estrella de belen': ['estrella', 'sabios'],
  'cruz de jesus': ['cruz', 'tumba'],
  'corona de espinas': ['corona', 'soldados'],
  'leon de juda': ['leon', 'sello-leon'],
  'pez (ichthys)': ['panes-peces', 'multiplicacion'],
};

const STORY_PREVIEWS = [
  { image: '/images/games/memory/arca.jpg?v=20261019', title: 'El arca de Noé' },
  { image: '/images/games/memory/moises.jpg?v=20261019', title: 'Moisés y las tablas' },
  { image: '/images/games/memory/estrella.jpg?v=20261019', title: 'La estrella de Belén' },
];

function normalizeStoryName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

function getMemoryScene(card: Pick<MemoryCard, 'pair_name' | 'side'>): string | null {
  const scenePair = MEMORY_SCENES[normalizeStoryName(card.pair_name)];
  return scenePair ? scenePair[card.side === 'a' ? 0 : 1] : null;
}

function getCardImage(card: Pick<MemoryCard, 'pair_name' | 'image_url' | 'match_image_url' | 'side'>): string | null {
  const suppliedImage = card.side === 'a' ? card.image_url : card.match_image_url;
  if (suppliedImage && /^(https?:\/\/|\/|data:image\/)/i.test(suppliedImage)) return suppliedImage;
  const scene = getMemoryScene(card);
  if (scene) return `/images/games/memory/${scene}.jpg?v=20261019`;
  return null;
}

export const MemoryMatch = () => {
  const { user } = useAuthStore();
  const reduceMotion = useReducedMotion();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('easy');
  const [mode, setMode] = useState<MemoryMode>('solo');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(PLAYER_NAMES);
  const [activePlayer, setActivePlayer] = useState(0);
  const [playerScores, setPlayerScores] = useState<number[]>([0, 0]);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [learnedPairs, setLearnedPairs] = useState<MemoryPair[]>([]);
  const [currentLesson, setCurrentLesson] = useState<MemoryPair | null>(null);
  const [learningChoice, setLearningChoice] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const mismatchTimer = useRef<number | null>(null);
  const pairCount = DIFFICULTY_CONFIG[difficulty].pairs;
  const finalScore = useMemo(
    () => calculateMemoryScore(elapsedSeconds, moves, pairCount),
    [elapsedSeconds, moves, pairCount],
  );
  const safePlayerNames = useMemo(
    () => playerNames.slice(0, playerCount).map((name, index) => name.trim().slice(0, 24) || PLAYER_NAMES[index]),
    [playerCount, playerNames],
  );

  useEffect(() => {
    if (gameState !== 'playing' || startedAt === null) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameState, startedAt]);

  useEffect(() => () => {
    if (mismatchTimer.current !== null) window.clearTimeout(mismatchTimer.current);
  }, []);

  const startGame = useCallback(async () => {
    setGameState('loading');
    setLoadError(null);
    setCurrentLesson(null);
    setIsLocked(false);
    if (mismatchTimer.current !== null) window.clearTimeout(mismatchTimer.current);

    try {
      const { data, error } = await supabase
        .from('game_memory_cards')
        .select('id,pair_name,image_url,match_image_url,card_label,match_label,match_text,explanation,bible_reference,difficulty,learning_question,learning_options,learning_answer')
        .eq('is_active', true);
      if (error) throw error;

      const pairs = prepareMemoryPairs((data ?? []) as RawMemoryPair[]);
      const eligible = pairs.filter((pair) => difficulty === 'easy'
        ? pair.difficulty === 'easy'
        : difficulty === 'medium' ? pair.difficulty !== 'hard' : true);
      const selectedPairs = drawContent(eligible, `memory:${difficulty}`, pairCount, (pair) => pair.id);
      const nextCards = buildMemoryCards(pairs, difficulty, Math.random, selectedPairs.map((pair) => pair.id));
      if (nextCards.length === 0) {
        const available = pairs.filter((pair) => {
          if (difficulty === 'easy') return pair.difficulty === 'easy';
          if (difficulty === 'medium') return pair.difficulty !== 'hard';
          return true;
        }).length;
        throw new Error(
          available < pairCount
            ? `Este nivel necesita ${pairCount} parejas publicadas y completas; por ahora hay ${available}.`
            : 'No encontramos parejas distintas para este nivel. Revisa el contenido publicado.',
        );
      }

      setCards(nextCards);
      setFlippedIds([]);
      setMatchedCount(0);
      setLearnedPairs([]);
      setLearningChoice(null);
      setMoves(0);
      setElapsedSeconds(0);
      setActivePlayer(0);
      setPlayerScores(Array.from({ length: mode === 'family' ? playerCount : 1 }, () => 0));
      setStartedAt(Date.now());
      setGameState('playing');
    } catch (error) {
      console.error('No se pudo iniciar el Memorama Bíblico.', error);
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar el contenido. Intenta nuevamente.');
      setGameState('menu');
    }
  }, [difficulty, mode, pairCount, playerCount]);

  const finishGame = useCallback(async () => {
    setElapsedSeconds(startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000));
    setGameState('won');
    setCurrentLesson(null);
    if (mode !== 'solo' || !user) return;

    const score = calculateMemoryScore(
      startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000),
      moves,
      pairCount,
    );
    try {
      const { error } = await supabase.from('game_memory_scores').insert([{
        profile_id: user.id,
        score,
        time_seconds: startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000),
        moves,
      }]);
      if (error) throw error;
    } catch (error) {
      console.error('No se pudo guardar el puntaje del Memorama Bíblico.', error);
      toast.error('La partida terminó, pero no pudimos guardar el puntaje.');
    }
  }, [mode, moves, pairCount, startedAt, user]);

  const handleCardClick = useCallback((uniqueId: string) => {
    if (gameState !== 'playing' || isLocked || currentLesson || flippedIds.length >= 2) return;
    const selected = cards.find((card) => card.uniqueId === uniqueId);
    if (!selected || selected.isMatched || selected.isFlipped) return;

    const nextCards = cards.map((card) => card.uniqueId === uniqueId ? { ...card, isFlipped: true } : card);
    setCards(nextCards);
    const nextFlipped = [...flippedIds, uniqueId];
    setFlippedIds(nextFlipped);
    if (nextFlipped.length < 2) return;

    setMoves((value) => value + 1);
    const [firstId, secondId] = nextFlipped;
    const firstCard = nextCards.find((card) => card.uniqueId === firstId);
    const secondCard = nextCards.find((card) => card.uniqueId === secondId);
    if (!firstCard || !secondCard) return;

    if (isMemoryMatch(firstCard, secondCard)) {
      setCards(nextCards.map((card) => card.id === firstCard.id ? { ...card, isFlipped: true, isMatched: true } : card));
      setFlippedIds([]);
      setMatchedCount((value) => value + 1);
      setLearnedPairs((current) => current.some((pair) => pair.id === firstCard.id) ? current : [...current, firstCard]);
      if (mode === 'family') setPlayerScores((current) => awardFamilyPoint(current, activePlayer));
      if (mode === 'family') setActivePlayer((current) => nextMemoryPlayer(current, playerCount, true));
      setCurrentLesson(firstCard);
      setLearningChoice(null);
      return;
    }

    setIsLocked(true);
    mismatchTimer.current = window.setTimeout(() => {
      setCards((current) => current.map((card) => (
        card.uniqueId === firstId || card.uniqueId === secondId ? { ...card, isFlipped: false } : card
      )));
      setFlippedIds([]);
      setIsLocked(false);
      if (mode === 'family') setActivePlayer((current) => nextMemoryPlayer(current, playerCount, false));
      mismatchTimer.current = null;
    }, reduceMotion ? 0 : 900);
  }, [activePlayer, cards, currentLesson, flippedIds, gameState, isLocked, mode, playerCount, reduceMotion]);

  const continueAfterLesson = () => {
    const isLastPair = matchedCount >= pairCount;
    setCurrentLesson(null);
    if (isLastPair) void finishGame();
  };

  useGameKeyboardShortcuts({
    enabled: Boolean(currentLesson) || gameState === 'won',
    onNext: currentLesson ? continueAfterLesson : gameState === 'won' ? () => { void startGame(); } : undefined,
  });

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const { data, error } = await supabase
        .from('game_memory_scores')
        .select('id,score,time_seconds,moves,created_at,profiles!inner(first_name,last_name,avatar_url)')
        .order('score', { ascending: false })
        .limit(20);
      if (error) throw error;
      setLeaderboard((data ?? []).map((entry): LeaderboardEntry => ({
        id: String(entry.id),
        score: Number(entry.score),
        time_seconds: Number(entry.time_seconds),
        moves: Number(entry.moves),
        created_at: String(entry.created_at),
        profiles: Array.isArray(entry.profiles) ? entry.profiles[0] ?? null : entry.profiles,
      })));
      setGameState('leaderboard');
    } catch (error) {
      console.error('No se pudo cargar la clasificación del Memorama Bíblico.', error);
      setLeaderboardError('No pudimos cargar la clasificación. Comprueba tu conexión e inténtalo otra vez.');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const leaveGame = () => {
    if (mismatchTimer.current !== null) window.clearTimeout(mismatchTimer.current);
    mismatchTimer.current = null;
    setCurrentLesson(null);
    setIsLocked(false);
    setGameState('menu');
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const renderMenu = () => (
    <section className="mx-auto grid w-full max-w-6xl gap-4 rounded-[2rem] border border-slate-200/80 bg-white/90 p-3 shadow-2xl shadow-blue-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:p-5 lg:grid-cols-[.92fr_1.08fr]">
      <div className="relative isolate flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[1.55rem] bg-[#102653] p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,207,103,.24),transparent_34%),radial-gradient(circle_at_90%_70%,rgba(83,139,255,.25),transparent_45%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 -z-10 size-72 rounded-full border border-white/10" />
        <div>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-200/25 bg-white/10 px-3 text-xs font-black uppercase tracking-[.16em] text-amber-200"><Sparkles size={15} /> Historias para descubrir</span>
          <p className="mt-8 text-xs font-black uppercase tracking-[.22em] text-amber-200">Aprende jugando</p>
          <h1 className="mt-2 max-w-md font-serif text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">Memorama<br />Bíblico</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-blue-100 sm:text-base sm:leading-7">Une cada persona con su historia. Al acertar, descubrirás una explicación y su referencia bíblica.</p>
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] text-blue-100/80"><span>Un vistazo a las historias</span><span>01 — 03</span></div>
          <div className="grid grid-cols-3 gap-2.5" aria-label="Escenas bíblicas incluidas en el juego">
            {STORY_PREVIEWS.map((story) => <div key={story.title} className="group relative aspect-[1.05] overflow-hidden rounded-2xl border border-white/20 bg-blue-950 shadow-lg">
              <img src={story.image} alt="" width="308" height="309" loading="eager" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#07152f] via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 right-2 truncate text-xs font-black text-white sm:bottom-3 sm:left-3">{story.title}</span>
            </div>)}
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-[1.55rem] bg-slate-50 p-5 dark:bg-slate-950/55 sm:space-y-6 sm:p-7">
        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Target size={17} className="text-blue-800 dark:text-blue-300" />Elige un nivel</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.entries(DIFFICULTY_CONFIG) as [MemoryDifficulty, typeof DIFFICULTY_CONFIG.easy][]).map(([value, config]) => (
              <button key={value} type="button" onClick={() => setDifficulty(value)} aria-pressed={difficulty === value}
                className={`min-h-[4.5rem] rounded-2xl border p-2.5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:min-h-20 sm:p-3 ${difficulty === value ? 'border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-950/20' : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100'}`}>
                <span className="block text-xs font-black sm:text-sm">{config.label}</span>
                <span className={`mt-1 block text-[10px] sm:text-xs ${difficulty === value ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{config.pairs} parejas</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Users size={17} className="text-blue-800 dark:text-blue-300" />¿Cómo jugarán?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ModeButton selected={mode === 'solo'} onClick={() => setMode('solo')} title="Individual" description="Supera tu mejor marca" icon={<Compass size={19} />} />
            <ModeButton selected={mode === 'family'} onClick={() => setMode('family')} title="Por turnos" description="Jueguen juntos aquí" icon={<Users size={19} />} />
          </div>
        </fieldset>

        {mode === 'family' && (
          <div className="space-y-3">
            <label htmlFor="player-count" className="block text-sm font-bold text-slate-800 dark:text-slate-100">Jugadores</label>
            <select id="player-count" value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value))}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-900">
              {[2, 3, 4].map((count) => <option key={count} value={count}>{count} jugadores</option>)}
            </select>
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: playerCount }, (_, index) => (
                <label key={index} className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Jugador {index + 1}
                  <input value={playerNames[index]} maxLength={24} onChange={(event) => setPlayerNames((names) => names.map((name, nameIndex) => nameIndex === index ? event.target.value : name))}
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-900 dark:text-white" />
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Los nombres y resultados por turnos solo se usan en este dispositivo y no se guardan.</p>
          </div>
        )}

        {loadError && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100"><p>{loadError}</p><button type="button" onClick={() => void startGame()} disabled={gameState === 'loading'} className="mt-3 min-h-10 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-900 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60 dark:border-rose-300/20 dark:bg-transparent dark:text-rose-100">Reintentar carga</button></div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void startGame()} disabled={gameState === 'loading'}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">
            {gameState === 'loading' ? <RefreshCw className="animate-spin" size={18} aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
            {gameState === 'loading' ? 'Preparando…' : 'Empezar partida'}
          </button>
          <button type="button" onClick={() => void fetchLeaderboard()} disabled={leaderboardLoading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:text-white">
            <Trophy size={18} className="text-amber-600" aria-hidden="true" /> Mejor puntaje individual
          </button>
        </div>
        {!user && <p className="text-center text-xs text-slate-500 dark:text-slate-400">Puedes jugar sin iniciar sesión. Accede para guardar una puntuación individual.</p>}
      </div>
    </section>
  );

  const renderLeaderboard = () => (
    <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-900 sm:p-8">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-white/10">
        <div><p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Partidas individuales</p><h2 className="mt-1 font-serif text-3xl font-bold text-slate-950 dark:text-white">Mejores puntajes</h2></div>
        <button type="button" onClick={() => setGameState('menu')} className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-200 dark:hover:bg-white/10" aria-label="Volver al menú"><X /></button>
      </div>
      {leaderboardLoading ? <p role="status" className="py-12 text-center text-slate-500">Cargando puntajes…</p> : leaderboardError ? (
        <div className="py-10 text-center"><p role="alert" className="text-rose-700 dark:text-rose-200">{leaderboardError}</p><button type="button" onClick={() => void fetchLeaderboard()} className="mt-4 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white dark:bg-amber-400 dark:text-slate-950">Reintentar</button></div>
      ) : leaderboard.length === 0 ? <p className="py-12 text-center text-slate-500 dark:text-slate-400">Aún no hay puntajes registrados. Tu primera partida puede iniciar la lista.</p> : (
        <ol className="mt-5 space-y-2">
          {leaderboard.map((entry, index) => <li key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
            <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-950 font-black text-amber-300">{index + 1}</span><div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-white">{entry.profiles?.first_name ?? 'Jugador'} {entry.profiles?.last_name ?? ''}</p><p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(entry.time_seconds)} · {entry.moves} intentos</p></div></div>
            <strong className="shrink-0 text-lg text-blue-900 dark:text-amber-300">{entry.score.toLocaleString()} pts</strong>
          </li>)}
        </ol>
      )}
    </section>
  );

  const renderGame = () => (
    <section className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={leaveGame} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"><ArrowLeft size={17} aria-hidden="true" /> Menú</button>
        <p aria-live="polite" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15 dark:bg-slate-800">
          {mode === 'family' ? <><Users size={16} className="text-amber-300" aria-hidden="true" /> Turno de {safePlayerNames[activePlayer]}</> : <><Compass size={16} className="text-amber-300" aria-hidden="true" /> Partida individual</>}
        </p>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <GameStat icon={<Sparkles size={19} />} label="Nivel" value={`${DIFFICULTY_CONFIG[difficulty].label} · ${pairCount} parejas`} />
        <GameStat icon={<BookOpenCheck size={19} />} label="Parejas" value={`${matchedCount} / ${pairCount}`} />
        <GameStat icon={<Hand size={19} />} label="Intentos" value={String(moves)} />
        <GameStat icon={<Timer size={19} />} label="Tiempo" value={formatTime(elapsedSeconds)} />
      </div>
      <div className="mb-5 rounded-full bg-blue-950/10 p-1 dark:bg-white/10" role="progressbar" aria-label="Progreso de la partida" aria-valuemin={0} aria-valuemax={pairCount} aria-valuenow={matchedCount}>
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-900 via-blue-700 to-amber-400 transition-[width] duration-500" style={{ width: `${Math.max(4, (matchedCount / pairCount) * 100)}%` }} />
      </div>
      <GameKeyboardHint instruction="Usa Tab e Intro para voltear las cartas con el teclado." nextAction="continuar después de aprender cada pareja" />
      {mode === 'family' && <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{safePlayerNames.map((name, index) => (
        <div key={index} aria-current={activePlayer === index ? 'step' : undefined} className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${activePlayer === index ? 'border-amber-500 bg-amber-50 shadow-sm dark:bg-amber-500/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900'}`}>
          <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">{name}</p><p className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">{playerScores[index] ?? 0} <span className="text-xs font-semibold text-slate-500">parejas</span></p></div>
          {activePlayer === index && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-200/70 text-amber-950 dark:bg-amber-300/15 dark:text-amber-200"><Crown size={17} aria-hidden="true" /></span>}
        </div>
      ))}</div>}
      <div role="group" aria-label="Tablero de parejas bíblicas" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 lg:gap-4">
        {cards.map((card, index) => <MemoryCardButton key={card.uniqueId} card={card} index={index} reduceMotion={reduceMotion} isMismatch={isLocked && flippedIds.includes(card.uniqueId)} onClick={() => handleCardClick(card.uniqueId)} />)}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{matchedCount} de {pairCount} parejas encontradas. {mode === 'family' ? `Turno de ${safePlayerNames[activePlayer]}.` : ''}</p>

      {currentLesson && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="memory-lesson-title" onKeyDown={(event) => { if (event.key === 'Escape') continueAfterLesson(); }} className="my-auto w-full max-w-xl rounded-3xl border border-amber-200/60 bg-white p-6 shadow-2xl dark:border-amber-300/20 dark:bg-slate-900 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"><Check size={24} aria-hidden="true" /></div>
          <p className="mt-5 text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Pareja encontrada</p>
          <h2 id="memory-lesson-title" className="mt-2 font-serif text-3xl font-bold text-slate-950 dark:text-white">{currentLesson.pair_name} · {currentLesson.match_text}</h2>
          <ScenePairPreview pair={currentLesson} />
          <p className="mt-4 leading-7 text-slate-700 dark:text-slate-200">{currentLesson.explanation}</p>
          <div className="mt-4"><BibleVersePreview reference={currentLesson.bible_reference} /></div>
          <fieldset className="mt-5 rounded-2xl border border-slate-200 p-4 text-left dark:border-white/10">
            <legend className="px-2 text-sm font-extrabold text-slate-900 dark:text-white">Repaso rápido</legend>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{currentLesson.learning_question}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {currentLesson.learning_options.map((option) => {
                const answered = learningChoice !== null;
                const correct = option === currentLesson.learning_answer;
                return <button key={option} type="button" disabled={answered} onClick={() => setLearningChoice(option)}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${answered && correct ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100' : answered && option === learningChoice ? 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-500/15 dark:text-rose-100' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100'}`}>
                  {option}
                </button>;
              })}
            </div>
            {learningChoice && <p role="status" className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">{learningChoice === currentLesson.learning_answer ? '¡Correcto! Refuerza la idea y su pasaje.' : `La respuesta es: ${currentLesson.learning_answer}.`}</p>}
          </fieldset>
          {mode === 'family' && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{safePlayerNames[activePlayer]} conserva el turno.</p>}
          <button autoFocus type="button" onClick={continueAfterLesson} aria-keyshortcuts="Shift+Enter" className="mt-7 min-h-12 w-full rounded-xl bg-blue-950 px-5 font-black text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">{matchedCount >= pairCount ? 'Ver resultados' : 'Continuar'}</button>
        </section>
      </div>}
    </section>
  );

  const renderResults = () => {
    const rankedPlayers = safePlayerNames.map((name, index) => ({ name, score: playerScores[index] ?? 0 }))
      .sort((first, second) => second.score - first.score);
    const isTie = mode === 'family' && rankedPlayers.length > 1 && rankedPlayers[0].score === rankedPlayers[1].score;

    return <section className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900 sm:p-9">
      <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200"><Trophy size={28} /></span><p className="mt-5 text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Ronda completada</p><h2 className="mt-2 font-serif text-4xl font-bold text-slate-950 dark:text-white">{mode === 'family' ? (isTie ? '¡Empate!' : `¡Ganó ${rankedPlayers[0].name}!`) : '¡Buen trabajo!'}</h2><p className="mt-3 text-slate-600 dark:text-slate-300">Repasaste {learnedPairs.length} asociaciones bíblicas en {formatTime(elapsedSeconds)} y {moves} intentos.</p></div>
      <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
         <GameStat icon={<Timer size={19} />} label="Tiempo" value={formatTime(elapsedSeconds)} />
         <GameStat icon={<Hand size={19} />} label="Intentos" value={String(moves)} />
         {mode === 'solo' ? <GameStat icon={<Trophy size={19} />} label="Puntaje" value={`${finalScore.toLocaleString()} pts`} /> : <GameStat icon={<BookOpenCheck size={19} />} label="Parejas" value={String(pairCount)} />}
      </div>
      {mode === 'family' && <ol className="mx-auto mt-5 max-w-2xl space-y-2">{rankedPlayers.map((player, index) => <li key={index} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50"><span className="font-bold text-slate-800 dark:text-white">{index + 1}. {player.name}</span><strong className="text-blue-900 dark:text-amber-300">{player.score} parejas</strong></li>)}</ol>}
      <div className="mt-8"><h3 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">Lo que aprendieron</h3><ol className="mt-4 grid gap-3 md:grid-cols-2">{learnedPairs.map((pair) => <li key={pair.id} className="grid grid-cols-[5.5rem_1fr] gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-950/30 sm:grid-cols-[7rem_1fr] sm:gap-4 sm:p-4"><ScenePairPreview pair={pair} compact /><div className="min-w-0"><h4 className="font-bold text-slate-900 dark:text-white">{pair.pair_name} · {pair.match_text}</h4><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{pair.explanation}</p><p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200"><BookOpen size={14} aria-hidden="true" />{pair.bible_reference}</p></div></li>)}</ol></div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => void startGame()} aria-keyshortcuts="Shift+Enter" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 font-black text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-400 dark:text-slate-950"><RotateCcw size={17} /> Jugar de nuevo</button>
        <button type="button" onClick={leaveGame} className="min-h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/15 dark:text-white dark:hover:bg-white/5">Elegir otro nivel</button>
      </div>
      <GameKeyboardHint instruction="Puedes seleccionar los botones con Tab e Intro." nextAction="jugar de nuevo" />
      {mode === 'solo' && !user && <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">Inicia sesión para registrar puntajes individuales en la clasificación.</p>}
    </section>;
  };

  return <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/70 px-4 pb-28 pt-24 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/30 dark:text-white sm:px-6 xl:pb-16">
    <Helmet><title>Memorama Bíblico | Iglesia Jerusalén</title><meta name="description" content="Relaciona historias, personas y símbolos de la Biblia. Aprende con partidas individuales o por turnos en familia." /></Helmet>
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex items-center justify-between">
        <Link to="/recursos/juegos" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-blue-900 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-blue-200 dark:hover:bg-white/5"><ArrowLeft size={17} /> Juegos bíblicos</Link>
        {gameState === 'playing' && <span className="hidden items-center gap-2 text-sm text-slate-500 dark:text-slate-400 sm:inline-flex"><Clock3 size={16} />Puedes salir cuando quieras</span>}
      </div>
      {gameState === 'menu' || gameState === 'loading' ? renderMenu() : null}
      {gameState === 'leaderboard' && renderLeaderboard()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'won' && renderResults()}
    </div>
  </main>;
};

function ModeButton({ selected, onClick, title, description, icon }: { selected: boolean; onClick: () => void; title: string; description: string; icon: ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`flex min-h-[4.75rem] items-center gap-3 rounded-2xl border p-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:min-h-20 sm:p-4 ${selected ? 'border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-950/15' : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100'}`}>
    <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-white/10 text-amber-200' : 'bg-blue-50 text-blue-900 dark:bg-white/5 dark:text-blue-200'}`}>{icon}</span>
    <span className="min-w-0"><span className="block font-black">{title}</span><span className={`mt-1 block text-xs ${selected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{description}</span></span>
  </button>;
}

function GameStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="flex min-h-[4.25rem] min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:min-h-[4.5rem] sm:gap-3 sm:p-3">
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-900 dark:bg-blue-400/10 dark:text-blue-200 sm:size-10">{icon}</span>
    <span className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-slate-500 dark:text-slate-400 sm:text-[10px]">{label}</span><strong className="mt-0.5 block break-words text-xs font-black leading-tight text-slate-950 dark:text-white sm:text-sm">{value}</strong></span>
  </div>;
}

function MemoryCardButton({ card, index, reduceMotion, isMismatch, onClick }: { card: MemoryCard; index: number; reduceMotion: boolean | null; isMismatch: boolean; onClick: () => void }) {
  const revealed = card.isFlipped || card.isMatched;
  const label = revealed ? `Carta ${index + 1}: ${card.side === 'a' ? card.pair_name : card.match_text}${card.isMatched ? ', pareja encontrada' : ''}` : `Carta oculta ${index + 1}`;
  const image = getCardImage(card);
  return <motion.button type="button" onClick={onClick} disabled={card.isMatched}
    data-pair-id={card.id} data-card-side={card.side} data-state={card.isMatched ? 'matched' : isMismatch ? 'mismatch' : revealed ? 'revealed' : 'hidden'} aria-label={label} aria-pressed={revealed}
    whileHover={reduceMotion ? undefined : { y: -3, scale: 1.012 }}
    whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    style={{ perspective: 1000 }}
    className={`group relative aspect-[0.9] w-full overflow-hidden rounded-[1.25rem] border-2 bg-blue-950 text-left shadow-lg shadow-blue-950/15 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 disabled:cursor-default sm:aspect-[1.03] lg:aspect-[1.2] ${card.isMatched ? 'border-emerald-300 shadow-emerald-950/15 dark:border-emerald-300/70' : isMismatch ? 'border-rose-300 shadow-rose-950/20 dark:border-rose-300/80' : revealed ? 'border-amber-300 shadow-amber-950/15 dark:border-amber-300/80' : 'border-blue-900/25 hover:border-amber-300/80 dark:border-blue-300/20'}`}>
    <motion.span className="absolute inset-0 block" aria-hidden="true" animate={{ rotateY: revealed ? 180 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.2, 0.75, 0.2, 1] }} style={{ transformStyle: 'preserve-3d' }}>
    <span className="absolute inset-0 overflow-hidden bg-[#102653]" aria-hidden="true" style={{ backfaceVisibility: 'hidden' }}>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(47,91,165,.72),transparent_39%),linear-gradient(145deg,#173a78,#091632)]" />
      <span className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,.7)_0.65px,transparent_0.65px)] [background-size:13px_13px]" />
      <span className="absolute inset-[7px] rounded-[1rem] border border-amber-200/20" />
      <span className="absolute inset-0 grid place-items-center">
        <svg viewBox="0 0 96 96" className="size-[4.2rem] drop-shadow-[0_8px_20px_rgba(0,0,0,.28)] transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none sm:size-[4.75rem]" fill="none">
          <path d="M48 11 52 20 62 16 61 27 72 28 66 37 75 44 65 49 69 60 57 59 53 70 46 62 37 69 34 58 23 61 27 50 17 44 27 38 23 27 35 29 39 18 47 25 54 17Z" stroke="#F5CC69" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M28 44c7-4 14-4 20 0v25c-6-4-13-4-20 0V44Zm40 0c-7-4-14-4-20 0v25c6-4 13-4 20 0V44Z" fill="rgba(255,255,255,.1)" stroke="#FFF4D7" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M48 45v23M33 51c4-2 8-2 12 0M63 51c-4-2-8-2-12 0" stroke="#F5CC69" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="48" cy="36" r="2.5" fill="#F5CC69" />
        </svg>
      </span>
      <span className="absolute bottom-3 left-2 right-2 text-center text-[9px] font-black uppercase tracking-[.16em] text-blue-100/80 sm:bottom-4 sm:text-[10px]">Toca para revelar</span>
    </span>
    {revealed && <span className="absolute inset-0 overflow-hidden rounded-[1.1rem] bg-slate-900 text-white" aria-hidden="true" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
      {image ? <img src={image} alt="" width="308" height="309" loading="eager" decoding="async" className="absolute inset-0 size-full object-cover" /> : <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(245,204,105,.38),transparent_33%),linear-gradient(145deg,#254a7c,#0d1830)]" />}
      {!image && card.side === 'a' && card.image_url && <span className="absolute inset-x-0 top-1/4 grid place-items-center"><CardImage image={card.image_url} label={card.pair_name} /></span>}
      <span className="absolute inset-0 bg-gradient-to-t from-[#071327] via-[#071327]/45 to-[#071327]/5" />
      <span className="absolute left-2.5 top-2.5 inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/30 bg-slate-950/45 px-2.5 text-[9px] font-black uppercase tracking-[.12em] text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:text-[10px]">
        {card.side === 'a' ? <Users size={12} aria-hidden="true" /> : <BookOpen size={12} aria-hidden="true" />}
        {card.side === 'a' ? card.card_label : card.match_label}
      </span>
      <span className="absolute inset-x-0 bottom-0 flex min-h-[46%] items-end p-2.5 sm:p-3.5">
        <span className="line-clamp-4 w-full text-xs font-black leading-[1.25] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,.65)] sm:text-sm md:text-base">{card.side === 'a' ? card.pair_name : card.match_text}</span>
      </span>
      {card.isMatched && <span className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full border border-white/40 bg-emerald-500 text-white shadow-lg sm:right-3 sm:top-3"><Check size={17} strokeWidth={3} /></span>}
      {isMismatch && <span className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full border border-white/40 bg-rose-600 text-white shadow-lg sm:right-3 sm:top-3"><X size={15} strokeWidth={3} /></span>}
    </span>}
    </motion.span>
  </motion.button>;
}

function ScenePairPreview({ pair, compact = false }: { pair: MemoryPair; compact?: boolean }) {
  return <div role="img" aria-label={`Imágenes de ${pair.pair_name} y ${pair.match_text}`} className={`grid grid-cols-[1fr_auto_1fr] items-center ${compact ? 'gap-1.5' : 'mt-5 gap-2 sm:gap-3'}`}>
    <ScenePreview image={getCardImage({ ...pair, side: 'a' })} label={pair.pair_name} compact={compact} />
    <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-200"><ArrowLeft className="rotate-180" size={14} /></span>
    <ScenePreview image={getCardImage({ ...pair, side: 'b' })} label={pair.match_text} compact={compact} />
  </div>;
}

function ScenePreview({ image, label, compact }: { image: string | null; label: string; compact: boolean }) {
  return <div className={`relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800 ${compact ? 'aspect-square' : 'aspect-[1.6]'}`}>
    {image ? <img src={image} alt="" width="308" height="309" loading="eager" decoding="async" className="absolute inset-0 size-full object-cover" /> : <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_25%_20%,rgba(245,204,105,.38),transparent_33%),linear-gradient(145deg,#254a7c,#0d1830)]"><BookOpen size={compact ? 14 : 22} className="text-amber-200" aria-hidden="true" /></span>}
    {!compact && <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-950/90 to-transparent px-2 pb-2 pt-5 text-[10px] font-black text-white sm:px-3 sm:pb-2.5 sm:text-xs">{label}</span>}
  </div>;
}

function CardImage({ image, label }: { image: string; label: string }) {
  if (image.trim().startsWith('<svg')) {
    return <span className="grid size-10 place-items-center text-blue-900" aria-label={label} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(image, { USE_PROFILES: { svg: true } }) }} />;
  }
  if (/^(https?:\/\/|\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(image)) {
    return <img src={image} alt="" loading="lazy" className="size-12 rounded-lg object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />;
  }
  return <span className="text-3xl" aria-hidden="true">{image}</span>;
}
