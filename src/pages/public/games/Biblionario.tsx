import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Trophy, Heart, Users, X, Play,
  Volume2, VolumeX, Shield, Crown, Sparkles, BookOpen,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';
import { gameAudioService } from '../../../features/games/services/gameAudioService';

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
  
  // Anti-repetition tracking per session
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);

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

  const fetchQuestionForLevel = async (level: number, gameMode: 'normal' | 'infinite') => {
    try {
      const fetchLevel = gameMode === 'normal' ? level : Math.min(level, 15);
      
      const { data, error } = await supabase
        .from('game_biblionario_questions')
        .select('*')
        .eq('difficulty_level', fetchLevel);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Anti-repetition: Filter out already used questions in this session if possible
        const unusedQuestions = data.filter(q => !usedQuestionIds.includes(q.id));
        const pool = unusedQuestions.length > 0 ? unusedQuestions : data;
        
        const randomIndex = Math.floor(getRandomFloat() * pool.length);
        const selected = pool[randomIndex];
        
        setCurrentQuestion(selected);
        setUsedQuestionIds(prev => [...prev, selected.id]);
      } else {
        if (level > 1) {
          fetchQuestionForLevel(level - 1, gameMode);
        } else {
          console.error("No questions available in the database.");
          setGameState('menu');
        }
      }
    } catch (err) {
      console.error('Error fetching question:', err);
    }
  };

  const startGame = async (selectedMode: 'normal' | 'infinite') => {
    setMode(selectedMode);
    setCurrentLevel(1);
    setScore(0);
    setGuaranteedPrize(0);
    setLives(selectedMode === 'infinite' ? 3 : 1);
    setUsedQuestionIds([]);
    
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
    
    await fetchQuestionForLevel(1, selectedMode);
    setGameState('playing');
  };

  const handleOptionSelect = (optionKey: string) => {
    if (isLocked || hiddenOptions.includes(optionKey)) return;
    setSelectedOption(optionKey);
  };

  const lockAnswer = () => {
    if (!selectedOption || !currentQuestion) return;
    
    setIsLocked(true);
    playEffect('finalAnswer');
    
    setTimeout(() => {
      checkAnswer();
    }, 2000);
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
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF']
        });
      }
      
      setTimeout(() => {
        setShowExplanation(true);
      }, 1000);

    } else {
      playEffect('wrong');
      if (mode === 'infinite') {
        const remainingLives = lives - 1;
        setLives(remainingLives);
        
        setTimeout(() => {
          setShowExplanation(true);
        }, 1000);
      } else {
        setTimeout(() => {
          endGame(false);
        }, 2000);
      }
    }
  };

  const nextLevel = () => {
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
    
    fetchQuestionForLevel(nextLvl, mode);
  };

  const endGame = async (won: boolean) => {
    stopAllAudio();
    if (won) {
      playEffect('win');
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF']
      });
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[65vh] max-w-4xl mx-auto text-center font-sans"
    >
      <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-indigo-900 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-8 border-4 border-amber-400 relative overflow-hidden group">
        <Crown className="w-16 h-16 text-amber-300 relative z-10 animate-bounce" />
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 mb-4 tracking-tight">
        ¿Quién Quiere Ser <br/>
        <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)] uppercase tracking-widest">Biblionario?</span>
      </h1>
      
      <p className="text-lg text-slate-300 mb-10 max-w-2xl font-light">
        Pon a prueba tus conocimientos bíblicos, supera los 15 niveles de sabiduría y conviértete en un maestro de las Escrituras.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 mb-10 max-w-5xl mx-auto">
        {/* CLASSIC MODE CARD */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden group cursor-pointer"
          onClick={() => startGame('normal')}
        >
          <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 group-hover:border-amber-400 shadow-2xl transition-all duration-300 flex flex-col h-full z-10 overflow-hidden">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
              <Play className="w-7 h-7 text-white fill-current" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 text-left">Modo Clásico</h3>
            
            <p className="text-slate-300 text-left mb-8 flex-grow leading-relaxed text-sm">
              El desafío bíblico supremo. <span className="text-amber-300 font-bold">15 niveles</span> de conocimiento bíblico progresivo con 3 escalones de seguridad.
            </p>
            
            <div className="flex items-center text-amber-400 font-bold group-hover:text-amber-300 transition-colors mt-auto bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
              <span className="flex-grow text-left">Comenzar Aventura</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
        
        {/* INFINITE MODE CARD */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden group cursor-pointer"
          onClick={() => startGame('infinite')}
        >
          <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-indigo-500/30 group-hover:border-indigo-400 shadow-2xl transition-all duration-300 flex flex-col h-full z-10 overflow-hidden">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 text-left flex items-center justify-between w-full">
              Modo Infinito
              <span className="text-[10px] px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30 font-bold uppercase">Supervivencia</span>
            </h3>
            
            <p className="text-slate-300 text-left mb-8 flex-grow leading-relaxed text-sm">
              Sobrevive el mayor tiempo posible respondiendo preguntas aleatorias con solo <span className="text-indigo-300 font-bold">3 vidas</span>.
            </p>
            
            <div className="flex items-center text-indigo-300 font-bold group-hover:text-indigo-200 transition-colors mt-auto bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
              <span className="flex-grow text-left">Desafío Infinito</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </div>

      <button
        onClick={() => fetchLeaderboard()}
        className="px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full font-bold text-base backdrop-blur-md transition-all border border-slate-700 flex items-center justify-center gap-3"
      >
        <Trophy className="w-5 h-5 text-amber-400" /> Tabla de Clasificación
      </button>
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
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 min-h-[70vh] max-w-7xl mx-auto pb-8 font-sans">
        
        {/* Main Game Arena */}
        <div className="flex-1 flex flex-col pt-4">
          
          {/* Lifelines & Control Bar */}
          <div className="flex justify-between items-center mb-8 px-4 bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-800">
            <div className="flex gap-3">
              <button 
                onClick={use5050}
                disabled={used5050 || isLocked}
                className={`w-14 h-10 rounded-xl flex items-center justify-center font-black text-sm border transition-all
                  ${used5050 
                    ? 'border-slate-800 bg-slate-950/50 text-slate-600 cursor-not-allowed' 
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  }`}
              >
                50:50
              </button>
              <button 
                onClick={usePhone}
                disabled={usedPhone || isLocked}
                className={`w-14 h-10 rounded-xl flex items-center justify-center border transition-all
                  ${usedPhone 
                    ? 'border-slate-800 bg-slate-950/50 text-slate-600 cursor-not-allowed' 
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  }`}
                title="Consulta al Teólogo"
              >
                <BookOpen size={18} />
              </button>
              <button 
                onClick={useAudience}
                disabled={usedAudience || isLocked}
                className={`w-14 h-10 rounded-xl flex items-center justify-center border transition-all
                  ${usedAudience 
                    ? 'border-slate-800 bg-slate-950/50 text-slate-600 cursor-not-allowed' 
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  }`}
                title="Voto de la Congregación"
              >
                <Users size={18} />
              </button>
            </div>
            
            <button 
              onClick={withdraw}
              disabled={isLocked || currentLevel === 1}
              className="text-slate-400 hover:text-amber-400 transition-colors text-xs uppercase tracking-widest font-bold"
            >
              Retirarse
            </button>
          </div>

          {/* Question Box */}
          <div className="relative w-full mb-8">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 md:p-10 text-center shadow-2xl relative overflow-hidden">
              <span className="text-amber-400 font-bold text-xs tracking-widest uppercase mb-4 block">
                Nivel {currentLevel} de 15
              </span>

              <h2 className="text-xl md:text-3xl text-white font-bold leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt) => {
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
                  disabled={isLocked}
                  className={`relative min-h-[4.5rem] rounded-2xl border-2 transition-all duration-300 flex items-center px-6 py-3
                    ${bgClass}
                    ${!isLocked && !isSelected ? 'hover:bg-slate-800 hover:border-amber-500/50 transform hover:-translate-y-0.5' : ''}
                  `}
                >
                  <span className={`font-black text-lg mr-4 ${isSelected && !showExplanation ? 'text-slate-950' : 'text-amber-400'}`}>
                    {opt.key}:
                  </span>
                  <span className="text-base font-medium text-left truncate w-full">
                    {opt.text}
                  </span>
                  
                  {audienceVotes && !isLocked && !showExplanation && (
                    <div className="absolute right-4 bg-slate-950/80 px-2.5 py-1 rounded-lg text-xs text-amber-300 font-bold border border-amber-500/30">
                      {audienceVotes[opt.key] || 0}%
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Action Area */}
          <div className="mt-8 flex justify-center min-h-[4rem]">
            <AnimatePresence mode="wait">
              {selectedOption && !isLocked && (
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  onClick={lockAnswer}
                  className="px-10 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-lg rounded-full shadow-lg shadow-amber-500/30 hover:scale-105 transition-transform"
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
                    onClick={nextLevel}
                    className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-full shadow-lg flex items-center gap-2"
                  >
                    Siguiente Pregunta <ArrowRight size={20} />
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
          
        </div>
        
        {/* Money Tree Sidebar */}
        <div className="w-full lg:w-64 shrink-0 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col-reverse lg:flex-col overflow-y-auto max-h-48 lg:max-h-[70vh]">
          {mode === 'normal' ? (
            PRIZE_TREE.map((prize, idx) => {
              const lvl = idx + 1;
              const isCurrent = currentLevel === lvl;
              const isPassed = currentLevel > lvl;
              const isSafe = SAFE_HAVENS.includes(idx);
              
              return (
                <div 
                  key={lvl}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl mb-1 font-bold text-xs font-mono transition-colors
                    ${isCurrent ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 
                      isPassed ? 'text-amber-400' : 
                      isSafe ? 'text-white' : 'text-slate-500'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-right">{lvl}</span>
                    <span className="opacity-50">♦</span>
                  </span>
                  <span>{prize.toLocaleString()} pts</span>
                </div>
              );
            }).reverse()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Shield className="w-12 h-12 text-indigo-400 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-white mb-2">Supervivencia</h3>
              <div className="flex gap-2 mb-6">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`w-6 h-6 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`} 
                  />
                ))}
              </div>
              <div className="text-3xl font-black text-amber-400">
                {score.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Puntos</div>
            </div>
          )}
        </div>
        
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20 pb-10 overflow-hidden relative">
      <Helmet>
        <title>Biblionario | Juegos Bíblicos</title>
        <meta name="theme-color" content="#020617" />
      </Helmet>
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 h-full flex flex-col font-sans">
        {/* Header navigation bar */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/recursos/juegos" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <X size={16} /> Salir al Catálogo
          </Link>
          
          <button 
            onClick={handleToggleSound}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
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
                <button onClick={() => setGameState('menu')} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                  Volver al Menú
                </button>
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
                <button onClick={() => setGameState('menu')} className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-colors">
                  Jugar de Nuevo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
