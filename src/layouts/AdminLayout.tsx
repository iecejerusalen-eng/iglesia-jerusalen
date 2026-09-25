import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Globe, LogOut, Menu, Search, Settings, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/admin/Sidebar';
import CommandMenu from '../components/admin/CommandMenu';
import soloLogoBlanco from '../assets/Jerusalén/solo logo blanco.svg';
import ThemeToggle from '../components/common/ThemeToggle';
import { GlobalErrorBoundary } from '../components/common/ErrorBoundary';
import { toast } from 'sonner';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';
import { useSearchStore } from '../store/useSearchStore';
import { ADMIN_MODULES, getAdminModulePermission } from '../config/adminModules';
import { useOnboarding } from '../admin/onboarding/useOnboarding';
import { OnboardingChecklist } from '../admin/onboarding/OnboardingChecklist';
import { OnboardingModal } from '../admin/onboarding/OnboardingModal';
import confetti from 'canvas-confetti';

interface AccentStyle extends CSSProperties {
  '--color-gold'?: string;
}

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { sidebarViewMode, accentColor } = useThemeStore();
  const { logout, firstName, photoUrl, userRole } = useAuthStore();
  const onboarding = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const previousPorcentajeRef = useRef<number | null>(null);
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!onboarding.isLoading && onboarding.pasos.length > 0 && !onboarding.config.onboarding_completado && !onboarding.config.onboarding_omitido) {
      const snoozedUntil = localStorage.getItem('admin_onboarding_snoozed_until');
      if (snoozedUntil && Date.now() < Number(snoozedUntil)) return undefined;
      const timer = window.setTimeout(() => setShowOnboarding(true), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [onboarding.config.onboarding_completado, onboarding.config.onboarding_omitido, onboarding.isLoading, onboarding.pasos.length]);

  useEffect(() => {
    if (onboarding.error) console.warn('Onboarding check:', onboarding.error);
  }, [onboarding.error]);

  useEffect(() => {
    // Only celebrate if user actually progressed from < 100% to 100% in this session,
    // and has never celebrated it before in localStorage. Never fire repeatedly on page mount.
    const alreadyCelebrated = localStorage.getItem('admin_onboarding_celebrated') === 'true';
    if (
      previousPorcentajeRef.current !== null &&
      previousPorcentajeRef.current < 100 &&
      onboarding.porcentaje === 100 &&
      !alreadyCelebrated
    ) {
      localStorage.setItem('admin_onboarding_celebrated', 'true');
      void confetti({ particleCount: 90, spread: 65, origin: { y: 0.72 } });
    }
    previousPorcentajeRef.current = onboarding.porcentaje;
  }, [onboarding.porcentaje]);

  const closeOnboarding = () => {
    setShowOnboarding(false);
    void onboarding.actualizarConfig({ onboarding_omitido: true });
    localStorage.setItem('admin_onboarding_snoozed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };
  const postponeOnboarding = () => {
    setShowOnboarding(false);
    void onboarding.actualizarConfig({ onboarding_omitido: true });
    localStorage.setItem('admin_onboarding_snoozed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };
  const reopenOnboarding = () => {
    setShowOnboarding(true);
    void onboarding.actualizarConfig({ onboarding_omitido: false });
    localStorage.removeItem('admin_onboarding_snoozed_until');
  };

  const isCollapsed = sidebarViewMode === 'compact';
  const isFloating = sidebarViewMode === 'floating';
  const isDrawer = sidebarViewMode === 'drawer';

  let desktopPadding = 'md:pl-64';
  if (sidebarViewMode === 'full') desktopPadding = 'md:pl-0';
  if (isCollapsed) desktopPadding = 'md:pl-20';
  if (isFloating) desktopPadding = 'md:pl-[18rem]';
  if (isDrawer) desktopPadding = 'md:pl-0';

  const activeModule = useMemo(() => {
    const candidates = ADMIN_MODULES.filter((module) =>
      module.path === '/admin'
        ? location.pathname === '/admin'
        : location.pathname.startsWith(module.path)
    );
    return candidates.sort((a, b) => b.path.length - a.path.length)[0];
  }, [location.pathname]);

  const accentStyle: AccentStyle | undefined = accentColor
    ? { '--color-gold': accentColor }
    : undefined;

  const openNavigation = (withSearch = false) => {
    if (withSearch) setSearchQuery('');
    setIsSidebarOpen(true);
  };

  const openCommandMenu = () => {
    useSearchStore.getState().open();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('No se pudo cerrar la sesión:', error);
      toast.error('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    }
  };

  const preferredMobileIds = ['dashboard', 'members', 'events'];
  const mobileLinks = ADMIN_MODULES
    .filter((module) => module.available !== false && hasPermission(getAdminModulePermission(module), 'view'))
    .sort((a, b) => {
      const aIndex = preferredMobileIds.indexOf(a.id);
      const bIndex = preferredMobileIds.indexOf(b.id);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    })
    .slice(0, 3);

  return (
    <div
      className="min-h-[100dvh] overflow-x-hidden bg-[#eef0f6] font-sans text-slate-800 transition-colors duration-300 dark:bg-[#060d1f] dark:text-slate-100"
      style={accentStyle}
    >
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-amber-400 focus:px-4 focus:py-2 focus:font-bold focus:text-slate-950 focus:shadow-xl"
      >
        Saltar al contenido principal
      </a>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className={`flex min-h-[100dvh] flex-col transition-[padding] duration-300 ${desktopPadding}`}>
        {/* ─── Header Premium Glassmorphism ─── */}
        <header className="sticky top-0 z-30 border-b border-slate-200/50 bg-white/80 px-3 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] shadow-[0_2px_28px_-6px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#060d1f]/80 sm:px-5 md:px-6">
          <div className="mx-auto flex min-h-11 max-w-[1600px] items-center gap-3">
            <button
              type="button"
              onClick={() => openNavigation()}
              className={`${isDrawer ? 'md:flex' : 'md:hidden'} flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow dark:border-white/[0.08] dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/80`}
              aria-label="Abrir navegación"
              aria-expanded={isSidebarOpen}
            >
              <Menu size={20} />
            </button>

            {/* Mobile: logo + page title */}
            <div className="flex min-w-0 items-center gap-2.5 md:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-blue-700/20">
                <img src={soloLogoBlanco} alt="Iglesia Jerusalén" className="h-5 w-auto" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Panel administrativo</p>
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{activeModule?.name ?? 'Resumen'}</p>
              </div>
            </div>

            {/* Desktop: Search bar */}
            <div className="relative hidden max-w-xl flex-1 md:flex">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="button"
                aria-label="Abrir búsqueda global"
                value="Buscar herramientas o miembros..."
                onClick={openCommandMenu}
                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200/80 bg-slate-50/80 pl-10 pr-20 text-sm font-medium text-slate-500 outline-none transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-700 dark:border-white/[0.08] dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200/80 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:border-white/10 dark:bg-slate-800">
                Ctrl K
              </kbd>
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* Role badge */}
              <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/5 dark:text-slate-300 xl:flex">
                <ShieldCheck size={13} className="text-gold" />
                {userRole ?? 'Sin rol'}
              </div>
              {/* Onboarding points */}
              <button
                type="button"
                onClick={reopenOnboarding}
                className="hidden items-center gap-1 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-1.5 text-[10px] font-extrabold text-amber-700 hover:bg-amber-100/80 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/20 transition-all cursor-pointer xl:flex"
                title="Ver progreso de onboarding / activación"
              >
                ⚡ {onboarding.puntos} pts
              </button>
              {/* Mobile search */}
              <button
                type="button"
                onClick={openCommandMenu}
                className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
                aria-label="Buscar herramientas"
              >
                <Search size={19} />
              </button>
              <ThemeToggle />

              {hasPermission('appearance', 'view') && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/apariencia')}
                  className="hidden size-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800 lg:flex"
                  title="Personalizar panel"
                  aria-label="Personalizar panel"
                >
                  <Settings size={18} />
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className="hidden size-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800 lg:flex"
                title="Ir al sitio web"
                aria-label="Ir al sitio web"
              >
                <Globe size={18} />
              </button>

              <div className="hidden h-7 w-px bg-slate-200/80 dark:bg-white/[0.08] md:block" />
              {/* User avatar + logout */}
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-blue-700 text-xs font-extrabold text-white shadow-md shadow-blue-700/25 ring-2 ring-white/80 dark:ring-slate-800">
                  {photoUrl ? <img src={photoUrl} alt="Perfil" className="h-full w-full object-cover" /> : (firstName?.[0] ?? 'A').toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={17} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Main Content with Radial Gradient Ambient ─── */}
        <main id="admin-main-content" tabIndex={-1} className={`relative mx-auto w-full max-w-[1600px] flex-1 px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-5 md:px-6 md:pb-8 md:pt-6 xl:px-8 ${isFloating ? 'md:pt-8' : ''}`}>
          <div
            className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_42%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.07),transparent_38%)]"
            aria-hidden="true"
          />
          <GlobalErrorBoundary key={location.pathname}>
            <Outlet />
          </GlobalErrorBoundary>
        </main>
      </div>

      {/* ─── Mobile Bottom Nav (Premium Glass) ─── */}
      <nav
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto grid max-w-md rounded-2xl border border-white/80 bg-white/90 p-1.5 shadow-[0_20px_60px_-12px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-slate-950/90 md:hidden"
        style={{ gridTemplateColumns: `repeat(${mobileLinks.slice(0, 3).length + 1}, minmax(0, 1fr))` }}
        aria-label="Navegación rápida"
      >
        {mobileLinks.slice(0, 3).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <item.icon size={18} />
            <span className="max-w-full truncate px-1">{item.id === 'dashboard' ? 'Inicio' : item.name}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => openNavigation()}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Ver todas las herramientas"
        >
          <Menu size={18} />
          <span>Más</span>
        </button>
      </nav>

      <CommandMenu />
      {!onboarding.isLoading && onboarding.pasos.length > 0 && <OnboardingChecklist pasos={onboarding.pasos} porcentaje={onboarding.porcentaje} completados={onboarding.completados} puntos={onboarding.puntos} onReopen={reopenOnboarding} />}
      {showOnboarding && onboarding.pasos.length > 0 && <OnboardingModal nombre={firstName || 'equipo'} pasos={onboarding.pasos} porcentaje={onboarding.porcentaje} onStart={(paso) => { setShowOnboarding(false); navigate(paso.accion_ruta); }} onLater={postponeOnboarding} onClose={closeOnboarding} />}
    </div>
  );
};

export default AdminLayout;
