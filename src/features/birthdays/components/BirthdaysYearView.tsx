import { Gift, CalendarDays } from 'lucide-react';
import type { BirthdayInfo } from '../hooks/useBirthdays';
import { MONTH_NAMES } from '../hooks/useBirthdays';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';

interface BirthdaysYearViewProps {
  birthdays: BirthdayInfo[];
  onCelebrate: (name: string) => void;
}

export function BirthdaysYearView({ birthdays, onCelebrate }: BirthdaysYearViewProps) {
  if (birthdays.length === 0) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center shadow-sm">
        <Gift className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">No hay cumpleaños registrados</h3>
      </div>
    );
  }

  // Create an array of 12 months
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentMonth = new Date().getMonth() + 1;

  return (
    <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {months.map((monthNum) => {
        // Get all birthdays for this month and sort them by day
        const monthBirthdays = birthdays
          .filter(b => b.month === monthNum)
          .sort((a, b) => a.day - b.day);
          
        const isCurrentMonth = monthNum === currentMonth;

        return (
          <div
            key={monthNum}
            className={`flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ${
              isCurrentMonth 
                ? 'border-church-gold-medium dark:border-church-gold/50 shadow-md ring-1 ring-church-gold/20' 
                : 'border-slate-200/80 dark:border-white/10 hover:border-church-gold/30 hover:shadow-lg'
            }`}
          >
            {/* Month Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isCurrentMonth
                ? 'bg-gradient-to-r from-church-gold/15 to-transparent border-church-gold/20'
                : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-white/5'
            }`}>
              <h3 className={`font-serif font-bold text-lg ${
                isCurrentMonth ? 'text-church-gold-dark dark:text-church-gold-bright' : 'text-slate-800 dark:text-slate-200'
              }`}>
                {MONTH_NAMES[monthNum - 1]}
              </h3>
              <div className={`p-1.5 rounded-lg ${
                isCurrentMonth ? 'bg-church-gold/20 text-church-gold-dark' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                <CalendarDays size={16} />
              </div>
            </div>

            {/* Birthdays List */}
            <div className="p-4 flex-1 flex flex-col gap-3 custom-scrollbar overflow-y-auto max-h-[300px]">
              {monthBirthdays.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-6 text-sm text-slate-400 italic">
                  Ningún cumpleaños
                </div>
              ) : (
                monthBirthdays.map(item => {
                  const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
                  
                  return (
                    <div 
                      key={item.member.id} 
                      className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                        item.isToday 
                          ? 'bg-church-gold/10 border border-church-gold/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-8 shrink-0">
                          <span className={`text-xs font-bold ${item.isToday ? 'text-accent-red' : 'text-slate-400'}`}>
                            {item.day}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => onCelebrate(`${item.member.first_name} ${item.member.last_name}`)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden shadow-sm cursor-pointer hover:scale-110 transition-transform ${
                            item.isToday
                              ? 'bg-church-gold-medium text-white ring-2 ring-church-gold/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                          title="Felicitar"
                        >
                          {item.member.photo_url ? (
                            <img loading="lazy" src={item.member.photo_url} alt={item.member.first_name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </button>
                        
                        <div className="flex flex-col overflow-hidden">
                          <span className={`text-sm font-medium truncate ${item.isToday ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.member.first_name} {item.member.last_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.age} años
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </AnimeStaggerGrid>
  );
}
