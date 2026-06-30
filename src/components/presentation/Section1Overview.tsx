import { useState } from 'react';
import { motion } from 'framer-motion';
import { Church, Users, Laptop, Zap, ChevronRight, Activity, ShoppingBag, GraduationCap, Music, Gamepad2, Shield, Palette, Package, BarChart3 } from 'lucide-react';

const roles = [
  { role: 'Congregante', color: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300', perms: ['Ver sermones', 'Aula Virtual', 'Tienda', 'Peticiones', 'Juegos'] },
  { role: 'Líder de Ministerio', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200', perms: ['Todo lo anterior', 'Ver miembros de su ministerio', 'Inventario (lectura)', 'Production Board'] },
  { role: 'Tesorero', color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200', perms: ['Finanzas', 'Tienda Admin', 'Reportes', 'Donaciones'] },
  { role: 'Pastor', color: 'bg-gold-gradient text-white', perms: ['Acceso global', 'Ver peticiones privadas', 'Mapa estratégico', 'Notificaciones globales'] },
];

const pillars = [
  { icon: <GraduationCap className="w-5 h-5" />, title: 'Aula Virtual', color: 'text-blue-500', desc: 'Cursos, quizzes, certificados' },
  { icon: <Music className="w-5 h-5" />, title: 'Multimedia', color: 'text-purple-500', desc: 'Sermones, Alabanzas, Acordes' },
  { icon: <Users className="w-5 h-5" />, title: 'Comunidad CRM', color: 'text-teal-500', desc: 'Miembros, Peticiones, Cumpleaños' },
  { icon: <Gamepad2 className="w-5 h-5" />, title: 'Juegos Bíblicos', color: 'text-orange-500', desc: 'Biblionario, Memorama, Ahorcado' },
  { icon: <ShoppingBag className="w-5 h-5" />, title: 'Tienda y Finanzas', color: 'text-green-500', desc: 'E-commerce, Diezmos, Reportes' },
  { icon: <Palette className="w-5 h-5" />, title: 'Diseño y Editor', color: 'text-pink-500', desc: 'Page Builder, Logos, Animaciones' },
  { icon: <Package className="w-5 h-5" />, title: 'Logística', color: 'text-amber-500', desc: 'Inventario, Production Board' },
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Analíticas', color: 'text-red-500', desc: 'KPIs, Roles, Notificaciones' },
  { icon: <Shield className="w-5 h-5" />, title: 'Seguridad', color: 'text-slate-500', desc: 'RLS, Supabase, OAuth' },
  { icon: <Laptop className="w-5 h-5" />, title: 'Arquitectura', color: 'text-indigo-500', desc: 'Vercel, Zustand, Cloudinary' },
];

export default function Section1Overview({ onNext }: { onNext: () => void }) {
  const [activeRole, setActiveRole] = useState(0);

  const timelineSteps = [
    { title: '1. Registro', desc: 'El usuario crea su perfil con nombre, correo y datos espirituales (fecha de bautismo, ministerio de interés).', icon: <Users className="w-5 h-5" /> },
    { title: '2. Onboarding', desc: 'El sistema asigna automáticamente un rol base ("Congregante") y puede solicitar aprobación pastoral para roles con más privilegios.', icon: <Church className="w-5 h-5" /> },
    { title: '3. Educación', desc: 'Accede al Aula Virtual para iniciar la "Ruta del Creyente", con cursos de formación espiritual y liderazgo.', icon: <Laptop className="w-5 h-5" /> },
    { title: '4. Integración', desc: 'Participa en la comunidad: juegos bíblicos, peticiones de oración, eventos, tienda y ministerios.', icon: <Zap className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar pt-8 scrollable-content">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl w-full mb-10">
        <h1 className="font-serif text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
          El Ecosistema <span className="text-gold-gradient">Jerusalén</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
          Una plataforma digital unificada que acompaña al creyente en cada etapa de su vida espiritual. 
          Todos los ministerios, herramientas y recursos en un solo lugar, accesible desde cualquier dispositivo.
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
        className="max-w-6xl w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { val: '10', label: 'Pilares Operativos', color: 'border-l-[#C79D3F]', bg: 'bg-gold-gradient', icon: <Activity className="w-6 h-6" /> },
          { val: '32+', label: 'Módulos Internos', color: 'border-l-blue-500', bg: 'bg-blue-500', icon: <Laptop className="w-6 h-6" /> },
          { val: '5', label: 'Tipos de Usuario', color: 'border-l-purple-500', bg: 'bg-purple-500', icon: <Users className="w-6 h-6" /> },
          { val: '24/7', label: 'Disponibilidad', color: 'border-l-green-500', bg: 'bg-green-500', icon: <Zap className="w-6 h-6" /> },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
            className={`glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-4 ${m.color}`}>
            <div className={`p-3 rounded-xl ${m.bg} text-white shadow-lg flex-shrink-0`}>{m.icon}</div>
            <div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{m.val}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{m.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pillars Grid */}
      <div className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Los 10 Pilares del Ecosistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {pillars.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
              className="glass-card p-4 rounded-2xl flex flex-col gap-2 hover:scale-105 transition-transform cursor-default group">
              <div className={`${p.color} group-hover:scale-110 transition-transform`}>{p.icon}</div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">{p.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Roles Table - Interactive */}
      <div className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tabla de Roles y Permisos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Haz clic en cada rol para ver sus permisos.</p>
        <div className="flex flex-wrap gap-3 mb-6">
          {roles.map((r, i) => (
            <button key={i} onClick={() => setActiveRole(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${activeRole === i ? r.color + ' shadow-lg scale-105' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'}`}>
              {r.role}
            </button>
          ))}
        </div>
        <motion.div key={activeRole} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6">
          <h3 className="font-bold text-lg dark:text-white mb-4">{roles[activeRole].role} — Permisos incluidos:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles[activeRole].perms.map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#C79D3F] flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* User Journey */}
      <div className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">La Ruta del Congregante</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {timelineSteps.map((step, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + idx * 0.12 }}
              className="glass-card p-6 rounded-2xl flex flex-col items-start group">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 mb-4 group-hover:bg-gold-gradient group-hover:text-white transition-colors duration-300">
                {step.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={onNext}
        className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:shadow-xl transition-all transform hover:-translate-y-1">
        Continuar al Aula Virtual <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
