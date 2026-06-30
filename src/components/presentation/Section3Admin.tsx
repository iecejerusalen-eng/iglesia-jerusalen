import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Users, GraduationCap, Calendar, 
  ShoppingBag, Paintbrush, Cog, ChevronDown, ChevronUp
} from 'lucide-react';

const adminPillars = [
  {
    id: 'admin',
    title: 'Administración',
    icon: ShieldCheck,
    tools: ['Resumen', 'Análisis (Métricas)', 'Mapa Estratégico', 'Finanzas', 'Gestión Usuarios', 'Datos Iglesia', 'Personalizar Panel']
  },
  {
    id: 'crm',
    title: 'Comunidad y CRM',
    icon: Users,
    tools: ['Miembros (CRM)', 'Ministerios', 'Peticiones Oración', 'Mensajería Chat']
  },
  {
    id: 'edu',
    title: 'Educación',
    icon: GraduationCap,
    tools: ['Aula Virtual (LMS)', 'Programas y Estudios', 'Juegos', 'Solicitudes Matrícula']
  },
  {
    id: 'events',
    title: 'Eventos y Medios',
    icon: Calendar,
    tools: ['Notificaciones', 'Sermones', 'Alabanzas', 'Eventos (Calendario)', 'Biblioteca de Sonidos']
  },
  {
    id: 'store',
    title: 'Tienda',
    icon: ShoppingBag,
    tools: ['Productos', 'Órdenes', 'Pagos y Envíos']
  },
  {
    id: 'design',
    title: 'Diseño y Recursos',
    icon: Paintbrush,
    tools: ['Catálogo Animaciones', 'Guía de Estilo / Diseño', 'Catálogo de Logos', 'Editor Páginas', 'Editor de Presentación', 'Extensiones / Plugins']
  },
  {
    id: 'ops',
    title: 'Operaciones',
    icon: Cog,
    tools: ['Logística', 'Bóveda Media', 'Inventario']
  }
];

export default function Section3Admin({ onNext }: { onNext: () => void }) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  return (
    <div className="w-full h-full flex flex-col items-center p-6 md:p-12 pt-24 overflow-y-auto custom-scrollbar">
      <div className="text-center mb-10 shrink-0">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">El Centro de Mando</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          32 herramientas organizadas en 7 pilares estratégicos. Todo el control de la iglesia sin tocar una sola línea de código.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4 pb-20">
        {adminPillars.map((pillar, idx) => {
          const isExpanded = expandedPillar === pillar.id;
          const Icon = pillar.icon;
          
          return (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden transition-colors ${
                isExpanded 
                  ? 'border-indigo-500 shadow-lg dark:shadow-indigo-500/10' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <button
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${
                    isExpanded ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pillar.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{pillar.tools.length} herramientas</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50 dark:bg-gray-800/30"
                  >
                    <div className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {pillar.tools.map((tool, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tool}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        
        <div className="flex justify-center mt-8">
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            Ver Detalles Técnicos
          </button>
        </div>
      </div>
    </div>
  );
}
