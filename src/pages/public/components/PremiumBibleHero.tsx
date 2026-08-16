import { useRef } from 'react';
import { ArrowRight, BookOpen, Bookmark, LibraryBig, Sparkles } from 'lucide-react';

interface PremiumBibleHeroProps {
  bookName: string;
  chapter: number;
  versionName: string;
}

const scrollToSelector = () => {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  document.getElementById('bible_selector')?.scrollIntoView({ behavior, block: 'center' });
};

export default function PremiumBibleHero({ bookName, chapter, versionName }: PremiumBibleHeroProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pointerTargetRef = useRef({ rotateX: 0, rotateY: 0 });

  const resetStage = () => {
    if (!stageRef.current) return;
    pointerTargetRef.current = { rotateX: 0, rotateY: 0 };
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
    stageRef.current.style.setProperty('--bible-rotate-x', '0deg');
    stageRef.current.style.setProperty('--bible-rotate-y', '0deg');
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || !stageRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = stageRef.current.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));

    pointerTargetRef.current = { rotateX: clamp(-vertical) * 3.5, rotateY: clamp(horizontal) * 4.5 };
    if (pointerFrameRef.current !== null) return;

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      if (stageRef.current) {
        stageRef.current.style.setProperty('--bible-rotate-x', `${pointerTargetRef.current.rotateX}deg`);
        stageRef.current.style.setProperty('--bible-rotate-y', `${pointerTargetRef.current.rotateY}deg`);
      }
      pointerFrameRef.current = null;
    });
  };

  return (
    <section
      id="bible_hero"
      aria-labelledby="bible-hero-title"
      className="bible-premium-hero relative isolate scroll-mt-28 overflow-hidden border-b border-slate-200/70 bg-[#f7f4ed] text-slate-950 transition-colors duration-700 dark:border-white/10 dark:bg-[#030817] dark:text-white"
    >
      <style>{`
        @keyframes bible-hero-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(1.25rem, -1rem, 0) scale(1.05); }
        }
        @keyframes bible-hero-reveal {
          from { opacity: 0; transform: translateY(1rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bible-hero-sheen {
          0%, 30% { transform: translateX(-140%) skewX(-18deg); }
          70%, 100% { transform: translateX(220%) skewX(-18deg); }
        }
        .bible-hero-reveal { animation: bible-hero-reveal 800ms cubic-bezier(.16,1,.3,1) both; }
        .bible-hero-reveal-1 { animation-delay: 80ms; }
        .bible-hero-reveal-2 { animation-delay: 160ms; }
        .bible-hero-reveal-3 { animation-delay: 250ms; }
        .bible-hero-reveal-4 { animation-delay: 340ms; }
        .bible-hero-drift { animation: bible-hero-drift 16s ease-in-out infinite; }
        .bible-hero-sheen { animation: bible-hero-sheen 8s cubic-bezier(.2,.7,.2,1) infinite; }
        .bible-hero-grid {
          background-image: linear-gradient(rgba(30,58,138,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,138,.08) 1px, transparent 1px);
          background-size: 4rem 4rem;
          mask-image: linear-gradient(to bottom, black, transparent 82%);
        }
        .dark .bible-hero-grid {
          background-image: linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .bible-premium-hero *, .bible-premium-hero *::before, .bible-premium-hero *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 1ms !important;
          }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bible-hero-grid absolute inset-0 opacity-70 dark:opacity-50" />
        <div className="bible-hero-drift absolute -left-40 -top-36 h-[28rem] w-[28rem] rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-500/10" />
        <div className="bible-hero-drift absolute -bottom-44 -right-32 h-[34rem] w-[34rem] rounded-full bg-blue-300/25 blur-3xl [animation-delay:-8s] dark:bg-blue-700/20" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/75 to-transparent dark:from-[#071330]/60" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-16 sm:px-8 sm:py-20 lg:grid-cols-[.92fr_1.08fr] lg:gap-10 lg:px-10 lg:py-24 xl:px-12">
        <div className="relative z-10 max-w-2xl">
          <div className="bible-hero-reveal inline-flex items-center gap-3 rounded-full border border-amber-900/10 bg-white/70 px-3 py-2 pr-4 text-[10px] font-black uppercase tracking-[.2em] text-amber-900 shadow-[0_14px_35px_-22px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[.06] dark:text-amber-200">
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-900/20"><Sparkles size={14} strokeWidth={2.4} /></span>
            Biblioteca de fe
          </div>

          <h1 id="bible-hero-title" className="bible-hero-reveal bible-hero-reveal-1 mt-8 max-w-3xl font-serif text-[clamp(3.25rem,7vw,6.8rem)] font-black leading-[.88] tracking-[-.06em] text-slate-950 dark:text-white">
            Lee con
            <span className="mt-2 block bg-gradient-to-r from-amber-700 via-orange-600 to-blue-700 bg-clip-text text-transparent dark:from-amber-200 dark:via-orange-300 dark:to-blue-300">propósito.</span>
          </h1>

          <p className="bible-hero-reveal bible-hero-reveal-2 mt-7 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
            Encuentra una palabra para hoy, estudia cada capítulo y vuelve a los pasajes que están formando tu camino con Dios.
          </p>

          <div className="bible-hero-reveal bible-hero-reveal-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={scrollToSelector} className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-[0_18px_35px_-18px_rgba(15,23,42,.85)] transition duration-300 hover:-translate-y-1 hover:bg-blue-900 hover:shadow-[0_24px_42px_-18px_rgba(30,58,138,.75)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200 sm:w-auto">
              Continuar leyendo <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <a href="#bible_selector" onClick={scrollToSelector} className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/80 bg-white/70 px-6 text-sm font-black text-slate-800 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-700/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 dark:border-white/15 dark:bg-white/[.06] dark:text-white dark:hover:border-amber-300/40 dark:hover:bg-white/10 sm:w-auto">
              Explorar libros <BookOpen size={16} className="text-amber-600 dark:text-amber-300" />
            </a>
          </div>

          <div className="bible-hero-reveal bible-hero-reveal-4 mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-slate-900/10 pt-5 dark:border-white/10">
            <div><span className="block font-serif text-2xl font-black text-slate-950 dark:text-white">66</span><span className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">libros</span></div>
            <div><span className="block font-serif text-2xl font-black text-slate-950 dark:text-white">6</span><span className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">versiones</span></div>
            <div><span className="block font-serif text-2xl font-black text-slate-950 dark:text-white">∞</span><span className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">historias</span></div>
          </div>
        </div>

        <div ref={stageRef} onPointerMove={handlePointerMove} onPointerLeave={resetStage} className="bible-hero-reveal bible-hero-reveal-2 relative mx-auto h-[min(29rem,84vw)] w-full max-w-[43rem] [perspective:1400px] lg:h-[min(37rem,72vw)]" style={{ '--bible-rotate-x': '0deg', '--bible-rotate-y': '0deg' } as React.CSSProperties}>
          <div aria-hidden="true" className="absolute inset-[8%] rounded-[3rem] border border-blue-700/15 bg-blue-500/5 shadow-[0_0_90px_rgba(37,99,235,.18)] dark:border-blue-300/15 dark:bg-blue-300/[.03] dark:shadow-[0_0_100px_rgba(96,165,250,.13)]" />
          <div aria-hidden="true" className="absolute inset-[3%] rounded-[3.5rem] border border-dashed border-amber-600/25 [transform:rotate(7deg)] dark:border-amber-300/20" />

          <article className="relative h-full w-full transform-gpu transition-transform duration-500 ease-out [transform:rotateX(var(--bible-rotate-x))_rotateY(var(--bible-rotate-y))]">
            <div className="absolute -left-1 top-[9%] z-20 hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_25px_60px_-25px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/80 sm:flex">
              <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><Bookmark size={15} /></span>
              <span><span className="block text-[9px] font-black uppercase tracking-[.16em] text-slate-500 dark:text-slate-400">Pasaje actual</span><span className="mt-0.5 block text-sm font-black text-slate-900 dark:text-white">{bookName} {chapter}</span></span>
            </div>

            <div className="group absolute inset-[5%] overflow-hidden rounded-[2.5rem] border border-white/80 bg-slate-950 p-2 shadow-[0_40px_90px_-35px_rgba(15,23,42,.8)] dark:border-white/15 sm:inset-[7%]">
              <div className="relative h-full overflow-hidden rounded-[2rem] bg-slate-950">
                <img src="/products/biblia-estudio.jpg" alt="Biblia de estudio Jerusalén abierta junto a un cuaderno de notas" loading="eager" decoding="async" fetchPriority="high" sizes="(max-width: 1023px) 100vw, 52vw" className="h-full w-full object-cover object-center transition duration-[1400ms] ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-slate-950/10" />
                <div className="bible-hero-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60" />
                <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[9px] font-black uppercase tracking-[.2em] text-white/80 sm:inset-x-7 sm:top-7"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.18)]" />Palabra viva</span><span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-md">{versionName.split(' (')[0]}</span></div>
                <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7"><p className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300">Tu espacio de estudio</p><h2 className="mt-2 max-w-sm font-serif text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">Una palabra que te encuentra.</h2><div className="mt-5 flex items-center gap-3 text-xs font-semibold text-white/75"><span className="h-px w-8 bg-amber-300" />Lee · medita · vive</div></div>
              </div>
            </div>

            <div className="absolute -bottom-1 right-0 z-20 flex max-w-[15rem] items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_25px_60px_-25px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 sm:right-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-700/10 text-blue-800 dark:bg-blue-400/10 dark:text-blue-200"><LibraryBig size={17} /></span>
              <span className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-[.15em] text-blue-700 dark:text-blue-300">Listo para estudiar</span><span className="mt-0.5 block truncate text-xs font-bold text-slate-800 dark:text-white">Busca, guarda y vuelve a encontrar</span></span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
