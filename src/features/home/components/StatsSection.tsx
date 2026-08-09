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
}

export const StatsSection = ({ stats }: StatsProps) => {
  return (
    <section aria-label="Nuestra comunidad en cifras" className="relative z-10 px-4 md:px-8">
      <AnimeZoomIn className="mx-auto max-w-7xl">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 md:grid-cols-5">
          <AnimatedCounter value={stats.members} text="Miembros en la Familia" />
          <AnimatedCounter value={stats.baptized} text="Creyentes Bautizados" />
          <AnimatedCounter value={stats.cells} text="Grupos Familiares (Células)" />
          <AnimatedCounter value={stats.kids} text="Niños Formados en Fe" />
          <AnimatedCounter value={stats.youth} text="Jóvenes Comprometidos" />
        </div>
      </AnimeZoomIn>
    </section>
  );
};
