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
      rotateX: clamp(-vertical) * 3,
      rotateY: clamp(horizontal) * 3.5,
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
      className="petitions-premium-hero relative isolate scroll-mt-24 overflow-hidden border-b border-slate-200/70 bg-[#faf8f5] text-slate-950 transition-colors duration-700 dark:border-white/10 dark:bg-[#030817] dark:text-white"
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
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -.5rem, 0); }
        }
        @keyframes petitions-hero-pulse {
          0%, 100% { transform: scale(.9); opacity: .4; }
          50% { transform: scale(1.05); opacity: .9; }
        }
        .petitions-hero-reveal { animation: petitions-hero-reveal 800ms cubic-bezier(.16,1,.3,1) both; }
        .petitions-hero-reveal-1 { animation-delay: 90ms; }
        .petitions-hero-reveal-2 { animation-delay: 170ms; }
        .petitions-hero-reveal-3 { animation-delay: 260ms; }
        .petitions-hero-reveal-4 { animation-delay: 360ms; }
        .petitions-hero-drift { animation: petitions-hero-drift 18s ease-in-out infinite; }
        .petitions-hero-drift-reverse { animation: petitions-hero-drift-reverse 23s ease-in-out infinite; }
        .petitions-hero-float { animation: petitions-hero-float 6s ease-in-out infinite; }
        .petitions-hero-pulse { animation: petitions-hero-pulse 3.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .petitions-premium-hero *, .petitions-premium-hero *::before, .petitions-premium-hero *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 1ms !important;
          }
        }
      `}</style>

      {/* Sutiles luces atmosféricas */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="petitions-hero-drift absolute -left-32 -top-24 size-[28rem] rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-600/15" />
        <div className="petitions-hero-drift-reverse absolute -bottom-32 -right-28 size-[30rem] rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-500/10" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:px-10 lg:py-24 xl:px-12">
        {/* Columna Izquierda: Información y Acciones */}
        <div className="relative z-10 max-w-2xl">
          <div className="petitions-hero-reveal inline-flex items-center gap-2.5 rounded-full border border-blue-900/10 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[.18em] text-blue-900 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[.07] dark:text-blue-200">
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 text-white shadow-sm dark:from-blue-500 dark:to-indigo-400">
              <HeartHandshake size={13} strokeWidth={2.2} />
            </span>
            Casa de oración
          </div>

          <h1 id="petitions-hero-title" className="petitions-hero-reveal petitions-hero-reveal-1 mt-6 font-serif text-[clamp(2.75rem,5.5vw,5.5rem)] font-black leading-[0.95] tracking-tight text-slate-950 dark:text-white">
            No oras{' '}
            <span className="text-primary dark:text-church-gold-bright">solo.</span>
          </h1>

          <p className="petitions-hero-reveal petitions-hero-reveal-2 mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            Comparte tu petición con confianza. El equipo pastoral intercede contigo y la iglesia puede acompañarte en oración cuando tú lo decidas.
          </p>

          {/* Acciones Principales */}
          <div className="petitions-hero-reveal petitions-hero-reveal-3 mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => scrollToSelector('#petitions_form')}
                className="group inline-flex min-h-[3.25rem] w-full items-center justify-center gap-3 rounded-xl bg-primary px-7 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:w-auto"
              >
                Escribir petición
                <Send size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            ) : (
              <a
                href="/login"
                className="group inline-flex min-h-[3.25rem] w-full items-center justify-center gap-3 rounded-xl bg-primary px-7 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:w-auto"
              >
                Iniciar sesión
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            )}
            <button
              type="button"
              onClick={() => scrollToSelector('#petitions_wall')}
              className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300/80 bg-white/80 px-6 text-sm font-bold text-slate-800 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-600/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 dark:border-white/15 dark:bg-white/[.06] dark:text-white dark:hover:border-amber-400/30 dark:hover:bg-white/10 sm:w-auto"
            >
              <MessageCircle size={16} className="text-church-gold dark:text-church-gold-bright" />
              Ver muro comunitario
            </button>
          </div>

          {/* Tres Pilares de Confianza */}
          <div className="petitions-hero-reveal petitions-hero-reveal-4 mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6 dark:border-white/10">
            <div>
              <LockKeyhole size={18} className="mb-2 text-primary dark:text-blue-400" />
              <span className="block text-xs font-bold text-slate-900 dark:text-white">Privado por defecto</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tú decides</span>
            </div>
            <div>
              <ShieldCheck size={18} className="mb-2 text-church-gold dark:text-church-gold-bright" />
              <span className="block text-xs font-bold text-slate-900 dark:text-white">Cuidado pastoral</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Acompañamiento</span>
            </div>
            <div>
              <Users size={18} className="mb-2 text-indigo-600 dark:text-indigo-400" />
              <span className="block text-xs font-bold text-slate-900 dark:text-white">Comunidad unida</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Oramos juntos</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Hero Visual Limpia y Elevada */}
        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetStage}
          className="petitions-hero-reveal petitions-hero-reveal-2 relative mx-auto w-full max-w-lg [perspective:1200px]"
          style={heroStyle}
        >
          {/* Tarjeta Principal */}
          <div className="relative transform-gpu transition-transform duration-300 ease-out [transform:rotateX(var(--petition-rotate-x))_rotateY(var(--petition-rotate-y))]">
            
            {/* Resplandor suave detrás de la tarjeta */}
            <div
              aria-hidden="true"
              className="absolute -inset-1.5 rounded-[2.25rem] bg-gradient-to-br from-primary/20 via-church-gold/15 to-indigo-600/20 blur-xl opacity-70 dark:opacity-50"
            />

            {/* Contenedor de la Tarjeta Hero */}
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-[#0a1b3f] via-[#102d68] to-[#1e3a8a] p-6 text-white shadow-2xl shadow-blue-950/30 sm:p-8 dark:border-white/15">
              
              {/* Luces sutiles internas */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-400/20 blur-2xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-amber-400/15 blur-2xl"
              />

              {/* Cabecera de la Tarjeta: Estado de Oración y Confidencialidad */}
              <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[.16em] text-white/90">
                    Muro de oración
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md">
                  <LockKeyhole size={11} className="text-church-gold-bright" />
                  100% Confidencial
                </span>
              </div>

              {/* Contenido Central: Mensaje Inspiracional y Acompañamiento */}
              <div className="relative my-7 rounded-2xl border border-white/15 bg-white/[.08] p-5 shadow-inner backdrop-blur-md sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-church-gold-bright to-church-gold text-slate-950 shadow-md shadow-amber-500/20">
                    <HeartHandshake size={20} strokeWidth={2.4} />
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-emerald-300">
                    En oración
                  </span>
                </div>

                <p className="mt-5 font-serif text-xl font-bold leading-snug text-white sm:text-2xl">
                  “Una petición entregada, una comunidad que acompaña.”
                </p>

                {/* Social Proof: Intercesores */}
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                  <div className="flex -space-x-2">
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-[#102d68] bg-amber-200 text-[10px] font-bold text-amber-900">
                      J
                    </div>
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-[#102d68] bg-blue-200 text-[10px] font-bold text-blue-900">
                      M
                    </div>
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-[#102d68] bg-emerald-200 text-[10px] font-bold text-emerald-900">
                      E
                    </div>
                  </div>
                  <span className="text-xs font-medium text-white/75">
                    Personas orando activamente contigo
                  </span>
                </div>
              </div>

              {/* Pie de Tarjeta: Lema y Compromiso */}
              <div className="relative flex items-center justify-between text-xs font-semibold text-white/70">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-5 rounded-full bg-church-gold-bright" />
                  <span>Confía · Comparte · Persevera</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-church-gold-bright">
                  <Sparkles size={13} />
                  <span>Cuidado Pastoral</span>
                </div>
              </div>
            </div>

            {/* Badge Flotante Sutil y Bien Posicionado */}
            <div
              aria-hidden="true"
              className="petitions-hero-float absolute -bottom-4 -left-3 hidden items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/95 sm:flex"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-church-gold dark:text-church-gold-bright">
                <Sparkles size={14} />
              </span>
              <div>
                <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Unidos en fe
                </span>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Tu voz importa
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
