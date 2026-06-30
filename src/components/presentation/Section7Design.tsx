import { motion } from 'framer-motion';
import { Palette, Layout, Wand2, ChevronRight, Image as ImageIcon, Type, Square } from 'lucide-react';

export default function Section7Design({ onNext }: { onNext: () => void }) {

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 mb-4 font-semibold text-sm">
          <Palette className="w-5 h-5" />
          Herramientas Visuales
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Diseño y Personalización</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El equipo de medios tiene el control total sobre la estética de la plataforma. Pueden armar nuevas páginas sin tocar una sola línea de código, usando nuestro Constructor de Bloques.
        </p>
      </div>

      {/* Interactive Micro-Demo: Page Builder Simulator */}
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden mb-16 flex flex-col lg:flex-row">
        
        {/* Sidebar Tools */}
        <div className="w-full lg:w-64 bg-gray-50 dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Librería de Bloques</h3>
          <div className="space-y-3">
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:border-pink-500 hover:shadow-md transition-all">
               <Type className="w-5 h-5 text-gray-400" /> <span className="text-sm font-medium dark:text-gray-200">Encabezado</span>
             </div>
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:border-pink-500 hover:shadow-md transition-all">
               <ImageIcon className="w-5 h-5 text-gray-400" /> <span className="text-sm font-medium dark:text-gray-200">Galería (Cloudinary)</span>
             </div>
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:border-pink-500 hover:shadow-md transition-all">
               <Square className="w-5 h-5 text-gray-400" /> <span className="text-sm font-medium dark:text-gray-200">Formulario</span>
             </div>
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:border-pink-500 hover:shadow-md transition-all">
               <Wand2 className="w-5 h-5 text-gray-400" /> <span className="text-sm font-medium dark:text-gray-200">Botón Animado</span>
             </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-8 bg-gray-100/50 dark:bg-slate-900/50 flex flex-col items-center justify-center relative min-h-[400px]">
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700">Preview</button>
            <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-bold hover:bg-pink-600">Publicar</button>
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-950 shadow-sm border border-gray-200 dark:border-slate-800 border-dashed rounded-xl p-8 text-center"
          >
             <h1 className="text-3xl font-bold dark:text-white mb-4">Congreso de Jóvenes 2026</h1>
             <div className="w-full h-48 bg-gray-100 dark:bg-slate-900 rounded-lg flex items-center justify-center mb-6">
                <ImageIcon className="w-10 h-10 text-gray-300 dark:text-slate-700" />
             </div>
             <button className="px-6 py-3 bg-gold-gradient text-white font-bold rounded-full w-48 mx-auto">Comprar Entrada</button>
          </motion.div>
          
          <div className="mt-8 text-sm text-gray-500 dark:text-slate-500 flex items-center gap-2">
            <Layout className="w-4 h-4" /> Simulación del Page Builder (Arrastra bloques aquí para probar)
          </div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Logística e Inventario <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
