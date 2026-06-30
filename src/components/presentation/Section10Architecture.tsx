import { motion } from 'framer-motion';
import { Server, Database, Zap, Cloud, Code2 } from 'lucide-react';

export default function Section10Architecture() {
  const techCards = [
    {
      title: "Edge Network (Vercel)",
      desc: "Despliegue distribuido globalmente. Funciones Serverless para carga instántanea y optimización SEO (React 18 + Vite).",
      icon: <Server />,
      color: "text-white",
      bg: "bg-black dark:bg-white/10"
    },
    {
      title: "Base de Datos (Supabase)",
      desc: "PostgreSQL con Row Level Security (RLS). Garantiza que cada usuario solo acceda a su propia información.",
      icon: <Database />,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      title: "Estado Offline (Zustand)",
      desc: "Arquitectura 'Offline-First'. Mutaciones optimistas para el carrito y los cursos.",
      icon: <Zap />,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10"
    },
    {
      title: "Media (Cloudinary)",
      desc: "Compresión en tiempo real de imágenes y videos del Aula Virtual.",
      icon: <Cloud />,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    }
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar scrollable-content pb-20">
      
      <div className="max-w-6xl w-full mb-12">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 mb-4 font-semibold text-sm">
          <Code2 className="w-5 h-5" />
          Para Desarrolladores
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Arquitectura Técnica</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El Stack tecnológico que sostiene los 32 módulos. Construido para ser escalable, seguro y extremadamente rápido.
        </p>
      </div>

      <div className="w-full max-w-6xl relative mb-20">
        <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-gray-300 via-gold-500 to-gray-300 dark:from-slate-800 dark:via-gold-500 dark:to-slate-800 z-0 hidden md:block"></div>
        
        <div className="space-y-12">
          {techCards.map((tech, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-center gap-8 relative z-10"
            >
              <div className={`w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center ${tech.bg} ${tech.color} shadow-xl border-4 border-white dark:border-slate-950`}>
                <div className="[&>svg]:w-8 [&>svg]:h-8">{tech.icon}</div>
              </div>
              <div className="glass-panel p-6 rounded-2xl flex-1 max-w-2xl hover:scale-[1.02] transition-transform cursor-default">
                <h3 className="text-xl font-bold dark:text-white mb-2">{tech.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{tech.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
