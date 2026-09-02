import React, { useState, useEffect } from 'react';
import {
  Mic, Play, Pause, Search, Sparkles, Clock, Calendar,
  Radio, Headphones, Music
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAudioPlayerStore } from '../../store/useAudioPlayerStore';
import { supabase } from '../../config/supabase';
import type { PodcastEpisode, PodcastShow } from '../../features/podcast/types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

export const Podcast = () => {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState<Partial<PodcastShow> | null>(null);

  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayerStore();

  useEffect(() => {
    let isMounted = true;

    const loadEpisodes = async () => {
      try {
        const { data, error } = await supabase
          .from('podcast_episodes')
          .select('id, show_id, series_id, title, description, show_notes, audio_url, audio_source_type, audio_duration_seconds, cover_image_url, transcript, ai_summary, chapters, season_number, episode_number, status, published_at, view_count, created_at, updated_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (!isMounted) return;
        if (error) throw error;
        setLoadError(null);
        setEpisodes((data ?? []) as PodcastEpisode[]);
      } catch {
        if (isMounted) {
          setLoadError('No pudimos cargar los episodios en este momento.');
          setEpisodes([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }

      try {
        const { data } = await supabase
          .from('podcast_show')
          .select('name, description, cover_image_url, spotify_url, apple_podcasts_url, is_active')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        if (isMounted && data) setShowSettings(data as Partial<PodcastShow>);
      } catch {
        // El catálogo de episodios sigue siendo utilizable aunque no exista configuración editorial.
      }
    };

    void loadEpisodes();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEpisodes = episodes.filter(ep => {
    const matchesSearch = ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const formatDuration = (secs?: number) => {
    if (!secs) return '30 min';
    const m = Math.floor(secs / 60);
    return `${m} min`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 space-y-10 relative">

        {/* HERO SECTION */}
        <AnimeFadeUp delay={100}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/20 p-6 md:p-10 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-8">
            {/* Cover Art */}
            <div className="relative group shrink-0 w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div className="w-full h-full bg-gradient-to-br from-purple-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-3 text-purple-200">
                <Mic className="w-12 h-12" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Podcast</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl flex items-end p-4">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 text-xs font-bold rounded-full shadow-lg">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Podcast Oficial
                </span>
              </div>
            </div>

            {/* Show Details */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mensajes, Devocionales y Entrevistas
              </span>
              
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">
                Voces de <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">Jerusalén</span>
              </h1>
              
              <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
                Reflexiones pastorales, estudios profundos y devocionales semanales para fortalecer tu fe en el caminar diario con Cristo Jesús.
              </p>

              {/* Directory Links */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {showSettings?.spotify_url ? (
                  <a href={showSettings.spotify_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition">
                    <Music className="w-4 h-4 text-emerald-400" /> Escuchar en Spotify
                  </a>
                ) : null}
                {showSettings?.apple_podcasts_url ? (
                  <a href={showSettings.apple_podcasts_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition">
                    <Headphones className="w-4 h-4 text-purple-400" /> Apple Podcasts
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </AnimeFadeUp>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar episodios o temas..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-amber-400 outline-none transition"
            />
          </div>

          <p className="text-xs text-slate-500">Busca por título o descripción</p>
        </div>

        {/* EPISODES GRID */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Mic className="w-8 h-8 animate-bounce mx-auto text-amber-400 mb-2" />
            <p className="text-xs">Cargando catálogo de episodios...</p>
          </div>
        ) : filteredEpisodes.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/50 rounded-2xl border border-white/5">
            <Headphones className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">{loadError ? 'No pudimos cargar los episodios' : 'No se encontraron episodios'}</h3>
            <p className="text-xs text-slate-400 mt-1">{loadError || 'Intenta buscar con otros términos.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEpisodes.map((episode) => {
              const isCurrentPlaying = currentTrack?.id === episode.id && isPlaying;

              return (
                <motion.div
                  key={episode.id}
                  whileHover={{ y: -4 }}
                  className="bg-slate-900/80 border border-white/10 hover:border-amber-400/40 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl">
                      {episode.cover_image_url ? (
                        <img
                          src={episode.cover_image_url}
                          alt={episode.title}
                          className="w-full h-44 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-44 rounded-xl bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 flex items-center justify-center text-purple-300" aria-label="Este episodio no tiene portada">
                          <Music className="w-12 h-12" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-mono font-bold rounded-md border border-amber-400/30">
                          T{episode.season_number || 1} • Ep.{episode.episode_number || 1}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (currentTrack?.id === episode.id) {
                            togglePlay();
                          } else {
                            playTrack({
                              id: episode.id,
                              title: episode.title,
                              subtitle: `Voces de Jerusalén — Ep. ${episode.episode_number || 1}`,
                              audio_url: episode.audio_url,
                              cover_image_url: episode.cover_image_url,
                              chapters: episode.chapters,
                              duration: episode.audio_duration_seconds
                            });
                          }
                        }}
                        className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/40 hover:scale-110 active:scale-95 transition"
                        title={isCurrentPlaying ? "Pausar" : "Reproducir episodio"}
                      >
                        {isCurrentPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                        {episode.title}
                      </h3>
                      {episode.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {episode.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                      <Clock className="w-3.5 h-3.5" /> {formatDuration(episode.audio_duration_seconds)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(episode.published_at || '2026-01-01').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default Podcast;
