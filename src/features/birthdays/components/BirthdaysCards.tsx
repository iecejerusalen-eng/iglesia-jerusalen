import { Sparkles, Gift } from 'lucide-react';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import type { BirthdayInfo } from '../hooks/useBirthdays';

interface BirthdaysCardsProps {
  birthdays: BirthdayInfo[];
  onCelebrate: (name: string) => void;
}

export function BirthdaysCards({ birthdays, onCelebrate }: BirthdaysCardsProps) {
  if (birthdays.length === 0) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <Gift className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">No hay cumpleaños en esta vista</h3>
        <p className="text-sm text-slate-400 mt-2">Intenta cambiar los filtros o buscar a otra persona.</p>
      </div>
    );
  }

  return (
    <AnimeStaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {birthdays.map((item) => {
        const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
        
        return (
          <div
            key={item.member.id}
            className={`group flex flex-col items-center p-6 bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl hover:-translate-y-1 ${
              item.isToday
                ? 'border-church-gold-medium dark:border-church-gold/50 bg-gradient-to-b from-church-gold/10 to-white dark:from-church-gold/10 dark:to-slate-900'
                : 'border-slate-200/80 dark:border-white/10 hover:border-church-gold/30 dark:hover:border-church-gold/20'
            }`}
          >
            {/* Avatar Section */}
            <div className="relative mb-5">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner border-2 ${
                item.isToday 
                  ? 'bg-church-gold/20 text-church-gold-dark dark:text-church-gold-bright border-church-gold shadow-[0_0_20px_rgba(202,152,73,0.3)]' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent dark:text-slate-300'
              } overflow-hidden transition-transform duration-300 group-hover:scale-105`}>
                {item.member.photo_url ? (
                  <img loading="lazy" src={item.member.photo_url} alt={item.member.first_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              
              {item.isToday && (
                <div className="absolute -top-2 -right-2 bg-accent-red text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white dark:border-slate-900" title="¡Es hoy!">
                  <Sparkles size={14} />
                </div>
              )}
            </div>

            {/* Info Section */}
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white text-center line-clamp-1 group-hover:text-primary dark:group-hover:text-church-gold-light transition-colors">
              {item.member.first_name} {item.member.last_name}
            </h3>
            
            <div className="flex items-center gap-2 mt-2 bg-slate-50 dark:bg-slate-950/50 px-4 py-1.5 rounded-full border border-slate-100 dark:border-white/5">
              <span className="font-bold text-church-gold-dark dark:text-church-gold-light text-sm">{item.formattedDate}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{item.age} años</span>
            </div>

            {/* Status & CTA */}
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/10 w-full flex flex-col items-center gap-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.isToday 
                  ? <span className="text-accent-red animate-pulse">¡Felicítalo hoy!</span>
                  : item.daysRemaining === 1 
                    ? 'Mañana' 
                    : item.daysRemaining > 0 
                      ? `En ${item.daysRemaining} días`
                      : 'Ya pasó'}
              </p>
              
              <button
                onClick={() => onCelebrate(`${item.member.first_name} ${item.member.last_name}`)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  item.isToday
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-church-gold/20 hover:text-church-gold-dark dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-church-gold/20 dark:hover:text-church-gold-bright'
                }`}
              >
                <Gift size={16} />
                Celebrar
              </button>
            </div>
          </div>
        );
      })}
    </AnimeStaggerGrid>
  );
}
