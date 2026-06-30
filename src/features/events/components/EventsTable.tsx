
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { Loader2, Calendar, Clock, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Event as DbEvent } from '../../../types';

interface EventsTableProps {
  events: DbEvent[];
  loading: boolean;
  actionLoading: boolean;
  onEdit: (event: DbEvent) => void;
  onDelete: (id: string) => void;
}

export default function EventsTable({ events, loading, actionLoading, onEdit, onDelete }: EventsTableProps) {
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
    <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
              <th className="py-4 px-6">Evento</th>
              <th className="py-4 px-6">Fecha y Horarios</th>
              <th className="py-4 px-6">Ministerio</th>
              <th className="py-4 px-6">Líderes</th>
              <th className="py-4 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-750 dark:text-gray-300">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    {event.cover_image_url ? (
                      <img loading="lazy"
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-12 h-10 rounded-lg object-cover border border-gray-100 dark:border-white/5 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-10 bg-gray-50 dark:bg-slate-950 text-gray-300 rounded-lg border border-dashed flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={16} />
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-gray-800 dark:text-gray-100 block flex items-center gap-1.5">
                        {event.emoji && <span className="text-sm">{event.emoji}</span>}
                        {event.title}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 block max-w-xs truncate">{event.description || 'Sin descripción'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                    <Calendar size={12} className="text-gold" />
                    {event.start_date}
                    {event.is_recurring && (
                      <span className="text-[9px] bg-gold/15 text-gold border border-gold/25 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1.5">
                        {event.recurrence_type}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 block font-bold flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-gold" />
                    {event.start_time || 'Todo el día'}
                  </span>
                </td>
                <td className="py-4 px-6 font-semibold">
                  {event.ministries ? (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-primary border border-blue-100">
                      {event.ministries.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">General</span>
                  )}
                </td>
                <td className="py-4 px-6 text-gray-500 dark:text-gray-450 font-semibold">
                  {Array.isArray(event.leaders_in_charge) && event.leaders_in_charge.length > 0 ? (
                    <span className="text-xs font-semibold">{event.leaders_in_charge.join(', ')}</span>
                  ) : event.leaders_in_charge && typeof event.leaders_in_charge === 'string' ? (
                    <span className="text-xs font-semibold">{event.leaders_in_charge}</span>
                  ) : (
                    <span className="text-gray-300 text-xs">Ninguno</span>
                  )}
                </td>
                <td className="py-4 px-6 text-right space-x-1.5">
                  <button
                    onClick={() => onEdit(event)}
                    className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(event.id)}
                    disabled={actionLoading}
                    className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AnimeFadeUp>
  );
}
