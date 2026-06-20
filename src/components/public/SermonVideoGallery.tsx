import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Calendar, User, ArrowRight } from 'lucide-react';
import type { Sermon } from '../../types';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../animations/AnimeWrappers';

interface SermonVideoGalleryProps {
  sermons: Sermon[];
  title?: string;
  subtitle?: string;
}

const getYoutubeId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function SermonVideoGallery({ sermons, title, subtitle }: SermonVideoGalleryProps) {
  const [activeSermon] = useState<Sermon | null>(sermons[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  if (!sermons || sermons.length === 0) return null;

  const handlePlay = (sermon: Sermon) => {
    navigate(`/predicas/${sermon.id}`);
  };

  const activeVideoId = activeSermon ? getYoutubeId(activeSermon.youtube_url) : null;

  return (
    <section id="sermon-gallery-top" className="py-20 relative scroll-mt-20">
      {/* Background with glassmorphic accents */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-[#071330] pointer-events-none transition-colors duration-300" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none transform-gpu" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-3">
            <AnimeFadeUp>
              <Link to="/predicas" className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white text-left group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  {title || 'Últimas Prédicas'}
                </h2>
                <ArrowRight className="hidden sm:block text-amber-600 dark:text-amber-500 transform group-hover:translate-x-1 transition-transform" size={24} />
              </Link>
            </AnimeFadeUp>
            {subtitle && (
              <AnimeFadeUp delay={100}>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl text-left">
                  {subtitle}
                </p>
              </AnimeFadeUp>
            )}
          </div>
          <AnimeFadeUp delay={200} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              to="/predicas"
              className="text-primary dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
            >
              Ver Todas
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://youtube.com" // Update with actual channel link if available
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
            >
              Ver Canal de Youtube
              <ArrowRight size={16} />
            </a>
          </AnimeFadeUp>
        </div>

        {/* Featured Video Player */}
        <div className="overflow-hidden">
          {activeSermon && (
            <AnimeFadeUp key={activeSermon.id} className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl group border border-slate-200 dark:border-white/10">
              <div className="aspect-video w-full relative">
                {isPlaying && activeVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                    title={activeSermon.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full absolute inset-0 border-0"
                  />
                ) : (
                  <>
                    {/* Thumbnail placeholder with zoom effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900" />
                    {activeVideoId && (
                      <img 
                        src={`https://img.youtube.com/vi/${activeVideoId}/maxresdefault.jpg`}
                        alt={activeSermon.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-103 transition-transform duration-[4000ms] ease-out"
                        onError={(e) => {
                          e.currentTarget.src = `https://img.youtube.com/vi/${activeVideoId}/hqdefault.jpg`;
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-amber-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(217,119,6,0.6)] transition-all duration-300 shadow-xl border border-white/20 cursor-pointer"
                      >
                        <Play size={32} className="ml-2 fill-current" />
                      </button>
                    </div>

                    {/* Meta Information Glass Panel */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                      <div className="bg-slate-950/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/10 p-5 md:p-6 rounded-2xl">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                          <div className="space-y-2 text-left">
                            <span className="inline-block px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/20">
                              Prédica Destacada
                            </span>
                            <Link to={`/predicas/${activeSermon.id}`} className="hover:opacity-80 transition-opacity">
                              <h3 className="text-xl md:text-3xl font-serif font-bold text-white text-left hover:text-amber-500 transition-colors">
                                {activeSermon.title}
                              </h3>
                            </Link>
                            <div className="flex flex-wrap items-center gap-4 text-slate-300 text-xs md:text-sm font-medium">
                              <span className="flex items-center gap-1.5">
                                <User size={15} className="text-amber-500" />
                                {activeSermon.pastor_name}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar size={15} className="text-amber-500" />
                                {new Date(activeSermon.created_at).toLocaleDateString('es-ES', { 
                                  day: 'numeric', month: 'long', year: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AnimeFadeUp>
          )}
        </div>

        {/* Playlist Grid / Carousel */}
        {sermons.length > 1 && (
          <div className="space-y-6 text-left">
            <h4 className="font-serif font-bold text-xl text-slate-800 dark:text-white">Sermones Anteriores</h4>
            <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sermons.filter(s => s.id !== activeSermon?.id).map((sermon) => {
                const videoId = getYoutubeId(sermon.youtube_url);
                return (
                  <div key={sermon.id}>
                    <AnimeHoverCard
                      onClick={() => handlePlay(sermon)}
                      className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-amber-500/5 hover:border-amber-500/30 flex flex-col h-full"
                    >
                      <div className="aspect-video relative overflow-hidden bg-slate-800">
                        {videoId && (
                          <img 
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt={sermon.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/20">
                          <div className="w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-xs text-white flex items-center justify-center border border-white/20">
                            <Play size={20} className="ml-1 fill-current text-amber-500" />
                          </div>
                        </div>
                      </div>
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h5 className="font-serif font-bold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors text-left">
                            {sermon.title}
                          </h5>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-white/5">
                          <span className="flex items-center gap-1 line-clamp-1">
                            <User size={13} className="text-amber-500" />
                            {sermon.pastor_name}
                          </span>
                          <span className="font-mono">
                            {new Date(sermon.created_at).toLocaleDateString('es-ES', { 
                              day: '2-digit', month: 'short', year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </AnimeHoverCard>
                  </div>
                );
              })}
            </AnimeStaggerGrid>
          </div>
        )}
      </div>
    </section>
  );
}
