import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Gift, Cake, MessageCircle, X } from 'lucide-react';
import type { BirthdayInfo } from '../hooks/useBirthdays';
import { getBirthdayDayForYear, WEEK_DAYS, MONTH_NAMES } from '../hooks/useBirthdays';

interface BirthdaysCalendarProps {
  birthdays: BirthdayInfo[];
  currentCalendarDate: Date;
  setCurrentCalendarDate: (date: Date) => void;
  onCelebrate: (name: string) => void;
  onMessage?: (birthday: BirthdayInfo) => void;
}

export function BirthdaysCalendar({
  birthdays,
  currentCalendarDate,
  setCurrentCalendarDate,
  onCelebrate,
  onMessage,
}: BirthdaysCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth(); // 0-indexed

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Close popover on Escape or click outside
  const handleClose = useCallback(() => setSelectedDay(null), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (selectedDay !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedDay, handleClose]);


  // Build calendar cells
  const cells: { day: number | null }[] = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push({ day: null });
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d });

  // Birthdays for this month
  const monthBirthdays = birthdays.filter(item => item.month === (month + 1));

  const today = new Date();
  const isTodayInView = month === today.getMonth() && year === today.getFullYear();

  const handleNavigate = (direction: -1 | 1) => {
    setSelectedDay(null);
    setCurrentCalendarDate(new Date(year, month + direction, 1));
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      {/* Calendar Header Navigator */}
      <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 dark:border-white/5">
        <button
          onClick={() => handleNavigate(-1)}
          className="p-2.5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors shadow-sm"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-serif font-bold text-lg md:text-xl text-primary dark:text-church-gold-bright uppercase tracking-wide">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button type="button" onClick={() => setCurrentCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1))} disabled={isTodayInView} className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:bg-church-gold/10 hover:text-church-gold-dark disabled:cursor-default disabled:opacity-40 dark:text-slate-500 dark:hover:text-church-gold-light">Ir a hoy</button>
        </div>
        <button
          onClick={() => handleNavigate(1)}
          className="p-2.5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors shadow-sm"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-0 border-b border-slate-100 dark:border-white/5">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-3 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 p-2 md:p-3">
        {cells.map((cell, index) => {
          if (!cell.day) {
            return (
              <div key={`empty-${index}`} className="min-h-[90px] md:min-h-[110px] m-0.5 rounded-xl bg-slate-50/30 dark:bg-slate-950/10 border border-transparent" />
            );
          }

            const dayBirthdays = monthBirthdays.filter(item => getBirthdayDayForYear(item.member, year) === cell.day);
          const isToday = isTodayInView && cell.day === today.getDate();
          const hasBirthdays = dayBirthdays.length > 0;
          const isSelected = selectedDay === cell.day;
          const maxVisible = 2;

          return (
            <div
              key={`day-${cell.day}`}
              className="relative m-0.5"
            >
              <button
                type="button"
                disabled={!hasBirthdays}
                onClick={() => hasBirthdays ? setSelectedDay(isSelected ? null : cell.day) : undefined}
                className={`w-full min-h-[90px] md:min-h-[110px] rounded-xl p-2 flex flex-col gap-1.5 text-left transition-all duration-200 border ${
                  isSelected
                    ? 'bg-church-gold/10 dark:bg-church-gold/15 border-church-gold/50 shadow-md ring-1 ring-church-gold/20'
                    : isToday
                      ? 'bg-church-gold/5 dark:bg-church-gold/10 border-church-gold/30 shadow-inner'
                      : hasBirthdays
                        ? 'bg-white dark:bg-slate-950/50 border-slate-150 dark:border-white/5 hover:border-church-gold/30 hover:bg-church-gold/[0.03] hover:shadow-sm cursor-pointer'
                        : 'bg-white dark:bg-slate-950/50 border-slate-100 dark:border-white/5'
                } ${!hasBirthdays ? 'cursor-default' : ''}`}
                aria-label={`${cell.day} de ${MONTH_NAMES[month]} - ${hasBirthdays ? `${dayBirthdays.length} cumpleaños` : 'sin cumpleaños'}`}
                aria-expanded={hasBirthdays ? isSelected : undefined}
              >
                {/* Day number + indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-bold ${
                    isToday ? 'text-white bg-primary dark:bg-church-gold-medium w-7 h-7 rounded-full flex items-center justify-center' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {cell.day}
                  </span>
                  {hasBirthdays && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isToday ? 'bg-accent-red animate-pulse' : 'bg-church-gold-medium'
                    }`} />
                  )}
                </div>

                {/* Mini birthday chips */}
                {hasBirthdays && (
                  <div className="flex flex-col gap-1 mt-auto overflow-hidden">
                    {dayBirthdays.slice(0, maxVisible).map(item => {
                      const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
                      return (
                        <div key={item.member.id} className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full shrink-0 overflow-hidden bg-church-gold/20 border border-church-gold/30 flex items-center justify-center">
                            {item.member.photo_url ? (
                              <img loading="lazy" src={item.member.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[7px] font-bold text-church-gold-dark">{initials}</span>
                            )}
                          </div>
                          <span className="text-[10px] md:text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate leading-tight">
                            {item.member.first_name}
                          </span>
                        </div>
                      );
                    })}
                    {dayBirthdays.length > maxVisible && (
                      <span className="text-[10px] font-bold text-church-gold-dark dark:text-church-gold-light pl-6">
                        +{dayBirthdays.length - maxVisible} más
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* ── Popover ── */}
              {isSelected && dayBirthdays.length > 0 && (
                <div
                  ref={popoverRef}
                  className={`absolute z-50 top-full mt-2 w-[280px] sm:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
                    index % 7 <= 1 ? 'left-0 origin-top-left' : index % 7 >= 5 ? 'right-0 origin-top-right' : 'left-1/2 -translate-x-1/2 origin-top'
                  }`}
                >
                  {/* Arrow */}
                  <div className={`absolute -top-1.5 w-3 h-3 rotate-45 bg-white dark:bg-slate-900 border-l border-t border-slate-200 dark:border-white/15 ${
                    index % 7 <= 1 ? 'left-8' : index % 7 >= 5 ? 'right-8' : 'left-1/2 -translate-x-1/2'
                  }`} />

                  {/* Header */}
                  <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Cake size={16} className="text-church-gold-dark dark:text-church-gold-bright" />
                      <h4 className="font-serif font-bold text-sm text-slate-800 dark:text-white">
                        {cell.day} de {MONTH_NAMES[month]}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClose(); }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* List of birthday people */}
                  <div className="p-3 flex flex-col gap-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {dayBirthdays.map(item => {
                      const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
                      return (
                        <div
                          key={item.member.id}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          {/* Large avatar */}
                          <div className={`w-11 h-11 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm ${
                            item.isToday
                              ? 'bg-church-gold/25 text-church-gold-dark border-2 border-church-gold ring-2 ring-church-gold/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                          }`}>
                            {item.member.photo_url ? (
                              <img loading="lazy" src={item.member.photo_url} alt={item.member.first_name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                              {item.member.first_name} {item.member.last_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.member.ministry_name || 'Familia Jerusalén'}</p>
                          </div>

                          {/* Celebrate button */}
                           <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCelebrate(`${item.member.first_name} ${item.member.last_name}`);
                            }}
                            className={`p-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                              item.isToday
                                ? 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-church-gold/20 hover:text-church-gold-dark'
                            }`}
                            title={`Celebrar a ${item.member.first_name}`}
                          >
                            <Gift size={16} />
                          </button>
                          {onMessage && <button type="button" onClick={(e) => { e.stopPropagation(); onMessage(item); }} className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2 text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300" title={`Enviar felicitación a ${item.member.first_name}`} aria-label={`Enviar felicitación a ${item.member.first_name}`}><MessageCircle size={16} /></button>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline CSS for popover animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 200ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
