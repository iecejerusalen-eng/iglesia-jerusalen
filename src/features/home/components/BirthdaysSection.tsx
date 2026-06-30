import { Gift, Calendar } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../../components/animations/AnimeWrappers';
import type { PageSection } from '../types';
import { getMemberVerse } from '../utils';

interface BirthdaysSectionProps {
  sectionData: PageSection;
  birthdayMembers: any[];
}

export const BirthdaysSection = ({ sectionData, birthdayMembers }: BirthdaysSectionProps) => {
  const { title, subtitle } = sectionData;

  if (!birthdayMembers || birthdayMembers.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-50 dark:bg-slate-950 py-20 border-y border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10">
        <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full">
            Celebración Congregacional
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">
            {title || 'Próximos Cumpleaños'}
          </h2>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </AnimeFadeUp>

        <AnimeFadeUp className="max-w-3xl mx-auto bg-gradient-to-r from-amber-500/5 via-amber-600/10 to-yellow-500/5 border border-amber-500/20 rounded-3xl p-6 text-center backdrop-blur-xs shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] flex items-center justify-center pointer-events-none">
            <Gift size={100} className="text-amber-500" />
          </div>
          <p className="text-slate-800 dark:text-gray-200 font-serif font-bold text-base md:text-lg leading-relaxed italic">
            "¡Querida familia Jerusalén, felicitamos con mucho amor a cada uno de nuestros hermanos en su cumpleaños! Oramos para que el favor de Dios, su gracia inagotable y su perfecta paz colmen sus vidas en este nuevo año. ¡Que el Señor les bendiga grandemente!"
          </p>
        </AnimeFadeUp>

        <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {birthdayMembers.map((member, mIdx) => (
            <div key={mIdx}>
              <AnimeHoverCard
                className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none hover:shadow-xl hover:border-amber-500/25 transition-all duration-300 relative flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-start gap-4">
                    {member.photo_url ? (
                      <img loading="lazy"
                        src={member.photo_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-md shrink-0 animate-pulse-slow"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center font-serif font-extrabold text-2xl border-2 border-amber-500 shadow-md shrink-0 select-none">
                        {member.first_name[0]}
                      </div>
                    )}

                    <div className="flex-grow text-left space-y-1">
                      <h4 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100 leading-snug">
                        {member.first_name} {member.last_name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 dark:text-amber-400">
                        <Calendar size={13} />
                        <span>{new Date(member.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-850 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                        <Gift size={11} className="text-amber-500 animate-bounce" />
                        Cumple {member.ageTurning} años
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 my-4" />

                  {(() => {
                    const verse = getMemberVerse(member.id);
                    return (
                      <div className="flex-grow flex flex-col justify-between text-left">
                        <p className="text-slate-600 dark:text-slate-400 text-xs italic leading-relaxed font-sans font-light">
                          "{verse.text}"
                        </p>
                        <span className="text-[9px] font-bold text-amber-500 dark:text-amber-450 uppercase tracking-widest mt-2 block text-right font-mono">
                          — {verse.ref}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </AnimeHoverCard>
            </div>
          ))}
        </AnimeStaggerGrid>
      </div>
    </section>
  );
};
