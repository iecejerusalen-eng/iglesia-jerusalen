import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Star, Award, RotateCcw, ChevronRight, Trophy, Lock, User, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';

// --- Data ---
type Character = {
  id?: string;
  name: string;
  options: string[];
  clues: string[];
};

type CharacterRow = {
  id: string;
  name: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  clues: unknown;
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
  },
  {
    name: 'Rut',
    options: ['Ana', 'Rut', 'Noemí', 'Raquel'],
    clues: [
      'Quedé viuda en tierra de Moab.',
      'Decidí acompañar a mi suegra a Belén.',
      'Trabajé recogiendo espigas en un campo.',
      'Me casé con Booz y fui bisabuela del rey David.'
    ]
  },
  {
    name: 'Abraham',
    options: ['Isaac', 'Jacob', 'Abraham', 'Lot'],
    clues: [
      'Dios me llamó a salir de mi tierra y mi parentela.',
      'Recibí la promesa de una descendencia numerosa.',
      'Mi esposa se llamaba Sara.',
      'Soy conocido como padre de la fe.'
    ]
  },
  {
    name: 'Josué',
    options: ['Caleb', 'Josué', 'Gedeón', 'Samuel'],
    clues: [
      'Fui ayudante de Moisés.',
      'Estuve entre los doce espías enviados a Canaán.',
      'Guié al pueblo de Israel después de Moisés.',
      'Vi caer los muros de Jericó.'
    ]
  },
  {
    name: 'Débora',
    options: ['Jael', 'Ester', 'Débora', 'Miriam'],
    clues: [
      'Viví durante el período de los jueces.',
      'Era profetisa en Israel.',
      'Juzgaba al pueblo bajo una palmera.',
      'Acompañé a Barac en la victoria contra Sísara.'
    ]
  },
  {
    name: 'Elías',
    options: ['Eliseo', 'Isaías', 'Elías', 'Jeremías'],
    clues: [
      'Dios me alimentó por medio de cuervos.',
      'Desafié a los profetas de Baal en el monte Carmelo.',
      'Oré y descendió fuego del cielo.',
      'Fui llevado al cielo en un torbellino.'
    ]
  },
  {
    name: 'Samuel',
    options: ['Natán', 'Samuel', 'Saúl', 'Elí'],
    clues: [
      'Mi madre Ana oró por un hijo.',
      'Serví en el tabernáculo desde niño.',
      'Dios me llamó durante la noche.',
      'Ungí como reyes a Saúl y a David.'
    ]
  },
  {
    name: 'Juan el Bautista',
    options: ['Juan el Bautista', 'Juan el apóstol', 'Santiago', 'Andrés'],
    clues: [
      'Mi padre fue el sacerdote Zacarías.',
      'Prediqué en el desierto de Judea.',
      'Preparé el camino del Señor.',
      'Bauticé a Jesús en el río Jordán.'
    ]
  },
  {
    name: 'Marta',
    options: ['María Magdalena', 'Marta', 'Lidia', 'Dorcas'],
    clues: [
      'Vivía en Betania.',
      'Mis hermanos eran María y Lázaro.',
      'Recibí a Jesús en mi casa.',
      'Confesé que Jesús es el Cristo antes de la resurrección de mi hermano.'
    ]
  },
  {
    name: 'Zaqueo',
    options: ['Nicodemo', 'Mateo', 'Bartimeo', 'Zaqueo'],
    clues: [
      'Vivía en Jericó.',
      'Era jefe de los publicanos.',
      'Era de baja estatura.',
      'Subí a un sicómoro para ver a Jesús.'
    ]
  },
  {
    name: 'Timoteo',
    options: ['Tito', 'Silas', 'Timoteo', 'Marcos'],
    clues: [
      'Mi madre se llamaba Eunice y mi abuela Loida.',
      'Conocí las Escrituras desde la niñez.',
      'Acompañé a Pablo en sus viajes.',
      'Recibí dos cartas pastorales que llevan mi nombre.'
    ]
  }
];

