import { create } from 'zustand';

export type ToolboxPanel = 'hub' | 'metronome' | 'tuner' | 'clicker' | 'timer' | 'bible' | 'notes';

interface ToolboxState {
  isOpen: boolean;
  isMinimized: boolean;
  activePanel: ToolboxPanel;
  
  // Metronome State
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 4;
  volume: number;
  isPlaying: boolean;
  sourceSongTitle: string | null;
  
  // Tally Clicker State
  tallyCount: number;

  // Timer State
  timerDuration: number;
  timerTimeLeft: number;
  timerIsRunning: boolean;

  // General State
  position: { x: number; y: number } | null;
  
  // Actions
  open: (panel?: ToolboxPanel) => void;
  close: () => void;
  toggleMinimized: () => void;
  setActivePanel: (panel: ToolboxPanel) => void;
  
  // Metronome Actions
  setBpm: (bpm: number) => void;
  loadSongTempo: (bpm: number, timeSignature: string | null | undefined, title: string) => void;
  setBeatsPerMeasure: (beats: number) => void;
  setSubdivision: (subdivision: 1 | 2 | 4) => void;
  setVolume: (volume: number) => void;
  setPlaying: (playing: boolean) => void;

  // Tally Actions
  setTallyCount: (count: number | ((prev: number) => number)) => void;
  
  // Timer Actions
  setTimerDuration: (minutes: number) => void;
  setTimerTimeLeft: (seconds: number | ((prev: number) => number)) => void;
  setTimerIsRunning: (isRunning: boolean) => void;

  // Position Actions
  setPosition: (position: { x: number; y: number }) => void;
}

const STORAGE_KEY = 'jerusalen-toolbox-v1';

interface StoredToolbox {
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 4;
  volume: number;
  position: { x: number; y: number } | null;
}

function readStoredTools(): StoredToolbox {
  const defaults: StoredToolbox = { bpm: 80, beatsPerMeasure: 4, subdivision: 1, volume: 0.75, position: null };
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? { ...defaults, ...JSON.parse(value) as Partial<StoredToolbox> } : defaults;
  } catch (error) {
    console.warn('No se pudieron recuperar las preferencias de las herramientas.', error);
    return defaults;
  }
}

function persist(state: Pick<ToolboxState, 'bpm' | 'beatsPerMeasure' | 'subdivision' | 'volume' | 'position'>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bpm: state.bpm,
      beatsPerMeasure: state.beatsPerMeasure,
      subdivision: state.subdivision,
      volume: state.volume,
      position: state.position,
    } satisfies StoredToolbox));
  } catch (error) {
    console.warn('No se pudieron guardar las preferencias de las herramientas.', error);
  }
}

const initial = readStoredTools();

export const useToolboxStore = create<ToolboxState>((set, get) => ({
  isOpen: false,
  isMinimized: false,
  activePanel: 'hub',
  isPlaying: false,
  sourceSongTitle: null,
  tallyCount: 0,
  timerDuration: 45,
  timerTimeLeft: 45 * 60,
  timerIsRunning: false,
  ...initial,
  
  open: (panel = 'hub') => set({ isOpen: true, isMinimized: false, activePanel: panel }),
  close: () => set({ isOpen: false, isPlaying: false }),
  toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
  setActivePanel: (activePanel) => set({ activePanel, isMinimized: false }),
  
  setBpm: (bpm) => {
    const next = Math.min(300, Math.max(30, Math.round(bpm)));
    set({ bpm: next, sourceSongTitle: null });
    persist({ ...get(), bpm: next });
  },
  loadSongTempo: (bpm, timeSignature, title) => {
    const beats = Math.min(12, Math.max(1, Number.parseInt(timeSignature?.split('/')[0] ?? '4', 10) || 4));
    const nextBpm = Math.min(300, Math.max(30, Math.round(bpm)));
    set({ bpm: nextBpm, beatsPerMeasure: beats, sourceSongTitle: title, isOpen: true, isMinimized: false, activePanel: 'metronome' });
    persist({ ...get(), bpm: nextBpm, beatsPerMeasure: beats });
  },
  setBeatsPerMeasure: (beatsPerMeasure) => {
    const next = Math.min(12, Math.max(1, Math.round(beatsPerMeasure)));
    set({ beatsPerMeasure: next });
    persist({ ...get(), beatsPerMeasure: next });
  },
  setSubdivision: (subdivision) => {
    set({ subdivision });
    persist({ ...get(), subdivision });
  },
  setVolume: (volume) => {
    const next = Math.min(1, Math.max(0, volume));
    set({ volume: next });
    persist({ ...get(), volume: next });
  },
  setPlaying: (isPlaying) => set({ isPlaying, isOpen: true }),
  
  setTallyCount: (countOrUpdater) => {
    if (typeof countOrUpdater === 'function') {
      set((state) => ({ tallyCount: Math.max(0, countOrUpdater(state.tallyCount)) }));
    } else {
      set({ tallyCount: Math.max(0, countOrUpdater) });
    }
  },

  setTimerDuration: (minutes) => set({ timerDuration: minutes, timerTimeLeft: minutes * 60, timerIsRunning: false }),
  setTimerTimeLeft: (timeOrUpdater) => {
    if (typeof timeOrUpdater === 'function') {
      set((state) => ({ timerTimeLeft: Math.max(0, timeOrUpdater(state.timerTimeLeft)) }));
    } else {
      set({ timerTimeLeft: Math.max(0, timeOrUpdater) });
    }
  },
  setTimerIsRunning: (isRunning) => set({ timerIsRunning: isRunning }),

  setPosition: (position) => {
    set({ position });
    persist({ ...get(), position });
  },
}));
