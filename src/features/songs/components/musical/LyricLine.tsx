import React from 'react';
import { Line, Item } from 'chordsheetjs';

interface LyricLineProps {
  line: Line;
  className?: string;
  showChords?: boolean;
}

export function LyricLine({ line, className = '', showChords = true }: LyricLineProps) {
  // If the line only contains chords (no lyrics), or only lyrics, it handles it gracefully
  const hasChords = line.items.some(item => item instanceof Item && item.chord);

  return (
    <div className={`song-line flex flex-wrap items-end gap-x-0.5 gap-y-2 my-2 ${className}`}>
      {line.items.map((item, idx) => {
        if (!(item instanceof Item)) return null;
        
        return (
          <span 
            key={idx} 
            className="chord-syllable-pair inline-flex flex-col whitespace-pre"
          >
            {/* Chord Header */}
            {showChords && (
              <span className="chord font-bold text-sm text-primary select-none min-h-[1.25rem]">
                {item.chord || ''}
              </span>
            )}
            
            {/* Syllable/Text Body */}
            <span className={`syllable text-base font-normal ${item.lyrics ? 'text-foreground' : ''}`}>
              {item.lyrics || ''}
            </span>
          </span>
        );
      })}
    </div>
  );
}
