import { useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Church, Compass, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import fachadaImage from '../../../assets/Jerusalén/Fachada Iglesia Jerusalén.jpg';
import BlockRenderer from '../../../components/public/BlockRenderer';
import MagneticButton from '../../../components/animations/MagneticButton';
import type { PageSection } from '../types';

interface PremiumHeroVisualProps {
  title?: PageSection['title'];
  subtitle?: PageSection['subtitle'];
  contentBlocks?: PageSection['content_blocks'];
  coverImage?: PageSection['cover_image_url'];
}

const DEFAULT_DESCRIPTION = 'Un lugar para encontrarte con Dios, crecer en comunidad y servir con propósito.';

export const PremiumHeroVisual = ({ title, subtitle, contentBlocks, coverImage }: PremiumHeroVisualProps) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const requestedImage = coverImage || fachadaImage;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageSource = failedImage === requestedImage ? fachadaImage : requestedImage;

  const resetStage = () => {
    if (!stageRef.current) return;
    stageRef.current.style.setProperty('--hero-rotate-x', '0deg');
    stageRef.current.style.setProperty('--hero-rotate-y', '0deg');
  };

  const handleStagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || !stageRef.current) return;

    const bounds = stageRef.current.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    stageRef.current.style.setProperty('--hero-rotate-x', `${Math.max(-1, Math.min(1, -vertical)) * 4}deg`);
    stageRef.current.style.setProperty('--hero-rotate-y', `${Math.max(-1, Math.min(1, horizontal)) * 5}deg`);
  };

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="hero-premium relative isolate overflow-hidden bg-slate-50 text-slate-950 transition-colors duration-700 dark:bg-[#030817] dark:text-white"
    >
      <style>{`
        @keyframes hero-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(1.5rem, -1rem, 0) scale(1.04); }
        }
        @keyframes hero-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-2deg); }
          50% { transform: translate3d(0, -0.8rem, 0) rotate(1deg); }
        }
        @keyframes hero-sheen {
          0% { transform: translateX(-120%); }
          45%, 100% { transform: translateX(120%); }
        }
        @keyframes hero-reveal {
          from { opacity: 0; transform: translateY(1.25rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-reveal { animation: hero-reveal 900ms cubic-bezier(.16,1,.3,1) both; }
        .hero-reveal-delay-1 { animation-delay: 100ms; }
        .hero-reveal-delay-2 { animation-delay: 180ms; }
        .hero-reveal-delay-3 { animation-delay: 280ms; }
        .hero-reveal-delay-4 { animation-delay: 380ms; }
        .hero-drift { animation: hero-drift 14s ease-in-out infinite; }
        .hero-float { animation: hero-float 8s ease-in-out infinite; }
        .hero-sheen { animation: hero-sheen 7s cubic-bezier(.2,.7,.2,1) infinite; }
        .hero-grid {
          background-image: linear-gradient(rgba(30,58,138,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,138,.08) 1px, transparent 1px);
          background-size: 4rem 4rem;
          mask-image: linear-gradient(to bottom, black, transparent 78%);
        }
        .dark .hero-grid {
          background-image: linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-premium *, .hero-premium *::before, .hero-premium *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 1ms !important;
          }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-grid absolute inset-0 opacity-70 dark:opacity-50" />
        <div className="hero-drift absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-700/20" />
        <div className="hero-drift absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-amber-300/25 blur-3xl [animation-delay:-7s] dark:bg-amber-500/10" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/80 to-transparent dark:from-[#071330]/60" />
      </div>

      <div className="relative mx-auto grid min-h-[min(860px,calc(100svh-4rem))] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-8 lg:px-10 lg:py-24 xl:px-12">
        <div className="relative z-10 max-w-2xl lg:order-none">
          <div className="hero-reveal mt-8 lg:mt-12 inline-flex items-center gap-3 rounded-full border border-blue-900/10 bg-white/70 px-3 py-2 pr-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900 shadow-[0_14px_35px_-22px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-blue-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-indigo-500 text-white shadow-lg shadow-blue-900/20 dark:from-blue-500 dark:to-indigo-400">
              <Church size={14} strokeWidth={2.4} />
            </span>
            {subtitle || 'Una casa de restauración y bendición'}
          </div>

          <h1 id="hero-title" className="hero-reveal hero-reveal-delay-1 mt-8 max-w-3xl font-serif text-[clamp(2.75rem,7vw,6.2rem)] font-black leading-[.9] tracking-[-.055em] text-slate-950 dark:text-white">
            {title && title.trim() && title.trim() !== 'Bienvenido a la Iglesia Jerusalén' ? (
              title
            ) : (
              <>
                Aquí la fe
                <span className="mt-2 block bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-200 dark:via-indigo-200 dark:to-blue-400">
                  encuentra hogar.
                </span>
              </>
            )}
          </h1>

          <div className="hero-reveal hero-reveal-delay-2 mt-8 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
            {contentBlocks && contentBlocks.length > 0 ? (
              <BlockRenderer blocks={contentBlocks} />
            ) : (
              <p>{DEFAULT_DESCRIPTION} Ven como eres; caminemos juntos hacia lo que Dios está haciendo.</p>
            )}
          </div>

          <div className="hero-reveal hero-reveal-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <MagneticButton>
              <Link
                to="/nosotros"
                className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-800 px-6 text-sm font-black text-white shadow-[0_18px_35px_-18px_rgba(30,58,138,.9)] transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_24px_42px_-18px_rgba(30,58,138,.9)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400 sm:w-auto"
              >
                Conócenos
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </MagneticButton>
            <a
              href="#home_schedules"
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/80 bg-white/70 px-6 text-sm font-black text-slate-800 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-700/30 hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:border-blue-300/40 dark:hover:bg-white/10 sm:w-auto"
            >
              Ver horarios
              <ArrowDown size={16} className="text-amber-600 dark:text-amber-300" />
            </a>
          </div>

          <div className="hero-reveal hero-reveal-delay-4 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" />Puertas abiertas para ti</span>
            <span className="inline-flex items-center gap-2"><Compass size={15} className="text-amber-600 dark:text-amber-300" />Milagro, Ecuador</span>
          </div>
        </div>

        <div
          ref={stageRef}
          className="hero-reveal hero-reveal-delay-2 relative order-first mx-auto h-[min(25rem,80vw)] w-full max-w-[40rem] [perspective:1400px] lg:order-none lg:h-[min(35rem,92vw)]"
          onPointerMove={handleStagePointerMove}
          onPointerLeave={resetStage}
          style={{ '--hero-rotate-x': '0deg', '--hero-rotate-y': '0deg' } as React.CSSProperties}
        >
          <div aria-hidden="true" className="hero-float absolute left-[8%] top-[10%] h-20 w-20 rounded-[1.75rem] border border-white/70 bg-white/50 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.08] sm:h-28 sm:w-28">
            <div className="absolute inset-2 rounded-[1.3rem] border border-blue-700/10 dark:border-white/10" />
            <div className="flex h-full flex-col items-center justify-center gap-1 text-blue-800 dark:text-blue-200"><Sparkles size={20} /><span className="text-[9px] font-black uppercase tracking-[.2em]">Fe</span></div>
          </div>

          <div aria-hidden="true" className="hero-float absolute bottom-[12%] right-[0%] z-20 hidden rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-[0_25px_60px_-25px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/80 sm:block sm:right-[2%]" style={{ animationDelay: '-3s' }}>
            <span className="block text-[9px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Comunidad</span>
            <span className="mt-1 block text-sm font-black text-slate-900 dark:text-white">Una familia que crece</span>
          </div>

          <div
            className="relative h-full w-full transform-gpu transition-transform duration-500 ease-out [transform:rotateX(var(--hero-rotate-x))_rotateY(var(--hero-rotate-y))]"
          >
            <div aria-hidden="true" className="absolute inset-[8%] rounded-[3rem] border border-blue-700/15 bg-blue-500/5 shadow-[0_0_90px_rgba(37,99,235,.18)] dark:border-blue-300/15 dark:bg-blue-300/[0.03] dark:shadow-[0_0_100px_rgba(96,165,250,.13)]" />
            <div aria-hidden="true" className="absolute inset-[3%] rounded-[3.5rem] border border-dashed border-amber-600/20 [transform:rotate(8deg)] dark:border-amber-300/20" />

            <article className="group absolute inset-[9%] overflow-hidden rounded-[2.4rem] border border-white/80 bg-slate-900 p-2 shadow-[0_40px_90px_-35px_rgba(15,23,42,.75)] dark:border-white/15 sm:inset-[11%]">
              <div className="relative h-full overflow-hidden rounded-[1.9rem] bg-slate-950">
                <img
                  src={imageSource}
                  alt="Fachada de la Iglesia Jerusalén"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onError={() => setFailedImage(requestedImage)}
                  className="h-full w-full object-cover object-center transition duration-[1400ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-slate-950/10" />
                <div className="hero-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60" />
                <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[9px] font-black uppercase tracking-[.2em] text-white/80 sm:inset-x-7 sm:top-7">
                  <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.18)]" />Iglesia viva</span>
                  <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-md">Casa de fe</span>
                </div>
                <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
                  <p className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300">Iglesia Jerusalén</p>
                  <h2 className="mt-2 max-w-xs font-serif text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">Una casa para volver a creer.</h2>
                  <div className="mt-5 flex items-center gap-3 text-xs font-semibold text-white/75"><span className="h-px w-8 bg-amber-300" />Fe · Familia · Servicio</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <a href="#home_schedules" aria-label="Bajar a los horarios de servicio" className="hero-reveal hero-reveal-delay-4 absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 text-[10px] font-black uppercase tracking-[.22em] text-slate-500 transition hover:text-blue-800 dark:text-slate-400 dark:hover:text-blue-200 md:flex">
        <span className="h-8 w-px bg-gradient-to-b from-transparent via-current to-transparent" />
        Descubre nuestra semana
        <span className="h-8 w-px bg-gradient-to-b from-transparent via-current to-transparent" />
      </a>
    </section>
  );
};
