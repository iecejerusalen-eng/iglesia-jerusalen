import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useSearchStore } from '../../store/useSearchStore';
import { supabase } from '../../config/supabase';
import {
  Home,
  BookOpen,
  Search,
  Calendar,
  Users,
  Video,
  Music,
  GraduationCap,
  Gamepad2,
  Sparkles,
  Heart,
  Megaphone,
  MessageSquare,
  Cake,
  Globe,
  HandHeart,
  ShoppingBag,
  Mail,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react';

interface SubMenuItem {
  id: string;
  label: string;
  description: string;
  url: string;
  icon: LucideIcon;
}

interface NavBadgeProps {
  dot?: boolean;
  count?: number;
}

const triggerHaptic = (duration: number = 8) => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  } catch {
    // Ignore environments where vibration API is unsupported
  }
};

const NavBadge: React.FC<NavBadgeProps> = ({ dot, count }) => {
  if (!dot && (!count || count <= 0)) return null;

  return (
    <span
      className="absolute -top-1 -right-1.5 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      {dot ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-red border-2 border-white dark:border-slate-900" />
        </span>
      ) : (
        <span className="min-w-[16px] h-4 px-1 rounded-full bg-accent-red text-white text-[9px] font-black leading-none flex items-center justify-center shadow-sm border border-white dark:border-slate-900">
          {count && count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  );
};

// Destinos organizados por hojas inferiores
const RECURSOS_ITEMS: SubMenuItem[] = [
  {
    id: 'rec-biblia',
    label: 'La Santa Biblia',
    description: 'Texto sagrado, capítulos y búsqueda',
    url: '/recursos/biblia',
    icon: BookOpen,
  },
  {
    id: 'rec-predicas',
    label: 'Prédicas y Sermones',
    description: 'Mensajes dominicales y enseñanzas en video',
    url: '/predicas',
    icon: Video,
  },
  {
    id: 'rec-alabanzas',
    label: 'Alabanzas e Himnos',
    description: 'Letras, acordes y pistas de adoración',
    url: '/recursos/alabanzas',
    icon: Music,
  },
  {
    id: 'rec-programas',
    label: 'Programas de Estudio',
    description: 'Cursos bíblicos y formación en discipulado',
    url: '/programas',
    icon: GraduationCap,
  },
  {
    id: 'rec-juegos',
    label: 'Juegos Bíblicos',
    description: 'Biblionario, Ahorcado y memoria bíblica',
    url: '/recursos/juegos',
    icon: Gamepad2,
  },
  {
    id: 'rec-aula',
    label: 'Aula Virtual',
    description: 'Plataforma académica y certificaciones',
    url: '/aula-virtual',
    icon: Sparkles,
  },
];

const COMUNIDAD_ITEMS: SubMenuItem[] = [
  {
    id: 'com-visita',
    label: 'Planifica tu Visita',
    description: 'Información para primeros visitantes y bienvenida',
    url: '/visita',
    icon: Sparkles,
  },
  {
    id: 'com-ministerios',
    label: 'Ministerios',
    description: 'Conoce y sé parte de nuestros grupos',
    url: '/ministerios',
    icon: Heart,
  },
  {
    id: 'com-anuncios',
    label: 'Anuncios Importantes',
    description: 'Noticias y boletines de la congregación',
    url: '/anuncios',
    icon: Megaphone,
  },
  {
    id: 'com-peticiones',
    label: 'Peticiones de Oración',
    description: 'Comparte tus motivos de oración e intercesión',
    url: '/peticiones',
    icon: MessageSquare,
  },
  {
    id: 'com-cumpleanos',
    label: 'Cumpleaños del Mes',
    description: 'Celebremos juntos a nuestros hermanos',
    url: '/cumpleanos',
    icon: Cake,
  },
  {
    id: 'com-misiones',
    label: 'Misiones y Evangelismo',
    description: 'Impacto misionero local e internacional',
    url: '/misiones',
    icon: Globe,
  },
  {
    id: 'com-servir',
    label: 'Quiero Servir',
    description: 'Postulaciones y horarios de voluntarios',
    url: '/mi-horario',
    icon: HandHeart,
  },
  {
    id: 'com-tienda',
    label: 'Tienda Oficial',
    description: 'Materiales, literatura y donaciones',
    url: '/tienda',
    icon: ShoppingBag,
  },
  {
    id: 'com-contacto',
    label: 'Contacto y Horarios',
    description: 'Ubicación física, teléfonos y atención',
    url: '/contacto',
    icon: Mail,
  },
];

function useScrollDirection(threshold: number = 15) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      // Always show near top
      if (scrollY < 60) {
        setIsVisible(true);
        ticking = false;
        return;
      }

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      setIsVisible(scrollY < lastScrollY);
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return isVisible;
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [activeSheet, setActiveSheet] = useState<'recursos' | 'comunidad' | null>(null);
  const [hasTodayEvents, setHasTodayEvents] = useState(false);
  const [hasRecentAnnouncements, setHasRecentAnnouncements] = useState(false);
  const isSearchOpen = useSearchStore((state) => state.isOpen);
  const isScrollVisible = useScrollDirection();
  const dragControls = useDragControls();

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  const toggleSheet = (sheet: 'recursos' | 'comunidad') => {
    triggerHaptic(10);
    setActiveSheet((prev) => (prev === sheet ? null : sheet));
  };

  // Cierre con tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!activeSheet) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeSheet, closeSheet]);

  // Cerrar hoja al cambiar de ruta
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    if (activeSheet) {
      setActiveSheet(null);
    }
  }

  // Comprobar eventos y anuncios para badges dinámicos
  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        const [eventsRes, annRes] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_date', todayStr).limit(1),
          supabase.from('church_announcements').select('id', { count: 'exact', head: true }).eq('is_published', true).gte('published_at', twoDaysAgo).limit(1)
        ]);

        if (isMounted) {
          if (eventsRes.count && eventsRes.count > 0) setHasTodayEvents(true);
          if (annRes.count && annRes.count > 0) setHasRecentAnnouncements(true);
        }
      } catch {
        // Silently skip badge errors if table not ready
      }
    };

    void fetchBadges();
    return () => { isMounted = false; };
  }, []);

  // Evaluadores de estado activo para las 5 pestañas
  const isHomeActive = location.pathname === '/';
  const isEventsActive = location.pathname === '/eventos';

  const isResourcesActive =
    activeSheet === 'recursos' ||
    RECURSOS_ITEMS.some(
      (item) => location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url))
    );

  const isCommunityActive =
    activeSheet === 'comunidad' ||
    COMUNIDAD_ITEMS.some(
      (item) => location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url))
    );

  const handleCtaSearch = () => {
    triggerHaptic(12);
    closeSheet();
    useSearchStore.getState().open();
  };

  // Mantener visible si hay una hoja o el buscador abierto
  const shouldShowNav = isScrollVisible || activeSheet !== null || isSearchOpen;

  return (
    <>
      {/* BARRA DE NAVEGACIÓN INFERIOR PRINCIPAL (Mobile Only con Scroll-Awareness) */}
      <motion.nav
        aria-label="Navegación principal móvil"
        initial={{ y: 0 }}
        animate={{ y: shouldShowNav ? 0 : '110%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)] pb-safe transition-colors duration-300"
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-2">
          {/* 1. INICIO */}
          <Link
            to="/"
            onClick={() => {
              triggerHaptic(8);
              closeSheet();
            }}
            aria-label="Ir a Inicio"
            className="group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <motion.div
              whileTap={{ scale: 0.88 }}
              className="relative flex flex-col items-center justify-center"
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${
                  isHomeActive
                    ? 'text-primary dark:text-gold'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              >
                <Home
                  size={22}
                  strokeWidth={isHomeActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isHomeActive ? 'scale-110' : ''}`}
                />
                {isHomeActive && (
                  <motion.span
                    layoutId="bottomNavActiveIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-primary dark:bg-gold shadow-sm shadow-primary/40 dark:shadow-gold/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight font-medium transition-colors duration-200 ${
                  isHomeActive
                    ? 'text-primary dark:text-gold font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Inicio
              </span>
            </motion.div>
          </Link>

          {/* 2. RECURSOS (Bottom Sheet) */}
          <button
            type="button"
            onClick={() => toggleSheet('recursos')}
            aria-label="Abrir recursos bíblicos y multimedia"
            aria-expanded={activeSheet === 'recursos'}
            className="group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <motion.div
              whileTap={{ scale: 0.88 }}
              className="relative flex flex-col items-center justify-center"
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${
                  isResourcesActive
                    ? 'text-primary dark:text-gold'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              >
                <BookOpen
                  size={22}
                  strokeWidth={isResourcesActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isResourcesActive ? 'scale-110' : ''}`}
                />
                {isResourcesActive && (
                  <motion.span
                    layoutId="bottomNavActiveIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-primary dark:bg-gold shadow-sm shadow-primary/40 dark:shadow-gold/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight font-medium transition-colors duration-200 ${
                  isResourcesActive
                    ? 'text-primary dark:text-gold font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Recursos
              </span>
            </motion.div>
          </button>

          {/* 3. CTA CENTRAL ELEVADO - BUSCAR */}
          <div className="relative flex-1 min-w-[60px] h-full flex items-center justify-center">
            <motion.button
              type="button"
              onClick={handleCtaSearch}
              aria-label="Abrir buscador inteligente (Ctrl+K)"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              className="absolute -top-3.5 flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-blue-700 to-church-gold-medium dark:from-primary dark:via-indigo-800 dark:to-gold text-white shadow-[0_8px_20px_rgba(30,58,138,0.35)] dark:shadow-[0_8px_25px_rgba(217,119,6,0.35)] border-2 border-white dark:border-slate-900 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform"
            >
              <Search size={22} strokeWidth={2.5} className="text-white drop-shadow-sm" />
              {isSearchOpen && (
                <span className="absolute inset-0 rounded-2xl border-2 border-gold animate-ping opacity-60 pointer-events-none" />
              )}
            </motion.button>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-7 pointer-events-none">
              Buscar
            </span>
          </div>

          {/* 4. EVENTOS */}
          <Link
            to="/eventos"
            onClick={() => {
              triggerHaptic(8);
              closeSheet();
            }}
            aria-label="Ir a Eventos y Calendario"
            className="group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <motion.div
              whileTap={{ scale: 0.88 }}
              className="relative flex flex-col items-center justify-center"
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${
                  isEventsActive
                    ? 'text-primary dark:text-gold'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              >
                <Calendar
                  size={22}
                  strokeWidth={isEventsActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isEventsActive ? 'scale-110' : ''}`}
                />
                <NavBadge dot={hasTodayEvents} />
                {isEventsActive && (
                  <motion.span
                    layoutId="bottomNavActiveIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-primary dark:bg-gold shadow-sm shadow-primary/40 dark:shadow-gold/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight font-medium transition-colors duration-200 ${
                  isEventsActive
                    ? 'text-primary dark:text-gold font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Eventos
              </span>
            </motion.div>
          </Link>

          {/* 5. COMUNIDAD (Bottom Sheet) */}
          <button
            type="button"
            onClick={() => toggleSheet('comunidad')}
            aria-label="Abrir comunidad, ministerios y peticiones"
            aria-expanded={activeSheet === 'comunidad'}
            className="group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <motion.div
              whileTap={{ scale: 0.88 }}
              className="relative flex flex-col items-center justify-center"
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${
                  isCommunityActive
                    ? 'text-primary dark:text-gold'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              >
                <Users
                  size={22}
                  strokeWidth={isCommunityActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isCommunityActive ? 'scale-110' : ''}`}
                />
                <NavBadge dot={hasRecentAnnouncements} />
                {isCommunityActive && (
                  <motion.span
                    layoutId="bottomNavActiveIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-primary dark:bg-gold shadow-sm shadow-primary/40 dark:shadow-gold/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight font-medium transition-colors duration-200 ${
                  isCommunityActive
                    ? 'text-primary dark:text-gold font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Comunidad
              </span>
            </motion.div>
          </button>
        </div>
      </motion.nav>

      {/* HOJAS INFERIORES DESPLEGABLES (BOTTOM SHEETS TÁCTILES CON DRAG-TO-DISMISS) */}
      <AnimatePresence>
        {activeSheet && (
          <>
            {/* Backdrop oscuro */}
            <motion.div
              key="bottom-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                triggerHaptic(6);
                closeSheet();
              }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Panel Bottom Sheet Flotante */}
            <motion.div
              key={`bottom-sheet-${activeSheet}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 450) {
                  triggerHaptic(6);
                  closeSheet();
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label={activeSheet === 'recursos' ? 'Recursos Bíblicos' : 'Comunidad y Ministerios'}
              className="fixed inset-x-2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 max-h-[min(78dvh,38rem)] flex flex-col rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.22)] md:hidden overflow-hidden"
            >
              {/* Drag Handle & Header */}
              <div className="pt-3 pb-2 px-5 shrink-0 border-b border-slate-100 dark:border-white/5">
                <div
                  className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 cursor-grab active:cursor-grabbing mb-3"
                  title="Deslizar hacia abajo para cerrar"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-gold block">
                      {activeSheet === 'recursos' ? 'Explorar Fe & Conocimiento' : 'Vida en la Iglesia'}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                      {activeSheet === 'recursos' ? 'Recursos Bíblicos' : 'Comunidad y Servicio'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      closeSheet();
                    }}
                    aria-label="Cerrar menú"
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Lista Vertical Unidireccional con Tarjetas Limpias */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-2 custom-scrollbar">
                {(activeSheet === 'recursos' ? RECURSOS_ITEMS : COMUNIDAD_ITEMS).map((item) => {
                  const Icon = item.icon;
                  const isItemActive =
                    location.pathname === item.url ||
                    (item.url !== '/' && location.pathname.startsWith(item.url));

                  return (
                    <Link
                      key={item.id}
                      to={item.url}
                      onClick={() => {
                        triggerHaptic(8);
                        closeSheet();
                      }}
                      className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                        isItemActive
                          ? 'border-primary/30 bg-primary/5 dark:border-gold/30 dark:bg-gold/10'
                          : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isItemActive
                              ? 'bg-primary text-white dark:bg-gold dark:text-slate-950 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-gold shadow-sm border border-slate-100 dark:border-white/5'
                          }`}
                        >
                          <Icon size={20} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate leading-tight ${
                              isItemActive
                                ? 'text-primary dark:text-gold'
                                : 'text-slate-800 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-gold'
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={18}
                        className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
                          isItemActive
                            ? 'text-primary dark:text-gold'
                            : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500'
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
