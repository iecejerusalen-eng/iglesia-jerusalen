import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import BlockRenderer from '../../../components/public/BlockRenderer';
import MagneticButton from '../../../components/animations/MagneticButton';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import type { PageSection } from '../types';

interface DonationsSectionProps {
  sectionData: PageSection;
}

export const DonationsSection = ({ sectionData }: DonationsSectionProps) => {
  const { title, subtitle, content_blocks } = sectionData;

  return (
    <div>
      {content_blocks && content_blocks.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimeFadeUp className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_88%_110%,rgba(157,102,14,.28),transparent_48%),linear-gradient(120deg,#0b1733_0%,#101e3d_58%,#172747_100%)] px-6 py-8 text-white shadow-[0_28px_70px_-38px_rgba(8,22,48,.7)] sm:px-10 sm:py-10 lg:px-14">
            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
              <div className="max-w-3xl">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-church-gold-emphasis-soft bg-church-gold-emphasis-soft px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-church-gold-emphasis">
                  <Sparkles size={13} aria-hidden="true" /> Generosidad que transforma
                </span>
                <h3 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title || 'Apoya la Obra de Dios'}</h3>
                {subtitle && <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">{subtitle}</p>}
                <div className="mt-5 max-w-2xl text-sm leading-6 text-slate-200 [&_a]:text-church-gold-emphasis [&_a]:underline [&_a]:underline-offset-4">
                  <BlockRenderer blocks={content_blocks} />
                </div>
              </div>
              <div className="lg:pr-2">
                <div className="mb-3 hidden h-px w-12 bg-church-gold-emphasis lg:block" />
                <p className="mb-4 max-w-xs text-sm leading-6 text-slate-300">Cada aporte ayuda a servir a nuestra comunidad y compartir el evangelio.</p>
                <Link to="/donaciones" className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-church-gold-emphasis px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_26px_-12px_var(--church-gold-emphasis)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101e3d] dark:text-slate-950 sm:w-auto">
                  Diezmos y ofrendas en línea
                  <ArrowUpRight size={17} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </AnimeFadeUp>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <AnimeFadeUp className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_88%_110%,rgba(157,102,14,.28),transparent_48%),linear-gradient(120deg,#0b1733_0%,#101e3d_58%,#172747_100%)] px-6 py-8 text-white shadow-[0_28px_70px_-38px_rgba(8,22,48,.7)] sm:px-10 sm:py-10 lg:px-14">
            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
              <div className="max-w-3xl">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-church-gold-emphasis-soft bg-church-gold-emphasis-soft px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-church-gold-emphasis">
                  <Sparkles size={13} aria-hidden="true" /> Generosidad que transforma
                </span>
                <h3 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Apoya la Obra de Dios</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio de Cristo y ayudando a los necesitados en nuestra comunidad local y misiones globales.
              </p>
              </div>
              <div className="lg:pr-2">
                <div className="mb-3 hidden h-px w-12 bg-church-gold-emphasis lg:block" />
                <p className="mb-4 max-w-xs text-sm leading-6 text-slate-300">Tu generosidad se convierte en servicio, acompañamiento y esperanza.</p>
                <MagneticButton>
                  <Link to="/donaciones" className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-church-gold-emphasis px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_26px_-12px_var(--church-gold-emphasis)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101e3d] dark:text-slate-950 sm:w-auto">
                    Diezmos y ofrendas en línea
                    <ArrowUpRight size={17} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </AnimeFadeUp>
        </section>
      )}
    </div>
  );
};
