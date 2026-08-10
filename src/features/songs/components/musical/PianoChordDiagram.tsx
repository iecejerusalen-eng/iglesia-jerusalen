import React from 'react';

interface PianoChordDiagramProps {
  // Array of notes to highlight, e.g. ["C", "E", "G"] or ["C4", "E4", "G4"]
  notes: string[];
  width?: number;
  height?: number;
  className?: string;
}

export function PianoChordDiagram({
  notes,
  width = 180,
  height = 80,
  className = ''
}: PianoChordDiagramProps) {
  // Simplify notes to just their pitch class for a generic 2-octave view
  const enharmonicSharps: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
  const activeNotes = notes.map((note) => {
    const pitchClass = note.replace(/[0-9]/g, '');
    return enharmonicSharps[pitchClass] ?? pitchClass;
  });

  // Define 2 octaves starting from C
  const OCTAVES = 2;
  const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const BLACK_KEYS = ['C#', 'D#', null, 'F#', 'G#', 'A#', null];

  const totalWhiteKeys = WHITE_KEYS.length * OCTAVES;
  const keyWidth = width / totalWhiteKeys;
  const blackKeyWidth = keyWidth * 0.6;
  const blackKeyHeight = height * 0.6;

  const renderWhiteKeys = () => {
    const keys: React.ReactElement[] = [];
    for (let o = 0; o < OCTAVES; o++) {
      for (let i = 0; i < WHITE_KEYS.length; i++) {
        const note = WHITE_KEYS[i];
        const isActive = activeNotes.includes(note);
        keys.push(
          <rect
            key={`white-${o}-${i}`}
            x={(o * WHITE_KEYS.length + i) * keyWidth}
            y={0}
            width={keyWidth}
            height={height}
            className={`stroke-border ${isActive ? 'fill-primary' : 'fill-background'}`}
            strokeWidth={1}
            rx={2}
          />
        );
      }
    }
    return keys;
  };

  const renderBlackKeys = () => {
    const keys: React.ReactElement[] = [];
    for (let o = 0; o < OCTAVES; o++) {
      for (let i = 0; i < BLACK_KEYS.length; i++) {
        const note = BLACK_KEYS[i];
        if (!note) continue; // Skip spots with no black key

        const isActive = activeNotes.includes(note);
        
        // The black key is positioned between the current white key and the next one
        const xPos = (o * WHITE_KEYS.length + i + 1) * keyWidth - (blackKeyWidth / 2);

        keys.push(
          <rect
            key={`black-${o}-${i}`}
            x={xPos}
            y={0}
            width={blackKeyWidth}
            height={blackKeyHeight}
            className={`stroke-border ${isActive ? 'fill-primary' : 'fill-foreground'}`}
            strokeWidth={1}
            rx={2}
          />
        );
      }
    }
    return keys;
  };

  return (
    <div className={`piano-chord-diagram flex flex-col items-center gap-2 ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g>{renderWhiteKeys()}</g>
        <g>{renderBlackKeys()}</g>
      </svg>
      {notes.length > 0 && (
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {notes.join(' - ')}
        </span>
      )}
    </div>
  );
}
