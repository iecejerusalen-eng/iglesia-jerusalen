import React, { useState, useMemo, useCallback } from 'react';
import {
  Drum,
  Volume2,
  Sparkles,
  Copy,
  Check,
  ListMusic,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Music2,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import type { Song, SongStructureBlock, MusicianNoteSongBlock } from '../../../../types';

export interface DrumTabViewerProps {
  song?: Song;
  tabContent?: string;
  title?: string;
  tuning?: string;
  compact?: boolean;
  className?: string;
}

export interface DrumPadCategoryInfo {
  id: string;
  codes: string[];
  name: string;
  shortName: string;
  description: string;
  colorClasses: {
    badge: string;
    text: string;
    bg: string;
    border: string;
    glow: string;
  };
  symbols: Array<{ char: string; label: string }>;
  soundType: 'cymbals' | 'hihat' | 'snare' | 'kick' | 'toms';
}

// 5 Drum Pad Matrix Categories per requirements:
// 1. C1 / CR (Crash / Ride - Platillos in Gold text-amber-500 bg-amber-500/10)
// 2. HH (Hi-Hat Abierto/Cerrado in Cyan text-cyan-500 bg-cyan-500/10)
// 3. SD (Snare / Caja in Orange text-orange-500 bg-orange-500/10)
// 4. BD (Bass Drum / Bombo in Blue text-blue-500 bg-blue-500/10)
// 5. T1 / FT (Toms in Purple text-purple-500 bg-purple-500/10)
export const DRUM_PAD_CATEGORIES: DrumPadCategoryInfo[] = [
  {
    id: 'cymbals',
    codes: ['C1', 'CR', 'CC', 'CY', 'RC', 'RD'],
    name: 'Crash / Ride',
    shortName: 'Platillos',
    description: 'Acentos, cortes y conducción de brillo',
    colorClasses: {
      badge: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
    },
    symbols: [
      { char: 'x', label: 'Golpe normal' },
      { char: 'X', label: 'Acento fuerte' },
      { char: 'b', label: 'Campana (Ride Bell)' },
    ],
    soundType: 'cymbals',
  },
  {
    id: 'hihat',
    codes: ['HH', 'H', 'HF', 'HO', 'HC'],
    name: 'Hi-Hat',
    shortName: 'Hi-Hat (Abierto/Cerrado)',
    description: 'Pulsación de pulso, corcheas y subdivisiones',
    colorClasses: {
      badge: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
      text: 'text-cyan-500 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-500/20',
    },
    symbols: [
      { char: 'x', label: 'HH Cerrado' },
      { char: 'X', label: 'HH Semi-abierto' },
      { char: 'o', label: 'HH Abierto' },
    ],
    soundType: 'hihat',
  },
  {
    id: 'snare',
    codes: ['SD', 'SN', 'S', 'CJ'],
    name: 'Snare / Caja',
    shortName: 'Caja',
    description: 'Backbeat en 2 y 4, rimshots y redobles',
    colorClasses: {
      badge: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
      text: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      glow: 'shadow-orange-500/20',
    },
    symbols: [
      { char: 'o', label: 'Golpe centro' },
      { char: 'O', label: 'Acento fuerte' },
      { char: 'r', label: 'Rimshot' },
      { char: 'f', label: 'Flam' },
    ],
    soundType: 'snare',
  },
  {
    id: 'kick',
    codes: ['BD', 'B', 'K', 'KD'],
    name: 'Bass Drum / Bombo',
    shortName: 'Bombo',
    description: 'Cimiento grave y sincronía con el bajo',
    colorClasses: {
      badge: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
      text: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20',
    },
    symbols: [
      { char: 'o', label: 'Golpe bombo' },
      { char: 'd', label: 'Doble golpe' },
    ],
    soundType: 'kick',
  },
  {
    id: 'toms',
    codes: ['T1', 'FT', 'T2', 'T3', 'HT', 'LT'],
    name: 'Toms (T1 / FT)',
    shortName: 'Toms',
    description: 'Redobles, cortes y grooves de tom de piso',
    colorClasses: {
      badge: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      text: 'text-purple-500 dark:text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
    },
    symbols: [
      { char: 'o', label: 'Tom 1 (T1)' },
      { char: 'F', label: 'Floor Tom (FT)' },
    ],
    soundType: 'toms',
  },
];

// Helper Web Audio synthesizer for interactive pad preview
function playSyntheticDrumHit(soundType: DrumPadCategoryInfo['soundType']) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (soundType === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.09);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (soundType === 'snare') {
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 900;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.75, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (soundType === 'hihat') {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } else if (soundType === 'cymbals') {
      const bufferSize = ctx.sampleRate * 0.7;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 5200;
      filter.Q.value = 1.1;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } else if (soundType === 'toms') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    console.warn('No se pudo reproducir el sonido de batería.', err);
  }
}

