import { ArrowRight, Drum, FileMusic, Gauge, Guitar, Music2, UserRound } from 'lucide-react';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import type { Song } from '../../../types';
import type { SongViewMode } from './SongsFilters';

interface SongsListProps {
  loading: boolean;
  error: boolean;
  songs: Song[];
  totalResults: number;
  viewMode: SongViewMode;
  hasMore: boolean;
  onShowMore: () => void;
  onSelectSong: (song: Song) => void;
}

const SongSkeleton = () => (
  <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-3 h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-16 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
  </div>
);

export const SongsList = ({ loading, error, songs, totalResults, viewMode, hasMore, onShowMore, onSelectSong }: SongsListProps) => {
  if (loading) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando alabanzas">{Array.from({ length: 6 }, (_, index) => <SongSkeleton key={index} />)}</div>;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="font-serif text-xl font-bold text-red-900 dark:text-red-200">No pudimos cargar el cancionero</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-red-700 dark:text-red-300">Comprueba tu conexión e intenta actualizar la página.</p>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Music2 size={25} aria-hidden="true" /></span>
        <h2 className="mt-4 font-serif text-xl font-bold text-slate-900 dark:text-white">No encontramos esa alabanza</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">Prueba con otro título, artista o elimina alguno de los filtros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'cards' ? (
        <AnimeStaggerGrid delay={50} staggerDelay={25} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <button
              type="button"
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="group flex min-h-48 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-church-gold/60 hover:shadow-lg hover:shadow-slate-900/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-church-gold/20 dark:border-white/10 dark:bg-slate-900 dark:hover:border-church-gold/50"
            >
              <div className="flex w-full items-start justify-between gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-church-gold-light dark:bg-white/5"><FileMusic size={19} aria-hidden="true" /></span>
                {song.has_chords && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"><Guitar size={12} aria-hidden="true" /> Acordes</span>}
              </div>

              <div className="mt-4 min-w-0 flex-1">
                <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-church-gold-dark dark:text-white dark:group-hover:text-church-gold-light">{song.title}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 truncate text-sm text-slate-500 dark:text-slate-400"><UserRound size={13} aria-hidden="true" /> {song.artist || 'Autor no especificado'}</p>
              </div>

              <div className="mt-5 flex w-full items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {song.song_types && <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">{song.song_types.name}</span>}
                  {song.bpm && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Gauge size={11} aria-hidden="true" /> {song.bpm} BPM</span>}
                </div>
                <ArrowRight size={17} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-church-gold-medium" aria-hidden="true" />
              </div>
            </button>
          ))}
        </AnimeStaggerGrid>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {songs.map((song) => (
              <button type="button" key={song.id} onClick={() => onSelectSong(song)} className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-church-gold/20 dark:hover:bg-white/[0.03] md:px-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Music2 size={18} aria-hidden="true" /></span>
                <span className="min-w-0">
                  <strong className="block truncate font-serif text-base text-slate-900 group-hover:text-church-gold-dark dark:text-white dark:group-hover:text-church-gold-light">{song.title}</strong>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{song.artist || 'Autor no especificado'}</span>
                    {song.bpm && <span className="inline-flex items-center gap-1"><Gauge size={12} aria-hidden="true" /> {song.bpm} BPM</span>}
                    {song.drum_style && <span className="hidden items-center gap-1 sm:inline-flex"><Drum size={12} aria-hidden="true" /> {song.drum_style}</span>}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {song.has_chords && <Guitar size={16} className="text-emerald-600 dark:text-emerald-400" aria-label="Con acordes" />}
                  <ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-church-gold-medium" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex flex-col items-center gap-2">
          <button type="button" onClick={onShowMore} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-church-gold/50 hover:text-church-gold-dark dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-church-gold-light">Mostrar más alabanzas</button>
          <span className="text-xs text-slate-400">Mostrando {songs.length} de {totalResults}</span>
        </div>
      )}
    </div>
  );
};
