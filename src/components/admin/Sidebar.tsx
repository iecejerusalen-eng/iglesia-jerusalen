import { useEffect, useState, useMemo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, X, Globe, ChevronRight, Search } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { MODULE_GROUPS, ADMIN_MODULES } from '../../config/adminModules';
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
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const prevPathRef = useRef<string | null>(null);

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
  const visibleNavItems = useMemo(() => {
    return ADMIN_MODULES.filter(item => hasPermission(item.id, 'view'));
  }, [hasPermission]);

  // Group definitions matching keys
  const groupLabelMap = useMemo(() => {
    return MODULE_GROUPS.reduce((acc, g) => {
      acc[g.key] = g.label;
      return acc;
    }, {} as Record<string, string>);
  }, []);

  // Filter items based on search query
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return visibleNavItems;
    const q = searchQuery.toLowerCase();
    return visibleNavItems.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        (groupLabelMap[item.group] || '').toLowerCase().includes(q)
    );
  }, [searchQuery, visibleNavItems, groupLabelMap]);

  // Grouped menu items structure (used when not searching)
  const groupedItems = useMemo(() => {
    return MODULE_GROUPS.map(group => {
      const items = visibleNavItems.filter(item => item.group === group.key);
      return {
        ...group,
        items
      };
    }).filter(group => group.items.length > 0);
  }, [visibleNavItems]);

  // Expanded groups state (persisted in localStorage)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_expanded');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Auto-expand group of active path on mount or path change
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;

    const activeItem = ADMIN_MODULES.find(item => {
      if (item.path === '/admin') {
        return location.pathname === '/admin';
      }
      return location.pathname.startsWith(item.path);
    });

    if (activeItem) {
      setExpandedGroups(prev => {
        if (prev[activeItem.group]) return prev;
        const next = { ...prev, [activeItem.group]: true };
        localStorage.setItem('admin_sidebar_expanded', JSON.stringify(next));
        return next;
      });
    }
  }, [location.pathname]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      localStorage.setItem('admin_sidebar_expanded', JSON.stringify(next));
      return next;
    });
  };

  const sidebarContent = (
    <div className="w-64 bg-primary dark:bg-slate-950 border-r border-transparent dark:border-white/5 text-white h-screen flex flex-col shadow-xl transition-colors duration-500">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <img src={soloLogoColorido} alt="Logo" className="h-10 w-auto flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold tracking-wide">Panel Admin</h2>
            <div className="mt-1 text-sm text-gray-300">
              <p 
                className="truncate font-semibold text-xs text-white max-w-[130px]" 
                title={firstName && lastName ? `${firstName} ${lastName}` : user?.email || ''}
              >
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
            className="p-2 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Modern Search Bar */}
      <div className="px-4 py-3 border-b border-white/5 shrink-0 bg-primary/30 dark:bg-slate-950/40">
        <div className="relative flex items-center bg-white/5 hover:bg-white/10 focus-within:bg-white/10 rounded-xl border border-white/10 focus-within:border-gold/50 px-3 py-2.5 transition-all duration-300">
          <Search size={16} className="text-gray-300 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Buscar herramienta... (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-white placeholder-gray-400 font-semibold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white shrink-0 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar-dark space-y-1 px-3">
        {searchQuery.trim() !== '' ? (
          /* Search Results view: Flat list of matching items */
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-3 mb-2">
              Resultados ({filteredNavItems.length})
            </p>
            {filteredNavItems.length > 0 ? (
              filteredNavItems.map((item) => (
                <NavLink 
                  key={item.path}
                  to={item.path} 
                  end={item.path === '/admin'}
                  onClick={() => {
                    if (isMobile) onClose();
                  }}
                  className={({ isActive }) => 
                    `flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 border-l-2 ${
                      isActive 
                        ? 'bg-white/10 dark:bg-slate-900 border-gold text-white font-bold shadow-inner' 
                        : 'hover:bg-white/5 dark:hover:bg-slate-900/50 border-transparent text-gray-300 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <item.icon size={16} className="shrink-0 text-gold/80" />
                    <span className="text-xs font-semibold">{item.name}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold pl-6 uppercase tracking-wider block">
                    {groupLabelMap[item.group]}
                  </span>
                </NavLink>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-white/5 rounded-xl border border-dashed border-white/10 mx-2">
                Sin coincidencias
              </div>
            )}
          </div>
        ) : (
          /* Standard Grouped Collapsible Accordions view */
          groupedItems.map((group) => {
            const isExpanded = !!expandedGroups[group.key];
            
            // Check if any sub-item in this group is active
            const hasActiveChild = group.items.some(item => {
              if (item.path === '/admin') return location.pathname === '/admin';
              return location.pathname.startsWith(item.path);
            });

            return (
              <div key={group.key} className="space-y-0.5 bg-white/2 dark:bg-slate-950/20 rounded-xl overflow-hidden">
                {/* Group Accordion Header */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 text-left cursor-pointer border ${
                    hasActiveChild 
                      ? 'bg-white/5 border-white/10 dark:border-white/5 text-white font-bold' 
                      : 'hover:bg-white/5 border-transparent text-gray-300 hover:text-white'
                  }`}
                  style={{ minHeight: '44px' }} // mobile friendly tap size
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <group.icon size={18} className={`shrink-0 ${hasActiveChild ? 'text-gold' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold truncate tracking-wide">{group.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] bg-white/10 text-gray-300 font-extrabold px-1.5 py-0.5 rounded-full select-none">
                      {group.items.length}
                    </span>
                    <ChevronRight 
                      size={14} 
                      className={`text-gray-400 shrink-0 transition-transform duration-300 ${
                        isExpanded ? 'rotate-90 text-gold' : 'rotate-0'
                      }`} 
                    />
                  </div>
                </button>

                {/* Collapsible Sub-items Container */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out pl-4 ${
                    isExpanded 
                      ? 'max-h-[500px] opacity-100 py-1 space-y-1' 
                      : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  {group.items.map((item) => (
                    <NavLink 
                      key={item.path}
                      to={item.path} 
                      end={item.path === '/admin'}
                      onClick={() => {
                        if (isMobile) onClose();
                      }}
                      className={({ isActive }) => 
                        `flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 border-l-2 font-medium text-[11px] sm:text-xs group ${
                          isActive 
                            ? 'bg-white/10 dark:bg-slate-900 border-gold text-white font-bold shadow-inner' 
                            : 'hover:bg-white/5 dark:hover:bg-slate-900/50 border-transparent text-gray-300 hover:text-white'
                        }`
                      }
                      style={{ minHeight: '40px' }} // mobile friendly tap size
                    >
                      <item.icon size={15} className="shrink-0 opacity-70 group-hover:opacity-100 group-hover:text-gold transition-colors duration-200" />
                      <span className="group-hover:translate-x-1.5 transition-transform duration-200">{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-5 border-t border-white/10 space-y-2 shrink-0 bg-primary/20 dark:bg-slate-950/20">
        <div className="flex justify-between items-center pb-2 px-1">
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Apariencia</span>
          <ThemeToggle />
        </div>

        <button 
          onClick={() => {
            if (isMobile) onClose();
            window.open('/presentacion.html', '_blank');
          }}
          className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 dark:hover:bg-slate-800 py-3 px-4 rounded-xl transition-all duration-200 w-full text-xs font-semibold border border-white/5 hover:border-white/10 cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <svg className="w-[16px] h-[16px] text-gold fill-none stroke-current shrink-0" strokeWidth="2" viewBox="0 0 24 24">
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
          className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/5 dark:hover:bg-slate-800 py-3 px-4 rounded-xl transition-all duration-200 w-full text-xs font-semibold border border-white/5 hover:border-white/10 cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <Globe size={16} className="text-gold shrink-0" />
          <span>Cerrar Panel</span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-300 hover:text-red-450 hover:bg-red-950/20 py-3 px-4 rounded-xl transition-all duration-200 w-full text-xs font-semibold border border-transparent hover:border-red-900/30 cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <LogOut size={16} className="shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
        <div className="relative z-10 h-screen animate-slide-in-right">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 bottom-0 left-0 z-20 w-64 hidden md:block">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;
