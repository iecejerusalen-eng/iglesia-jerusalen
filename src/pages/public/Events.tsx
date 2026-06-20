import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { Event as DbEvent } from '../../types';
import { AnimeFadeUp, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
  Users, Layers, AlertCircle, X, CalendarDays
} from 'lucide-react';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const Events = () => {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'year'>('month');
  const [hoveredEvent, setHoveredEvent] = useState<DbEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Interactive details state
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [detailViewType, setDetailViewType] = useState<'modal' | 'drawer'>('modal');

  useEffect(() => {
    fetchEvents();
  }, []);

  const getLogoUrl = (event: any) => {
    const ministry = event?.ministries;
    if (!ministry || !ministry.logos || !Array.isArray(ministry.logos) || ministry.logos.length === 0) return null;
    const logo = ministry.logos.find((l: any) => l.variant === 'circular') ||
      ministry.logos.find((l: any) => l.variant === 'cuadrado') ||
      ministry.logos[0];
    if (!logo) return null;
    return supabase.storage.from('logos').getPublicUrl(logo.storage_path).data.publicUrl;
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          ministries (
            name,
            slug,
            theme_color,
            logos (
              id,
              variant,
              storage_path
            )
          )
        `)
        .eq('is_public', true);

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Date Calculation Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];

    // Add padding days from previous month
    const startOfWeek = firstDay.getDay(); // 0 is Sunday
    for (let i = startOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add padding days from next month to complete 6 weeks (42 cells)
    const totalCells = 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek); // Start on Sunday

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (view === 'year') {
      newDate.setFullYear(currentDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (view === 'year') {
      newDate.setFullYear(currentDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter events by date range
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      // Direct date match or between start_date and end_date
      return event.start_date <= dateStr && event.end_date >= dateStr;
    });
  };

  // Event tooltip hover handler
  const handleMouseMove = (e: React.MouseEvent, event: DbEvent) => {
    setTooltipPos({
      x: e.clientX + 15,
      y: e.clientY + 15
    });
    setHoveredEvent(event);
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'Todo el día';
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const formatEventDateRange = (startDateStr: string, endDateStr: string) => {
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);

    const formatDate = (d: Date) => {
      return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
    };

    if (startDateStr === endDateStr) {
      return formatDate(start);
    }

    return `Del ${start.getDate()} de ${MONTHS[start.getMonth()]} al ${formatDate(end)}`;
  };

  const getRecurrenceText = (event: DbEvent) => {
    if (!event.is_recurring || !event.recurrence_type) return null;
    const typeMap: Record<string, string> = {
      diario: 'Diariamente',
      semanal: 'Semanalmente',
      anual: 'Anualmente'
    };

    let text = typeMap[event.recurrence_type] || event.recurrence_type;

    if (event.recurrence_type === 'semanal' && event.recurrence_days && event.recurrence_days.length > 0) {
      const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayNames = event.recurrence_days
        .map(d => {
          if (d === 7) return daysMap[0];
          return daysMap[d];
        })
        .filter(Boolean);

      text += ` (los días: ${dayNames.join(', ')})`;
    }
    return text;
  };

  return (
    <div className="py-16 bg-base dark:bg-slate-950 min-h-screen transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto">
          <AnimeFadeUp delay={0}>
            <h1 className="font-serif font-bold text-4xl text-primary dark:text-white md:text-5xl">
              Calendario de Actividades
            </h1>
          </AnimeFadeUp>
          <AnimeFadeUp delay={100}>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm font-medium">
              Sigue de cerca todas las reuniones generales, cultos especiales y actividades de los departamentos de la Iglesia Jerusalén.
            </p>
          </AnimeFadeUp>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-gray-150 dark:border-white/10 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-slate-700 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Hoy
            </button>
            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800">
              <button
                onClick={handlePrev}
                aria-label="Anterior"
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-gray-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNext}
                aria-label="Siguiente"
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-gray-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <h2 className="font-serif font-bold text-lg text-slate-800 dark:text-gray-100 ml-2">
              {view === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {view === 'week' && `Semana del ${getDaysInWeek(currentDate)[0].getDate()} de ${MONTHS[getDaysInWeek(currentDate)[0].getMonth()]}`}
              {view === 'day' && `${currentDate.getDate()} de ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {view === 'year' && `${currentDate.getFullYear()}`}
            </h2>
          </div>

          {/* View Toggles */}
          <div className="flex bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl p-1 gap-1" role="tablist" aria-label="Vistas del calendario">
            {(['month', 'week', 'day', 'year'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                role="tab"
                aria-selected={view === v}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${view === v
                  ? 'bg-primary dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {v === 'month' && 'Mensual'}
                {v === 'week' && 'Semanal'}
                {v === 'day' && 'Diario'}
                {v === 'year' && 'Anual'}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid Container with Motion transitions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden p-4 min-h-[500px]">
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <CalendarIcon className="text-primary dark:text-white/30 animate-bounce" size={48} />
                <span className="text-slate-500 dark:text-gray-450 text-xs font-medium">Cargando actividades...</span>
              </div>
            </div>
          ) : (
            <AnimeFadeUp key={`${view}-${currentDate.toISOString()}`} delay={0} className="w-full">
              <div className="w-full">
                {/* 1. MONTH VIEW */}
                {view === 'month' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-1 border-b border-gray-100 dark:border-white/5 pb-2">
                      {WEEKDAYS.map((day) => (
                        <div key={day} className="text-center text-xs font-bold text-slate-500 dark:text-gray-450 uppercase tracking-wider py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {getDaysInMonth(currentDate).map((day, idx) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayEvents = getEventsForDate(day);

                        return (
                          <div
                            key={idx}
                            className={`min-h-[100px] border border-gray-100 dark:border-white/5 rounded-xl p-2 flex flex-col justify-between transition-colors ${
                              isCurrentMonth ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100' : 'bg-gray-50/50 dark:bg-slate-950/50 text-gray-300 dark:text-slate-600'
                            } ${isToday ? 'border-primary dark:border-blue-500 ring-2 ring-primary/10 dark:ring-blue-500/20' : ''}`}
                          >
                            <span className={`text-xs font-bold self-end ${
                              isToday ? 'bg-primary dark:bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-slate-700 dark:text-gray-400'
                            }`}>
                              {day.getDate()}
                            </span>
                            <div className="mt-1 flex-grow space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                              {dayEvents.slice(0, 3).map((event) => {
                                const themeColor = event.ministries?.theme_color || '#1E3A8A';
                                const logoUrl = getLogoUrl(event);
                                return (
                                  <div
                                    key={event.id}
                                    onMouseMove={(e) => handleMouseMove(e, event)}
                                    onMouseLeave={() => setHoveredEvent(null)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Ver detalles de ${event.title}`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedEvent(event);
                                      }
                                    }}
                                    style={{ backgroundColor: themeColor, color: '#ffffff' }}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md truncate cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5 border border-transparent shadow-2xs focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
                                  >
                                    {logoUrl ? (
                                      <img src={logoUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover bg-white dark:bg-slate-900/90" />
                                    ) : (
                                      event.emoji && <span>{event.emoji}</span>
                                    )}
                                    <span className="truncate text-white">{event.title}</span>
                                  </div>
                                );
                              })}
                              {dayEvents.length > 3 && (
                                <div className="text-[9px] text-slate-500 dark:text-gray-450 text-center font-bold">
                                  +{dayEvents.length - 3} más
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. WEEK VIEW */}
                {view === 'week' && (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {getDaysInWeek(currentDate).map((day, idx) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      const dayEvents = getEventsForDate(day);

                      return (
                        <div
                          key={idx}
                          className={`border rounded-xl p-3 min-h-[300px] flex flex-col gap-3 transition-colors ${
                            isToday ? 'border-primary dark:border-blue-500 bg-blue-50/10 dark:bg-blue-950/10' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="border-b border-gray-100 dark:border-white/5 pb-2 text-center">
                            <span className="text-xs text-slate-500 dark:text-gray-450 font-bold block uppercase tracking-wider">{WEEKDAYS[day.getDay()]}</span>
                            <span className={`text-lg font-serif font-bold mt-0.5 inline-block ${
                              isToday ? 'bg-primary dark:bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-slate-800 dark:text-gray-100'
                            }`}>
                              {day.getDate()}
                            </span>
                          </div>

                          <div className="flex-grow space-y-2 overflow-y-auto custom-scrollbar">
                            {dayEvents.length > 0 ? (
                              dayEvents.map((event) => {
                                const themeColor = event.ministries?.theme_color || '#1E3A8A';
                                const logoUrl = getLogoUrl(event);
                                return (
                                  <div
                                    key={event.id}
                                    onMouseMove={(e) => handleMouseMove(e, event)}
                                    onMouseLeave={() => setHoveredEvent(null)}
                                    onClick={() => setSelectedEvent(event)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Ver detalles de ${event.title}`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedEvent(event);
                                      }
                                    }}
                                    style={{ backgroundColor: themeColor, color: '#ffffff' }}
                                    className="p-2.5 rounded-lg border border-transparent hover:opacity-90 transition-all cursor-pointer shadow-sm space-y-1 focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
                                  >
                                    <h4 className="text-xs font-bold line-clamp-1 flex items-center gap-1.5 text-white">
                                      {logoUrl ? (
                                        <img src={logoUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover bg-white dark:bg-slate-900/80" />
                                      ) : (
                                        event.emoji && <span>{event.emoji}</span>
                                      )}
                                      <span className="truncate text-white">{event.title}</span>
                                    </h4>
                                    <div className="flex items-center gap-1 text-[10px] text-white/90 font-semibold">
                                      <Clock size={10} className="text-white/80" />
                                      <span>{formatTime(event.start_time)}</span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-slate-600 dark:text-gray-400 font-bold block text-center py-8">Sin eventos</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. DAY VIEW */}
                {view === 'day' && (
                  <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-700 rounded-2xl p-4 flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-gray-300 font-bold uppercase tracking-wider">
                        {WEEKDAYS[currentDate.getDay()]} {currentDate.getDate()} de {MONTHS[currentDate.getMonth()]}
                      </span>
                      <span className="text-xs bg-primary dark:bg-blue-600 text-white px-3 py-1 rounded-full font-bold">
                        {getEventsForDate(currentDate).length} Actividad(es)
                      </span>
                    </div>

                    <div className="space-y-3">
                      {getEventsForDate(currentDate).length > 0 ? (
                        getEventsForDate(currentDate).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Ver detalles de ${event.title}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedEvent(event);
                              }
                            }}
                            className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 hover:border-primary dark:hover:border-blue-500 transition-colors shadow-2xs flex flex-col md:flex-row justify-between md:items-center gap-4 overflow-hidden relative cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                          >
                            {event.cover_image_url && (
                              <div className="w-full md:w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/5">
                                <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="space-y-2 flex-grow">
                              <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                                {getLogoUrl(event) ? (
                                  <img src={getLogoUrl(event)!} alt="" className="w-5 h-5 rounded-full object-cover bg-gray-50 dark:bg-slate-950" />
                                ) : (
                                  event.emoji && <span className="text-xl">{event.emoji}</span>
                                )}
                                <span>{event.title}</span>
                                {event.is_recurring && (
                                  <span className="text-[9px] bg-gold/15 text-gold border border-gold/25 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    {event.recurrence_type}
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-gray-300 font-medium line-clamp-2">{event.description || 'Sin descripción detallada.'}</p>

                              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                                {event.ministries && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 font-semibold">
                                    <span
                                      style={{ backgroundColor: event.ministries.theme_color || '#1E3A8A', color: '#fff' }}
                                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                    >
                                      <Layers size={11} className="text-white" />
                                      {event.ministries.name}
                                    </span>
                                  </div>
                                )}
                                {event.leaders_in_charge && event.leaders_in_charge.length > 0 && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-450 font-semibold">
                                    <Users size={13} className="text-gold" />
                                    <span>Líderes: {event.leaders_in_charge.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-shrink-0 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-3 text-center min-w-[120px] flex md:flex-col justify-center items-center gap-1">
                              <Clock className="text-primary dark:text-white" size={16} />
                              <span className="text-xs font-bold text-primary dark:text-white block">{formatTime(event.start_time)}</span>
                              {event.end_time && (
                                <span className="text-[10px] text-slate-600 dark:text-gray-300 block font-semibold">a {formatTime(event.end_time)}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                          <AlertCircle className="mx-auto text-slate-400 mb-2" size={36} />
                          <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold">No hay actividades programadas para este día.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. YEAR VIEW */}
                {view === 'year' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {MONTHS.map((monthName, mIdx) => {
                      const year = currentDate.getFullYear();
                      const firstDay = new Date(year, mIdx, 1);
                      const lastDay = new Date(year, mIdx + 1, 0);
                      const days: Date[] = [];

                      // Padding previous days
                      const startOfWeek = firstDay.getDay();
                      for (let i = startOfWeek; i > 0; i--) {
                        days.push(new Date(year, mIdx, 1 - i));
                      }
                      // Current month days
                      for (let i = 1; i <= lastDay.getDate(); i++) {
                        days.push(new Date(year, mIdx, i));
                      }

                      return (
                        <div
                          key={mIdx}
                          onClick={() => {
                            const newDate = new Date(currentDate.getFullYear(), mIdx, 1);
                            setCurrentDate(newDate);
                            setView('month');
                          }}
                          className="border border-gray-100 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-slate-900 space-y-2 shadow-2xs hover:border-primary dark:hover:border-blue-500 cursor-pointer hover:shadow-xs transition-all duration-200"
                        >
                          <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-200 text-center border-b border-gray-100 dark:border-white/5 pb-1.5 hover:text-primary dark:hover:text-blue-400 transition-colors">{monthName}</h3>
                          <div className="grid grid-cols-7 gap-0.5 text-[9px] text-center font-bold text-slate-400">
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                              <div key={i}>{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center font-medium">
                            {days.map((day, dIdx) => {
                              const isCurrentMonth = day.getMonth() === mIdx;
                              const hasEvents = isCurrentMonth && getEventsForDate(day).length > 0;
                              return (
                                <div
                                  key={dIdx}
                                  className={`py-0.5 rounded-full ${!isCurrentMonth
                                    ? 'text-gray-250 dark:text-gray-700'
                                    : hasEvents
                                      ? 'bg-primary dark:bg-blue-600 text-white font-bold'
                                      : 'text-slate-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                  title={hasEvents ? `${getEventsForDate(day).length} eventos` : undefined}
                                >
                                  {day.getDate()}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </AnimeFadeUp>
          )}
        </div>
      </div>

      {/* Floating Tooltip Component */}
      {hoveredEvent && (
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.y,
            left: tooltipPos.x,
            pointerEvents: 'none',
            zIndex: 9999
          }}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg p-4 max-w-xs space-y-2.5 backdrop-blur-md transition-opacity"
        >
          <div className="border-b border-gray-100 dark:border-white/5 pb-1.5">
            <span className="text-[9px] bg-gold/15 text-gold border border-gold/25 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Actividad</span>
            {hoveredEvent.cover_image_url && (
              <img src={hoveredEvent.cover_image_url} alt="" className="w-full h-24 rounded-lg object-cover mt-1.5 border border-gray-100 dark:border-white/5" />
            )}
            <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-100 mt-1.5 flex items-center gap-1.5">
              {hoveredEvent.emoji && <span className="text-base">{hoveredEvent.emoji}</span>}
              {hoveredEvent.title}
            </h3>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-primary dark:text-white" />
              <span>Horario: {formatTime(hoveredEvent.start_time)} {hoveredEvent.end_time && ` - ${formatTime(hoveredEvent.end_time)}`}</span>
            </div>
            {hoveredEvent.ministries && (
              <div className="flex items-center gap-1.5">
                <Layers size={11} className="text-primary dark:text-white" />
                <span>Área: {hoveredEvent.ministries.name}</span>
              </div>
            )}
            {hoveredEvent.leaders_in_charge && hoveredEvent.leaders_in_charge.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Users size={11} className="text-primary dark:text-white mt-0.5" />
                <span>Encargado: {hoveredEvent.leaders_in_charge.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Details Overlay (Modal / Drawer) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedEvent(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer animate-fade-in"
          />

          {/* Modal View */}
          {detailViewType === 'modal' ? (
            <AnimeZoomIn className="relative z-10 max-w-lg w-full mx-4 max-h-[90vh]">
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Detalles de actividad: ${selectedEvent.title}`}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full overflow-hidden border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Cerrar detalle de actividad"
                  className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-colors z-20 shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${selectedEvent.cover_image_url
                    ? 'bg-black/20 hover:bg-black/40 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300'
                    }`}
                  type="button"
                >
                  <X size={18} />
                </button>

                {/* Banner */}
                {selectedEvent.cover_image_url ? (
                  <div className="relative w-full h-48 md:h-52 overflow-hidden flex-shrink-0">
                    <img src={selectedEvent.cover_image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 text-white text-left">
                      <span
                        style={{ backgroundColor: selectedEvent.ministries?.theme_color || '#1E3A8A', color: '#ffffff' }}
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs"
                      >
                        {getLogoUrl(selectedEvent) && (
                          <img src={getLogoUrl(selectedEvent)!} alt="" className="w-3.5 h-3.5 rounded-full object-cover bg-white dark:bg-slate-900/95" />
                        )}
                        {selectedEvent.ministries?.name || 'General'}
                      </span>
                      <h2 className="text-xl md:text-2xl font-serif font-bold mt-1.5 flex items-center gap-2">
                        {getLogoUrl(selectedEvent) ? (
                          <img src={getLogoUrl(selectedEvent)!} alt="" className="w-6 h-6 rounded-full object-cover bg-white dark:bg-slate-900 shadow-sm" />
                        ) : (
                          selectedEvent.emoji && <span className="text-2xl">{selectedEvent.emoji}</span>
                        )}
                        <span>{selectedEvent.title}</span>
                      </h2>
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary p-6 text-white relative text-left flex-shrink-0">
                    <span
                      style={{ backgroundColor: selectedEvent.ministries?.theme_color || '#1E3A8A', color: '#ffffff' }}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs"
                    >
                      {getLogoUrl(selectedEvent) && (
                        <img src={getLogoUrl(selectedEvent)!} alt="" className="w-3.5 h-3.5 rounded-full object-cover bg-white dark:bg-slate-900/95" />
                      )}
                      {selectedEvent.ministries?.name || 'General'}
                    </span>
                    <h2 className="text-xl md:text-2xl font-serif font-bold mt-1.5 flex items-center gap-2">
                      {getLogoUrl(selectedEvent) ? (
                        <img src={getLogoUrl(selectedEvent)!} alt="" className="w-6 h-6 rounded-full object-cover bg-white dark:bg-slate-900 shadow-sm" />
                      ) : (
                        selectedEvent.emoji && <span className="text-2xl">{selectedEvent.emoji}</span>
                      )}
                      <span>{selectedEvent.title}</span>
                    </h2>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-gray-300 bg-gray-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={14} className="text-gold flex-shrink-0" />
                        <span>{formatEventDateRange(selectedEvent.start_date, selectedEvent.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gold flex-shrink-0" />
                        <span>
                          {formatTime(selectedEvent.start_time)}
                          {selectedEvent.end_time && ` a ${formatTime(selectedEvent.end_time)}`}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedEvent.is_recurring && (
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-gold flex-shrink-0" />
                          <span>
                            Recurrencia: <span className="font-bold text-primary dark:text-blue-400">{getRecurrenceText(selectedEvent)}</span>
                          </span>
                        </div>
                      )}
                      {selectedEvent.leaders_in_charge && selectedEvent.leaders_in_charge.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Users size={14} className="text-gold mt-0.5 flex-shrink-0" />
                          <span>
                            Encargados: <span className="font-bold text-gray-800 dark:text-gray-205">{selectedEvent.leaders_in_charge.join(', ')}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold">Descripción de la Actividad</h4>
                    <p className="text-gray-650 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                      {selectedEvent.description || 'No hay descripción detallada provista para esta actividad.'}
                    </p>
                  </div>
                  </div>

                  {/* Footer Switcher */}
                  <div className="border-t border-gray-155 dark:border-white/10 p-4 bg-gray-50 dark:bg-slate-800 flex items-center justify-between text-xs text-slate-650 dark:text-gray-400 font-semibold flex-shrink-0 mt-auto">
                    <span>Presentación:</span>
                    <div className="flex bg-gray-250 dark:bg-slate-900 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDetailViewType('modal')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${(detailViewType as string) === 'modal' ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                      >
                        Modal
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailViewType('drawer')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${(detailViewType as string) === 'drawer' ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                      >
                        Lateral
                      </button>
                    </div>
                  </div>
                </div>
              </AnimeZoomIn>
            ) : (
              /* Drawer View */
              <AnimeFadeUp className="absolute top-0 right-0 h-full max-w-md w-full z-10">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Detalles de actividad: ${selectedEvent.title}`}
                  className="h-full w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-gray-150 dark:border-white/10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                {/* Header/Banner */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    aria-label="Cerrar detalle de actividad"
                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-colors z-20 shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${selectedEvent.cover_image_url
                      ? 'bg-black/20 hover:bg-black/40 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300'
                      }`}
                    type="button"
                  >
                    <X size={18} />
                  </button>

                  {selectedEvent.cover_image_url ? (
                    <div className="w-full h-48 md:h-56 overflow-hidden">
                      <img src={selectedEvent.cover_image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="absolute bottom-4 left-6 right-6 text-white">
                        <span
                          style={{ backgroundColor: selectedEvent.ministries?.theme_color || '#1E3A8A', color: '#ffffff' }}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs"
                        >
                          {getLogoUrl(selectedEvent) && (
                            <img src={getLogoUrl(selectedEvent)!} alt="" className="w-3.5 h-3.5 rounded-full object-cover bg-white dark:bg-slate-900/95" />
                          )}
                          {selectedEvent.ministries?.name || 'General'}
                        </span>
                        <h2 className="text-lg md:text-xl font-serif font-bold mt-1 flex items-center gap-2">
                          {getLogoUrl(selectedEvent) ? (
                            <img src={getLogoUrl(selectedEvent)!} alt="" className="w-5 h-5 rounded-full object-cover bg-white dark:bg-slate-900 shadow-sm" />
                          ) : (
                            selectedEvent.emoji && <span className="text-xl">{selectedEvent.emoji}</span>
                          )}
                          {selectedEvent.title}
                        </h2>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-primary p-6 pt-16 text-white relative">
                      <span
                        style={{ backgroundColor: selectedEvent.ministries?.theme_color || '#1E3A8A', color: '#ffffff' }}
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-xs"
                      >
                        {getLogoUrl(selectedEvent) && (
                          <img src={getLogoUrl(selectedEvent)!} alt="" className="w-3.5 h-3.5 rounded-full object-cover bg-white dark:bg-slate-900/95" />
                        )}
                        {selectedEvent.ministries?.name || 'General'}
                      </span>
                      <h2 className="text-lg md:text-xl font-serif font-bold mt-1 flex items-center gap-2">
                        {getLogoUrl(selectedEvent) ? (
                          <img src={getLogoUrl(selectedEvent)!} alt="" className="w-5 h-5 rounded-full object-cover bg-white dark:bg-slate-900 shadow-sm" />
                        ) : (
                          selectedEvent.emoji && <span className="text-xl">{selectedEvent.emoji}</span>
                        )}
                        {selectedEvent.title}
                      </h2>
                    </div>
                  )}
                </div>

                {/* Scrollable details */}
                <div className="p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                  <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-gray-300 bg-gray-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <CalendarIcon size={15} className="text-gold flex-shrink-0" />
                      <span>{formatEventDateRange(selectedEvent.start_date, selectedEvent.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock size={15} className="text-gold flex-shrink-0" />
                      <span>
                        {formatTime(selectedEvent.start_time)}
                        {selectedEvent.end_time && ` a ${formatTime(selectedEvent.end_time)}`}
                      </span>
                    </div>
                    {selectedEvent.is_recurring && (
                      <div className="flex items-center gap-2.5">
                        <CalendarDays size={15} className="text-gold flex-shrink-0" />
                        <span>
                          Recurrencia: <span className="font-bold text-primary dark:text-blue-400">{getRecurrenceText(selectedEvent)}</span>
                        </span>
                      </div>
                    )}
                    {selectedEvent.leaders_in_charge && selectedEvent.leaders_in_charge.length > 0 && (
                      <div className="flex items-start gap-2.5">
                        <Users size={15} className="text-gold mt-0.5 flex-shrink-0" />
                        <span>
                          Encargados: <span className="font-bold text-gray-800 dark:text-gray-250">{selectedEvent.leaders_in_charge.join(', ')}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold">Descripción de la Actividad</h4>
                    <p className="text-gray-650 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                      {selectedEvent.description || 'No hay descripción detallada provista para esta actividad.'}
                    </p>
                  </div>
                </div>

                {/* Footer Switcher */}
                <div className="border-t border-gray-150 dark:border-white/10 p-4 bg-gray-50 dark:bg-slate-800 flex items-center justify-between text-xs text-gray-50 dark:text-gray-400 font-semibold flex-shrink-0 mt-auto">
                  <span>Presentación:</span>
                  <div className="flex bg-gray-200 dark:bg-slate-900 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDetailViewType('modal')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${(detailViewType as string) === 'modal' ? 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-xs font-bold' : 'text-gray-550 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                    >
                      Modal
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailViewType('drawer')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${(detailViewType as string) === 'drawer' ? 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-xs font-bold' : 'text-gray-550 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                    >
                      Lateral
                    </button>
                  </div>
                </div>
                </div>
              </AnimeFadeUp>
            )}
          </div>
        )}
    </div>
  );
};

export default Events;
