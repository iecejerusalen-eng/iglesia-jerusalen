import { Music } from 'lucide-react';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import type { Song } from '../../../types';
import { useRef } from 'react';

interface SongsListProps {
  loading: boolean;
  sorted: Song[];
  viewMode: 'cards' | 'table';
  setSelectedSong: (song: Song) => void;
  setActiveTab: (tab: 'lyrics' | 'resources') => void;
}

export const SongsList = ({ loading, sorted, viewMode, setSelectedSong, setActiveTab }: SongsListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-16 flex flex-col justify-center items-center gap-2 animate-pulse">
        <Music className="animate-bounce text-primary" size={28} />
        <span className="text-xs text-gray-400 font-semibold">Cargando himnario...</span>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-16 text-center space-y-3">
        <Music className="mx-auto text-gray-300 dark:text-slate-800 animate-pulse" size={48} />
        <h4 className="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wider">
          Sin Alabanzas
        </h4>
        <p className="text-xxs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
          No se encontraron canciones que coincidan con la búsqueda o los filtros actuales.
        </p>
      </div>
    );
  }

  if (viewMode === 'cards') {
    return (
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
    );
  }




  return (
    <div ref={parentRef} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm min-w-max">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-950/20 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider">
              <th className="px-6 py-4 whitespace-nowrap">Título</th>
              <th className="px-6 py-4 whitespace-nowrap">Artista</th>
              <th className="px-6 py-4 whitespace-nowrap">Tipo</th>
              <th className="px-6 py-4 whitespace-nowrap">Estilo</th>
              <th className="px-6 py-4 text-center whitespace-nowrap">BPM</th>
              <th className="px-6 py-4 whitespace-nowrap">Toque Batería</th>
              <th className="px-6 py-4 text-center whitespace-nowrap">Acordes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-300 font-medium">
            {sorted.map((song) => (
              <tr 
                key={song.id} 
                onClick={() => { setSelectedSong(song); setActiveTab('lyrics'); }}
                className="hover:bg-gray-50/50 dark:hover:bg-slate-850/20 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 font-bold text-gray-850 dark:text-white whitespace-nowrap max-w-xs truncate" title={song.title}>{song.title}</td>
                <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap max-w-[150px] truncate" title={song.artist || ''}>{song.artist || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {song.song_types ? (
                    <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-250/20 uppercase">{song.song_types.name}</span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {song.song_styles ? (
                    <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-250/20 uppercase">{song.song_styles.name}</span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4 text-center font-mono text-xs whitespace-nowrap">{song.bpm ? `♩ ${song.bpm}` : '—'}</td>
                <td className="px-6 py-4 text-xs whitespace-nowrap">
                  {song.drum_style ? (
                    <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20 text-[10px] px-2 py-0.5 rounded-full border border-indigo-200/20">🥁 {song.drum_style}</span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
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
  );
};
