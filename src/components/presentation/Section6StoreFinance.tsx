import { motion } from 'framer-motion';
import { ShoppingBag, Landmark, WifiOff, Banknote, ChevronRight } from 'lucide-react';

export default function Section6StoreFinance({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 mb-4 font-semibold text-sm">
          <Landmark className="w-5 h-5" />
          Comercio y Tesorería
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Gestión de Tienda y Finanzas</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Un flujo completo para la comercialización de material de estudio y el rastreo de aportes, construido sobre una arquitectura que sobrevive a las caídas de internet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 w-full max-w-6xl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 rounded-3xl border-t-4 border-t-green-500">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="w-8 h-8 text-green-500" />
            <h3 className="text-2xl font-bold dark:text-white">Tienda Offline-First</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            El carrito de compras usa <strong>Zustand con persistencia (Local Storage)</strong>. Si un usuario en la congregación agrega libros a su carrito pero pierde conexión a internet, el carrito no se vaciará. 
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 flex items-center gap-4">
             <WifiOff className="w-6 h-6 text-gray-400" />
             <div className="text-sm text-gray-600 dark:text-gray-300">
               <strong>Sync Queue:</strong> Las intenciones de compra y visualización de productos operan localmente y se resincronizan con la DB en el momento que se detecta señal web.
             </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-8 rounded-3xl border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-3 mb-6">
            <Banknote className="w-8 h-8 text-emerald-500" />
            <h3 className="text-2xl font-bold dark:text-white">Dashboard de Tesorería</h3>
          </div>
          <ul className="space-y-4">
             <li className="flex gap-3 text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                Manejo centralizado de diezmos y ofrendas. El administrador puede rastrear ingresos mensuales.
             </li>
             <li className="flex gap-3 text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                Los usuarios pueden subir comprobantes de pago (transferencias bancarias) para las compras en la tienda, los cuales son verificados manualmente por el tesorero en este módulo.
             </li>
          </ul>
        </motion.div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Herramientas de Diseño <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
