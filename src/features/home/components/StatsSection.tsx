import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, UsersRound, Droplets, House, Sprout, Sunrise } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import './communityStats.css';

interface StatsProps {
  stats: { members: number; baptized: number; cells: number; kids: number; youth: number };
  isLoading?: boolean;
}

const metrics = [
  { key: 'members', label: 'Miembros en la familia', caption: 'Pertenecer', icon: UsersRound },
  { key: 'baptized', label: 'Creyentes bautizados', caption: 'Creer', icon: Droplets },
  { key: 'cells', label: 'Grupos familiares', caption: 'Compartir', icon: House },
  { key: 'kids', label: 'Niños en comunidad', caption: 'Acompañar', icon: Sprout },
  { key: 'youth', label: 'Jóvenes en comunidad', caption: 'Crecer', icon: Sunrise },
] as const;

export const StatsSection = ({ stats, isLoading = false }: StatsProps) => {
  const panel = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const hasPublishedStats = Object.values(stats).some(value => value > 0);
  const followLight = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse' || !panel.current) return;
    const bounds = panel.current.getBoundingClientRect();
    panel.current.style.setProperty('--community-x', (event.clientX - bounds.left) + 'px');
    panel.current.style.setProperty('--community-y', (event.clientY - bounds.top) + 'px');
  };

  return (
    <section aria-labelledby="community-stats-heading" className="community-stats">
      <div ref={panel} className="community-stats__panel" onPointerMove={followLight}>
        <div className="community-stats__light" aria-hidden="true" />
        <header className="community-stats__header">
          <div className="community-stats__intro">
            <p className="community-stats__eyebrow"><span aria-hidden="true" /> Una familia en la fe</p>
            <h2 id="community-stats-heading">Cada vida <em>cuenta.</em></h2>
            <p className="community-stats__description">Personas que creen, comparten y caminan juntas.</p>
          </div>
          <div className="community-stats__invitation">
            <span className="community-stats__seal" aria-hidden="true"><Heart size={21} strokeWidth={1.35} /></span>
            <p>Y en esta historia,<br /><strong>también hay un lugar para ti.</strong></p>
            <Link to="/visita" className="community-stats__link">Ven a conocernos <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="community-stats__orbits" aria-hidden="true"><i /><i /><i /></div>
        </header>

        {isLoading ? <div className="community-stats__loading" role="status" aria-label="Cargando cifras de la comunidad">
          {metrics.map(metric => <div key={metric.key} className="community-stats__skeleton"><span /><span /></div>)}
        </div> : hasPublishedStats ? <dl className="community-stats__metrics" aria-label="Nuestra comunidad en cifras">
          {metrics.map((metric, index) => <AnimatedCounter key={metric.key} value={stats[metric.key]} text={metric.label} caption={metric.caption} icon={metric.icon} index={index} />)}
        </dl> : <div className="community-stats__empty" role="status">
          <Heart size={22} aria-hidden="true" /><div><p>Una comunidad que se construye cada día</p><span>Las cifras de nuestra comunidad estarán disponibles próximamente.</span></div>
        </div>}
        <footer className="community-stats__footer"><span aria-hidden="true" />Más que números, vidas que nos unen.</footer>
      </div>
    </section>
  );
};
