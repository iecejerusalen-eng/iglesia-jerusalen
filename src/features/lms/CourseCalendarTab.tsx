import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, FileText, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface CourseCalendarTabProps {
  courseId: string;
}

interface EventItem {
  id: string;
  title: string;
  dateStr: string;
  startTime?: string;
  type: 'live' | 'deadline' | 'class';
  location?: string | null;
  attendanceStatus?: string | null;
  icon: React.ReactNode;
}

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const datePart = dateStr.split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  if (y && m && d) {
    const timePart = dateStr.includes('T') ? dateStr.split('T')[1] : null;
    if (timePart) {
      const [h, min] = timePart.split(':').map(Number);
      return new Date(y, m - 1, d, h || 12, min || 0);
    }
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  return new Date(dateStr);
}

export function CourseCalendarTab({ courseId }: CourseCalendarTabProps) {
  const { user } = useAuthStore();
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        const [eventsRes, sessionsRes, attendanceRes] = await Promise.all([
          supabase
            .from('lms_calendar_events')
            .select('*')
            .eq('course_id', courseId)
            .gte('start_date', todayStr)
            .order('start_date', { ascending: true })
            .limit(10),
          supabase
            .from('lms_class_sessions')
            .select('*')
            .eq('course_id', courseId)
            .gte('session_date', todayStr)
            .order('session_date', { ascending: true })
            .limit(10),
          user
            ? supabase
                .from('lms_attendance')
                .select('class_session_id, status')
                .eq('student_id', user.id)
            : Promise.resolve({ data: null, error: null })
        ]);

        const attendanceMap: Record<string, string> = {};
        if (attendanceRes.data) {
          attendanceRes.data.forEach((att) => {
            if (att.class_session_id) attendanceMap[att.class_session_id] = att.status;
          });
        }

        const eventsList: EventItem[] = [];

        (eventsRes.data || []).forEach((ev) => {
          eventsList.push({
            id: ev.id,
            title: ev.title,
            dateStr: ev.start_date,
            type: ev.event_type === 'live_session' ? 'live' : 'deadline',
            icon: ev.event_type === 'live_session' ? <Video size={18} className="text-blue-500" /> : <FileText size={18} className="text-red-500" />
          });
        });

        (sessionsRes.data || []).forEach((cs) => {
          eventsList.push({
            id: cs.id,
            title: cs.title || 'Clase de la Materia',
            dateStr: cs.session_date,
            startTime: cs.start_time ? cs.start_time.substring(0, 5) : undefined,
            type: 'class',
            location: cs.location,
            attendanceStatus: attendanceMap[cs.id] || null,
            icon: cs.sync_link ? <Video size={18} className="text-indigo-500" /> : <MapPin size={18} className="text-emerald-500" />
          });
        });

        eventsList.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        setUpcomingEvents(eventsList);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [courseId, user]);

  const renderAttendanceBadge = (status?: string | null) => {
    if (!status) return null;
    const labels: Record<string, { label: string; cls: string }> = {
      present: { label: 'Presente', cls: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300' },
      zoom: { label: 'En línea', cls: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300' },
      late: { label: 'Atraso', cls: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300' },
      absent: { label: 'Falta', cls: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300' },
      excused: { label: 'Justificado', cls: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300' },
    };
    const item = labels[status];
    if (!item) return null;
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${item.cls}`}>
        {item.label}
      </span>
    );
  };

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
          <p className="text-gray-500 dark:text-gray-400 text-sm">Eventos, clases presenciales/virtuales y fechas de entrega.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-4">Próximos Eventos</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No hay eventos programados próximamente.</p>
          ) : (
            upcomingEvents.map(event => {
              const eventDateObj = parseLocalDate(event.dateStr);
              return (
                <div key={event.id} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                    {event.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-gray-100">{event.title}</h4>
                      {renderAttendanceBadge(event.attendanceStatus)}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1 font-medium capitalize">
                        <CalendarIcon size={12} />
                        {eventDateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                        <Clock size={12} />
                        {event.startTime || eventDateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {event.location && (
                        <span className="text-xs text-gray-400 font-medium">
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
