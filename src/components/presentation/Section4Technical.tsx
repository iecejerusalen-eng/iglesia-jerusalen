import { motion } from 'framer-motion';
import { Database, Server, Image as ImageIcon, Key, Cloud } from 'lucide-react';

export default function Section4Technical() {
  const techStack = [
    {
      name: 'Vercel',
      icon: Server,
      color: 'text-white',
      bg: 'bg-black',
      desc: 'Despliegue contínuo (CI/CD) y Edge Network global para tiempos de carga milimétricos. Frontend construido en React 18 + Vite.'
    },
    {
      name: 'Supabase',
      icon: Database,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      desc: 'Base de datos PostgreSQL escalable. Maneja el estado en tiempo real (WebSockets) y el sistema de Storage de documentos.'
    },
    {
      name: 'Cloudinary',
      icon: ImageIcon,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      desc: 'Optimización de imágenes sobre la marcha. Transforma, recorta y sirve multimedia adaptándose al dispositivo del usuario.'
    },
    {
      name: 'Google OAuth',
      icon: Key,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      desc: 'Autenticación centralizada y segura. Delegamos la identidad y el 2FA a los estándares más altos de la industria.'
    }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center p-6 md:p-12 pt-24 overflow-y-auto custom-scrollbar">
      <div className="text-center mb-16 shrink-0">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Detalles Técnicos</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Arquitectura robusta, escalable y pensada para desarrolladores. El código es modular y fácil de iterar.
        </p>
      </div>

      <div className="w-full max-w-5xl relative">
        {/* Línea conectora central SVG animada */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-800 -translate-x-1/2 hidden md:block" />
        
        <div className="space-y-12 relative z-10">
          {techStack.map((tech, idx) => {
            const Icon = tech.icon;
            const isEven = idx % 2 === 0;
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Text Content */}
                <div className={`flex-1 text-center ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tech.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{tech.desc}</p>
                </div>

                {/* Node Icon */}
                <div className="shrink-0 w-20 h-20 rounded-full bg-white dark:bg-gray-900 border-4 border-gray-50 dark:border-gray-800 shadow-xl flex items-center justify-center relative z-20">
                  <div className={`p-3 rounded-full ${tech.bg}`}>
                    <Icon className={`w-8 h-8 ${tech.color}`} />
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-20 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl max-w-3xl text-center"
      >
        <Cloud className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Escalabilidad Asegurada</h4>
        <p className="text-gray-600 dark:text-gray-300">
          Al usar Edge Functions de Vercel y Supabase, la plataforma puede manejar desde cientos hasta cientos de miles de congregantes simultáneos sin interrupciones ni aprovisionamiento de servidores.
        </p>
      </motion.div>
    </div>
  );
}
