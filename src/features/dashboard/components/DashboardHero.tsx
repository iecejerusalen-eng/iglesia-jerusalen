import { CalendarDays, Sparkles } from 'lucide-react';
import { AnimeReveal } from '../../../components/animations/AnimeWrappers';
import { BIBLE_VERSES } from '../constants';

interface DashboardHeroProps {
  displayName: string;
  membersCount?: number;
}

export const DashboardHero = ({ displayName, membersCount }: DashboardHeroProps) => {
  const today = new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <AnimeReveal direction="up" delay={30} duration={600}>
      <section
        className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-gradient-to-br from-[#071330]/98 via-[#0f2860]/94 to-[#1a4fd0]/88 p-5 text-white shadow-[0_32px_100px_-36px_rgba(18,58,180,.8),0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:p-7"
        aria-labelledby="dashboard-welcome-title"
      >
        {/* Decorative rings */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 size-[22rem] rounded-full border-[60px] border-white/[0.03]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full bg-gradient-to-br from-blue-400/10 to-transparent blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />

        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.50fr)] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">
              <CalendarDays size={12} /> {today}
            </span>
            <h1 id="dashboard-welcome-title" className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Hola, {displayName}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100/75">
              Un panorama claro de la comunidad, sus capacidades y las tareas que requieren atención.
            </p>
          </div>

          {/* Bible verse card — premium glass */}
          <aside className="rounded-2xl border border-white/[0.12] bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-300">
              <Sparkles size={12} /> Promesa para hoy
            </span>
            <p className="mt-2.5 text-[13px] italic leading-6 text-blue-50/85">
              {BIBLE_VERSES[(membersCount ?? 0) % BIBLE_VERSES.length]}
            </p>
          </aside>
        </div>
      </section>
    </AnimeReveal>
  );
};
