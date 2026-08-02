import { Gift } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

export function BirthdaysHero() {
  return (
    <AnimeFadeUp delay={0.1} duration={400} distance={20}>
      <div className="max-w-7xl mx-auto text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex p-3 bg-church-gold/10 text-church-gold-dark dark:text-church-gold-bright rounded-3xl border border-church-gold/20 shadow-inner">
          <Gift size={28} className="animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary dark:text-white tracking-tight">
          Cumpleaños de la <span className="text-church-gold-dark dark:text-church-gold-bright">Congregación</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Celebremos juntos la vida de nuestros hermanos en la Iglesia Jerusalén. Descubre quiénes están de cumpleaños y comparte una bendición con ellos.
        </p>
      </div>
    </AnimeFadeUp>
  );
}
