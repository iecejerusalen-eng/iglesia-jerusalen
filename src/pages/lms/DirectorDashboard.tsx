import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Building2, CalendarDays, Settings2, Users } from 'lucide-react';
import { SchoolsManager } from '../../features/lms/admin/SchoolsManager';
import { PeriodsManager } from '../../features/lms/admin/PeriodsManager';
import { GlobalSettingsManager } from '../../features/lms/admin/GlobalSettingsManager';

export default function DirectorDashboard() {
  const [activeTab, setActiveTab] = useState<'schools' | 'periods' | 'settings'>('schools');

  const tabs = [
    { id: 'schools', label: 'Escuelas', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { id: 'periods', label: 'Períodos', icon: CalendarDays, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { id: 'settings', label: 'Global', icon: Settings2, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] pb-24">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-gradient-to-b from-gold/10 to-transparent rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <ShieldCheck className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white font-serif mb-1">
                Panel Maestro
              </h1>
              <p className="text-gray-400 font-medium">Control global del Sistema Integrado de Educación</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-lg border border-gray-100 dark:border-white/10 flex overflow-x-auto hide-scrollbar mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap min-w-[150px] ${
                  isActive 
                    ? `bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm`
                    : 'text-gray-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? tab.bg : 'bg-transparent'} ${isActive ? tab.color : 'text-current'}`}>
                  <Icon size={18} />
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'schools' && <SchoolsManager />}
              {activeTab === 'periods' && <PeriodsManager />}
              {activeTab === 'settings' && <GlobalSettingsManager />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
