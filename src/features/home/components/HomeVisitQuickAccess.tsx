import { ArrowUpRight, Clock3, MapPin, UserRoundPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CHURCH_LOCATION } from '../../../components/map/churchLocation';
import type { Schedule } from '../../../types';

interface HomeVisitQuickAccessProps {
  schedules: Schedule[];
  loading: boolean;
  error?: unknown;
}

export function HomeVisitQuickAccess({ schedules, loading, error }: HomeVisitQuickAccessProps) {
  const nextSchedule = schedules[0];

  return (
    <section aria-label="Información para visitar la iglesia" className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12">
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:grid-cols-3">
        <a href="#schedules" className="group flex min-h-[92px] items-center gap-3 border-b border-slate-200 p-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700 dark:border-white/10 dark:hover:bg-white/5 sm:border-b-0 sm:border-r">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-300/10 dark:text-amber-200"><Clock3 size={19} aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Horario de reunión</span>
            <span className="mt-1 block truncate text-sm font-bold text-slate-900 dark:text-white">
              {loading ? 'Cargando horarios…' : error ? 'No pudimos cargar los horarios' : nextSchedule ? `${nextSchedule.day} · ${nextSchedule.title} · ${nextSchedule.time_range}` : 'Consulta nuestros horarios'}
            </span>
          </span>
        </a>

        <a href={CHURCH_LOCATION.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-[92px] items-center gap-3 border-b border-slate-200 p-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700 dark:border-white/10 dark:hover:bg-white/5 sm:border-b-0 sm:border-r">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-900 dark:bg-blue-300/10 dark:text-blue-200"><MapPin size={19} aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Estamos en Milagro</span>
            <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-5 text-slate-800 dark:text-slate-100">{CHURCH_LOCATION.address}</span>
          </span>
          <ArrowUpRight size={15} className="ml-auto shrink-0 text-slate-400" aria-hidden="true" />
        </a>

        <Link to="/visita" className="group flex min-h-[92px] items-center gap-3 p-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700 dark:hover:bg-white/5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-300/10 dark:text-emerald-200"><UserRoundPlus size={19} aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">¿Primera vez?</span>
            <span className="mt-1 block text-sm font-bold text-slate-900 dark:text-white">Planifica tu visita</span>
          </span>
          <ArrowUpRight size={15} className="ml-auto shrink-0 text-slate-400" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
