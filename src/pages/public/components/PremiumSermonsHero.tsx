import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDown, ArrowRight, BookOpen, CalendarDays, Headphones, Play, Radio, Sparkles, UserRound, Waves } from 'lucide-react';
import type { Sermon } from '../../../types';

interface PremiumSermonsHeroProps {
  latestSermon?: Sermon;
  sermonCount: number;
}

const formatDate = (value?: string): string => {
  if (!value) return 'Mensaje disponible ahora';

  return new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function PremiumSermonsHero({ latestSermon, sermonCount }: PremiumSermonsHeroProps) {
  const visualRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const visual = visualRef.current;
    if (!visual || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = visual.getBoundingClientRect();
    pointerRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    };

    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      const { x, y } = pointerRef.current;
      visual.style.setProperty('--sermons-rotate-x', `${y * -3}deg`);
      visual.style.setProperty('--sermons-rotate-y', `${x * 4}deg`);
      frameRef.current = null;
    });
  };

  const handlePointerLeave = () => {
    const visual = visualRef.current;
    if (!visual) return;

    visual.style.setProperty('--sermons-rotate-x', '0deg');
    visual.style.setProperty('--sermons-rotate-y', '0deg');
  };

  const scrollToArchive = () => {
    document.getElementById('sermons_latest')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section
      id="sermons_hero"
      className="relative isolate mb-12 overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-[#edf3ff] shadow-[0_24px_80px_rgba(30,58,138,0.14)] dark:border-white/10 dark:bg-[#071330] dark:shadow-[0_28px_90px_rgba(0,0,0,0.35)] scroll-mt-28"
      aria-labelledby="sermons-hero-title"
    >
      <style>{`
        @keyframes sermons-hero-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(1.5rem, -1rem, 0) scale(1.08); }
        }
        @keyframes sermons-hero-drift-reverse {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-1.25rem, 1rem, 0) scale(.94); }
        }
        @keyframes sermons-hero-reveal {
          from { opacity: 0; transform: translate3d(0, 1rem, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes sermons-hero-wave {
          0%, 100% { transform: scaleY(.45); opacity: .55; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes sermons-hero-sheen {
          from { transform: translateX(-120%); }
          to { transform: translateX(120%); }
        }
        .sermons-hero-reveal { animation: sermons-hero-reveal .8s cubic-bezier(.16,1,.3,1) both; }
        .sermons-hero-drift { animation: sermons-hero-drift 12s ease-in-out infinite; }
        .sermons-hero-drift-reverse { animation: sermons-hero-drift-reverse 15s ease-in-out infinite; }
        .sermons-hero-wave { animation: sermons-hero-wave 1.35s ease-in-out infinite; transform-origin: center; }
        .sermons-hero-sheen { animation: sermons-hero-sheen 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sermons-hero-reveal, .sermons-hero-drift, .sermons-hero-drift-reverse, .sermons-hero-wave, .sermons-hero-sheen { animation: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(30,58,138,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.06)_1px,transparent_1px)] [background-size:42px_42px] dark:opacity-40 dark:[background-image:linear-gradient(rgba(147,197,253,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.07)_1px,transparent_1px)]" aria-hidden="true" />
      <div className="sermons-hero-drift pointer-events-none absolute -left-32 -top-40 size-[28rem] rounded-full bg-blue-400/20 blur-[90px] dark:bg-blue-500/15" aria-hidden="true" />
      <div className="sermons-hero-drift-reverse pointer-events-none absolute -bottom-48 -right-32 size-[30rem] rounded-full bg-amber-300/25 blur-[110px] dark:bg-amber-500/10" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[34%] top-0 hidden h-px w-56 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent lg:block" aria-hidden="true" />

      <div className="relative z-10 grid gap-12 px-6 py-10 sm:px-10 md:px-14 md:py-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-8 lg:px-16 lg:py-16">
        <div className="sermons-hero-reveal max-w-2xl" style={{ animationDelay: '80ms' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white/65 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
            <Radio size={14} className="text-amber-500" aria-hidden="true" />
            Biblioteca de mensajes
          </div>

          <h1 id="sermons-hero-title" className="max-w-xl font-serif text-4xl font-black leading-[.98] tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl dark:text-white">
            Una palabra para cada <span className="text-primary dark:text-blue-300">temporada.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            Escucha, guarda y vuelve a vivir las enseñanzas que nos ayudan a caminar con fe, propósito y esperanza.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={scrollToArchive}
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(30,58,138,0.24)] transition duration-300 hover:-translate-y-1 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
            >
              Explorar prédicas
              <ArrowDown size={17} className="transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
            </button>
            <a
              href={latestSermon ? `/predicas/${latestSermon.id}` : '#sermons_latest'}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300/80 bg-white/60 px-5 text-sm font-extrabold text-slate-800 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-amber-400 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {latestSermon ? 'Escuchar mensaje reciente' : 'Ver archivo completo'}
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-900/10 pt-5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><Headphones size={15} className="text-amber-500" aria-hidden="true" /> Escucha a tu ritmo</span>
            <span className="inline-flex items-center gap-2"><BookOpen size={15} className="text-blue-600 dark:text-blue-300" aria-hidden="true" /> Enseñanza para crecer</span>
          </div>
        </div>

        <div
          ref={visualRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative mx-auto w-full max-w-[34rem] [perspective:1200px]"
          style={{ '--sermons-rotate-x': '0deg', '--sermons-rotate-y': '0deg' } as CSSProperties}
        >
          <div className="absolute -inset-6 rounded-[3rem] border border-blue-500/10 bg-white/20 blur-sm dark:border-blue-300/10 dark:bg-blue-400/5" aria-hidden="true" />
          <div className="relative [transform:rotateX(var(--sermons-rotate-x))_rotateY(var(--sermons-rotate-y))] transition-transform duration-500 ease-out [transform-style:preserve-3d]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-5 shadow-[0_30px_70px_rgba(15,23,42,0.3)] dark:border-white/15 dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:p-7">
              <div className="sermons-hero-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />
              <div className="absolute -right-20 -top-24 size-64 rounded-full bg-blue-500/20 blur-[70px]" aria-hidden="true" />
              <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                <span className="inline-flex items-center gap-2 text-amber-300"><span className="size-2 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,.9)]" /> Mensaje reciente</span>
                <Sparkles size={16} className="text-blue-300" aria-hidden="true" />
              </div>

              <div className="relative z-10 mt-10 flex min-h-52 flex-col justify-end sm:min-h-64">
                <div className="mb-6 flex h-20 items-center justify-center gap-1.5" aria-hidden="true">
                  {Array.from({ length: 29 }, (_, index) => (
                    <span
                      key={index}
                      className="sermons-hero-wave w-1 rounded-full bg-gradient-to-t from-blue-500 via-cyan-300 to-amber-300"
                      style={{ height: `${18 + ((index * 17) % 50)}%`, animationDelay: `${(index % 7) * 90}ms` }}
                    />
                  ))}
                </div>

                <div className="flex items-end justify-between gap-5">
                  <div className="min-w-0">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Prédicas y devocionales</p>
                    <h2 className="line-clamp-2 font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">
                      {latestSermon?.title || 'Mensajes para volver a escuchar'}
                    </h2>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><UserRound size={13} className="text-amber-300" /> {latestSermon?.pastor_name || 'Iglesia Jerusalén'}</span>
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-amber-300" /> {formatDate(latestSermon?.date || latestSermon?.created_at)}</span>
                    </div>
                  </div>
                  <a
                    href={latestSermon ? `/predicas/${latestSermon.id}` : '#sermons_latest'}
                    aria-label={latestSermon ? `Escuchar ${latestSermon.title}` : 'Explorar prédicas'}
                    className="group/play grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-400 text-slate-950 shadow-[0_10px_30px_rgba(251,191,36,0.35)] transition duration-300 hover:scale-105 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/40"
                  >
                    <Play size={23} className="ml-1 fill-current transition-transform group-hover/play:scale-110" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="relative z-10 mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                <span className="inline-flex items-center gap-2"><Waves size={14} className="text-blue-300" /> Fe que se escucha</span>
                <span>{sermonCount} {sermonCount === 1 ? 'mensaje' : 'mensajes'}</span>
              </div>
            </div>

            <div className="absolute -right-5 -top-5 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-200 sm:flex" style={{ transform: 'translateZ(36px)' }}>
              <span className="grid size-8 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><BookOpen size={16} /></span>
              Guarda lo que Dios te habló
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-200 sm:flex" style={{ transform: 'translateZ(28px)' }}>
              <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Headphones size={16} /></span>
              Escucha cuando quieras
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
