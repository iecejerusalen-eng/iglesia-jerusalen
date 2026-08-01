import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Star, Award, RotateCcw, ChevronRight, Trophy, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// --- Data ---
type Character = {
  name: string;
  options: string[];
  clues: string[];
};

const charactersDb: Character[] = [
  {
    name: 'Moisés',
    options: ['Moisés', 'Abraham', 'Noé', 'Josué'],
    clues: [
      'Fui rescatado de las aguas cuando era un bebé.',
      'Me crie en el palacio del faraón.',
      'Dios me habló desde una zarza ardiente.',
      'Abrí el Mar Rojo con mi vara.'
    ]
  },
  {
    name: 'David',
    options: ['Salomón', 'David', 'Saúl', 'Samuel'],
    clues: [
      'Fui un pastor de ovejas en mi juventud.',
      'Tocaba el arpa para calmar a un rey.',
      'Derroté a un gigante con una honda y una piedra.',
      'Escribí muchos de los Salmos.'
    ]
  },
  {
    name: 'Pedro',
    options: ['Juan', 'Pablo', 'Pedro', 'Andrés'],
    clues: [
      'De oficio era pescador.',
      'Caminé sobre las aguas hacia Jesús.',
      'Negué a Jesús tres veces antes de que cantara el gallo.',
      'Jesús me llamó "Roca".'
    ]
  },
  {
    name: 'María (madre de Jesús)',
    options: ['María Magdalena', 'Marta', 'María (madre de Jesús)', 'Elisabet'],
    clues: [
      'Un ángel me visitó con un mensaje sorprendente.',
      'Fui a visitar a mi prima Elisabet.',
      'Di a luz en un pesebre.',
      'Estuve al pie de la cruz.'
    ]
  },
  {
    name: 'Pablo',
    options: ['Pedro', 'Lucas', 'Esteban', 'Pablo'],
    clues: [
      'Antes me llamaba Saulo.',
      'Perseguía a los cristianos.',
      'Quedé ciego camino a Damasco.',
      'Escribí gran parte del Nuevo Testamento.'
    ]
  },
  {
    name: 'José (hijo de Jacob)',
    options: ['José (hijo de Jacob)', 'Judá', 'Benjamín', 'Moisés'],
    clues: [
      'Mi padre me hizo una túnica de muchos colores.',
      'Mis hermanos me vendieron como esclavo.',
      'Interpretaba los sueños del faraón.',
      'Llegué a ser gobernador de Egipto.'
    ]
  },
  {
    name: 'Ester',
    options: ['Rut', 'Ester', 'Débora', 'Noemí'],
    clues: [
      'Fui adoptada por mi primo Mardoqueo.',
      'Me convertí en reina del imperio persa.',
      'Ayuné 3 días antes de presentarme ante el rey.',
      'Salvé a mi pueblo judío de la destrucción.'
    ]
  },
  {
    name: 'Jonás',
    options: ['Daniel', 'Elías', 'Jeremías', 'Jonás'],
    clues: [
      'Huí del llamado de Dios en un barco hacia Tarsis.',
      'Fui arrojado al mar durante una tormenta.',
      'Fui tragado por un gran pez.',
      'Prediqué en la ciudad de Nínive.'
    ]
  },
  {
    name: 'Noé',
    options: ['Enoc', 'Abraham', 'Noé', 'Lot'],
    clues: [
      'Viví en una época de gran maldad en la tierra.',
      'Encontré gracia ante los ojos de Dios.',
      'Construí un arca de madera de gofer.',
      'Salvé a mi familia y a parejas de todos los animales.'
    ]
  },
  {
    name: 'Daniel',
    options: ['Ezequiel', 'Isaías', 'Daniel', 'José'],
    clues: [
      'Fui llevado cautivo a Babilonia.',
      'Me negué a comer la comida del rey.',
      'Interpretaba sueños y visiones.',
      'Fui echado al foso de los leones y salí ileso.'
    ]
  }
];

