import { Link } from 'react-router-dom';
import { PlayCircle, Calendar, Gamepad2, ArrowRight, Heart } from 'lucide-react';
import { AnimeFadeUp, AnimeHoverCard } from '../../../components/animations/AnimeWrappers';
import type { Sermon, Event as DbEvent } from '../../../types';
import { getYoutubeId } from '../utils';

interface BentoGridSectionProps {
  latestSermon?: Sermon;
  nextEvent?: DbEvent;
}

export const BentoGridSection = ({ latestSermon, nextEvent }: BentoGridSectionProps) => {
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

  const getThumbnail = (sermon: Sermon) => {
    if (sermon.thumbnail_url) return sermon.thumbnail_url;
    if (sermon.video_url && (sermon.video_url.includes('youtube.com') || sermon.video_url.includes('youtu.be'))) {
      const id = getYoutubeId(sermon.video_url);
      if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
    return 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=800&q=80';
  };

  // Metas de donación de ejemplo (esto se conectará a BD en la Fase 2 de Misiones)
  const currentDonations = 2500;
  const targetDonations = 5000;
  const progressPercent = Math.min(Math.round((currentDonations / targetDonations) * 100), 100);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 scroll-mt-24">
      <AnimeFadeUp>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2">
              Ecosistema Jerusalén
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Lo más destacado de nuestra comunidad.
            </p>
          </div>
        </div>
      </AnimeFadeUp>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]">
        
        {/* Card Grande: Último Sermón (Ocupa 2 cols y 2 rows en pantallas grandes) */}
        {latestSermon && (
          <Link to={`/predicas/${latestSermon.id}`} className="md:col-span-2 md:row-span-2 block group">
            <AnimeHoverCard className="w-full h-full rounded-3xl overflow-hidden relative border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-amber-500/30 transition-all">
              <div className="absolute inset-0 bg-slate-900">
                <img 
                  src={getThumbnail(latestSermon)} 
                  alt={latestSermon.title}
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700 group-hover:opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
              </div>
              
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <div className="bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full self-start mb-3 md:mb-4 uppercase tracking-wider">
                  Último Mensaje
                </div>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 line-clamp-2">
                  {latestSermon.title}
                </h3>
                <div className="flex items-center gap-4 text-slate-300 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <PlayCircle className="w-5 h-5 text-amber-500" /> Ver Video
                  </span>
                  <span>•</span>
                  <span>{new Date(latestSermon.created_at || '').toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </AnimeHoverCard>
          </Link>
        )}

        {/* Card Mediana: Próximo Evento */}
        {nextEvent && (
          <Link to="/eventos" className="md:col-span-1 md:row-span-2 block group">
            <AnimeHoverCard className="w-full h-full rounded-3xl bg-gradient-to-br from-[#0a1c40] to-slate-950 border border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-amber-500/30 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <Calendar className="w-24 h-24 text-amber-500" />
              </div>
              
              <div>
                <div className="text-amber-500 text-xs font-bold mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Próximo Evento
                </div>
                
                {(() => {
                  const dateObj = formatEventDate(nextEvent.start_date);
                  return (
                    <div className="flex gap-4 mb-4">
                      <div className="bg-slate-800/80 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[70px] border border-slate-700">
                        <span className="text-2xl font-serif font-bold text-white leading-none">{dateObj.day}</span>
                        <span className="text-xs text-amber-500 font-bold uppercase">{dateObj.month}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                          {nextEvent.emoji} {nextEvent.title}
                        </h3>
                        <p className="text-slate-400 text-xs line-clamp-2">
                          {nextEvent.description || 'Acompáñanos en este evento especial.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-bold text-slate-300">
                  {nextEvent.start_time ? nextEvent.start_time.substring(0, 5) : 'Todo el día'}
                </span>
                <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </span>
              </div>
            </AnimeHoverCard>
          </Link>
        )}

        {/* Card Pequeña: Meta de Misiones/Donaciones */}
        <Link to="/donations" className="md:col-span-1 md:row-span-1 block group">
          <AnimeHoverCard className="w-full h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform">
              <Heart className="w-32 h-32" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="text-rose-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 relative z-10">
                  <Heart className="w-4 h-4 fill-current" /> Meta Pro-Templo
                </div>
                <span className="text-xs font-bold text-slate-500 relative z-10">{progressPercent}%</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 relative z-10">
                ${currentDonations.toLocaleString()} <span className="text-xs font-normal text-slate-500">de ${targetDonations.toLocaleString()}</span>
              </h3>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden relative z-10">
              <div 
                className="bg-gradient-to-r from-rose-400 to-rose-600 h-2.5 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </AnimeHoverCard>
        </Link>

        {/* Card Pequeña: Juegos / Kids */}
        <Link to="/recursos/juegos" className="md:col-span-1 md:row-span-1 block group">
          <AnimeHoverCard className="w-full h-full rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/30 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/20 transition-all relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 opacity-20 group-hover:scale-110 transition-transform group-hover:rotate-12">
              <Gamepad2 className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10">
              <div className="text-white/80 text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4" /> Diversión Familiar
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">
                Juegos<br/>Bíblicos
              </h3>
            </div>
            <div className="relative z-10 mt-auto flex items-center gap-2 text-white/90 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Jugar ahora <ArrowRight className="w-4 h-4" />
            </div>
          </AnimeHoverCard>
        </Link>

      </div>
    </section>
  );
};
