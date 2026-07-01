import { motion } from 'framer-motion';
import { Bot, Sparkles, MessageSquareText, Search, ChevronRight } from 'lucide-react';

interface Props {
  onNext?: () => void;
}

export default function Section14AI({ onNext }: Props) {
  return (
    <div className="h-full flex flex-col p-8 md:p-16 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <span className="text-[#C79D3F] font-bold tracking-wider uppercase text-sm mb-4 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> Módulo 14
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          Asistente de IA Integrado
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Potenciamos el aprendizaje y la administración con inteligencia artificial.
          Respuestas instantáneas, análisis de datos y personalización profunda.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative group order-2 lg:order-1"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900">
            <img 
              src="/presentacion_images/ai.png" 
              alt="Asistente de Inteligencia Artificial" 
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6 order-1 lg:order-2"
        >
          {[
            {
              title: 'Chatbot Bíblico',
              icon: <Bot className="w-6 h-6 text-purple-500" />,
              desc: 'Resuelve dudas bíblicas, encuentra versículos y ofrece explicaciones teológicas alineadas a la doctrina de la iglesia.'
            },
            {
              title: 'Resúmenes Automáticos',
              icon: <MessageSquareText className="w-6 h-6 text-blue-500" />,
              desc: 'Generación automática de bosquejos y puntos clave a partir de los videos de los sermones.'
            },
            {
              title: 'Búsqueda Semántica',
              icon: <Search className="w-6 h-6 text-[#C79D3F]" />,
              desc: 'Encuentra canciones, clases del instituto o peticiones de oración usando lenguaje natural.'
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (idx * 0.1) }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 hover:border-purple-500/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.title}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {onNext && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex justify-center"
        >
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-8 py-4 bg-[#C79D3F] hover:bg-[#b08b35] text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-[#C79D3F]/30"
          >
            Siguiente Sección
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
