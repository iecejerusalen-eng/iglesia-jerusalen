import { Search, Filter, LayoutGrid, Table, ChevronDown } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { DRUM_STYLES } from '../utils/songUtils';
import type { SongType, SongStyle } from '../../../types';

interface SongsFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  viewMode: 'cards' | 'table';
  setViewMode: (val: 'cards' | 'table') => void;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterStyle: string;
  setFilterStyle: (val: string) => void;
  filterDrumStyle: string;
  setFilterDrumStyle: (val: string) => void;
  filterChords: 'all' | 'yes' | 'no';
  setFilterChords: (val: 'all' | 'yes' | 'no') => void;
  sortBy: 'title-asc' | 'title-desc' | 'bpm-asc' | 'bpm-desc' | 'newest' | 'oldest';
  setSortBy: (val: 'title-asc' | 'title-desc' | 'bpm-asc' | 'bpm-desc' | 'newest' | 'oldest') => void;
  songTypes: SongType[];
  songStyles: SongStyle[];
}

export const SongsFilters = ({
  search, setSearch, viewMode, setViewMode, showFilters, setShowFilters,
  filterType, setFilterType, filterStyle, setFilterStyle,
  filterDrumStyle, setFilterDrumStyle, filterChords, setFilterChords,
  sortBy, setSortBy, songTypes, songStyles
}: SongsFiltersProps) => {
  return (
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
  );
};
