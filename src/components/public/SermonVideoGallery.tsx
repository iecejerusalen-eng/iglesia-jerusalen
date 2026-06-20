import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Calendar, User, ArrowRight } from 'lucide-react';
import type { Sermon } from '../../types';

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
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(sermons[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!sermons || sermons.length === 0) return null;

  const handlePlay = (sermon: Sermon) => {
    setActiveSermon(sermon);
    setIsPlaying(true);
    // Scroll to the top of the gallery smoothly
    document.getElementById('sermon-gallery-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeVideoId = activeSermon ? getYoutubeId(activeSermon.youtube_url) : null;

  return (
    <section id="sermon-gallery-top" className="py-20 relative scroll-mt-20">
      {/* Background with glassmorphic accents */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 pointer-events-none transition-colors duration-300" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/10 rounded-full blur-[120px] pointer-events-none transform-gpu" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-3">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white"
            >
              {title || 'Últimas Prédicas'}
            </motion.h2>
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xl"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          <motion.a
            href="https://youtube.com" // Update with actual channel link if available
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-primary hover:text-blue-900 dark:text-gold dark:hover:text-yellow-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
          >
            Ver Canal de Youtube
            <ArrowRight size={16} />
          </motion.a>
        </div>

        {/* Featured Video Player */}
        <AnimatePresence mode="wait">
          {activeSermon && (
            <motion.div 
              key={activeSermon.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl group border border-white/10"
            >
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
                    {/* Thumbnail placeholder with blur effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-slate-900" />
                    {activeVideoId && (
                      <img 
                        src={`https://img.youtube.com/vi/${activeVideoId}/maxresdefault.jpg`}
                        alt={activeSermon.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          // Fallback to hqdefault if maxresdefault is not available
                          e.currentTarget.src = `https://img.youtube.com/vi/${activeVideoId}/hqdefault.jpg`;
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-gold hover:scale-110 transition-all duration-300 shadow-xl border border-white/30"
                      >
                        <Play size={32} className="ml-2 fill-current" />
                      </button>
                    </div>

                    {/* Meta Information Glass Panel */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl transform-gpu">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                          <div className="space-y-3">
                            <span className="inline-block px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider border border-gold/30">
                              Prédica Destacada
                            </span>
                            <h3 className="text-2xl md:text-4xl font-serif font-bold text-white drop-shadow-md">
                              {activeSermon.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm font-medium">
                              <span className="flex items-center gap-1.5">
                                <User size={16} className="text-gold" />
                                {activeSermon.pastor_name}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar size={16} className="text-gold" />
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist Grid / Carousel */}
        {sermons.length > 1 && (
          <div className="space-y-6">
            <h4 className="font-serif font-bold text-xl text-slate-800 dark:text-white">Sermones Anteriores</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sermons.filter(s => s.id !== activeSermon?.id).map((sermon, index) => {
                const videoId = getYoutubeId(sermon.youtube_url);
                return (
                  <motion.div
                    key={sermon.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handlePlay(sermon)}
                    className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col hover:-translate-y-1"
                  >
                    <div className="aspect-video relative overflow-hidden bg-slate-800">
                      {videoId && (
                        <img 
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt={sermon.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur-sm text-white flex items-center justify-center">
                          <Play size={20} className="ml-1 fill-current text-gold" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-serif font-bold text-slate-800 dark:text-gray-100 line-clamp-2 group-hover:text-primary dark:group-hover:text-gold transition-colors">
                          {sermon.title}
                        </h5>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-1 line-clamp-1">
                          <User size={14} />
                          {sermon.pastor_name}
                        </span>
                        <span className="font-mono">
                          {new Date(sermon.created_at).toLocaleDateString('es-ES', { 
                            day: '2-digit', month: 'short', year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
