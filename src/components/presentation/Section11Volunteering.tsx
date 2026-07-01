import { motion } from 'framer-motion';
import { Calendar, Users, ShieldCheck, Clock, ChevronRight } from 'lucide-react';

interface Props {
  onNext?: () => void;
}

export default function Section11Volunteering({ onNext }: Props) {
  const modules = [
    {
      title: 'Gestión de Turnos',
      icon: <Calendar className="w-6 h-6 text-indigo-500" />,
      desc: 'Asignación inteligente de horarios para evitar sobrecargas y asegurar cobertura.'
    },
    {
      title: 'Roles Especializados',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      desc: 'Perfiles para ujieres, multimedia, alabanza y maestros de escuela dominical.'
    },
    {
      title: 'Comunicación Interna',
      icon: <Users className="w-6 h-6 text-[#C79D3F]" />,
      desc: 'Notificaciones automáticas y canales dedicados por ministerio.'
    },
    {
      title: 'Registro de Asistencia',
      icon: <Clock className="w-6 h-6 text-pink-500" />,
      desc: 'Control de llegadas y seguimiento de compromiso del voluntariado.'
    }
  ];

  return (
    <div className="h-full flex flex-col p-8 md:p-16 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <span className="text-[#C79D3F] font-bold tracking-wider uppercase text-sm mb-4 block">
          Módulo 11
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          Voluntariado y Servidores
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Coordina y capacita al equipo que hace posible cada reunión. 
          Un sistema completo para gestionar el corazón servicial de la iglesia.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          {modules.map((mod, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-[#C79D3F]/50 transition-colors"
            >
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm shrink-0">
                {mod.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{mod.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-[#C79D3F]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900">
            <img 
              src="/presentacion_images/volunteering.png" 
              alt="Dashboard de Voluntariado" 
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
