import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import soloLogoBlanco from '../../assets/Jerusalén/solo logo blanco.svg';
import { slideInRight, staggerContainer, fadeInUp } from '../../utils/animations';
import ThemeToggle from './ThemeToggle';
import { useSearchStore } from '../../store/useSearchStore';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Hover states for desktop dropdowns
  const [isComunidadHovered, setIsComunidadHovered] = useState(false);
  const [isRecursosHovered, setIsRecursosHovered] = useState(false);
  
  // Toggle states for mobile accordions
  const [mobileComunidadOpen, setMobileComunidadOpen] = useState(false);
  const [mobileRecursosOpen, setMobileRecursosOpen] = useState(false);
  
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Helper to check active paths
  const isPathActive = (path: string) => location.pathname === path;
  
  const isComunidadActive = () => 
    ['/ministerios', '/eventos', '/peticiones', '/cumpleanos'].some(path => location.pathname === path);

  const isRecursosActive = () => 
    ['/predicas', '/recursos/alabanzas', '/programas', '/recursos/biblia'].some(path => location.pathname === path);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled;

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
          {/* Inicio */}
          <li>
            <Link 
              to="/" 
              className={`transition-colors duration-300 ${
                isTransparent
                  ? (isPathActive('/') ? 'text-gold' : 'hover:text-gold text-white/90')
                  : (isPathActive('/') ? 'text-accent-red' : 'hover:text-accent-red')
              }`}
            >
              Inicio
            </Link>
          </li>

          {/* Nosotros */}
          <li>
            <Link 
              to="/nosotros" 
              className={`transition-colors duration-300 ${
                isTransparent
                  ? (isPathActive('/nosotros') ? 'text-gold' : 'hover:text-gold text-white/90')
                  : (isPathActive('/nosotros') ? 'text-accent-red' : 'hover:text-accent-red')
              }`}
            >
              Nosotros
            </Link>
          </li>

          {/* Comunidad Dropdown */}
          <li 
            onMouseEnter={() => setIsComunidadHovered(true)}
            onMouseLeave={() => setIsComunidadHovered(false)}
            className="relative py-2"
          >
            <button 
              className={`transition-colors duration-300 flex items-center gap-1 cursor-pointer font-semibold ${
                isTransparent
                  ? (isComunidadActive() ? 'text-gold' : 'hover:text-gold text-white/90')
                  : (isComunidadActive() ? 'text-accent-red' : 'hover:text-accent-red')
              }`}
            >
              Comunidad
              <ChevronDown size={14} className={`transition-transform duration-200 ${isComunidadHovered ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isComunidadHovered && (
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
                  <Link
                    to="/ministerios"
                    onClick={() => setIsComunidadHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    Ministerios
                  </Link>
                  <Link
                    to="/eventos"
                    onClick={() => setIsComunidadHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    Eventos (Calendario)
                  </Link>
                  <Link
                    to="/peticiones"
                    onClick={() => setIsComunidadHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    Peticiones
                  </Link>
                  <Link
                    to="/cumpleanos"
                    onClick={() => setIsComunidadHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    Cumpleaños 🎂
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </li>

          {/* Recursos Dropdown */}
          <li 
            onMouseEnter={() => setIsRecursosHovered(true)}
            onMouseLeave={() => setIsRecursosHovered(false)}
            className="relative py-2"
          >
            <button 
              className={`transition-colors duration-300 flex items-center gap-1 cursor-pointer font-semibold ${
                isTransparent
                  ? (isRecursosActive() ? 'text-gold' : 'hover:text-gold text-white/90')
                  : (isRecursosActive() ? 'text-accent-red' : 'hover:text-accent-red')
              }`}
            >
              Recursos
              <ChevronDown size={14} className={`transition-transform duration-200 ${isRecursosHovered ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isRecursosHovered && (
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
                  <Link
                    to="/recursos/biblia"
                    onClick={() => setIsRecursosHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    La Santa Biblia
                  </Link>
                  <Link
                    to="/predicas"
                    onClick={() => setIsRecursosHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    Prédicas
                  </Link>
                  <Link
                    to="/recursos/alabanzas"
                    onClick={() => setIsRecursosHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    Alabanzas e Himnos
                  </Link>
                  <Link
                    to="/programas"
                    onClick={() => setIsRecursosHovered(false)}
                    className={`block px-4 py-2 text-xs font-semibold transition-colors ${
                      isTransparent 
                        ? 'hover:bg-white/10 hover:text-gold text-white/80' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-accent-red dark:hover:text-gold'
                    }`}
                  >
                    Programas / Estudios
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </li>

          {/* Aula Virtual */}
          <li>
            <Link 
              to="/aula-virtual" 
              className={`transition-colors duration-300 ${
                isTransparent
                  ? (isPathActive('/aula-virtual') ? 'text-gold' : 'hover:text-gold text-white/90')
                  : (isPathActive('/aula-virtual') ? 'text-accent-red' : 'hover:text-accent-red')
              }`}
            >
              Aula Virtual
            </Link>
          </li>

          {/* Tienda */}
          <li>
            <Link 
              to="/tienda" 
              className={`transition-colors duration-300 ${
                isTransparent
                  ? (isPathActive('/tienda') ? 'text-gold' : 'hover:text-gold text-white/90')
                  : (isPathActive('/tienda') ? 'text-accent-red' : 'hover:text-accent-red')
              }`}
            >
              Tienda
            </Link>
          </li>

          {/* Contacto */}
          <li>
            <Link 
              to="/contacto" 
              className={`transition-colors duration-300 ${
                isTransparent
                  ? (isPathActive('/contacto') ? 'text-gold' : 'hover:text-gold text-white/90')
                  : (isPathActive('/contacto') ? 'text-accent-red' : 'hover:text-accent-red')
              }`}
            >
              Contacto
            </Link>
          </li>
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
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs md:hidden"
            />

            {/* Side Drawer */}
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
                      className="text-primary dark:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Enlaces de Menú Móvil */}
                <motion.ul 
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6 flex flex-col"
                >
                  {/* Inicio */}
                  <motion.li variants={fadeInUp}>
                    <Link
                      to="/"
                      onClick={closeMenu}
                      className={`text-lg font-serif font-bold text-primary dark:text-gray-200 block hover:text-accent-red transition-colors py-2 border-b border-gray-50 dark:border-white/5 ${
                        isPathActive('/') ? 'text-accent-red border-accent-red/20' : ''
                      }`}
                    >
                      Inicio
                    </Link>
                  </motion.li>

                  {/* Nosotros */}
                  <motion.li variants={fadeInUp}>
                    <Link
                      to="/nosotros"
                      onClick={closeMenu}
                      className={`text-lg font-serif font-bold text-primary dark:text-gray-200 block hover:text-accent-red transition-colors py-2 border-b border-gray-50 dark:border-white/5 ${
                        isPathActive('/nosotros') ? 'text-accent-red border-accent-red/20' : ''
                      }`}
                    >
                      Nosotros
                    </Link>
                  </motion.li>

                  {/* Comunidad Accordion */}
                  <motion.li variants={fadeInUp}>
                    <div>
                      <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 py-2">
                        <span className={`text-lg font-serif font-bold text-primary dark:text-gray-200 ${
                          isComunidadActive() ? 'text-accent-red' : ''
                        }`}>
                          Comunidad
                        </span>
                        <button
                          onClick={() => setMobileComunidadOpen(!mobileComunidadOpen)}
                          className="p-2 text-primary hover:text-accent-red cursor-pointer"
                        >
                          <ChevronDown size={20} className={`transition-transform duration-200 ${mobileComunidadOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <AnimatePresence>
                        {mobileComunidadOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-4 space-y-2 mt-2 border-l-2 border-gray-100 overflow-hidden"
                          >
                            <li>
                              <Link
                                to="/ministerios"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                Ministerios
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/eventos"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                Eventos (Calendario)
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/peticiones"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                Peticiones
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/cumpleanos"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                Cumpleaños 🎂
                              </Link>
                            </li>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>

                  {/* Recursos Accordion */}
                  <motion.li variants={fadeInUp}>
                    <div>
                      <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 py-2">
                        <span className={`text-lg font-serif font-bold text-primary dark:text-gray-200 ${
                          isRecursosActive() ? 'text-accent-red' : ''
                        }`}>
                          Recursos
                        </span>
                        <button
                          onClick={() => setMobileRecursosOpen(!mobileRecursosOpen)}
                          className="p-2 text-primary hover:text-accent-red cursor-pointer"
                        >
                          <ChevronDown size={20} className={`transition-transform duration-200 ${mobileRecursosOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <AnimatePresence>
                        {mobileRecursosOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-4 space-y-2 mt-2 border-l-2 border-gray-100 overflow-hidden"
                          >
                            <li>
                              <Link
                                to="/recursos/biblia"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                La Santa Biblia
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/predicas"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                Prédicas
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/recursos/alabanzas"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                Alabanzas e Himnos
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/programas"
                                onClick={closeMenu}
                                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-accent-red dark:hover:text-gold block py-1"
                              >
                                Programas / Estudios
                              </Link>
                            </li>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>

                  {/* Aula Virtual */}
                  <motion.li variants={fadeInUp}>
                    <Link
                      to="/aula-virtual"
                      onClick={closeMenu}
                      className={`text-lg font-serif font-bold text-primary dark:text-gray-200 block hover:text-accent-red transition-colors py-2 border-b border-gray-50 dark:border-white/5 ${
                        isPathActive('/aula-virtual') ? 'text-accent-red border-accent-red/20' : ''
                      }`}
                    >
                      Aula Virtual
                    </Link>
                  </motion.li>

                  {/* Tienda */}
                  <motion.li variants={fadeInUp}>
                    <Link
                      to="/tienda"
                      onClick={closeMenu}
                      className={`text-lg font-serif font-bold text-primary dark:text-gray-200 block hover:text-accent-red transition-colors py-2 border-b border-gray-50 dark:border-white/5 ${
                        isPathActive('/tienda') ? 'text-accent-red border-accent-red/20' : ''
                      }`}
                    >
                      Tienda
                    </Link>
                  </motion.li>

                  {/* Contacto */}
                  <motion.li variants={fadeInUp}>
                    <Link
                      to="/contacto"
                      onClick={closeMenu}
                      className={`text-lg font-serif font-bold text-primary dark:text-gray-200 block hover:text-accent-red transition-colors py-2 border-b border-gray-50 dark:border-white/5 ${
                        isPathActive('/contacto') ? 'text-accent-red border-accent-red/20' : ''
                      }`}
                    >
                      Contacto
                    </Link>
                  </motion.li>
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
