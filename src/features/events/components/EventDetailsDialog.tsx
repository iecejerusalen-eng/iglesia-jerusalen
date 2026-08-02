import { useEffect } from 'react';
import { CalendarPlus, CalendarRange, Clock3, MapPin, Repeat2, UserRound, X } from 'lucide-react';
import type { Event as DbEvent } from '../../../types';
import { ShowRouteButton } from '@/components/map/ShowRouteButton';
import { formatEventDateRange, formatEventTime } from '../utils/eventPresentation';

interface EventDetailsDialogProps {
  event: DbEvent;
  onClose: () => void;
}

function toGoogleCalendarDate(date: string, time: string | null): string {
  if (!time) return date.replaceAll('-', '');
  const normalizedTime = time.replaceAll(':', '').slice(0, 4);
  return `${date.replaceAll('-', '')}T${normalizedTime}00`;
}

function buildGoogleCalendarUrl(event: DbEvent): string {
  const start = toGoogleCalendarDate(event.start_date, event.start_time);
  const hasSchedule = Boolean(event.start_time);
  const calendarEndDate = hasSchedule
    ? event.end_date
    : (() => {
        const [year, month, day] = event.end_date.split('-').map(Number);
        const nextDay = new Date(year, month - 1, day + 1);
        return `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
      })();
  const end = toGoogleCalendarDate(calendarEndDate, event.end_time || event.start_time);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: event.location_name || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function EventDetailsDialog({ event, onClose }: EventDetailsDialogProps) {
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const hasDestination = event.latitude != null && event.longitude != null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={(mouseEvent) => {
      if (mouseEvent.target === mouseEvent.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-title"
        className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-slate-950 sm:rounded-[2rem]"
      >
        <div className="relative min-h-56 overflow-hidden bg-slate-900 sm:min-h-72">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.55),_transparent_42%),linear-gradient(135deg,#0f172a,#312e81)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

          <button type="button" onClick={onClose} aria-label="Cerrar detalles" className="absolute right-4 top-4 z-10 rounded-full bg-black/35 p-2.5 text-white backdrop-blur-md transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <X size={20} />
          </button>

          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-md">
              {event.ministries?.name || 'Iglesia Jerusalén'}
            </span>
            <h2 id="event-detail-title" className="mt-3 max-w-3xl font-serif text-3xl font-black leading-tight sm:text-5xl">
              {event.emoji && <span className="mr-3" aria-hidden="true">{event.emoji}</span>}
              {event.title}
            </h2>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <CalendarRange size={18} className="text-indigo-600 dark:text-indigo-300" />
                <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">Fecha</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatEventDateRange(event.start_date, event.end_date)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <Clock3 size={18} className="text-indigo-600 dark:text-indigo-300" />
                <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">Horario</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatEventTime(event.start_time, event.end_time)}</p>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Sobre esta actividad</p>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-600 dark:text-slate-300">
                {event.description || 'Pronto compartiremos más información sobre esta actividad.'}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {event.is_recurring && (
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Repeat2 size={14} /> Evento recurrente
                </span>
              )}
              {event.leaders_in_charge?.map((leader) => (
                <span key={leader} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-white/5 dark:text-slate-300">
                  <UserRound size={14} /> {leader}
                </span>
              ))}
            </div>
          </div>

          <aside className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Planifica tu visita</p>
            {event.location_name && (
              <div className="flex items-start gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <MapPin size={17} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                <span>{event.location_name}</span>
              </div>
            )}

            <a
              href={buildGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <CalendarPlus size={17} /> Agregar al calendario
            </a>

            {hasDestination && (
              <ShowRouteButton
                destination={{
                  lat: event.latitude as number,
                  lng: event.longitude as number,
                  name: event.location_name || event.title,
                  address: event.location_name || 'Milagro, Ecuador',
                }}
                origin={event.origin_lat != null && event.origin_lng != null ? {
                  lat: event.origin_lat,
                  lng: event.origin_lng,
                  name: event.origin_name || 'Punto de partida',
                } : undefined}
                title={`Ruta hacia ${event.title}`}
                label="Ver ruta / Cómo llegar"
                variant="outline"
                size="md"
                className="w-full"
              />
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
