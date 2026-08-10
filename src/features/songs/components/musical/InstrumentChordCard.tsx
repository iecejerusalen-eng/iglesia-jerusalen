import { Chord } from '@tonaljs/tonal';
import type { InstrumentType } from '../../utils/chordDictionary';
import { BassChordDiagram } from './BassChordDiagram';
import { PianoChordDiagram } from './PianoChordDiagram';
import { StringChordDiagram } from './StringChordDiagram';

interface InstrumentChordCardProps {
  chord: string;
  instrument: InstrumentType;
  compact?: boolean;
}

export function InstrumentChordCard({ chord, instrument, compact = false }: InstrumentChordCardProps) {
  const parsed = Chord.get(chord);
  const width = compact ? 116 : 168;

  return (
    <article className="group flex min-w-[148px] flex-col items-center rounded-2xl border border-white/60 bg-white/75 p-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,.75)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
      <div className="mb-2 flex w-full items-center justify-between gap-2">
        <strong className="text-sm font-black text-amber-700 dark:text-amber-300">{chord}</strong>
        {instrument === 'electrica' && <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Voicing</span>}
      </div>
      {(instrument === 'guitarra' || instrument === 'electrica') && (
        <StringChordDiagram chord={{ title: chord }} instrument="guitar" width={width} height={compact ? 128 : 155} color="currentColor" />
      )}
      {instrument === 'ukelele' && (
        <StringChordDiagram chord={{ title: chord }} instrument="ukulele" width={width} height={compact ? 128 : 155} color="currentColor" />
      )}
      {instrument === 'piano' && (
        parsed.empty
          ? <p className="py-8 text-xs text-slate-500">Sin digitación disponible</p>
          : <PianoChordDiagram notes={parsed.notes} width={compact ? 150 : 190} height={compact ? 70 : 84} />
      )}
      {instrument === 'bajo' && <BassChordDiagram chord={chord} width={compact ? 160 : 198} height={compact ? 95 : 112} />}
    </article>
  );
}
