import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';

interface CourseCalendarTabProps {
  courseId: string;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  type: string;
  icon: React.ReactNode;
}

export function CourseCalendarTab({ courseId }: CourseCalendarTabProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
    setLoading(true);
    try {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from('lms_calendar_events')
        .select('*')
        .eq('course_id', courseId)
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      const mappedEvents = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        date: event.start_date,
        type: event.event_type === 'live_session' ? 'live' : 'deadline',
        icon: event.event_type === 'live_session' ? <Video size={18} className="text-blue-500" /> : <FileText size={18} className="text-red-500" />
      }));
      
      setUpcomingEvents(mappedEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  }
  fetchEvents();
  }, [courseId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10 min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <CalendarIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Calendario del Curso</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Eventos, sesiones en vivo y fechas de entrega.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-4">Próximos Eventos</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No hay eventos programados próximamente.</p>
          ) : (
            upcomingEvents.map(event => (
              <div key={event.id} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                  {event.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-gray-100">{event.title}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                      <CalendarIcon size={12} />
                      {new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                      <Clock size={12} />
                      {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
            <CalendarIcon size={32} className="mb-4 opacity-80" />
            <h3 className="text-xl font-bold mb-2">Sincroniza tu calendario</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">No te pierdas ninguna fecha importante. Añade los eventos de este curso a tu Google Calendar o iCal.</p>
            <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors text-sm cursor-pointer">
              Sincronizar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
