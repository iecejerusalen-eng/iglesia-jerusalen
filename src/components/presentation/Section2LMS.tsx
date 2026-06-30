import { motion } from 'framer-motion';
import { GraduationCap, PlayCircle, Award, BookOpen, ChevronRight } from 'lucide-react';

export default function Section2LMS({ onNext }: { onNext: () => void }) {
  const lmsFeatures = [
    {
      title: "Reproductor de Cursos Nativo",
      desc: "Interfaz inmersiva tipo Netflix. Guarda el progreso del video automáticamente. Soporta streaming adaptativo mediante Cloudinary.",
      icon: <PlayCircle />
    },
    {
      title: "Cuestionarios Gamificados",
      desc: "Evaluaciones interactivas al final de cada módulo. Feedback inmediato y registro de calificaciones en el Gradebook del administrador.",
      icon: <BookOpen />
    },
    {
      title: "Sistema de Certificación",
      desc: "Al concluir la 'Ruta del Creyente' o estudios teológicos, el sistema emite certificados PDF dinámicos con validación QR.",
      icon: <Award />
    }
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar pt-10">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-6xl mx-auto w-full mb-12 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
      >
        <div>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4 font-semibold text-sm">
            <GraduationCap className="w-5 h-5" />
            Módulo Educativo
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">Aula Virtual (LMS)</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Un sistema de gestión de aprendizaje (LMS) robusto, creado específicamente para la formación teológica y discipulado.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={onNext}
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-xl"
        >
          Siguiente Sección <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
        
        {/* Left Col: Features */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {lmsFeatures.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (idx * 0.1) }}
              className="glass-card p-6 rounded-2xl hover:border-blue-500/50 transition-colors group cursor-default"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{feat.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right Col: Interactive Mockup / SVG Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-7 bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-700/50 relative overflow-hidden min-h-[400px] flex flex-col"
        >
          {/* Mac window header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 rounded-t-2xl">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="mx-auto text-xs font-mono text-slate-400">Jerusalen LMS - Dashboard del Estudiante</div>
          </div>
          
          {/* Fake Video Player area */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div className="w-full aspect-video bg-black rounded-xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white/50 group-hover:text-white transition-colors cursor-pointer" />
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "65%" }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>

            {/* Fake metadata */}
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-white font-bold text-lg">Módulo 1: Fundamentos de la Fe</h4>
                <div className="text-slate-400 text-sm mt-1">Lección 3 de 12 • Impartido por Pastor Principal</div>
              </div>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                65% Completado
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
