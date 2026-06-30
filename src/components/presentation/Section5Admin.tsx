import { motion } from 'framer-motion';
import { ShieldAlert, BarChart3, Users, Briefcase, Settings, ChevronRight } from 'lucide-react';

export default function Section5Admin({ onNext }: { onNext: () => void }) {
  const adminPillars = [
    { label: "Administración & CRM", count: "8 Módulos", icon: <Users /> },
    { label: "Finanzas y Operaciones", count: "5 Módulos", icon: <BarChart3 /> },
    { label: "Educación Admin", count: "4 Módulos", icon: <Briefcase /> },
    { label: "Diseño & Sistema", count: "15 Módulos", icon: <Settings /> }
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar pt-10">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-6xl mx-auto w-full mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
      >
        <div>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 mb-4 font-semibold text-sm">
            <ShieldAlert className="w-5 h-5" />
            Control Total (Backend)
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">Centro de Mando</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Simulador del Dashboard Administrativo. Agrupamos más de 32 herramientas en paneles inteligentes.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={onNext}
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-xl"
        >
          Ver Arquitectura Técnica <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Dashboard Simulator */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-6xl mx-auto w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-8 shadow-2xl mb-20"
      >
        
        {/* Sidebar / Pillars */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm mb-2">Pilares Operativos</h3>
          {adminPillars.map((pillar, idx) => (
            <div 
              key={idx}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                idx === 0 
                  ? 'bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700' 
                  : 'hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`${idx === 0 ? 'text-blue-500' : ''}`}>
                  {pillar.icon}
                </div>
                <span className={`font-semibold ${idx === 0 ? 'text-gray-900 dark:text-white' : ''}`}>
                  {pillar.label}
                </span>
              </div>
              <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                {pillar.count}
              </span>
            </div>
          ))}
        </div>

        {/* Main Panel Content (Simulating CRM) */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Métricas de CRM (Activo)</h3>
            <div className="text-sm text-gray-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-lg">Tiempo Real</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Miembros Activos", val: "1,240", color: "text-blue-500" },
              { label: "Nuevos (Mes)", val: "+45", color: "text-green-500" },
              { label: "Bautismos", val: "12", color: "text-blue-500" },
              { label: "Células", val: "24", color: "text-purple-500" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 text-center">
                <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.val}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="w-full h-48 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
             {/* Fake Line Chart SVG using SVG path */}
             <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
               <path d="M0,100 L0,70 Q25,80 50,40 T100,20 L100,100 Z" fill="rgba(59, 130, 246, 0.1)" />
               <path d="M0,70 Q25,80 50,40 T100,20" fill="none" stroke="#3B82F6" strokeWidth="2" />
             </svg>
             <span className="relative z-10 text-slate-400 font-medium">Crecimiento Anual Simulador</span>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
