import { motion } from 'framer-motion';
import { Server, Database, Image as ImageIcon, Zap, Cloud, Code2 } from 'lucide-react';

export default function Section6Tech() {
  const techCards = [
    {
      title: "Edge Network (Vercel)",
      desc: "Despliegue distribuido globalmente. Funciones Serverless y Edge para carga instántanea y optimización SEO con Server-Side Rendering (SSR).",
      icon: <Server />,
      color: "text-white",
      bg: "bg-black dark:bg-white/10"
    },
    {
      title: "Base de Datos (Supabase)",
      desc: "PostgreSQL con Row Level Security (RLS). Garantiza que cada usuario solo acceda a su propia información de perfil y pagos.",
      icon: <Database />,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      title: "Estado Offline (Zustand)",
      desc: "Arquitectura 'Offline-First'. El carrito de compras y el progreso de los cursos se guardan en el dispositivo y se sincronizan al recuperar la conexión.",
      icon: <Zap />,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10"
    },
    {
      title: "Media (Cloudinary)",
      desc: "Transcodificación de video al vuelo y optimización de imágenes adaptables al ancho de banda del dispositivo del usuario.",
      icon: <ImageIcon />,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-4 font-semibold text-sm">
            <Code2 className="w-5 h-5" />
            Ingeniería & Software
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">Arquitectura de Software</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Desarrollado con estándares de la industria tecnológica para soportar escalabilidad infinita y seguridad de grado bancario.
          </p>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {techCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (idx * 0.1) }}
            className="glass-card p-8 rounded-3xl flex gap-6 items-start group hover:border-slate-400/50 dark:hover:border-slate-500/50 transition-colors"
          >
            <div className={`p-4 rounded-2xl shrink-0 ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{card.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Security Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="max-w-6xl mx-auto w-full bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl mb-20"
      >
        <div className="shrink-0 p-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <Cloud className="w-16 h-16 text-blue-300" />
        </div>
        <div>
          <h4 className="text-3xl font-bold mb-3">Seguridad y Escalabilidad en la Nube</h4>
          <p className="text-blue-100 text-lg leading-relaxed max-w-3xl">
            Toda la infraestructura está alojada en servidores con certificaciones SOC2 y cifrado AES-256 en reposo. 
            No utilizamos un servidor central que pueda "caerse", sino una red global de microservicios.
          </p>
        </div>
      </motion.div>

    </div>
  );
}
