import React, { useEffect, useState, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { X, ChevronRight } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { MODULE_GROUPS, ADMIN_MODULES } from '../../config/adminModules';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
}

const Sidebar = ({ isOpen, onClose, searchQuery = '' }: SidebarProps) => {
  const { user, userRole, firstName, lastName } = useAuthStore();
  const { sidebarViewMode, sidebarAccordionMode, sidebarMenuMode, sidebarDefaultClosed, sidebarGridColumns, sidebarGridSort, sidebarCustomOrder } = useThemeStore();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // 768px matches md breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



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

  // Sorted items for Grid mode
  const gridItems = useMemo(() => {
    if (sidebarMenuMode !== 'grid') return [];
    const items = [...visibleNavItems];
    
    if (sidebarGridSort === 'name') {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sidebarGridSort === 'category') {
      return items.sort((a, b) => {
        const groupComparison = a.group.localeCompare(b.group);
        if (groupComparison !== 0) return groupComparison;
        return a.name.localeCompare(b.name);
      });
    } else if (sidebarGridSort === 'custom' && sidebarCustomOrder && sidebarCustomOrder.length > 0) {
      return items.sort((a, b) => {
        const indexA = sidebarCustomOrder.indexOf(a.id);
        const indexB = sidebarCustomOrder.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    
    return items;
  }, [visibleNavItems, sidebarMenuMode, sidebarGridSort, sidebarCustomOrder]);

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
        
        // Si sidebarDefaultClosed está activo y es el montaje inicial (prev está vacío), NO expandimos
        if (sidebarDefaultClosed && Object.keys(prev).length === 0) {
          return prev;
        }

        let next = { ...prev };
        
        // Si es acordeón único, cerramos los demás
        if (sidebarAccordionMode === 'single') {
          next = { [activeItem.group]: true };
        } else {
          next[activeItem.group] = true;
        }
        
        localStorage.setItem('admin_sidebar_expanded', JSON.stringify(next));
        return next;
      });
    }
  }, [location.pathname, sidebarAccordionMode, sidebarDefaultClosed]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      let next;
      if (sidebarAccordionMode === 'single') {
        // Si ya está abierto, lo cerramos; si está cerrado, lo abrimos y cerramos los demás.
        next = prev[groupKey] ? {} : { [groupKey]: true };
      } else {
        next = { ...prev, [groupKey]: !prev[groupKey] };
      }
      localStorage.setItem('admin_sidebar_expanded', JSON.stringify(next));
      return next;
    });
  };

  const isCollapsed = !isMobile && sidebarViewMode === 'compact';
  const isFloating = !isMobile && sidebarViewMode === 'floating';
  const isDrawer = !isMobile && sidebarViewMode === 'drawer';
  
  const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-64';

  const sidebarContent = (
    <div className={`${sidebarWidthClass} bg-primary dark:bg-slate-950 border-r border-transparent dark:border-white/5 text-white ${isFloating ? 'h-[calc(100vh-2rem)] rounded-3xl m-4' : 'h-screen'} flex flex-col shadow-xl transition-all duration-500`}>
      {/* Sidebar Header */}
      <div className={`p-5 border-b border-white/10 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center shrink-0 transition-all duration-500`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img loading="lazy" src={soloLogoColorido} alt="Logo" className="h-10 w-auto flex-shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
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
          )}
        </div>
        {!isCollapsed && isMobile && (
          <button 
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
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
        ) : isCollapsed ? (
          /* Collapsed View Mode (Icons Only) */
          <div className="space-y-4 pb-4 animate-fade-in pt-2">
            {groupedItems.map(group => (
              <div key={group.key} className="space-y-2">
                <div className="flex justify-center border-b border-white/5 pb-2">
                   <span className="text-[10px] text-gray-500" title={group.label}>
                     <group.icon size={16} />
                   </span>
                </div>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      title={item.name}
                      onClick={() => { if (isMobile) onClose(); }}
                      className={({ isActive }) => 
                        `flex justify-center p-3 rounded-xl mx-2 transition-all duration-200 border-l-2 ${
                          isActive 
                            ? 'bg-white/10 dark:bg-slate-900 border-gold text-white font-bold shadow-inner' 
                            : 'hover:bg-white/5 border-transparent text-gray-300 hover:text-white'
                        }`
                      }
                    >
                      <item.icon size={20} className={location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'text-gold' : 'text-gray-400'} />
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : sidebarMenuMode === 'cards_ungrouped' ? (
          /* Ungrouped Cards View */
          <div className="space-y-2">
            {filteredNavItems.map((item) => (
              <NavLink 
                key={item.path}
                to={item.path} 
                end={item.path === '/admin'}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border border-transparent ${
                    isActive 
                      ? 'bg-white/10 dark:bg-slate-900 border-gold/30 text-white font-bold shadow-inner' 
                      : 'bg-white/5 dark:bg-slate-900/30 hover:bg-white/10 dark:hover:bg-slate-900/60 hover:border-gold/20 text-gray-300 hover:text-white'
                  }`
                }
              >
                <div className={`p-1.5 rounded-lg ${location.pathname === item.path ? 'bg-gold text-white' : 'bg-transparent text-gold'}`}>
                  <item.icon size={18} className="shrink-0" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold">{item.name}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block truncate">
                    {groupLabelMap[item.group]}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        ) : sidebarMenuMode === 'grid' ? (
          /* Grid View */
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${sidebarGridColumns || 3}, minmax(0, 1fr))` }}
          >
            {gridItems.map((item) => (
              <NavLink 
                key={item.path}
                to={item.path} 
                end={item.path === '/admin'}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                className={({ isActive }) => 
                  `flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-200 border border-transparent text-center aspect-square ${
                    isActive 
                      ? 'bg-white/10 dark:bg-slate-900 border-gold/30 text-white font-bold shadow-inner' 
                      : 'bg-white/5 dark:bg-slate-900/30 hover:bg-white/10 dark:hover:bg-slate-900/60 hover:border-gold/20 text-gray-300 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} className={`shrink-0 ${location.pathname === item.path ? 'text-gold' : 'text-gray-400'}`} />
                <span className="text-[10px] font-semibold leading-tight line-clamp-2">{item.name}</span>
              </NavLink>
            ))}
          </div>
        ) : (
          /* Standard Grouped Collapsible Accordions or Grouped Cards view */
          groupedItems.map((group) => {
            const isExpanded = sidebarAccordionMode === 'all_open' || !!expandedGroups[group.key];
            
            // Check if any sub-item in this group is active
            const hasActiveChild = group.items.some(item => {
              if (item.path === '/admin') return location.pathname === '/admin';
              return location.pathname.startsWith(item.path);
            });

            return (
              <div key={group.key} className={`space-y-0.5 overflow-hidden ${sidebarMenuMode === 'cards_grouped' ? 'mb-4 bg-white/5 p-2' : 'bg-white/2 dark:bg-slate-950/20'} rounded-xl`}>
                {/* Group Accordion Header */}
                <button
                  onClick={() => sidebarAccordionMode !== 'all_open' && toggleGroup(group.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 text-left ${sidebarAccordionMode !== 'all_open' ? 'cursor-pointer' : 'cursor-default'} border ${
                    hasActiveChild 
                      ? 'bg-white/5 border-white/10 dark:border-white/5 text-white font-bold' 
                      : sidebarAccordionMode !== 'all_open' ? 'hover:bg-white/5 border-transparent text-gray-300 hover:text-white' : 'border-transparent text-gray-300'
                  }`}
                  style={{ minHeight: '44px' }} // mobile friendly tap size
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <group.icon size={18} className={`shrink-0 ${hasActiveChild ? 'text-gold' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold truncate tracking-wide">{group.label}</span>
                  </div>
                  {sidebarAccordionMode !== 'all_open' && (
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
                  )}
                </button>

                {/* Collapsible Sub-items Container */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out pl-4 ${
                    isExpanded 
                      ? 'max-h-[800px] opacity-100 py-1 space-y-1' 
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
                        sidebarMenuMode === 'cards_grouped'
                        ? `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-[11px] sm:text-xs group ${
                            isActive 
                              ? 'bg-white/10 dark:bg-slate-900 text-white font-bold shadow-sm' 
                              : 'bg-white/5 dark:bg-slate-900/30 hover:bg-white/10 text-gray-300 hover:text-white mt-1'
                          }`
                        : `flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 border-l-2 font-medium text-[11px] sm:text-xs group ${
                            isActive 
                              ? 'bg-white/10 dark:bg-slate-900 border-gold text-white font-bold shadow-inner' 
                              : 'hover:bg-white/5 dark:hover:bg-slate-900/50 border-transparent text-gray-300 hover:text-white'
                          }`
                      }
                      style={{ minHeight: '40px' }} // mobile friendly tap size
                    >
                      <item.icon size={15} className={`shrink-0 transition-colors duration-200 ${sidebarMenuMode === 'cards_grouped' ? 'text-gold opacity-100' : 'opacity-70 group-hover:opacity-100 group-hover:text-gold'}`} />
                      <span className={`${sidebarMenuMode === 'cards_grouped' ? '' : 'group-hover:translate-x-1.5 transition-transform duration-200'}`}>{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </nav>
    </div>
  );

  if (isMobile || isDrawer) {
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
    <div className={`fixed top-0 bottom-0 left-0 z-20 ${isFloating ? 'w-auto' : sidebarWidthClass} hidden md:block transition-all duration-500`}>
      {sidebarContent}
    </div>
  );
};

export default React.memo(Sidebar);
