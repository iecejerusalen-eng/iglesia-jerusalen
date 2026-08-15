import { Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { BentoGrid, BentoCard } from '../../../components/ui/magicui/bento-grid';
import { cn } from '../../../lib/utils';
import { MODULE_GROUPS, ADMIN_MODULES, getAdminModulePermission } from '../../../config/adminModules';
import { usePermissions } from '../../../hooks/usePermissions';

export const ModuleGrid = () => {
  const { hasPermission } = usePermissions();

  return (
    <AnimeFadeUp delay={350} duration={850} className="space-y-5 rounded-[1.4rem] border border-gray-150 bg-white p-4 shadow-2xs dark:border-white/10 dark:bg-slate-900 sm:p-6 md:rounded-3xl md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-sans font-bold text-primary dark:text-white flex items-center gap-2">
            <Layers className="text-gold" size={20} />
            Módulos del Sistema
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Explora y accede directamente a todas las herramientas administrativas organizadas por categorías de servicio.
          </p>
        </div>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-gray-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
          {ADMIN_MODULES.filter((module) => module.available !== false && hasPermission(getAdminModulePermission(module), 'view')).length} herramientas disponibles
        </span>
      </div>

      {/* Grid of groups */}
      <BentoGrid className="auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {MODULE_GROUPS.map((group) => {
          const groupModules = ADMIN_MODULES.filter(m => m.available !== false && m.group === group.key && hasPermission(getAdminModulePermission(m), 'view'));
          if (groupModules.length === 0) return null;
          const isLarge = group.key === 'personas' || group.key === 'contenido' || group.key === 'formacion';
          
          return (
            <BentoCard
              key={group.key}
              name={group.label}
              Icon={group.icon}
              description={group.description}
              badge={`${groupModules.length} items`}
              className={cn(
                "h-auto min-h-0 sm:min-h-[22rem]",
                isLarge ? "lg:col-span-2" : "col-span-1"
              )}
            >
              <div className="space-y-1.5 mt-2">
                {groupModules.map((mod) => (
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
                ))}
              </div>
            </BentoCard>
          );
        })}
      </BentoGrid>
    </AnimeFadeUp>
  );
};
