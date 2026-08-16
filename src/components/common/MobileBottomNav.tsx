import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../../store/useSearchStore';
import { useMenuStore } from '../../store/useMenuStore';
import { DEFAULT_MENU_ITEMS } from '../../services/menuService';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { MenuItem } from '../../services/menuService';

const DynamicIcon = ({ name, active, defaultIcon }: { name?: string, active: boolean, defaultIcon: string }) => {
  const iconName = name && name in LucideIcons ? name : defaultIcon;
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[iconName];
  if (!IconComponent) return <LucideIcons.Circle size={24} className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`} />;
  return <IconComponent size={24} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`} />;
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const isSearchOpen = useSearchStore((state) => state.isOpen);
  const { items } = useMenuStore();

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const menuSource = items.length > 0 ? items : DEFAULT_MENU_ITEMS;

  const topLevelItems = useMemo(() => {
    const calculated = menuSource.filter(i => !i.parent_id && i.is_visible).sort((a,b) => a.order_index - b.order_index);
    return calculated.length > 0 ? calculated : DEFAULT_MENU_ITEMS;
  }, [menuSource]);

  const getChildren = (parentId: string) => 
    menuSource.filter(i => i.parent_id === parentId && i.is_visible).sort((a,b) => a.order_index - b.order_index);

  // We take up to 4 items for the bottom bar, 5th is 'Buscar'
  const bottomBarItems = topLevelItems.slice(0, 4);
  const overflowItems = topLevelItems.slice(4); // These will go into a "Más" sheet if they exist

  const toggleSheet = (id: string) => {
    if (activeSheet === id) {
      setActiveSheet(null);
    } else {
      setActiveSheet(id);
    }
  };

  const closeSheet = () => setActiveSheet(null);

  const renderSheetContent = () => {
    if (!activeSheet) return null;

    let sheetTitle = 'Menú';
    let children: MenuItem[] = [];

    if (activeSheet === 'mas') {
      sheetTitle = 'Más opciones';
      children = overflowItems;
    } else {
      const parent = topLevelItems.find(i => i.id === activeSheet);
      if (parent) {
        sheetTitle = parent.label;
        children = getChildren(parent.id);
      }
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-serif text-primary dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">
          {sheetTitle}
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {children.map(child => {
             const active = isActive(child.url);
             return (
              <Link
                key={child.id}
                to={child.url}
                onClick={closeSheet}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${active ? 'bg-primary/5 dark:bg-primary/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                <div className={`p-2 rounded-lg ${active ? 'bg-primary/10 text-primary dark:text-gold' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                  <DynamicIcon name={child.icon} active={active} defaultIcon="ChevronRight" />
                </div>
                <div>
                  <div className={`font-semibold ${active ? 'text-primary dark:text-gold' : 'text-gray-800 dark:text-gray-200'}`}>{child.label}</div>
                </div>
              </Link>
             )
          })}
        </div>
      </div>
    );
  };

  const defaultIcons = ['Home', 'Users', 'BookOpen', 'Heart', 'Star'];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-gray-200/80 dark:border-white/10 px-2 py-1 md:hidden pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="flex justify-around items-center max-w-lg mx-auto h-12">
          
          {bottomBarItems.map((item, index) => {
            const hasChildren = getChildren(item.id).length > 0;
            const isItemActive = hasChildren ? activeSheet === item.id || getChildren(item.id).some(c => isActive(c.url)) : isActive(item.url);

            if (hasChildren) {
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSheet(item.id)}
                  aria-label={`Menú ${item.label}`}
                  className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <div className={`mb-0.5 ${isItemActive ? 'text-accent-red dark:text-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}>
                    <DynamicIcon name={item.icon} active={isItemActive} defaultIcon={defaultIcons[index % defaultIcons.length]} />
                  </div>
                  <span className={`truncate w-full text-center px-1 ${isItemActive ? 'text-accent-red dark:text-gold font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.url || '#'}
                onClick={closeSheet}
                aria-label={item.label}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors"
              >
                <div className={`mb-0.5 ${isItemActive ? 'text-accent-red dark:text-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}>
                  <DynamicIcon name={item.icon} active={isItemActive} defaultIcon={defaultIcons[index % defaultIcons.length]} />
                </div>
                <span className={`truncate w-full text-center px-1 ${isItemActive ? 'text-accent-red dark:text-gold font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Search Button */}
          <button
            onClick={() => {
              closeSheet();
              useSearchStore.getState().open();
            }}
            aria-label="Buscar"
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer"
          >
            <div className={`mb-0.5 ${isSearchOpen ? 'text-accent-red dark:text-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}>
              <DynamicIcon name="Search" active={isSearchOpen} defaultIcon="Search" />
            </div>
            <span className={isSearchOpen ? 'text-accent-red dark:text-gold font-semibold' : 'text-gray-500 dark:text-gray-400'}>
              Buscar
            </span>
          </button>
          
          {/* Más Button if there are overflow items */}
          {overflowItems.length > 0 && (
             <button
             onClick={() => toggleSheet('mas')}
             aria-label="Más opciones"
             className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer"
           >
             <div className={`mb-0.5 ${activeSheet === 'mas' ? 'text-accent-red dark:text-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}>
               <DynamicIcon name="Menu" active={activeSheet === 'mas'} defaultIcon="Menu" />
             </div>
             <span className={activeSheet === 'mas' ? 'text-accent-red dark:text-gold font-semibold' : 'text-gray-500 dark:text-gray-400'}>
               Más
             </span>
           </button>
          )}

        </div>
      </div>

      {/* Sheets desplegables con Framer Motion */}
      <AnimatePresence>
        {activeSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-30 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 right-0 z-35 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 rounded-t-2xl px-5 pt-6 pb-8 md:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.12)] max-w-lg mx-auto"
              style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
            >
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              {renderSheetContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
