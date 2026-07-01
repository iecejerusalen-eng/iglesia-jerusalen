import { motion } from 'framer-motion';
import { Smartphone, WifiOff, BellRing, ChevronRight } from 'lucide-react';

interface Props {
  onNext?: () => void;
}

export default function Section15Mobile({ onNext }: Props) {
  return (
    <div className="h-full flex flex-col p-8 md:p-16 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <span className="text-[#C79D3F] font-bold tracking-wider uppercase text-sm mb-4 block">
          Módulo 15
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          Experiencia Móvil (PWA)
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Lleva la iglesia en el bolsillo. Una aplicación rápida, instalable y optimizada 
          para funcionar incluso cuando no hay conexión a internet.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          {[
            {
              title: 'Instalación Nativa',
              icon: <Smartphone className="w-8 h-8 text-indigo-500" />,
              desc: 'Instalable desde el navegador (PWA) sin pasar por las tiendas de aplicaciones. Actualizaciones automáticas invisibles.'
            },
            {
              title: 'Modo Offline-First',
              icon: <WifiOff className="w-8 h-8 text-[#C79D3F]" />,
              desc: 'Accede a la Biblia, el cancionero y tus apuntes de sermones incluso sin conexión o en modo avión.'
            },
            {
              title: 'Notificaciones Push',
              icon: <BellRing className="w-8 h-8 text-pink-500" />,
              desc: 'Alertas inmediatas sobre recordatorios de cursos, anuncios urgentes o peticiones de oración de la comunidad.'
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="flex gap-5 p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 hover:border-[#C79D3F]/50 transition-colors shadow-sm"
            >
              <div className="shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative group flex justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent rounded-[3rem] blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-gray-800 shadow-2xl bg-slate-900 w-full max-w-sm">
            <img 
              src="/presentacion_images/mobile.png" 
              alt="Aplicación Móvil" 
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
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
