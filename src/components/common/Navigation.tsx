import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import soloLogoBlanco from '../../assets/Jerusalén/solo logo blanco.svg';
import { slideInRight, staggerContainer, fadeInUp } from '../../utils/animations';
import ThemeToggle from './ThemeToggle';
import { useSearchStore } from '../../store/useSearchStore';
import { useMenuStore } from '../../store/useMenuStore';
import type { MenuItem } from '../../services/menuService';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Track hovered item for desktop dropdowns
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  // Track open states for mobile accordions
  const [openMobileAccordions, setOpenMobileAccordions] = useState<Record<string, boolean>>({});
  
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Dynamic Menu State
  const { items, fetchMenu } = useMenuStore();

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isPathActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled;

  const topLevelItems = useMemo(() => 
    items.filter(i => !i.parent_id && i.is_visible).sort((a,b) => a.order_index - b.order_index),
  [items]);

  const getChildren = (parentId: string) => 
    items.filter(i => i.parent_id === parentId && i.is_visible).sort((a,b) => a.order_index - b.order_index);

  const isItemActive = (item: MenuItem) => {
    if (item.url !== '#' && item.url !== '' && isPathActive(item.url)) return true;
    const children = getChildren(item.id);
    return children.some(child => isPathActive(child.url));
  };

  const toggleMobileAccordion = (id: string) => {
    setOpenMobileAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <nav className={`transition-all duration-500 ease-in-out ${
      isTransparent 
        ? 'absolute top-[38px] sm:top-[40px] left-0 right-0 w-full bg-transparent border-transparent z-50' 
        : 'glass-nav sticky top-0 z-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <Link 
          to="/" 
          onClick={closeMenu} 
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

        {/* Acciones Derecha (ThemeToggle & Search) */}
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

      {/* Menú Móvil */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs md:hidden"
            />

            <motion.div
              variants={slideInRight}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed right-0 top-0 bottom-0 w-4/5 max-w-sm z-50 glass-panel p-6 flex flex-col justify-between md:hidden overflow-y-auto"
            >
              <div>
                <div className="flex justify-between items-center mb-10">
                  <span className="font-serif font-bold text-xl text-primary dark:text-white">Menú</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        closeMenu();
                        useSearchStore.getState().open();
                      }}
                      className="text-primary dark:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      aria-label="Buscar en la web"
                    >
                      <Search size={22} />
                    </button>
                    <ThemeToggle />
                    <button
                      onClick={closeMenu}
                      aria-label="Cerrar menú"
                      className="text-primary dark:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <motion.ul 
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6 flex flex-col"
                >
                  {topLevelItems.map((item) => {
                    const children = getChildren(item.id);
                    const hasChildren = children.length > 0;
                    const active = isItemActive(item);

                    if (!hasChildren) {
                      return (
                        <motion.li key={item.id} variants={fadeInUp}>
                          <Link
                            to={item.url}
                            onClick={closeMenu}
                            className={`text-lg font-serif font-bold text-primary dark:text-gray-200 block hover:text-accent-red transition-colors py-2 border-b border-gray-50 dark:border-white/5 ${
                              active ? 'text-accent-red border-accent-red/20' : ''
                            }`}
                          >
                            {item.label}
                          </Link>
                        </motion.li>
                      );
                    }

                    const isAccordionOpen = openMobileAccordions[item.id];

                    return (
                      <motion.li key={item.id} variants={fadeInUp}>
                        <div>
                          <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 py-2">
                            <span className={`text-lg font-serif font-bold text-primary dark:text-gray-200 ${
                              active ? 'text-accent-red' : ''
                            }`}>
                              {item.label}
                            </span>
                            <button
                              onClick={() => toggleMobileAccordion(item.id)}
                              className="p-2 text-primary hover:text-accent-red cursor-pointer"
                            >
                              <ChevronDown size={20} className={`transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          <AnimatePresence>
                            {isAccordionOpen && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-4 space-y-2 mt-2 border-l-2 border-gray-100 overflow-hidden"
                              >
                                {children.map(child => (
                                  <li key={child.id}>
                                    <Link
                                      to={child.url}
                                      onClick={closeMenu}
                                      className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                                    >
                                      {child.label}
                                    </Link>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </div>

              {/* Pie de menú móvil */}
              <div className="text-center text-xs text-gray-400 mt-auto pt-6 border-t border-gray-100 dark:border-white/10 flex flex-col items-center gap-2">
                <img loading="lazy" src={soloLogoColorido} alt="Logo" className="h-6 w-auto opacity-75" />
                <p className="font-medium text-slate-500 dark:text-slate-400">Iglesia Jerusalén</p>
                <p className="mt-1">© {new Date().getFullYear()} Todos los derechos reservados.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