const parseClues = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 4);
};

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
  const [characters, setCharacters] = useState<Character[]>(() =>
    shuffleArray(charactersDb).slice(0, 10).map(character => ({
      ...character,
      options: shuffleArray(character.options)
    }))
  );
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(charactersDb);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Scoring
  const [score, setScore] = useState(0);
  const [potentialPoints, setPotentialPoints] = useState(100);
  const [cluesRevealed, setCluesRevealed] = useState(1);
  
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const resetGame = useCallback((pool: Character[]) => {
    // Select 10 random characters
    setCharacters(shuffleArray(pool).slice(0, 10).map(c => ({
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

  const startGame = useCallback(() => {
    resetGame(availableCharacters);
  }, [availableCharacters, resetGame]);

  useEffect(() => {
    let isActive = true;

    const loadCharacters = async () => {
      const { data, error } = await supabase
        .from('game_guess_characters')
        .select('id, name, option_a, option_b, option_c, option_d, clues')
        .eq('is_active', true)
        .order('name');

      if (!isActive) return;

      if (error) {
        console.error('No se pudieron cargar los personajes administrables:', error);
        resetGame(charactersDb);
        return;
      }

      const remoteCharacters = ((data ?? []) as CharacterRow[])
        .map((row): Character => ({
          id: row.id,
          name: row.name,
          options: [row.option_a, row.option_b, row.option_c, row.option_d],
          clues: parseClues(row.clues)
        }))
        .filter(character => character.clues.length === 4 && character.options.includes(character.name));

      const pool = remoteCharacters.length >= 10 ? remoteCharacters : charactersDb;
      setAvailableCharacters(pool);
      resetGame(pool);
    };

    void loadCharacters();
    return () => { isActive = false; };
  }, [resetGame]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative overflow-hidden transition-colors duration-500">
      {/* Premium Background Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] z-0 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/20 dark:bg-amber-600/20 blur-[120px] z-0 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[100px] z-0 animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/recursos/juegos" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 font-medium bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span className="hidden sm:inline">Volver a Juegos</span>
          </Link>
          <motion.div 
            key={score}
            initial={{ scale: 1.2, color: '#F59E0B' }}
            animate={{ scale: 1, color: '' }}
            className="px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm border border-slate-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md"
          >
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-slate-800 dark:text-white">{score} <span className="hidden sm:inline">Puntos</span></span>
          </motion.div>
        </div>

        {gameOver ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="p-10 text-center rounded-[2.5rem] shadow-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl"
          >
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-30 rounded-full animate-pulse"></div>
              <Trophy className="w-32 h-32 text-amber-500 relative z-10 mx-auto drop-shadow-xl" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif font-black text-slate-900 dark:text-white mb-4 tracking-tight">¡Misión Cumplida!</h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-lg mx-auto">
              Has demostrado un excelente conocimiento bíblico consiguiendo <span className="font-bold text-amber-600 dark:text-amber-400 text-2xl">{score} puntos</span>.
            </p>
            <button 
              onClick={startGame}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-10 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 mx-auto text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              Jugar de Nuevo
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Progress & Current Score */}
            <div className="flex justify-between items-end mb-4 px-2">
              <div>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  Personaje {currentIndex + 1} de {characters.length}
                </p>
                <h2 className="text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">¿Quién soy?</h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Puntos en juego</p>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl font-black shadow-sm border border-amber-500/20">
                  <Award className="w-4 h-4" />
                  {potentialPoints}
                </div>
              </div>
            </div>

            {/* Clues Container */}
            <div className="p-6 md:p-8 rounded-[2rem] relative min-h-[360px] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] z-20"
                  >
                    <div className="w-24 h-24 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-6 text-emerald-500 shadow-xl border border-emerald-500/30">
                      <Star className="w-12 h-12 fill-current" />
                    </div>
                    <h3 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2">¡Correcto!</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-xl font-medium mb-4">Era {currentCharacter.name}</p>
                    <p className="text-amber-500 font-bold text-lg bg-amber-500/10 px-6 py-2 rounded-xl border border-amber-500/20 shadow-sm">
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
                      opacity: 1, 
                      x: 0,
                    }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className={`relative p-5 rounded-2xl border transition-all duration-500 overflow-hidden ${
                      idx < cluesRevealed 
                        ? 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-500/30 shadow-sm' 
                        : 'bg-slate-100/50 dark:bg-slate-950/50 border-slate-200/50 dark:border-white/5'
                    }`}
                  >
                    <div className={`flex gap-4 items-start relative z-10 transition-opacity duration-500 ${
                      idx < cluesRevealed ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300`}>
                        {idx + 1}
                      </div>
                      <p className="text-lg pt-0.5 leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                        {clue}
                      </p>
                    </div>
                    
                    {/* Locked State Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-500 ${
                      idx < cluesRevealed ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100 scale-100'
                    }`}>
                      <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-medium">
                        <Lock className="w-5 h-5" />
                        <span>Pista bloqueada</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {cluesRevealed < 4 && !showSuccess && (
                <div className="mt-8 text-center relative z-20">
                  <button 
                    onClick={handleRevealClue}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-indigo-500/30 outline-none"
                  >
                    <HelpCircle className="w-5 h-5" />
                    Revelar siguiente pista 
                    <span className="bg-red-500/20 text-red-200 dark:text-red-600 dark:bg-red-500/10 px-2 py-0.5 rounded text-xs ml-2 border border-red-500/30">
                      -20 pts
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 relative z-20">
              {currentCharacter.options.map((option, idx) => {
                const isWrong = wrongGuesses.includes(option);
                return (
                  <motion.button
                    key={idx}
                    whileHover={!isWrong && !showSuccess ? { scale: 1.02 } : {}}
                    whileTap={!isWrong && !showSuccess ? { scale: 0.98 } : {}}
                    animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={isWrong ? { duration: 0.4 } : {}}
                    onClick={() => handleGuess(option)}
                    disabled={isWrong || showSuccess}
                    className={`p-5 rounded-2xl font-bold text-lg transition-all duration-300 border-2 shadow-sm flex items-center gap-4
                      ${isWrong 
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-400 dark:text-red-500 opacity-70 cursor-not-allowed' 
                        : 'bg-white dark:bg-slate-800 border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isWrong 
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-400' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      <User size={20} />
                    </div>
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
