import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Trophy, X, Play, RefreshCw, Layers } from 'lucide-react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';

interface MemoryCard {
  id: string;
  pair_name: string;
  image_url: string | null;
  // State for gameplay
  isFlipped: boolean;
  isMatched: boolean;
  uniqueId: string;
}

interface LeaderboardEntry {
  id: string;
  score: number;
  time_seconds: number;
  moves: number;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profiles?: any;
}

export const MemoryMatch = () => {
  const { user } = useAuthStore();
  
  // Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won' | 'leaderboard'>('menu');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  // Timer
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === 'playing' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  const startGame = async () => {
    setGameState('playing');
    setMoves(0);
    setMatches(0);
    setElapsedTime(0);
    setStartTime(new Date().getTime());
    setFlippedCards([]);
    
    try {
      // Fetch pairs from Supabase
      const { data, error } = await supabase
        .from('game_memory_cards')
        .select('*')
        .limit(8); // Get up to 8 pairs (16 cards)
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Create duplicate pairs
        const pairs: MemoryCard[] = [];
        data.forEach((item) => {
          pairs.push({
            id: item.id,
            pair_name: item.pair_name,
            image_url: item.image_url,
            isFlipped: false,
            isMatched: false,
            uniqueId: `${item.id}-A`
          });
          pairs.push({
            id: item.id,
            pair_name: item.pair_name,
            image_url: item.image_url,
            isFlipped: false,
            isMatched: false,
            uniqueId: `${item.id}-B`
          });
        });
        
        // Shuffle
        setCards(pairs.sort(() => 0.5 - Math.random()));
      }
    } catch (err) {
      console.error('Error fetching memory cards:', err);
    }
  };

  const handleCardClick = (uniqueId: string) => {
    if (isLocked) return;
    
    const cardIndex = cards.findIndex(c => c.uniqueId === uniqueId);
    if (cardIndex === -1 || cards[cardIndex].isMatched || cards[cardIndex].isFlipped) return;

    // Flip the card
    const newCards = [...cards];
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedCards, uniqueId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);
      
      const card1 = cards.find(c => c.uniqueId === newFlipped[0]);
      const card2 = cards.find(c => c.uniqueId === newFlipped[1]);
      
      if (card1 && card2 && card1.id === card2.id) {
        // Match found!
        setTimeout(() => {
          const matchedCards = cards.map(c => 
            (c.id === card1.id) ? { ...c, isMatched: true, isFlipped: true } : c
          );
          setCards(matchedCards);
          setFlippedCards([]);
          setIsLocked(false);
          setMatches(m => m + 1);
          
          // Check if won
          if (matches + 1 === cards.length / 2) {
            handleWin();
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = cards.map(c => 
            (c.uniqueId === newFlipped[0] || c.uniqueId === newFlipped[1]) ? { ...c, isFlipped: false } : c
          );
          setCards(resetCards);
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const handleWin = async () => {
    setGameState('won');
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#0ea5e9', '#ffffff']
    });

    const finalTime = Math.floor((new Date().getTime() - (startTime || new Date().getTime())) / 1000);
    // Base score calculation: Faster time = more points, fewer moves = more points
    const baseScore = 1000;
    const timePenalty = finalTime * 2;
    const movesPenalty = moves * 10;
    const finalScore = Math.max(100, baseScore - timePenalty - movesPenalty);

    if (user && finalScore > 0) {
      try {
        const { error } = await supabase
          .from('game_memory_scores')
          .insert([{
            profile_id: user.id,
            score: finalScore,
            time_seconds: finalTime,
            moves: moves
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
        .from('game_memory_scores')
        .select(`
          id,
          score,
          time_seconds,
          moves,
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderMenu = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center"
    >
      <div className="w-32 h-32 bg-sky-900 rounded-full flex items-center justify-center shadow-2xl shadow-sky-500/20 mb-8 border-4 border-sky-400">
        <Layers className="w-16 h-16 text-sky-300" />
      </div>
      
      <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-sky-200 mb-4">
        Memorama <span className="text-sky-400">Bíblico</span>
      </h1>
      
      <p className="text-xl text-sky-100/80 mb-12 max-w-lg font-light">
        Entrena tu memoria encontrando las parejas de personajes, objetos y conceptos de la Biblia en el menor tiempo posible.
      </p>
      
      <div className="flex flex-col w-full sm:w-auto gap-4">
        <button
          onClick={startGame}
          className="px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-sky-500/50 transition-all border border-sky-400/30 flex items-center justify-center gap-3"
        >
          <Play className="fill-current" /> Jugar Ahora
        </button>

        <button
          onClick={fetchLeaderboard}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-lg backdrop-blur-sm transition-all border border-white/10 flex items-center justify-center gap-3"
        >
          <Trophy /> Mejores Tiempos
        </button>
      </div>
    </motion.div>
  );

  const renderLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto bg-[#081724] border border-sky-900/50 rounded-2xl p-6 md:p-8 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-sky-900/50">
        <h2 className="text-3xl font-serif font-bold text-sky-400 flex items-center gap-3">
          <Trophy /> Mejores Jugadores
        </h2>
        <button 
          onClick={() => setGameState('menu')}
          className="text-sky-300 hover:text-white transition-colors p-2"
        >
          <X />
        </button>
      </div>
      
      {leaderboardLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-center text-sky-300/60 py-8">Aún no hay puntajes registrados. ¡Sé el primero!</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div 
                key={entry.id} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-r from-sky-900/40 to-transparent border border-sky-500/30' : 
                  'bg-sky-900/10 border border-sky-800/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold w-8 text-center ${
                    index === 0 ? 'text-sky-400' : 'text-sky-700'
                  }`}>
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-sky-900 overflow-hidden flex items-center justify-center">
                    {entry.profiles?.avatar_url ? (
                      <img src={entry.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sky-300 font-bold">
                        {entry.profiles?.first_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold">{entry.profiles?.first_name} {entry.profiles?.last_name}</p>
                    <p className="text-sky-400/70 text-sm">{formatTime(entry.time_seconds)} • {entry.moves} movs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-sky-400 drop-shadow-md">
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
    if (cards.length === 0 && gameState !== 'won') return <div className="text-center py-20 text-sky-200">Preparando cartas...</div>;

    return (
      <div className="flex flex-col items-center max-w-5xl mx-auto">
        
        {/* HUD */}
        <div className="w-full flex justify-between items-center mb-8 px-6 py-4 bg-sky-950/40 border border-sky-800/50 rounded-2xl">
          <div className="text-center">
            <div className="text-sky-400/60 text-xs font-bold uppercase tracking-widest">Movimientos</div>
            <div className="text-2xl font-mono text-white font-bold">{moves}</div>
          </div>
          <div className="text-center">
            <div className="text-sky-400/60 text-xs font-bold uppercase tracking-widest">Tiempo</div>
            <div className="text-2xl font-mono text-sky-300 font-bold">{formatTime(elapsedTime)}</div>
          </div>
          <div className="text-center">
            <div className="text-sky-400/60 text-xs font-bold uppercase tracking-widest">Parejas</div>
            <div className="text-2xl font-mono text-white font-bold">{matches} / {cards.length / 2}</div>
          </div>
        </div>

        {/* Tablero de Cartas */}
        {gameState === 'playing' && (
          <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 w-full max-w-4xl mx-auto perspective-1000">
            {cards.map((card) => (
              <div 
                key={card.uniqueId}
                className="relative aspect-square w-full cursor-pointer group"
                onClick={() => handleCardClick(card.uniqueId)}
                style={{ perspective: "1000px" }}
              >
                <motion.div 
                  className="w-full h-full relative preserve-3d transition-transform duration-500"
                  animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front of card (Face down state) */}
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-sky-800 to-blue-900 border-2 border-sky-600/50 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-sky-500/30 group-hover:border-sky-400 transition-all">
                    <Layers className="w-8 h-8 md:w-12 md:h-12 text-sky-400/50" />
                  </div>
                  
                  {/* Back of card (Face up state) */}
                  <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-xl flex items-center justify-center text-center p-2 border-2 border-sky-300 overflow-hidden" style={{ transform: "rotateY(180deg)" }}>
                    {card.image_url ? (
                      card.image_url.startsWith('<svg') ? (
                        <div className="w-full h-full flex items-center justify-center text-sky-600" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(card.image_url, { USE_PROFILES: { svg: true } }) }} />
                      ) : card.image_url.startsWith('http') || card.image_url.startsWith('/') || card.image_url.startsWith('data:') ? (
                        <img src={card.image_url} alt={card.pair_name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-4xl md:text-6xl flex items-center justify-center h-full w-full">{card.image_url}</span>
                      )
                    ) : (
                      <span className="font-bold text-sky-900 text-sm md:text-lg leading-tight">{card.pair_name}</span>
                    )}
                    {card.isMatched && (
                      <div className="absolute inset-0 bg-green-500/20 rounded-xl flex items-center justify-center border-4 border-green-400"></div>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}

        {/* Win Screen */}
        <AnimatePresence>
          {gameState === 'won' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-b from-[#0a1540] to-[#04081c] border-2 border-sky-500 rounded-3xl p-8 md:p-12 text-center max-w-lg w-full shadow-[0_0_50px_rgba(56,189,248,0.4)] mt-8"
            >
              <Trophy className="w-24 h-24 text-sky-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]" />
              <h2 className="text-4xl font-serif font-bold text-white mb-2">¡Nivel Completado!</h2>
              <p className="text-xl text-sky-200/80 mb-8">
                Has encontrado todas las parejas.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-sky-900/30 rounded-xl p-4 border border-sky-800/50">
                  <div className="text-sky-400 text-sm font-bold uppercase mb-1">Tiempo</div>
                  <div className="text-2xl font-mono text-white">{formatTime(elapsedTime)}</div>
                </div>
                <div className="bg-sky-900/30 rounded-xl p-4 border border-sky-800/50">
                  <div className="text-sky-400 text-sm font-bold uppercase mb-1">Movimientos</div>
                  <div className="text-2xl font-mono text-white">{moves}</div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setGameState('menu')} 
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold"
                >
                  Volver al Menú
                </button>
                <button 
                  onClick={startGame} 
                  className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-black rounded-full font-bold shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center gap-2"
                >
                  <RefreshCw size={18} /> Jugar de Nuevo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#02070d] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0c243f] via-[#02070d] to-[#000000] text-white pt-24 pb-10 px-4">
      <Helmet>
        <title>Memorama Bíblico | Juegos Cristianos</title>
      </Helmet>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Cabecera */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/recursos/juegos" className="text-sky-500/70 hover:text-sky-400 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <X size={16} /> Salir
          </Link>
        </div>

        {gameState === 'menu' && renderMenu()}
        {gameState === 'leaderboard' && renderLeaderboard()}
        {(gameState === 'playing' || gameState === 'won') && renderPlaying()}
      </div>
    </div>
  );
};
