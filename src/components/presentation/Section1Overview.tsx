import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Church, Users, Laptop, Zap, CheckCircle2 } from 'lucide-react';

export default function Section1Overview({ onNext }: { onNext: () => void }) {
  const timelineSteps = [
    { title: "Registro", desc: "El usuario crea su perfil y llena sus datos espirituales y de contacto.", icon: <Users className="w-5 h-5" /> },
    { title: "Onboarding", desc: "Se le asigna automáticamente a un ministerio según su edad e intereses.", icon: <Church className="w-5 h-5" /> },
    { title: "Educación", desc: "Inicia la 'Ruta del Creyente' en el Aula Virtual, completando cursos bíblicos.", icon: <Laptop className="w-5 h-5" /> },
    { title: "Crecimiento", desc: "Participa en eventos, juegos bíblicos y hace peticiones de oración.", icon: <Zap className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center p-6 md:p-12 overflow-y-auto custom-scrollbar pt-10">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full text-center mb-16"
      >
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gold-gradient shadow-lg mb-8">
          <Church className="w-12 h-12 text-white" />
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
          El Ecosistema <span className="text-gold-gradient">Jerusalén</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Más que una página web, es una <strong>plataforma operativa completa</strong> que centraliza la educación, la comunidad, las finanzas y el crecimiento espiritual de toda la congregación.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full mb-20"
      >
        <StatCard number="32+" label="Módulos Internos" />
        <StatCard number="100%" label="Escalabilidad Edge" />
        <StatCard number="24/7" label="Disponibilidad Offline" />
        <StatCard number="∞" label="Conexiones simultáneas" />
      </motion.div>

      {/* User Journey Timeline */}
      <div className="w-full max-w-5xl mb-20 relative">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">La Ruta del Congregante</h2>
          <p className="text-gray-500 dark:text-gray-400">Cómo el software acompaña cada paso de su vida espiritual.</p>
        </div>

        <div className="relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0 rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {timelineSteps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (idx * 0.15) }}
                className="glass-card p-6 rounded-2xl flex flex-col items-center text-center relative"
              >
                <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-white mb-4 shadow-lg ring-4 ring-white dark:ring-slate-900">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                
                {/* Mobile Connector */}
                {idx !== timelineSteps.length - 1 && (
                  <div className="md:hidden absolute -bottom-6 left-1/2 w-1 h-6 bg-gray-200 dark:bg-gray-800 -translate-x-1/2" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onNext}
        className="mb-20 px-10 py-4 rounded-full bg-gold-gradient text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(199,157,63,0.4)] transition-all transform hover:-translate-y-1"
      >
        Explorar Educación y Aula Virtual
      </motion.button>
    </div>
  );
}

function StatCard({ number, label }: { number: string, label: string }) {
  return (
    <div className="glass-panel p-6 rounded-2xl text-center border-t-2 border-t-[#C79D3F]">
      <div className="text-3xl md:text-5xl font-extrabold text-gold-gradient mb-1">{number}</div>
      <div className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
