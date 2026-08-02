import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BirthdayInfo } from '../hooks/useBirthdays';
import { WEEK_DAYS, MONTH_NAMES } from '../hooks/useBirthdays';

interface BirthdaysCalendarProps {
  birthdays: BirthdayInfo[];
  currentCalendarDate: Date;
  setCurrentCalendarDate: (date: Date) => void;
  onCelebrate: (name: string) => void;
}

export function BirthdaysCalendar({
  birthdays,
  currentCalendarDate,
  setCurrentCalendarDate,
  onCelebrate
}: BirthdaysCalendarProps) {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth(); // 0-indexed

  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week for 1st of month (0 = Sun)
  const totalDays = new Date(year, month + 1, 0).getDate(); // Total days in month
  
  // Collect calendar cells
  const cells = [];
  
  // Blank cells before 1st day of month
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ day: null, date: null });
  }

  // Real calendar days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      date: new Date(year, month, d)
    });
  }

  // Map birthdays matching this month
  const monthBirthdays = birthdays.filter(item => item.month === (month + 1));

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-6">
      {/* Calendar Header Navigator */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
        <button
          onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
          className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors shadow-sm"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-serif font-bold text-lg md:text-xl text-primary dark:text-church-gold-bright uppercase tracking-wide">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
          className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors shadow-sm"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {WEEK_DAYS.map(day => <div key={day} className="py-1">{day}</div>)}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, index) => {
          if (!cell.day) {
            return <div key={`empty-${index}`} className="aspect-square bg-slate-50/30 dark:bg-slate-950/20 rounded-xl border border-transparent"></div>;
          }

          // Find birthdays on this specific day
          const dayBirthdays = monthBirthdays.filter(item => item.day === cell.day);
          const isTodayDate = cell.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div
              key={`day-${cell.day}`}
              className={`aspect-square rounded-xl p-1.5 md:p-2 border flex flex-col justify-between group transition-all duration-300 min-h-[70px] ${
                isTodayDate
                  ? 'bg-church-gold/10 dark:bg-church-gold/20 border-church-gold/50 shadow-inner'
                  : 'bg-white dark:bg-slate-950/50 border-slate-100 dark:border-white/5 hover:border-church-gold/30 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs md:text-sm font-extrabold ${isTodayDate ? 'text-primary dark:text-church-gold-bright' : 'text-slate-400 dark:text-slate-500'}`}>
                  {cell.day}
                </span>
                {dayBirthdays.length > 0 && (
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-red rounded-full animate-ping"></span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 max-h-[40px] md:max-h-[60px] overflow-y-auto overflow-x-hidden pt-1 custom-scrollbar">
                {dayBirthdays.map(item => {
                  const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
                  return (
                    <button
                      key={item.member.id}
                      onClick={() => onCelebrate(`${item.member.first_name} ${item.member.last_name}`)}
                      className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-church-gold/20 text-church-gold-dark flex items-center justify-center font-bold text-[8px] md:text-[10px] border border-church-gold/40 overflow-hidden shrink-0 cursor-pointer relative shadow-sm hover:scale-110 hover:shadow-md transition-all group/avatar"
                      title={`${item.member.first_name} ${item.member.last_name} (Cumple ${item.age} años)`}
                    >
                      {item.member.photo_url ? (
                        <img loading="lazy"
                          src={item.member.photo_url}
                          alt={item.member.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
