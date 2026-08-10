import React, { useEffect, useRef } from 'react';
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
  const chartRef = useRef<SVGuitarChord | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize or clear existing
    if (chartRef.current) {
      containerRef.current.innerHTML = '';
    }

    const isUkulele = instrument === 'ukulele';
    
    let resolvedFingers: Finger[] = [];
    let resolvedBarres: Barre[] = [];
    let position = chord.position || 1;

    if (!chord.fingers || chord.fingers.length === 0) {
      const data = getChordData(chord.title || '', isUkulele ? 'ukelele' : 'guitarra', variation);
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
          resolvedBarres = data.barres.map((bFret: number) => ({
            fret: bFret,
            fromString: 1,
            toString: numStrings
          }));
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
        title: chord.title || ''
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
      svg.style.overflow = 'visible';
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
    chartRef.current = chart;

  }, [chord, instrument, color, variation]);

  return (
    <div 
      ref={containerRef} 
      className={`svg-chord-diagram overflow-visible ${className}`}
      style={{ width, height, padding: '4px' }}
      aria-label={`Diagrama de acorde ${chord.title}`}
    />
  );
}
