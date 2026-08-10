import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FileDown,
  LayoutGrid,
  List,
  Search,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Event as DbEvent } from '../../types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import CalendarPdfDialog from '../../components/common/CalendarPdfDialog';
import PublicEventCard from '../../features/events/components/PublicEventCard';
import EventDetailsDialog from '../../features/events/components/EventDetailsDialog';
import CalendarEventBadge from '../../features/events/components/CalendarEventBadge';
import {
  compareEventsChronologically,
  eventOccursOnDate,
  formatEventDayBadge,
  getEventStatus,
  getLocalDateKey,
} from '../../features/events/utils/eventPresentation';
import { exportEventsPdf } from '../../utils/calendarPdfExport';

type PublicView = 'calendar' | 'agenda';
type StatusFilter = 'all' | 'upcoming' | 'past';

const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

function getCalendarDays(date: Date): Date[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function getMonthTitle(date: Date): string {
  return new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(date);
}

const Events = () => {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<PublicView>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, ministries(name, slug, theme_color)')
        .eq('is_public', true)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: unknown) {
      console.error('Error fetching public events:', error);
      setLoadError('No pudimos cargar el calendario. Intenta nuevamente en unos momentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchEvents();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchEvents]);

  const ministries = useMemo(() => {
    const ministryMap = new Map<string, string>();
    events.forEach((event) => {
      if (event.ministry_id && event.ministries?.name) {
        ministryMap.set(event.ministry_id, event.ministries.name);
      }
    });
    return Array.from(ministryMap, ([id, name]) => ({ id, name })).sort((first, second) => first.name.localeCompare(second.name));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('es');
    return events
      .filter((event) => {
        if (selectedMinistry !== 'all' && event.ministry_id !== selectedMinistry) return false;

        const status = getEventStatus(event);
        if (statusFilter === 'upcoming' && status === 'past') return false;
        if (statusFilter === 'past' && status !== 'past') return false;

        if (!normalizedQuery) return true;
        return [event.title, event.description, event.location_name, event.ministries?.name]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLocaleLowerCase('es').includes(normalizedQuery));
      })
      .sort(compareEventsChronologically);
  }, [events, searchQuery, selectedMinistry, statusFilter]);

  const upcomingEvents = useMemo(
    () => events.filter((event) => getEventStatus(event) !== 'past').sort(compareEventsChronologically),
    [events],
  );
  const featuredEvent = upcomingEvents[0] || null;
  const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);
  const currentMonthEvents = filteredEvents.filter((event) => {
    const monthStart = getLocalDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const monthEnd = getLocalDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    return event.end_date >= monthStart && event.start_date <= monthEnd;
  });

  const changeMonth = (offset: number) => {
    setCurrentDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMinistry('all');
    setStatusFilter('all');
  };

  const handleExportPdf = (orientation: 'portrait' | 'landscape', viewMode: 'cards' | 'table' = 'cards') => {
    exportEventsPdf(filteredEvents, {
      viewMode,
      orientation,
      filterLabel: `${getMonthTitle(currentDate)} · ${filteredEvents.length} actividades`,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-24 pt-24 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section id="events_hero" className="relative overflow-hidden border-b border-slate-200/80 bg-white dark:border-white/5 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(79,70,229,0.15),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(245,158,11,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-20">
          <AnimeFadeUp className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Sparkles size={13} /> Vida en comunidad
              </div>
              <h1 className="mt-5 font-serif text-4xl font-black tracking-tight text-slate-950 sm:text-6xl dark:text-white">
                Siempre hay un lugar para ti.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Descubre cultos, encuentros y actividades de Iglesia Jerusalén. Filtra la agenda, guarda la fecha y consulta cómo llegar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{upcomingEvents.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Próximas</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{ministries.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Áreas</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:col-span-1 dark:border-white/10 dark:bg-white/5">
                <p className="text-2xl font-black text-amber-500">{events.filter((event) => getEventStatus(event) === 'today').length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Hoy</p>
              </div>
            </div>
          </AnimeFadeUp>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-5 py-10 sm:px-8 sm:py-14">
        {loading ? (
          <div className="grid animate-pulse gap-5 lg:grid-cols-3">
            <div className="h-80 rounded-[2rem] bg-slate-200 lg:col-span-2 dark:bg-slate-800" />
            <div className="h-80 rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : loadError ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
            <CalendarRange className="mx-auto text-red-500" size={34} />
            <h2 className="mt-4 text-lg font-black">El calendario no está disponible</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{loadError}</p>
            <button type="button" onClick={() => void fetchEvents()} className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white dark:bg-white dark:text-slate-950">
              Intentar de nuevo
            </button>
          </section>
        ) : (
          <>
            {featuredEvent && (
              <section id="events_upcoming" aria-labelledby="next-event-heading">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">No te lo pierdas</p>
                    <h2 id="next-event-heading" className="mt-1 font-serif text-3xl font-black">Próxima actividad</h2>
                  </div>
                </div>
                <PublicEventCard event={featuredEvent} featured onSelect={setSelectedEvent} />
              </section>
            )}

            <section id="events_calendar" aria-labelledby="events-calendar-heading" className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Explora y participa</p>
                  <h2 id="events-calendar-heading" className="mt-1 font-serif text-3xl font-black sm:text-4xl">Calendario de actividades</h2>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <button type="button" onClick={() => setView('calendar')} aria-pressed={view === 'calendar'} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${view === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}>
                    <LayoutGrid size={15} /> Calendario
                  </button>
                  <button type="button" onClick={() => setView('agenda')} aria-pressed={view === 'agenda'} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${view === 'agenda' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}>
                    <List size={15} /> Agenda
                  </button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                  <label className="relative block">
                    <span className="sr-only">Buscar eventos</span>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar evento, lugar o ministerio" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950" />
                  </label>
                  <select value={selectedMinistry} onChange={(event) => setSelectedMinistry(event.target.value)} aria-label="Filtrar por ministerio" className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950">
                    <option value="all">Todos los ministerios</option>
                    {ministries.map((ministry) => <option key={ministry.id} value={ministry.id}>{ministry.name}</option>)}
                  </select>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filtrar por fecha" className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950">
                    <option value="all">Todas las fechas</option>
                    <option value="upcoming">Próximas</option>
                    <option value="past">Finalizadas</option>
                  </select>
                  <button type="button" onClick={() => setShowPdfDialog(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
                    <FileDown size={16} /> Exportar
                  </button>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-white/15 dark:bg-slate-900">
                  <CalendarDays className="mx-auto text-slate-300 dark:text-slate-600" size={42} />
                  <h3 className="mt-4 text-lg font-black">No encontramos actividades</h3>
                  <p className="mt-2 text-sm text-slate-500">Prueba con otra búsqueda o limpia los filtros.</p>
                  <button type="button" onClick={resetFilters} className="mt-5 text-sm font-black text-indigo-700 hover:underline dark:text-indigo-300">Limpiar filtros</button>
                </div>
              ) : view === 'agenda' ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredEvents.map((event) => <PublicEventCard key={event.id} event={event} onSelect={setSelectedEvent} />)}
                </div>
              ) : (
                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setCurrentDate(new Date())} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">Hoy</button>
                      <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5"><ChevronLeft size={19} /></button>
                      <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5"><ChevronRight size={19} /></button>
                    </div>
                    <h3 className="font-serif text-xl font-black capitalize">{getMonthTitle(currentDate)}</h3>
                    <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{currentMonthEvents.length} actividades</span>
                  </div>

                  <div className="hidden grid-cols-7 border-b border-slate-200 bg-slate-50 md:grid dark:border-white/10 dark:bg-white/[0.025]">
                    {WEEKDAYS.map((weekday) => <div key={weekday} className="px-2 py-3 text-center text-[10px] font-black tracking-[0.15em] text-slate-400">{weekday}</div>)}
                  </div>

                  <div className="hidden grid-cols-7 md:grid">
                    {calendarDays.map((day) => {
                      const dayEvents = filteredEvents.filter((event) => eventOccursOnDate(event, day));
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isToday = getLocalDateKey(day) === getLocalDateKey(new Date());
                      return (
                        <div key={getLocalDateKey(day)} className={`min-h-32 border-b border-r border-slate-100 p-2.5 dark:border-white/5 ${isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 text-slate-300 dark:bg-slate-950/50 dark:text-slate-600'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`flex size-7 items-center justify-center rounded-full text-xs font-black ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : ''}`}>{day.getDate()}</span>
                            {dayEvents.length > 0 && <span className="text-[9px] font-bold text-slate-400">{dayEvents.length}</span>}
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {dayEvents.slice(0, 3).map((event) => (
                              <CalendarEventBadge 
                                key={event.id} 
                                event={event} 
                                onClick={() => setSelectedEvent(event)} 
                              />
                            ))}
                            {dayEvents.length > 3 && <p className="px-2 text-[9px] font-black text-slate-400">+{dayEvents.length - 3} más</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 p-4 md:hidden">
                    {currentMonthEvents.length > 0 ? currentMonthEvents.map((event) => {
                      const badge = formatEventDayBadge(event.start_date);
                      return (
                        <button key={event.id} type="button" onClick={() => setSelectedEvent(event)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-3 text-left transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                          <span className="min-w-14 rounded-xl bg-indigo-50 px-2 py-2 text-center dark:bg-indigo-500/10">
                            <span className="block text-[9px] font-black text-indigo-600 dark:text-indigo-300">{badge.month}</span>
                            <span className="block text-xl font-black">{badge.day}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black">{event.emoji} {event.title}</span>
                            <span className="mt-1 block truncate text-xs text-slate-500">{event.ministries?.name || 'Iglesia Jerusalén'}</span>
                          </span>
                        </button>
                      );
                    }) : <p className="py-8 text-center text-sm text-slate-500">No hay actividades visibles este mes.</p>}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {selectedEvent && <EventDetailsDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {showPdfDialog && <CalendarPdfDialog title="Exportar calendario" onClose={() => setShowPdfDialog(false)} onExport={handleExportPdf} />}
    </main>
  );
};

export default Events;
