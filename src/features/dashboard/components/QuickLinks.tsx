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
    <section className="space-y-4 rounded-[1.6rem] border border-white/70 bg-white/70 p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65">
      <div className="border-b border-slate-200/70 pb-3 dark:border-white/10">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Accesos frecuentes</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Herramientas útiles disponibles para tu rol.</p>
      </div>

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
