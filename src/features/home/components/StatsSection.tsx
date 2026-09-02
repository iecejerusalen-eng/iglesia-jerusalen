import { AnimeZoomIn } from '../../../components/animations/AnimeWrappers';
import { AnimatedCounter } from './AnimatedCounter';

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
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-5" aria-label="Cargando cifras de la comunidad">
              {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/10" />)}
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
            <p className="py-5 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Las cifras de nuestra comunidad estarán disponibles próximamente.
            </p>
          )}
        </div>
      </AnimeZoomIn>
    </section>
  );
};
