import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import { 
  Search, Music, X, Eye, EyeOff, Filter, LayoutGrid, 
  Table, Copy, ChevronDown, ExternalLink, Info, PlayCircle, FileText
} from 'lucide-react';
import type { Song, SongType, SongStyle } from '../../types';
import { toast } from 'sonner';

// Predefined battery touch styles
const DRUM_STYLES = [
  'Balada Worship',
  'Pop Worship 4/4',
  'Rock 1/4 (Marcado en Negras)',
  'Rock 1/2 (Marcado en Corcheas)',
  'Worship 6/8',
  'Worship 4/4 (Balada Rítmica)',
  'Pop/Rock 4/4',
  'Funk / Gospel',
  'Disco / Folk (Corito Rápido)',
  'Cumbia Cristiana',
  'Vals 3/4',
  'Marcha',
  'Acústico / Sin Batería'
];

// Helper functions for copying
function htmlToBracketText(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Replace chord spans with [Chord]
  temp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation').forEach(el => {
    const chord = el.getAttribute('data-chord');
    if (chord) {
      el.parentNode?.replaceChild(document.createTextNode(`[${chord}]`), el);
    } else {
      el.remove();
    }
  });
  
  // Replace paragraphs with text + newline
  let text = '';
  temp.childNodes.forEach(node => {
    if (node.nodeType === 1) { // ELEMENT_NODE
      const el = node as HTMLElement;
      if (el.tagName === 'P') {
        text += el.textContent + '\n';
      } else if (el.tagName === 'BR') {
        text += '\n';
      } else {
        text += el.textContent;
      }
    } else if (node.nodeType === 3) { // TEXT_NODE
      text += node.textContent;
    }
  });
  
  return text.trim();
}

