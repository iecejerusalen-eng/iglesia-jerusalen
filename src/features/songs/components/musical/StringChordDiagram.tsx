import React, { useEffect, useRef } from 'react';
import { SVGuitarChord } from 'svguitar';
import { getChordData } from '../utils/chordDictionary';

export interface ChordPosition {
  fingers: [number, number | string, (string | undefined)?][]; // [string, fret, text]
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
}

export function StringChordDiagram({
  chord,
  instrument = 'guitar',
  width = 120,
  height = 150,
  className = '',
  color = 'currentColor'
}: StringChordDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<SVGuitarChord | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize or clear existing
    if (chartRef.current) {
      containerRef.current.innerHTML = '';
    }

    const isUkulele = instrument === 'ukulele';
    
    let resolvedFingers: any[] = [];
    let resolvedBarres: any[] = [];
    let position = chord.position || 1;

    if (!chord.fingers || chord.fingers.length === 0) {
      const data = getChordData(chord.title || '', isUkulele ? 'ukelele' : 'guitarra');
      if (data) {
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
          resolvedBarres = data.barres.map((bFret: number) => ({
            fret: bFret,
            fromString: 1,
            toString: numStrings
          }));
        }
      }
    } else {
      // Manual fingers from props
      resolvedFingers = chord.fingers.map(f => [f[0], f[1], f[2]]);
      resolvedBarres = chord.barres?.map(b => ({
        fret: b.fret,
        fromString: b.fromString,
        toString: b.toString
      })) || [];
    }

    chartRef.current = new SVGuitarChord(containerRef.current)
      .chord({
        fingers: resolvedFingers as any,
        barres: resolvedBarres,
        title: chord.title || ''
      })
      .configure({
        strings: isUkulele ? 4 : 6,
        frets: isUkulele ? 4 : 5,
        position: position,
        color: color,
        nutColor: color,
        fretColor: color,
        stringColor: color,
        titleColor: color,
        strokeWidth: 2,
        nutWidth: 4,
        fretWidth: 1.5,
        fontFamily: 'Inter, sans-serif',
        titleFontSize: 40,
        fixedDiagramPosition: true
      })
      .draw();

  }, [chord, instrument, color]);

  return (
    <div 
      ref={containerRef} 
      className={`svg-chord-diagram ${className}`}
      style={{ width, height }}
      aria-label={`Diagrama de acorde ${chord.title}`}
    />
  );
}
