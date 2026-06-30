import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
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
        <section className="max-w-5xl mx-auto px-4">
          <AnimeFadeUp className="bg-gradient-to-br from-[#0c1c42] to-amber-950 text-white rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 flex items-center justify-center animate-pulse pointer-events-none">
              <Heart size={150} fill="currentColor" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h3 className="font-serif text-3xl font-bold">{title || 'Apoya la Obra de Dios'}</h3>
              {subtitle && (
                <p className="text-slate-200 text-sm leading-relaxed">{subtitle}</p>
              )}
              <BlockRenderer blocks={content_blocks} />
            </div>
          </AnimeFadeUp>
        </section>
      ) : (
        <section className="max-w-5xl mx-auto px-4">
          <AnimeFadeUp className="bg-gradient-to-br from-[#0a1c40] via-[#071330] to-amber-900/60 text-white rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden border border-white/10">
            <div className="absolute top-[-20px] right-[-20px] w-48 h-48 opacity-[0.05] flex items-center justify-center animate-pulse pointer-events-none">
              <Heart size={180} fill="currentColor" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h3 className="font-serif text-3xl md:text-4xl font-bold">Apoya la Obra de Dios</h3>
              <p className="text-slate-200 text-sm md:text-base leading-relaxed font-light">
                Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio de Cristo y ayudando a los necesitados en nuestra comunidad local y misiones globales.
              </p>
              <div className="pt-4">
                <MagneticButton>
                  <Link
                    to="/donations"
                    className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all text-sm inline-flex items-center gap-2.5 cursor-pointer"
                  >
                    Diezmos y Ofrendas en Línea
                    <Heart size={16} fill="currentColor" className="animate-pulse" />
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
