import { Activity, Sparkles } from 'lucide-react';
import { AnimeReveal, AnimeFloat } from '../../../components/animations/AnimeWrappers';
import { BorderBeam } from '../../../components/ui/magicui/border-beam';
import { BIBLE_VERSES } from '../constants';

interface DashboardHeroProps {
  displayName: string;
  membersCount: number;
}

export const DashboardHero = ({ displayName, membersCount }: DashboardHeroProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      <AnimeReveal direction="up" delay={50} duration={700} className="lg:col-span-2">
        <div className="group relative flex h-full min-h-56 flex-col justify-center overflow-hidden rounded-[1.4rem] border border-white/5 bg-gradient-to-br from-[#0b1530] via-[#102046] to-[#1e3a8a] p-5 text-white shadow-lg transition-all duration-500 hover:border-gold/20 hover:shadow-xl hover:shadow-gold/5 sm:p-6 md:min-h-64 md:rounded-3xl md:p-8">
          <div className="absolute right-0 bottom-0 opacity-5 flex items-center justify-center pointer-events-none -mr-8 -mb-8">
            <AnimeFloat y={[-6, 6]} duration={5000}>
              <Activity size={240} className="group-hover:scale-105 transition-transform duration-700" />
            </AnimeFloat>
          </div>
          <div className="relative z-10 space-y-3">
            <span className="inline-flex bg-gold/15 text-gold border border-gold/30 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
              Consola Central CRM & BI
            </span>
            <h1 className="text-2xl font-serif font-bold tracking-tight sm:text-3xl md:text-4xl">
              ¡Hola, {displayName}!
            </h1>
            <p className="max-w-xl text-xs font-medium leading-relaxed text-gray-305 sm:text-sm">
              Bienvenido al Centro de Control de la Iglesia Jerusalén. Monitorea el crecimiento espiritual, analiza talentos, gestiona el inventario físico y mantén al día la comunidad en tiempo real.
            </p>
          </div>
        </div>
      </AnimeReveal>

      {/* Versiculo de la Semana */}
      <AnimeReveal direction="up" delay={150} duration={700}>
        <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.4rem] border border-gray-150 bg-gradient-to-br from-[#D4AF37]/5 via-white to-white p-5 shadow-2xs transition-all duration-300 hover:border-gold/30 hover:shadow-xs dark:via-slate-900 dark:to-slate-900 dark:border-white/10 md:rounded-3xl md:p-6">
          <BorderBeam size={200} duration={20} delay={0} colorFrom="#D4AF37" colorTo="#FFFFFF" />
          <div className="absolute -top-6 -right-6 text-gold/10 font-serif text-8xl pointer-events-none select-none group-hover:scale-110 transition-transform duration-500">
            “
          </div>
          <div className="space-y-2 relative z-10">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Promesa Bíblica Diaria</span>
            <p className="text-xs font-serif italic text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
              {BIBLE_VERSES[membersCount % BIBLE_VERSES.length]}
            </p>
          </div>
          <div className="border-t border-gray-100 dark:border-white/10 pt-3 mt-4 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
            <Sparkles size={12} className="text-gold animate-pulse" />
            Edificando en sana doctrina
          </div>
        </div>
      </AnimeReveal>
    </div>
  );
};
