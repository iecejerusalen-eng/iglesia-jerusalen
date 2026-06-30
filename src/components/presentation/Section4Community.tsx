import { motion } from 'framer-motion';
import { Users, Shield, HeartHandshake, ChevronRight, Lock } from 'lucide-react';

export default function Section4Community({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 mb-4 font-semibold text-sm">
          <HeartHandshake className="w-5 h-5" />
          Comunidad CRM
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">El Corazón de la Iglesia</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El Directorio de Miembros (CRM) y el muro de Peticiones de Oración mantienen a la congregación unida, con reglas estrictas de privacidad y moderación pastoral.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 w-full max-w-6xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8 rounded-3xl relative overflow-hidden">
          <Users className="absolute -bottom-4 -right-4 w-40 h-40 text-teal-500/10" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Directorio de Miembros</h3>
          <ul className="space-y-4">
             <li className="flex gap-3 text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                Ficha centralizada para cada congregante. Muestra los ministerios en los que sirve y su historial educativo (Aula Virtual).
             </li>
             <li className="flex gap-3 text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                Lleva un registro de los cumpleaños automatizado y notifica a los líderes para mantener el cuidado pastoral activo.
             </li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 rounded-3xl relative overflow-hidden">
          <Shield className="absolute -bottom-4 -right-4 w-40 h-40 text-red-500/10" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">Peticiones y Privacidad <Lock className="w-5 h-5 text-red-500"/></h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
             El muro de peticiones cuenta con un sistema de estados (Enviada, En Oración, Contestada) que el usuario puede rastrear.
          </p>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4">
            <h4 className="text-red-800 dark:text-red-400 font-bold text-sm mb-2">Modo Privado Total</h4>
            <p className="text-xs text-red-700 dark:text-red-300">Si un usuario marca una petición como "Sensible", las políticas de RLS de Supabase garantizan a nivel de servidor que la petición solo podrá ser leída por usuarios con rol de "Pastor", ocultándola por completo del muro público.</p>
          </div>
        </motion.div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Juegos Bíblicos <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
