import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Palette, Layout, Settings, Bell } from 'lucide-react';

import AppearanceTab from './tabs/AppearanceTab';
import ColorsTab from './tabs/ColorsTab';
import NavigationTab from './tabs/NavigationTab';
import NotificationsTab from './tabs/NotificationsTab';

import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import AdminHeader from '../../../components/admin/AdminHeader';

const TABS = [
  { id: 'appearance', label: 'Tema Visual', icon: Settings },
  { id: 'colors', label: 'Colores de Acento', icon: Palette },
  { id: 'navigation', label: 'Diseño de Barra', icon: Layout },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
] as const;

type TabId = typeof TABS[number]['id'];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<TabId>('appearance');

  return (
    <AnimeFadeUp className="max-w-5xl space-y-6">
      <AdminHeader 
        title="Personalizar Panel" 
        description="Ajusta el panel de administración a tu medida. Elige el tema, los colores y la disposición de los menús. Tus preferencias se guardarán en tu cuenta."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar / Menu for Tabs */}
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Categorías</h3>
          <nav className="flex flex-col space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left font-semibold text-sm ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-gold' : 'opacity-70'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-white/5 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'appearance' && <AppearanceTab key="appearance" />}
            {activeTab === 'colors' && <ColorsTab key="colors" />}
            {activeTab === 'navigation' && <NavigationTab key="navigation" />}
            {activeTab === 'notifications' && <NotificationsTab key="notifications" />}
          </AnimatePresence>
        </div>
      </div>
    </AnimeFadeUp>
  );
};

export default AdminSettings;
