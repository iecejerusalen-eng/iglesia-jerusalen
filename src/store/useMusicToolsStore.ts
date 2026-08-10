import { create } from 'zustand';

export type MusicToolPanel = 'metronome' | 'tuner';

interface MusicToolsState {
  isOpen: boolean;
  isMinimized: boolean;
  activePanel: MusicToolPanel;
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 4;
  volume: number;
  isPlaying: boolean;
  sourceSongTitle: string | null;
  position: { x: number; y: number } | null;
  open: (panel?: MusicToolPanel) => void;
  close: () => void;
  toggleMinimized: () => void;
  setActivePanel: (panel: MusicToolPanel) => void;
  setBpm: (bpm: number) => void;
  loadSongTempo: (bpm: number, timeSignature: string | null | undefined, title: string) => void;
  setBeatsPerMeasure: (beats: number) => void;
  setSubdivision: (subdivision: 1 | 2 | 4) => void;
  setVolume: (volume: number) => void;
  setPlaying: (playing: boolean) => void;
  setPosition: (position: { x: number; y: number }) => void;
}

const STORAGE_KEY = 'jerusalen-music-tools-v1';

interface StoredMusicTools {
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 4;
  volume: number;
  position: { x: number; y: number } | null;
}

function readStoredTools(): StoredMusicTools {
  const defaults: StoredMusicTools = { bpm: 80, beatsPerMeasure: 4, subdivision: 1, volume: 0.75, position: null };
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? { ...defaults, ...JSON.parse(value) as Partial<StoredMusicTools> } : defaults;
  } catch (error) {
    console.warn('No se pudieron recuperar las preferencias de las herramientas musicales.', error);
    return defaults;
  }
}

function persist(state: Pick<MusicToolsState, 'bpm' | 'beatsPerMeasure' | 'subdivision' | 'volume' | 'position'>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bpm: state.bpm,
      beatsPerMeasure: state.beatsPerMeasure,
      subdivision: state.subdivision,
      volume: state.volume,
      position: state.position,
    } satisfies StoredMusicTools));
  } catch (error) {
    console.warn('No se pudieron guardar las preferencias de las herramientas musicales.', error);
  }
}

const initial = readStoredTools();

export const useMusicToolsStore = create<MusicToolsState>((set, get) => ({
  isOpen: false,
  isMinimized: false,
  activePanel: 'metronome',
  isPlaying: false,
  sourceSongTitle: null,
  ...initial,
  open: (panel = 'metronome') => set({ isOpen: true, isMinimized: false, activePanel: panel }),
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
  setPosition: (position) => {
    set({ position });
    persist({ ...get(), position });
  },
}));
