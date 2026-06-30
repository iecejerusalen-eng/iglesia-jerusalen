import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../../components/animations/AnimeWrappers';
import type { Sermon } from '../../../types';
import type { PageSection } from '../types';
import { getYoutubeId } from '../utils';

interface SermonsSectionProps {
  sectionData: PageSection;
  sermons: Sermon[];
  loading: boolean;
}

export const SermonsSection = ({ sectionData, sermons, loading }: SermonsSectionProps) => {
  const { title, subtitle } = sectionData;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section id="sermons" className="bg-slate-50 dark:bg-[#0a0f1d] py-16 border-y border-slate-200 dark:border-white/5 scroll-mt-24 transition-colors duration-300 !mt-0 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-3 text-left">
            <AnimeFadeUp>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
                {title || 'Últimos Mensajes'}
              </h2>
            </AnimeFadeUp>
            {subtitle && (
              <AnimeFadeUp delay={0.1}>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                  {subtitle}
                </p>
              </AnimeFadeUp>
            )}
          </div>
          <AnimeFadeUp delay={0.2}>
            <Link
              to="/recursos"
              className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
            >
              Ver Todos los Mensajes
              <ArrowRight size={16} />
            </Link>
          </AnimeFadeUp>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sermons.map((sermon) => (
              <div key={sermon.id}>
                {sermon.youtube_url ? (
                  <a 
                    href={sermon.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block h-full cursor-pointer"
                  >
                    <AnimeHoverCard
                      className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-amber-500/5 hover:border-amber-500/30 transition-all flex flex-col h-full group relative"
                    >
                      <div className="w-full h-1 bg-gradient-to-r from-red-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="w-full h-44 bg-slate-100 dark:bg-slate-950 relative overflow-hidden group-hover:after:opacity-0 after:transition-opacity after:duration-500">
                        {/* Overlay to darken image slightly by default */}
                        <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-900/30 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                        
                        <img loading="lazy" 
                          src={`https://img.youtube.com/vi/${getYoutubeId(sermon.youtube_url)}/mqdefault.jpg`}
                          alt={sermon.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <div className="w-14 h-14 bg-red-600/90 text-white rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:bg-red-600 shadow-lg transition-all duration-300">
                            <PlayCircle size={28} className="ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 z-20">
                          YouTube
                        </div>
                      </div>

                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight group-hover:text-red-500 dark:group-hover:text-amber-400 transition-colors text-left line-clamp-2">
                            {sermon.title}
                          </h3>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] border border-slate-300 dark:border-slate-700">
                              👤
                            </div>
                            {sermon.pastor_name}
                          </span>
                          <span>{sermon.date ? formatDate(sermon.date) : formatDate(sermon.created_at)}</span>
                        </div>
                      </div>
                    </AnimeHoverCard>
                  </a>
                ) : (
                  <AnimeHoverCard
                    className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col h-full group opacity-70 relative"
                  >
                    <div className="w-full h-44 bg-slate-100 dark:bg-slate-950 flex items-center justify-center flex-col gap-2 relative">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNjdXJyZW50Q29sb3IiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] pointer-events-none" />
                      <PlayCircle size={40} className="text-slate-300 dark:text-slate-700" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Video no disponible</span>
                    </div>
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight text-left">
                          {sermon.title}
                        </h3>
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>{sermon.pastor_name}</span>
                        <span>{sermon.date ? formatDate(sermon.date) : formatDate(sermon.created_at)}</span>
                      </div>
                    </div>
                  </AnimeHoverCard>
                )}
              </div>
            ))}
          </AnimeStaggerGrid>
        )}
      </div>
    </section>
  );
};
