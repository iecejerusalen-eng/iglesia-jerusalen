import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play, Gamepad2, BrainCircuit, UserCheck, Trophy } from 'lucide-react';

const games = [
  {
    id: 'biblionario',
    title: 'Biblionario',
    description: '¿Quién quiere ser Biblionario? Pon a prueba tu conocimiento bíblico en este clásico juego de 15 niveles.',
    icon: <Trophy className="w-12 h-12 text-amber-300" />,
    color: 'from-amber-600 to-yellow-600',
    path: '/recursos/juegos/biblionario'
  },
  {
    id: 'guess_character',
    title: 'Adivina el Personaje',
    description: 'Descubre qué personaje bíblico se oculta tras las pistas de sabiduría reveladas progresivamente.',
    icon: <UserCheck className="w-12 h-12 text-indigo-300" />,
    color: 'from-indigo-600 to-purple-600',
    path: '/recursos/juegos/adivina-personaje'
  },
  {
    id: 'hangman',
    title: 'Ahorcado Bíblico',
    description: 'Adivina personajes, lugares y libros de la Biblia antes de que se acaben tus intentos.',
    icon: <Gamepad2 className="w-12 h-12 text-rose-300" />,
    color: 'from-rose-600 to-pink-600',
    path: '/recursos/juegos/ahorcado'
  },
  {
    id: 'memory',
    title: 'Memorama Bíblico',
    description: 'Encuentra las parejas correctas de conceptos y versículos para ejercitar tu memoria.',
    icon: <BrainCircuit className="w-12 h-12 text-emerald-300" />,
    color: 'from-emerald-600 to-teal-600',
    path: '/recursos/juegos/memorama'
  }
];

export const GamesCatalog = () => {
  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-4 relative font-sans overflow-hidden">
      <Helmet>
        <title>Juegos Bíblicos e Interactivos | Iglesia Jerusalén</title>
      </Helmet>

      {/* Ambient background glowing orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-400 mb-4 tracking-tight"
          >
            Juegos Bíblicos Interactivos
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-300 text-lg max-w-2xl mx-auto font-light"
          >
            Aprende sobre la Palabra de Dios mientras te diviertes solo o en familia. 
            Elige un juego y fortalece tu conocimiento de las Escrituras.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.1 }}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.color} p-[1px] group shadow-2xl`}
            >
              <div className="relative h-full bg-slate-900/90 backdrop-blur-xl rounded-[23px] p-6 flex flex-col items-center text-center">
                <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  {game.icon}
                </div>
                
                <h2 className="text-xl font-bold text-white mb-3">{game.title}</h2>
                <p className="text-slate-300 text-xs leading-relaxed mb-6 flex-grow">{game.description}</p>
                
                <Link
                  to={game.path}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all duration-300"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Jugar Ahora
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
