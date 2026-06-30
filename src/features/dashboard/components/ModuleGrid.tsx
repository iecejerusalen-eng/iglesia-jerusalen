import { Layers, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import { MODULE_GROUPS, ADMIN_MODULES } from '../../../config/adminModules';
import { usePermissions } from '../../../hooks/usePermissions';

export const ModuleGrid = () => {
  const { hasPermission } = usePermissions();

  return (
    <AnimeFadeUp delay={350} duration={850} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary dark:text-white flex items-center gap-2">
            <Layers className="text-gold" size={20} />
            Módulos del Sistema
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Explora y accede directamente a todas las herramientas administrativas organizadas por categorías de servicio.
          </p>
        </div>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-gray-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
          {ADMIN_MODULES.length} Herramientas
        </span>
      </div>

      {/* Grid of groups */}
      <AnimeStaggerGrid id="modules-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" staggerDelay={60} duration={700}>
        {MODULE_GROUPS.map((group) => {
          const groupModules = ADMIN_MODULES.filter(m => m.group === group.key);
          
          return (
            <div 
              key={group.key} 
              className="bg-slate-50/50 dark:bg-slate-950/20 border border-gray-150 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-gold/30 dark:hover:border-gold/20 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 shadow-3xs flex items-center justify-center text-primary dark:text-white shrink-0 group-hover:text-gold transition-colors duration-300">
                    <group.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100">{group.label}</h3>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{groupModules.length} items</span>
                  </div>
                </div>

                {/* Group Description */}
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {group.description}
                </p>

                {/* Modules List */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/5">
                  {groupModules.map((mod) => {
                    const hasAccess = hasPermission(mod.id, 'view');
                    
                    if (hasAccess) {
                      return (
                        <Link
                          key={mod.path}
                          to={mod.path}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800/60 text-xs text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-gold font-bold transition-all duration-200 shadow-4xs hover:shadow-3xs border border-transparent hover:border-gray-100 dark:hover:border-white/5 group/link"
                          style={{ minHeight: '38px' }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <mod.icon size={14} className="text-gold/80 shrink-0 group-hover/link:scale-110 transition-transform duration-200" />
                            <span className="truncate">{mod.name}</span>
                          </div>
                          <ArrowRight size={12} className="text-gray-300 group-hover/link:text-primary dark:group-hover/link:text-gold group-hover/link:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      );
                    } else {
                      return (
                        <div
                          key={mod.path}
                          className="flex items-center justify-between p-2 rounded-lg text-xs text-gray-400 dark:text-gray-600 font-medium select-none bg-gray-100/30 dark:bg-slate-900/10 cursor-not-allowed border border-transparent backdrop-blur-xs opacity-65"
                          style={{ minHeight: '38px' }}
                          title="No tienes permisos para acceder a esta herramienta"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <mod.icon size={14} className="opacity-40 shrink-0" />
                            <span className="truncate">{mod.name}</span>
                          </div>
                          <Lock size={10} className="text-gray-400 dark:text-gray-600 shrink-0" />
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </AnimeStaggerGrid>
    </AnimeFadeUp>
  );
};
