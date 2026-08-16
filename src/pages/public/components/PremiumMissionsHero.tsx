import { ArrowDown, ArrowRight, Database, Globe2, HandHeart, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import type { COBEOptions } from 'cobe';
import { Link } from 'react-router-dom';
import { Globe } from '../../../components/ui/globe';

interface PremiumMissionsHeroProps {
  globeConfig: COBEOptions;
  missionCount: number;
  activeMissionCount: number;
  countryCount: number;
  markerCount: number;
  loading: boolean;
}

export default function PremiumMissionsHero({
  globeConfig,
  missionCount,
  activeMissionCount,
  countryCount,
  markerCount,
  loading,
}: PremiumMissionsHeroProps) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollToFields = () => {
    document.getElementById('missions_fields')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section
      id="missions_hero"
      className="relative isolate overflow-hidden rounded-[2.7rem] border border-slate-200/80 bg-[#eef4ff] shadow-[0_28px_90px_rgba(30,58,138,0.16)] dark:border-white/10 dark:bg-[#071330] dark:shadow-[0_30px_90px_rgba(0,0,0,0.4)] scroll-mt-28"
      aria-labelledby="missions-hero-title"
    >
      <style>{`
        @keyframes missions-hero-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(1.5rem, -1rem, 0) scale(1.08); }
        }
        @keyframes missions-hero-drift-reverse {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-1.25rem, 1rem, 0) scale(.94); }
        }
        @keyframes missions-hero-reveal {
          from { opacity: 0; transform: translate3d(0, 1rem, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes missions-hero-sheen {
          from { transform: translateX(-120%); }
          to { transform: translateX(120%); }
        }
        @keyframes missions-hero-signal {
          0%, 100% { opacity: .35; transform: scale(.9); }
          50% { opacity: 1; transform: scale(1); }
        }
        .missions-hero-drift { animation: missions-hero-drift 13s ease-in-out infinite; }
        .missions-hero-drift-reverse { animation: missions-hero-drift-reverse 16s ease-in-out infinite; }
        .missions-hero-reveal { animation: missions-hero-reveal .8s cubic-bezier(.16,1,.3,1) both; }
        .missions-hero-sheen { animation: missions-hero-sheen 7s ease-in-out infinite; }
        .missions-hero-signal { animation: missions-hero-signal 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .missions-hero-drift, .missions-hero-drift-reverse, .missions-hero-reveal, .missions-hero-sheen, .missions-hero-signal { animation: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(30,58,138,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.06)_1px,transparent_1px)] [background-size:42px_42px] dark:opacity-35 dark:[background-image:linear-gradient(rgba(147,197,253,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.07)_1px,transparent_1px)]" aria-hidden="true" />
      <div className="missions-hero-drift pointer-events-none absolute -left-40 -top-48 size-[30rem] rounded-full bg-blue-400/20 blur-[110px] dark:bg-blue-500/15" aria-hidden="true" />
      <div className="missions-hero-drift-reverse pointer-events-none absolute -bottom-56 -right-36 size-[32rem] rounded-full bg-amber-300/25 blur-[120px] dark:bg-amber-500/10" aria-hidden="true" />

      <div className="relative z-10 grid gap-10 px-6 py-10 sm:px-10 md:px-14 md:py-14 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-8 lg:px-16 lg:py-16">
        <div className="missions-hero-reveal max-w-2xl" style={{ animationDelay: '80ms' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white/65 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
            <Sparkles size={14} className="text-amber-500" aria-hidden="true" />
            De Milagro a las naciones
          </div>

          <h1 id="missions-hero-title" className="max-w-xl font-serif text-4xl font-black leading-[.98] tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl dark:text-white">
            Una iglesia que <span className="text-primary dark:text-blue-300">ora, sirve y envía.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            Conoce proyectos verificables, descubre contextos y encuentra una forma responsable de participar en la misión de Dios.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/misiones/pueblos"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(30,58,138,0.24)] transition duration-300 hover:-translate-y-1 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
            >
              Explorar pueblos
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              to="/donations"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300/80 bg-white/60 px-5 text-sm font-extrabold text-slate-800 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-amber-400 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <HandHeart size={17} className="text-amber-500" aria-hidden="true" />
              Apoyar misiones
            </Link>
          </div>

          <button
            type="button"
            onClick={scrollToFields}
            className="group mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-xs font-extrabold text-slate-500 transition hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 dark:text-slate-400 dark:hover:text-blue-300"
          >
            Ver el centro misionero
            <ArrowDown size={15} className="transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
          </button>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-900/10 pt-5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-amber-500" aria-hidden="true" /> Servicio local y global</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" /> Datos con contexto</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[38rem]" role="img" aria-label="Globo interactivo con marcadores de proyectos misioneros publicados">
          <div className="absolute -inset-6 rounded-[3rem] border border-blue-500/10 bg-white/20 blur-sm dark:border-blue-300/10 dark:bg-blue-400/5" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2.4rem] border border-slate-200/80 bg-[#07152d] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.3)] dark:border-white/15 dark:shadow-[0_30px_85px_rgba(0,0,0,0.55)] sm:p-6">
            <div className="missions-hero-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />
            <div className="absolute -right-20 -top-24 size-64 rounded-full bg-blue-500/20 blur-[80px]" aria-hidden="true" />

            <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="inline-flex items-center gap-2 text-amber-300"><span className="missions-hero-signal size-2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,.9)]" /> Panorama misionero</span>
              <span className="inline-flex items-center gap-1.5"><Globe2 size={14} className="text-blue-300" aria-hidden="true" /> En vivo</span>
            </div>

            <div className="relative z-10 mx-auto mt-2 w-full max-w-[32rem]">
              <Globe config={globeConfig} className="w-full" autoRotate={!reducedMotion} interactive={!reducedMotion} autoRotateSpeed={0.0028} />
              {!loading && markerCount === 0 && (
                <div className="absolute left-1/2 top-1/2 w-[min(82%,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-slate-950/75 p-4 text-center shadow-2xl backdrop-blur-xl">
                  <MapPin size={18} className="mx-auto text-amber-300" aria-hidden="true" />
                  <p className="mt-2 text-xs font-extrabold text-white">Atlas en preparación</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">Aún no hay proyectos geolocalizados publicados.</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-8 bottom-6 rounded-2xl border border-white/10 bg-slate-950/65 p-3 text-center text-[10px] font-medium leading-relaxed text-slate-300 backdrop-blur-xl sm:inset-x-12">
                Los marcadores aparecen únicamente cuando existen coordenadas publicadas por la administración.
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
              {[
                ['Proyectos activos', loading ? '—' : String(activeMissionCount)],
                ['Países registrados', loading ? '—' : String(countryCount)],
                ['Fuente', 'Joshua Project'],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-2xl bg-white/5 p-3">
                  <p className="truncate text-sm font-black text-white sm:text-base">{value}</p>
                  <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Database size={13} className="text-blue-300" aria-hidden="true" /> {missionCount} {missionCount === 1 ? 'proyecto publicado' : 'proyectos publicados'}</span>
              <span className="text-emerald-300">Aprende · Ora · Actúa</span>
            </div>
          </div>

          <div className="absolute -right-5 -top-5 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-200 sm:flex" style={{ transform: 'translateZ(36px)' }}>
            <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><HandHeart size={16} aria-hidden="true" /></span>
            Una misión que se comparte
          </div>
          <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-200 sm:flex" style={{ transform: 'translateZ(28px)' }}>
            <span className="grid size-8 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><MapPin size={16} aria-hidden="true" /></span>
            De aquí hasta allá
          </div>
        </div>
      </div>
    </section>
  );
}
