import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_MODULES, getAdminModulePermission } from '../../config/adminModules';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  module?: string;
  children?: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, module, children }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useAuthStore();
  const { hasPermission, permissions } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-5 text-primary dark:bg-slate-950"><div className="rounded-3xl border border-white/70 bg-white/75 p-8 text-center shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /><p className="mt-4 text-sm font-bold">Verificando tu acceso…</p><p className="mt-1 text-xs text-slate-500">Estamos preparando las herramientas de tu rol.</p></div></div>;
  }

  if (!user) return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;

  if (module && !hasPermission(module, 'view')) {
    const firstAccessible = ADMIN_MODULES.find((item) => item.available !== false && permissions?.[getAdminModulePermission(item)]?.view);
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 px-5 py-12 dark:from-slate-950 dark:via-[#071126] dark:to-slate-950"><section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-8 text-center shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10"><div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" /><div className="relative"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-600 dark:text-amber-300"><LockKeyhole size={28} /></div><span className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em] text-slate-500"><ShieldCheck size={14} /> Acceso personalizado</span><h1 className="mt-3 font-serif text-3xl font-bold text-slate-950 dark:text-white">Esta herramienta no pertenece a tu rol</h1><p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-300">Tu cuenta está activa, pero no tiene permiso para abrir esta sección. Solicita al administrador que habilite el módulo si forma parte de tus responsabilidades.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{firstAccessible ? <Link to={firstAccessible.path} replace className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Ir a {firstAccessible.name} <ArrowRight size={16} /></Link> : <Link to="/" replace className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Volver al sitio</Link>}<Link to="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 dark:border-white/10 dark:text-slate-200">Ver página pública</Link></div></div></section></main>;
  }

  if (allowedRoles && !module) {
    const roleLower = role?.toLowerCase();
    const isAllowed = allowedRoles.some((allowedRole) => allowedRole.toLowerCase() === roleLower);
    if (!isAllowed) return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
