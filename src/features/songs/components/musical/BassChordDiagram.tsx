import { Chord, Note } from '@tonaljs/tonal';
import { parseChord, transposeNote } from '../../utils/musicEngine';

interface BassChordDiagramProps {
  chord: string;
  width?: number;
  height?: number;
  className?: string;
}

const OPEN_STRINGS = [
  { label: 'G', midi: 43 },
  { label: 'D', midi: 38 },
  { label: 'A', midi: 33 },
  { label: 'E', midi: 28 },
];

function normalizedNote(note: string): string {
  return transposeNote(note, 0, note.includes('b') ? 'flat' : 'sharp', note);
}

function roleFromInterval(interval: string): string {
  const degree = interval.match(/\d+/)?.[0];
  if (degree === '1' || degree === '8') return 'R';
  if (degree === '2' || degree === '9') return '9';
  if (degree === '4' || degree === '11') return '11';
  if (degree === '6' || degree === '13') return '13';
  return degree ?? '•';
}

export function BassChordDiagram({ chord, width = 190, height = 118, className = '' }: BassChordDiagramProps) {
  const parsed = parseChord(chord);
  if (!parsed) {
    return <div className={`text-xs text-slate-500 ${className}`}>Acorde no reconocido</div>;
  }

  const root = normalizedNote(parsed.root);
  const bass = parsed.bass ? normalizedNote(parsed.bass) : null;
  const tonalChord = Chord.get(`${root}${parsed.quality}`);
  if (tonalChord.empty) {
    return <div className={`text-xs text-slate-500 ${className}`}>Acorde no reconocido</div>;
  }
  const rootPitch = Note.chroma(root);
  const bassPitch = bass ? Note.chroma(bass) : null;
  const roleByPitch = new Map<number, string>();
  tonalChord.notes.forEach((note, index) => {
    const pitch = Note.chroma(note);
    if (typeof pitch === 'number') roleByPitch.set(pitch, roleFromInterval(tonalChord.intervals[index] ?? ''));
  });
  if (typeof bassPitch === 'number' && !roleByPitch.has(bassPitch)) roleByPitch.set(bassPitch, 'B');

  const left = 24;
  const top = 15;
  const fretCount = 7;
  const fretWidth = (width - left - 8) / fretCount;
  const stringGap = (height - top - 32) / 3;

  return (
    <div className={className} aria-label={`Mapa de arpegio de bajo para ${chord}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
        <title>{`Mapa de arpegio del acorde ${chord}; no representa una escala`}</title>
        {OPEN_STRINGS.map((string, stringIndex) => {
          const y = top + stringIndex * stringGap;
          return (
            <g key={string.label}>
              <text x={3} y={y + 4} className="fill-slate-400 text-[9px] font-bold">{string.label}</text>
              <line x1={left} x2={width - 8} y1={y} y2={y} className="stroke-slate-400/70" strokeWidth={1 + stringIndex * 0.25} />
              {Array.from({ length: fretCount + 1 }, (_, fret) => {
                const note = (string.midi + fret) % 12;
                const role = roleByPitch.get(note);
                if (!role) return null;
                const x = fret === 0 ? left - 7 : left + (fret - 0.5) * fretWidth;
                const isBass = bass !== null && note === bassPitch;
                const isRoot = note === rootPitch;
                return (
                  <g key={`${string.label}-${fret}`}>
                    <circle cx={x} cy={y} r={6.7} className={isBass ? 'fill-indigo-500' : isRoot ? 'fill-amber-500' : 'fill-sky-500'} />
                    <text x={x} y={y + 3} textAnchor="middle" className="fill-white text-[7px] font-black">{isBass ? 'B' : role}</text>
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
          <text key={index} x={left + (index + 0.5) * fretWidth} y={height - 10} textAnchor="middle" className="fill-slate-400 text-[8px]">{index + 1}</text>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">
        {bass && <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />Bajo indicado</span>}
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Raíz</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />Arpegio</span>
      </div>
      <p className="mt-1 text-center text-[9px] font-semibold text-slate-400">Mapa de notas del acorde · no es una escala</p>
    </div>
  );
}
