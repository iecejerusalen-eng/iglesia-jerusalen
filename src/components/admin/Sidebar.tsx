import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, Globe } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { ADMIN_MODULES } from '../../config/adminModules';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import ThemeToggle from '../common/ThemeToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, userRole, firstName, lastName, logout } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // 768px matches md breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  // Filter items visible to the current user's permissions
  const visibleNavItems = ADMIN_MODULES.filter(item => 
    hasPermission(item.id, 'view')
  );

  const sidebarContent = (
    <div className="w-64 bg-primary dark:bg-slate-950 border-r border-transparent dark:border-white/5 text-white h-screen flex flex-col shadow-xl transition-colors duration-500">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={soloLogoColorido} alt="Logo" className="h-10 w-auto flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold tracking-wide">Panel Admin</h2>
            <div className="mt-1 text-sm text-gray-300">
              <p className="truncate font-semibold text-xs text-white max-w-[120px]" title={firstName && lastName ? `${firstName} ${lastName}` : user?.email || ''}>
                {firstName && lastName ? `${firstName} ${lastName}` : user?.email}
              </p>
              <p className="capitalize text-[9px] mt-0.5 bg-gold text-white font-bold inline-block px-1.5 py-0.5 rounded shadow-sm">
                {userRole || 'Cargando...'}
              </p>
            </div>
          </div>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar-dark">
        <ul className="space-y-1.5">
          {visibleNavItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                end={item.path === '/admin'}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-6 py-3 transition-all duration-200 border-l-4 font-medium text-sm ${
                    isActive 
                      ? 'bg-white/10 dark:bg-slate-900 border-gold text-white font-bold shadow-inner' 
                      : 'hover:bg-white/5 dark:hover:bg-slate-900/50 border-transparent text-gray-300 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-white/10 space-y-2.5">
        <div className="flex justify-between items-center pb-2">
           <span className="text-xs font-semibold text-gray-300">Apariencia</span>
           <ThemeToggle />
        </div>

        <button 
          onClick={() => {
            if (isMobile) onClose();
            window.open('/presentacion.html', '_blank');
          }}
          className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 dark:hover:bg-slate-800 py-2.5 px-4 rounded-xl transition-all duration-200 w-full text-sm font-medium border border-white/5 hover:border-white/10 cursor-pointer"
        >
          <svg className="w-[18px] h-[18px] text-gold fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <polygon points="10 7 15 10 10 13 10 7" className="fill-current" />
          </svg>
          <span>Ver Presentación</span>
        </button>

        <button 
          onClick={() => {
            onClose();
            navigate('/');
          }}
          className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 dark:hover:bg-slate-800 py-2.5 px-4 rounded-xl transition-all duration-200 w-full text-sm font-medium border border-white/5 hover:border-white/10 cursor-pointer"
        >
          <Globe size={18} className="text-gold" />
          <span>Cerrar Panel</span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-300 hover:text-red-400 hover:bg-red-950/20 py-2.5 px-4 rounded-xl transition-all duration-200 w-full text-sm font-medium border border-transparent hover:border-red-900/30 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed top-0 bottom-0 left-0 z-50 h-screen"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed top-0 bottom-0 left-0 z-20 w-64 hidden md:block">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;
