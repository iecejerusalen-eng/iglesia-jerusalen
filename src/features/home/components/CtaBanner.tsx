import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import MagneticButton from '../../../components/animations/MagneticButton';
import { AnimeZoomIn } from '../../../components/animations/AnimeWrappers';

export const CtaBanner = () => {
  return (
    <AnimeZoomIn className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_84%_0%,rgba(255,214,121,.12),transparent_38%),linear-gradient(115deg,#0b1733_0%,#101e3d_70%,#142646_100%)] px-6 py-8 text-white shadow-[0_28px_70px_-38px_rgba(8,22,48,.7)] sm:px-10 sm:py-10 lg:px-14">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-church-gold-emphasis-soft bg-church-gold-emphasis-soft px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-church-gold-emphasis">
              <Sparkles size={13} aria-hidden="true" /> Te esperamos
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              ¿Nos visitas este domingo?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Nos encantaría conocerte y adorar juntos al Señor. Hay un lugar especial reservado para ti y toda tu familia.
            </p>
          </div>
          <div className="lg:pr-2">
            <div className="mb-3 hidden h-px w-12 bg-church-gold-emphasis lg:block" />
            <p className="mb-4 max-w-xs text-sm leading-6 text-slate-300">Conoce la iglesia y cuéntanos cómo podemos recibirte.</p>
            <MagneticButton>
              <Link
                to="/visita"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-church-gold-emphasis px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_26px_-12px_var(--church-gold-emphasis)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101e3d] dark:text-slate-950 sm:w-auto"
              >
                Planifica tu visita
                <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </MagneticButton>
          </div>
        </div>
      </div>
    </AnimeZoomIn>
  );
};
