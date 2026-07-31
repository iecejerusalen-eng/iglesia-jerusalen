import { Layers, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { BentoGrid, BentoCard } from '../../../components/ui/magicui/bento-grid';
import { cn } from '../../../lib/utils';
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
      <BentoGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
        {MODULE_GROUPS.map((group) => {
          const groupModules = ADMIN_MODULES.filter(m => m.group === group.key);
          const isLarge = group.key === 'comunidad' || group.key === 'educacion' || group.key === 'admin';
          
          return (
            <BentoCard
              key={group.key}
              name={group.label}
              Icon={group.icon}
              description={group.description}
              badge={`${groupModules.length} items`}
              className={cn(
                "h-auto min-h-[22rem]", 
                isLarge ? "lg:col-span-2" : "col-span-1"
              )}
            >
              <div className="space-y-1.5 mt-2">
                {groupModules.map((mod) => {
                  const hasAccess = hasPermission(mod.id, 'view');
                  
                  if (hasAccess) {
                    return (
                      <Link
                        key={mod.path}
                        to={mod.path}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all duration-200 shadow-4xs hover:shadow-3xs border border-transparent hover:border-indigo-100 dark:hover:border-white/5 group/link"
                        style={{ minHeight: '38px' }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <mod.icon size={14} className="text-indigo-500/80 dark:text-indigo-400/80 shrink-0 group-hover/link:scale-110 transition-transform duration-200" />
                          <span className="truncate">{mod.name}</span>
                        </div>
                        <ArrowRight size={12} className="text-slate-300 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 group-hover/link:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    );
                  } else {
                    return (
                      <div
                        key={mod.path}
                        className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-400 dark:text-slate-600 font-medium select-none bg-slate-100/30 dark:bg-slate-900/10 cursor-not-allowed border border-transparent backdrop-blur-xs opacity-65"
                        style={{ minHeight: '38px' }}
                        title="No tienes permisos para acceder a esta herramienta"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <mod.icon size={14} className="opacity-40 shrink-0" />
                          <span className="truncate">{mod.name}</span>
                        </div>
                        <Lock size={10} className="text-slate-400 dark:text-slate-600 shrink-0" />
                      </div>
                    );
                  }
                })}
              </div>
            </BentoCard>
          );
        })}
      </BentoGrid>
    </AnimeFadeUp>
  );
};
