import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, FileText } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
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
              to="/predicas"
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
            {sermons.map((sermon) => {
              const hasYoutube = !!sermon.youtube_url;
              const coverVideo = sermon.metadata?.cover_video_url ?? null;
              const metadataCoverImage = sermon.metadata?.cover_image_url ?? null;
              const hasVideoCover = !!coverVideo;
              const hasImageCover = !!metadataCoverImage;

              const coverImage = hasImageCover 
                ? metadataCoverImage
                : hasYoutube ? `https://img.youtube.com/vi/${getYoutubeId(sermon.youtube_url!)}/maxresdefault.jpg` : null;

              return (
                <div key={sermon.id} className="group relative h-[380px] rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 border border-slate-200 dark:border-white/5">
                  <Link 
                    to={`/predicas/${sermon.id}`} 
                    className="absolute inset-0 z-20 outline-none focus-visible:ring-4 focus-visible:ring-amber-500 rounded-[2rem]" 
                    aria-label={`Ver prédica: ${sermon.title}`} 
                  />
                  
                  {/* Background Media */}
                  <div className="absolute inset-0 bg-slate-900">
                    {hasVideoCover ? (
                      <video 
                        src={coverVideo!}
                        className="w-full h-full object-cover filter brightness-[0.7] group-hover:brightness-[0.85] group-hover:scale-105 transition-all duration-700" 
                        autoPlay muted loop playsInline 
                      />
                    ) : coverImage ? (
                      <img 
                        loading="lazy" 
                        src={coverImage}
                        alt=""
                        className="w-full h-full object-cover filter brightness-[0.7] group-hover:brightness-[0.85] group-hover:scale-105 transition-all duration-700"
                        onError={(e) => {
                          // Fallback to hqdefault if maxresdefault doesn't exist
                          if (hasYoutube && coverImage.includes('maxresdefault')) {
                            e.currentTarget.src = `https://img.youtube.com/vi/${getYoutubeId(sermon.youtube_url!)}/hqdefault.jpg`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                        <FileText size={48} className="text-slate-300 dark:text-slate-700" />
                      </div>
                    )}
                  </div>

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-transparent pointer-events-none transition-opacity duration-500 group-hover:opacity-80" />

                  {/* Play Button Icon Hover State */}
                  {(hasYoutube || hasVideoCover) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-500 z-10">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-2xl">
                        <PlayCircle size={32} className="text-white ml-1 drop-shadow-md" />
                      </div>
                    </div>
                  )}

                  {/* Glassmorphism Content Area */}
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 p-5 rounded-2xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 group-hover:bg-white/20 dark:group-hover:bg-black/40 shadow-lg">
                      <div className="flex flex-col gap-3">
                        {/* Title */}
                        <h3 className="font-serif font-black text-xl text-white leading-tight line-clamp-2 drop-shadow-sm">
                          {sermon.title}
                        </h3>
                        
                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs font-semibold text-white/80 border-t border-white/20 pt-3">
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] backdrop-blur-sm border border-white/10">
                              👤
                            </span>
                            <span className="truncate max-w-[120px]">{sermon.pastor_name}</span>
                          </span>
                          <span>{sermon.date ? formatDate(sermon.date) : formatDate(sermon.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimeStaggerGrid>
        )}
      </div>
    </section>
  );
};
