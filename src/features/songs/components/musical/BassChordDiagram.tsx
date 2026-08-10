import { parseChord } from '../../utils/musicEngine';
import { Chord } from '@tonaljs/tonal';

interface BassChordDiagramProps {
  chord: string;
  width?: number;
  height?: number;
  className?: string;
}

const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
const OPEN_STRINGS = [
  { label: 'G', pitch: 7 },
  { label: 'D', pitch: 2 },
  { label: 'A', pitch: 9 },
  { label: 'E', pitch: 4 },
];

function pitchIndex(note: string): number {
  return PITCHES.indexOf(FLAT_TO_SHARP[note] ?? note);
}

export function BassChordDiagram({ chord, width = 190, height = 105, className = '' }: BassChordDiagramProps) {
  const parsed = parseChord(chord);
  if (!parsed) {
    return <div className={`text-xs text-slate-500 ${className}`}>Acorde no reconocido</div>;
  }

  const root = pitchIndex(parsed.root);
  const chordPitches = new Set(Chord.get(chord).notes.map(pitchIndex).filter((pitch) => pitch >= 0));
  const left = 24;
  const top = 12;
  const fretCount = 7;
  const fretWidth = (width - left - 8) / fretCount;
  const stringGap = (height - top - 24) / 3;

  return (
    <div className={className} aria-label={`Diapasón de bajo para ${chord}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
        <title>{`Raíz y quinta del acorde ${chord} en bajo`}</title>
        {OPEN_STRINGS.map((string, stringIndex) => {
          const y = top + stringIndex * stringGap;
          return (
            <g key={string.label}>
              <text x={3} y={y + 4} className="fill-slate-400 text-[9px] font-bold">{string.label}</text>
              <line x1={left} x2={width - 8} y1={y} y2={y} className="stroke-slate-400/70" strokeWidth={1 + stringIndex * 0.25} />
              {Array.from({ length: fretCount }, (_, fretIndex) => {
                const fret = fretIndex + 1;
                const note = (string.pitch + fret) % 12;
                if (!chordPitches.has(note)) return null;
                const x = left + (fretIndex + 0.5) * fretWidth;
                const isRoot = note === root;
                return (
                  <g key={`${string.label}-${fret}`}>
                    <circle cx={x} cy={y} r={6.5} className={isRoot ? 'fill-amber-500' : 'fill-sky-500'} />
                    <text x={x} y={y + 3} textAnchor="middle" className="fill-white text-[7px] font-black">{isRoot ? 'R' : PITCHES[note].replace('#', '♯')}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {Array.from({ length: fretCount + 1 }, (_, index) => (
          <line key={index} x1={left + index * fretWidth} x2={left + index * fretWidth} y1={top} y2={top + stringGap * 3} className="stroke-slate-300 dark:stroke-slate-600" strokeWidth={index === 0 ? 3 : 1} />
        ))}
        {Array.from({ length: fretCount }, (_, index) => (
          <text key={index} x={left + (index + 0.5) * fretWidth} y={height - 3} textAnchor="middle" className="fill-slate-400 text-[8px]">{index + 1}</text>
        ))}
      </svg>
      <div className="flex justify-center gap-3 text-[9px] font-bold uppercase tracking-wide text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Raíz</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />Notas del acorde</span>
      </div>
    </div>
  );
}