// Find category definition by line prefix
function getCategoryForCode(code: string): DrumPadCategoryInfo {
  const upper = code.trim().toUpperCase();
  const found = DRUM_PAD_CATEGORIES.find((cat) => cat.codes.includes(upper));
  if (found) return found;
  if (upper.startsWith('C') || upper.startsWith('R')) return DRUM_PAD_CATEGORIES[0];
  if (upper.startsWith('H')) return DRUM_PAD_CATEGORIES[1];
  if (upper.startsWith('S')) return DRUM_PAD_CATEGORIES[2];
  if (upper.startsWith('B') || upper.startsWith('K')) return DRUM_PAD_CATEGORIES[3];
  if (upper.startsWith('T') || upper.startsWith('F')) return DRUM_PAD_CATEGORIES[4];
  return DRUM_PAD_CATEGORIES[2]; // Default to snare
}

// Section rhythm pattern generator for Worship/Song structure
interface SectionDrumGuide {
  sectionLabel: string;
  rhythmFeel: string;
  hihatGuide: string;
  snareGuide: string;
  kickGuide: string;
  dynamics: string;
  musicianNotes?: string[];
  lyricsSnippet?: string;
}

function generateSectionGuides(song?: Song): SectionDrumGuide[] {
  const blocks = song?.structure_blocks ?? [];
  const lyricsBlocks = blocks.filter(
    (b): b is Extract<SongStructureBlock, { type: 'lyrics' }> => b.type === 'lyrics'
  );
  const drumNotes = blocks.filter(
    (b): b is MusicianNoteSongBlock =>
      b.type === 'musician_note' &&
      (b.target_instrument === 'Batería' || b.target_instrument === 'General')
  );

  if (lyricsBlocks.length > 0) {
    return lyricsBlocks.map((block) => {
      const label = block.label.toLowerCase();
      let guide: Omit<SectionDrumGuide, 'sectionLabel' | 'musicianNotes' | 'lyricsSnippet'>;

      if (label.includes('intro')) {
        guide = {
          rhythmFeel: 'Marcación limpia & Fill-in de entrada',
          hihatGuide: 'Conteo suave en Hi-Hat cerrado (1-2-3-4)',
          snareGuide: 'Corte al final del compás hacia Verso',
          kickGuide: 'Marcando tiempo 1 y 3',
          dynamics: 'Mezzopiano (mp)',
        };
      } else if (label.includes('verso') || label.includes('estrofa')) {
        guide = {
          rhythmFeel: 'Groove suave y constante (Sostén de banda)',
          hihatGuide: 'Hi-Hat cerrado en corcheas (8vos) constantes',
          snareGuide: 'Backbeat sutil en tiempos 2 y 4 (o Rimshot)',
          kickGuide: 'Bombo limpio respondiendo al bajo en 1 y 3',
          dynamics: 'Mezzoforte (mf)',
        };
      } else if (label.includes('coro') || label.includes('estribillo')) {
        guide = {
          rhythmFeel: 'Patrón potente y abierto (Máxima energía)',
          hihatGuide: 'Ride conducido en campana o Hi-Hat bien abierto + Crash en 1',
          snareGuide: 'Caja profunda y marcada con rimshot potente en 2 y 4',
          kickGuide: 'Bombo activo en semicorcheas / sincopado',
          dynamics: 'Fuerte / Explosivo (f / ff)',
        };
      } else if (label.includes('puente') || label.includes('interludio')) {
        guide = {
          rhythmFeel: 'Tom-Tom Groove & Build-up progresivo',
          hihatGuide: 'Pulsación constante de pie en Foot Hi-Hat',
          snareGuide: 'Redoble en crescendo o golpes alternados en Tom de Piso (FT)',
          kickGuide: 'Bombo acentuado en contratiempos',
          dynamics: 'Crescendo (p ➔ f)',
        };
      } else if (label.includes('outro') || label.includes('final')) {
        guide = {
          rhythmFeel: 'Remate final & Desaceleración / Decrescendo',
          hihatGuide: 'Crash abierto sosteniendo acorde final',
          snareGuide: 'Redoble suelto final en caja',
          kickGuide: 'Golpe final unísono en tiempo 1',
          dynamics: 'Decrescendo (f ➔ p)',
        };
      } else {
        guide = {
          rhythmFeel: 'Rhythm Groove adaptable a la sección',
          hihatGuide: 'Hi-Hat semi-abierto marcando pulso',
          snareGuide: 'Caja estable en 2 y 4',
          kickGuide: 'Bombo apoyando la armonía',
          dynamics: 'Mezzoforte (mf)',
        };
      }

      // Collect any matching notes or snippet
      const notesForSection = drumNotes.map((n) => n.content);
      const snippet = block.lyrics ? block.lyrics.split('\n')[0].replace(/\[[^\]]+\]/g, '').trim() : undefined;

      return {
        sectionLabel: block.label,
        ...guide,
        musicianNotes: notesForSection.length > 0 ? notesForSection : undefined,
        lyricsSnippet: snippet ? (snippet.length > 45 ? `${snippet.slice(0, 45)}…` : snippet) : undefined,
      };
    });
  }

  // Fallback section guides if no structured lyrics blocks exist
  const defaultNotes = drumNotes.map((n) => n.content);
  return [
    {
      sectionLabel: 'Versos',
      rhythmFeel: 'Groove base pulcro (Hi-Hat cerrado)',
      hihatGuide: 'Corcheas marcadas en Hi-Hat cerrado',
      snareGuide: 'Caja sutil en tiempos 2 y 4 (Rimshot ligero)',
      kickGuide: 'Bombo limpio marcando pulso 1 y 3',
      dynamics: 'Mezzopiano (mp)',
      musicianNotes: defaultNotes.length > 0 ? defaultNotes : undefined,
    },
    {
      sectionLabel: 'Coros',
      rhythmFeel: 'Patrón dinámico y abierto (Acentos en Crashes)',
      hihatGuide: 'Hi-Hat abierto o conducción en Ride + Crashes',
      snareGuide: 'Backbeat potente en 2 y 4',
      kickGuide: 'Bombo sincopado apoyando el bajo',
      dynamics: 'Fuerte (f)',
    },
    {
      sectionLabel: 'Puentes & Interludios',
      rhythmFeel: 'Tom-Tom Groove & Crescendo progresivo',
      hihatGuide: 'Foot Hi-Hat + Platillos en acentos',
      snareGuide: 'Transición a Tom de piso (FT) y redobles crescendo',
      kickGuide: 'Bombo a contratiempo',
      dynamics: 'Crescendo (mp ➔ ff)',
    },
  ];
}

