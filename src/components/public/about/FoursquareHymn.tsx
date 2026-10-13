import { BookOpenText, Music2 } from 'lucide-react';
import { hymnChorus, hymnVerses } from './foursquareHymnData';

export default function FoursquareHymn() {
  return (
    <section id="himno" aria-labelledby="hymn-heading" className="scroll-mt-28 py-12 sm:py-16">
      <div className="grid gap-8 border-y border-slate-200 py-10 dark:border-white/10 lg:grid-cols-[.75fr_1.25fr] lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-amber-700 dark:text-amber-300"><Music2 size={17} aria-hidden="true" /> Nuestra fe en una canción</span>
          <h2 id="hymn-heading" className="mt-4 font-serif text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">Himno Cuadrangular</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">Un canto que expresa el mensaje de Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene.</p>
          <div className="mt-8 rounded-2xl bg-indigo-950 px-6 py-7 text-white">
            <h3 className="text-xs font-bold uppercase tracking-[.18em] text-amber-300">Coro</h3>
            <p className="mt-4 whitespace-pre-line font-serif text-lg leading-8">{hymnChorus.join('\n')}</p>
          </div>
          <a href="/documentos/reglamento-interno.pdf#page=2" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-800 underline decoration-blue-800/30 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-amber-300">
            <BookOpenText size={17} aria-hidden="true" /> Reglamento interno · página 2 (PDF)
          </a>
        </div>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {hymnVerses.map((lines, index) => (
            <div key={lines[0]}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Estrofa {['I', 'II', 'III', 'IV'][index]}</h3>
              <p className="whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-200">{lines.join('\n')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
