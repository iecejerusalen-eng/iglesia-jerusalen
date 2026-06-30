import { motion } from 'framer-motion';
import { Package, CalendarDays, Mic, Server, Truck, ChevronRight } from 'lucide-react';

export default function Section8Logistics({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 mb-4 font-semibold text-sm">
          <Truck className="w-5 h-5" />
          Operaciones y Logística
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Gestión Detrás de Escena</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El éxito de una reunión dominical depende de la organización. Aquí controlamos los activos físicos (instrumentos, cámaras) y el cronograma del servicio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 w-full max-w-6xl">
        
        {/* Production Board */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 rounded-3xl border-t-4 border-t-amber-500">
          <div className="flex items-center gap-3 mb-6">
            <CalendarDays className="w-8 h-8 text-amber-500" />
            <h3 className="text-2xl font-bold dark:text-white">Production Board</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Un tablero interactivo tipo Kanban/Línea de tiempo para el Director de Servicio. Permite ver el cronograma minuto a minuto de un evento.
          </p>
          <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-l-blue-500">
                <div className="font-bold text-sm dark:text-white">10:00 AM - Alabanza</div>
                <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-gray-300">30 min</div>
             </div>
             <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-l-gold-500">
                <div className="font-bold text-sm dark:text-white">10:30 AM - Anuncios</div>
                <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-gray-300">10 min</div>
             </div>
             <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-l-purple-500">
                <div className="font-bold text-sm dark:text-white">10:40 AM - Prédica</div>
                <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-gray-300">45 min</div>
             </div>
          </div>
        </motion.div>

        {/* Inventory Manager */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 rounded-3xl border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-blue-500" />
            <h3 className="text-2xl font-bold dark:text-white">Gestor de Inventario</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Control de activos fijos. Evita la pérdida de equipos registrando a qué ministerio están asignados y cuál es su estado actual de mantenimiento.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center">
               <Mic className="w-6 h-6 text-gray-400 dark:text-slate-500 mb-2" />
               <div className="text-xs font-bold text-gray-900 dark:text-white">Shure SM58</div>
               <div className="text-[10px] text-green-600 dark:text-green-400 mt-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">En Uso (Alabanza)</div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center">
               <Server className="w-6 h-6 text-gray-400 dark:text-slate-500 mb-2" />
               <div className="text-xs font-bold text-gray-900 dark:text-white">Consola X32</div>
               <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">Mantenimiento</div>
             </div>
          </div>
        </motion.div>

      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Analíticas y Seguridad <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
