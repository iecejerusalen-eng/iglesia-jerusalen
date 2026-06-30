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
    <div className="bg-slate-50 dark:bg-slate-950 py-10 transition-colors duration-300 relative z-10">
      <AnimeZoomIn className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
          <AnimatedCounter value={stats.members} text="Miembros en la Familia" />
          <AnimatedCounter value={stats.baptized} text="Creyentes Bautizados" />
          <AnimatedCounter value={stats.cells} text="Grupos Familiares (Células)" />
          <AnimatedCounter value={stats.kids} text="Niños Formados en Fe" />
          <AnimatedCounter value={stats.youth} text="Jóvenes Comprometidos" />
        </div>
      </AnimeZoomIn>
    </div>
  );
};
