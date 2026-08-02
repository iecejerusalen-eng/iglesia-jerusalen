import { CalendarDays, Clock3, MapPin, Repeat2 } from 'lucide-react';
import type { Event as DbEvent } from '../../../types';
import {
  formatEventDateRange,
  formatEventDayBadge,
  formatEventTime,
  getEventStatus,
} from '../utils/eventPresentation';

interface PublicEventCardProps {
  event: DbEvent;
  onSelect: (event: DbEvent) => void;
  featured?: boolean;
}

const STATUS_LABELS = {
  today: 'Sucede hoy',
  upcoming: 'Próximo',
  past: 'Finalizado',
} as const;

export default function PublicEventCard({ event, onSelect, featured = false }: PublicEventCardProps) {
  const badge = formatEventDayBadge(event.start_date);
  const status = getEventStatus(event);
  const accentColor = event.ministries?.theme_color || '#1e3a8a';

  return (
    <article className={`group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900 ${featured ? 'md:grid md:grid-cols-[1.05fr_1fr]' : ''}`}>
      <button
        type="button"
        onClick={() => onSelect(event)}
        className="absolute inset-0 z-20 rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        aria-label={`Ver detalles de ${event.title}`}
      />

      <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${featured ? 'min-h-64 md:min-h-full' : 'aspect-[16/9]'}`}>
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.3),_transparent_45%),linear-gradient(135deg,#172554,#4338ca)]">
            <span className="text-6xl drop-shadow-lg" aria-hidden="true">{event.emoji || '📅'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] shadow-sm backdrop-blur-md ${status === 'today' ? 'bg-amber-400 text-slate-950' : status === 'past' ? 'bg-slate-900/70 text-white' : 'bg-white/90 text-indigo-950'}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 flex items-end gap-3 text-white">
          <div className="rounded-2xl bg-white/95 px-3 py-2 text-center text-slate-950 shadow-lg backdrop-blur">
            <span className="block text-[10px] font-black tracking-[0.14em] text-indigo-600">{badge.month}</span>
            <span className="block text-2xl font-black leading-none">{badge.day}</span>
          </div>
          <span className="mb-1 text-xs font-bold uppercase tracking-wider text-white/80">{badge.weekday}</span>
        </div>
      </div>

      <div className={`relative flex flex-col ${featured ? 'p-7 md:p-9' : 'p-5'}`}>
        <div className="mb-3 flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {event.ministries?.name || 'Iglesia Jerusalén'}
          </span>
        </div>

        <h3 className={`font-serif font-black leading-tight text-slate-950 dark:text-white ${featured ? 'text-3xl' : 'text-xl'}`}>
          {event.emoji && <span className="mr-2" aria-hidden="true">{event.emoji}</span>}
          {event.title}
        </h3>

        {event.description && (
          <p className={`mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 ${featured ? 'line-clamp-4' : 'line-clamp-2'}`}>
            {event.description}
          </p>
        )}

        <div className="mt-5 space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={15} className="shrink-0 text-indigo-600 dark:text-indigo-300" />
            <span>{formatEventDateRange(event.start_date, event.end_date)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock3 size={15} className="shrink-0 text-indigo-600 dark:text-indigo-300" />
            <span>{formatEventTime(event.start_time, event.end_time)}</span>
          </div>
          {event.location_name && (
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="shrink-0 text-indigo-600 dark:text-indigo-300" />
              <span className="line-clamp-1">{event.location_name}</span>
            </div>
          )}
          {event.is_recurring && (
            <div className="flex items-center gap-2.5">
              <Repeat2 size={15} className="shrink-0 text-indigo-600 dark:text-indigo-300" />
              <span>Actividad recurrente</span>
            </div>
          )}
        </div>

        <span className="mt-6 inline-flex items-center text-sm font-black text-indigo-700 transition group-hover:gap-3 dark:text-indigo-300">
          Ver información <span aria-hidden="true" className="ml-2">→</span>
        </span>
      </div>
    </article>
  );
}

