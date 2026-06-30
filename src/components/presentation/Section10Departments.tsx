import { motion } from 'framer-motion';
import { ChevronRight, Music, Baby, Users, ClipboardList, CheckCircle2, LayoutGrid } from 'lucide-react';

const ministries = [
  {
    title: 'Ministerio de Alabanza',
    icon: <Music className="w-8 h-8 text-indigo-500" />,
    color: 'border-indigo-500/30 hover:border-indigo-500 shadow-indigo-500/5',
    tag: 'Production Board',
    tagColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    features: [
      'Setlists semanales sincronizados con Spotify/YouTube.',
      'Gestión de rotación de músicos y cantantes.',
      'Inventario de equipos de audio e instrumentos.',
      'Recursos para ensayos (cifrados, partituras).'
    ]
  },
  {
    title: 'Ministerio Infantil (Kids)',
    icon: <Baby className="w-8 h-8 text-pink-500" />,
    color: 'border-pink-500/30 hover:border-pink-500 shadow-pink-500/5',
    tag: 'Check-in Seguro',
    tagColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    features: [
      'Sistema de Check-in rápido con códigos QR.',
      'Alertas críticas de alergias y necesidades especiales.',
      'Plan de estudios semanal para maestros.',
      'Control estricto de tutores autorizados.'
    ]
  },
  {
    title: 'Ujieres y Logística',
    icon: <ClipboardList className="w-8 h-8 text-green-500" />,
    color: 'border-green-500/30 hover:border-green-500 shadow-green-500/5',
    tag: 'Control en Tiempo Real',
    tagColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    features: [
      'Conteo rápido de asistencia en la app móvil.',
      'Registro de incidentes o peticiones durante el culto.',
      'Módulo de requerimientos de mantenimiento.',
      'Directorio de contactos de emergencia unificado.'
    ]
  },
  {
    title: 'Grupos Pequeños',
    icon: <Users className="w-8 h-8 text-[#C79D3F]" />,
    color: 'border-[#C79D3F]/30 hover:border-[#C79D3F] shadow-[#C79D3F]/5',
    tag: 'Seguimiento Pastoral',
    tagColor: 'bg-[#C79D3F]/10 text-[#C79D3F] dark:bg-[#C79D3F]/20',
    features: [
      'Reporte semanal de asistencia del grupo (Offline-First).',
      'Seguimiento del crecimiento espiritual de cada miembro.',
      'Geolocalización de grupos para nuevos creyentes.',
      'Mensajería interna entre el líder y los miembros.'
    ]
  }
];

export default function Section10Departments({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4 font-semibold text-sm">
          <LayoutGrid className="w-5 h-5" /> Módulos Especializados
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Departamentos y Ministerios
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          La plataforma se adapta a las necesidades de cada ministerio. No es solo software de administración general, 
          es un ecosistema de herramientas específicas para empoderar a cada líder y voluntario en su servicio.
        </motion.p>
      </div>

      {/* Ministries Grid */}
      <div className="w-full max-w-6xl mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ministries.map((min, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className={`glass-panel p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl ${min.color} relative overflow-hidden group`}
            >
              {/* Background Glow */}
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity bg-current blur-3xl" />
              
              <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                <div className="flex flex-col gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center flex-shrink-0">
                    {min.icon}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-center ${min.tagColor}`}>
                    {min.tag}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold dark:text-white mb-4">{min.title}</h3>
                  <ul className="space-y-3">
                    {min.features.map((feature, j) => (
                      <li key={j} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 items-start">
                        <CheckCircle2 className="w-5 h-5 opacity-70 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full max-w-6xl mb-12 bg-slate-900 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C79D3F]/10 blur-[100px] rounded-full pointer-events-none" />
        <h3 className="text-2xl font-bold text-white mb-3 relative z-10">¿Un ministerio no está en la lista?</h3>
        <p className="text-slate-400 max-w-2xl relative z-10">
          La arquitectura modular de la plataforma permite desplegar nuevos "Espacios de Ministerio" en minutos. 
          Cada espacio hereda automáticamente la base de datos de miembros y el sistema de notificaciones global.
        </p>
      </motion.div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl hover:scale-105 transition-all">
        Ver Arquitectura Técnica <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
