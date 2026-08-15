import React, { useEffect, useRef, useState } from 'react';
import abcjs, { type MidiBuffer } from 'abcjs';
import { MousePointer2, X } from 'lucide-react';
import type { InstrumentType } from '../../utils/chordDictionary';
import { InstrumentChordCard } from './InstrumentChordCard';

type PreviewPlacement = 'above' | 'below';

interface ChordPreview {
  label: string;
  left: number;
  top: number;
  placement: PreviewPlacement;
}

interface RenderError {
  notation: string;
  message: string;
}

interface SheetMusicViewerProps {
  abcNotation: string;
  className?: string;
  responsive?: boolean;
  audioEnabled?: boolean;
  instrument?: InstrumentType;
}

function abcjsGroupKey(element: Element): string {
  return [...element.classList]
    .filter((className) => /^(abcjs-l|abcjs-m|abcjs-mm|abcjs-v)\d+$/.test(className))
    .sort()
    .join('|');
}

function chordLabelFromElement(element: Element): string | null {
  const label = element.textContent?.replace(/\s+/g, ' ').trim();
  return label || null;
}

function connectChordAnnotationsToNotes(paper: HTMLDivElement): Array<{ note: SVGElement; label: string }> {
  const notes = Array.from(paper.querySelectorAll<SVGElement>('g.abcjs-note'));
  const chordAnnotations = Array.from(paper.querySelectorAll<SVGTextElement>('text.abcjs-chord'));
  const notesByGroup = new Map<string, SVGElement[]>();
  const chordsByGroup = new Map<string, string[]>();

  for (const note of notes) {
    const key = abcjsGroupKey(note);
    const groupNotes = notesByGroup.get(key) ?? [];
    groupNotes.push(note);
    notesByGroup.set(key, groupNotes);
  }

  for (const annotation of chordAnnotations) {
    const label = chordLabelFromElement(annotation);
    if (!label) continue;
    const key = abcjsGroupKey(annotation);
    const groupChords = chordsByGroup.get(key) ?? [];
    groupChords.push(label);
    chordsByGroup.set(key, groupChords);
  }

  const connections: Array<{ note: SVGElement; label: string }> = [];
  for (const [key, groupNotes] of notesByGroup) {
    const groupChords = chordsByGroup.get(key) ?? [];
    groupNotes.forEach((note, index) => {
      const label = groupChords[index];
      if (label) connections.push({ note, label });
    });
  }

  // A generated harmonic lead sheet uses rests, so it has no note groups.
  // In that case the chord labels themselves become the accessible targets.
  if (!connections.length) {
    return chordAnnotations.flatMap((annotation) => {
      const label = chordLabelFromElement(annotation);
      return label ? [{ note: annotation, label }] : [];
    });
  }

  return connections;
}

