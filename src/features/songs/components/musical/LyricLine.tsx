import React from 'react';
import { Line } from 'chordsheetjs';

interface LyricLineProps {
  line: Line;
  className?: string;
  showChords?: boolean;
}

export function LyricLine({ line, className = '', showChords = true }: LyricLineProps) {
  // If the line contains chords, handle gracefully
  return (
    <div className={`song-line flex flex-wrap items-end gap-x-0.5 gap-y-2 my-2 ${className}`}>
      {line.items.map((item: any, idx: number) => {
        const chord = item.chord || '';
        const lyrics = item.lyrics || '';
        
        return (
          <span 
            key={idx} 
            className="chord-syllable-pair inline-flex flex-col whitespace-pre"
          >
            {/* Chord Header */}
            {showChords && (
              <span className="chord font-bold text-sm text-primary select-none min-h-[1.25rem]">
                {chord}
              </span>
            )}
            
            {/* Syllable/Text Body */}
            <span className={`syllable text-base font-normal ${lyrics ? 'text-foreground' : ''}`}>
              {lyrics}
            </span>
          </span>
        );
      })}
    </div>
  );
}