function bracketTextToHtml(text: string): string {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  const lines = escaped.split('\n');
  const processedLines = lines.map(line => {
    const compiledLine = line.replace(/\[([a-zA-Z0-9#\/+\-.]+?)\]/g, (_, chord) => {
      return `<span class="chord-node-wrapper" data-chord-node="true" data-chord="${chord}"></span>`;
    });
    return `<p class="lyrics-line">${compiledLine || '&nbsp;'}</p>`;
  }).join('');
  
  return processedLines;
}

const SongsLibrary = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [songTypes, setSongTypes] = useState<SongType[]>([]);
  const [songStyles, setSongStyles] = useState<SongStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterDrumStyle, setFilterDrumStyle] = useState('');
  const [filterChords, setFilterChords] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'bpm-asc' | 'bpm-desc' | 'newest' | 'oldest'>('title-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [fontFamily, setFontFamily] = useState<'mono' | 'serif' | 'sans'>('mono');
  
  // Detail Modal tab: 'lyrics' | 'resources'
  const [activeTab, setActiveTab] = useState<'lyrics' | 'resources'>('lyrics');

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
    const matchDrum = !filterDrumStyle || s.drum_style === filterDrumStyle;
    const matchChords = filterChords === 'all' || 
                        (filterChords === 'yes' && s.has_chords) || 
                        (filterChords === 'no' && !s.has_chords);
    return matchSearch && matchType && matchStyle && matchDrum && matchChords;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
    if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
    if (sortBy === 'bpm-asc') return (a.bpm || 0) - (b.bpm || 0);
    if (sortBy === 'bpm-desc') return (b.bpm || 0) - (a.bpm || 0);
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return 0;
  });

  const copyChords = (song: Song) => {
    let result = '';
    if (song.structure_blocks && song.structure_blocks.length > 0) {
      result = song.structure_blocks.map(b => {
        let blockStr = `[${b.label.toUpperCase()}]\n`;
        if (b.melody) blockStr += `(Guía: ${b.melody})\n`;
        blockStr += `${b.lyrics}\n`;
        return blockStr;
      }).join('\n');
    } else {
      result = htmlToBracketText(song.lyrics);
    }

    navigator.clipboard.writeText(result);
    toast.success('Letra y acordes copiados al portapapeles 🎸');
  };

  const copyOnlyLyrics = (song: Song) => {
    let result = '';
    if (song.structure_blocks && song.structure_blocks.length > 0) {
      result = song.structure_blocks.map(b => {
        let blockStr = `[${b.label.toUpperCase()}]\n`;
        const cleanLyrics = b.lyrics.replace(/\[([a-zA-Z0-9#\/+\-.]+?)\]/g, '');
        blockStr += `${cleanLyrics}\n`;
        return blockStr;
      }).join('\n');
    } else {
      const temp = document.createElement('div');
      temp.innerHTML = song.lyrics;
      temp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation, ruby rt').forEach(el => el.remove());
      result = temp.textContent || '';
    }

    navigator.clipboard.writeText(result.trim());
    toast.success('Letra limpia copiada al portapapeles 🎤');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white py-16 px-4 border-b border-gold/15 relative overflow-hidden">
        {/* Decorative gold glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <AnimeFadeUp delay={0} duration={600}>
            <div className="inline-flex p-3 bg-gold/10 text-gold rounded-3xl border border-gold/20 mb-2 shadow-inner">
              <Music size={32} className="animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">Alabanzas e Himnos</h1>
            <p className="text-indigo-200 text-sm md:text-base max-w-xl mx-auto font-medium">
              Biblioteca musical y partituras de la Iglesia Jerusalén para adoradores y músicos
            </p>
          </AnimeFadeUp>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Controls Panel */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-4 rounded-3xl shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, artista o letra..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-gray-200 dark:border-white/5 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none dark:text-white font-medium" 
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0 self-end md:self-auto w-fit">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="Vista Tarjetas"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-primary dark:text-gold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="Vista Tabla"
              >
                <Table size={15} />
              </button>
            </div>

            {/* Filters toggle */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                showFilters || filterType || filterStyle || filterDrumStyle || filterChords !== 'all'
                  ? 'bg-gold/10 border-gold/40 text-amber-700 dark:text-gold' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Filter size={14} /> 
              <span>Filtros avanzados</span>
              <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters Drawer */}
          {showFilters && (
            <AnimeFadeUp delay={0} duration={350} distance={15}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-150 dark:border-white/5">
                {/* Type */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tipo</label>
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl px-2.5 py-2 outline-none dark:text-white font-medium"
                  >
                    <option value="">Todos los tipos</option>
                    {songTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {/* Style */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Estilo</label>
                  <select 
                    value={filterStyle} 
                    onChange={(e) => setFilterStyle(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl px-2.5 py-2 outline-none dark:text-white font-medium"
                  >
                    <option value="">Todos los estilos</option>
                    {songStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Drum touch beat */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Estilo Batería 🥁</label>
                  <select 
                    value={filterDrumStyle} 
                    onChange={(e) => setFilterDrumStyle(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl px-2.5 py-2 outline-none dark:text-white font-medium"
                  >
                    <option value="">Cualquier toque</option>
                    {DRUM_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
                  </select>
                </div>

                {/* Chords filter */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Acordes 🎸</label>
                  <select 
                    value={filterChords} 
                    onChange={(e) => setFilterChords(e.target.value as any)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl px-2.5 py-2 outline-none dark:text-white font-medium"
                  >
                    <option value="all">Ver todas</option>
                    <option value="yes">Con acordes</option>
                    <option value="no">Solo letra</option>
                  </select>
                </div>

                {/* Sorting */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ordenar por</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl px-2.5 py-2 outline-none dark:text-white font-medium"
                  >
                    <option value="title-asc">Título (A-Z)</option>
                    <option value="title-desc">Título (Z-A)</option>
                    <option value="bpm-asc">BPM (Lento a Rápido)</option>
                    <option value="bpm-desc">BPM (Rápido a Lento)</option>
                    <option value="newest">Agregadas Recientes</option>
                    <option value="oldest">Agregadas Antiguas</option>
                  </select>
                </div>
              </div>
            </AnimeFadeUp>
          )}
        </div>

        {/* Songs Grid / Table */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-16 flex flex-col justify-center items-center gap-2 animate-pulse">
            <Music className="animate-bounce text-primary" size={28} />
            <span className="text-xs text-gray-400 font-semibold">Cargando himnario...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-16 text-center space-y-3">
            <Music className="mx-auto text-gray-300 dark:text-slate-800 animate-pulse" size={48} />
            <h4 className="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wider">
              Sin Alabanzas
            </h4>
            <p className="text-xxs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              No se encontraron canciones que coincidan con la búsqueda o los filtros actuales.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* CARDS VIEW MODE */
          <AnimeStaggerGrid delay={100} staggerDelay={40} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((song) => (
              <div
                key={song.id}
                onClick={() => { setSelectedSong(song); setActiveTab('lyrics'); }}
                className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-5 hover:border-gold dark:hover:border-gold/60 hover:shadow-md transition-all duration-350 hover:-translate-y-1 flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-gray-850 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-gold transition-colors line-clamp-1">{song.title}</h3>
                    {song.has_chords && (
                      <span className="text-[10px] bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-200/30 flex-shrink-0" title="Contiene acordes">🎸</span>
                    )}
                  </div>
                  {song.artist && <p className="text-xs text-gray-400 dark:text-gray-450 truncate font-semibold">{song.artist}</p>}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-50 dark:border-white/5">
                  {song.song_types && (
                    <span className="text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-200/30 uppercase">{song.song_types.name}</span>
                  )}
                  {song.song_styles && (
                    <span className="text-[9px] bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold px-2.5 py-0.5 rounded-full border border-blue-200/30 uppercase">{song.song_styles.name}</span>
                  )}
                  {song.bpm && (
                    <span className="text-[9px] bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full font-mono">♩ {song.bpm} BPM</span>
                  )}
                  {song.drum_style && (
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-200/20">🥁 {song.drum_style}</span>
                  )}
                </div>
              </div>
            ))}
          </AnimeStaggerGrid>
        ) : (
          /* TABLE VIEW MODE */
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-950/20 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Artista</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Estilo</th>
                    <th className="px-6 py-4 text-center">BPM</th>
                    <th className="px-6 py-4">Toque Batería</th>
                    <th className="px-6 py-4 text-center">Acordes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-300 font-medium">
                  {sorted.map((song) => (
                    <tr 
                      key={song.id} 
                      onClick={() => { setSelectedSong(song); setActiveTab('lyrics'); }}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-850/20 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-bold text-gray-850 dark:text-white">{song.title}</td>
                      <td className="px-6 py-4 text-xs font-semibold">{song.artist || '—'}</td>
                      <td className="px-6 py-4">
                        {song.song_types ? (
                          <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-250/20 uppercase">{song.song_types.name}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {song.song_styles ? (
                          <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-250/20 uppercase">{song.song_styles.name}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs">{song.bpm ? `♩ ${song.bpm}` : '—'}</td>
                      <td className="px-6 py-4 text-xs">
                        {song.drum_style ? (
                          <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20 text-[10px] px-2 py-0.5 rounded-full border border-indigo-200/20">🥁 {song.drum_style}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {song.has_chords ? (
                          <span className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-green-250/20">🎸 Sí</span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-650 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Song Detail Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          {/* Modal Backdrop overlay */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedSong(null)}></div>
          
          <AnimeZoomIn delay={0} duration={400} className="relative w-full max-w-4xl my-4 z-10">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full border border-gray-150 dark:border-white/10 overflow-hidden">
              {/* Header block */}
              <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 relative">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-white flex items-center gap-2">{selectedSong.title}</h2>
                    {selectedSong.artist && <p className="text-xs text-gray-400 dark:text-gray-450 font-bold">{selectedSong.artist}</p>}
                    
                    <div className="flex flex-wrap gap-2 mt-3 pt-1">
                      {selectedSong.song_types && (
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold px-2.5 py-1 rounded-xl border border-amber-200/50 dark:border-amber-800/30 uppercase">{selectedSong.song_types.name}</span>
                      )}
                      {selectedSong.song_styles && (
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-extrabold px-2.5 py-1 rounded-xl border border-blue-200/50 dark:border-blue-800/30 uppercase">{selectedSong.song_styles.name}</span>
                      )}
                      {selectedSong.bpm && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold px-2.5 py-1 rounded-xl font-mono">♩ {selectedSong.bpm} BPM</span>
                      )}
                      {selectedSong.drum_style && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-extrabold px-2.5 py-1 rounded-xl border border-indigo-200/20">🥁 Batería: {selectedSong.drum_style}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    {/* Lyrics Font Selector */}
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as any)}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl px-2.5 py-1.5 text-xxs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <option value="mono font-mono">Letra Monospace</option>
                      <option value="serif font-serif">Letra Serif</option>
                      <option value="sans font-sans">Letra Sans</option>
                    </select>

                    {/* Show/Hide Chords toggle */}
                    {selectedSong.has_chords && (
                      <button
                        onClick={() => setShowChords(!showChords)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xxs font-bold transition-all border cursor-pointer ${
                          showChords
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/35 dark:text-green-300 dark:border-green-900/30'
                            : 'bg-slate-100 text-gray-500 border-slate-200 dark:bg-slate-800 dark:border-slate-750 dark:text-gray-400'
                        }`}
                      >
                        {showChords ? <Eye size={12} /> : <EyeOff size={12} />}
                        {showChords ? 'Ver Acordes' : 'Sin acordes'}
                      </button>
                    )}

                    {/* Close button */}
                    <button 
                      onClick={() => setSelectedSong(null)} 
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Tabs bar */}
                <div className="flex gap-4 mt-6 border-t border-gray-150 dark:border-white/5 pt-4">
                  <button
                    onClick={() => setActiveTab('lyrics')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      activeTab === 'lyrics'
                        ? 'border-gold text-amber-700 dark:text-gold'
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Letra y Partitura</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer relative ${
                      activeTab === 'resources'
                        ? 'border-gold text-amber-700 dark:text-gold'
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white'
                    }`}
                  >
                    <PlayCircle size={14} />
                    <span>Recursos y Tutoriales</span>
                    {selectedSong.resource_links && selectedSong.resource_links.length > 0 && (
                      <span className="absolute -top-1 -right-4 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                        {selectedSong.resource_links.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
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
                    line-height: 2.3;
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
                  
                  /* Chord annotation style */
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
                  
                  /* Chord node wrapper (Tiptap custom node view) */
                  .song-lyrics span.chord-node-wrapper {
                    display: inline-block;
                    position: relative;
                    width: 0;
                    height: 0;
                    overflow: visible;
                    user-select: none;
                  }
                  .song-lyrics span.chord-node-wrapper::before {
                    content: attr(data-chord);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #dc2626;
                    font-family: 'Inter', sans-serif;
                    line-height: 1;
                    pointer-events: none;
                    white-space: nowrap;
                  }
                  .dark .song-lyrics span.chord-node-wrapper::before {
                    color: #f87171;
                  }
                  .song-lyrics.hide-chords span.chord-node-wrapper::before {
                    display: none;
                  }
                `}</style>

                {activeTab === 'lyrics' ? (
                  /* LYRICS TAB */
                  <div className="space-y-6">
                    {/* Copy Buttons Panel */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyChords(selectedSong)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-gold border border-amber-250/20 rounded-2xl text-[10px] font-bold uppercase transition-all cursor-pointer shadow-2xs"
                      >
                        <Copy size={11} />
                        <span>Copiar con acordes</span>
                      </button>
                      <button
                        onClick={() => copyOnlyLyrics(selectedSong)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-bold uppercase transition-all cursor-pointer shadow-2xs"
                      >
                        <Copy size={11} />
                        <span>Copiar solo letra</span>
                      </button>
                    </div>

                    <div className={`song-lyrics-wrapper font-${fontFamily}`}>
                      {selectedSong.structure_blocks && selectedSong.structure_blocks.length > 0 ? (
                        /* STRUCTURED RENDERING */
                        <div className="space-y-6">
                          {selectedSong.structure_blocks.map((block) => (
                            <div 
                              key={block.id} 
                              className="border border-slate-100 dark:border-white/5 rounded-3xl p-5 bg-slate-50/30 dark:bg-slate-950/10 space-y-3"
                            >
                              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2">
                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${
                                  block.type === 'coro'
                                    ? 'bg-amber-55 dark:bg-amber-950/40 text-amber-800 dark:text-gold border-amber-300/30'
                                    : block.type === 'intro'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-200/30'
                                }`}>
                                  {block.label}
                                </span>
                                {block.melody && (
                                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-0.5 rounded-lg border border-indigo-200/20 flex items-center gap-1" title="Guía de notas">
                                    <Info size={10} /> {block.melody}
                                  </span>
                                )}
                              </div>
                              <div 
                                className={`song-lyrics ${!showChords ? 'hide-chords' : ''}`}
                                dangerouslySetInnerHTML={{ __html: bracketTextToHtml(block.lyrics) }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* LEGACY HTML RENDERING */
                        <div
                          className={`song-lyrics ${!showChords ? 'hide-chords' : ''}`}
                          dangerouslySetInnerHTML={{ __html: selectedSong.lyrics || '<p class="text-gray-400 italic">Sin letra disponible</p>' }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  /* RESOURCES AND TUTORIALS TAB */
                  <div className="space-y-4">
                    {!selectedSong.resource_links || selectedSong.resource_links.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 p-12 rounded-3xl text-center space-y-2">
                        <PlayCircle className="mx-auto text-gray-300 dark:text-slate-850" size={36} />
                        <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Sin recursos</h5>
                        <p className="text-xxs text-gray-450 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                          No hay tutoriales o grabaciones de ensayo subidas para esta alabanza.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedSong.resource_links.map((link) => (
                          <div 
                            key={link.id} 
                            className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-4 rounded-2xl shadow-2xs hover:shadow-xs hover:border-gold/30 transition-all flex flex-col justify-between gap-3 group"
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                                  link.instrument === 'Batería'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200/30'
                                    : link.instrument === 'Piano'
                                    ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200/30'
                                    : link.instrument === 'Guitarra' || link.instrument === 'Bajo'
                                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/30'
                                    : 'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-gray-300 border-slate-200/30'
                                }`}>
                                  {link.instrument}
                                </span>
                                <PlayCircle size={14} className="text-gray-350 group-hover:text-amber-600 transition-colors" />
                              </div>
                              {link.comment && (
                                <p className="text-xxs text-gray-650 dark:text-gray-300 leading-normal font-semibold">
                                  {link.comment}
                                </p>
                              )}
                            </div>

                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-amber-700 hover:text-amber-800 dark:text-gold dark:hover:text-yellow-300 font-extrabold uppercase tracking-wide flex items-center gap-1 mt-1 transition-colors cursor-pointer"
                            >
                              <span>Ver referencia</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AnimeZoomIn>
        </div>
      )}
    </div>
  );
};

export default SongsLibrary;
