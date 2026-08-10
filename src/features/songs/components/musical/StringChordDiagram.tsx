import React, { useEffect, useMemo, useRef } from 'react';
import { SVGuitarChord, type Barre, type Finger } from 'svguitar';
import { getChordData } from '../../utils/chordDictionary';

export interface ChordPosition {
  fingers?: Finger[]; // [string, fret/open/muted, optional label]
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
  const matchingIndexes = frets
    .map((fret, index) => fret === barreFret ? index : -1)
    .filter((index) => index >= 0);
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

export function StringChordDiagram({
  chord,
  instrument = 'guitar',
  width = 120,
  height = 150,
  className = '',
  color = 'currentColor',
  variation = 0,
}: StringChordDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUkulele = instrument === 'ukulele';
  const resolvedData = useMemo(
    () => chord.fingers?.length ? null : getChordData(chord.title || '', isUkulele ? 'ukelele' : 'guitarra', variation),
    [chord.fingers?.length, chord.title, isUkulele, variation],
  );
  const canRender = Boolean(chord.fingers?.length || resolvedData?.instrument === 'guitarra' || resolvedData?.instrument === 'ukelele');

  useEffect(() => {
    if (!containerRef.current || !canRender) return;
    containerRef.current.replaceChildren();
    
    let resolvedFingers: Finger[] = [];
    let resolvedBarres: Barre[] = [];
    let position = chord.position || 1;

    if (!chord.fingers || chord.fingers.length === 0) {
      const data = resolvedData;
      if (data?.instrument === 'guitarra' || data?.instrument === 'ukelele') {
        const numStrings = isUkulele ? 4 : 6;
        for (let i = 0; i < numStrings; i++) {
          const fret = data.frets[i];
          const finger = data.fingers[i];
          const stringIndex = numStrings - i; // In chords-db, index 0 is string 6 (lowest)
          
          if (fret === -1) {
            resolvedFingers.push([stringIndex, 'x']);
          } else if (fret === 0) {
            resolvedFingers.push([stringIndex, 0]);
          } else {
            resolvedFingers.push([stringIndex, fret, finger > 0 ? String(finger) : undefined]);
          }
        }
        position = data.baseFret || 1;
        if (data.barres && data.barres.length > 0) {
          resolvedBarres = data.barres.flatMap((barreFret: number) => {
            const bestRange = widestPlayableBarre(data.frets, barreFret);
            if (!bestRange) return [];
            const range: Barre = {
              fret: barreFret,
              fromString: numStrings - bestRange.from,
              toString: numStrings - bestRange.to,
            };
            return [range];
          });
        }
      }
    } else {
      // Manual fingers from props
      resolvedFingers = chord.fingers.map((finger) => [...finger] as Finger);
      resolvedBarres = chord.barres?.map(b => ({
        fret: b.fret,
        fromString: b.fromString,
        toString: b.toString
      })) || [];
    }

    const chart = new SVGuitarChord(containerRef.current)
      .chord({
        fingers: resolvedFingers,
        barres: resolvedBarres,
        title: '',
      })
      .configure({
        strings: isUkulele ? 4 : 6,
        frets: isUkulele ? 4 : 5,
        position: position,
        color: color,
        fretColor: color,
        stringColor: color,
        titleColor: color,
        strokeWidth: 2,
        nutWidth: 4,
        fontFamily: 'Inter, sans-serif',
        titleFontSize: 40,
        fixedDiagramPosition: true
      });
    chart.draw();
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.overflow = 'hidden';
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
  }, [canRender, chord.barres, chord.fingers, chord.position, color, isUkulele, resolvedData]);

  if (!canRender) {
    return (
      <div className={`grid place-items-center rounded-xl border border-dashed border-slate-200 px-3 text-center text-[11px] leading-4 text-slate-500 dark:border-white/10 ${className}`} style={{ width, height }}>
        No existe una digitación segura para {chord.title || 'este acorde'}.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`svg-chord-diagram overflow-hidden rounded-xl ${className}`}
      style={{ width, height, padding: '6px' }}
      aria-label={`Diagrama de acorde ${chord.title}`}
    />
  );
}
