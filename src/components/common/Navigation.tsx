import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import soloLogoBlanco from '../../assets/Jerusalén/solo logo blanco.svg';
import ThemeToggle from './ThemeToggle';
import { useSearchStore } from '../../store/useSearchStore';
import { useMenuStore } from '../../store/useMenuStore';
import { DEFAULT_MENU_ITEMS } from '../../services/menuService';
import type { MenuItem } from '../../services/menuService';

const Navigation = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const lastScrollY = useRef(0);

  // Dynamic Menu State
  const { items, fetchMenu } = useMenuStore();

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 50);

      // Ocultar al hacer scroll hacia abajo, mostrar al subir
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isPathActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled;

  const topLevelItems = useMemo(() => {
    const calculated = items.filter(i => !i.parent_id && i.is_visible).sort((a,b) => a.order_index - b.order_index);
    return calculated.length > 0 ? calculated : DEFAULT_MENU_ITEMS;
  }, [items]);

  const getChildren = (parentId: string) => {
    const children = items.filter(i => i.parent_id === parentId && i.is_visible).sort((a,b) => a.order_index - b.order_index);
    if (children.length === 0 && topLevelItems === DEFAULT_MENU_ITEMS) {
        // Fallback para hijos de los items por defecto (no aplica en esta lógica simple pero por seguridad)
        return [];
    }
    return children;
  };

  const isItemActive = (item: MenuItem) => {
    if (item.url !== '#' && item.url !== '' && isPathActive(item.url)) return true;
    const children = getChildren(item.id);
    return children.some(child => isPathActive(child.url));
  };

  return (
    <nav className={`transition-all duration-500 ease-in-out ${
      isTransparent 
        ? 'absolute top-[38px] sm:top-[40px] left-0 right-0 w-full bg-transparent border-transparent z-50 transform-none' 
        : `glass-nav sticky top-0 z-50 transform ${isVisible ? 'translate-y-0' : '-translate-y-full'}`
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <Link 
          to="/" 
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg p-1"
        >
          <img loading="lazy" 
            src={isTransparent ? soloLogoBlanco : soloLogoColorido} 
            alt="Logo Iglesia Jerusalén" 
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className={`text-2xl font-serif font-bold tracking-tight transition-all duration-500 ${
            isTransparent 
              ? 'text-white drop-shadow-sm' 
              : 'text-primary dark:text-white group-hover:text-gold'
          }`}>
            Jerusalén
          </span>
        </Link>
        
        {/* Enlaces Escritorio */}
        <ul className={`hidden md:flex gap-8 font-semibold text-sm items-center transition-colors duration-500 ${
          isTransparent ? 'text-white/95' : 'text-primary dark:text-gray-200'
        }`}>
          {topLevelItems.map((item) => {
            const children = getChildren(item.id);
            const hasChildren = children.length > 0;
            const active = isItemActive(item);

            if (!hasChildren) {
              return (
                <li key={item.id}>
                  <Link 
                    to={item.url} 
                    className={`transition-colors duration-300 ${
                      isTransparent
                        ? (active ? 'text-gold' : 'hover:text-gold text-white/90')
                        : (active ? 'text-accent-red' : 'hover:text-accent-red')
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }

            return (
              <li 
                key={item.id}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className="relative py-2"
              >
                <button 
                  className={`transition-colors duration-300 flex items-center gap-1 cursor-pointer font-semibold ${
                    isTransparent
                      ? (active ? 'text-gold' : 'hover:text-gold text-white/90')
                      : (active ? 'text-accent-red' : 'hover:text-accent-red')
                  }`}
                >
                  {item.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${hoveredItemId === item.id ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {hoveredItemId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute left-0 mt-2 w-52 rounded-xl py-3 z-50 transition-all duration-300 ${
                        isTransparent 
                          ? 'bg-slate-950/80 backdrop-blur-md border border-white/10 text-white/90 transform-gpu' 
                          : 'glass-card text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {children.map(child => (
                        <Link
                          key={child.id}
                          to={child.url}
                          onClick={() => setHoveredItemId(null)}
                          className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                            isTransparent 
                              ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                              : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={() => useSearchStore.getState().open()}
            className={`p-2 rounded-lg transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer ${
              isTransparent 
                ? 'text-white hover:text-gold' 
                : 'text-primary dark:text-gray-200 hover:text-accent-red dark:hover:text-gold'
            }`}
            title="Buscar (Ctrl+K)"
            aria-label="Buscar en la web"
          >
            <Search size={20} />
            <kbd className={`hidden lg:inline-flex items-center select-none rounded border px-1.5 font-mono text-[10px] font-medium transition-colors ${
              isTransparent
                ? 'bg-white/10 border-white/20 text-white/80'
                : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
            }`}>
              <span>Ctrl K</span>
            </kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
