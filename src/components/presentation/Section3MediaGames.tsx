import { motion } from 'framer-motion';
import { Gamepad2, Headphones, Tv, Search, ChevronRight } from 'lucide-react';

export default function Section3MediaGames({ onNext }: { onNext: () => void }) {
  const features = [
    {
      title: "Juegos Bíblicos Interactivos",
      desc: "Incluye 'Quién Quiere Ser Biblionario', 'Ahorcado Bíblico' y 'Memorama'. Con Leaderboards para competencia sana y efectos de sonido para engagement.",
      icon: <Gamepad2 className="w-6 h-6" />,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      title: "Biblioteca de Sermones",
      desc: "Filtros avanzados por predicador, serie y fecha. Reproductor de audio/video integrado que permite escuchar en segundo plano.",
      icon: <Tv className="w-6 h-6" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Cancionero y Alabanzas",
      desc: "Visor interactivo de letras y acordes para los músicos. Permite transposición de notas en tiempo real (cambio de tono) y creación de setlists.",
      icon: <Headphones className="w-6 h-6" />,
      color: "text-gold-500 text-[#C79D3F]",
      bg: "bg-[#C79D3F]/10"
    }
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4 font-semibold text-sm">
            <Gamepad2 className="w-5 h-5" />
            Multimedia y Entretenimiento
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">Media & Juegos</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Retención de usuarios mediante gamificación y consumo de contenido multimedia unificado.
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

      {/* Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {features.map((feat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (idx * 0.15) }}
            className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 ${feat.bg} ${feat.color}`}>
              {feat.icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{feat.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* UI Mockup / Graphic */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="max-w-4xl mx-auto w-full relative h-64 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 overflow-hidden shadow-2xl flex items-center justify-between p-8 md:p-12"
      >
        <div className="z-10 max-w-md">
          <h4 className="text-3xl font-bold text-white mb-2">Búsqueda Global</h4>
          <p className="text-purple-200">Encuentra una prédica, un curso o un producto en la tienda instantáneamente gracias a nuestro motor de búsqueda indexado.</p>
        </div>
        
        <div className="hidden md:flex relative z-10 w-72 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 items-center px-4">
          <Search className="text-white/50 w-6 h-6 mr-3" />
          <div className="w-full h-4 bg-white/20 rounded-full animate-pulse" />
        </div>

        {/* Abstract shapes */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      </motion.div>

    </div>
  );
}
