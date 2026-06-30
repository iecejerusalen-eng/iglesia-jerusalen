import { motion } from 'framer-motion';
import { Server, Database, Zap, Cloud, Code2, Key } from 'lucide-react';

const techStack = [
  {
    title: 'Vercel — Edge Network',
    icon: <Server />, color: 'text-white', bg: 'bg-black dark:bg-white/10',
    details: [
      'Deploy automático al hacer Push a la rama "main" de GitHub (CI/CD).',
      'La app se distribuye en más de 100 servidores edge alrededor del mundo.',
      'React 18 + Vite para cargas en milisegundos (menos de 1.5s TTFB).',
      'Variables de entorno seguras almacenadas en Vercel (no en el código).',
    ],
  },
  {
    title: 'Supabase — Base de Datos',
    icon: <Database />, color: 'text-green-500', bg: 'bg-green-500/10',
    details: [
      'PostgreSQL 15 con Row Level Security (RLS) activo en todas las tablas.',
      'Realtime WebSockets para el Leaderboard de Juegos y el Chat.',
      'Storage para documentos y comprobantes de pago de la tienda.',
      'Google OAuth integrado directamente sin backend adicional.',
    ],
  },
  {
    title: 'Zustand — Estado Offline',
    icon: <Zap />, color: 'text-yellow-500', bg: 'bg-yellow-500/10',
    details: [
      'Arquitectura "Offline-First" para el carrito de compras y progreso de cursos.',
      'Persistencia en Local Storage con hidratación automática al recargar.',
      'Mutaciones optimistas: la UI responde antes de confirmar con el servidor.',
      'Sincronización de cola de operaciones al recuperar conexión a internet.',
    ],
  },
  {
    title: 'Cloudinary — Multimedia',
    icon: <Cloud />, color: 'text-blue-500', bg: 'bg-blue-500/10',
    details: [
      'Subida directa desde el admin con optimización automática de imágenes.',
      'Transformaciones on-the-fly: recorte, cambio de tamaño y formato (WebP).',
      'CDN global para servir videos de los sermones y del Aula Virtual.',
      'Generación automática de miniaturas para los videos del LMS.',
    ],
  },
];

const envVars = [
  { key: 'VITE_SUPABASE_URL', desc: 'URL del proyecto en Supabase' },
  { key: 'VITE_SUPABASE_ANON_KEY', desc: 'Clave pública anónima de Supabase' },
  { key: 'VITE_CLOUDINARY_CLOUD_NAME', desc: 'Nombre del cloud en Cloudinary' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Clave privada (solo servidor)' },
];

const integrations = [
  { name: 'Supabase', tag: 'Base de Datos', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { name: 'Vercel', tag: 'Hosting', color: 'bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-200' },
  { name: 'Cloudinary', tag: 'Media CDN', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { name: 'Google OAuth', tag: 'Autenticación', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  { name: 'Zustand', tag: 'State Manager', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  { name: 'Framer Motion', tag: 'Animaciones', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
];

export default function Section10Architecture() {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content pb-20">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 mb-4 font-semibold text-sm">
          <Code2 className="w-5 h-5" /> Para Desarrolladores
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Arquitectura Técnica</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          El stack tecnológico que sostiene los 32 módulos. Cada herramienta fue elegida por 
          su rendimiento, seguridad y facilidad de mantenimiento a largo plazo.
        </p>
      </div>

      {/* Tech Stack Deep Dive */}
      <div className="w-full max-w-6xl mb-12 relative">
        <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-gray-200 via-[#C79D3F] to-gray-200 dark:from-slate-800 dark:via-[#C79D3F] dark:to-slate-800 z-0 hidden md:block" />
        <div className="space-y-8">
          {techStack.map((tech, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
              className="flex items-start gap-6 relative z-10">
              <div className={`w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center ${tech.bg} ${tech.color} shadow-xl border-4 border-white dark:border-slate-950`}>
                <div className="[&>svg]:w-8 [&>svg]:h-8">{tech.icon}</div>
              </div>
              <div className="glass-panel p-6 rounded-2xl flex-1">
                <h3 className="text-xl font-bold dark:text-white mb-3">{tech.title}</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tech.details.map((d, j) => (
                    <li key={j} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-[#C79D3F] mt-0.5 flex-shrink-0">›</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Integrations Table */}
      <div className="w-full max-w-6xl mb-12">
        <h3 className="text-2xl font-bold dark:text-white mb-6">Tabla de Integraciones</h3>
        <div className="flex flex-wrap gap-3">
          {integrations.map((int, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
              className={`px-5 py-3 rounded-2xl ${int.color} flex flex-col items-center min-w-[100px]`}>
              <span className="font-bold text-sm">{int.name}</span>
              <span className="text-xs opacity-70">{int.tag}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Env Vars */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-gray-500" />
          <h3 className="text-2xl font-bold dark:text-white">Variables de Entorno Requeridas</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Para montar el proyecto en un entorno local o nuevo servidor, se necesita un archivo <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">.env</code> con las siguientes variables:
        </p>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full font-mono text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Variable</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {envVars.map((ev, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3 text-[#C79D3F] text-xs">{ev.key}</td>
                  <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs font-sans">{ev.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
