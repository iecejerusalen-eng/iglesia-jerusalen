import { motion } from 'framer-motion';
import { Church, Users, Laptop, Zap, ChevronRight, Activity } from 'lucide-react';

export default function Section1Overview({ onNext }: { onNext: () => void }) {
  const timelineSteps = [
    { title: "1. Registro", desc: "El usuario crea su perfil y llena sus datos espirituales.", icon: <Users className="w-5 h-5" /> },
    { title: "2. Onboarding", desc: "Asignación automática a un ministerio base.", icon: <Church className="w-5 h-5" /> },
    { title: "3. Educación", desc: "Inicia la 'Ruta del Creyente' en el Aula Virtual.", icon: <Laptop className="w-5 h-5" /> },
    { title: "4. Integración", desc: "Participa en juegos bíblicos y hace peticiones.", icon: <Zap className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar pt-10 scrollable-content">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full mb-12"
      >
        <h1 className="font-serif text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
          El Ecosistema <span className="text-gold-gradient">Jerusalén</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
          Nuestra misión digital es acompañar al creyente en cada paso de su vida espiritual. 
          Hemos consolidado <strong>10 pilares operativos</strong> en una sola plataforma unificada.
        </p>
      </motion.div>

      {/* Metrics Dashboard */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
      >
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-[#C79D3F]">
          <div className="p-4 rounded-xl bg-gold-gradient text-white shadow-lg"><Activity className="w-8 h-8" /></div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">32+</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Módulos Internos</div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-4 rounded-xl bg-blue-500 text-white shadow-lg"><Users className="w-8 h-8" /></div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">100%</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Adopción de Usuarios</div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="p-4 rounded-xl bg-purple-500 text-white shadow-lg"><Zap className="w-8 h-8" /></div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">24/7</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Sincronización Offline</div>
          </div>
        </div>
      </motion.div>

      {/* User Journey Timeline */}
      <div className="w-full max-w-5xl mb-20 relative">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">La Ruta del Congregante</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {timelineSteps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (idx * 0.15) }}
              className="glass-card p-6 rounded-2xl flex flex-col items-start relative group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 mb-4 group-hover:bg-gold-gradient group-hover:text-white transition-colors duration-300">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onNext}
        className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm md:text-base hover:shadow-xl transition-all transform hover:-translate-y-1"
      >
        Continuar al Aula Virtual <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
