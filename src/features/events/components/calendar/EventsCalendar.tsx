import { useState } from 'react';
import type { Event as DbEvent } from '../../../../types';
import MonthGrid from './MonthGrid';
import TimeGrid from './TimeGrid';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays } from './dateUtils';

interface EventsCalendarProps {
  events: DbEvent[];
  onCreateEvent: (date: string, startTime?: string, endTime?: string) => void;
  onEditEvent: (event: DbEvent) => void;
}

export type CalendarViewType = 'day' | 'week' | 'month' | 'year' | 'custom';

export default function EventsCalendar({ events, onCreateEvent, onEditEvent }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [customDays, setCustomDays] = useState(3);

  const handlePrevious = () => {
    if (viewType === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (viewType === 'week') setCurrentDate(addDays(currentDate, -7));
    else if (viewType === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else if (viewType === 'year') setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    else if (viewType === 'custom') setCurrentDate(addDays(currentDate, -customDays));
  };

  const handleNext = () => {
    if (viewType === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(addDays(currentDate, 7));
    else if (viewType === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else if (viewType === 'year') setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    else if (viewType === 'custom') setCurrentDate(addDays(currentDate, customDays));
  };

  const handleToday = () => setCurrentDate(new Date());

  const getMonthName = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 dark:bg-slate-800 rounded-lg p-1 border border-gray-150 dark:border-white/10">
            <button onClick={handlePrevious} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-gray-500 dark:text-gray-400">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleToday} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300">
              Hoy
            </button>
            <button onClick={handleNext} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-gray-500 dark:text-gray-400">
              <ChevronRight size={20} />
            </button>
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-white capitalize min-w-[150px]">
            {getMonthName(currentDate)}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-50 dark:bg-slate-800 rounded-lg p-1 border border-gray-150 dark:border-white/10">
            {(['day', 'week', 'month', 'custom'] as CalendarViewType[]).map(type => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize
                  ${viewType === type 
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                {type === 'day' ? 'Día' : type === 'week' ? 'Semana' : type === 'month' ? 'Mes' : 'Personalizado'}
              </button>
            ))}
          </div>
          
          {viewType === 'custom' && (
            <select 
              value={customDays}
              onChange={(e) => setCustomDays(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-gray-150 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={3}>3 Días</option>
              <option value={4}>4 Días</option>
              <option value={7}>7 Días</option>
              <option value={12}>12 Días</option>
            </select>
          )}
        </div>
      </div>

      <div className="calendar-container">
        {viewType === 'month' && (
          <MonthGrid 
            currentDate={currentDate} 
            events={events} 
            onSelectRange={(start, _end) => onCreateEvent(start)}
            onEditEvent={onEditEvent}
          />
        )}
        
        {(viewType === 'day' || viewType === 'week' || viewType === 'custom') && (
          <TimeGrid
            currentDate={currentDate}
            viewType={viewType}
            customDays={customDays}
            events={events}
            onSelectTimeRange={(date, start, _end) => onCreateEvent(date, start, _end)}
            onEditEvent={onEditEvent}
          />
        )}
      </div>
    </div>
  );
}
