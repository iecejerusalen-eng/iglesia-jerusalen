import React, { useEffect, useRef } from 'react';
import abcjs from 'abcjs';

interface SheetMusicViewerProps {
  abcNotation: string;
  className?: string;
  responsive?: boolean;
  audioEnabled?: boolean;
}

export function SheetMusicViewer({
  abcNotation,
  className = '',
  responsive = true,
  audioEnabled = false
}: SheetMusicViewerProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paperRef.current) return;

    // Render SVG visual notation
    const visualObj = abcjs.renderAbc(paperRef.current, abcNotation, {
      responsive: responsive ? 'resize' : undefined,
      add_classes: true, // Adds classes for CSS styling (e.g., coloring notes)
      paddingtop: 0,
      paddingbottom: 0,
      paddingright: 0,
      paddingleft: 0,
      staffwidth: 740, // Standard width, will scale if responsive is true
    });

    // Optionally render audio synth
    if (audioEnabled && audioRef.current && visualObj && visualObj.length > 0) {
      if (abcjs.synth.supportsAudio()) {
        const synthControl = new abcjs.synth.SynthController();
        synthControl.load(audioRef.current, null, {
          displayLoop: true,
          displayRestart: true,
          displayPlay: true,
          displayProgress: true,
          displayWarp: true
        });

        const midiBuffer = new abcjs.synth.CreateSynth();
        midiBuffer.init({
          visualObj: visualObj[0],
          // Add custom soundfont URL here if needed
        }).then(() => {
          synthControl.setTune(visualObj[0], false).catch(console.error);
        }).catch(console.error);
      } else {
        audioRef.current.innerHTML = '<div class="text-xs text-destructive">El audio no es compatible con este navegador.</div>';
      }
    }
  }, [abcNotation, responsive, audioEnabled]);

  return (
    <div className={`sheet-music-container flex flex-col gap-4 ${className}`}>
      {/* Target for audio player */}
      {audioEnabled && (
        <div 
          ref={audioRef} 
          className="abcjs-audio-container bg-muted/30 p-2 rounded-md"
        />
      )}

      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">
        Desliza para recorrer la partitura →
      </span>
      
      {/* Target for SVG rendering */}
      <div 
        ref={paperRef} 
        className="abcjs-paper-container overflow-x-auto rounded-lg border bg-card p-2 shadow-sm sm:p-4 [&_svg]:min-w-[560px]"
      />
    </div>
  );
}
