import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADMIN_MODULES, getAdminModulePermission } from '../../../config/adminModules';
import { usePermissions } from '../../../hooks/usePermissions';

const preferredModuleIds = ['members', 'sermons', 'ministries', 'inventory', 'analytics'];

export const QuickLinks = () => {
  const { hasPermission } = usePermissions();
  const links = preferredModuleIds
    .map((id) => ADMIN_MODULES.find((module) => module.id === id))
    .filter((module) => module && module.available !== false && hasPermission(getAdminModulePermission(module), 'view'));

  if (links.length === 0) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-gray-150 bg-white/90 p-5 shadow-2xs backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
      <h3 className="border-b border-gray-100 pb-2 font-serif text-sm font-bold text-gray-800 dark:border-white/10 dark:text-gray-100">
        Accesos para tu rol
      </h3>

      <div className="space-y-2">
        {links.map((module) => module && (
          <Link
            key={module.id}
            to={module.path}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-slate-50 p-3 shadow-3xs transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white hover:shadow-xs dark:border-white/5 dark:bg-slate-800 dark:hover:bg-slate-700/60 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <div className="flex min-w-0 items-center gap-3 text-left">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-white/5 dark:text-gold">
                <module.icon size={16} />
              </span>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-gray-800 transition-colors group-hover:text-primary dark:text-gray-200 dark:group-hover:text-gold">
                  {module.name}
                </span>
                <span className="block text-[9px] font-medium text-gray-400">Abrir herramienta autorizada</span>
              </div>
            </div>
            <ArrowRight size={14} className="shrink-0 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:text-gold motion-reduce:transform-none" />
          </Link>
        ))}
      </div>
    </section>
  );
};
