import { motion } from 'framer-motion';
import { ShieldCheck, BarChart4, BellRing, Network, ChevronRight } from 'lucide-react';

export default function Section9Security({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 mb-4 font-semibold text-sm">
          <ShieldCheck className="w-5 h-5" />
          Gobernanza de Datos
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Analíticas y Seguridad</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El nivel más alto de administración. Toma de decisiones informadas mediante mapas de calor, roles jerárquicos estrictos y notificaciones centralizadas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full max-w-6xl">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4"><Network className="w-6 h-6" /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Mapa Estratégico</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Una vista de pájaro de la salud de la iglesia. Cruza datos de asistencia, ingresos financieros y graduaciones del Aula Virtual para detectar ministerios que necesitan apoyo.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4"><ShieldCheck className="w-6 h-6" /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">RBAC (Roles Base Access)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Modelo de seguridad robusto. Un "Líder de Alabanza" solo puede ver el inventario de sonido, mientras que un "Tesorero" solo ve finanzas. El "Pastor" tiene acceso global.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-gold-gradient text-white flex items-center justify-center mb-4"><BellRing className="w-6 h-6" /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Push Notifications</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gestor de alertas globales. Permite enviar anuncios importantes a todos los congregantes a la vez (por ejemplo, cancelación de servicio por mal clima) a través de PWA Web Push.</p>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Arquitectura Técnica <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