// Default fallback ASCII drum tab if none provided in tabContent
const DEFAULT_DRUM_TAB = `[Patrón Básico Batería - 4/4]
C1 |x---------------|----------------|x---------------|----------------|
HH |--x-x-x-x-x-x-x-|--x-x-x-x-x-x-x-|--x-x-x-x-x-x-x-|--x-x-x-x-x-x-x-|
SD |----o-------o---|----o-------o---|----o-------o---|----o---o---o-o-|
BD |o-------o-------|o-------o-o-----|o-------o-------|o-----o---o-----|
FT |----------------|----------------|----------------|--------o---o---|`;

export function DrumTabViewer({
  song,
  tabContent,
  title,
  tuning,
  compact = false,
  className = '',
}: DrumTabViewerProps) {
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showMatrixLegend, setShowMatrixLegend] = useState(true);

  const rawTab = tabContent || DEFAULT_DRUM_TAB;

  // Handle pad click (audio + visual highlight)
  const handlePadClick = (pad: DrumPadCategoryInfo) => {
    setActivePadId(pad.id);
    playSyntheticDrumHit(soundTypeToHit(pad.soundType));
    setTimeout(() => setActivePadId(null), 300);
  };

  const soundTypeToHit = (type: DrumPadCategoryInfo['soundType']) => type;

  // Copy drum tab content
  const handleCopyTab = async () => {
    try {
      await navigator.clipboard.writeText(rawTab);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('No se pudo copiar la tablatura', e);
    }
  };

  // Section Guides
  const sectionGuides = useMemo(() => generateSectionGuides(song), [song]);

  // Syntax highlighting parser for raw ASCII drum tab lines
  const parsedTabLines = useMemo(() => {
    const lines = rawTab.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return { type: 'empty', id: lineIdx, raw: line };
      }

      // Check if line matches ASCII drum track pattern: prefix | body
      const match = line.match(/^([A-Za-z0-9]{1,5})\s*\|(.*)$/);
      if (match) {
        const code = match[1];
        const body = match[2];
        const category = getCategoryForCode(code);
        return {
          type: 'track',
          id: lineIdx,
          code,
          body,
          category,
          raw: line,
        };
      }

      // Otherwise header or comment line
      return {
        type: 'comment',
        id: lineIdx,
        raw: line,
      };
    });
  }, [rawTab]);

  return (
    <div
      className={`relative w-full rounded-2xl border border-white/60 bg-white/70 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-5 ${className}`}
    >
      {/* Header Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400">
            <Drum size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Visualizador de Batería
              </span>
              {song?.bpm && (
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {song.bpm} BPM
                </span>
              )}
              {song?.time_signature && (
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  {song.time_signature}
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white">
              {title || song?.title || 'Tablatura y Guía de Ritmo'}
            </h3>
          </div>
        </div>

        {tuning && (
          <div className="rounded-xl border border-slate-200/70 bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Afinación: <strong className="text-amber-600 dark:text-amber-400">{tuning}</strong>
          </div>
        )}
      </div>

      {/* Visual Drum Pad Matrix / Leyenda de Parches */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Leyenda de Parches & Matriz de Batería
            </h4>
          </div>
          <button
            onClick={() => setShowMatrixLegend((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:underline dark:text-amber-400"
          >
            {showMatrixLegend ? 'Ocultar' : 'Mostrar'}
            {showMatrixLegend ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showMatrixLegend && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {DRUM_PAD_CATEGORIES.map((pad) => {
              const isActive = activePadId === pad.id;
              return (
                <button
                  key={pad.id}
                  onClick={() => handlePadClick(pad)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 ${
                    pad.colorClasses.bg
                  } ${pad.colorClasses.border} ${
                    isActive ? `ring-2 ring-amber-400 ${pad.colorClasses.glow} scale-[1.03]` : 'hover:scale-[1.01]'
                  }`}
                  title={`Haz clic para escuchar ${pad.name}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-mono text-xs font-black tracking-wide ${pad.colorClasses.text}`}>
                        {pad.codes.slice(0, 2).join(' / ')}
                      </span>
                      <Volume2 size={13} className={`${pad.colorClasses.text} opacity-70 group-hover:opacity-100`} />
                    </div>
                    <strong className="mt-1 block text-xs font-extrabold text-slate-900 dark:text-white">
                      {pad.shortName}
                    </strong>
                    <p className="mt-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                      {pad.description}
                    </p>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1 border-t border-slate-200/40 pt-2 dark:border-white/10">
                    {pad.symbols.map((sym) => (
                      <span
                        key={sym.char}
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${pad.colorClasses.badge}`}
                        title={sym.label}
                      >
                        {sym.char} = {sym.label}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ASCII Drum Tab Syntax Highlighted Code Viewer */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-cyan-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Tablatura de Ritmo (ASCII)
            </h4>
          </div>
          <button
            onClick={() => void handleCopyTab()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? '¡Copiado!' : 'Copiar Tab'}</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-900/80 bg-slate-950 p-4 shadow-inner">
          <pre className="min-w-max font-mono text-xs leading-6">
            {parsedTabLines.map((line) => {
              if (line.type === 'empty') {
                return <div key={line.id} className="h-4" />;
              }

              if (line.type === 'comment') {
                return (
                  <div key={line.id} className="text-amber-400/90 font-bold py-0.5">
                    {line.raw}
                  </div>
                );
              }

              if (line.type === 'track' && line.category) {
                const { code, body, category } = line;
                return (
                  <div key={line.id} className="flex items-center py-0.5">
                    {/* Track Prefix Code */}
                    <span
                      onClick={() => handlePadClick(category)}
                      className={`w-10 shrink-0 cursor-pointer font-black tracking-wider ${category.colorClasses.text} hover:underline`}
                      title={`Haz clic para oír ${category.name}`}
                    >
                      {code.padEnd(3, ' ')}
                    </span>
                    <span className="text-slate-600 dark:text-slate-500 font-bold mr-1">|</span>
                    {/* Body Syntax Highlighting */}
                    <div className="flex items-center tracking-widest">
                      {body.split('').map((char, charIdx) => {
                        if (char === '|') {
                          return (
                            <span key={charIdx} className="text-slate-500 font-bold mx-0.5">
                              |
                            </span>
                          );
                        }
                        if (char === 'x' || char === 'X') {
                          return (
                            <span key={charIdx} className={`font-black ${category.colorClasses.text}`}>
                              {char}
                            </span>
                          );
                        }
                        if (char === 'o' || char === 'O') {
                          return (
                            <span key={charIdx} className={`font-black ${category.colorClasses.text}`}>
                              {char}
                            </span>
                          );
                        }
                        if (char === 'f') {
                          return (
                            <span key={charIdx} className="font-black text-rose-400">
                              f
                            </span>
                          );
                        }
                        if (char === 'd') {
                          return (
                            <span key={charIdx} className="font-bold text-teal-400">
                              d
                            </span>
                          );
                        }
                        if (char === 'g') {
                          return (
                            <span key={charIdx} className="text-slate-400 text-[11px]">
                              g
                            </span>
                          );
                        }
                        return (
                          <span key={charIdx} className="text-slate-700 dark:text-slate-600 opacity-60">
                            -
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return <div key={line.id}>{line.raw}</div>;
            })}
          </pre>
        </div>
      </div>

      {/* Guía de Toques por Sección (Versos, Coros, Puentes) */}
      {!compact && (
        <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-white/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic size={16} className="text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Guía de Toques por Sección (Versos, Coros, Puentes)
              </h4>
            </div>
            <button
              onClick={() => setShowGuide((prev) => !prev)}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:underline dark:text-amber-400"
            >
              {showGuide ? 'Ocultar Guía' : 'Mostrar Guía'}
              {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showGuide && (
            <div className="grid gap-3.5 md:grid-cols-3">
              {sectionGuides.map((guide, idx) => (
                <div
                  key={`${guide.sectionLabel}-${idx}`}
                  className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      {guide.sectionLabel}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                      {guide.dynamics}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {guide.rhythmFeel}
                  </p>

                  {guide.lyricsSnippet && (
                    <p className="mt-1 font-serif text-[11px] italic text-slate-500 dark:text-slate-400">
                      "{guide.lyricsSnippet}"
                    </p>
                  )}

                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-1.5 text-cyan-700 dark:text-cyan-300">
                      <span className="font-black">• HH/Platillos:</span>
                      <span className="text-slate-600 dark:text-slate-300">{guide.hihatGuide}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-orange-700 dark:text-orange-300">
                      <span className="font-black">• Caja:</span>
                      <span className="text-slate-600 dark:text-slate-300">{guide.snareGuide}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-blue-700 dark:text-blue-300">
                      <span className="font-black">• Bombo:</span>
                      <span className="text-slate-600 dark:text-slate-300">{guide.kickGuide}</span>
                    </div>
                  </div>

                  {guide.musicianNotes && guide.musicianNotes.length > 0 && (
                    <div className="mt-3 rounded-lg bg-indigo-50/80 p-2.5 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-300">
                        <Sparkles size={11} /> Nota para Batería
                      </span>
                      {guide.musicianNotes.map((note, noteIdx) => (
                        <p key={noteIdx} className="mt-1 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                          {note}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DrumTabViewer;
