import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Trophy, Heart, Users, X, Play, ArrowLeft, Check,
  Volume2, VolumeX, Shield, Crown, Sparkles, BookOpen, RefreshCw,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';
import { gameAudioService } from '../../../features/games/services/gameAudioService';
import { drawContent } from '../../../features/games/utils/contentDeck';
import { useGameKeyboardShortcuts } from '../../../features/games/hooks/useGameKeyboardShortcuts';
import { GameKeyboardHint } from '../../../features/games/components/GameKeyboardHint';

const getRandomFloat = () => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / 4294967296;
};

interface Question {
  id: string;
  difficulty_level: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  image_url?: string | null;
}

interface ProfileInfo {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
}

interface LeaderboardEntry {
  id: string;
  score: number;
  level_reached: number;
  mode: string;
  created_at: string;
  profiles?: ProfileInfo | ProfileInfo[] | null;
  users?: ProfileInfo | ProfileInfo[] | null;
}

const PRIZE_TREE = [
  500, 1000, 2000, 3000, 5000, // Nivel 1-5 (Seguro 5000)
  10000, 20000, 30000, 50000, 100000, // Nivel 6-10 (Seguro 100000)
  200000, 300000, 500000, 750000, 1000000 // Nivel 11-15 (Biblionario)
];

const SAFE_HAVENS = [4, 9, 14]; // Index of safe havens (Niveles 5, 10, 15)

