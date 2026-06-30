import { useRef, useState, useEffect } from 'react';
import type { Event as DbEvent } from '../../../../types';
import { generateDaysForView, formatDateString, isSameDay } from './dateUtils';
import { AnimeFadeUp } from '../../../../components/animations/AnimeWrappers';

interface TimeGridProps {
  currentDate: Date;
  viewType: 'day' | 'week' | 'custom';
  customDays?: number;
  events: DbEvent[];
  onSelectTimeRange: (date: string, startTime: string, endTime: string) => void;
  onEditEvent: (event: DbEvent) => void;
}

export default function TimeGrid({ currentDate, viewType, customDays, events, onSelectTimeRange, onEditEvent }: TimeGridProps) {
  const days = generateDaysForView(currentDate, viewType, customDays) as Date[];
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  
  const [dragState, setDragState] = useState<{
    date: Date;
    startHour: number;
    currentHour: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragState) {
        const start = Math.min(dragState.startHour, dragState.currentHour);
        const end = Math.max(dragState.startHour, dragState.currentHour) + 1; // +1 to include the end hour block
        
        const startTimeStr = `${String(Math.floor(start)).padStart(2, '0')}:00`;
        const endTimeStr = `${String(Math.floor(end)).padStart(2, '0')}:00`;
        
        onSelectTimeRange(formatDateString(dragState.date), startTimeStr, endTimeStr);
      }
      setDragState(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragState, onSelectTimeRange]);

  const handleMouseDown = (date: Date, hour: number) => {
    setDragState({
      date,
      startHour: hour,
      currentHour: hour
    });
  };

  const handleMouseEnter = (date: Date, hour: number) => {
    if (dragState && isSameDay(dragState.date, date)) {
      setDragState({ ...dragState, currentHour: hour });
    }
  };

  const isTimeSelected = (date: Date, hour: number) => {
    if (!dragState || !isSameDay(dragState.date, date)) return false;
    const start = Math.min(dragState.startHour, dragState.currentHour);
    const end = Math.max(dragState.startHour, dragState.currentHour);
    return hour >= start && hour <= end;
  };

  const WEEK_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="flex border-b border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-800">
        <div className="w-16 border-r border-gray-150 dark:border-white/10 flex-shrink-0" />
        <div className={`flex-1 grid grid-cols-${days.length} divide-x divide-gray-150 dark:divide-white/10`}>
          {days.map(date => {
            const isToday = isSameDay(date, new Date());
            return (
              <div key={date.toISOString()} className="py-3 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{WEEK_DAYS[date.getDay()]}</div>
                <div className={`
                  inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-1
                  ${isToday ? 'bg-primary text-white shadow-sm' : 'text-gray-700 dark:text-gray-200'}
                `}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Time Grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar flex" onMouseLeave={() => setDragState(null)}>
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-gray-100 dark:border-white/5 relative">
          {hours.map(hour => (
            <div key={hour} className="h-14 border-b border-gray-100 dark:border-white/5 relative">
              <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-gray-400">
                {`${String(hour).padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className={`flex-1 grid grid-cols-${days.length} divide-x divide-gray-100 dark:divide-white/5 relative`}>
          {days.map(date => {
            const dateStr = formatDateString(date);
            const dayEvents = events.filter(e => e.start_date === dateStr);

            return (
              <div key={dateStr} className="relative">
                {hours.map(hour => (
                  <div
                    key={hour}
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).closest('.event-item')) return;
                      handleMouseDown(date, hour);
                    }}
                    onMouseEnter={() => handleMouseEnter(date, hour)}
                    className={`
                      h-14 border-b border-gray-100 dark:border-white/5 cursor-pointer transition-colors select-none
                      ${isTimeSelected(date, hour) ? 'bg-primary/20 dark:bg-primary/30' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}
                    `}
                  />
                ))}

                {/* Render Events */}
                {dayEvents.map(event => {
                  if (!event.start_time) return null; // Only render events with time
                  
                  const startHourStr = event.start_time.split(':')[0];
                  const startMinStr = event.start_time.split(':')[1] || '00';
                  
                  let durationHours = 1;
                  if (event.end_time) {
                     const startH = parseInt(startHourStr);
                     const startM = parseInt(startMinStr);
                     const endH = parseInt(event.end_time.split(':')[0]);
                     const endM = parseInt(event.end_time.split(':')[1] || '00');
                     durationHours = (endH + endM/60) - (startH + startM/60);
                     if (durationHours <= 0) durationHours = 1; // Fallback
                  }

                  const top = (parseInt(startHourStr) + parseInt(startMinStr) / 60) * 56; // 56px is h-14
                  const height = Math.max(durationHours * 56, 20); // Min height

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEditEvent(event)}
                      className="event-item absolute left-1 right-1 rounded-lg bg-primary/90 backdrop-blur border border-primary text-white p-1.5 shadow-sm overflow-hidden cursor-pointer hover:bg-blue-600 transition-colors z-10"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="text-[9px] font-bold opacity-80 leading-tight mb-0.5">
                        {event.start_time} {event.end_time ? `- ${event.end_time}` : ''}
                      </div>
                      <div className="text-[10px] font-bold leading-tight truncate">
                        {event.emoji && <span className="mr-1">{event.emoji}</span>}
                        {event.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </AnimeFadeUp>
  );
}
