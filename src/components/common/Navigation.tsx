import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
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
  const [hidden, setHidden] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const previousScrollY = useRef(0);

  // Dynamic Menu State
  const { items, fetchMenu } = useMenuStore();

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const delta = latest - previousScrollY.current;
    setIsScrolled(latest > 24);
    if (latest <= 72) setHidden(false);
    else if (delta > 2) setHidden(true);
    else if (delta < -2) setHidden(false);
    previousScrollY.current = latest;
  });

  useEffect(() => {
    previousScrollY.current = window.scrollY;
  }, [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHoveredItemId(null);
        setOpenMenuId(null);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const isPathActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const isHome = location.pathname === '/';
  const isHomeAtTop = isHome && (!isScrolled || window.scrollY <= 24);
  const isTransparent = isHomeAtTop && document.documentElement.classList.contains('dark');

  const menuSource = items.length > 0 ? items : DEFAULT_MENU_ITEMS;

  const topLevelItems = useMemo(() => {
    const calculated = menuSource.filter(i => !i.parent_id && i.is_visible).sort((a,b) => a.order_index - b.order_index);
    return calculated.length > 0 ? calculated : DEFAULT_MENU_ITEMS;
  }, [menuSource]);

  const getChildren = (parentId: string) => {
    return menuSource.filter(i => i.parent_id === parentId && i.is_visible).sort((a,b) => a.order_index - b.order_index);
  };

  const isItemActive = (item: MenuItem) => {
    if (item.url !== '#' && item.url !== '' && isPathActive(item.url)) return true;
    const children = getChildren(item.id);
    return children.some(child => isPathActive(child.url));
  };

  return (
    <motion.nav 
      key={location.pathname}
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" }
      }}
      animate={hidden ? "hidden" : "visible"}
      initial={false}
      transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'transform' }}
      className={`absolute left-0 right-0 w-full z-[70] ${
        isHomeAtTop
          ? 'top-[46px]'
          : 'glass-nav sticky top-0 z-50'
      } ${isTransparent ? 'bg-transparent border-transparent' : 'glass-nav'}`}
    >
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
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={hoveredItemId === item.id || openMenuId === item.id}
                  onClick={() => {
                    if (openMenuId === item.id) {
                      setOpenMenuId(null);
                      setHoveredItemId(null);
                    } else {
                      setOpenMenuId(item.id);
                    }
                  }}
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
                  {(hoveredItemId === item.id || openMenuId === item.id) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                      aria-label={`Opciones de ${item.label}`}
                      className={`absolute left-0 mt-2 w-56 rounded-xl py-3 z-50 transition-all duration-300 ${
                        isTransparent 
                          ? 'bg-slate-950/80 backdrop-blur-md border border-white/10 text-white/90 transform-gpu' 
                          : 'glass-card text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {children.map(child => (
                        <Link
                          key={child.id}
                          to={child.url}
                          role="menuitem"
                          onClick={() => {
                            setHoveredItemId(null);
                            setOpenMenuId(null);
                          }}
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
    </motion.nav>
  );
};

export default Navigation;
