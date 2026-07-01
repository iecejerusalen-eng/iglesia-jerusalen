import { motion } from 'framer-motion';
import { Globe2, TrendingUp, MapPin, Heart, ChevronRight } from 'lucide-react';

interface Props {
  onNext?: () => void;
}

export default function Section12Missions({ onNext }: Props) {
  return (
    <div className="h-full flex flex-col p-8 md:p-16 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <span className="text-[#C79D3F] font-bold tracking-wider uppercase text-sm mb-4 block">
          Módulo 12
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          Misiones y Evangelismo
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Monitorea el alcance global y local. Rastrea conversiones, progreso de discipulado
          y el impacto de los viajes misioneros en tiempo real.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative group order-2 lg:order-1"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900">
            <img 
              src="/presentacion_images/missions.png" 
              alt="Misiones Dashboard" 
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 order-1 lg:order-2"
        >
          {[
            {
              title: 'Crecimiento Espiritual',
              icon: <TrendingUp className="w-8 h-8 text-blue-500" />,
              desc: 'Métricas de finalización de cursos de discipulado.'
            },
            {
              title: 'Alcance Global',
              icon: <Globe2 className="w-8 h-8 text-emerald-500" />,
              desc: 'Mapa interactivo de misioneros apoyados y obras plantadas.'
            },
            {
              title: 'Consolidación',
              icon: <Heart className="w-8 h-8 text-pink-500" />,
              desc: 'Seguimiento uno-a-uno para nuevos creyentes y visitas.'
            },
            {
              title: 'Células / Grupos',
              icon: <MapPin className="w-8 h-8 text-[#C79D3F]" />,
              desc: 'Ubicación y estado de los grupos de conexión en la ciudad.'
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + (idx * 0.1) }}
              className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:shadow-lg transition-all"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
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
