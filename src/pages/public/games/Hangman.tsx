import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Trophy, X, Play, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';

interface HangmanWord {
  id: string;
  word: string;
  hint: string;
  category: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

// Dibujo del ahorcado paso a paso usando SVG
const HANGMAN_PARTS = [
  // 1: Base
  <line key="base" x1="10" y1="250" x2="150" y2="250" stroke="currentColor" strokeWidth="8" />,
  // 2: Polo
  <line key="pole" x1="80" y1="250" x2="80" y2="20" stroke="currentColor" strokeWidth="8" />,
  // 3: Viga
  <line key="beam" x1="76" y1="20" x2="200" y2="20" stroke="currentColor" strokeWidth="8" />,
  // 4: Cuerda
  <line key="rope" x1="200" y1="20" x2="200" y2="50" stroke="currentColor" strokeWidth="6" />,
  // 5: Cabeza
  <circle key="head" cx="200" cy="80" r="30" stroke="currentColor" strokeWidth="6" fill="transparent" />,
  // 6: Cuerpo
  <line key="body" x1="200" y1="110" x2="200" y2="170" stroke="currentColor" strokeWidth="6" />,
  // 7: Brazo Izquierdo
  <line key="armL" x1="200" y1="130" x2="160" y2="160" stroke="currentColor" strokeWidth="6" />,
  // 8: Brazo Derecho
  <line key="armR" x1="200" y1="130" x2="240" y2="160" stroke="currentColor" strokeWidth="6" />,
  // 9: Pierna Izquierda
  <line key="legL" x1="200" y1="170" x2="170" y2="220" stroke="currentColor" strokeWidth="6" />,
  // 10: Pierna Derecha
  <line key="legR" x1="200" y1="170" x2="230" y2="220" stroke="currentColor" strokeWidth="6" />
];

export const Hangman = () => {
  const { user } = useAuthStore();
  
  // Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'won' | 'leaderboard'>('menu');
  const [words, setWords] = useState<HangmanWord[]>([]);
  const [currentWord, setCurrentWord] = useState<HangmanWord | null>(null);
  
  // Player Progress
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [wordsGuessed, setWordsGuessed] = useState(0);
  
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const { data, error } = await supabase
        .from('game_hangman_words')
        .select('*');
        
      if (error) throw error;
      if (data) {
        // Simple client-side shuffle
        setWords(data.sort(() => 0.5 - Math.random()));
      }
    } catch (err) {
      console.error('Error fetching words:', err);
    }
  };

  const startGame = () => {
    setScore(0);
    setWordsGuessed(0);
    setGameState('playing');
    nextWord();
  };

  const nextWord = () => {
    // Si ya jugamos todas las palabras disponibles
    if (words.length === 0) {
      fetchWords(); // Recargar
      return;
    }
    
    // Sacar una palabra
    const wordObj = words[0];
    const remaining = words.slice(1);
    setWords(remaining);
    
    setCurrentWord(wordObj);
    setGuessedLetters(new Set());
    setMistakes(0);
    setGameState('playing');
  };

  const handleGuess = (letter: string) => {
    if (gameState !== 'playing' || !currentWord) return;
    
    const uppercaseLetter = letter.toUpperCase();
    if (guessedLetters.has(uppercaseLetter)) return;
    
    const newGuessed = new Set(guessedLetters);
    newGuessed.add(uppercaseLetter);
    setGuessedLetters(newGuessed);
    
    const normalizedWord = currentWord.word.toUpperCase();
    
    if (!normalizedWord.includes(uppercaseLetter)) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      
      if (newMistakes >= HANGMAN_PARTS.length) {
        endGame();
      }
    } else {
      // Check if won
      const isWon = normalizedWord.split('').every(c => c === ' ' || newGuessed.has(c));
      if (isWon) {
        setTimeout(() => {
          handleWinRound();
        }, 500);
      }
    }
  };

  const handleWinRound = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#22c55e', '#ffffff']
    });
    
    setScore(s => s + 100);
    setWordsGuessed(w => w + 1);
    setGameState('won');
  };

  const endGame = async () => {
    setGameState('gameover');
    
    if (user && (score > 0 || wordsGuessed > 0)) {
      try {
        const { error } = await supabase
          .from('game_hangman_scores')
          .insert([{
            profile_id: user.id,
            score: score,
            words_guessed: wordsGuessed
          }]);
          
        if (error) console.error("Error saving score:", error);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_hangman_scores')
        .select(`
          id,
          score,
          words_guessed,
          created_at,
          profiles!inner(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeaderboard(data || []);
      setGameState('leaderboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        const key = e.key.toUpperCase();
        if (ALPHABET.includes(key) || key === 'Ñ') {
          handleGuess(key);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, guessedLetters, currentWord]);

  const renderMenu = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center"
    >
      <div className="w-32 h-32 bg-amber-900 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-8 border-4 border-amber-600">
        <svg viewBox="0 0 300 300" className="w-20 h-20 text-amber-200">
          <line x1="50" y1="250" x2="150" y2="250" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
          <line x1="100" y1="250" x2="100" y2="50" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
          <line x1="90" y1="50" x2="220" y2="50" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
          <line x1="220" y1="50" x2="220" y2="100" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 mb-4">
        Ahorcado <span className="text-amber-500">Bíblico</span>
      </h1>
      
      <p className="text-xl text-amber-100/80 mb-12 max-w-lg font-light">
        Adivina los nombres de personajes, ciudades y libros bíblicos antes de quedarte sin intentos.
      </p>
      
      <div className="flex flex-col w-full sm:w-auto gap-4">
        <button
          onClick={startGame}
          className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-orange-500/50 transition-all border border-amber-400/30 flex items-center justify-center gap-3"
        >
          <Play className="fill-current" /> Jugar Ahora
        </button>

        <button
          onClick={fetchLeaderboard}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-lg backdrop-blur-sm transition-all border border-white/10 flex items-center justify-center gap-3"
        >
          <Trophy /> Tabla de Clasificación
        </button>
      </div>
      
      {!user && (
        <p className="mt-8 text-amber-300/60 text-sm">
          Inicia sesión para que tus puntajes se guarden en la tabla de clasificación.
        </p>
      )}
    </motion.div>
  );

  const renderLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-[#1b120c] border border-amber-900/50 rounded-2xl p-6 md:p-8 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-amber-900/50">
        <h2 className="text-3xl font-serif font-bold text-amber-500 flex items-center gap-3">
          <Trophy /> Mejores Jugadores
        </h2>
        <button 
          onClick={() => setGameState('menu')}
          className="text-amber-300 hover:text-white transition-colors p-2"
        >
          <X />
        </button>
      </div>
      
      {leaderboardLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-center text-amber-300/60 py-8">Aún no hay puntajes registrados. ¡Sé el primero!</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div 
                key={entry.id} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-r from-amber-900/40 to-transparent border border-amber-500/30' : 
                  'bg-amber-900/10 border border-amber-800/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold w-8 text-center ${
                    index === 0 ? 'text-amber-500' : 
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' : 'text-amber-700'
                  }`}>
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-amber-900 overflow-hidden flex items-center justify-center">
                    {entry.profiles?.avatar_url ? (
                      <img src={entry.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-amber-300 font-bold">
                        {entry.profiles?.first_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold">{entry.profiles?.first_name} {entry.profiles?.last_name}</p>
                    <p className="text-amber-400/70 text-sm">{entry.words_guessed} Palabras</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-500 drop-shadow-md">
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
    if (!currentWord) return <div className="text-center py-20 text-amber-200">Cargando...</div>;

    const normalizedWord = currentWord.word.toUpperCase();
    const wordLetters = normalizedWord.split('');

    return (
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto items-center lg:items-start">
        
        {/* Lado Izquierdo: Ahorcado */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <div className="bg-[#1b120c] border border-amber-900/40 rounded-2xl p-6 w-full max-w-sm aspect-square flex items-center justify-center shadow-lg relative">
            <svg viewBox="0 0 300 300" className="w-full h-full text-amber-500">
              {HANGMAN_PARTS.slice(0, mistakes)}
            </svg>
            
            <div className="absolute top-4 right-4 flex gap-1">
              {[...Array(HANGMAN_PARTS.length - mistakes)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-green-500"></div>
              ))}
              {[...Array(mistakes)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-red-500/50"></div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="text-amber-300/80 uppercase tracking-widest text-sm font-bold">Puntos: {score}</div>
            <div className="text-amber-500 font-bold text-2xl">{wordsGuessed} Aciertos</div>
          </div>
        </div>

        {/* Lado Derecho: Palabra y Teclado */}
        <div className="w-full lg:w-2/3 flex flex-col items-center lg:items-start">
          
          {/* Categoría y Pista */}
          <div className="mb-8 w-full">
            <div className="inline-block px-4 py-1.5 bg-amber-900/30 border border-amber-700/50 rounded-full text-amber-300 text-sm font-bold uppercase tracking-wider mb-4">
              {currentWord.category}
            </div>
            
            {currentWord.hint && (
              <div className="flex items-start gap-3 bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl">
                <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <p className="text-blue-100 text-lg">{currentWord.hint}</p>
              </div>
            )}
          </div>

          {/* Palabra a Adivinar */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3 mb-12">
            {wordLetters.map((letter, index) => {
              if (letter === ' ') {
                return <div key={`space-${index}`} className="w-4 md:w-8"></div>;
              }
              
              const isGuessed = guessedLetters.has(letter) || gameState === 'gameover' || gameState === 'won';
              const isMissed = gameState === 'gameover' && !guessedLetters.has(letter);
              
              return (
                <div 
                  key={index} 
                  className={`w-10 h-14 md:w-14 md:h-16 flex items-center justify-center text-2xl md:text-3xl font-bold uppercase border-b-4 
                    ${isGuessed && !isMissed ? 'border-amber-500 text-white' : 
                      isMissed ? 'border-red-500 text-red-500' : 'border-amber-900 text-transparent'}`}
                >
                  {isGuessed ? letter : '_'}
                </div>
              );
            })}
          </div>

          {/* Estado de Juego Finalizado */}
          <AnimatePresence mode="wait">
            {gameState === 'won' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full p-6 bg-green-900/20 border border-green-500/30 rounded-2xl flex flex-col items-center justify-center text-center mb-8"
              >
                <h3 className="text-2xl font-bold text-green-400 mb-2">¡Correcto!</h3>
                <p className="text-green-100/80 mb-6">Has adivinado la palabra.</p>
                <button 
                  onClick={nextWord}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-lg"
                >
                  Siguiente Palabra
                </button>
              </motion.div>
            ) : gameState === 'gameover' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full p-6 bg-red-900/20 border border-red-500/30 rounded-2xl flex flex-col items-center justify-center text-center mb-8"
              >
                <h3 className="text-2xl font-bold text-red-400 mb-2">¡Ahorcado!</h3>
                <p className="text-red-100/80 mb-6">La palabra correcta era: <strong className="text-white">{currentWord.word.toUpperCase()}</strong></p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setGameState('menu')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold"
                  >
                    Salir
                  </button>
                  <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2"
                  >
                    <RefreshCw size={18} /> Reintentar
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Teclado en Pantalla */
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full"
              >
                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                  {ALPHABET.map((letter) => {
                    const isGuessed = guessedLetters.has(letter);
                    const isCorrect = isGuessed && normalizedWord.includes(letter);
                    const isWrong = isGuessed && !normalizedWord.includes(letter);
                    
                    return (
                      <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={isGuessed || gameState !== 'playing'}
                        className={`w-10 h-12 md:w-12 md:h-14 rounded-xl font-bold text-lg md:text-xl transition-all
                          ${isCorrect ? 'bg-green-600 text-white border-b-4 border-green-800' :
                            isWrong ? 'bg-red-900/50 text-red-400 border border-red-900/50 opacity-50' :
                            'bg-[#2a1c12] text-amber-100 border-b-4 border-[#1b120c] hover:bg-amber-800 hover:border-amber-900 active:border-b-0 active:translate-y-1'
                          }
                        `}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0906] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a1a10] via-[#0d0906] to-[#000000] text-white pt-24 pb-10 px-4">
      <Helmet>
        <title>Ahorcado Bíblico | Juegos Cristianos</title>
      </Helmet>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Cabecera */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/recursos/juegos" className="text-amber-500/70 hover:text-amber-400 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <X size={16} /> Salir
          </Link>
        </div>

        {gameState === 'menu' && renderMenu()}
        {gameState === 'leaderboard' && renderLeaderboard()}
        {(gameState === 'playing' || gameState === 'won' || gameState === 'gameover') && renderPlaying()}
      </div>
    </div>
  );
};
