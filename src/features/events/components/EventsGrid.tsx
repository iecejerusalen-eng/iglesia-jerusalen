
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { Edit2, Trash2, Clock, Calendar, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Event as DbEvent } from '../../../types';

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
        <AnimeFadeUp key={event.id} delay={index * 0.05} className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-md transition-all overflow-hidden relative">
          <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(event)}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur text-gray-600 dark:text-gray-300 hover:text-primary p-2 rounded-xl shadow-sm hover:scale-105 transition-all cursor-pointer"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(event.id)}
              disabled={actionLoading}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur text-gray-600 dark:text-gray-300 hover:text-accent-red p-2 rounded-xl shadow-sm hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="relative aspect-[16/9] w-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
            {event.cover_image_url ? (
              <img 
                loading="lazy"
                src={event.cover_image_url}
                alt={event.title}
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
              {event.is_public && (
                <span className="px-2 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-wider text-green-600 shadow-sm">
                  Público
                </span>
              )}
              {event.ministries && (
                <span className="px-2 py-1 bg-primary/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  {event.ministries.name}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 pt-6 flex-1 flex flex-col">
            <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">{event.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
              {event.description || 'Sin descripción'}
            </p>

            <div className="space-y-2 mt-auto">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <Calendar size={14} className="text-gold" />
                <span>{event.start_date} {event.end_date !== event.start_date && `- ${event.end_date}`}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <Clock size={14} className="text-gold" />
                <span>
                  {event.start_time || 'Todo el día'} 
                  {event.end_time && ` - ${event.end_time}`}
                </span>
              </div>
              
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
