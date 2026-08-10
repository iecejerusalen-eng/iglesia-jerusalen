import { getChordData, getChordVariationCount, type InstrumentType } from '../../utils/chordDictionary';
import { BassChordDiagram } from './BassChordDiagram';
import { PianoChordDiagram } from './PianoChordDiagram';
import { StringChordDiagram } from './StringChordDiagram';
import { Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { playInstrumentChord } from '../../utils/instrumentAudio';
import { useState } from 'react';
import { parseChord } from '../../utils/musicEngine';

interface InstrumentChordCardProps {
  chord: string;
  instrument: InstrumentType;
  compact?: boolean;
}

export function InstrumentChordCard({ chord, instrument, compact = false }: InstrumentChordCardProps) {
  const [variation, setVariation] = useState(0);
  const parsed = parseChord(chord);
  const chordData = getChordData(chord, instrument, variation);
  const width = compact ? 116 : 168;
  const variationCount = getChordVariationCount(chord, instrument);

  return (
    <article className="group flex min-w-[148px] flex-col items-center rounded-2xl border border-white/60 bg-white/75 p-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,.75)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
      <div className="mb-2 flex w-full items-center justify-between gap-2">
        <div className="min-w-0">
          <strong className="block truncate text-sm font-black text-amber-700 dark:text-amber-300">{chord}</strong>
          {parsed?.bass && <span className="mt-0.5 block text-[9px] font-bold text-indigo-600 dark:text-indigo-300">Bajo en {parsed.bass}</span>}
        </div>
        <div className="flex items-center gap-1">
          {instrument === 'electrica' && <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Voicing</span>}
          <button onClick={() => { try { playInstrumentChord(chord, instrument); } catch (error) { console.error('No se pudo reproducir el acorde.', error); toast.error('No se pudo reproducir este acorde.'); } }} className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-700 transition hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-300" aria-label={`Escuchar ${chord} en ${instrument}`} title="Escuchar acorde sintetizado"><Volume2 size={13} /></button>
        </div>
      </div>
      {(instrument === 'guitarra' || instrument === 'electrica') && (
        <StringChordDiagram chord={{ title: chord }} instrument="guitar" width={width} height={compact ? 128 : 155} color="currentColor" variation={variation} />
      )}
      {instrument === 'ukelele' && (
        <StringChordDiagram chord={{ title: chord }} instrument="ukulele" width={width} height={compact ? 128 : 155} color="currentColor" variation={variation} />
      )}
      {instrument === 'piano' && (
        chordData?.instrument === 'piano'
          ? <PianoChordDiagram notes={chordData.notes} bassNote={chordData.bassNote} width={compact ? 150 : 190} height={compact ? 70 : 84} />
          : <p className="py-8 text-xs text-slate-500">Sin digitación disponible</p>
      )}
      {instrument === 'bajo' && <BassChordDiagram chord={chord} width={compact ? 160 : 198} height={compact ? 95 : 112} />}
      {variationCount > 1 && !compact && <div className="mt-2 flex items-center gap-2"><button onClick={() => setVariation((value) => (value - 1 + variationCount) % variationCount)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-white/10" aria-label="Digitación anterior">‹</button><span className="text-[9px] font-bold text-slate-400">Forma {variation + 1}/{variationCount}</span><button onClick={() => setVariation((value) => (value + 1) % variationCount)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-white/10" aria-label="Siguiente digitación">›</button></div>}
    </article>
  );
}
