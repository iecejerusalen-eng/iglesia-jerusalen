import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

export function StudentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Mock events for the demo (would be fetched from DB)
  const events = [
    { date: 15, title: 'Entrega de Proyecto', type: 'assignment' },
    { date: 22, title: 'Examen Final', type: 'exam' },
  ];

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
      const dayEvents = events.filter(e => e.date === i);
      
      days.push(
        <div 
          key={i} 
          className={`min-h-[80px] p-2 border border-gray-100 dark:border-white/5 relative group transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20 font-bold' : ''}`}
        >
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${isToday ? 'bg-gold text-white' : 'text-slate-700 dark:text-gray-300'}`}>
            {i}
          </span>
          <div className="mt-1 space-y-1">
            {dayEvents.map((evt, idx) => (
              <div key={idx} className={`text-xs px-2 py-1 rounded truncate ${
                evt.type === 'exam' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {evt.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
          <h2 className="text-2xl font-bold font-serif flex items-center gap-3 text-slate-800 dark:text-white">
            <CalendarIcon className="text-gold" size={28} />
            Calendario Académico
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-lg min-w-[140px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-px mb-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
            <div>Dom</div>
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-white/10 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
            {renderDays()}
          </div>
        </div>

        {/* Upcoming events list */}
        <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gold" />
            Próximos Vencimientos
          </h3>
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className={`p-3 rounded-lg flex flex-col items-center justify-center min-w-[60px] ${
                  evt.type === 'exam' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                }`}>
                  <span className="text-xs font-bold uppercase">{monthNames[currentDate.getMonth()].substring(0,3)}</span>
                  <span className="text-xl font-black">{evt.date}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{evt.title}</h4>
                  <p className="text-sm text-gray-500">
                    {evt.type === 'exam' ? 'Examen evaluativo' : 'Entrega de tarea'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AnimeFadeUp>
  );
}
