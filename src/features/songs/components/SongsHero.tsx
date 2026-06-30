import { Music } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

export const SongsHero = () => {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white py-16 px-4 border-b border-gold/15 relative overflow-hidden">
      {/* Decorative gold glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
        <AnimeFadeUp delay={0} duration={600}>
          <div className="inline-flex p-3 bg-gold/10 text-gold rounded-3xl border border-gold/20 mb-2 shadow-inner">
            <Music size={32} className="animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">Alabanzas e Himnos</h1>
          <p className="text-indigo-200 text-sm md:text-base max-w-xl mx-auto font-medium">
            Biblioteca musical y partituras de la Iglesia Jerusalén para adoradores y músicos
          </p>
        </AnimeFadeUp>
      </div>
    </div>
  );
};
