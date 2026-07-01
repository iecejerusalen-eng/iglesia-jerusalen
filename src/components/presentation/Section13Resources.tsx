import { motion } from 'framer-motion';
import { Camera, Building2, Wrench, CalendarCheck, ChevronRight } from 'lucide-react';

interface Props {
  onNext?: () => void;
}

export default function Section13Resources({ onNext }: Props) {
  const resources = [
    {
      title: 'Reserva de Espacios',
      icon: <Building2 className="w-6 h-6 text-indigo-500" />,
      desc: 'Calendario centralizado para reservar el auditorio, salones de ensayo o aulas.'
    },
    {
      title: 'Inventario de Equipos',
      icon: <Camera className="w-6 h-6 text-pink-500" />,
      desc: 'Control de cámaras, instrumentos, micrófonos y equipo técnico.'
    },
    {
      title: 'Mantenimiento',
      icon: <Wrench className="w-6 h-6 text-amber-500" />,
      desc: 'Reporte de incidencias y seguimiento a reparaciones de las instalaciones.'
    },
    {
      title: 'Aprobaciones',
      icon: <CalendarCheck className="w-6 h-6 text-emerald-500" />,
      desc: 'Flujo de trabajo para autorizar el uso de recursos costosos.'
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
          Módulo 13
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          Recursos e Instalaciones
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Un sistema eficiente para la gestión del inventario y la agenda de uso
          de las diferentes áreas de la iglesia.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          {resources.map((res, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 hover:border-[#C79D3F]/50 transition-colors shadow-sm"
            >
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 shrink-0 border border-gray-100 dark:border-white/10">
                {res.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{res.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{res.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900">
            <img 
              src="/presentacion_images/resources.png" 
              alt="Reserva de Recursos" 
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
