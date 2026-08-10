import React from 'react';

interface PianoChordDiagramProps {
  notes: string[];
  bassNote?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

export function PianoChordDiagram({
  notes,
  bassNote = null,
  width = 180,
  height = 80,
  className = ''
}: PianoChordDiagramProps) {
  const enharmonicSharps: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
  const normalizePitch = (note: string) => {
    const pitchClass = note.replace(/[0-9]/g, '');
    return enharmonicSharps[pitchClass] ?? pitchClass;
  };
  const activeNotes = new Set(notes.map(normalizePitch));
  const activeBass = bassNote ? normalizePitch(bassNote) : null;

  const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const BLACK_KEYS = ['C#', 'D#', null, 'F#', 'G#', 'A#', null];

  const keyWidth = width / WHITE_KEYS.length;
  const blackKeyWidth = keyWidth * 0.6;
  const blackKeyHeight = height * 0.6;

  const renderWhiteKeys = () => {
    const keys: React.ReactElement[] = [];
    for (let i = 0; i < WHITE_KEYS.length; i++) {
        const note = WHITE_KEYS[i];
        const isActive = activeNotes.has(note);
        const isBass = activeBass === note;
        keys.push(
          <rect
            key={`white-${i}`}
            x={i * keyWidth}
            y={0}
            width={keyWidth}
            height={height}
            className={isBass ? 'fill-indigo-500 stroke-amber-300' : isActive ? 'fill-amber-400 stroke-amber-600' : 'fill-white stroke-slate-300'}
            strokeWidth={isBass && isActive ? 3 : 1}
            rx={2}
          />
        );
    }
    return keys;
  };

  const renderBlackKeys = () => {
    const keys: React.ReactElement[] = [];
      for (let i = 0; i < BLACK_KEYS.length; i++) {
        const note = BLACK_KEYS[i];
        if (!note) continue; // Skip spots with no black key

        const isActive = activeNotes.has(note);
        const isBass = activeBass === note;
        
        // The black key is positioned between the current white key and the next one
        const xPos = (i + 1) * keyWidth - (blackKeyWidth / 2);

        keys.push(
          <rect
            key={`black-${i}`}
            x={xPos}
            y={0}
            width={blackKeyWidth}
            height={blackKeyHeight}
            className={isBass ? 'fill-indigo-400 stroke-amber-300' : isActive ? 'fill-orange-500 stroke-orange-700' : 'fill-slate-900 stroke-slate-950'}
            strokeWidth={isBass && isActive ? 3 : 1}
            rx={2}
          />
        );
    }
    return keys;
  };

  return (
    <div className={`piano-chord-diagram flex flex-col items-center gap-2 ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full drop-shadow-sm" role="img" aria-label={`Teclado para ${notes.join(', ')}`}>
        <g>{renderWhiteKeys()}</g>
        <g>{renderBlackKeys()}</g>
      </svg>
      {notes.length > 0 && <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold">
        {bassNote && <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">MI · Bajo: {bassNote}</span>}
        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">MD · {notes.join(' – ')}</span>
      </div>}
    </div>
  );
}
