
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { Edit2, Trash2, Clock, Calendar, Loader2, Image as ImageIcon, Eye, EyeOff, MapPin } from 'lucide-react';
import type { Event as DbEvent } from '../../../types';
import { formatEventDateRange, formatEventTime, getEventStatus } from '../utils/eventPresentation';

interface EventsGridProps {
  events: DbEvent[];
  loading: boolean;
  actionLoading: boolean;
  onEdit: (event: DbEvent) => void;
  onDelete: (id: string) => void;
}

export default function EventsGrid({ events, loading, actionLoading, onEdit, onDelete }: EventsGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-xs">
        <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">No hay eventos programados</h3>
        <p className="text-gray-400 text-sm mt-1 font-medium">Comienza agregando un nuevo evento al calendario.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event, index) => (
        <AnimeFadeUp key={event.id} delay={index * 0.05} className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900">
          <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur text-gray-600 dark:text-gray-300 hover:text-primary p-2 rounded-xl shadow-sm hover:scale-105 transition-all cursor-pointer"
              aria-label={`Editar ${event.title}`}
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              disabled={actionLoading}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur text-gray-600 dark:text-gray-300 hover:text-accent-red p-2 rounded-xl shadow-sm hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
              aria-label={`Eliminar ${event.title}`}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="relative aspect-[16/9] w-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
            {event.cover_image_url ? (
              <img 
                loading="lazy"
                src={event.cover_image_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <ImageIcon size={32} />
              </div>
            )}
            
            {event.emoji && (
              <div className="absolute -bottom-4 left-4 w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-xl border border-gray-100 dark:border-white/10">
                {event.emoji}
              </div>
            )}
            
            <div className="absolute top-3 left-3 flex gap-2">
              <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur ${event.is_public !== false ? 'bg-white/90 text-emerald-700 dark:bg-slate-800/90 dark:text-emerald-300' : 'bg-amber-50/95 text-amber-700 dark:bg-slate-800/90 dark:text-amber-300'}`}>
                {event.is_public !== false ? <Eye size={11} /> : <EyeOff size={11} />}
                {event.is_public !== false ? 'Público' : 'Borrador'}
              </span>
              {event.ministries && (
                <span className="px-2 py-1 bg-primary/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  {event.ministries.name}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 pt-6 flex-1 flex flex-col">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h4 className="line-clamp-2 font-bold text-gray-900 dark:text-white">{event.title}</h4>
              {getEventStatus(event) === 'past' && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500 dark:bg-white/5">Finalizado</span>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
              {event.description || 'Sin descripción'}
            </p>

            <div className="space-y-2 mt-auto">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <Calendar size={14} className="text-gold" />
                <span>{formatEventDateRange(event.start_date, event.end_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <Clock size={14} className="text-gold" />
                <span>
                  {formatEventTime(event.start_time, event.end_time)}
                </span>
              </div>
              {event.location_name && (
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <MapPin size={14} className="text-gold" />
                  <span className="truncate">{event.location_name}</span>
                </div>
              )}
              
              {event.is_recurring && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                  <span className="inline-block text-[10px] bg-gold/15 text-gold border border-gold/25 px-2 py-1 rounded font-bold uppercase tracking-wider">
                    Recurrente: {event.recurrence_type}
                  </span>
                </div>
              )}
            </div>
          </div>
        </AnimeFadeUp>
      ))}
    </div>
  );
}
