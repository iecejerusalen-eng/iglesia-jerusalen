import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  BookOpen,
  Crown,
  Info,
  Lightbulb,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import { drawContent } from '../../../features/games/utils/contentDeck';
import { useGameKeyboardShortcuts } from '../../../features/games/hooks/useGameKeyboardShortcuts';
import { GameKeyboardHint } from '../../../features/games/components/GameKeyboardHint';
import { useAuthStore } from '../../../store/useAuthStore';
import BibleVerseLink from '../../../components/ui/BibleVerseLink';
import { BorderBeam } from '../../../components/ui/magicui/border-beam';
import { ShinyButton } from '../../../components/ui/magicui/shiny-button';
import {
  DIFFICULTY_LABELS,
  normalizeForGuess,
  prepareHangmanWords,
  type HangmanWord,
  type RawHangmanWord,
} from './hangmanContent';

interface HangmanLeaderboardEntry {
  id: string;
  score: number;
  words_guessed: number;
  profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
}

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const MAX_MISTAKES = 10;

const difficultyStyles = {
  easy: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200',
  medium: 'border-sky-300/25 bg-sky-400/10 text-sky-200',
  hard: 'border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-200',
};

function WordLives({ mistakes }: { mistakes: number }) {
  const remaining = MAX_MISTAKES - mistakes;
  return (
    <div className="mx-auto w-full max-w-[310px] rounded-2xl border border-white/10 bg-white/[0.035] p-4" role="progressbar" aria-label="Oportunidades restantes" aria-valuemin={0} aria-valuemax={MAX_MISTAKES} aria-valuenow={remaining}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-300"><Lightbulb size={16} className="text-amber-300" aria-hidden="true" /> Oportunidades</span>
        <strong className={remaining <= 3 ? 'text-rose-300' : 'text-amber-200'}>{remaining} de {MAX_MISTAKES}</strong>
      </div>
      <div className="grid grid-cols-5 gap-2" aria-hidden="true">
        {Array.from({ length: MAX_MISTAKES }, (_, index) => <span key={index} className={`h-3 rounded-full transition-colors duration-300 motion-reduce:transition-none ${index < remaining ? 'bg-gradient-to-r from-amber-300 to-amber-500 shadow-sm shadow-amber-300/30' : 'bg-slate-700/70'}`} />)}
      </div>
    </div>
  );
}

function ReferenceReveal({ word, revealed }: { word: HangmanWord; revealed: boolean }) {
  return (
    <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${revealed ? 'border-amber-300/25 bg-amber-300/10' : 'border-white/10 bg-white/[0.035]'}`}>
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${revealed ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-slate-400'}`}>
        <BookOpen size={19} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/70">Referencia bíblica</p>
        {revealed ? (
          <BibleVerseLink reference={word.bible_reference} preview className="mt-1 inline-block text-base font-bold text-amber-100" />
        ) : (
          <p className="mt-1 text-sm text-slate-400">Se revelará al completar esta adivinanza.</p>
        )}
      </div>
    </div>
  );
}

