import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Database, Zap, Cloud, Code2, Key, 
  ShieldCheck, Activity, Globe, WifiOff, Cpu, Lock, 
  ArrowRight, Layers, Smartphone
} from 'lucide-react';
import { useState } from 'react';

const techStack = [
  {
    title: 'Vercel — Edge Network',
    icon: <Server />, color: 'text-white', bg: 'bg-black dark:bg-white/10',
    border: 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-500',
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
    border: 'border-green-200 dark:border-green-900/50 hover:border-green-400 dark:hover:border-green-600',
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
    border: 'border-yellow-200 dark:border-yellow-900/50 hover:border-yellow-400 dark:hover:border-yellow-600',
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
    border: 'border-blue-200 dark:border-blue-900/50 hover:border-blue-400 dark:hover:border-blue-600',
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

const pillars = [
  {
    icon: <WifiOff className="w-6 h-6 text-[#C79D3F]" />,
    title: 'Offline-First',
    desc: 'Los usuarios pueden consumir contenido previamente cargado incluso sin conexión. Al recuperar la red, los datos se sincronizan en segundo plano.'
  },
  {
    icon: <Lock className="w-6 h-6 text-[#C79D3F]" />,
    title: 'Security by Design',
    desc: 'Autenticación robusta, validación de schemas con Zod, y RLS (Row Level Security) en PostgreSQL para aislar los datos de cada usuario.'
  },
  {
    icon: <Cpu className="w-6 h-6 text-[#C79D3F]" />,
    title: 'Alta Disponibilidad',
    desc: 'Despliegue en el Edge con Vercel. Si un nodo falla, el tráfico se redirige automáticamente, garantizando un uptime del 99.9%.'
  }
];

export default function Section10Architecture() {
  const [activeTab, setActiveTab] = useState<'stack' | 'flow' | 'env'>('flow');

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content pb-20">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 mb-4 font-semibold text-sm">
          <Code2 className="w-5 h-5 text-[#C79D3F]" /> Para Desarrolladores e Ingenieros
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Arquitectura Técnica y de Datos
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Un sistema modular, altamente escalable y resistente a fallos, construido sobre los estándares más modernos de la web para garantizar velocidad, seguridad y una experiencia premium sin fricciones.
        </motion.p>
      </div>

      {/* Pillars */}
      <div className="w-full max-w-6xl mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((pillar, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + (i * 0.1) }}
            className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-[#C79D3F]/10 flex items-center justify-center mb-4">
              {pillar.icon}
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">{pillar.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{pillar.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs Control */}
      <div className="w-full max-w-6xl mb-8 flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('flow')} className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'flow' ? 'bg-[#C79D3F] text-white shadow-lg shadow-[#C79D3F]/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
          <Layers className="w-4 h-4 inline-block mr-2 -mt-0.5" /> Flujo de Datos
        </button>
        <button onClick={() => setActiveTab('stack')} className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'stack' ? 'bg-[#C79D3F] text-white shadow-lg shadow-[#C79D3F]/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
          <Server className="w-4 h-4 inline-block mr-2 -mt-0.5" /> Stack Tecnológico
        </button>
        <button onClick={() => setActiveTab('env')} className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'env' ? 'bg-[#C79D3F] text-white shadow-lg shadow-[#C79D3F]/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
          <Key className="w-4 h-4 inline-block mr-2 -mt-0.5" /> Entorno y Configuración
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-6xl min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* FLOW TAB */}
          {activeTab === 'flow' && (
            <motion.div key="flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full relative">
              <div className="glass-panel p-8 rounded-3xl border border-gray-200 dark:border-slate-800 relative overflow-hidden bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-900/80 dark:to-slate-900/40">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C79D3F]/10 blur-[100px] rounded-full" />

                <h3 className="text-2xl font-bold dark:text-white mb-10 text-center relative z-10">Arquitectura de Comunicación</h3>

                <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto relative z-10 gap-8 md:gap-0">
                  
                  {/* Client Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 flex items-center justify-center relative z-20">
                      <Smartphone className="w-10 h-10 text-indigo-500" />
                    </div>
                    <div className="mt-4 text-center">
                      <h4 className="font-bold dark:text-white">Cliente (Frontend)</h4>
                      <p className="text-xs text-gray-500 mt-1">React, Zustand<br/>Cache Local</p>
                    </div>
                  </div>

                  {/* Animated Connections */}
                  <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-0 w-full md:w-auto relative h-20 md:h-auto">
                     <div className="hidden md:block w-full h-[2px] bg-gradient-to-r from-indigo-500/20 via-purple-500/50 to-green-500/20 absolute top-1/2 -translate-y-1/2"></div>
                     {/* Data Particles */}
                     <motion.div 
                        animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="hidden md:block absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" 
                     />
                     <motion.div 
                        animate={{ left: ['100%', '0%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1 }}
                        className="hidden md:block absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" 
                     />
                     <div className="md:hidden w-[2px] h-full bg-gradient-to-b from-indigo-500/20 via-purple-500/50 to-green-500/20 absolute left-1/2 -translate-x-1/2"></div>
                  </div>

                  {/* Edge Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 flex items-center justify-center relative z-20">
                      <Globe className="w-10 h-10 text-purple-500" />
                    </div>
                    <div className="mt-4 text-center">
                      <h4 className="font-bold dark:text-white">Edge (Vercel)</h4>
                      <p className="text-xs text-gray-500 mt-1">Routing, Auth<br/>SSR / SSG</p>
                    </div>
                  </div>

                  {/* Animated Connections */}
                  <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-0 w-full md:w-auto relative h-20 md:h-auto">
                     <div className="hidden md:block w-full h-[2px] bg-gradient-to-r from-purple-500/20 via-green-500/50 to-blue-500/20 absolute top-1/2 -translate-y-1/2"></div>
                     <motion.div 
                        animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                        className="hidden md:block absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
                     />
                     <div className="md:hidden w-[2px] h-full bg-gradient-to-b from-purple-500/20 via-green-500/50 to-blue-500/20 absolute left-1/2 -translate-x-1/2"></div>
                  </div>

                  {/* DB Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 flex items-center justify-center relative z-20">
                      <Database className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="mt-4 text-center">
                      <h4 className="font-bold dark:text-white">Base de Datos</h4>
                      <p className="text-xs text-gray-500 mt-1">Supabase (PostgreSQL)<br/>WebSockets RLS</p>
                    </div>
                  </div>

                </div>

                {/* Legend or extra info */}
                <div className="mt-12 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 text-sm text-gray-600 dark:text-gray-300 backdrop-blur-md relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span>Todas las conexiones están cifradas de extremo a extremo (TLS 1.3).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <span>Latencia promedio: ~45ms</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STACK TAB */}
          {activeTab === 'stack' && (
            <motion.div key="stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="w-full relative">
                <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-gray-200 via-[#C79D3F] to-gray-200 dark:from-slate-800 dark:via-[#C79D3F] dark:to-slate-800 z-0 hidden md:block" />
                <div className="space-y-6">
                  {techStack.map((tech, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                      className="flex items-start gap-6 relative z-10 group">
                      <div className={`w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center ${tech.bg} ${tech.color} shadow-lg border-4 border-white dark:border-slate-950 transition-transform duration-300 group-hover:scale-110`}>
                        <div className="[&>svg]:w-8 [&>svg]:h-8">{tech.icon}</div>
                      </div>
                      <div className={`glass-panel p-6 rounded-2xl flex-1 border transition-colors duration-300 ${tech.border}`}>
                        <h3 className="text-xl font-bold dark:text-white mb-3">{tech.title}</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {tech.details.map((d, j) => (
                            <li key={j} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 items-start">
                              <span className="text-[#C79D3F] mt-0.5 flex-shrink-0 bg-[#C79D3F]/10 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                              <span className="leading-relaxed">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Integrations Chips */}
              <div className="mt-12 mb-4">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Módulos Integrados</h4>
                <div className="flex flex-wrap gap-3">
                  {integrations.map((int, i) => (
                    <div key={i} className={`px-4 py-2 rounded-xl ${int.color} flex items-center gap-2 border border-current/10 shadow-sm`}>
                      <span className="font-bold text-sm">{int.name}</span>
                      <span className="text-xs opacity-70 px-2 py-0.5 rounded-full bg-current/10">{int.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ENV TAB */}
          {activeTab === 'env' && (
            <motion.div key="env" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Key className="w-48 h-48 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <Key className="w-6 h-6 text-[#C79D3F]" /> Variables de Entorno (.env)
                </h3>
                <p className="text-slate-400 mb-8 max-w-2xl">
                  La seguridad es primordial. Ninguna clave privada se expone en el cliente. El archivo <code className="bg-slate-800 text-[#C79D3F] px-1.5 py-0.5 rounded text-sm">.env</code> debe configurarse estrictamente antes del despliegue.
                </p>

                <div className="space-y-4 relative z-10">
                  {envVars.map((ev, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors gap-4">
                      <div className="flex-1">
                        <div className="font-mono text-[#C79D3F] text-sm md:text-base font-semibold">{ev.key}</div>
                      </div>
                      <div className="flex-1 text-slate-300 text-sm">
                        {ev.desc}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                  <p className="text-sm text-yellow-200">
                    <strong>Importante:</strong> Las variables prefijadas con <code className="bg-black/30 px-1 rounded">VITE_</code> están expuestas al cliente y son seguras para el navegador. Nunca prefijes claves secretas o tokens de administración con <code className="bg-black/30 px-1 rounded">VITE_</code>.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
