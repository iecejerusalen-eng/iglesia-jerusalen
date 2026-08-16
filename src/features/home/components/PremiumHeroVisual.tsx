import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowDown, ArrowRight, Church, Compass, MapPin, Sparkles } from 'lucide-react';
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

interface HeroRootStyle extends CSSProperties {
  '--hero-scroll-progress': string;
}

interface HeroStageStyle extends CSSProperties {
  '--hero-rotate-x': string;
  '--hero-rotate-y': string;
}

const DEFAULT_DESCRIPTION = 'Un lugar para encontrarte con Dios, crecer en comunidad y servir con propósito.';
const HERO_TITLE = 'Jerusalén, Posesión de Paz';

export const PremiumHeroVisual = ({ subtitle, contentBlocks, coverImage }: PremiumHeroVisualProps) => {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const requestedImage = coverImage || fachadaImage;
  const imageSource = failedImage === requestedImage ? fachadaImage : requestedImage;

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let frame: number | null = null;

    const updateScrollProgress = () => {
      frame = null;
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      hero.style.setProperty('--hero-scroll-progress', progress.toFixed(3));
    };

    const handleScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const resetStage = () => {
    if (!stageRef.current) return;
    stageRef.current.style.setProperty('--hero-rotate-x', '0deg');
    stageRef.current.style.setProperty('--hero-rotate-y', '0deg');
  };

  const handleStagePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || !stageRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = stageRef.current.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    stageRef.current.style.setProperty('--hero-rotate-x', `${Math.max(-1, Math.min(1, -vertical)) * 3.5}deg`);
    stageRef.current.style.setProperty('--hero-rotate-y', `${Math.max(-1, Math.min(1, horizontal)) * 4.5}deg`);
  };

  const heroStyle: HeroRootStyle = {
    '--hero-scroll-progress': '0',
  };

  const stageStyle: HeroStageStyle = {
    '--hero-rotate-x': '0deg',
    '--hero-rotate-y': '0deg',
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      aria-labelledby="hero-title"
      className="hero-premium relative isolate overflow-hidden bg-[#f8fafc] text-slate-950 transition-colors duration-700 dark:bg-[#020817] dark:text-white"
      style={heroStyle}
    >
      <style>{`
        @keyframes hero-reveal {
          from { opacity: 0; transform: translateY(1.25rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-orbit {
          0%, 100% { transform: rotate(0deg) translateX(0); opacity: .55; }
          50% { transform: rotate(7deg) translateX(.35rem); opacity: .9; }
        }
        @keyframes hero-breathe {
          0%, 100% { transform: scale(1); opacity: .7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes hero-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-2deg); }
          50% { transform: translate3d(0, -.55rem, 0) rotate(1deg); }
        }
        @keyframes hero-sheen {
          0%, 30% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
          50% { opacity: .55; }
          75%, 100% { transform: translateX(240%) skewX(-18deg); opacity: 0; }
        }
        .hero-reveal { animation: hero-reveal 850ms cubic-bezier(.16,1,.3,1) both; }
        .hero-reveal-delay-1 { animation-delay: 110ms; }
        .hero-reveal-delay-2 { animation-delay: 210ms; }
        .hero-reveal-delay-3 { animation-delay: 320ms; }
        .hero-reveal-delay-4 { animation-delay: 430ms; }
        .hero-orbit { animation: hero-orbit 12s ease-in-out infinite; transform-origin: center; }
        .hero-breathe { animation: hero-breathe 8s ease-in-out infinite; }
        .hero-float { animation: hero-float 8s ease-in-out infinite; }
        .hero-sheen { animation: hero-sheen 8s cubic-bezier(.2,.7,.2,1) infinite; }
        .hero-grid {
          background-image: linear-gradient(rgba(30,58,138,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,138,.065) 1px, transparent 1px);
          background-size: 4.5rem 4.5rem;
          mask-image: linear-gradient(to bottom, black, transparent 82%);
        }
        .dark .hero-grid {
          background-image: linear-gradient(rgba(147,197,253,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(147,197,253,.07) 1px, transparent 1px);
        }
        .hero-stage-transform {
          transform: translate3d(0, calc(var(--hero-scroll-progress) * -0.5rem), 0) rotateX(var(--hero-rotate-x)) rotateY(var(--hero-rotate-y));
        }
        .hero-photo {
          transform: translate3d(0, calc(var(--hero-scroll-progress) * -0.8rem), 0) scale(calc(1.02 + (var(--hero-scroll-progress) * .025)));
        }
        .hero-copy-shift {
          transform: translate3d(0, calc(var(--hero-scroll-progress) * -0.35rem), 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-premium *, .hero-premium *::before, .hero-premium *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 1ms !important;
          }
          .hero-stage-transform, .hero-photo, .hero-copy-shift { transform: none !important; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-grid absolute inset-0 opacity-80 dark:opacity-60" />
        <div className="hero-breathe absolute -left-40 -top-44 size-[34rem] rounded-full bg-blue-300/20 blur-[110px] dark:bg-blue-700/20" />
        <div className="hero-breathe absolute -bottom-48 -right-40 size-[36rem] rounded-full bg-amber-300/20 blur-[120px] [animation-delay:-4s] dark:bg-amber-500/10" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/75 to-transparent dark:from-blue-950/40" />
      </div>

      <div className="relative mx-auto grid min-h-[min(860px,calc(100svh-4rem))] max-w-7xl items-center gap-10 px-5 pb-24 pt-32 sm:px-8 lg:grid-cols-[.93fr_1.07fr] lg:gap-6 lg:px-10 lg:py-32 xl:px-12">
        <div className="hero-copy-shift relative z-10 max-w-2xl transition-transform duration-700 lg:pr-6">
          <div className="hero-reveal inline-flex items-center gap-3 rounded-full border border-blue-900/10 bg-white/75 px-3 py-2 pr-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900 shadow-[0_18px_45px_-26px_rgba(15,23,42,.6)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07] dark:text-blue-100">
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-indigo-500 text-white shadow-lg shadow-blue-900/20 dark:from-blue-400 dark:to-indigo-400 dark:text-slate-950">
              <Church size={14} strokeWidth={2.4} />
            </span>
            {subtitle || 'Una casa de restauración y bendición'}
          </div>

          <h1 id="hero-title" aria-label={HERO_TITLE} className="hero-reveal hero-reveal-delay-1 mt-8 max-w-3xl font-serif text-[clamp(3.25rem,7.5vw,7rem)] font-black leading-[.86] tracking-[-.065em] text-slate-950 dark:text-white">
            <span className="block">Jerusalén,</span>
            <span className="mt-3 block bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-200 dark:via-indigo-200 dark:to-blue-400">
              Posesión de Paz
            </span>
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
                className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-800 px-6 text-sm font-black text-white shadow-[0_20px_40px_-18px_rgba(30,64,175,.9)] transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_26px_50px_-20px_rgba(30,64,175,.95)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:bg-blue-400 dark:text-slate-950 dark:hover:bg-blue-300 sm:w-auto"
              >
                Conócenos
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </MagneticButton>
            <a
              href="#home_schedules"
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/80 bg-white/70 px-6 text-sm font-black text-slate-800 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-700/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:border-blue-300/40 dark:hover:bg-white/10 sm:w-auto"
            >
              Ver horarios
              <ArrowDown size={16} className="text-amber-600 dark:text-amber-300" />
            </a>
          </div>

          <div className="hero-reveal hero-reveal-delay-4 mt-10 hidden flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-slate-500 dark:text-slate-400 sm:flex">
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" />Puertas abiertas para ti</span>
            <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-amber-600 dark:text-amber-300" />Milagro, Ecuador</span>
          </div>
        </div>

        <div
          ref={stageRef}
          className="hero-reveal hero-reveal-delay-2 relative order-none mx-auto h-[min(29rem,83vw)] w-full max-w-[43rem] [perspective:1500px] lg:h-[min(39rem,75vw)]"
          onPointerMove={handleStagePointerMove}
          onPointerLeave={resetStage}
          style={stageStyle}
        >
          <div aria-hidden="true" className="hero-orbit absolute inset-[4%] rounded-[3.5rem] border border-blue-700/15 dark:border-blue-200/15" />
          <div aria-hidden="true" className="absolute inset-[10%] rounded-[3rem] bg-blue-500/10 shadow-[0_0_110px_rgba(37,99,235,.2)] dark:bg-blue-300/[0.04] dark:shadow-[0_0_120px_rgba(96,165,250,.18)]" />

          <div className="hero-stage-transform relative h-full w-full transition-transform duration-500 ease-out">
            <div aria-hidden="true" className="hero-float absolute left-[3%] top-[11%] z-20 hidden size-24 rounded-[1.6rem] border border-white/80 bg-white/70 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/70 sm:block">
              <div className="flex h-full flex-col items-center justify-center gap-2 text-blue-800 dark:text-blue-100">
                <Sparkles size={19} />
                <span className="text-[9px] font-black uppercase tracking-[.2em]">Fe viva</span>
              </div>
            </div>

            <article className="group absolute inset-[7%] overflow-hidden rounded-[2.5rem] border border-white/90 bg-slate-950 p-2 shadow-[0_45px_100px_-35px_rgba(15,23,42,.8)] dark:border-white/15 sm:inset-[9%]">
              <div className="relative h-full overflow-hidden rounded-[2rem] bg-slate-950">
                <img
                  src={imageSource}
                  alt="Fachada de la Iglesia del Evangelio Cuadrangular Jerusalén"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onError={() => setFailedImage(requestedImage)}
                  className="hero-photo h-full w-full object-cover object-center transition duration-[1600ms] ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/15 to-[#020617]/5" />
                <div className="hero-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60" />

                <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[9px] font-black uppercase tracking-[.2em] text-white/85 sm:inset-x-7 sm:top-7">
                  <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.18)]" />Iglesia viva</span>
                  <span className="rounded-full border border-white/25 bg-black/20 px-3 py-1.5 backdrop-blur-md">Casa de fe</span>
                </div>

                <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
                  <p className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300">Iglesia Jerusalén</p>
                  <h2 className="mt-2 max-w-sm font-serif text-[clamp(2rem,4vw,3.6rem)] font-black leading-[.92] tracking-[-.04em] text-white">Una casa para volver a creer.</h2>
                  <div className="mt-5 flex items-center gap-3 text-xs font-semibold text-white/80"><span className="h-px w-8 bg-amber-300" />Fe · Familia · Servicio</div>
                </div>
              </div>
            </article>

            <div className="absolute bottom-[3%] right-0 z-20 max-w-[15rem] rounded-2xl border border-white/85 bg-white/90 px-4 py-3 shadow-[0_25px_60px_-25px_rgba(15,23,42,.6)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 sm:right-[1%] sm:max-w-[17rem] sm:px-5 sm:py-4">
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300"><Compass size={13} /> Comunidad</span>
              <span className="mt-1 block text-sm font-black text-slate-900 dark:text-white sm:text-base">Una familia que crece contigo</span>
            </div>
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
