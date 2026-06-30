import { motion } from 'framer-motion';
import { Music, Video, Search, ChevronRight } from 'lucide-react';

export default function Section3Media({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4 font-semibold text-sm">
          <Video className="w-5 h-5" />
          Medios y Alabanzas
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">La Biblioteca Audiovisual</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Centralizamos todas las enseñanzas en video (Sermones) y unificamos el trabajo del ministerio de alabanza con un cancionero digital inteligente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 w-full max-w-6xl">
        
        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2 mb-2"><Search className="w-5 h-5 text-purple-500"/> Búsqueda Global de Sermones</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Un buscador indexado que permite encontrar prédicas por Pastor, Tema, Libro de la Biblia o fecha. Integrado con Cloudinary para portadas optimizadas.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2 mb-2"><Music className="w-5 h-5 text-gold-500"/> Cancionero (Visor de Acordes)</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Diseñado para los músicos. Las letras de las canciones incluyen acordes en texto estructurado. Cuenta con una herramienta de transposición (+1 o -1 tono) en tiempo real para adaptar la alabanza a la voz del cantante.
            </p>
          </motion.div>
        </div>

        {/* Chord Transposer Interactive Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700/50 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-white font-bold text-xl">Cuán Grande Es Dios</h4>
              <span className="text-slate-400 text-sm">Tono Original: G</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              <button className="px-3 py-1 rounded text-white hover:bg-slate-700">-½</button>
              <span className="text-gold-500 font-bold px-2">G</span>
              <button className="px-3 py-1 rounded text-white hover:bg-slate-700">+½</button>
            </div>
          </div>
          <div className="flex-1 font-mono text-lg space-y-4 text-slate-300 relative overflow-hidden">
             <div>
               <span className="text-gold-400 font-bold">G</span><br/>
               El esplendor de un Rey<br/>
               <span className="text-gold-400 font-bold">Em</span><br/>
               Vestido en Majestad
             </div>
             <div>
               <span className="text-gold-400 font-bold">C</span><br/>
               La tierra alegre está<br/>
               <span className="text-gold-400 font-bold">D</span><br/>
               La tierra alegre está
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent"></div>
          </div>
        </motion.div>

      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Comunidad CRM <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
