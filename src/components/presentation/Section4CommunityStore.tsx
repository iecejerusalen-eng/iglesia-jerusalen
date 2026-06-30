import { motion } from 'framer-motion';
import { ShoppingBag, HeartHandshake, Users, Calendar, ChevronRight, Check } from 'lucide-react';

export default function Section4CommunityStore({ onNext }: { onNext: () => void }) {
  const storeFeatures = [
    "Carrito de compras 'Offline-first'",
    "Variantes de productos (Tallas, Colores)",
    "Productos digitales (Descargas de PDF)",
    "Integración con pasarela de pagos"
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar pt-10">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-6xl mx-auto w-full mb-12 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
      >
        <div>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 mb-4 font-semibold text-sm">
            <HeartHandshake className="w-5 h-5" />
            Comunidad y Finanzas
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">Comunidad & Tienda</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Herramientas para mantener a los miembros conectados y gestionar recursos.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={onNext}
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-xl"
        >
          Siguiente Sección <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        
        {/* Community Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 rounded-3xl"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">CRM & Peticiones</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Un muro digital donde la congregación puede subir peticiones de oración de forma pública o anónima. Además, cuenta con un calendario centralizado para eventos de ministerios (Jóvenes, Niños, Damas).
          </p>
          
          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="text-emerald-500" />
              <h4 className="font-bold dark:text-white">Próximo Evento</h4>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="dark:text-gray-300">Retiro de Jóvenes 2026</span>
              <span className="text-emerald-600 font-medium">150 Inscritos</span>
            </div>
          </div>
        </motion.div>

        {/* Store Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-8 rounded-3xl border-t-4 border-t-gold-500 dark:border-t-[#C79D3F]"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gold-gradient text-white flex items-center justify-center shadow-lg shadow-[#C79D3F]/30">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tienda E-Commerce</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            No es solo un catálogo, es una plataforma de comercio electrónico completa, adaptada para vender libros físicos, merchandising de la iglesia o cursos descargables.
          </p>

          <ul className="space-y-3">
            {storeFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </motion.div>

      </div>
    </div>
  );
}
