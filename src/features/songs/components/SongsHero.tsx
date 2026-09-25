import { BookOpenText, Compass, Guitar, Music2, Sparkles, Wand2 } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

interface SongsHeroProps {
  totalSongs: number;
  songsWithChords: number;
  onExplore?: () => void;
  onRandomSong?: () => void;
}

export const SongsHero = ({ totalSongs, songsWithChords, onExplore, onRandomSong }: SongsHeroProps) => {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#020617] via-[#071333] to-[#04091a] px-4 py-16 text-white md:py-24">
      {/* ─── Celestial Worship Ambient Lights ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-24 size-[32rem] rounded-full bg-[radial-gradient(circle,rgba(199,157,63,0.18),transparent_65%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/4 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.15),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-church-gold/40 to-transparent"
      />

      {/* ─── Subtle Sacred Stave / Waveform Lines ─── */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="stave-pattern" width="120" height="80" patternUnits="userSpaceOnUse">
            <path d="M 0 16 L 120 16 M 0 28 L 120 28 M 0 40 L 120 40 M 0 52 L 120 52 M 0 64 L 120 64" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stave-pattern)" />
      </svg>

      <div className="relative mx-auto max-w-6xl">
        <AnimeFadeUp delay={0} duration={650}>
          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            {/* ─── Left Column: Title & Biblical Call to Worship ─── */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-church-gold/30 bg-church-gold/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-church-gold-bright shadow-sm backdrop-blur-md">
                <Music2 size={14} className="text-church-gold-light animate-pulse" aria-hidden="true" />
                <span>Cancionero & Altar de Adoración • Iglesia Jerusalén</span>
              </div>

              {/* Main Heading */}
              <div>
                <h1 className="font-serif text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Alabanzas e <span className="bg-gradient-to-r from-church-gold-bright via-amber-300 to-church-gold-light bg-clip-text text-transparent">Himnos</span>
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  Letras, cifrados con transposición interactiva y recursos musicales para guiar a la congregación en cada tiempo de adoración.
                </p>
              </div>

              {/* Scripture Verse Card */}
              <blockquote className="relative overflow-hidden rounded-2xl border border-church-gold/20 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4 text-xs italic leading-relaxed text-blue-100/90 shadow-inner backdrop-blur-xl sm:text-sm">
                <div className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-church-gold/20 text-church-gold-bright">
                    <Sparkles size={14} aria-hidden="true" />
                  </span>
                  <p>
                    «Canten al Señor un cántico nuevo; canten al Señor, habitantes de toda la tierra. Canten al Señor, bendigan su nombre; proclamen día tras día su salvación.»
                    <span className="mt-1 block font-sans text-[11px] font-bold uppercase not-italic tracking-wider text-church-gold-bright">
                      — Salmo 96:1–2
                    </span>
                  </p>
                </div>
              </blockquote>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onExplore}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-church-gold-dark via-amber-600 to-church-gold-medium px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-600/25 active:scale-95"
                >
                  <Compass size={17} aria-hidden="true" />
                  <span>Explorar cancionero</span>
                </button>

                {onRandomSong && (
                  <button
                    type="button"
                    onClick={onRandomSong}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur-md transition-all duration-200 hover:border-church-gold/40 hover:bg-white/[0.12] hover:text-white active:scale-95"
                    title="Abre una alabanza aleatoria para inspirarte hoy"
                  >
                    <Wand2 size={16} className="text-church-gold-bright" aria-hidden="true" />
                    <span>Inspiración del día</span>
                  </button>
                )}
              </div>
            </div>

            {/* ─── Right Column: Worship Library Stats Cards ─── */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
              {/* Total Songs */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-church-gold/40 hover:shadow-2xl">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-church-gold/10 text-church-gold-light shadow-inner">
                  <BookOpenText size={20} aria-hidden="true" />
                </div>
                <strong className="mt-4 block font-serif text-3xl font-extrabold tracking-tight text-white tabular-nums sm:text-4xl">
                  {totalSongs}
                </strong>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Alabanzas registradas
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  Repertorio oficial
                </span>
              </div>

              {/* Chords */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-2xl">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 shadow-inner">
                  <Guitar size={20} aria-hidden="true" />
                </div>
                <strong className="mt-4 block font-serif text-3xl font-extrabold tracking-tight text-white tabular-nums sm:text-4xl">
                  {songsWithChords}
                </strong>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Con acordes
                </span>
                <span className="mt-0.5 block text-[11px] text-emerald-400/90 font-medium">
                  Cifrado interactivo
                </span>
              </div>

              {/* Musical Features Box (Spans 2 cols) */}
              <div className="col-span-2 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-blue-900/30 via-white/[0.05] to-amber-900/20 p-4 shadow-lg backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-church-gold/15 text-church-gold-bright">
                    <Music2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">
                      Herramientas para Músicos
                    </p>
                    <p className="truncate text-[11px] text-slate-300">
                      Transportador de tonos • Diagramas de guitarra y piano • PDF
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimeFadeUp>
      </div>
    </section>
  );
};
