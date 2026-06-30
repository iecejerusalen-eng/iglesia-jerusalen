import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../../components/animations/AnimeWrappers';
import type { Event as DbEvent } from '../../../types';
import type { PageSection } from '../types';

interface EventsSectionProps {
  sectionData: PageSection;
  events: DbEvent[];
  loading: boolean;
}

export const EventsSection = ({ sectionData, events, loading }: EventsSectionProps) => {
  const { title, subtitle } = sectionData;

  const formatEventDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const formatted = date.toLocaleDateString('es-ES', options).toUpperCase();
    const parts = formatted.split(' ');
    return {
      day: parts[0] || date.getDate().toString(),
      month: parts[parts.length - 1] || 'ENE'
    };
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

  return (
    <section id="events" className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 scroll-mt-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-3 text-left">
          <AnimeFadeUp>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white text-left">
              {title || 'Próximos Eventos'}
            </h2>
          </AnimeFadeUp>
          {subtitle && (
            <AnimeFadeUp delay={0.1}>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl text-left">
                {subtitle}
              </p>
            </AnimeFadeUp>
          )}
        </div>
        <AnimeFadeUp delay={0.2}>
          <Link
            to="/eventos"
            className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
          >
            Ver Calendario Completo
            <ArrowRight size={16} />
          </Link>
        </AnimeFadeUp>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : events.length > 0 ? (
        <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const dateObj = formatEventDate(event.start_date);
            return (
              <div key={event.id}>
                <Link to="/eventos" className="block h-full cursor-pointer">
                  <AnimeHoverCard
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-amber-500/5 hover:border-amber-500/30 flex flex-col h-full group relative"
                  >
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />

                  {event.cover_image_url ? (
                    <div className="w-full h-44 overflow-hidden relative">
                      <img loading="lazy"
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent"></div>
                      
                      <div className="absolute top-4 left-4 bg-amber-500 text-white rounded-2xl px-3 py-1.5 flex flex-col items-center justify-center font-bold shadow-md">
                        <span className="text-lg leading-none font-serif">{dateObj.day}</span>
                        <span className="text-[9px] tracking-wider font-mono">{dateObj.month}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-[#0a1c40] dark:to-slate-950 flex items-center justify-center text-slate-800 dark:text-white relative">
                      <Calendar size={48} className="opacity-10 absolute" />
                      <span className="text-3xl font-bold font-serif opacity-15 select-none tracking-widest">JERUSALÉN</span>
                      
                      <div className="absolute top-4 left-4 bg-amber-500 text-white rounded-2xl px-3 py-1.5 flex flex-col items-center justify-center font-bold shadow-md">
                        <span className="text-lg leading-none font-serif">{dateObj.day}</span>
                        <span className="text-[9px] tracking-wider font-mono">{dateObj.month}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="bg-amber-100 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {event.ministries?.name || 'General'}
                        </span>
                        <span className="text-slate-400">
                          Nuevo
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1 flex items-center gap-1.5 text-left group-hover:text-amber-500 dark:group-hover:text-amber-500 transition-colors">
                        {event.emoji && <span>{event.emoji}</span>}
                        {event.title}
                      </h3>

                      <p className="text-slate-500 dark:text-slate-405 text-xs leading-relaxed line-clamp-2 text-left">
                        {event.description || 'Te invitamos a participar en esta actividad con nosotros. ¡Esperamos ser de bendición para tu vida!'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-350">
                        <Clock size={14} className="text-amber-500" />
                        <span>{formatTime(event.start_time)}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-500 group-hover:underline flex items-center gap-1">
                        Ver Detalles
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                  </AnimeHoverCard>
                </Link>
              </div>
            );
          })}
        </AnimeStaggerGrid>
      ) : (
        <AnimeFadeUp className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 shadow-xs">
          <Calendar className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" size={40} />
          <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold">No hay eventos especiales programados próximamente.</p>
        </AnimeFadeUp>
      )}
    </section>
  );
};
