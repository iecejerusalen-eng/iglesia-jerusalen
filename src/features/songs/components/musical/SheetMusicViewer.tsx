import React, { useEffect, useRef, useState } from 'react';
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
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!paperRef.current) return;
    let isActive = true;
    let midiBuffer: { stop(): number } | null = null;
    setRenderError(null);
    paperRef.current.replaceChildren();
    audioRef.current?.replaceChildren();

    if (!abcNotation.trim()) {
      setRenderError('Esta partitura todavía no tiene una notación ABC válida.');
      return () => undefined;
    }

    try {
      const visualObj = abcjs.renderAbc(paperRef.current, abcNotation, {
        responsive: responsive ? 'resize' : undefined,
        add_classes: true,
        paddingtop: 0,
        paddingbottom: 0,
        paddingright: 0,
        paddingleft: 0,
        staffwidth: 740,
      });

      if (audioEnabled && audioRef.current && visualObj.length > 0) {
        if (abcjs.synth.supportsAudio()) {
          const synthControl = new abcjs.synth.SynthController();
          synthControl.load(audioRef.current, null, {
            displayLoop: true,
            displayRestart: true,
            displayPlay: true,
            displayProgress: true,
            displayWarp: true,
          });

          midiBuffer = new abcjs.synth.CreateSynth();
          midiBuffer.init({ visualObj: visualObj[0] }).then(() => {
            if (!isActive) return;
            void synthControl.setTune(visualObj[0], false).catch((error: unknown) => {
              console.error('No se pudo preparar el audio de la partitura.', { error });
              if (isActive) setRenderError('La partitura se ve correctamente, pero el audio no pudo prepararse.');
            });
          }).catch((error: unknown) => {
            console.error('No se pudo inicializar el audio de la partitura.', { error });
            if (isActive) setRenderError('La partitura se ve correctamente, pero el audio no pudo prepararse.');
          });
        } else {
          audioRef.current.innerHTML = '<div class="text-xs text-destructive">El audio no es compatible con este navegador.</div>';
        }
      }
    } catch (error) {
      console.error('No se pudo renderizar la partitura ABC.', { error });
      setRenderError(error instanceof Error ? error.message : 'La notación ABC no se puede mostrar.');
    }

    return () => {
      isActive = false;
      midiBuffer?.stop();
      paperRef.current?.replaceChildren();
      audioRef.current?.replaceChildren();
    };
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

      {renderError && (
        <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {renderError}
        </p>
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
