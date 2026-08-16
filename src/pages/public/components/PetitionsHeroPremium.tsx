import { useRef, type CSSProperties, type PointerEvent } from 'react';
import {
  ArrowRight,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

interface PetitionsHeroPremiumProps {
  isAuthenticated?: boolean;
}

interface PetitionHeroStyle extends CSSProperties {
  '--petition-rotate-x': string;
  '--petition-rotate-y': string;
}

const scrollToSelector = (selector: string) => {
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return;

  target.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
};

export default function PetitionsHeroPremium({ isAuthenticated = true }: PetitionsHeroPremiumProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pointerTargetRef = useRef({ rotateX: 0, rotateY: 0 });

  const resetStage = () => {
    pointerTargetRef.current = { rotateX: 0, rotateY: 0 };
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
    stageRef.current?.style.setProperty('--petition-rotate-x', '0deg');
    stageRef.current?.style.setProperty('--petition-rotate-y', '0deg');
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === 'touch' ||
      !stageRef.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const bounds = stageRef.current.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));

    pointerTargetRef.current = {
      rotateX: clamp(-vertical) * 3.5,
      rotateY: clamp(horizontal) * 4.5,
    };

    if (pointerFrameRef.current !== null) return;
    pointerFrameRef.current = window.requestAnimationFrame(() => {
      stageRef.current?.style.setProperty('--petition-rotate-x', `${pointerTargetRef.current.rotateX}deg`);
      stageRef.current?.style.setProperty('--petition-rotate-y', `${pointerTargetRef.current.rotateY}deg`);
      pointerFrameRef.current = null;
    });
  };

  const heroStyle: PetitionHeroStyle = {
    '--petition-rotate-x': '0deg',
    '--petition-rotate-y': '0deg',
  };

  return (
    <section
      id="petitions_hero"
      aria-labelledby="petitions-hero-title"
      className="petitions-premium-hero relative isolate scroll-mt-24 overflow-hidden border-b border-slate-200/70 bg-[#f7f4ed] text-slate-950 transition-colors duration-700 dark:border-white/10 dark:bg-[#030817] dark:text-white"
    >
      <style>{`
        @keyframes petitions-hero-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(1.2rem, -1rem, 0) scale(1.06); }
        }
        @keyframes petitions-hero-drift-reverse {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.04); }
          50% { transform: translate3d(-1rem, 1rem, 0) scale(.94); }
        }
        @keyframes petitions-hero-reveal {
          from { opacity: 0; transform: translateY(1rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes petitions-hero-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-2deg); }
          50% { transform: translate3d(0, -.75rem, 0) rotate(1deg); }
        }
        @keyframes petitions-hero-pulse {
          0%, 100% { transform: scale(.86); opacity: .35; }
          50% { transform: scale(1); opacity: .9; }
        }
        @keyframes petitions-hero-sheen {
          0%, 30% { transform: translateX(-140%) skewX(-18deg); }
          70%, 100% { transform: translateX(220%) skewX(-18deg); }
        }
        .petitions-hero-reveal { animation: petitions-hero-reveal 800ms cubic-bezier(.16,1,.3,1) both; }
        .petitions-hero-reveal-1 { animation-delay: 90ms; }
        .petitions-hero-reveal-2 { animation-delay: 170ms; }
        .petitions-hero-reveal-3 { animation-delay: 260ms; }
        .petitions-hero-reveal-4 { animation-delay: 360ms; }
        .petitions-hero-drift { animation: petitions-hero-drift 18s ease-in-out infinite; }
        .petitions-hero-drift-reverse { animation: petitions-hero-drift-reverse 23s ease-in-out infinite; }
        .petitions-hero-float { animation: petitions-hero-float 7s ease-in-out infinite; }
        .petitions-hero-pulse { animation: petitions-hero-pulse 4.5s ease-in-out infinite; }
        .petitions-hero-sheen { animation: petitions-hero-sheen 8s cubic-bezier(.2,.7,.2,1) infinite; }
        .petitions-hero-grid {
          background-image: linear-gradient(rgba(30,58,138,.075) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,138,.075) 1px, transparent 1px);
          background-size: 4rem 4rem;
          mask-image: linear-gradient(to bottom, black, transparent 84%);
        }
        .dark .petitions-hero-grid {
          background-image: linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .petitions-premium-hero *, .petitions-premium-hero *::before, .petitions-premium-hero *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 1ms !important;
          }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="petitions-hero-grid absolute inset-0 opacity-70 dark:opacity-50" />
        <div className="petitions-hero-drift absolute -left-44 -top-36 size-[30rem] rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-700/18" />
        <div className="petitions-hero-drift-reverse absolute -bottom-44 -right-40 size-[34rem] rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-500/12" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/75 to-transparent dark:from-[#071330]/60" />
        <div className="absolute left-[7%] top-[62%] size-2 rounded-full bg-blue-500/60 shadow-[0_0_0_8px_rgba(59,130,246,.1)] dark:bg-blue-300/70" />
        <div className="petitions-hero-pulse absolute right-[12%] top-[30%] size-3 rounded-full border border-amber-500/40 bg-amber-400/80 shadow-[0_0_0_8px_rgba(245,158,11,.08)] dark:border-amber-300/40" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-8 lg:px-10 lg:py-24 xl:px-12">
        <div className="relative z-10 max-w-2xl">
          <div className="petitions-hero-reveal inline-flex items-center gap-3 rounded-full border border-blue-900/10 bg-white/70 px-3 py-2 pr-4 text-[10px] font-black uppercase tracking-[.2em] text-blue-900 shadow-[0_14px_35px_-22px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[.06] dark:text-blue-200">
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-indigo-500 text-white shadow-lg shadow-blue-900/20 dark:from-blue-500 dark:to-indigo-400">
              <HeartHandshake size={14} strokeWidth={2.4} />
            </span>
            Casa de oración
          </div>

          <h1 id="petitions-hero-title" className="petitions-hero-reveal petitions-hero-reveal-1 mt-8 max-w-3xl font-serif text-[clamp(3.25rem,7vw,6.8rem)] font-black leading-[.88] tracking-[-.06em] text-slate-950 dark:text-white">
            No oras
            <span className="mt-2 block bg-gradient-to-r from-blue-800 via-indigo-700 to-amber-600 bg-clip-text text-transparent dark:from-blue-200 dark:via-indigo-200 dark:to-amber-300">solo.</span>
          </h1>

          <p className="petitions-hero-reveal petitions-hero-reveal-2 mt-7 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
            Comparte tu petición con confianza. El equipo pastoral intercede contigo y la iglesia puede acompañarte cuando tú lo permites.
          </p>

          <div className="petitions-hero-reveal petitions-hero-reveal-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {isAuthenticated ? (
              <button type="button" onClick={() => scrollToSelector('#petitions_form')} className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-800 px-6 text-sm font-black text-white shadow-[0_18px_35px_-18px_rgba(30,58,138,.9)] transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_24px_42px_-18px_rgba(30,58,138,.9)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400 sm:w-auto">
                Escribir petición <Send size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            ) : (
              <a href="/login" className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-800 px-6 text-sm font-black text-white shadow-[0_18px_35px_-18px_rgba(30,58,138,.9)] transition duration-300 hover:-translate-y-1 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400 sm:w-auto">
                Iniciar sesión <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            )}
            <button type="button" onClick={() => scrollToSelector('#petitions_wall')} className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/80 bg-white/70 px-6 text-sm font-black text-slate-800 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-700/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30 dark:border-white/15 dark:bg-white/[.06] dark:text-white dark:hover:border-amber-300/40 dark:hover:bg-white/10 sm:w-auto">
              Ver muro comunitario <MessageCircle size={16} className="text-amber-600 dark:text-amber-300" />
            </button>
          </div>

          <div className="petitions-hero-reveal petitions-hero-reveal-4 mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-slate-900/10 pt-5 dark:border-white/10">
            <div><LockKeyhole size={16} className="mb-2 text-blue-700 dark:text-blue-300" /><span className="block text-xs font-black text-slate-900 dark:text-white">Privado por defecto</span><span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Tú decides</span></div>
            <div><ShieldCheck size={16} className="mb-2 text-amber-700 dark:text-amber-300" /><span className="block text-xs font-black text-slate-900 dark:text-white">Cuidado pastoral</span><span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Acompañamiento</span></div>
            <div><Users size={16} className="mb-2 text-indigo-700 dark:text-indigo-300" /><span className="block text-xs font-black text-slate-900 dark:text-white">Comunidad unida</span><span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Oramos juntos</span></div>
          </div>
        </div>

        <div ref={stageRef} onPointerMove={handlePointerMove} onPointerLeave={resetStage} className="petitions-hero-reveal petitions-hero-reveal-2 relative mx-auto h-[min(29rem,84vw)] w-full max-w-[43rem] [perspective:1400px] lg:h-[min(37rem,72vw)]" style={heroStyle}>
          <div aria-hidden="true" className="absolute inset-[8%] rounded-[3rem] border border-blue-700/15 bg-blue-500/5 shadow-[0_0_90px_rgba(37,99,235,.18)] dark:border-blue-300/15 dark:bg-blue-300/[.03] dark:shadow-[0_0_100px_rgba(96,165,250,.13)]" />
          <div aria-hidden="true" className="absolute inset-[3%] rounded-[3.5rem] border border-dashed border-amber-600/25 [transform:rotate(7deg)] dark:border-amber-300/20" />
          <div aria-hidden="true" className="absolute inset-[17%] rounded-full border border-blue-700/15 [transform:rotateX(64deg)] dark:border-blue-300/15" />

          <article aria-label="Composición visual del muro de oración" className="relative h-full w-full transform-gpu transition-transform duration-500 ease-out [transform:rotateX(var(--petition-rotate-x))_rotateY(var(--petition-rotate-y))]">
            <div aria-hidden="true" className="petitions-hero-float absolute left-[1%] top-[10%] z-20 hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_25px_60px_-25px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 sm:flex">
              <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><Sparkles size={15} /></span>
              <span><span className="block text-[9px] font-black uppercase tracking-[.16em] text-slate-500 dark:text-slate-400">Unidos en fe</span><span className="mt-0.5 block text-sm font-black text-slate-900 dark:text-white">Tu voz importa</span></span>
            </div>

            <div className="absolute inset-[7%] overflow-hidden rounded-[2.5rem] border border-white/80 bg-slate-950 p-2 shadow-[0_40px_90px_-35px_rgba(15,23,42,.8)] dark:border-white/15 sm:inset-[9%]">
              <div className="relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#081735] via-[#102b61] to-[#1d4ed8] p-5 text-white sm:p-7">
                <div aria-hidden="true" className="absolute -right-20 -top-20 size-64 rounded-full border border-white/10 bg-blue-300/10 blur-2xl" />
                <div aria-hidden="true" className="absolute -bottom-28 -left-20 size-72 rounded-full bg-amber-300/10 blur-3xl" />
                <div className="relative flex items-center justify-between text-[9px] font-black uppercase tracking-[.2em] text-white/75"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.18)]" />Muro de oración</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">Con propósito</span></div>

                <div className="relative mx-auto mt-8 max-w-[19rem] rounded-[1.75rem] border border-white/20 bg-white/[.1] p-5 shadow-2xl backdrop-blur-xl sm:mt-12 sm:p-6">
                  <div className="flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/20"><HeartHandshake size={23} /></span><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-emerald-200">En oración</span></div>
                  <p className="mt-6 font-serif text-2xl font-black leading-tight sm:text-3xl">Una petición entregada, una comunidad que acompaña.</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4 text-xs font-semibold text-white/65"><span className="flex -space-x-2"><span className="size-6 rounded-full border-2 border-[#173b7a] bg-amber-200" /><span className="size-6 rounded-full border-2 border-[#173b7a] bg-blue-200" /><span className="size-6 rounded-full border-2 border-[#173b7a] bg-rose-200" /></span>Personas orando contigo</div>
                </div>

                <div className="absolute inset-x-5 bottom-5 flex items-center gap-3 text-xs font-semibold text-white/70 sm:inset-x-7 sm:bottom-7"><span className="h-px w-8 bg-amber-300" />Confía · comparte · persevera</div>
                <div className="petitions-hero-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
              </div>
            </div>

            <div aria-hidden="true" className="petitions-hero-float absolute -bottom-1 right-0 z-20 flex max-w-[15rem] items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_25px_60px_-25px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 sm:right-3" style={{ animationDelay: '-3s' }}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-700/10 text-blue-800 dark:bg-blue-400/10 dark:text-blue-200"><LockKeyhole size={17} /></span>
              <span className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-[.15em] text-blue-700 dark:text-blue-300">Privacidad primero</span><span className="mt-0.5 block truncate text-xs font-bold text-slate-800 dark:text-white">Tu historia está cuidada</span></span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
