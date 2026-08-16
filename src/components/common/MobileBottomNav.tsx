import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../../store/useSearchStore';
import { useMenuStore } from '../../store/useMenuStore';
import { DEFAULT_MENU_ITEMS } from '../../services/menuService';
import {
  Book,
  BookOpen,
  Calendar,
  Cake,
  ChevronRight,
  Circle,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  Home,
  Info,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Music,
  Search,
  ShoppingBag,
  Star,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { MenuItem } from '../../services/menuService';

const ICON_MAP: Record<string, LucideIcon> = {
  Book,
  BookOpen,
  Calendar,
  Cake,
  ChevronRight,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  Home,
  Info,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Music,
  Search,
  ShoppingBag,
  Star,
  Users,
  Video,
};

const DynamicIcon = ({ name, active, defaultIcon }: { name?: string, active: boolean, defaultIcon: string }) => {
  const IconComponent = ICON_MAP[name ?? ''] ?? ICON_MAP[defaultIcon] ?? Circle;
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

  // Reservamos una barra estable de cinco accesos: tres secciones, buscar y más.
  // El resto de destinos sigue disponible desde el panel "Más".
  const bottomBarItems = topLevelItems.slice(0, 3);
  const overflowItems = topLevelItems.slice(3);

  useEffect(() => {
    if (!activeSheet) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveSheet(null);
    };

    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeSheet]);

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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-red dark:text-gold">Navegación</p>
          <h3 className="mt-1 font-serif text-xl font-bold text-primary dark:text-white">{sheetTitle}</h3>
        </div>
        {children.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
          {children.map(child => {
             const active = isActive(child.url);
             return (
              <Link
                key={child.id}
                to={child.url}
                onClick={closeSheet}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border p-3 text-left transition-colors active:scale-[0.99] ${active ? 'border-primary/20 bg-primary/5 dark:border-gold/20 dark:bg-gold/10' : 'border-gray-100 bg-gray-50/80 hover:bg-gray-100 dark:border-white/5 dark:bg-slate-800/60 dark:hover:bg-slate-800'}`}
              >
                <div className={`p-2 rounded-lg ${active ? 'bg-primary/10 text-primary dark:text-gold' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                  <DynamicIcon name={child.icon} active={active} defaultIcon="ChevronRight" />
                </div>
                <div>
                  <div className={`font-semibold ${active ? 'text-primary dark:text-gold' : 'text-gray-800 dark:text-gray-200'}`}>{child.label}</div>
                </div>
              </Link>
             );
          })}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
            No hay más accesos disponibles.
          </p>
        )}
      </div>
    );
  };

  const defaultIcons = ['Home', 'Users', 'BookOpen', 'Heart', 'Star'];

  return (
    <>
      <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border border-gray-200/80 bg-white/90 px-1.5 py-1.5 shadow-[0_12px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_12px_34px_rgba(0,0,0,0.35)] md:hidden">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-around gap-1">
          
          {bottomBarItems.map((item, index) => {
            const hasChildren = getChildren(item.id).length > 0;
            const isItemActive = hasChildren ? activeSheet === item.id || getChildren(item.id).some(c => isActive(c.url)) : isActive(item.url);

            if (hasChildren) {
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSheet(item.id)}
                  aria-label={`Menú ${item.label}`}
                  className="flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl py-1 text-[10px] font-medium transition-colors active:scale-95"
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
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-xl py-1 text-[10px] font-medium transition-colors active:scale-95"
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
            className="flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl py-1 text-[10px] font-medium transition-colors active:scale-95"
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
             className="flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-xl py-1 text-[10px] font-medium transition-colors active:scale-95"
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
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm dark:bg-black/60 md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              role="dialog"
              aria-modal="true"
              aria-label="Opciones de navegación"
              className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 max-h-[min(70dvh,34rem)] overflow-hidden rounded-3xl border border-gray-200 bg-white px-5 pb-5 pt-4 shadow-[0_-8px_32px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-slate-900 md:hidden"
            >
              {/* Drag Handle */}
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-slate-700" />
              <div className="max-h-[calc(min(70dvh,34rem)-3rem)] overflow-y-auto overscroll-contain pr-1">
                {renderSheetContent()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
