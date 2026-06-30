import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Star, ChevronRight } from 'lucide-react';

export default function Section5Games({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 mb-4 font-semibold text-sm">
          <Gamepad2 className="w-5 h-5" />
          Gamificación
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Aprender Jugando</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Convertimos el aprendizaje bíblico en un hábito atractivo mediante minijuegos interactivos conectados a una tabla de clasificación global.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full max-w-6xl">
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center mb-4 shadow-lg"><Star className="w-8 h-8" /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Biblionario</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Modo de preguntas "Quién Quiere ser Millonario" con comodines de vida y temporizador. El administrador puede importar bancos de preguntas CSV.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center mb-4 shadow-lg"><Gamepad2 className="w-8 h-8" /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Memorama Bíblico</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Emparejamiento de personajes y versículos. El estado de las cartas está gestionado por hooks de React de alto rendimiento.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center mb-4 shadow-lg"><Trophy className="w-8 h-8" /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Leaderboard</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tabla de clasificación global. Al ganar una partida, los puntos se sincronizan con Supabase en tiempo real premiando a los primeros 10 lugares.</p>
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Tienda y Finanzas <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
