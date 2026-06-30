import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play, Gamepad2, BrainCircuit } from 'lucide-react';

const games = [
  {
    id: 'biblionario',
    title: 'Biblionario',
    description: '¿Quién quiere ser Biblionario? Pon a prueba tu conocimiento bíblico en este clásico juego de preguntas.',
    icon: <TrophyIcon />,
    color: 'from-blue-600 to-indigo-600',
    path: '/recursos/juegos/biblionario'
  },
  {
    id: 'hangman',
    title: 'Ahorcado Bíblico',
    description: 'Adivina personajes, lugares y libros de la Biblia antes de que se acaben tus intentos.',
    icon: <Gamepad2 className="w-12 h-12 text-amber-200" />,
    color: 'from-amber-600 to-orange-600',
    path: '/recursos/juegos/ahorcado'
  },
  {
    id: 'memory',
    title: 'Memorama Bíblico',
    description: 'Encuentra las parejas correctas y demuestra tu agilidad mental y memoria.',
    icon: <BrainCircuit className="w-12 h-12 text-emerald-200" />,
    color: 'from-emerald-600 to-teal-600',
    path: '/recursos/juegos/memorama'
  }
];

function TrophyIcon() {
  return (
    <div className="w-12 h-12 flex items-center justify-center bg-yellow-500/20 rounded-full">
      <span className="text-3xl">🏆</span>
    </div>
  );
}

export const GamesCatalog = () => {
  return (
    <div className="min-h-screen bg-[#0d0906] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f1610] via-[#0d0906] to-black pt-24 pb-12 px-4">
      <Helmet>
        <title>Juegos Cristianos | Iglesia Jerusalén</title>
      </Helmet>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-4"
          >
            Juegos Interactivos
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-amber-100/70 text-lg max-w-2xl mx-auto"
          >
            Aprende más sobre la Palabra de Dios mientras te diviertes. 
            Elige un juego y pon a prueba tus conocimientos.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.color} p-[1px] group shadow-2xl shadow-black/50`}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
              
              <div className="relative h-full bg-[#110c08]/90 backdrop-blur-sm rounded-[23px] p-8 flex flex-col items-center text-center">
                <div className="mb-6 transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300">
                  {game.icon}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4">{game.title}</h2>
                <p className="text-white/70 mb-8 flex-grow">{game.description}</p>
                
                <Link
                  to={game.path}
                  className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-white flex items-center justify-center gap-2 group-hover:bg-white group-hover:text-black transition-all duration-300"
                >
                  <Play className="w-5 h-5 fill-current" />
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
