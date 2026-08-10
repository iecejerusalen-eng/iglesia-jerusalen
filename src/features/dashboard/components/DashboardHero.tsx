import { CalendarDays, Sparkles } from 'lucide-react';
import { AnimeReveal } from '../../../components/animations/AnimeWrappers';
import { BIBLE_VERSES } from '../constants';

interface DashboardHeroProps {
  displayName: string;
  membersCount: number;
}

export const DashboardHero = ({ displayName, membersCount }: DashboardHeroProps) => {
  const today = new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <AnimeReveal direction="up" delay={30} duration={600}>
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#081735]/95 via-[#102b61]/92 to-[#1d4ed8]/85 p-5 text-white shadow-[0_28px_90px_-42px_rgba(30,64,175,.85)] backdrop-blur-2xl sm:p-7" aria-labelledby="dashboard-welcome-title">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full border-[52px] border-white/[0.035]" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-blue-200/40 to-transparent" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.52fr)] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">
              <CalendarDays size={13} /> {today}
            </span>
            <h1 id="dashboard-welcome-title" className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">Hola, {displayName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
              Un panorama claro de la comunidad, sus capacidades y las tareas que requieren atención.
            </p>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-inner backdrop-blur-xl">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-amber-300">
              <Sparkles size={13} /> Promesa para hoy
            </span>
            <p className="mt-2 text-xs italic leading-5 text-blue-50/90">{BIBLE_VERSES[membersCount % BIBLE_VERSES.length]}</p>
          </aside>
        </div>
      </section>
    </AnimeReveal>
  );
};
