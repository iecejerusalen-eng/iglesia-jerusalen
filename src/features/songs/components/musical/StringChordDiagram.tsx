import { useMemo } from 'react';
import { getChordData } from '../../utils/chordDictionary';

type Finger = [string: number, fret: number | 'x', label?: string];

export interface ChordPosition {
  fingers?: Finger[];
  barres?: { fret: number; fromString: number; toString: number }[];
  title?: string;
  position?: number;
}

interface StringChordDiagramProps {
  chord: ChordPosition;
  instrument?: 'guitar' | 'ukulele';
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  variation?: number;
}

function widestPlayableBarre(frets: number[], barreFret: number): { from: number; to: number } | null {
  const matchingIndexes = frets.map((fret, index) => fret === barreFret ? index : -1).filter((index) => index >= 0);
  let bestRange: { from: number; to: number } | null = null;
  for (const from of matchingIndexes) {
    for (const to of matchingIndexes) {
      if (to <= from) continue;
      const playableRange = frets.slice(from, to + 1).every((fret) => fret >= barreFret);
      if (playableRange && (!bestRange || to - from > bestRange.to - bestRange.from)) bestRange = { from, to };
    }
  }
  return bestRange;
}

export function StringChordDiagram({ chord, instrument = 'guitar', width = 120, height = 150, className = '', color = 'currentColor', variation = 0 }: StringChordDiagramProps) {
  const isUkulele = instrument === 'ukulele';
  const numStrings = isUkulele ? 4 : 6;
  const fretCount = 5;
  const resolvedData = useMemo(() => chord.fingers?.length ? null : getChordData(chord.title || '', isUkulele ? 'ukelele' : 'guitarra', variation), [chord.fingers?.length, chord.title, isUkulele, variation]);
  const resolved = useMemo(() => {
    const fingers: Finger[] = [];
    const barres: ChordPosition['barres'] = [];
    let position = chord.position || 1;
    if (chord.fingers?.length) {
      fingers.push(...chord.fingers);
      barres.push(...(chord.barres || []));
    } else if (resolvedData?.instrument === 'guitarra' || resolvedData?.instrument === 'ukelele') {
      for (let i = 0; i < numStrings; i += 1) {
        const fret = resolvedData.frets[i];
        const finger = resolvedData.fingers[i];
        const stringIndex = numStrings - i;
        fingers.push([stringIndex, fret === -1 ? 'x' : fret, fret > 0 && finger > 0 ? String(finger) : undefined]);
      }
      position = resolvedData.baseFret || 1;
      for (const barreFret of resolvedData.barres || []) {
        const range = widestPlayableBarre(resolvedData.frets, barreFret);
        if (range) barres.push({ fret: barreFret, fromString: numStrings - range.from, toString: numStrings - range.to });
      }
    }
    return { fingers, barres, position };
  }, [chord.barres, chord.fingers, chord.position, numStrings, resolvedData]);

  if (!resolved.fingers.length) return <div className={`grid place-items-center rounded-xl border border-dashed border-slate-200 px-3 text-center text-[11px] leading-4 text-slate-500 dark:border-white/10 ${className}`} style={{ width, height }}>No existe una digitación segura para {chord.title || 'este acorde'}.</div>;

  const left = 20;
  const right = 100;
  const top = 30;
  const bottom = 130;
  const stringSpacing = (right - left) / (numStrings - 1);
  const fretSpacing = (bottom - top) / fretCount;
  const xForString = (string: number) => left + (numStrings - string) * stringSpacing;
  const yForFret = (fret: number) => top + (fret - resolved.position + 0.5) * fretSpacing;

  return <div className={`overflow-hidden rounded-xl ${className}`} style={{ width, height }} role="img" aria-label={`Diagrama de acorde ${chord.title}`}>
    <svg viewBox="0 0 120 150" width="100%" height="100%" aria-hidden="true">
      <g stroke={color} fill="none" strokeLinecap="round">
        {Array.from({ length: numStrings }, (_, index) => <line key={`string-${index}`} x1={left + index * stringSpacing} y1={top} x2={left + index * stringSpacing} y2={bottom} strokeWidth="1.4" />)}
        {Array.from({ length: fretCount + 1 }, (_, index) => <line key={`fret-${index}`} x1={left} y1={top + index * fretSpacing} x2={right} y2={top + index * fretSpacing} strokeWidth={index === 0 && resolved.position === 1 ? 4 : 1.4} />)}
        {resolved.position > 1 && <text x="106" y={top + fretSpacing * 0.7} fill={color} stroke="none" fontSize="7" fontFamily="sans-serif">{resolved.position}fr</text>}
        {resolved.barres.map((barre) => { const x1 = Math.min(xForString(barre.fromString), xForString(barre.toString)); const x2 = Math.max(xForString(barre.fromString), xForString(barre.toString)); return <line key={`barre-${barre.fret}-${barre.fromString}`} x1={x1} y1={yForFret(barre.fret)} x2={x2} y2={yForFret(barre.fret)} strokeWidth="7" />; })}
      </g>
      {resolved.fingers.map(([string, fret, label], index) => { const x = xForString(string); if (fret === 0) return <text key={`finger-${index}`} x={x} y={top - 8} textAnchor="middle" fill={color} fontSize="10" fontFamily="sans-serif">○</text>; if (fret === 'x') return <text key={`finger-${index}`} x={x} y={top - 8} textAnchor="middle" fill={color} fontSize="10" fontFamily="sans-serif">×</text>; const y = yForFret(fret); return <g key={`finger-${index}`}><circle cx={x} cy={y} r="5" fill={color} /><text x={x} y={y + 2.5} textAnchor="middle" fill="white" fontSize="6" fontFamily="sans-serif">{label || ''}</text></g>; })}
    </svg>
  </div>;
}
