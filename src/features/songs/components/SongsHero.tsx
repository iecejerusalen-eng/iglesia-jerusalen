import { BookOpenText, Guitar, Music2 } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

interface SongsHeroProps {
  totalSongs: number;
  songsWithChords: number;
}

export const SongsHero = ({ totalSongs, songsWithChords }: SongsHeroProps) => {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-slate-950 px-4 py-12 text-white md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(199,157,63,0.16),transparent_32%),radial-gradient(circle_at_85%_0%,rgba(59,130,246,0.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl">
        <AnimeFadeUp delay={0} duration={600}>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-church-gold/25 bg-church-gold/10 px-3 py-1.5 text-xs font-semibold text-church-gold-bright">
                <Music2 size={14} aria-hidden="true" />
                Cancionero de la Iglesia Jerusalén
              </div>
              <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">Alabanzas e Himnos</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                Encuentra letras, acordes y recursos para preparar cada tiempo de adoración.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 md:w-auto">
              <div className="min-w-32 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <BookOpenText className="mb-3 text-church-gold-light" size={19} aria-hidden="true" />
                <strong className="block text-2xl font-bold tabular-nums">{totalSongs}</strong>
                <span className="text-xs text-slate-400">canciones</span>
              </div>
              <div className="min-w-32 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <Guitar className="mb-3 text-emerald-400" size={19} aria-hidden="true" />
                <strong className="block text-2xl font-bold tabular-nums">{songsWithChords}</strong>
                <span className="text-xs text-slate-400">con acordes</span>
              </div>
            </div>
          </div>
        </AnimeFadeUp>
      </div>
    </section>
  );
};
