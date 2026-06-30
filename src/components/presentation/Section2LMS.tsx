import { motion } from 'framer-motion';
import { GraduationCap, PlayCircle, Edit3, BookOpen, ChevronRight } from 'lucide-react';

export default function Section2LMS({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4 font-semibold text-sm">
          <GraduationCap className="w-5 h-5" />
          Módulo de Educación
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Aula Virtual Inteligente</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El LMS (Learning Management System) no solo es para ver videos, incluye herramientas de creación de cursos para pastores y un portal de evaluación completo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 w-full max-w-6xl">
        {/* Netflix UI Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-700/50 relative overflow-hidden h-[400px] flex flex-col"
        >
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 rounded-t-2xl border-b border-slate-700">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="mx-auto text-xs font-mono text-slate-400">Vista del Estudiante (Reproductor)</div>
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-end relative group">
            {/* Fake Thumbnail Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            
            <div className="relative z-10 flex flex-col gap-4">
              <PlayCircle className="w-16 h-16 text-white cursor-pointer hover:scale-110 transition-transform mb-2" />
              <div>
                <div className="text-blue-400 font-bold mb-1 text-sm uppercase tracking-wider">Lección 3 • Curso de Liderazgo</div>
                <h4 className="text-white font-bold text-2xl">La Visión Celular</h4>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "65%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Tools Explained */}
        <div className="flex flex-col gap-6 justify-center">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Edit3 className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold dark:text-white">Course Builder (Arrastrar y Soltar)</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Los administradores pueden armar el temario del curso arrastrando módulos y lecciones. Soporta videos (Cloudinary), PDFs y Quizzes gamificados al final de cada lección.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><BookOpen className="w-6 h-6"/></div>
              <h3 className="text-xl font-bold dark:text-white">LMS Gradebook Automático</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Al finalizar los cuestionarios, el "Gradebook" evalúa automáticamente y registra las calificaciones en la ficha de miembro (CRM) para el control pastoral.
            </p>
          </motion.div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Multimedia <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
