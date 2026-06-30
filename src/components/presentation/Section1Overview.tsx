import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Church, Layers, Database, LayoutTemplate } from 'lucide-react';

export default function Section1Overview({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center mb-12"
      >
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6 backdrop-blur-md">
          <Church className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
          El Ecosistema Jerusalén
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Una plataforma web de última generación diseñada para organizar, educar y conectar a nuestra congregación, unificando ministerios en un solo lugar.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <FeatureCard 
          icon={<LayoutTemplate />}
          title="Arquitectura Modular"
          description="Diseñado en bloques independientes: Iglesia, Educación, Tienda y Comunidad."
          delay={0.2}
        />
        <FeatureCard 
          icon={<Layers />}
          title="Diseño Premium"
          description="Interfaz adaptativa con Modo Oscuro y claro, pensada en la mejor experiencia de usuario."
          delay={0.3}
        />
        <FeatureCard 
          icon={<Database />}
          title="Gestión Centralizada"
          description="Todo desde un Centro de Mando: miembros, finanzas, inventarios y contenido."
          delay={0.4}
        />
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onNext}
        className="mt-16 px-8 py-3 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/25"
      >
        Explorar la Página Pública
      </motion.button>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-6 rounded-3xl hover:-translate-y-2 transition-transform duration-300 shadow-xl"
    >
      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
