import { ArrowLeft, LayoutDashboard, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminNotFound = () => (
  <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
    <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
        <Search size={24} aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gold">Página no encontrada</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary dark:text-white">Esta sección no existe</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
        El enlace puede haber cambiado o la herramienta ya no está disponible. Regresa al resumen para continuar.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        <button type="button" onClick={() => window.history.back()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
          <ArrowLeft size={17} /> Volver
        </button>
        <Link to="/admin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm hover:bg-primary/90">
          <LayoutDashboard size={17} /> Ir al resumen
        </Link>
      </div>
    </div>
  </section>
);

export default AdminNotFound;
