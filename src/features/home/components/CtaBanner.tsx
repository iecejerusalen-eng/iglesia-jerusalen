import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MagneticButton from '../../../components/animations/MagneticButton';
import { AnimeZoomIn } from '../../../components/animations/AnimeWrappers';

export const CtaBanner = () => {
  return (
    <AnimeZoomIn className="max-w-5xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#081630] p-9 text-center text-white shadow-2xl transition-all duration-300 md:p-14">
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6 flex flex-col items-center">
          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25 px-4 py-1.5 rounded-full font-extrabold uppercase tracking-widest transition-colors duration-300">
            Te Esperamos
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight transition-colors duration-300">
            ¿Nos visitas este domingo?
          </h2>
          <p className="text-slate-300 text-sm md:text-base font-light leading-relaxed max-w-lg transition-colors duration-300">
            Nos encantaría conocerte y adorar juntos al Señor. Hay un lugar especial reservado para ti y toda tu familia.
          </p>
          <div className="pt-4">
            <MagneticButton>
              <Link
                to="/visita"
                className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Planifica tu visita
                <ArrowRight size={16} className="text-white" />
              </Link>
            </MagneticButton>
          </div>
        </div>
      </div>
    </AnimeZoomIn>
  );
};
