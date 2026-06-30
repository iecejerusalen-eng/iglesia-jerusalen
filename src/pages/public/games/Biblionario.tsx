import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Trophy, Heart, Users, Phone, X, Play, 
  Volume2, VolumeX, Shield, Crown,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';
import { useRef } from 'react';

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

const PRIZE_TREE = [
  500, 1000, 2000, 3000, 5000, // Nivel 1-5 (Seguro 5000)
  10000, 20000, 30000, 50000, 100000, // Nivel 6-10 (Seguro 100000)
  200000, 300000, 500000, 750000, 1000000 // Nivel 11-15 (Biblionario)
];

const SAFE_HAVENS = [4, 9, 14]; // Index of safe havens (Niveles 5, 10, 15)

// Removed external audio files, using Web Audio API instead for reliability

export const Biblionario = () => {
  const { user } = useAuthStore();
  
  // Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'won' | 'leaderboard'>('menu');
  const [mode, setMode] = useState<'normal' | 'infinite'>('normal');
  const [musicType, setMusicType] = useState<'tv' | 'instrumental'>('tv');
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
  
  // Player Stats
  const [score, setScore] = useState(0);
  const [guaranteedPrize, setGuaranteedPrize] = useState(0);
  const [lives, setLives] = useState(3);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<'normal' | 'infinite'>('normal');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'all_time' | 'monthly'>('all_time');

  // Audio Assets
  const [audioAssets, setAudioAssets] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const { data, error } = await supabase.from('game_audio_assets').select('*');
        if (!error && data) {
          const assetsMap: Record<string, string> = {};
          data.forEach(item => {
            if (item.tags && item.tags.includes('correct')) assetsMap['correct'] = item.file_url;
            if (item.tags && item.tags.includes('wrong')) assetsMap['wrong'] = item.file_url;
            if (item.tags && item.tags.includes('suspense')) assetsMap['suspense'] = item.file_url;
            if (item.tags && item.tags.includes('win')) assetsMap['win'] = item.file_url;
            if (item.tags && item.tags.includes('finalAnswer')) assetsMap['finalAnswer'] = item.file_url;
            if (item.tags && item.tags.includes('tv_bgm')) assetsMap['tv_bgm'] = item.file_url;
            if (item.tags && item.tags.includes('instrumental_bgm')) assetsMap['instrumental_bgm'] = item.file_url;
          });
          setAudioAssets(assetsMap);
        }
      } catch (err) {
        console.error("Error fetching audio assets:", err);
      }
    };
    fetchAudio();
  }, []);
  
  // Web Audio API Synth
  const playBeep = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log("Audio not supported", e);
    }
  };

  const stopAllAudio = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  };

  const playEffect = (type: 'correct' | 'wrong' | 'finalAnswer' | 'win' | 'suspense') => {
    if (!soundEnabled) return;
    
    // Play dynamic audio if available
    if (audioAssets[type]) {
      const audio = new Audio(audioAssets[type]);
      audio.play().catch(e => console.log('Audio playback failed', e));
      return; // Skip fallback if we played dynamic audio
    }

    // Fallback Web Audio API effects
    if (type === 'correct') {
      playBeep(800, 'sine', 0.1, 0.1);
      setTimeout(() => playBeep(1200, 'sine', 0.3, 0.1), 100);
    } else if (type === 'wrong') {
      // Comedic trombone-like effect
      playBeep(200, 'sawtooth', 0.3, 0.1);
      setTimeout(() => playBeep(150, 'sawtooth', 0.4, 0.1), 300);
      setTimeout(() => playBeep(100, 'sawtooth', 0.6, 0.1), 700);
    } else if (type === 'finalAnswer') {
      playBeep(400, 'square', 0.8, 0.05);
    } else if (type === 'suspense') {
      // Drumroll simulation
      let delay = 0;
      for (let i = 0; i < 20; i++) {
        setTimeout(() => playBeep(100 + Math.random() * 50, 'square', 0.05, 0.05), delay);
        delay += 100;
      }
    } else if (type === 'win') {
      [400, 500, 600, 800].forEach((freq, i) => {
        setTimeout(() => playBeep(freq, 'sine', 0.2, 0.1), i * 150);
      });
    }
  };

  const fetchQuestionForLevel = async (level: number, gameMode: 'normal' | 'infinite') => {
    try {
      // En modo infinito, si pasamos el nivel 15, seguimos trayendo preguntas de nivel 15 (las más difíciles)
      const fetchLevel = gameMode === 'normal' ? level : Math.min(level, 15);
      
      const { data, error } = await supabase
        .from('game_biblionario_questions')
        .select('*')
        .eq('difficulty_level', fetchLevel);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Seleccionar una pregunta aleatoria de este nivel
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentQuestion(data[randomIndex]);
      } else {
        // Fallback: Si no hay preguntas de este nivel, traer cualquiera del nivel anterior
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
    
    // Reset lifelines
    setUsed5050(false);
    setUsedPhone(false);
    setUsedAudience(false);
    setHiddenOptions([]);
    setAudienceVotes(null);
    
    // Reset interaction
    setSelectedOption(null);
    setIsLocked(false);
    setShowExplanation(false);
    
    await fetchQuestionForLevel(1, selectedMode);
    setGameState('playing');
    
    if (soundEnabled) {
      const bgmUrl = selectedMode === 'normal' 
        ? (musicType === 'tv' ? audioAssets['tv_bgm'] : audioAssets['instrumental_bgm'])
        : audioAssets['instrumental_bgm']; // Default to instrumental for infinite
        
      if (bgmUrl) {
        if (bgmRef.current) {
          bgmRef.current.pause();
        }
        bgmRef.current = new Audio(bgmUrl);
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.2;
        bgmRef.current.play().catch(e => console.log('BGM blocked:', e));
      }
    }
  };

  const handleOptionSelect = (optionKey: string) => {
    if (isLocked || hiddenOptions.includes(optionKey)) return;
    setSelectedOption(optionKey);
  };

  const lockAnswer = () => {
    if (!selectedOption || !currentQuestion) return;
    
    setIsLocked(true);
    playEffect('finalAnswer');
    playEffect('suspense');
    
    // Add suspense delay
    setTimeout(() => {
      checkAnswer();
    }, 3000);
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
        playEffect('win'); // Ovación
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF']
        });
      }
      
      setTimeout(() => {
        setShowExplanation(true);
      }, 1500);

    } else {
      playEffect('wrong');
      if (mode === 'infinite') {
        const remainingLives = lives - 1;
        setLives(remainingLives);
        
        setTimeout(() => {
          setShowExplanation(true);
        }, 1500);
      } else {
        setTimeout(() => {
          endGame(false);
        }, 3000);
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
      // If lost, score becomes the guaranteed prize
      setScore(guaranteedPrize);
    }

    // Save score if user is logged in
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
    endGame(true); // Treating withdraw as a win with current score
  };

  // Lifelines
  const use5050 = () => {
    if (used5050 || isLocked || !currentQuestion) return;
    
    const options = ['A', 'B', 'C', 'D'];
    const incorrectOptions = options.filter(o => o !== currentQuestion.correct_option.toUpperCase());
    
    // Shuffle and pick 2 incorrect to hide
    const shuffled = incorrectOptions.sort(() => 0.5 - Math.random());
    setHiddenOptions([shuffled[0], shuffled[1]]);
    setUsed5050(true);
  };

  const useAudience = () => {
    if (usedAudience || isLocked || !currentQuestion) return;
    
    const options = ['A', 'B', 'C', 'D'].filter(o => !hiddenOptions.includes(o));
    const votes: Record<string, number> = {};
    
    // Logic: Higher level = dumber audience. 
    // Level 1: 90% correct. Level 15: 30% correct.
    const accuracy = Math.max(30, 95 - (currentLevel * 4)); 
    let remaining = 100;
    
    // Correct gets base random % based on accuracy
    const correctVote = Math.floor(accuracy - 10 + Math.random() * 20);
    votes[currentQuestion.correct_option.toUpperCase()] = correctVote;
    remaining -= correctVote;
    
    // Distribute remaining
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
    
    // Simular llamada (solo mostramos el modal visual)
    setUsedPhone(true);
    // Para simplificar, la llamada al amigo se integra usando un alert o modal custom.
    // Vamos a usar un estado temporal aquí o mostrarlo directo:
    const accuracy = Math.max(40, 90 - (currentLevel * 3));
    const isCorrect = Math.random() * 100 < accuracy;
    
    const friendGuess = isCorrect 
      ? currentQuestion.correct_option.toUpperCase() 
      : ['A', 'B', 'C', 'D'].filter(o => o !== currentQuestion.correct_option.toUpperCase() && !hiddenOptions.includes(o))[0];
    
    alert(`Amigo: "¡Hola! He estado leyendo sobre esto. ${isCorrect ? 'Estoy bastante seguro' : 'Creo, aunque no estoy 100% seguro'} que la respuesta correcta es la ${friendGuess}."`);
  };

  const fetchLeaderboard = async (modeFilter: 'normal' | 'infinite' = leaderboardMode, timeFilter: 'all_time' | 'monthly' = leaderboardTimeframe) => {
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
      setGameState('leaderboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (gameState === 'leaderboard') {
      fetchLeaderboard(leaderboardMode, leaderboardTimeframe);
    }
  }, [leaderboardMode, leaderboardTimeframe]);


  // RENDERS
  const renderMenu = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] max-w-4xl mx-auto text-center"
    >
      <div className="w-32 h-32 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8 border-4 border-gold relative overflow-hidden group">
        <div className="absolute inset-0 bg-gold/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Crown className="w-16 h-16 text-gold relative z-10" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-300 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tracking-tight">
        ¿Quién quiere ser <br/>
        <span className="text-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] uppercase tracking-widest">Biblionario?</span>
      </h1>
      
      <p className="text-xl text-blue-200 mb-12 max-w-2xl font-light">
        Pon a prueba tus conocimientos bíblicos, usa tus comodines sabiamente y alcanza la gloria celestial.
      </p>

      {/* AUDIO SELECTION TOGGLE */}
      <div className="mb-10 p-2 bg-blue-900/40 rounded-2xl backdrop-blur-sm border border-blue-500/30 inline-flex shadow-lg">
        <button
          onClick={() => setMusicType('tv')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            musicType === 'tv' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : 'text-blue-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Volume2 className="w-5 h-5" /> Música Concurso TV
        </button>
        <button
          onClick={() => setMusicType('instrumental')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            musicType === 'instrumental' 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' 
              : 'text-blue-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Volume2 className="w-5 h-5" /> Música Instrumental
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 mb-10 max-w-5xl mx-auto">
        {/* CLASSIC MODE CARD */}
        <motion.div 
          whileHover={{ y: -12, scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative overflow-hidden group cursor-pointer"
          onClick={() => startGame('normal')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/40 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100"></div>
          <div className="relative bg-[#0a1128]/80 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30 group-hover:border-blue-400 shadow-2xl transition-all duration-300 flex flex-col h-full z-10 overflow-hidden">
            {/* Decorative background shape */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-400/20 transition-all duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-shadow relative z-20">
              <Play className="w-8 h-8 text-white fill-current" />
            </div>
            
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 mb-3 text-left tracking-tight">Modo Clásico</h3>
            
            <p className="text-blue-200/80 text-left mb-8 flex-grow leading-relaxed font-medium">
              El desafío tradicional de TV. <span className="text-white font-bold">15 preguntas</span> de dificultad progresiva con 3 zonas seguras. Si fallas sin seguro, ¡lo pierdes todo!
            </p>
            
            <div className="flex items-center text-blue-400 font-bold group-hover:text-blue-300 transition-colors mt-auto bg-blue-900/30 p-4 rounded-xl border border-blue-500/20 group-hover:border-blue-400/50">
              <span className="flex-grow">Comenzar Aventura</span>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* INFINITE / HARDCORE MODE CARD */}
        <motion.div 
          whileHover={{ y: -12, scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="relative overflow-hidden group cursor-pointer"
          onClick={() => startGame('infinite')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-900/40 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100"></div>
          <div className="relative bg-[#0a1128]/80 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 group-hover:border-purple-400 shadow-2xl transition-all duration-300 flex flex-col h-full z-10 overflow-hidden">
            {/* Decorative background shape */}
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-400/20 transition-all duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-shadow relative z-20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-3 text-left tracking-tight flex items-center justify-between w-full">
              Modo Infinito
              <span className="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-md border border-red-500/30 font-black tracking-widest uppercase">Hardcore</span>
            </h3>
            
            <p className="text-purple-200/80 text-left mb-8 flex-grow leading-relaxed font-medium">
              Sobrevive el mayor tiempo posible a preguntas aleatorias cada vez más complejas. Solo tienes <span className="text-white font-bold">3 vidas</span>. ¿Hasta dónde llegarás?
            </p>
            
            <div className="flex items-center text-purple-400 font-bold group-hover:text-purple-300 transition-colors mt-auto bg-purple-900/30 p-4 rounded-xl border border-purple-500/20 group-hover:border-purple-400/50">
              <span className="flex-grow">Desafío Infinito</span>
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/40 transition-colors">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <button
        onClick={() => fetchLeaderboard()}
        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold text-lg backdrop-blur-sm transition-all border border-white/10 flex items-center justify-center gap-3 mx-auto"
      >
        <Trophy /> Ver Tabla de Clasificación
      </button>
      
      {!user && (
        <p className="mt-8 text-blue-300/60 text-sm">
          Inicia sesión para que tus puntajes se guarden en la tabla de clasificación.
        </p>
      )}
    </motion.div>
  );

  const renderLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-[#0a1128] border border-blue-900/50 rounded-2xl p-6 md:p-8 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-900">
        <h2 className="text-3xl font-serif font-bold text-gold flex items-center gap-3">
          <Trophy /> Salón de la Fama
        </h2>
        <button 
          onClick={() => setGameState('menu')}
          className="text-blue-300 hover:text-white transition-colors p-2"
        >
          <X />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex bg-blue-900/40 p-1 rounded-xl">
          <button
            onClick={() => setLeaderboardMode('normal')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${leaderboardMode === 'normal' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:text-white'}`}
          >
            Modo Clásico
          </button>
          <button
            onClick={() => setLeaderboardMode('infinite')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${leaderboardMode === 'infinite' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'}`}
          >
            Modo Infinito
          </button>
        </div>
        
        <div className="flex bg-blue-900/40 p-1 rounded-xl">
          <button
            onClick={() => setLeaderboardTimeframe('all_time')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${leaderboardTimeframe === 'all_time' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:text-white'}`}
          >
            Histórico
          </button>
          <button
            onClick={() => setLeaderboardTimeframe('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${leaderboardTimeframe === 'monthly' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:text-white'}`}
          >
            Este Mes
          </button>
        </div>
      </div>
      
      {leaderboardLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-center text-blue-300 py-8">Aún no hay puntajes registrados. ¡Sé el primero!</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div 
                key={entry.id} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-900/40 to-transparent border border-gold/30' : 
                  index === 1 ? 'bg-gradient-to-r from-gray-500/20 to-transparent border border-gray-400/30' :
                  index === 2 ? 'bg-gradient-to-r from-orange-900/30 to-transparent border border-orange-500/30' :
                  'bg-blue-900/20 border border-blue-800/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold w-8 text-center ${
                    index === 0 ? 'text-gold' : 
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' : 'text-blue-400'
                  }`}>
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-blue-800 overflow-hidden flex items-center justify-center">
                    {entry.users?.avatar_url ? (
                      <img src={entry.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-300 font-bold">
                        {entry.users?.first_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold">{entry.users?.first_name} {entry.users?.last_name}</p>
                    <p className="text-blue-400 text-sm">{entry.mode === 'normal' ? 'Clásico' : 'Infinito'} - Nivel {entry.level_reached}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold drop-shadow-md">
                    {entry.score.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );

  const renderPlaying = () => {
    if (!currentQuestion) return <div className="text-white text-center py-20">Cargando pregunta...</div>;

    const options = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d },
    ];

    const isWinner = gameState === 'won';
    const isLoser = gameState === 'gameover';

    return (
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 min-h-[70vh] max-w-7xl mx-auto pb-8">
        
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col pt-4">
          
          {/* Lifelines & Header */}
          <div className="flex justify-between items-center mb-8 px-4">
            <div className="flex gap-4">
              <button 
                onClick={use5050}
                disabled={used5050 || isLocked}
                className={`w-14 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all
                  ${used5050 
                    ? 'border-red-900/50 bg-red-900/20 text-red-900/50 cursor-not-allowed' 
                    : 'border-blue-400 text-white hover:bg-blue-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  }`}
              >
                50:50
              </button>
              <button 
                onClick={usePhone}
                disabled={usedPhone || isLocked}
                className={`w-14 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${usedPhone 
                    ? 'border-red-900/50 bg-red-900/20 text-red-900/50 cursor-not-allowed' 
                    : 'border-blue-400 text-white hover:bg-blue-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  }`}
              >
                <Phone size={20} />
              </button>
              <button 
                onClick={useAudience}
                disabled={usedAudience || isLocked}
                className={`w-14 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${usedAudience 
                    ? 'border-red-900/50 bg-red-900/20 text-red-900/50 cursor-not-allowed' 
                    : 'border-blue-400 text-white hover:bg-blue-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  }`}
              >
                <Users size={20} />
              </button>
            </div>
            
            <button 
              onClick={withdraw}
              disabled={isLocked || currentLevel === 1}
              className="text-white hover:text-gold transition-colors text-sm uppercase tracking-wider font-bold"
            >
              Retirarse
            </button>
          </div>

          {/* Question Box */}
          <div className="relative w-full mb-8">
            {/* Hexagon style shape using CSS borders and clip-path */}
            <div className="bg-gradient-to-b from-[#0a1540] to-[#04081c] border-t-2 border-b-2 border-blue-500 rounded-3xl p-6 md:p-12 shadow-[0_0_40px_rgba(37,99,235,0.3)] text-center relative overflow-hidden ring-1 ring-blue-500/20">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
              
              <span className="text-gold font-bold text-sm tracking-widest uppercase mb-4 block">
                Pregunta {currentLevel}
              </span>
              
              {currentQuestion.image_url && (
                <div className="mb-6 flex justify-center">
                  <img 
                    src={currentQuestion.image_url} 
                    alt="Question visual" 
                    className="max-h-48 md:max-h-64 object-contain rounded-xl shadow-lg border border-blue-500/30"
                  />
                </div>
              )}

              <h2 className="text-2xl md:text-3xl lg:text-4xl text-white font-serif leading-relaxed drop-shadow-md">
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
              
              // Base class
              let bgClass = "bg-[#0b1336] border-blue-600 shadow-[inset_0_0_20px_rgba(37,99,235,0.15)]";
              let textClass = "text-white";
              
              if (isHidden) {
                return (
                  <div key={opt.key} className="h-16 md:h-20 rounded-full border-2 border-transparent"></div>
                );
              }

              if (isSelected && !showExplanation) {
                bgClass = "bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]";
                textClass = "text-black";
              } else if (isCorrect) {
                bgClass = "bg-gradient-to-r from-green-500 to-green-600 border-green-300 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse";
                textClass = "text-white";
              } else if (isWrongChoice) {
                bgClass = "bg-gradient-to-r from-red-500 to-red-600 border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
                textClass = "text-white";
              }

              return (
                <button
                  key={opt.key}
                  onClick={() => handleOptionSelect(opt.key)}
                  disabled={isLocked}
                  className={`relative group min-h-[5rem] rounded-2xl border-2 transition-all duration-300 flex items-center px-6 overflow-hidden py-3 h-auto
                    ${bgClass}
                    ${!isLocked && !isSelected ? 'hover:bg-[#15235b] hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] transform hover:-translate-y-1' : ''}
                  `}
                >
                  <span className={`font-black text-xl md:text-2xl mr-4 ${isSelected && !showExplanation ? 'text-black' : 'text-gold'}`}>
                    {opt.key}:
                  </span>
                  <span className={`text-lg md:text-xl font-medium text-left truncate w-full ${textClass}`}>
                    {opt.text}
                  </span>
                  
                  {audienceVotes && !isLocked && !showExplanation && (
                    <div className="absolute right-4 bg-black/50 px-3 py-1 rounded text-sm text-gold font-bold border border-gold/30">
                      {audienceVotes[opt.key] || 0}%
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Action Area */}
          <div className="mt-8 flex justify-center h-16">
            <AnimatePresence mode="wait">
              {selectedOption && !isLocked && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={lockAnswer}
                  className="px-10 py-3 bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-xl rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-105 transition-transform"
                >
                  Última Palabra
                </motion.button>
              )}

              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  {isWinner ? (
                    <button onClick={() => setGameState('menu')} className="px-8 py-3 bg-gold text-black rounded-full font-bold">Volver al Menú</button>
                  ) : isLoser ? (
                    <button onClick={() => setGameState('menu')} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold">Terminar</button>
                  ) : ((selectedOption !== currentQuestion?.correct_option) && mode === 'infinite' && lives === 0) ? (
                    <button onClick={() => endGame(false)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold">Terminar Juego</button>
                  ) : (
                    <button 
                      onClick={nextLevel}
                      className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-full shadow-lg flex items-center gap-2"
                    >
                      Siguiente Pregunta <ArrowRight size={20} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Explanation Modal Overlay */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-[#0a1540] border border-blue-500/30 rounded-2xl relative"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-900/50 rounded-full text-gold shrink-0">
                    <Heart size={24} />
                  </div>
                  <div>
                    {currentQuestion.explanation && (
                      <p className="mt-2 text-indigo-100">{currentQuestion.explanation}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
        
        {/* Sidebar / Money Tree */}
        <div className="w-full lg:w-64 shrink-0 bg-[#050a24] border border-blue-900/50 rounded-2xl p-4 flex flex-col-reverse lg:flex-col overflow-y-auto max-h-48 lg:max-h-[70vh]">
          {mode === 'normal' ? (
            PRIZE_TREE.map((prize, idx) => {
              const lvl = idx + 1;
              const isCurrent = currentLevel === lvl;
              const isPassed = currentLevel > lvl;
              const isSafe = SAFE_HAVENS.includes(idx);
              
              return (
                <div 
                  key={lvl}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg mb-1 font-bold font-mono transition-colors
                    ${isCurrent ? 'bg-gold text-black shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 
                      isPassed ? 'text-gold' : 
                      isSafe ? 'text-white' : 'text-blue-400/70'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-right">{lvl}</span>
                    <span className="text-xs opacity-50">♦</span>
                  </span>
                  <span>{prize.toLocaleString()}</span>
                </div>
              );
            }).reverse()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative">
              <Shield className="w-16 h-16 text-purple-500 mb-4 opacity-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Modo Infinito</h3>
              
              {/* Vidas */}
              <div className="flex gap-2 mb-6 relative z-10">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`w-8 h-8 ${i < lives ? 'text-red-500 fill-red-500 animate-pulse' : 'text-gray-600 fill-transparent'}`} 
                  />
                ))}
              </div>

              <div className="text-4xl font-black text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] relative z-10">
                {score.toLocaleString()}
              </div>
              <div className="text-sm text-blue-300 uppercase tracking-widest mt-2 relative z-10">Puntos</div>
            </div>
          )}
        </div>
        
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020513] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f2066] via-[#020513] to-[#000000] text-white pt-20 pb-10 overflow-hidden relative">
      <Helmet>
        <title>Biblionario | Juegos Bíblicos</title>
        <meta name="theme-color" content="#020513" />
      </Helmet>
      
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
        {/* Animated scanning lines effect */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')] opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 h-full flex flex-col">
        {/* Header bar */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/recursos/juegos" className="text-blue-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <X size={16} /> Salir
          </Link>
          
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-blue-400 hover:text-white p-2"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {gameState === 'menu' && renderMenu()}
        {gameState === 'leaderboard' && renderLeaderboard()}
        {gameState === 'playing' && renderPlaying()}
        
        {/* Game Over / Win Screens can be rendered via simple absolute overlays if needed, 
            but for now we handle them mostly via the playing view's explanation state + buttons */}
            
        <audio 
          ref={bgmRef}
          src={musicType === 'tv' 
            ? 'https://actions.google.com/sounds/v1/science_fiction/spaceship_alarm.ogg' 
            : 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg'} 
          loop 
        />
            
        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-[#0a1540] border border-red-900 rounded-3xl p-8 md:p-12 text-center max-w-lg w-full shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                <X className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-4xl font-serif font-bold text-white mb-4">¡Fin del Juego!</h2>
                <p className="text-xl text-blue-200 mb-8">
                  Te llevas a casa: <br/>
                  <span className="text-5xl font-black text-gold mt-2 block">{score.toLocaleString()}</span>
                </p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setGameState('menu')} className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-full font-bold transition-colors">
                    Menú Principal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {gameState === 'won' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-b from-[#1a1500] to-[#0a0800] border-2 border-gold rounded-3xl p-8 md:p-12 text-center max-w-lg w-full shadow-[0_0_50px_rgba(255,215,0,0.4)]">
                <Crown className="w-24 h-24 text-gold mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
                <h2 className="text-4xl font-serif font-bold text-white mb-2">¡FELICIDADES!</h2>
                <h3 className="text-2xl text-gold font-bold mb-6">ERES UN BIBLIONARIO</h3>
                <p className="text-xl text-yellow-100/70 mb-8">
                  Has completado las 15 preguntas correctamente.
                </p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setGameState('menu')} className="px-8 py-4 bg-gold hover:bg-yellow-400 text-black rounded-full font-bold transition-colors text-lg shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                    Jugar de Nuevo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