export const Hangman = () => {
  const { user } = useAuthStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'won' | 'leaderboard'>('menu');
  const [words, setWords] = useState<HangmanWord[]>([]);
  const [currentWord, setCurrentWord] = useState<HangmanWord | null>(null);
  const [loadingWords, setLoadingWords] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [wordsGuessed, setWordsGuessed] = useState(0);
  const [leaderboard, setLeaderboard] = useState<HangmanLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const beginRound = useCallback((pool: HangmanWord[]) => {
    const [next, ...remaining] = pool;
    if (!next) return false;
    setCurrentWord(next);
    setWords(remaining);
    setGuessedLetters(new Set());
    setMistakes(0);
    setGameState('playing');
    return true;
  }, []);

  const fetchWords = useCallback(async (startRoundAfterLoad = false) => {
    setLoadingWords(true);
    setLoadError(null);
    try {
      let response = await supabase
        .from('game_hangman_words')
        .select('id,word,hint,category,difficulty,bible_reference');

      if (response.error?.code === '42703' && response.error.message.includes('bible_reference')) {
      console.warn('La migración de referencias de Adivina la palabra aún no está aplicada; usando el catálogo bíblico revisado durante la transición.');
        response = await supabase
          .from('game_hangman_words')
          .select('id,word,hint,category,difficulty');
      }

      if (response.error) throw response.error;
      const prepared = prepareHangmanWords((response.data ?? []) as RawHangmanWord[]);
      if (prepared.rejectedIds.length > 0) {
        console.error('Se excluyeron adivinanzas incompletas o sin referencia bíblica revisada.', { ids: prepared.rejectedIds });
      }
      if (prepared.words.length === 0) {
        throw new Error('No existen adivinanzas completas con referencia bíblica.');
      }

      const shuffled = drawContent(prepared.words, 'reto-letras', prepared.words.length, (word) => word.id);
      if (startRoundAfterLoad) {
        beginRound(shuffled);
      } else {
        setWords(shuffled);
        setCurrentWord(shuffled[0]);
      }
    } catch (error) {
      console.error('No se pudieron cargar las adivinanzas bíblicas.', error);
      setLoadError('No pudimos cargar las adivinanzas. Intenta nuevamente.');
    } finally {
      setLoadingWords(false);
    }
  }, [beginRound]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchWords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchWords]);

  const startGame = () => {
    setScore(0);
    setWordsGuessed(0);
    if (!beginRound(words)) void fetchWords(true);
  };

  const nextWord = () => {
    if (!beginRound(words)) void fetchWords(true);
  };

  const handleWinRound = useCallback(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({
        particleCount: 110,
        spread: 78,
        origin: { y: 0.62 },
        colors: ['#fbbf24', '#38bdf8', '#ffffff'],
      });
    }
    setScore((currentScore) => currentScore + 100);
    setWordsGuessed((currentWords) => currentWords + 1);
    setGameState('won');
  }, []);

  const endGame = useCallback(async () => {
    setGameState('gameover');
    if (!user || (score === 0 && wordsGuessed === 0)) return;

    try {
      const { error } = await supabase.from('game_hangman_scores').insert([{
        profile_id: user.id,
        score,
        words_guessed: wordsGuessed,
      }]);
      if (error) throw error;
    } catch (error) {
      console.error('No se pudo guardar el puntaje de Adivina la palabra.', error);
      toast.error('La partida terminó, pero no pudimos guardar tu puntaje.');
    }
  }, [score, user, wordsGuessed]);

  const handleGuess = useCallback((letter: string) => {
    if (gameState !== 'playing' || !currentWord) return;
    const normalizedLetter = normalizeForGuess(letter);
    if (guessedLetters.has(normalizedLetter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(normalizedLetter);
    setGuessedLetters(newGuessed);
    const normalizedWord = normalizeForGuess(currentWord.word);

    if (!normalizedWord.includes(normalizedLetter)) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= MAX_MISTAKES) void endGame();
      return;
    }

    const isWon = normalizedWord.split('').every((character) => !ALPHABET.includes(character) || newGuessed.has(character));
    if (isWon) window.setTimeout(handleWinRound, 450);
  }, [currentWord, endGame, gameState, guessedLetters, handleWinRound, mistakes]);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_hangman_scores')
        .select('id,score,words_guessed,created_at,profiles!inner(first_name,last_name,avatar_url)')
        .order('score', { ascending: false })
        .limit(20);
      if (error) throw error;
      const entries = (data ?? []).map((entry): HangmanLeaderboardEntry => ({
        id: String(entry.id),
        score: Number(entry.score),
        words_guessed: Number(entry.words_guessed),
        profiles: Array.isArray(entry.profiles) ? entry.profiles[0] ?? null : entry.profiles,
      }));
      setLeaderboard(entries);
      setGameState('leaderboard');
    } catch (error) {
      console.error('No se pudo cargar la clasificación de Adivina la palabra.', error);
      toast.error('No pudimos cargar la clasificación.');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useGameKeyboardShortcuts({
    enabled: gameState !== 'menu' && gameState !== 'leaderboard',
    onNext: gameState === 'won' ? nextWord : gameState === 'gameover' ? startGame : undefined,
    onLetter: gameState === 'playing' ? handleGuess : undefined,
  });

  useEffect(() => {
    if (gameState !== 'playing') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentWord?.id, gameState]);

  const remainingLives = MAX_MISTAKES - mistakes;

  const renderMenu = () => (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto grid w-full min-w-0 max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/75 shadow-[0_40px_120px_-50px_rgba(245,158,11,.5)] backdrop-blur-2xl lg:grid-cols-[.92fr_1.08fr]"
    >
      <BorderBeam size={180} duration={15} colorFrom="#fbbf24" colorTo="#38bdf8" />
      <div className="relative order-1 min-w-0 border-b border-white/10 p-5 sm:p-8 lg:order-1 lg:border-b-0 lg:border-r">
        <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-sky-500/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto flex h-full w-full max-w-xl flex-col justify-center lg:max-w-none">
          <figure className="group relative isolate aspect-[1.48] overflow-hidden rounded-[1.4rem] border border-white/15 bg-slate-900 shadow-2xl shadow-black/30 sm:aspect-[1.6]">
            <img
              src="/images/games/covers/reto-letras.webp"
              alt="Biblia abierta y letras de madera preparadas para descubrir una palabra bíblica"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-slate-950/10" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4 sm:p-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100 shadow-lg backdrop-blur-md">
                <BookOpen size={14} aria-hidden="true" /> Palabras de la Biblia
              </span>
              <span className="rounded-full border border-emerald-200/25 bg-emerald-950/70 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-100 backdrop-blur-md">A tu ritmo</span>
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 p-5 pt-16 sm:p-6 sm:pt-20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Observa la pista · forma la palabra</p>
              <p className="mt-2 max-w-sm font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">Cada respuesta abre una nueva historia.</p>
            </figcaption>
            <div className="absolute bottom-5 right-5 hidden items-center gap-1.5 sm:flex" aria-hidden="true">
              {['L', 'U', '?'].map((letter, index) => <span key={index} className={`grid h-9 w-8 place-items-center rounded-lg border border-amber-100/50 text-sm font-black text-slate-950 shadow-lg ${index === 2 ? 'bg-white/90' : 'bg-gradient-to-b from-amber-200 to-amber-500'}`}>{letter}</span>)}
            </div>
          </figure>
          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center sm:gap-3">
            {[
              ['10', 'oportunidades'],
              ['+100', 'puntos por acierto'],
              ['Biblia', 'como guía'],
            ].map(([value, label]) => (
              <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.055] px-1.5 py-3 sm:rounded-2xl sm:px-2.5">
                <strong className="block text-sm text-white sm:text-base">{value}</strong>
                <span className="mt-1 block break-words text-[8px] font-bold uppercase leading-tight tracking-wide text-slate-300 sm:text-[9px] sm:tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative order-2 flex min-w-0 flex-col justify-center p-5 sm:p-9 lg:order-2 lg:p-10 xl:p-12">
        <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
          <Sparkles size={13} aria-hidden="true" /> Aprende jugando
        </span>
        <h1 className="max-w-xl font-serif text-[2.65rem] font-bold leading-[1.02] tracking-tight text-white sm:text-6xl">
          Adivina <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-transparent">la palabra</span>
        </h1>
        <p className="mt-4 max-w-xl break-words text-base leading-7 text-slate-300 sm:text-lg">
          Descubre palabras, personajes y lugares de la Biblia. Al acertar, conocerás el pasaje que inspira cada respuesta.
        </p>

        <section aria-labelledby="hangman-how-to-play" className="mt-5 border-l-2 border-amber-300/70 pl-4 sm:pl-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id="hangman-how-to-play" className="text-sm font-black text-white">Cómo jugar</h2>
            {currentWord && <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100">Dificultad: {DIFFICULTY_LABELS[currentWord.difficulty]}</span>}
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Elige letras en pantalla o escríbelas. Cada error resta una oportunidad; completa la palabra para sumar puntos y descubrir su referencia.</p>
          <GameKeyboardHint instruction="También puedes moverte entre letras con Tab e Intro." nextAction="siguiente palabra después de resolverla" tone="dark-surface" />
        </section>

        {loadError && (
          <div className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100" role="alert">
            {loadError}
            <button onClick={() => void fetchWords()} className="ml-2 font-black underline underline-offset-4">Reintentar</button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ShinyButton
            onClick={startGame}
            disabled={loadingWords || !currentWord}
            className="min-h-14 w-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 text-sm shadow-lg shadow-amber-900/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            shinyColor="#ffffff"
          >
            {loadingWords ? <RefreshCw className="animate-spin motion-reduce:animate-none" size={18} /> : <Play className="fill-current" size={18} />}
            {loadingWords ? 'Preparando' : 'Comenzar desafío'}
          </ShinyButton>
          <button
            onClick={() => void fetchLeaderboard()}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.055] px-6 text-sm font-black text-white transition hover:border-amber-200/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <Trophy size={18} className="text-amber-300" /> Clasificación
          </button>
        </div>
        {!user && <p className="mt-5 text-xs text-slate-500">Inicia sesión si deseas guardar tus puntajes.</p>}
      </div>
    </motion.section>
  );

  const renderLeaderboard = () => (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/65 p-5 shadow-2xl backdrop-blur-2xl sm:p-8"
    >
      <BorderBeam size={140} duration={13} colorFrom="#fbbf24" colorTo="#a78bfa" />
      <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Salón de honor</p>
          <h2 className="mt-1 flex items-center gap-3 font-serif text-3xl font-bold text-white"><Crown className="text-amber-300" /> Mejores jugadores</h2>
        </div>
        <button onClick={() => setGameState('menu')} className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" aria-label="Cerrar clasificación"><X /></button>
      </div>
      {leaderboardLoading ? (
        <div className="grid min-h-60 place-items-center"><RefreshCw className="animate-spin motion-reduce:animate-none text-amber-300" size={30} /></div>
      ) : leaderboard.length === 0 ? (
        <p className="py-14 text-center text-slate-400">Aún no hay puntajes registrados. ¡Sé el primero!</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <article key={entry.id} className={`flex items-center justify-between rounded-2xl border p-4 ${index === 0 ? 'border-amber-300/25 bg-amber-300/10' : 'border-white/10 bg-white/[0.035]'}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-black ${index === 0 ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-slate-300'}`}>{index + 1}</span>
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-slate-800">
                  {entry.profiles?.avatar_url ? <img src={entry.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-bold text-amber-200">{entry.profiles?.first_name?.charAt(0) || '?'}</span>}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{entry.profiles?.first_name} {entry.profiles?.last_name}</p>
                  <p className="text-xs text-slate-400">{entry.words_guessed} palabras resueltas</p>
                </div>
              </div>
              <strong className="ml-3 text-xl text-amber-300">{entry.score.toLocaleString()}</strong>
            </article>
          ))}
        </div>
      )}
    </motion.section>
  );

  const renderPlaying = () => {
    if (!currentWord) return <div className="grid min-h-[55vh] place-items-center"><RefreshCw className="animate-spin motion-reduce:animate-none text-amber-300" /></div>;
    const normalizedWord = normalizeForGuess(currentWord.word);
    const wordLetters = currentWord.word.toLocaleUpperCase('es').split('');
    const roundFinished = gameState === 'won' || gameState === 'gameover';
    const roundNumber = gameState === 'won' ? Math.max(1, wordsGuessed) : wordsGuessed + 1;

    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="relative order-2 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-2xl sm:p-7 lg:order-1">
          <BorderBeam size={120} duration={12} colorFrom={remainingLives <= 3 ? '#fb7185' : '#fbbf24'} colorTo="#38bdf8" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tu recorrido</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">Ronda {roundNumber}</span>
          </div>
          <WordLives mistakes={mistakes} />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <Target size={18} className="mb-2 text-sky-300" />
              <strong className="block text-2xl text-white">{score}</strong>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Puntos</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <ShieldCheck size={18} className="mb-2 text-emerald-300" />
              <strong className="block text-2xl text-white">{wordsGuessed}</strong>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Aciertos</span>
            </div>
          </div>
        </aside>

        <div className="relative order-1 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-2xl sm:p-8 lg:order-2 lg:p-10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">{currentWord.category}</span>
            <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${difficultyStyles[currentWord.difficulty]}`}>{DIFFICULTY_LABELS[currentWord.difficulty]}</span>
            <span className={`ml-auto rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] lg:hidden ${remainingLives <= 3 ? 'border-rose-300/25 bg-rose-300/10 text-rose-200' : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'}`}>{remainingLives} oportunidades</span>
          </div>

          <div className="relative mt-5 flex items-start gap-3 rounded-2xl border border-sky-300/15 bg-sky-300/[0.07] p-4 sm:p-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-300/15 text-sky-200"><Lightbulb size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200/60">Pista</p>
              <p className="mt-1 text-base leading-6 text-sky-50 sm:text-lg">{currentWord.hint}</p>
            </div>
          </div>

          <div className="relative my-8 flex flex-wrap justify-center gap-1.5 sm:gap-2" aria-label="Palabra por descubrir">
            {wordLetters.map((letter, index) => {
              if (letter === ' ') return <span key={`space-${index}`} className="w-4 sm:w-7" aria-hidden="true" />;
              const normalizedLetter = normalizeForGuess(letter);
              const isLetter = ALPHABET.includes(normalizedLetter);
              const isGuessed = !isLetter || guessedLetters.has(normalizedLetter) || roundFinished;
              const isMissed = gameState === 'gameover' && isLetter && !guessedLetters.has(normalizedLetter);
              return (
                <motion.span
                  key={`${letter}-${index}`}
                  initial={false}
                  animate={isGuessed ? { y: [0, -3, 0], scale: [1, 1.06, 1] } : undefined}
                  className={`grid h-12 min-w-9 place-items-center rounded-xl border px-2 text-lg font-black shadow-lg sm:h-14 sm:min-w-11 sm:text-2xl ${isMissed ? 'border-rose-400/35 bg-rose-400/15 text-rose-200' : isGuessed ? 'border-amber-300/30 bg-gradient-to-b from-amber-200 to-amber-400 text-slate-950' : 'border-white/10 bg-white/[0.045] text-transparent'}`}
                >
                  {isGuessed ? letter : '•'}
                </motion.span>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {gameState === 'won' ? (
              <motion.div key="won" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-5 text-center">
                <Sparkles className="mx-auto text-emerald-300" />
                <h3 className="mt-2 text-2xl font-black text-emerald-100">¡Respuesta correcta!</h3>
                <p className="mt-1 text-sm text-emerald-100/70">Sumaste 100 puntos y desbloqueaste el pasaje bíblico.</p>
                <button type="button" onClick={nextWord} aria-keyshortcuts="Shift+Enter" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"><Play size={17} /> Siguiente adivinanza</button>
              </motion.div>
            ) : gameState === 'gameover' ? (
              <motion.div key="lost" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-rose-300/25 bg-rose-300/10 p-5 text-center">
                <Info className="mx-auto text-rose-300" />
                <h3 className="mt-2 text-2xl font-black text-rose-100">Se acabaron las oportunidades</h3>
                <p className="mt-1 text-sm text-rose-100/70">La respuesta era <strong className="text-white">{currentWord.word}</strong>.</p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <button onClick={() => setGameState('menu')} className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-black text-white hover:bg-white/10">Volver al inicio</button>
                  <button onClick={startGame} aria-keyshortcuts="Shift+Enter" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 text-sm font-black text-slate-950 hover:bg-amber-400"><RefreshCw size={17} /> Nueva partida</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="keyboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 sm:text-left">Elige una letra</p>
                <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9 sm:gap-2 lg:grid-cols-10">
                  {ALPHABET.map((letter) => {
                    const wasGuessed = guessedLetters.has(letter);
                    const isCorrect = wasGuessed && normalizedWord.includes(letter);
                    const isWrong = wasGuessed && !normalizedWord.includes(letter);
                    return (
                      <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={wasGuessed}
                        aria-label={`Probar letra ${letter}`}
                        className={`aspect-square min-h-10 rounded-xl border text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:text-base ${isCorrect ? 'border-emerald-300/35 bg-emerald-400/20 text-emerald-200' : isWrong ? 'border-rose-300/20 bg-rose-400/10 text-rose-300/50' : 'border-white/10 bg-white/[0.055] text-slate-100 shadow-[0_8px_20px_-14px_rgba(0,0,0,.8)] hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100 disabled:cursor-not-allowed'}`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ReferenceReveal word={currentWord} revealed={roundFinished} />
          <GameKeyboardHint
            instruction={gameState === 'playing' ? 'Escribe letras o selecciónalas en pantalla.' : 'Usa los botones para continuar o empezar otra partida.'}
            nextAction={gameState === 'won' ? 'siguiente palabra' : 'nueva partida después de terminar'}
          />
          <p className="sr-only" aria-live="polite">{mistakes > 0 ? `Llevas ${mistakes} errores; quedan ${remainingLives} oportunidades.` : 'Aún tienes las diez oportunidades.'}</p>
        </div>
      </motion.section>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-hidden bg-[#070b16] px-4 py-8 pb-28 text-white sm:py-12 xl:pb-12">
      <Helmet><title>Adivina la palabra | Juegos Bíblicos</title><meta name="description" content="Adivina palabras bíblicas eligiendo o escribiendo letras. Cada error resta una oportunidad y cada respuesta revela su referencia." /></Helmet>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(14,165,233,.16),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(245,158,11,.18),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(79,70,229,.14),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto mb-6 flex max-w-7xl items-center justify-between">
        <Link to="/recursos/juegos" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 backdrop-blur-xl transition hover:bg-white/10 hover:text-white">
          <ArrowLeft size={16} /> Juegos
        </Link>
        {gameState !== 'menu' && gameState !== 'leaderboard' && (
          <button onClick={() => setGameState('menu')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-4 py-2.5 text-xs font-black text-slate-300 backdrop-blur-xl hover:bg-white/10" aria-label="Salir de la partida"><X size={16} /> Salir</button>
        )}
      </div>

      <main className="relative z-10">
        {gameState === 'menu' && renderMenu()}
        {gameState === 'leaderboard' && renderLeaderboard()}
        {(gameState === 'playing' || gameState === 'won' || gameState === 'gameover') && renderPlaying()}
      </main>
    </div>
    </MotionConfig>
  );
};
