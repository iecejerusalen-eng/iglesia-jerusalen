import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dialog } from '@base-ui-components/react/dialog';
import { useSearchStore } from '../../store/useSearchStore';
import { supabase } from '../../config/supabase';
import {
  Home,
  Info,
  BookOpen,
  Book,
  Search,
  Calendar,
  CalendarDays,
  Users,
  Video,
  Music,
  Radio,
  Newspaper,
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
import { useMenuStore } from '../../store/useMenuStore';
import { DEFAULT_MENU_ITEMS } from '../../services/menuService';
import { buildMobileExploreItems, MOBILE_EXPLORE_GROUPS, type MobileExploreGroupId } from './mobileNavigationModel';
import { useSiteFeatureVisibilityStore } from '../../store/useSiteFeatureVisibilityStore';

const NAV_ICON_MAP: Record<string, LucideIcon> = {
  Home, Info, Users, Heart, FileText: Newspaper, Calendar, CalendarDays,
  Megaphone, MessageSquare, Cake, Globe, HandHeart, BookOpen, Book,
  Video, Radio, Music, GraduationCap, Gamepad2, ShoppingBag, Mail, Sparkles,
};

const GROUP_ICONS: Record<MobileExploreGroupId, LucideIcon> = {
  iglesia: Info,
  comunidad: Users,
  recursos: BookOpen,
  agenda: CalendarDays,
  contacto: Mail,
};

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
  const menuItems = useMenuStore((state) => state.items);
  const featureVisibility = useSiteFeatureVisibilityStore((state) => state.visibility);
  const [activeSheet, setActiveSheet] = useState<'explorar' | 'comunidad' | null>(null);
  const [activeSheetPath, setActiveSheetPath] = useState(location.pathname);
  const [activeGroup, setActiveGroup] = useState<MobileExploreGroupId | 'todas'>('todas');
  const [exploreQuery, setExploreQuery] = useState('');
  const [hasTodayEvents, setHasTodayEvents] = useState(false);
  const [hasRecentAnnouncements, setHasRecentAnnouncements] = useState(false);
  const isSearchOpen = useSearchStore((state) => state.isOpen);
  const isScrollVisible = useScrollDirection();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const isPanelOpen = activeSheet !== null && activeSheetPath === location.pathname;

  const exploreItems = useMemo(
    () => buildMobileExploreItems(menuItems.length > 0 ? menuItems : DEFAULT_MENU_ITEMS, featureVisibility),
    [featureVisibility, menuItems],
  );
  const visibleGroups = useMemo(() => {
    const query = exploreQuery.trim().toLocaleLowerCase('es');
    return MOBILE_EXPLORE_GROUPS
      .filter((group) => activeGroup === 'todas' || group.id === activeGroup)
      .map((group) => ({
        ...group,
        items: exploreItems.filter((item) => {
          if (item.group !== group.id) return false;
          if (!query) return true;
          return `${item.label} ${item.url}`.toLocaleLowerCase('es').includes(query);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeGroup, exploreItems, exploreQuery]);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  const toggleSheet = (sheet: 'explorar' | 'comunidad', trigger: HTMLElement) => {
    triggerHaptic(10);
    lastTriggerRef.current = trigger;
    setExploreQuery('');
    setActiveGroup(sheet === 'comunidad' ? 'comunidad' : 'todas');
    if (isPanelOpen && activeSheet === sheet) {
      setActiveSheet(null);
      return;
    }
    setActiveSheetPath(location.pathname);
    setActiveSheet(sheet);
  };

  // Comprobar eventos y anuncios para badges dinámicos
  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        const [eventsRes, annRes] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_date', todayStr).limit(1),
          supabase.from('church_announcements').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('publish_at', twoDaysAgo).limit(1)
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

  // Estado activo de los accesos visibles para la cuenta actual
  const isHomeActive = location.pathname === '/';
  const isEventsActive = location.pathname === '/eventos';

  const isResourcesActive = (isPanelOpen && activeSheet === 'explorar') || exploreItems.some(
    (item) => item.group === 'recursos' && (location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)),
  );

  const isCommunityActive = (isPanelOpen && activeSheet === 'comunidad') || exploreItems.some(
    (item) => item.group === 'comunidad' && (location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)),
  );

  const handleCtaSearch = () => {
    triggerHaptic(12);
    closeSheet();
    useSearchStore.getState().open();
  };

  // Mantener visible si hay una hoja o el buscador abierto
  // Las cuentas autorizadas conservan su acceso directo a Admin mientras navegan.
  const shouldShowNav = isScrollVisible || isPanelOpen || isSearchOpen;

  return (
    <>
      {/* BARRA DE NAVEGACIÓN INFERIOR PRINCIPAL (Mobile Only con Scroll-Awareness) */}
      <motion.nav
        aria-label="Navegación principal móvil"
        initial={{ y: 0 }}
        animate={{ y: shouldShowNav ? 0 : '110%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="fixed inset-x-0 bottom-0 z-40 xl:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)] pb-safe transition-colors duration-300"
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
            className={`group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl`}
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
            onClick={(event) => toggleSheet('explorar', event.currentTarget)}
            aria-label="Explorar todas las páginas públicas"
            aria-expanded={activeSheet === 'explorar'}
            aria-controls="mobile-explore-dialog"
            className={`group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl`}
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
                Explorar
              </span>
            </motion.div>
          </button>

          {/* 3. CTA CENTRAL ELEVADO - BUSCAR */}
          <div className={`relative flex-1 min-w-[56px] h-full flex items-center justify-center`}>
            <motion.button
              type="button"
              onClick={handleCtaSearch}
              aria-label="Abrir buscador inteligente (Ctrl+K)"
              aria-expanded={isSearchOpen}
              whileTap={{ scale: 0.9 }}
              className="group flex h-full w-full flex-col items-center justify-center rounded-xl py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className={`relative rounded-xl p-1 transition-colors duration-300 ${isSearchOpen ? 'text-primary dark:text-gold' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}`}>
                <Search size={22} strokeWidth={isSearchOpen ? 2.5 : 2} aria-hidden="true" />
                {isSearchOpen && (
                  <motion.span
                    layoutId="bottomNavActiveIndicator"
                    className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary shadow-sm shadow-primary/40 dark:bg-gold dark:shadow-gold/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </span>
              <span className={`mt-0.5 text-[11px] tracking-tight transition-colors duration-200 ${isSearchOpen ? 'font-bold text-primary dark:text-gold' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                Buscar
              </span>
            </motion.button>
          </div>

          {/* 4. EVENTOS */}
          <Link
            to="/eventos"
            onClick={() => {
              triggerHaptic(8);
              closeSheet();
            }}
            aria-label="Ir a Eventos y Calendario"
            className={`group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl`}
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

          {/* 5. COMUNIDAD (abre el mismo explorador enfocado en su sección) */}
          <button
            type="button"
            onClick={(event) => toggleSheet('comunidad', event.currentTarget)}
            aria-label="Abrir comunidad, ministerios y peticiones"
            aria-expanded={activeSheet === 'comunidad'}
            aria-controls="mobile-explore-dialog"
            className={`group relative flex-1 min-w-[56px] h-full flex flex-col items-center justify-center py-1 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl`}
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

      <Dialog.Root
        open={isPanelOpen}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm transition-opacity duration-300 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none xl:hidden" />
          <Dialog.Viewport className="fixed inset-0 z-50 xl:hidden">
            <Dialog.Popup
              id="mobile-explore-dialog"
              initialFocus={searchInputRef}
              finalFocus={lastTriggerRef}
              className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-900 shadow-2xl transition-[transform,opacity] duration-300 ease-out data-[starting-style]:translate-y-5 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-5 data-[ending-style]:opacity-0 dark:bg-slate-950 dark:text-white motion-reduce:transition-none xl:hidden"
            >
              <div className="relative shrink-0 overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-5 pb-5 pt-[max(1rem,env(safe-area-inset-top))] text-white dark:border-white/10 sm:px-8">
                <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border border-amber-300/15 bg-amber-300/5 blur-2xl" aria-hidden="true" />
                <div className="relative mx-auto flex w-full max-w-5xl items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Iglesia Jerusalén · Navegación</p>
                    <Dialog.Title className="mt-2 font-serif text-2xl font-bold leading-tight sm:text-3xl">
                      {activeSheet === 'comunidad' ? 'Vida en comunidad' : '¿A dónde te gustaría ir?'}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 max-w-xl text-sm text-blue-100/85">
                      Encuentra páginas, actividades y recursos de la iglesia.
                    </Dialog.Description>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      closeSheet();
                    }}
                    aria-label="Cerrar explorador"
                    className="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
                <div className="relative mx-auto mt-5 w-full max-w-5xl">
                  <label htmlFor="mobile-explore-search" className="sr-only">Buscar páginas</label>
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 shadow-inner backdrop-blur-xl focus-within:border-amber-300/70 focus-within:ring-2 focus-within:ring-amber-300/25">
                    <Search size={19} className="shrink-0 text-blue-100" aria-hidden="true" />
                    <input
                      ref={searchInputRef}
                      id="mobile-explore-search"
                      type="search"
                      value={exploreQuery}
                      onChange={(event) => setExploreQuery(event.target.value)}
                      placeholder="Buscar una página..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-blue-100/65"
                    />
                    {exploreQuery && (
                      <button
                        type="button"
                        onClick={() => setExploreQuery('')}
                        aria-label="Limpiar búsqueda"
                        className="rounded-lg p-1 text-blue-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mx-auto w-full max-w-5xl shrink-0 px-4 pt-4 sm:px-8">
                <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filtrar por sección">
                  <button
                    type="button"
                    aria-pressed={activeGroup === 'todas'}
                    onClick={() => setActiveGroup('todas')}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-amber-300 ${activeGroup === 'todas' ? 'border-blue-900 bg-blue-900 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300'}`}
                  >Todas</button>
                  {MOBILE_EXPLORE_GROUPS.map((group) => {
                    const GroupIcon = GROUP_ICONS[group.id];
                    return (
                      <button
                        key={group.id}
                        type="button"
                        aria-pressed={activeGroup === group.id}
                        onClick={() => setActiveGroup(group.id)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-amber-300 ${activeGroup === group.id ? 'border-blue-900 bg-blue-900 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300'}`}
                      >
                        <GroupIcon size={14} aria-hidden="true" />{group.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-8">
                <div className="mx-auto w-full max-w-5xl space-y-7">
                  {visibleGroups.map((group) => {
                    const GroupIcon = GROUP_ICONS[group.id];
                    return (
                      <section key={group.id} aria-labelledby={`mobile-explore-${group.id}`}>
                        <div className="mb-3 flex items-center gap-2.5">
                          <span className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-amber-200">
                            <GroupIcon size={17} aria-hidden="true" />
                          </span>
                          <h3 id={`mobile-explore-${group.id}`} className="font-serif text-lg font-bold text-slate-900 dark:text-white">{group.label}</h3>
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{group.items.length}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {group.items.map((item) => {
                            const Icon = NAV_ICON_MAP[item.icon || ''] || GROUP_ICONS[group.id];
                            const isItemActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
                            return (
                              <Link
                                key={item.id}
                                to={item.url}
                                aria-current={isItemActive ? 'page' : undefined}
                                onClick={() => {
                                  triggerHaptic(8);
                                  closeSheet();
                                }}
                                className={`group flex min-h-16 items-center gap-3 rounded-2xl border px-3.5 py-3 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:focus-visible:ring-amber-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${isItemActive ? 'border-blue-900/30 bg-blue-50 text-blue-950 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100' : 'border-slate-200/80 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-slate-800'}`}
                              >
                                <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${isItemActive ? 'bg-blue-900 text-white dark:bg-amber-300 dark:text-slate-950' : 'bg-slate-100 text-blue-900 group-hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-200 dark:group-hover:bg-slate-700'}`}>
                                  <Icon size={19} strokeWidth={2.1} aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-bold">{item.label}</span>
                                  <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">{item.url}</span>
                                </span>
                                <ChevronRight size={17} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-slate-500" aria-hidden="true" />
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                  {visibleGroups.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-white/15">
                      <p className="font-semibold text-slate-800 dark:text-white">No encontramos esa página</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prueba otra palabra o elige otra sección.</p>
                    </div>
                  )}
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default MobileBottomNav;
