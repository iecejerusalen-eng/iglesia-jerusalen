import { AnimeZoomIn } from '../../../components/animations/AnimeWrappers';
import { AnimatedCounter } from './AnimatedCounter';
import { BarChart3, Sparkles } from 'lucide-react';

interface StatsProps {
  stats: {
    members: number;
    baptized: number;
    cells: number;
    kids: number;
    youth: number;
  };
  isLoading?: boolean;
}

export const StatsSection = ({ stats, isLoading = false }: StatsProps) => {
  const hasPublishedStats = Object.values(stats).some((value) => value > 0);

  return (
    <section aria-label="Nuestra comunidad en cifras" className="relative z-10 px-4 md:px-8">
      <AnimeZoomIn className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_55px_-38px_rgba(15,23,42,.42)] dark:border-white/10 dark:bg-slate-900/85 sm:p-7">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-5" aria-label="Cargando cifras de la comunidad">
              {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/10" />)}
            </div>
          ) : hasPublishedStats ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
              <AnimatedCounter value={stats.members} text="Miembros en la Familia" />
              <AnimatedCounter value={stats.baptized} text="Creyentes Bautizados" />
              <AnimatedCounter value={stats.cells} text="Grupos Familiares (Células)" />
              <AnimatedCounter value={stats.kids} text="Niños Formados en Fe" />
              <AnimatedCounter value={stats.youth} text="Jóvenes Comprometidos" />
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-church-gold-emphasis-soft bg-church-gold-emphasis-soft text-church-gold-emphasis">
                  <BarChart3 size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-church-gold-emphasis">
                    <Sparkles size={12} aria-hidden="true" /> Nuestra comunidad
                  </div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Creciendo juntos en la fe</p>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Las cifras verificadas de nuestra comunidad estarán disponibles próximamente.
                  </p>
                </div>
              </div>
              <span className="ml-16 inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 sm:ml-0">
                En preparación
              </span>
            </div>
          )}
        </div>
      </AnimeZoomIn>
    </section>
  );
};
