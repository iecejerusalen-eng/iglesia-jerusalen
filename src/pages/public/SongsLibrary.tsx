import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, X, Eye, EyeOff, Filter } from 'lucide-react';
import type { Song, SongType, SongStyle } from '../../types';

const SongsLibrary = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [songTypes, setSongTypes] = useState<SongType[]>([]);
  const [songStyles, setSongStyles] = useState<SongStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [fontFamily, setFontFamily] = useState<'mono' | 'serif' | 'sans'>('mono');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [songsRes, typesRes, stylesRes] = await Promise.all([
        supabase.from('songs').select('*, song_types(*), song_styles(*)').order('title'),
        supabase.from('song_types').select('*').order('name'),
        supabase.from('song_styles').select('*').order('name'),
      ]);
      if (songsRes.data) setSongs(songsRes.data);
      if (typesRes.data) setSongTypes(typesRes.data);
      if (stylesRes.data) setSongStyles(stylesRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = songs.filter((s) => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.artist || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || s.type_id === filterType;
    const matchStyle = !filterStyle || s.style_id === filterStyle;
    return matchSearch && matchType && matchStyle;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-slate-950 dark:to-slate-950 transition-colors duration-200">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Music size={48} className="mx-auto mb-4 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Alabanzas e Himnos</h1>
            <p className="text-amber-200 text-lg max-w-xl mx-auto">Biblioteca de canciones de la Iglesia Jerusalén</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="mb-8">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título o artista..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none bg-white dark:bg-slate-900 shadow-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                showFilters || filterType || filterStyle ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white dark:bg-slate-900 border-gray-200 text-gray-600 dark:text-gray-300 hover:border-amber-200'
              }`}>
              <Filter size={16} /> Filtros
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 focus:border-amber-400 outline-none">
                    <option value="">Todos los tipos</option>
                    {songTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)}
                    className="border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 focus:border-amber-400 outline-none">
                    <option value="">Todos los estilos</option>
                    {songStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {(filterType || filterStyle) && (
                    <button onClick={() => { setFilterType(''); setFilterStyle(''); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer">Limpiar filtros</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Songs Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Music size={56} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No se encontraron canciones</p>
            <p className="text-sm">Intenta con otra búsqueda o filtro</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedSong(song)}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2">{song.title}</h3>
                  {song.has_chords && (
                    <span className="text-[10px] bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 border border-green-200/50 dark:border-green-800/30">🎸</span>
                  )}
                </div>
                {song.artist && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{song.artist}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {song.song_types && (
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/30">{song.song_types.name}</span>
                  )}
                  {song.song_styles && (
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/30">{song.song_styles.name}</span>
                  )}
                  {song.bpm && (
                    <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium px-2 py-0.5 rounded-full">{song.bpm} BPM</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Song Detail Modal */}
      <AnimatePresence>
        {selectedSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedSong(null)}></div>
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-white/10 my-4"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-white">{selectedSong.title}</h2>
                    {selectedSong.artist && <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedSong.artist}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedSong.song_types && (
                        <span className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/30">{selectedSong.song_types.name}</span>
                      )}
                      {selectedSong.song_styles && (
                        <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/30">{selectedSong.song_styles.name}</span>
                      )}
                      {selectedSong.bpm && (
                        <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium px-2.5 py-1 rounded-full">♩ {selectedSong.bpm} BPM</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as 'mono' | 'serif' | 'sans')}
                      className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <option value="mono">Letra Mono</option>
                      <option value="serif">Letra Serif</option>
                      <option value="sans">Letra Sans</option>
                    </select>

                    {selectedSong.has_chords && (
                      <button
                        onClick={() => setShowChords(!showChords)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          showChords
                            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800/30'
                            : 'bg-gray-100 text-gray-500 dark:text-gray-400 border border-gray-200 dark:bg-slate-800 dark:border-slate-750'
                        }`}
                      >
                        {showChords ? <Eye size={14} /> : <EyeOff size={14} />}
                        {showChords ? 'Acordes' : 'Sin acordes'}
                      </button>
                    )}
                    <button onClick={() => setSelectedSong(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-pointer">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Lyrics */}
              <div className="p-6">
                <style>{`
                  .song-lyrics-wrapper.font-mono .song-lyrics {
                    font-family: 'Courier New', Courier, monospace !important;
                  }
                  .song-lyrics-wrapper.font-serif .song-lyrics {
                    font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
                  }
                  .song-lyrics-wrapper.font-sans .song-lyrics {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                  }
                  .song-lyrics {
                    font-size: 1rem;
                    line-height: 2.2;
                    white-space: pre-wrap;
                    color: #1f2937;
                  }
                  .dark .song-lyrics {
                    color: #d1d5db;
                  }
                  .song-lyrics h1 { font-size: 1.5rem; font-weight: 800; margin: 1rem 0 0.5rem; font-family: inherit; color: #111827; }
                  .dark .song-lyrics h1 { color: #f9fafb; }
                  .song-lyrics h2 { font-size: 1.15rem; font-weight: 700; margin: 1rem 0 0.3rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-family: inherit; }
                  .dark .song-lyrics h2 { color: #9ca3af; }
                  .song-lyrics h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.2rem; color: #9ca3af; font-style: italic; font-family: inherit; }
                  .dark .song-lyrics h3 { color: #868e96; }
                  .song-lyrics p { margin-bottom: 0.15rem; }
                  
                  /* Native ruby style */
                  .song-lyrics ruby rt {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #dc2626;
                    font-family: 'Inter', sans-serif;
                  }
                  .dark .song-lyrics ruby rt {
                    color: #f87171;
                  }
                  .song-lyrics.hide-chords ruby rt {
                    display: none;
                  }
                  .song-lyrics.hide-chords ruby {
                    background: none;
                  }
                  
                  /* Span absolute style */
                  .song-lyrics span.chord-annotation {
                    position: relative;
                    display: inline-block;
                    background: rgba(220, 38, 38, 0.05);
                    border-radius: 2px;
                    padding: 0 1px;
                    margin-top: 1.2rem;
                  }
                  .dark .song-lyrics span.chord-annotation {
                    background: rgba(248, 113, 113, 0.08);
                  }
                  .song-lyrics span.chord-annotation::before {
                    content: attr(data-chord);
                    position: absolute;
                    top: -1.2rem;
                    left: 0;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #dc2626;
                    font-family: 'Inter', sans-serif;
                    line-height: 1;
                    pointer-events: none;
                  }
                  .dark .song-lyrics span.chord-annotation::before {
                    color: #f87171;
                  }
                  .song-lyrics.hide-chords span.chord-annotation::before {
                    display: none;
                  }
                  .song-lyrics.hide-chords span.chord-annotation {
                    margin-top: 0;
                    background: none;
                    padding: 0;
                  }
                `}</style>
                <div className={`song-lyrics-wrapper font-${fontFamily}`}>
                  <div
                    className={`song-lyrics ${!showChords ? 'hide-chords' : ''}`}
                    dangerouslySetInnerHTML={{ __html: selectedSong.lyrics || '<p class="text-gray-400 italic">Sin letra disponible</p>' }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SongsLibrary;
