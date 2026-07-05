import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../config/supabase';
import type { LMSTeacherSchedule, LMSCalendarEvent, LMSCourse } from '../../../types';
import { Calendar as CalendarIcon, Clock, Video, Plus, ChevronLeft, ChevronRight, Filter, BookOpen, AlertCircle, CheckCircle2, Trash2, MapPin } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

interface UniversityCalendarProps {
  role?: 'student' | 'teacher' | 'admin';
  userId?: string;
  courseId?: string;
  editable?: boolean;
}

interface DisplayEvent {
  id: string;
  title: string;
  type: 'class' | 'assignment' | 'exam' | 'general' | 'live_session';
  dateStr: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  courseTitle?: string;
  courseId: string;
  meetLink?: string | null;
  location?: string | null;
  description?: string | null;
  isRecurring?: boolean;
  originalEvent?: LMSCalendarEvent;
}

export function UniversityCalendar({ role = 'student', userId, courseId, editable = false }: UniversityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [schedules, setSchedules] = useState<LMSTeacherSchedule[]>([]);
  const [dbEvents, setDbEvents] = useState<LMSCalendarEvent[]>([]);
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(courseId || 'all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal / Form state for one-off events
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LMSCalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<'class' | 'assignment' | 'exam' | 'general' | 'live_session'>('general');
  const [formCourseId, setFormCourseId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formEndTime, setFormEndTime] = useState('11:00');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detail Drawer state
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null);

  const daysOfWeekEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    fetchData();
  }, [userId, courseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, schedulesRes, eventsRes] = await Promise.all([
        supabase.from('lms_courses').select('*').order('title', { ascending: true }),
        supabase.from('lms_teacher_schedules').select('*, lms_courses(title)'),
        supabase.from('lms_calendar_events').select('*, lms_courses(title)')
      ]);

      if (coursesRes.data) {
        setCourses(coursesRes.data as LMSCourse[]);
        if (coursesRes.data.length > 0 && !formCourseId) {
          setFormCourseId(coursesRes.data[0].id);
        }
      }
      if (schedulesRes.data) setSchedules(schedulesRes.data as LMSTeacherSchedule[]);
      if (eventsRes.data) setDbEvents(eventsRes.data as LMSCalendarEvent[]);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate combined display events for the current month / window
  const displayEvents = useMemo(() => {
    const list: DisplayEvent[] = [];

    // 1. Map DB static events
    dbEvents.forEach(ev => {
      if (selectedCourseFilter !== 'all' && ev.course_id !== selectedCourseFilter) return;
      if (selectedTypeFilter !== 'all' && ev.event_type !== selectedTypeFilter) return;

      const startDateObj = new Date(ev.start_date);
      const endDateObj = new Date(ev.end_date);
      const dateStr = startDateObj.toISOString().split('T')[0];
      const startTime = startDateObj.toTimeString().substring(0, 5);
      const endTime = endDateObj.toTimeString().substring(0, 5);

      list.push({
        id: `ev-${ev.id}`,
        title: ev.title,
        type: ev.event_type || 'general',
        dateStr,
        startTime,
        endTime,
        courseTitle: ev.lms_courses?.title || 'Evento Institucional',
        courseId: ev.course_id,
        description: ev.description,
        isRecurring: false,
        originalEvent: ev
      });
    });

    // 2. Map recurring weekly schedules across the current viewing month (prev 10 days to next 40 days)
    const startWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

    for (let d = new Date(startWindow); d <= endWindow; d.setDate(d.getDate() + 1)) {
      const dayName = daysOfWeekEs[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      schedules.forEach(sch => {
        if (selectedCourseFilter !== 'all' && sch.course_id !== selectedCourseFilter) return;
        if (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'class') return;
        if (sch.day_of_week === dayName) {
          list.push({
            id: `sch-${sch.id}-${dateStr}`,
            title: sch.shift_name || 'Clase Sincrónica',
            type: 'class',
            dateStr,
            startTime: sch.start_time,
            endTime: sch.end_time,
            courseTitle: sch.lms_courses?.title || 'Materia Online',
            courseId: sch.course_id,
            meetLink: sch.meet_link,
            location: sch.room_or_location || 'Aula Virtual / Meet',
            isRecurring: true
          });
        }
      });
    }

    return list.sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.startTime.localeCompare(b.startTime));
  }, [dbEvents, schedules, currentDate, selectedCourseFilter, selectedTypeFilter]);

  // Calendar Navigation
  const handlePrev = () => {
    const newD = new Date(currentDate);
    if (view === 'month') newD.setMonth(newD.getMonth() - 1);
    else if (view === 'week') newD.setDate(newD.getDate() - 7);
    else newD.setDate(newD.getDate() - 1);
    setCurrentDate(newD);
  };

  const handleNext = () => {
    const newD = new Date(currentDate);
    if (view === 'month') newD.setMonth(newD.getMonth() + 1);
    else if (view === 'week') newD.setDate(newD.getDate() + 7);
    else newD.setDate(newD.getDate() + 1);
    setCurrentDate(newD);
  };

  const handleToday = () => setCurrentDate(new Date());

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'class':
        return 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'exam':
        return 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'assignment':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'live_session':
        return 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'class': return 'Clase';
      case 'exam': return 'Examen';
      case 'assignment': return 'Entrega';
      case 'live_session': return 'Sesión En Vivo';
      default: return 'Evento';
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCourseId || !formDate) {
      setNotification({ type: 'error', message: 'Completa los campos obligatorios.' });
      return;
    }

    try {
      const startISO = new Date(`${formDate}T${formStartTime}:00`).toISOString();
      const endISO = new Date(`${formDate}T${formEndTime}:00`).toISOString();

      const payload = {
        title: formTitle,
        description: formDesc || null,
        event_type: formType,
        course_id: formCourseId,
        start_date: startISO,
        end_date: endISO,
        is_public: true
      };

      if (editingEvent) {
        const { error } = await supabase.from('lms_calendar_events').update(payload).eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lms_calendar_events').insert([payload]);
        if (error) throw error;
      }

      setNotification({ type: 'success', message: 'Evento guardado correctamente.' });
      setIsModalOpen(false);
      setEditingEvent(null);
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el evento.';
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('¿Eliminar este evento de la agenda?')) return;
    try {
      const { error } = await supabase.from('lms_calendar_events').delete().eq('id', id);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Evento eliminado.' });
      setSelectedEvent(null);
      setDbEvents(dbEvents.filter(ev => ev.id !== id));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar.';
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const openNewEventModal = (dateStr?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDesc('');
    setFormType('class');
    if (courses[0]) setFormCourseId(courses[0].id);
    setFormDate(dateStr || currentDate.toISOString().split('T')[0]);
    setFormStartTime('10:00');
    setFormEndTime('11:00');
    setIsModalOpen(true);
  };

  // Render Month Grid
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const gridDays: Array<{ dayNum: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < firstDayIndex; i++) gridDays.push({ dayNum: null, dateStr: null });
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      gridDays.push({ dayNum: i, dateStr: `${year}-${mStr}-${dStr}` });
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800/40 text-center py-3">
          {daysOfWeekEs.map(d => (
            <div key={d} className="text-xs font-black uppercase text-gray-400 tracking-wider">
              {d.substring(0, 3)}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-gray-100 dark:divide-white/5">
          {gridDays.map((cell, idx) => {
            if (!cell.dayNum || !cell.dateStr) {
              return <div key={`empty-${idx}`} className="bg-gray-50/20 dark:bg-slate-900/40" />;
            }

            const dayEvents = displayEvents.filter(ev => ev.dateStr === cell.dateStr);
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={cell.dateStr}
                onClick={() => editable ? openNewEventModal(cell.dateStr!) : null}
                className={`p-2 relative group hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between overflow-hidden ${
                  isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                } ${editable ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-gold text-slate-950 shadow-sm font-extrabold' : 'text-slate-700 dark:text-gray-300'
                  }`}>
                    {cell.dayNum}
                  </span>
                  {editable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openNewEventModal(cell.dateStr!); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 transition-opacity"
                      title="Crear evento en este día"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] pr-1 scrollbar-thin">
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border truncate cursor-pointer transition-transform hover:scale-[1.02] ${getBadgeStyles(ev.type)}`}
                      title={`${ev.startTime} - ${ev.title} (${ev.courseTitle})`}
                    >
                      <span className="opacity-75">{ev.startTime}</span> {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    // Calculate current week sunday
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    const weekDays: Array<{ date: Date; dateStr: string; dayName: string }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      const dateStr = d.toISOString().split('T')[0];
      weekDays.push({ date: new Date(d), dateStr, dayName: daysOfWeekEs[i] });
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map(wd => {
          const dayEvents = displayEvents.filter(ev => ev.dateStr === wd.dateStr);
          const isToday = wd.dateStr === new Date().toISOString().split('T')[0];

          return (
            <div
              key={wd.dateStr}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border transition-all ${
                isToday ? 'border-gold shadow-md ring-1 ring-gold/30' : 'border-gray-100 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3 mb-3">
                <div>
                  <p className="text-xs font-black uppercase text-gray-400">{wd.dayName}</p>
                  <p className={`text-lg font-black ${isToday ? 'text-gold' : 'text-slate-800 dark:text-white'}`}>
                    {wd.date.getDate()} {monthNamesEs[wd.date.getMonth()].substring(0, 3)}
                  </p>
                </div>
                {editable && (
                  <button
                    onClick={() => openNewEventModal(wd.dateStr)}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2.5 min-h-[180px]">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">Sin actividades</p>
                ) : (
                  dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-3 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${getBadgeStyles(ev.type)}`}
                    >
                      <div className="flex items-center justify-between text-xs font-black opacity-80 mb-1">
                        <span>{ev.startTime} - {ev.endTime}</span>
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                          {getBadgeLabel(ev.type)}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm line-clamp-2">{ev.title}</h4>
                      <p className="text-xs opacity-75 mt-1 font-medium truncate">{ev.courseTitle}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Agenda / List View
  const renderAgendaView = () => {
    // Show events from currentDate onwards
    const todayStr = currentDate.toISOString().split('T')[0];
    const upcoming = displayEvents.filter(ev => ev.dateStr >= todayStr).slice(0, 25);

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-black font-serif text-slate-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
          <CalendarIcon className="text-gold" size={20} /> Proximas Actividades y Horarios en Agenda
        </h3>

        {upcoming.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm font-semibold">No hay eventos programados a partir de esta fecha.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {upcoming.map(ev => {
              const dObj = new Date(`${ev.dateStr}T12:00:00`);
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/30 px-3 rounded-2xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-white/10 flex flex-col items-center justify-center text-center flex-shrink-0 font-serif">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {monthNamesEs[dObj.getMonth()].substring(0, 3)}
                      </span>
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                        {dObj.getDate()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getBadgeStyles(ev.type)}`}>
                          {getBadgeLabel(ev.type)}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                          <Clock size={12} /> {ev.startTime} - {ev.endTime}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-gold transition-colors">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">{ev.courseTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {ev.meetLink && (
                      <a
                        href={ev.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold shadow-sm transition-all"
                      >
                        <Video size={13} /> Entrar a Meet
                      </a>
                    )}
                    <span className="text-xs text-gray-400 font-medium">➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimeFadeUp className="space-y-6">
      {/* Top Banner / Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold font-bold flex-shrink-0">
            <CalendarIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white tracking-tight capitalize">
                {monthNamesEs[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 uppercase">
                {role === 'admin' ? 'Modo Administrativo' : role === 'teacher' ? 'Vista Docente' : 'Campus Alumno'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Calendario sincronizado con cargas docentes, entregas y enlaces de videollamada.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setView('month')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                view === 'month' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                view === 'week' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setView('agenda')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                view === 'agenda' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Agenda
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
            <button onClick={handlePrev} className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleToday} className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors">
              Hoy
            </button>
            <button onClick={handleNext} className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {editable && (
            <button
              onClick={() => openNewEventModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gold hover:bg-gold/90 text-slate-950 font-bold text-xs shadow-md shadow-gold/20 transition-all hover:scale-105"
            >
              <Plus size={16} /> Crear Evento
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las Materias ({courses.length})</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="class">Clases / Horarios</option>
            <option value="assignment">Entregas</option>
            <option value="exam">Exámenes</option>
            <option value="live_session">Sesiones en vivo</option>
            <option value="general">Eventos</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Clases</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Exámenes</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Entregas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Institucional</span>
        </div>
      </div>

      {/* Main View Render */}
      {loading ? (
        <div className="h-96 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10 flex items-center justify-center animate-pulse">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-400">Sincronizando calendario y turnos...</p>
          </div>
        </div>
      ) : (
        <>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'agenda' && renderAgendaView()}
        </>
      )}

      {/* Event Detail Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10 space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-2 border ${getBadgeStyles(selectedEvent.type)}`}>
                  {getBadgeLabel(selectedEvent.type)}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {selectedEvent.title}
                </h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-3 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-3">
                <BookOpen className="text-gold flex-shrink-0" size={18} />
                <span><strong className="text-slate-800 dark:text-white">Materia:</strong> {selectedEvent.courseTitle}</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="text-gold flex-shrink-0" size={18} />
                <span><strong className="text-slate-800 dark:text-white">Fecha:</strong> {selectedEvent.dateStr}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-gold flex-shrink-0" size={18} />
                <span><strong className="text-slate-800 dark:text-white">Horario:</strong> {selectedEvent.startTime} a {selectedEvent.endTime}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="text-gold flex-shrink-0" size={18} />
                  <span><strong className="text-slate-800 dark:text-white">Lugar/Sala:</strong> {selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10 gap-3">
              {editable && !selectedEvent.isRecurring && selectedEvent.originalEvent && (
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.originalEvent!.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 text-xs font-bold transition-all"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {selectedEvent.meetLink && (
                  <a
                    href={selectedEvent.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Video size={15} /> Entrar a Videollamada
                  </a>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="text-gold" size={22} />
                {editingEvent ? 'Editar Evento de Agenda' : 'Programar Nuevo Evento / Actividad'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título de la Actividad</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej: Examen Parcial de Teología o Conferencia Sincrónica"
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Evento</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'class' | 'assignment' | 'exam' | 'general' | 'live_session')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold"
                  >
                    <option value="class">Clase / Horario</option>
                    <option value="assignment">Entrega / Tarea</option>
                    <option value="exam">Examen / Evaluación</option>
                    <option value="live_session">Sesión En Vivo (Meet)</option>
                    <option value="general">Evento Institucional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materia Asociada</label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold"
                    required
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full py-2.5 px-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full py-2.5 px-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full py-2.5 px-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción / Instrucciones (Opcional)</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Instrucciones, enlaces o detalles de la actividad..."
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimeFadeUp>
  );
}
