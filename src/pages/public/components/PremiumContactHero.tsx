import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDown, ArrowRight, Compass, MapPin, MessageCircle, Navigation, Phone, Sparkles } from 'lucide-react';
import pastorsImage from '../../../assets/Jerusalén/Pastores.jpg';

interface PremiumContactHeroProps {
  phoneLink: string;
  facadeImage: string;
}

export default function PremiumContactHero({ phoneLink, facadeImage }: PremiumContactHeroProps) {
  const [imageSrc, setImageSrc] = useState(facadeImage);
  const visualRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const visual = visualRef.current;
    if (event.pointerType === 'touch' || !visual || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = visual.getBoundingClientRect();
    pointerRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    };

    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      const { x, y } = pointerRef.current;
      visual.style.setProperty('--contact-rotate-x', `${y * -3}deg`);
      visual.style.setProperty('--contact-rotate-y', `${x * 4}deg`);
      frameRef.current = null;
    });
  };

  const handlePointerLeave = () => {
    const visual = visualRef.current;
    if (!visual) return;

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    visual.style.setProperty('--contact-rotate-x', '0deg');
    visual.style.setProperty('--contact-rotate-y', '0deg');
  };

  const scrollToForm = () => {
    document.getElementById('contact_form')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section
      id="contact_hero"
      className="relative isolate overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-[#eef4ff] shadow-[0_24px_80px_rgba(30,58,138,0.14)] dark:border-white/10 dark:bg-[#071330] dark:shadow-[0_30px_90px_rgba(0,0,0,0.36)] scroll-mt-28"
      aria-labelledby="contact-hero-title"
    >
      <style>{`
        @keyframes contact-hero-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(1.5rem, -1rem, 0) scale(1.08); }
        }
        @keyframes contact-hero-drift-reverse {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-1.25rem, 1rem, 0) scale(.94); }
        }
        @keyframes contact-hero-reveal {
          from { opacity: 0; transform: translate3d(0, 1rem, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes contact-hero-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,.22); }
          50% { box-shadow: 0 0 0 9px rgba(16,185,129,0); }
        }
        @keyframes contact-hero-sheen {
          from { transform: translateX(-120%); }
          to { transform: translateX(120%); }
        }
        .contact-hero-reveal { animation: contact-hero-reveal .8s cubic-bezier(.16,1,.3,1) both; }
        .contact-hero-drift { animation: contact-hero-drift 12s ease-in-out infinite; }
        .contact-hero-drift-reverse { animation: contact-hero-drift-reverse 15s ease-in-out infinite; }
        .contact-hero-pulse { animation: contact-hero-pulse 2.4s ease-in-out infinite; }
        .contact-hero-sheen { animation: contact-hero-sheen 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .contact-hero-reveal, .contact-hero-drift, .contact-hero-drift-reverse, .contact-hero-pulse, .contact-hero-sheen { animation: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(30,58,138,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.06)_1px,transparent_1px)] [background-size:42px_42px] dark:opacity-40 dark:[background-image:linear-gradient(rgba(147,197,253,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.07)_1px,transparent_1px)]" aria-hidden="true" />
      <div className="contact-hero-drift pointer-events-none absolute -left-40 -top-48 size-[30rem] rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-500/15" aria-hidden="true" />
      <div className="contact-hero-drift-reverse pointer-events-none absolute -bottom-56 -right-36 size-[32rem] rounded-full bg-amber-300/25 blur-[120px] dark:bg-amber-500/10" aria-hidden="true" />

      <div className="relative z-10 grid gap-12 px-6 py-10 sm:px-10 md:px-14 md:py-14 lg:grid-cols-[1fr_.92fr] lg:items-center lg:gap-10 lg:px-16 lg:py-16">
        <div className="contact-hero-reveal max-w-2xl" style={{ animationDelay: '80ms' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white/65 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
            <MessageCircle size={14} className="text-emerald-500" aria-hidden="true" />
            Un puente hacia nuestra comunidad
          </div>

          <h1 id="contact-hero-title" className="max-w-xl font-serif text-4xl font-black leading-[.98] tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl dark:text-white">
            Hablemos de lo que <span className="text-primary dark:text-blue-300">importa.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            Una pregunta, una oración o el deseo de servir pueden ser el comienzo de una conversación significativa. Estamos cerca para acompañarte.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={`https://wa.me/${phoneLink.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(5,150,105,0.24)] transition duration-300 hover:-translate-y-1 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30"
            >
              <MessageCircle size={17} aria-hidden="true" />
              Escríbenos por WhatsApp
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={scrollToForm}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300/80 bg-white/60 px-5 text-sm font-extrabold text-slate-800 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-amber-400 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Enviar un mensaje
              <ArrowDown size={17} className="transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-900/10 pt-5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-amber-500" aria-hidden="true" /> Milagro, Ecuador</span>
            <span className="inline-flex items-center gap-2"><Phone size={15} className="text-blue-600 dark:text-blue-300" aria-hidden="true" /> WhatsApp y correo disponibles</span>
          </div>
        </div>

        <div
          ref={visualRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative mx-auto w-full max-w-[34rem] [perspective:1200px]"
          style={{ '--contact-rotate-x': '0deg', '--contact-rotate-y': '0deg' } as CSSProperties}
        >
          <div className="absolute -inset-6 rounded-[3rem] border border-blue-500/10 bg-white/20 blur-sm dark:border-blue-300/10 dark:bg-blue-400/5" aria-hidden="true" />
          <div className="relative [transform:rotateX(var(--contact-rotate-x))_rotateY(var(--contact-rotate-y))] transition-transform duration-500 ease-out [transform-style:preserve-3d]">
            <div className="relative aspect-[4/4.7] overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 shadow-[0_30px_75px_rgba(15,23,42,0.3)] dark:border-white/15 dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:aspect-[4/4.2]">
              <img src={imageSrc} alt="Fachada de la Iglesia Jerusalén en Milagro" loading="eager" fetchPriority="high" decoding="async" onError={() => setImageSrc(pastorsImage)} className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-1000 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/5" aria-hidden="true" />
              <div className="contact-hero-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden="true" />

              <div className="absolute left-5 right-5 top-5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.22em] text-white/80 sm:left-7 sm:right-7 sm:top-7">
                <span className="inline-flex items-center gap-2"><span className="contact-hero-pulse size-2 rounded-full bg-emerald-400" /> Iglesia viva</span>
                <span className="rounded-full border border-white/20 bg-slate-950/30 px-3 py-1.5 backdrop-blur-md">Casa de fe</span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Iglesia Jerusalén</span>
                <h2 className="mt-2 max-w-sm font-serif text-3xl font-black leading-[.98] text-white sm:text-4xl">Una casa para volver a creer.</h2>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-white/75">
                  <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-amber-300" /> Milagro, Guayas</span>
                  <span className="inline-flex items-center gap-1.5"><Navigation size={14} className="text-amber-300" /> Ven a conocernos</span>
                </div>
              </div>
            </div>

            <div className="absolute -right-5 -top-5 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-200 sm:flex" style={{ transform: 'translateZ(36px)' }}>
              <span className="grid size-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><MessageCircle size={16} aria-hidden="true" /></span>
              Una conversación puede comenzar hoy
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-200 sm:flex" style={{ transform: 'translateZ(28px)' }}>
              <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Compass size={16} aria-hidden="true" /></span>
              Encuentra tu lugar
            </div>
          </div>

          <div className="absolute -bottom-8 right-8 hidden size-16 place-items-center rounded-full border border-white/80 bg-white/80 text-amber-500 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-slate-900/80 sm:grid" aria-hidden="true">
            <Sparkles size={22} />
          </div>
        </div>
      </div>
    </section>
  );
}
