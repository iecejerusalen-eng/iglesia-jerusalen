import { useMemo, useState, type CSSProperties } from 'react';
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
import { ADMIN_MODULES, getAdminModulePermission } from '../config/adminModules';

interface AccentStyle extends CSSProperties {
  '--color-gold'?: string;
}

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { sidebarViewMode, accentColor } = useThemeStore();
  const { logout, firstName, photoUrl, userRole } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const isCollapsed = sidebarViewMode === 'compact';
  const isFloating = sidebarViewMode === 'floating';
  const isDrawer = sidebarViewMode === 'drawer';

  let desktopPadding = 'md:pl-64';
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
    window.dispatchEvent(new Event('admin-command-menu:open'));
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
      className="min-h-[100dvh] bg-[#f6f7f9] font-sans text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100"
      style={accentStyle}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className={`flex min-h-[100dvh] flex-col transition-[padding] duration-300 ${desktopPadding}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:px-5 md:px-6">
          <div className="mx-auto flex min-h-11 max-w-[1600px] items-center gap-3">
            <button
              type="button"
              onClick={() => openNavigation()}
              className={`${isDrawer ? 'md:flex' : 'md:hidden'} flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700`}
              aria-label="Abrir navegación"
              aria-expanded={isSidebarOpen}
            >
              <Menu size={20} />
            </button>

            <div className="flex min-w-0 items-center gap-2.5 md:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                <img src={soloLogoBlanco} alt="Iglesia Jerusalén" className="h-5 w-auto" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Panel administrativo</p>
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{activeModule?.name ?? 'Resumen'}</p>
              </div>
            </div>

            <div className="relative hidden max-w-xl flex-1 md:flex">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="button"
                aria-label="Abrir búsqueda global"
                value="Buscar herramientas o miembros..."
                onClick={openCommandMenu}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-20 text-sm font-medium text-slate-800 outline-none transition focus:border-gold/50 focus:bg-white focus:ring-4 focus:ring-gold/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:border-white/10 dark:bg-slate-900">Ctrl K</kbd>
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-300 xl:flex">
                <ShieldCheck size={15} className="text-gold" />
                {userRole ?? 'Sin rol'}
              </div>
              <button
                type="button"
                onClick={openCommandMenu}
                className="flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
                aria-label="Buscar herramientas"
              >
                <Search size={19} />
              </button>
              <ThemeToggle />

              {hasPermission('appearance', 'view') && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/apariencia')}
                  className="hidden size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800 lg:flex"
                  title="Personalizar panel"
                  aria-label="Personalizar panel"
                >
                  <Settings size={18} />
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className="hidden size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800 lg:flex"
                title="Ir al sitio web"
                aria-label="Ir al sitio web"
              >
                <Globe size={18} />
              </button>

              <div className="hidden h-7 w-px bg-slate-200 dark:bg-white/10 md:block" />
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-primary text-xs font-extrabold text-white ring-2 ring-slate-100 dark:ring-slate-800">
                  {photoUrl ? <img src={photoUrl} alt="Perfil" className="h-full w-full object-cover" /> : (firstName?.[0] ?? 'A').toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={17} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className={`mx-auto w-full max-w-[1600px] flex-1 px-3 pb-28 pt-4 sm:px-5 sm:pt-5 md:px-6 md:pb-8 md:pt-6 xl:px-8 ${isFloating ? 'md:pt-8' : ''}`}>
          <GlobalErrorBoundary key={location.pathname}>
            <Outlet />
          </GlobalErrorBoundary>
        </main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 grid rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-[0_16px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 md:hidden"
        style={{ gridTemplateColumns: `repeat(${mobileLinks.slice(0, 3).length + 1}, minmax(0, 1fr))` }}
        aria-label="Navegación rápida"
      >
        {mobileLinks.slice(0, 3).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <item.icon size={18} />
            <span className="max-w-full truncate px-1">{item.id === 'dashboard' ? 'Inicio' : item.name}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => openNavigation()}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Ver todas las herramientas"
        >
          <Menu size={18} />
          <span>Más</span>
        </button>
      </nav>

      <CommandMenu />
    </div>
  );
};

export default AdminLayout;
