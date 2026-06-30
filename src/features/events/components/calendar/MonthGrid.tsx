import { useRef, useState, useEffect } from 'react';
import type { Event as DbEvent } from '../../../../types';
import { generateDaysForView, formatDateString, isSameDay } from './dateUtils';
import { AnimeFadeUp } from '../../../../components/animations/AnimeWrappers';

interface MonthGridProps {
  currentDate: Date;
  events: DbEvent[];
  onSelectRange: (startDate: string, endDate: string) => void;
  onEditEvent: (event: DbEvent) => void;
}

export default function MonthGrid({ currentDate, events, onSelectRange, onEditEvent }: MonthGridProps) {
  const days = generateDaysForView(currentDate, 'month') as Date[];
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Prevent default drag and drop
  useEffect(() => {
    const handleMouseUp = () => {
      if (dragStart && dragCurrent) {
        const start = new Date(Math.min(dragStart.getTime(), dragCurrent.getTime()));
        const end = new Date(Math.max(dragStart.getTime(), dragCurrent.getTime()));
        onSelectRange(formatDateString(start), formatDateString(end));
      }
      setDragStart(null);
      setDragCurrent(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragStart, dragCurrent, onSelectRange]);

  const handleMouseDown = (date: Date) => {
    setDragStart(date);
    setDragCurrent(date);
  };

  const handleMouseEnter = (date: Date) => {
    if (dragStart) {
      setDragCurrent(date);
    }
  };

  const isDateSelected = (date: Date) => {
    if (!dragStart || !dragCurrent) return false;
    const start = Math.min(dragStart.getTime(), dragCurrent.getTime());
    const end = Math.max(dragStart.getTime(), dragCurrent.getTime());
    const time = date.getTime();
    return time >= start && time <= end;
  };

  return (
    <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden flex flex-col h-[700px]">
      <div className="grid grid-cols-7 border-b border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-800">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 grid grid-cols-7 grid-rows-6"
        onMouseLeave={() => setDragCurrent(null)}
      >
        {days.map((date, idx) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(date, new Date());
          // Find events for this day
          const dayEvents = events.filter(e => {
            if (!e.start_date) return false;
            const start = new Date(e.start_date + 'T00:00:00');
            const end = e.end_date ? new Date(e.end_date + 'T00:00:00') : start;
            
            // Check if date falls in range
            return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
          });

          return (
            <div 
              key={idx}
              onMouseDown={(e) => {
                // Don't trigger if clicking an event
                if ((e.target as HTMLElement).closest('.event-item')) return;
                handleMouseDown(date);
              }}
              onMouseEnter={() => handleMouseEnter(date)}
              className={`
                min-h-[100px] border-b border-r border-gray-100 dark:border-white/5 p-1 relative transition-colors cursor-pointer select-none
                ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-slate-900/50 opacity-60' : ''}
                ${isDateSelected(date) ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}
                ${idx % 7 === 6 ? 'border-r-0' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-1 px-1">
                <span className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                  ${isToday ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}
                `}>
                  {date.getDate()}
                </span>
              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar px-0.5">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onEditEvent(event)}
                    className="event-item truncate px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-[10px] rounded border border-blue-100 dark:border-blue-800/50 cursor-pointer hover:shadow-sm transition-all"
                  >
                    <span className="font-semibold">{event.start_time ? event.start_time : ''}</span> {event.emoji} {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AnimeFadeUp>
  );
}