// Shuffle helper
const shuffleArray = <T,>(array: T[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const GuessCharacter = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Scoring
  const [score, setScore] = useState(0);
  const [potentialPoints, setPotentialPoints] = useState(100);
  const [cluesRevealed, setCluesRevealed] = useState(1);
  
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const startGame = useCallback(() => {
    // Select 10 random characters
    setCharacters(shuffleArray(charactersDb).slice(0, 10).map(c => ({
      ...c,
      options: shuffleArray(c.options)
    })));
    setCurrentIndex(0);
    setScore(0);
    setPotentialPoints(100);
    setCluesRevealed(1);
    setWrongGuesses([]);
    setGameOver(false);
    setShowSuccess(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const currentCharacter = characters[currentIndex];

  const handleRevealClue = () => {
    if (cluesRevealed < 4) {
      setCluesRevealed(prev => prev + 1);
      setPotentialPoints(prev => Math.max(20, prev - 20)); // -20 por pista extra
    }
  };

  const handleGuess = (option: string) => {
    if (wrongGuesses.includes(option)) return;

    if (option === currentCharacter.name) {
      // Success
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D97706', '#1E3A8A', '#0EA5E9']
      });
      setScore(prev => prev + potentialPoints);
      setShowSuccess(true);
      
      setTimeout(() => {
        if (currentIndex < characters.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setPotentialPoints(100);
          setCluesRevealed(1);
          setWrongGuesses([]);
          setShowSuccess(false);
        } else {
          setGameOver(true);
          setShowSuccess(false);
        }
      }, 1500);
    } else {
      // Wrong guess
      toast.error('¡Personaje incorrecto!');
      setWrongGuesses(prev => [...prev, option]);
      setPotentialPoints(prev => Math.max(0, prev - 10)); // -10 por fallo
    }
  };

  if (characters.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[100px] opacity-60 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-100 blur-[100px] opacity-60 z-0"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/recursos/juegos" className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 font-medium">
            <ChevronRight className="w-5 h-5 rotate-180" />
            Volver a Juegos
          </Link>
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-slate-200 bg-white/70 backdrop-blur-md">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-slate-800">{score} Puntos</span>
          </div>
        </div>

        {gameOver ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 text-center rounded-3xl shadow-xl border border-slate-200 bg-white/80 backdrop-blur-lg"
          >
            <Trophy className="w-24 h-24 mx-auto text-amber-500 mb-6" />
            <h1 className="text-4xl font-serif font-bold text-slate-800 mb-4">¡Juego Completado!</h1>
            <p className="text-xl text-slate-600 mb-8">
              Has conseguido un total de <span className="font-bold text-amber-600">{score} puntos</span>.
            </p>
            <button 
              onClick={startGame}
              className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-5 h-5" />
              Jugar de Nuevo
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Progress & Current Score */}
            <div className="flex justify-between items-end mb-4 px-2">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Personaje {currentIndex + 1} de {characters.length}
                </p>
                <h2 className="text-3xl font-serif font-bold text-slate-800 mt-1">¿Quién soy?</h2>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 mb-1">Puntos en juego</p>
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-bold shadow-sm">
                  <Award className="w-4 h-4" />
                  {potentialPoints}
                </div>
              </div>
            </div>

            {/* Clues Container */}
            <div className="glass-card p-6 rounded-3xl relative min-h-[320px] flex flex-col shadow-lg border border-slate-200 bg-white/80 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl z-20"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 shadow-lg">
                      <Star className="w-10 h-10 fill-current" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-2">¡Correcto!</h3>
                    <p className="text-slate-600 text-xl font-medium">Era {currentCharacter.name}</p>
                    <p className="text-green-600 font-bold mt-3 bg-green-50 px-4 py-1 rounded-full border border-green-100">
                      +{potentialPoints} puntos
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="space-y-4 flex-1">
                {currentCharacter.clues.map((clue, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: idx < cluesRevealed ? 1 : 0.6, 
                      x: 0,
                      filter: idx < cluesRevealed ? 'blur(0px)' : 'blur(4px)'
                    }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      idx < cluesRevealed 
                        ? 'bg-white border-blue-100 shadow-sm' 
                        : 'bg-slate-50/50 border-slate-200'
                    } relative overflow-hidden`}
                  >
                    <div className="flex gap-4 items-start relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        idx < cluesRevealed 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <p className={`text-lg pt-0.5 leading-relaxed ${
                        idx < cluesRevealed 
                          ? 'text-slate-700 font-medium' 
                          : 'text-transparent select-none'
                      }`}>
                        {idx < cluesRevealed ? clue : '????????????????????????????????????'}
                      </p>
                    </div>
                    {idx >= cluesRevealed && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <Lock className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {cluesRevealed < 4 && !showSuccess && (
                <div className="mt-8 text-center">
                  <button 
                    onClick={handleRevealClue}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors shadow-md hover:shadow-lg focus:ring-4 focus:ring-slate-200 outline-none"
                  >
                    <HelpCircle className="w-5 h-5" />
                    Revelar siguiente pista (-20 pts)
                  </button>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {currentCharacter.options.map((option, idx) => {
                const isWrong = wrongGuesses.includes(option);
                return (
                  <motion.button
                    key={idx}
                    whileHover={!isWrong && !showSuccess ? { scale: 1.02 } : {}}
                    whileTap={!isWrong && !showSuccess ? { scale: 0.98 } : {}}
                    onClick={() => handleGuess(option)}
                    disabled={isWrong || showSuccess}
                    className={`p-4 rounded-2xl font-medium text-lg transition-all duration-300 border-2 shadow-sm
                      ${isWrong 
                        ? 'bg-red-50 border-red-200 text-red-400 opacity-60 cursor-not-allowed' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-md hover:text-blue-700 cursor-pointer'
                      }
                    `}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
