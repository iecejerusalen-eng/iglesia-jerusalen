import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import { Menu, Search, X, Settings, Globe, LogOut } from 'lucide-react';
import CommandMenu from '../components/admin/CommandMenu';
import soloLogoBlanco from '../assets/Jerusalén/solo logo blanco.svg';
import ThemeToggle from '../components/common/ThemeToggle';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { sidebarViewMode, accentColor } = useThemeStore();
  const { logout } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  
  const isCollapsed = sidebarViewMode === 'compact';
  const isFloating = sidebarViewMode === 'floating';
  const isDrawer = sidebarViewMode === 'drawer';

  // Determine the padding left for desktop based on the mode
  let desktopPadding = 'md:pl-64';
  if (isCollapsed) desktopPadding = 'md:pl-20';
  if (isFloating) desktopPadding = 'md:pl-[18rem]'; // Sidebar width + margin
  if (isDrawer) desktopPadding = 'md:pl-0';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div 
      className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 relative overflow-hidden transition-colors duration-500"
      style={accentColor ? { '--color-gold': accentColor } as any : undefined}
    >
      {/* Sidebar overlay for mobile when open, OR desktop when drawer mode */}
      {isSidebarOpen && (
        <div 
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${!isDrawer ? 'md:hidden' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} searchQuery={searchQuery} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ${desktopPadding} overflow-x-hidden overflow-y-auto transition-all duration-500`}>
        {/* Mobile Top Header OR Desktop Drawer Menu */}
        <header className={`bg-primary text-white p-4 flex items-center justify-between shadow-sm z-30 transition-all ${(!isDrawer) ? 'md:hidden' : ''}`}>
          <div className="flex items-center gap-2">
            <img loading="lazy" src={soloLogoBlanco} alt="Logo" className="h-6 w-auto" />
            <h2 className="font-serif text-base font-bold">Iglesia Jerusalén</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer text-white"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Desktop Top Header (Non-sticky) */}
        <div className="hidden md:flex bg-white dark:bg-slate-900 border-b border-gray-150 dark:border-white/10 px-6 py-3 items-center justify-between shadow-xs">
          <div className="flex-1 max-w-md">
            <div className="relative flex items-center bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 focus-within:bg-gray-100 dark:focus-within:bg-slate-800 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-primary dark:focus-within:border-gold/50 px-3 py-2 transition-all duration-300">
              <Search size={16} className="text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar herramienta... (Ctrl + K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-gray-800 dark:text-white placeholder-gray-400 font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 shrink-0 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <ThemeToggle />
            
            {hasPermission('appearance', 'view') && (
              <button 
                onClick={() => navigate('/admin/apariencia')}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-gold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Personalizar Panel"
              >
                <Settings size={18} />
              </button>
            )}

            <button 
              onClick={() => window.open('/presentacion.html', '_blank')}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-gold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ver Presentación"
            >
              <svg className="w-[18px] h-[18px] fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <polygon points="10 7 15 10 10 13 10 7" className="fill-current" />
              </svg>
            </button>

            <button 
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-gold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar Panel"
            >
              <Globe size={18} />
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 dark:text-gray-400 hover:text-accent-red hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer flex items-center gap-2"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
              <span className="text-xs font-bold hidden lg:block">Salir</span>
            </button>
          </div>
        </div>

        <main className={`flex-1 p-4 md:p-8 ${isFloating ? 'pt-8' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandMenu />
    </div>
  );
};

export default AdminLayout;