export function SheetMusicViewer({
  abcNotation,
  className = '',
  responsive = true,
  audioEnabled = false,
  instrument = 'guitarra',
}: SheetMusicViewerProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const instrumentRef = useRef(instrument);
  const hidePreviewTimerRef = useRef<number | null>(null);
  const [renderError, setRenderError] = useState<RenderError | null>(null);
  const [chordPreview, setChordPreview] = useState<ChordPreview | null>(null);
  const [interactiveNoteCount, setInteractiveNoteCount] = useState(0);

  useEffect(() => {
    instrumentRef.current = instrument;
  }, [instrument]);

  useEffect(() => {
    if (!paperRef.current) return;
    let isActive = true;
    let midiBuffer: MidiBuffer | null = null;
    const paper = paperRef.current;
    const audio = audioRef.current;

    const clearHidePreviewTimer = () => {
      if (hidePreviewTimerRef.current !== null) {
        window.clearTimeout(hidePreviewTimerRef.current);
        hidePreviewTimerRef.current = null;
      }
    };

    const hidePreview = () => {
      clearHidePreviewTimer();
      hidePreviewTimerRef.current = window.setTimeout(() => {
        setChordPreview(null);
        hidePreviewTimerRef.current = null;
      }, 140);
    };

    const showPreview = (note: SVGElement, label: string) => {
      clearHidePreviewTimer();
      if (instrumentRef.current === 'ninguno' || instrumentRef.current === 'bateria') return;
      const stage = stageRef.current;
      if (!stage) return;

      const noteRect = note.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const noteCenter = noteRect.left - stageRect.left + noteRect.width / 2;
      const cardHalfWidth = 116;
      const left = Math.min(
        Math.max(noteCenter, cardHalfWidth + 12),
        Math.max(cardHalfWidth + 12, stageRect.width - cardHalfWidth - 12),
      );
      const noteTop = noteRect.top - stageRect.top;
      const estimatedCardHeight = 190;
      const spaceAbove = noteRect.top;
      const spaceBelow = window.innerHeight - noteRect.bottom;
      const placement: PreviewPlacement = spaceBelow < estimatedCardHeight && spaceAbove > spaceBelow ? 'above' : 'below';

      setChordPreview({
        label,
        left,
        top: placement === 'above' ? noteTop - 10 : noteRect.bottom - stageRect.top + 10,
        placement,
      });
    };

    setChordPreview(null);
    setInteractiveNoteCount(0);
    paper.replaceChildren();
    audio?.replaceChildren();

    if (!abcNotation.trim()) {
      return () => undefined;
    }

    try {
      const visualObj = abcjs.renderAbc(paper, abcNotation, {
        responsive: responsive ? 'resize' : undefined,
        add_classes: true,
        paddingtop: 0,
        paddingbottom: 0,
        paddingright: 0,
        paddingleft: 0,
        staffwidth: 740,
      });

      const noteConnections = connectChordAnnotationsToNotes(paper);
      for (const { note, label } of noteConnections) {
        note.classList.add('abcjs-note-interactive');
        note.setAttribute('tabindex', '0');
        note.setAttribute('role', 'button');
        note.setAttribute('aria-label', `Mostrar vista previa del acorde ${label}`);
        note.addEventListener('mouseenter', () => showPreview(note, label));
        note.addEventListener('mouseleave', hidePreview);
        note.addEventListener('focus', () => showPreview(note, label));
        note.addEventListener('blur', hidePreview);
        note.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setChordPreview(null);
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showPreview(note, label);
          }
        });
      }
      setInteractiveNoteCount(noteConnections.length);

      if (audioEnabled && audio && visualObj.length > 0) {
        if (abcjs.synth.supportsAudio()) {
          const synthControl = new abcjs.synth.SynthController();
          synthControl.load(audio, null, {
            displayLoop: true,
            displayRestart: true,
            displayPlay: true,
            displayProgress: true,
            displayWarp: true,
          });

          const currentMidiBuffer = new abcjs.synth.CreateSynth();
          midiBuffer = currentMidiBuffer;
          currentMidiBuffer.init({ visualObj: visualObj[0] }).then(() => {
            if (!isActive) return;
            void synthControl.setTune(visualObj[0], false).catch((error: unknown) => {
              console.error('No se pudo preparar el audio de la partitura.', { error });
              if (isActive) setRenderError({ notation: abcNotation, message: 'La partitura se ve correctamente, pero el audio no pudo prepararse.' });
            });
          }).catch((error: unknown) => {
            console.error('No se pudo inicializar el audio de la partitura.', { error });
            if (isActive) setRenderError({ notation: abcNotation, message: 'La partitura se ve correctamente, pero el audio no pudo prepararse.' });
          });
        } else {
          audio.innerHTML = '<div class="text-xs text-destructive">El audio no es compatible con este navegador.</div>';
        }
      }
    } catch (error) {
      console.error('No se pudo renderizar la partitura ABC.', { error });
      setRenderError({ notation: abcNotation, message: error instanceof Error ? error.message : 'La notación ABC no se puede mostrar.' });
    }

    return () => {
      isActive = false;
      clearHidePreviewTimer();
      midiBuffer?.stop();
      paper.replaceChildren();
      audio?.replaceChildren();
    };
  }, [abcNotation, responsive, audioEnabled]);

  return (
    <div className={`sheet-music-container flex flex-col gap-4 ${className}`}>
      {audioEnabled && (
        <div ref={audioRef} className="abcjs-audio-container rounded-md bg-muted/30 p-2" />
      )}

      {(!abcNotation.trim() || renderError?.notation === abcNotation) && (
        <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {renderError?.notation === abcNotation ? renderError.message : 'Esta partitura todavía no tiene una notación ABC válida.'}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="sm:hidden">Desliza para recorrer la partitura →</span>
        {interactiveNoteCount > 0 && instrument !== 'ninguno' && instrument !== 'bateria' && (
          <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-amber-700 dark:text-amber-300">
            <MousePointer2 size={12} aria-hidden="true" /> Pasa sobre una nota o símbolo de acorde · también funciona con Tab
          </span>
        )}
      </div>

      <div ref={stageRef} className="relative">
        <div
          ref={paperRef}
          className="abcjs-paper-container overflow-x-auto rounded-lg border bg-card p-2 shadow-sm sm:p-4 [&_.abcjs-note-interactive]:cursor-pointer [&_.abcjs-note-interactive]:outline-none [&_.abcjs-note-interactive]:transition [&_.abcjs-note-interactive]:duration-150 [&_.abcjs-note-interactive:hover]:text-amber-500 [&_.abcjs-note-interactive:focus]:text-amber-500 [&_.abcjs-note-interactive:focus]:drop-shadow-[0_0_5px_rgba(245,158,11,.75)] [&_svg]:min-w-[560px]"
        />

        {chordPreview && instrument !== 'ninguno' && instrument !== 'bateria' && (
          <div
            className="absolute z-20 w-[232px]"
            style={{
              left: chordPreview.left,
              top: chordPreview.top,
              transform: chordPreview.placement === 'above' ? 'translate(-50%, -100%)' : 'translateX(-50%)',
            }}
            onMouseEnter={() => {
              if (hidePreviewTimerRef.current !== null) {
                window.clearTimeout(hidePreviewTimerRef.current);
                hidePreviewTimerRef.current = null;
              }
            }}
            onMouseLeave={() => {
              hidePreviewTimerRef.current = window.setTimeout(() => setChordPreview(null), 140);
            }}
          >
            <div className="rounded-[1.35rem] border border-amber-200/80 bg-white/95 p-2 shadow-[0_22px_60px_-24px_rgba(15,23,42,.65)] backdrop-blur-xl dark:border-amber-300/20 dark:bg-slate-950/95">
              <div className="mb-1 flex items-center justify-between gap-2 px-2 pt-1">
                <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Vista previa del acorde</span>
                <button type="button" onClick={() => setChordPreview(null)} className="grid h-6 w-6 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Cerrar vista previa">
                  <X size={12} />
                </button>
              </div>
              <InstrumentChordCard chord={chordPreview.label} instrument={instrument} compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