export const Biblionario = () => {
  const { user } = useAuthStore();
  
  // Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'won' | 'leaderboard'>('menu');
  const [mode, setMode] = useState<'normal' | 'infinite'>('normal');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  

  // Interaction State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Lifelines
  const [used5050, setUsed5050] = useState(false);
  const [usedPhone, setUsedPhone] = useState(false);
  const [usedAudience, setUsedAudience] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [audienceVotes, setAudienceVotes] = useState<Record<string, number> | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneAdvice, setPhoneAdvice] = useState<string | null>(null);

  // Player Stats
  const [score, setScore] = useState(0);
  const [guaranteedPrize, setGuaranteedPrize] = useState(0);
  const [lives, setLives] = useState(3);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<'normal' | 'infinite'>('normal');
  const [leaderboardTimeframe] = useState<'all_time' | 'monthly'>('all_time');
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);

  // Toggle Mute Audio
  const handleToggleSound = () => {
    const isMuted = gameAudioService.toggleMute();
    setSoundEnabled(!isMuted);
  };

  const stopAllAudio = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  };

  const playEffect = (type: 'correct' | 'wrong' | 'finalAnswer' | 'win' | 'suspense') => {
    if (!soundEnabled) return;
    if (type === 'correct') gameAudioService.playCorrect();
    else if (type === 'wrong') gameAudioService.playWrong();
    else if (type === 'win') gameAudioService.playVictory();
    else if (type === 'finalAnswer' || type === 'suspense') gameAudioService.playTick();
  };

  const fetchQuestionForLevel = async (level: number, gameMode: 'normal' | 'infinite'): Promise<boolean> => {
    setQuestionLoading(true);
    setQuestionLoadError(null);
    try {
      const fetchLevel = gameMode === 'normal' ? level : Math.min(level, 15);
      
      const { data, error } = await supabase
        .from('game_biblionario_questions')
        .select('*')
        .eq('difficulty_level', fetchLevel);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // The session deck deals the full level pool once before starting a new cycle.
        const selected = drawContent(data, `biblionario:${fetchLevel}`, 1, (question) => question.id)[0];
        if (!selected) throw new Error('No se pudo escoger una pregunta disponible.');
        
        setCurrentQuestion(selected);
        return true;
      } else {
        if (level > 1) {
          return await fetchQuestionForLevel(level - 1, gameMode);
        } else {
          setQuestionLoadError('No hay preguntas publicadas para comenzar esta partida. Inténtalo de nuevo más tarde.');
          return false;
        }
      }
    } catch (err) {
      console.error('No se pudo cargar la pregunta del Biblionario.', err);
      setQuestionLoadError('No pudimos cargar una pregunta. Revisa tu conexión e inténtalo de nuevo.');
      return false;
    } finally {
      setQuestionLoading(false);
    }
  };

  const startGame = async (selectedMode: 'normal' | 'infinite') => {
    setMode(selectedMode);
    setCurrentLevel(1);
    setScore(0);
    setGuaranteedPrize(0);
    setLives(selectedMode === 'infinite' ? 3 : 1);
    
    // Reset lifelines
    setUsed5050(false);
    setUsedPhone(false);
    setUsedAudience(false);
    setHiddenOptions([]);
    setAudienceVotes(null);
    setPhoneModalOpen(false);
    
    // Reset interaction
    setSelectedOption(null);
    setIsLocked(false);
    setShowExplanation(false);
    
    const loaded = await fetchQuestionForLevel(1, selectedMode);
    if (loaded) setGameState('playing');
  };

  const handleOptionSelect = (optionKey: string) => {
    if (isLocked || showExplanation || hiddenOptions.includes(optionKey)) return;
    setSelectedOption(optionKey);
  };

  const lockAnswer = () => {
    if (!selectedOption || !currentQuestion) return;
    
    setIsLocked(true);
    playEffect('finalAnswer');
    checkAnswer();
  };

  const checkAnswer = () => {
    if (!currentQuestion || !selectedOption) return;

    const isCorrect = selectedOption === currentQuestion.correct_option.toUpperCase();

    if (isCorrect) {
      playEffect('correct');
      const prizeWon = mode === 'normal' ? PRIZE_TREE[currentLevel - 1] : score + (currentLevel * 1000);
      setScore(prizeWon);
      
      if (mode === 'normal' && SAFE_HAVENS.includes(currentLevel - 1)) {
        setGuaranteedPrize(prizeWon);
        playEffect('win');
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FFFFFF']
          });
        }
      }
      
      setShowExplanation(true);

    } else {
      playEffect('wrong');
      if (mode === 'infinite') {
        const remainingLives = lives - 1;
        setLives(remainingLives);
      }
      setShowExplanation(true);
    }
  };

  const nextLevel = async () => {
    if (mode === 'normal' && currentLevel === 15) {
      endGame(true);
      return;
    }

    const nextLvl = currentLevel + 1;
    setCurrentLevel(nextLvl);
    setSelectedOption(null);
    setIsLocked(false);
    setShowExplanation(false);
    setAudienceVotes(null);
    setPhoneModalOpen(false);
    
    const loaded = await fetchQuestionForLevel(nextLvl, mode);
    if (!loaded) setGameState('menu');
  };

  const endGame = async (won: boolean) => {
    stopAllAudio();
    if (won) {
      playEffect('win');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({
          particleCount: 150,
          spread: 180,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF']
        });
      }
      setGameState('won');
    } else {
      setGameState('gameover');
      setScore(guaranteedPrize);
    }

    if (user && (won || guaranteedPrize > 0 || mode === 'infinite')) {
      try {
        const finalScore = won ? PRIZE_TREE[14] : (mode === 'infinite' ? score : guaranteedPrize);
        const { error } = await supabase
          .from('game_biblionario_scores')
          .insert([{
            user_id: user.id,
            mode: mode,
            score: finalScore,
            level_reached: currentLevel
          }]);
          
        if (error) console.error("Error saving score:", error);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const continueAfterAnswer = () => {
    if (showExplanation && currentQuestion && selectedOption) {
      const isIncorrect = selectedOption !== currentQuestion.correct_option.toUpperCase();
      const hasNoLivesLeft = mode === 'infinite' && lives <= 0;

      if ((mode === 'normal' && isIncorrect) || hasNoLivesLeft) {
        void endGame(false);
        return;
      }
    }

    void nextLevel();
  };

  useGameKeyboardShortcuts({
    enabled: gameState === 'playing' || gameState === 'gameover' || gameState === 'won',
    onNext: gameState === 'playing' || gameState === 'gameover' || gameState === 'won' ? () => {
      if (gameState === 'playing' && !showExplanation && selectedOption && !isLocked) lockAnswer();
      else if (gameState === 'playing' && showExplanation) continueAfterAnswer();
      else if (gameState === 'gameover' || gameState === 'won') setGameState('menu');
    } : undefined,
    onLetter: gameState === 'playing' && !isLocked && !showExplanation ? (key) => {
      if ('ABCD'.includes(key) && !hiddenOptions.includes(key)) handleOptionSelect(key);
    } : undefined,
    onNumber: gameState === 'playing' && !isLocked && !showExplanation ? (number) => {
      const optionKey = String.fromCharCode(64 + number);
      if (!hiddenOptions.includes(optionKey)) handleOptionSelect(optionKey);
    } : undefined,
    onEnter: gameState === 'playing' && selectedOption && !isLocked && !showExplanation ? () => lockAnswer() : undefined,
  });

  const withdraw = () => {
    endGame(true);
  };

  // Lifelines
  const use5050 = () => {
    if (used5050 || isLocked || !currentQuestion) return;
    gameAudioService.playLifeline();
    
    const options = ['A', 'B', 'C', 'D'];
    const incorrectOptions = options.filter(o => o !== currentQuestion.correct_option.toUpperCase());
    
    const shuffled = incorrectOptions.sort(() => 0.5 - Math.random());
    setHiddenOptions([shuffled[0], shuffled[1]]);
    setUsed5050(true);
  };

  const useAudience = () => {
    if (usedAudience || isLocked || !currentQuestion) return;
    gameAudioService.playLifeline();
    
    const options = ['A', 'B', 'C', 'D'].filter(o => !hiddenOptions.includes(o));
    const votes: Record<string, number> = {};
    
    const accuracy = Math.max(35, 95 - (currentLevel * 4)); 
    let remaining = 100;
    
    const correctVote = Math.floor(accuracy - 10 + Math.random() * 20);
    votes[currentQuestion.correct_option.toUpperCase()] = correctVote;
    remaining -= correctVote;
    
    const wrongOptions = options.filter(o => o !== currentQuestion.correct_option.toUpperCase());
    wrongOptions.forEach((opt, index) => {
      if (index === wrongOptions.length - 1) {
        votes[opt] = remaining;
      } else {
        const vote = Math.floor(Math.random() * remaining);
        votes[opt] = vote;
        remaining -= vote;
      }
    });

    setAudienceVotes(votes);
    setUsedAudience(true);
  };

  const usePhone = () => {
    if (usedPhone || isLocked || !currentQuestion) return;
    gameAudioService.playLifeline();
    
    setUsedPhone(true);
    const accuracy = Math.max(45, 90 - (currentLevel * 3));
    const isCorrect = getRandomFloat() * 100 < accuracy;
    
    const friendGuess = isCorrect 
      ? currentQuestion.correct_option.toUpperCase() 
      : ['A', 'B', 'C', 'D'].filter(o => o !== currentQuestion.correct_option.toUpperCase() && !hiddenOptions.includes(o))[0];
    
    setPhoneAdvice(`El teólogo de guardia opina: "Bendiciones. Tras consultar las Escrituras, estoy seguro en un ${accuracy}% de que la respuesta correcta es la ${friendGuess}."`);
    setPhoneModalOpen(true);
  };

  const fetchLeaderboard = useCallback(async (modeFilter: 'normal' | 'infinite' = leaderboardMode, timeFilter: 'all_time' | 'monthly' = leaderboardTimeframe) => {
    setLeaderboardLoading(true);
    try {
      let query = supabase
        .from('game_biblionario_scores')
        .select(`
          id,
          score,
          level_reached,
          mode,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('mode', modeFilter)
        .order('score', { ascending: false })
        .limit(20);

      if (timeFilter === 'monthly') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startOfMonth.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboardMode, leaderboardTimeframe]);

  useEffect(() => {
    if (gameState === 'leaderboard') {
      const timer = setTimeout(() => {
        fetchLeaderboard(leaderboardMode, leaderboardTimeframe);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [gameState, leaderboardMode, leaderboardTimeframe, fetchLeaderboard]);

  // RENDERS
  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-6xl pb-8 font-sans"
    >
      <section className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12" aria-labelledby="biblionario-title">
        <div className="text-center lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-200">
            <Sparkles size={15} aria-hidden="true" /> Concurso bíblico
          </div>
          <h1 id="biblionario-title" className="font-serif text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
            ¿Quién quiere ser <span className="text-amber-300">Biblionario?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg lg:mx-0">
            Responde, avanza de nivel y descubre cuánto sabes de las Escrituras. Elige un reto para comenzar.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5 lg:justify-start" aria-label="Características del juego">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-sm font-semibold text-slate-200"><BookOpen size={16} className="text-amber-300" aria-hidden="true" />15 preguntas</span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-sm font-semibold text-slate-200"><Shield size={16} className="text-emerald-300" aria-hidden="true" />3 niveles seguros</span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-sm font-semibold text-slate-200"><Sparkles size={16} className="text-sky-300" aria-hidden="true" />Modo supervivencia</span>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-amber-200/20 bg-slate-900 shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
          <img
            src="/images/games/covers/biblionario.webp"
            alt="Biblia abierta en el centro de un escenario de concurso"
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/10] lg:aspect-[4/3]"
            width="1440"
            height="810"
            fetchPriority="high"
            decoding="async"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/5 to-slate-950/10" />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              <BookOpen size={14} className="text-amber-300" aria-hidden="true" /> La Biblia, en el centro del desafío
            </span>
          </figcaption>
        </figure>
      </section>

      {questionLoadError && (
        <div role="alert" className="mx-auto mt-8 max-w-4xl rounded-2xl border border-rose-300/35 bg-rose-950/70 p-4 text-left text-sm text-rose-50 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <p className="leading-6">{questionLoadError}</p>
          <button type="button" disabled={questionLoading} onClick={() => void startGame(mode)} className="mt-3 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-wait disabled:opacity-60 sm:mt-0">
            <RefreshCw size={15} className={questionLoading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" />{questionLoading ? 'Cargando…' : 'Reintentar'}
          </button>
        </div>
      )}

      {questionLoading && <p role="status" className="mx-auto mt-6 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-slate-200"><RefreshCw size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Preparando tu pregunta…</p>}

      <div className="mt-8 grid w-full gap-4 md:grid-cols-2 md:gap-5" aria-busy={questionLoading}>
        <motion.button
          type="button"
          disabled={questionLoading}
          whileHover={questionLoading ? undefined : { y: -3 }}
          whileTap={questionLoading ? undefined : { scale: 0.99 }}
          className="group relative flex min-h-60 flex-col rounded-[1.6rem] border border-amber-300/25 bg-gradient-to-br from-amber-300/[0.08] via-slate-900/95 to-slate-900 p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-colors hover:border-amber-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-wait disabled:opacity-60 sm:p-7"
          onClick={() => void startGame('normal')}
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/15"><Play size={21} fill="currentColor" aria-hidden="true" /></span>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-200">15 niveles</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">Modo clásico</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
            Completa la escalera de preguntas. Asegura tu premio al llegar a los niveles 5, 10 y 15.
          </p>
          <span className="mt-6 inline-flex min-h-12 items-center justify-between gap-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.08] px-4 font-bold text-amber-100 transition group-hover:bg-amber-300/15">
            <span>{questionLoading ? 'Preparando partida…' : 'Jugar modo clásico'}</span>
            <ArrowRight size={19} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </motion.button>

        <motion.button
          type="button"
          disabled={questionLoading}
          whileHover={questionLoading ? undefined : { y: -3 }}
          whileTap={questionLoading ? undefined : { scale: 0.99 }}
          className="group relative flex min-h-60 flex-col rounded-[1.6rem] border border-indigo-300/25 bg-gradient-to-br from-indigo-400/[0.09] via-slate-900/95 to-slate-900 p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-colors hover:border-indigo-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-wait disabled:opacity-60 sm:p-7"
          onClick={() => void startGame('infinite')}
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"><Shield size={22} aria-hidden="true" /></span>
            <span className="rounded-full border border-indigo-300/25 bg-indigo-300/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">3 vidas</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">Modo supervivencia</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
            Responde tantas preguntas como puedas. Cada error consume una vida; la partida termina al perder las tres.
          </p>
          <span className="mt-6 inline-flex min-h-12 items-center justify-between gap-4 rounded-xl border border-indigo-300/25 bg-indigo-300/[0.08] px-4 font-bold text-indigo-100 transition group-hover:bg-indigo-300/15">
            <span>{questionLoading ? 'Preparando partida…' : 'Jugar supervivencia'}</span>
            <ArrowRight size={19} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </motion.button>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
        <p className="flex items-center gap-2 text-center text-sm text-slate-300 sm:text-left"><BookOpen size={16} className="shrink-0 text-amber-300" aria-hidden="true" />Después de responder, revisa la explicación bíblica para aprender más.</p>
        <button
          type="button"
          onClick={() => fetchLeaderboard()}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.05] px-4 font-bold text-white transition hover:border-amber-300/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Trophy size={17} className="text-amber-300" aria-hidden="true" /> Tabla de clasificación
        </button>
      </div>
    </motion.div>
  );

  const renderLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl font-sans"
    >
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
          <Trophy /> Salón de la Fama
        </h2>
        <button 
          onClick={() => setGameState('menu')}
          className="text-slate-400 hover:text-white transition-colors p-2"
        >
          <X />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex bg-slate-800/60 p-1 rounded-xl">
          <button
            onClick={() => setLeaderboardMode('normal')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${leaderboardMode === 'normal' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Modo Clásico
          </button>
          <button
            onClick={() => setLeaderboardMode('infinite')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${leaderboardMode === 'infinite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Modo Infinito
          </button>
        </div>
      </div>
      
      {leaderboardLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Aún no hay puntajes registrados. ¡Sé el primero en jugar!</p>
          ) : (
            leaderboard.map((entry, index) => {
              const rawProfile = entry.profiles || entry.users;
              const profileData = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
              return (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0 ? 'bg-amber-500/10 border border-amber-500/30' : 
                    index === 1 ? 'bg-slate-800/40 border border-slate-700' :
                    'bg-slate-900/50 border border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black w-8 text-center ${
                      index === 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-300">
                      {profileData?.first_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-white font-bold">{profileData?.first_name || 'Jugador'} {profileData?.last_name || ''}</p>
                      <p className="text-slate-400 text-xs">{entry.mode === 'normal' ? 'Clásico' : 'Infinito'} - Nivel {entry.level_reached}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-400">
                      {entry.score?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );

  const renderPlaying = () => {
    if (!currentQuestion) return <div className="text-white text-center py-20 font-sans">Cargando pregunta bíblica...</div>;

    const options = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d },
    ];

    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-5 pb-8 font-sans lg:flex-row lg:gap-7">
        
        {/* Main Game Arena */}
        <main aria-label="Partida del Biblionario" className="flex min-w-0 w-full flex-1 flex-col pt-2 lg:pt-4">
          
          {/* Lifelines & Control Bar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/65 p-3 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-4">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="pr-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Comodines</p>
                <p className="mt-0.5 text-xs text-slate-400">Úsalos antes de responder</p>
              </div>
              <div className="flex gap-2">
              <button 
                onClick={use5050}
                disabled={used5050 || isLocked}
                type="button"
                aria-label={used5050 ? 'Comodín cincuenta-cincuenta usado' : 'Usar comodín cincuenta-cincuenta'}
                aria-pressed={used5050}
                className={`h-11 min-w-11 rounded-xl flex items-center justify-center px-3 font-black text-sm border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
                  ${used5050 
                    ? 'border-slate-800 bg-slate-950/50 text-slate-500 cursor-not-allowed'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:border-amber-300/70 hover:bg-amber-400/20'
                  }`}
              >
                50:50
              </button>
              <button 
                onClick={usePhone}
                disabled={usedPhone || isLocked}
                type="button"
                aria-label={usedPhone ? 'Consulta al Teólogo usada' : 'Consultar al Teólogo'}
                aria-pressed={usedPhone}
                className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
                  ${usedPhone 
                    ? 'border-slate-800 bg-slate-950/50 text-slate-500 cursor-not-allowed'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:border-amber-300/70 hover:bg-amber-400/20'
                  }`}
                title="Consulta al Teólogo"
              >
                <BookOpen size={18} />
              </button>
              <button 
                onClick={useAudience}
                disabled={usedAudience || isLocked}
                type="button"
                aria-label={usedAudience ? 'Voto de la Congregación usado' : 'Pedir voto de la Congregación'}
                aria-pressed={usedAudience}
                className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
                  ${usedAudience 
                    ? 'border-slate-800 bg-slate-950/50 text-slate-500 cursor-not-allowed'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:border-amber-300/70 hover:bg-amber-400/20'
                  }`}
                title="Voto de la Congregación"
              >
                <Users size={18} />
              </button>
              </div>
            </div>
            
            <button 
              onClick={withdraw}
              disabled={isLocked || currentLevel === 1}
              type="button"
              className="min-h-11 rounded-xl px-4 text-xs font-extrabold uppercase tracking-widest text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Retirarse
            </button>
          </div>

          {/* Question Box */}
          <section aria-labelledby="biblionario-question" className="relative mb-5 w-full overflow-hidden rounded-3xl border border-amber-200/15 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/80 p-5 shadow-xl shadow-black/20 sm:p-7 md:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-amber-400/[0.07] blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  {mode === 'normal' ? 'Modo clásico' : 'Modo supervivencia'}
                </span>
                <p className="mt-1.5 text-sm font-semibold text-slate-300">
                  {mode === 'normal' ? 'Nivel' : 'Racha'} <span className="text-white">{currentLevel}</span>{mode === 'normal' ? ' de 15' : ''}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2 text-right">
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                  {mode === 'normal' ? 'Premio posible' : 'Puntos'}
                </span>
                <strong className="mt-0.5 block text-sm font-black tabular-nums text-amber-200">
                  {mode === 'normal' ? (PRIZE_TREE[currentLevel - 1] ?? 0).toLocaleString() : score.toLocaleString()} pts
                </strong>
              </div>
            </div>

            {mode === 'normal' && (
              <div
                role="progressbar"
                aria-label="Avance en el modo clásico"
                aria-valuemin={1}
                aria-valuemax={15}
                aria-valuenow={currentLevel}
                className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
              >
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-200 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(currentLevel / 15) * 100}%` }} />
              </div>
            )}

            <h2 id="biblionario-question" className="relative mt-5 text-balance text-left text-2xl font-bold leading-snug tracking-tight text-white sm:text-center sm:text-3xl md:mt-6 md:text-4xl">
              {currentQuestion.question}
            </h2>
            <p className="relative mt-2 text-xs font-medium text-slate-400 sm:text-center">Elige la respuesta que consideres correcta</p>
          </section>

          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Elige una opción</h3>
            <span className="text-xs font-medium text-slate-400">1–4 · A–D</span>
          </div>

          {/* Options Grid */}
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {options.map((opt, index) => {
              const isHidden = hiddenOptions.includes(opt.key);
              const isSelected = selectedOption === opt.key;
              const isCorrect = showExplanation && opt.key === currentQuestion.correct_option.toUpperCase();
              const isWrongChoice = showExplanation && isSelected && !isCorrect;
              
              let bgClass = "bg-slate-900/80 border-slate-800 text-white";
              
              if (isHidden) {
                return (
                  <div key={opt.key} className="h-16 rounded-2xl border border-slate-800/30 opacity-20"></div>
                );
              }

              if (isSelected && !showExplanation) {
                bgClass = "bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30";
              } else if (isCorrect) {
                bgClass = "bg-emerald-600 border-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/30";
              } else if (isWrongChoice) {
                bgClass = "bg-rose-600 border-rose-400 text-white font-bold";
              }

              return (
                <button
                  key={opt.key}
                  onClick={() => handleOptionSelect(opt.key)}
                  disabled={isLocked || showExplanation}
                  aria-pressed={isSelected}
                  aria-label={`Opción ${index + 1}, ${opt.key}: ${opt.text}`}
                  aria-keyshortcuts={`${index + 1} ${opt.key}${isSelected ? ' Shift+Enter' : ''}`}
                  className={`group relative flex min-h-[5.25rem] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-5
                    ${bgClass}
                    ${!isLocked && !isSelected ? 'hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-slate-800 motion-reduce:hover:transform-none' : ''}
                  `}
                >
                  <span className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border font-black leading-none ${isSelected && !showExplanation ? 'border-slate-950/15 bg-slate-950/10 text-slate-950' : 'border-white/10 bg-slate-950/30 text-amber-200'}`}>
                    <span className="text-base">{index + 1}</span>
                    <span className="mt-1 text-[8px] font-extrabold opacity-75">{opt.key}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-5 sm:text-base sm:leading-6">
                    {opt.text}
                  </span>
                  {showExplanation && isCorrect && <Check size={19} className="shrink-0 text-emerald-200" aria-hidden="true" />}
                  
                  {audienceVotes && !isLocked && !showExplanation && (
                    <div className="absolute right-4 bg-slate-950/80 px-2.5 py-1 rounded-lg text-xs text-amber-300 font-bold border border-amber-500/30">
                      {audienceVotes[opt.key] || 0}%
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation && currentQuestion && selectedOption && (
            <div
              role="status"
              aria-live="assertive"
              className={`mt-4 rounded-2xl border px-5 py-4 text-center font-bold ${
                selectedOption === currentQuestion.correct_option.toUpperCase()
                  ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-400/50 bg-rose-500/10 text-rose-200'
              }`}
            >
              {selectedOption === currentQuestion.correct_option.toUpperCase()
                ? '¡Respuesta correcta!'
                : `Respuesta incorrecta. La respuesta correcta es ${options.find((option) => option.key === currentQuestion.correct_option.toUpperCase())?.text ?? currentQuestion.correct_option}.`}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-1 sm:px-5">
            <GameKeyboardHint instruction="Elige con el mouse, pulsa 1–4 (también sirve el teclado numérico) o A–D; Intro confirma." nextAction="confirmar la opción elegida o continuar después de revisar la respuesta y el fundamento bíblico" tone="dark-surface" />
          </div>
          
          {/* Action Area */}
          <div className="mt-6 flex min-h-12 justify-center">
            <AnimatePresence mode="wait">
              {selectedOption && !isLocked && (
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  onClick={lockAnswer}
                  type="button"
                  aria-keyshortcuts="Enter Shift+Enter"
                  className="min-h-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-8 py-3 text-base font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-10 sm:text-lg"
                >
                  Confirmar Respuesta
                </motion.button>
              )}

              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <button 
                    onClick={continueAfterAnswer}
                    aria-keyshortcuts="Shift+Enter"
                    type="button"
                    className="min-h-12 rounded-full bg-indigo-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-indigo-950/30 transition-colors hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-10 sm:text-lg"
                  >
                    {selectedOption !== currentQuestion.correct_option.toUpperCase()
                      && (mode === 'normal' || lives <= 0)
                      ? 'Ver resultados'
                      : mode === 'normal' && currentLevel === 15
                        ? 'Ver resultados'
                        : 'Siguiente Pregunta'} <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Scripture Verse Explanation Modal Card */}
          <AnimatePresence>
            {showExplanation && currentQuestion.explanation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-slate-900/90 border border-amber-500/30 rounded-2xl relative backdrop-blur-xl shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 shrink-0 border border-amber-500/20">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-1">Fundamento Bíblico:</h4>
                    <p className="text-slate-200 leading-relaxed text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Teólogo Lifeline Modal */}
          <AnimatePresence>
            {phoneModalOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
              >
                <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30 text-amber-400">
                    <BookOpen size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Consulta al Teólogo</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">{phoneAdvice}</p>
                  <button 
                    onClick={() => setPhoneModalOpen(false)}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                  >
                    Entendido
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* Money Tree Sidebar */}
        <aside aria-label={mode === 'normal' ? 'Escalera de premios' : 'Estado de supervivencia'} className="w-full shrink-0 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/10 backdrop-blur-xl lg:sticky lg:top-6 lg:w-64">
          {mode === 'normal' ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Escalera de premios</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">Niveles seguros: 5, 10 y 15</p>
                </div>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-extrabold text-amber-100">{currentLevel}/15</span>
              </div>
              <ol className="flex snap-x snap-mandatory flex-row gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {PRIZE_TREE.map((prize, idx) => {
                  const lvl = idx + 1;
                  const isCurrent = currentLevel === lvl;
                  const isPassed = currentLevel > lvl;
                  const isSafe = SAFE_HAVENS.includes(idx);

                  return (
                    <li
                      key={lvl}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Nivel ${lvl}: ${prize.toLocaleString()} puntos${isSafe ? ', nivel seguro' : ''}${isCurrent ? ', nivel actual' : ''}`}
                      className={`flex min-w-[136px] snap-start items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-bold tabular-nums transition-colors lg:min-w-0 lg:border-transparent lg:py-1.5 ${
                        isCurrent
                          ? 'border-amber-300/50 bg-amber-400 text-slate-950 shadow-md shadow-amber-500/15 lg:border-amber-300/40'
                          : isPassed
                            ? 'border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100/80 lg:bg-transparent'
                            : isSafe
                              ? 'border-white/10 bg-white/[0.04] text-slate-200 lg:bg-transparent'
                              : 'border-white/[0.06] bg-slate-950/25 text-slate-400 lg:bg-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-black/10 text-[11px]">{lvl}</span>
                        <span>{isSafe ? 'Seguro' : 'Nivel'}</span>
                      </span>
                      <span>{prize.toLocaleString()} pts</span>
                    </li>
                  );
                }).reverse()}
              </ol>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 p-1 sm:p-2">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-300" aria-hidden="true" />
                  <h3 className="text-sm font-extrabold text-white">Supervivencia</h3>
                </div>
                <p className="mt-1 text-xs text-slate-400">Racha de {currentLevel} {currentLevel === 1 ? 'pregunta' : 'preguntas'}</p>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Puntaje</div>
                <div className="mt-0.5 text-xl font-black tabular-nums text-amber-200">{score.toLocaleString()}</div>
              </div>
              <div className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-slate-950/30 px-3 py-2 sm:w-auto sm:min-w-40">
                <span className="text-xs font-semibold text-slate-300">Vidas restantes</span>
                <span className="flex gap-1.5" role="img" aria-label={`${lives} de 3 vidas`}>
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`h-4 w-4 ${i < lives ? 'fill-rose-400 text-rose-300' : 'text-slate-600'}`}
                    aria-hidden="true"
                  />
                ))}
                </span>
              </div>
            </div>
          )}
        </aside>
        
      </div>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 pt-20 text-white pb-28 xl:pb-10">
      <Helmet>
        <title>Biblionario | Juegos Bíblicos</title>
        <meta name="theme-color" content="#020617" />
      </Helmet>
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[38rem] rounded-full bg-amber-500/[0.08] blur-[140px]"></div>
        <div className="absolute -right-48 top-20 h-[30rem] w-[34rem] rounded-full bg-blue-500/[0.08] blur-[150px]"></div>
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'linear-gradient(to bottom, black, transparent 80%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 h-full flex flex-col font-sans">
        {/* Header navigation bar */}
        <div className="mb-8 flex min-h-11 items-center justify-between">
          <Link to="/recursos/juegos" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
            <ArrowLeft size={17} aria-hidden="true" /> Volver a juegos
          </Link>
          
          <button 
            onClick={handleToggleSound}
            type="button"
            aria-label={soundEnabled ? 'Silenciar el sonido' : 'Activar el sonido'}
            aria-pressed={soundEnabled}
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {soundEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
          </button>
        </div>

        {gameState === 'menu' && renderMenu()}
        {gameState === 'leaderboard' && renderLeaderboard()}
        {gameState === 'playing' && renderPlaying()}
        
        {/* Game Over Modal */}
        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 text-center max-w-md w-full shadow-2xl">
                <X className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">¡Fin de la Partida!</h2>
                <p className="text-slate-300 text-sm mb-6">
                  Puntaje obtenido: <br/>
                  <span className="text-4xl font-black text-amber-400 mt-2 block">{score.toLocaleString()} pts</span>
                </p>
                <button onClick={() => setGameState('menu')} aria-keyshortcuts="Shift+Enter" className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                  Volver al Menú
                </button>
                <GameKeyboardHint instruction="También puedes volver al menú con el teclado." nextAction="volver al menú" />
              </div>
            </motion.div>
          )}
          
          {/* Victory Modal */}
          {gameState === 'won' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-8 md:p-10 text-center max-w-md w-full shadow-2xl">
                <Crown className="w-20 h-20 text-amber-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-1">¡FELICIDADES!</h2>
                <h3 className="text-lg text-amber-400 font-bold mb-4">¡ERES UN BIBLIONARIO!</h3>
                <p className="text-slate-300 text-sm mb-6">
                  Has completado exitosamente los 15 niveles bíblicos.
                </p>
                <button onClick={() => setGameState('menu')} aria-keyshortcuts="Shift+Enter" className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-colors">
                  Jugar de Nuevo
                </button>
                <GameKeyboardHint instruction="También puedes volver al menú con el teclado." nextAction="volver al menú" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
    </MotionConfig>
  );
};
