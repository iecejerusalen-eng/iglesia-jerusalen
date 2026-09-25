import { ArrowRight, Drum, FileMusic, Gauge, Guitar, Mic2, Music2, RotateCcw, Sparkles } from 'lucide-react';
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
  onRetry: () => void;
}

const SongSkeleton = () => (
  <div className="h-56 animate-pulse rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
    <div className="flex items-center justify-between">
      <div className="size-11 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="mt-5 h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
    <div className="mt-2 h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
      <div className="h-5 w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800" />
    </div>
  </div>
);

export const SongsList = ({
  loading,
  error,
  songs,
  totalResults,
  viewMode,
  hasMore,
  onShowMore,
  onSelectSong,
  onRetry,
}: SongsListProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando alabanzas">
        {Array.from({ length: 6 }, (_, index) => (
          <SongSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-3xl border border-red-200/80 bg-red-50/80 p-8 text-center shadow-lg backdrop-blur-xl dark:border-red-900/50 dark:bg-red-950/30 sm:p-12"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
          <FileMusic size={26} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-serif text-2xl font-bold text-red-900 dark:text-red-200">
          No pudimos conectar con el cancionero
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-red-700 dark:text-red-300">
          Comprueba tu conexión a internet e inténtalo nuevamente para acceder al repertorio de alabanzas.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 active:scale-95"
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span>Reintentar carga</span>
        </button>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
        <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-amber-500/10 text-church-gold-medium shadow-inner dark:bg-amber-400/10 dark:text-church-gold-bright">
          <Music2 size={30} aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-serif text-2xl font-bold text-slate-900 dark:text-white">
          No encontramos ninguna alabanza
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Prueba buscando con otro término, artista o restablece los filtros para ver todo el cancionero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {viewMode === 'cards' ? (
        <AnimeStaggerGrid delay={40} staggerDelay={30} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <button
              type="button"
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="group relative flex min-h-[14.5rem] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-5 text-left shadow-[0_4px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-church-gold/60 hover:bg-white hover:shadow-xl hover:shadow-amber-500/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-church-gold/20 dark:border-white/10 dark:bg-slate-900/80 dark:hover:border-church-gold/50 dark:hover:bg-slate-900"
            >
              {/* ─── Top Header: Musical Icon & Badges ─── */}
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-church-gold/25 bg-gradient-to-br from-amber-500/15 via-church-gold/10 to-blue-600/10 text-church-gold-dark shadow-inner transition-transform duration-300 group-hover:scale-105 group-hover:border-church-gold/50 dark:text-church-gold-bright">
                  <FileMusic size={20} aria-hidden="true" />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {/* Tonalidad / Clave musical */}
                  {song.original_key && (
                    <span
                      title={`Tonalidad original: ${song.original_key}`}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-50/90 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                    >
                      <Sparkles size={10} aria-hidden="true" />
                      Tono {song.original_key}
                    </span>
                  )}

                  {/* Chords Badge */}
                  {song.has_chords ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Guitar size={11} aria-hidden="true" />
                      Acordes
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Letra
                    </span>
                  )}
                </div>
              </div>

              {/* ─── Center: Title, Artist & Category ─── */}
              <div className="mt-3.5 min-w-0 flex-1">
                <h3 className="line-clamp-2 font-serif text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-church-gold-dark dark:text-white dark:group-hover:text-church-gold-bright">
                  {song.title}
                </h3>
                <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Mic2 size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="truncate">{song.artist || 'Autor desconocido'}</span>
                </p>

                {/* Sub-badges: Type and Style */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {song.song_types && (
                    <span className="rounded-md border border-amber-200/60 bg-amber-50/70 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-300">
                      {song.song_types.name}
                    </span>
                  )}
                  {song.song_styles && (
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300">
                      {song.song_styles.name}
                    </span>
                  )}
                </div>
              </div>

              {/* ─── Bottom Footer: Tempo, Rhythm & Action Arrow ─── */}
              <div className="mt-4 flex w-full items-center justify-between gap-3 border-t border-slate-100/90 pt-3.5 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {song.bpm ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Gauge size={12} className="text-church-gold-medium" aria-hidden="true" />
                      {song.bpm} BPM
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">Tempo libre</span>
                  )}

                  {song.drum_style && (
                    <span className="hidden items-center gap-1 rounded-xl bg-slate-100/80 px-2 py-1 text-[10px] font-semibold text-slate-600 sm:inline-flex dark:bg-slate-800/80 dark:text-slate-300">
                      <Drum size={11} aria-hidden="true" />
                      {song.drum_style}
                    </span>
                  )}
                </div>

                {/* Animated Equalizer on Hover + Action Circle */}
                <div className="flex items-center gap-2">
                  {/* Subtle 3-bar equalizer animation on group-hover */}
                  <div className="flex items-end gap-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="h-3 w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] rounded-full bg-church-gold-medium" />
                    <span className="h-4 w-0.5 animate-[pulse_0.4s_ease-in-out_infinite_0.1s] rounded-full bg-church-gold-bright" />
                    <span className="h-2 w-0.5 animate-[pulse_0.5s_ease-in-out_infinite_0.2s] rounded-full bg-church-gold-light" />
                  </div>

                  <span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all duration-200 group-hover:bg-church-gold-dark group-hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-church-gold-light dark:group-hover:text-slate-950">
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </AnimeStaggerGrid>
      ) : (
        /* ─── Compact List / Table View ─── */
        <div className="space-y-2.5">
          {songs.map((song) => (
            <button
              type="button"
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3.5 text-left shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-church-gold/60 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-slate-900/80 dark:hover:border-church-gold/50 md:px-5"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-church-gold/20 bg-gradient-to-br from-amber-500/10 to-blue-500/10 text-church-gold-dark dark:text-church-gold-bright">
                  <Music2 size={18} aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="truncate font-serif text-base font-bold text-slate-900 group-hover:text-church-gold-dark dark:text-white dark:group-hover:text-church-gold-bright">
                      {song.title}
                    </strong>
                    {song.original_key && (
                      <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                        {song.original_key}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {song.artist || 'Autor desconocido'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {song.bpm && (
                  <span className="hidden items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 sm:inline-flex dark:bg-slate-800 dark:text-slate-300">
                    <Gauge size={12} /> {song.bpm} BPM
                  </span>
                )}

                {song.has_chords && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Guitar size={13} />
                    <span className="hidden sm:inline">Acordes</span>
                  </span>
                )}

                <ArrowRight
                  size={16}
                  className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-church-gold-medium dark:text-slate-600"
                  aria-hidden="true"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ─── Show More Button ─── */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onShowMore}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-bold text-slate-800 shadow-md backdrop-blur-xl transition hover:border-church-gold/60 hover:text-church-gold-dark hover:shadow-lg active:scale-95 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:text-church-gold-bright"
          >
            <span>Mostrar más alabanzas</span>
            <ArrowRight size={15} />
          </button>
          <span className="text-xs font-medium text-slate-400">
            Mostrando {songs.length} de {totalResults} en el repertorio
          </span>
        </div>
      )}
    </div>
  );
};
