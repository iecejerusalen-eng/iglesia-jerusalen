import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADMIN_MODULES, getAdminModulePermission } from '../../../config/adminModules';
import { usePermissions } from '../../../hooks/usePermissions';

const preferredModuleIds = ['members', 'programs', 'notifications', 'editorial', 'analytics', 'settings'];

// Accent colors per module for colored icon containers
const MODULE_ACCENT: Record<string, string> = {
  members:        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  programs:       'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  notifications:  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  editorial:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  analytics:      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  settings:       'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export const QuickLinks = () => {
  const { hasPermission } = usePermissions();
  const links = preferredModuleIds
    .map((id) => ADMIN_MODULES.find((module) => module.id === id))
    .filter((module) => module && module.available !== false && hasPermission(getAdminModulePermission(module), 'view'));

  if (links.length === 0) return null;

  return (
    <section className="space-y-4 rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,.5)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
      <div className="border-b border-slate-200/60 pb-3 dark:border-white/[0.08]">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Accesos frecuentes</h3>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">Herramientas útiles disponibles para tu rol.</p>
      </div>

      <div className="space-y-2">
        {links.map((module) => module && (
          <Link
            key={module.id}
            to={module.path}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white hover:shadow-md dark:border-white/[0.06] dark:bg-slate-800/50 dark:hover:bg-slate-700/60 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <div className="flex min-w-0 items-center gap-3 text-left">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl border text-sm ${MODULE_ACCENT[module.id] ?? 'bg-primary/10 text-primary border-primary/20 dark:text-gold dark:bg-gold/10 dark:border-gold/20'} transition-transform duration-200 group-hover:scale-105`}>
                <module.icon size={15} />
              </span>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-gray-800 transition-colors group-hover:text-primary dark:text-gray-200 dark:group-hover:text-gold">
                  {module.name}
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                  Abrir herramienta
                </span>
              </div>
            </div>
            <ArrowRight
              size={14}
              className="shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary dark:text-gray-600 dark:group-hover:text-gold motion-reduce:transform-none"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};
