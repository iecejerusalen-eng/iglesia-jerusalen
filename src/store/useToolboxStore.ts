import { create } from 'zustand';

export type ToolboxPanel = 'hub' | 'metronome' | 'tuner' | 'clicker' | 'timer' | 'bible' | 'notes';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished' | 'overtime';

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
  tallyPreviousCount: number | null;
  tallyCapacity: number;
  tallyLastChangedAt: number | null;

  // Timer State. timerTimeLeft is a snapshot; timerEndsAt is the source of truth while running.
  timerDuration: number;
  timerTimeLeft: number;
  timerIsRunning: boolean;
  timerStatus: TimerStatus;
  timerEndsAt: number | null;
  timerAllowOvertime: boolean;
  timerSoundEnabled: boolean;
  timerVibrationEnabled: boolean;
  timerAlertError: string | null;

  // General State
  position: { x: number; y: number } | null;
  persistenceError: string | null;

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
  undoTally: () => void;
  resetTally: () => void;
  setTallyCapacity: (capacity: number) => void;

  // Timer Actions
  setTimerDuration: (minutes: number) => void;
  setTimerTimeLeft: (seconds: number | ((prev: number) => number)) => void;
  setTimerIsRunning: (isRunning: boolean) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  adjustTimer: (seconds: number) => void;
  syncTimer: (now?: number) => void;
  setTimerAllowOvertime: (allow: boolean) => void;
  setTimerSoundEnabled: (enabled: boolean) => void;
  setTimerVibrationEnabled: (enabled: boolean) => void;
  clearTimerAlertError: () => void;

  // Position Actions
  setPosition: (position: { x: number; y: number }) => void;
}

const STORAGE_KEY_V1 = 'jerusalen-toolbox-v1';
const STORAGE_KEY_V2 = 'jerusalen-toolbox-v2';
const DEFAULT_TIMER_MINUTES = 45;
const MIN_TIMER_MINUTES = 1;
const MAX_TIMER_MINUTES = 240;
const MAX_TALLY = 999_999;

interface StoredToolboxV2 {
  version: 2;
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 4;
  volume: number;
  position: { x: number; y: number } | null;
  tallyCount: number;
  tallyPreviousCount: number | null;
  tallyCapacity: number;
  tallyLastChangedAt: number | null;
  timerDuration: number;
  timerTimeLeft: number;
  timerStatus: TimerStatus;
  timerEndsAt: number | null;
  timerAllowOvertime: boolean;
  timerSoundEnabled: boolean;
  timerVibrationEnabled: boolean;
}

const storedDefaults: StoredToolboxV2 = {
  version: 2,
  bpm: 80,
  beatsPerMeasure: 4,
  subdivision: 1,
  volume: 0.75,
  position: null,
  tallyCount: 0,
  tallyPreviousCount: null,
  tallyCapacity: 500,
  tallyLastChangedAt: null,
  timerDuration: DEFAULT_TIMER_MINUTES,
  timerTimeLeft: DEFAULT_TIMER_MINUTES * 60,
  timerStatus: 'idle',
  timerEndsAt: null,
  timerAllowOvertime: false,
  timerSoundEnabled: true,
  timerVibrationEnabled: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function integer(value: unknown, fallback: number, min: number, max: number): number {
  return Math.round(finiteNumber(value, fallback, min, max));
}

function nullableTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function position(value: unknown): { x: number; y: number } | null {
  if (!isRecord(value)) return null;
  if (typeof value.x !== 'number' || !Number.isFinite(value.x)) return null;
  if (typeof value.y !== 'number' || !Number.isFinite(value.y)) return null;
  return { x: Math.max(0, value.x), y: Math.max(0, value.y) };
}

function timerStatus(value: unknown): TimerStatus {
  return value === 'idle' || value === 'running' || value === 'paused' || value === 'finished' || value === 'overtime'
    ? value
    : 'idle';
}

function validateV2(value: unknown): StoredToolboxV2 {
  if (!isRecord(value)) return storedDefaults;
  const subdivision = value.subdivision === 2 || value.subdivision === 4 ? value.subdivision : 1;
  const duration = integer(value.timerDuration, storedDefaults.timerDuration, MIN_TIMER_MINUTES, MAX_TIMER_MINUTES);
  const status = timerStatus(value.timerStatus);
  const endsAt = nullableTimestamp(value.timerEndsAt);
  const runningStatus = status === 'running' || status === 'overtime';
  return {
    version: 2,
    bpm: integer(value.bpm, storedDefaults.bpm, 30, 300),
    beatsPerMeasure: integer(value.beatsPerMeasure, storedDefaults.beatsPerMeasure, 1, 12),
    subdivision,
    volume: finiteNumber(value.volume, storedDefaults.volume, 0, 1),
    position: position(value.position),
    tallyCount: integer(value.tallyCount, storedDefaults.tallyCount, 0, MAX_TALLY),
    tallyPreviousCount: value.tallyPreviousCount === null
      ? null
      : integer(value.tallyPreviousCount, storedDefaults.tallyCount, 0, MAX_TALLY),
    tallyCapacity: integer(value.tallyCapacity, storedDefaults.tallyCapacity, 1, MAX_TALLY),
    tallyLastChangedAt: nullableTimestamp(value.tallyLastChangedAt),
    timerDuration: duration,
    timerTimeLeft: integer(value.timerTimeLeft, duration * 60, -MAX_TIMER_MINUTES * 60, MAX_TIMER_MINUTES * 60),
    timerStatus: runningStatus && endsAt === null ? 'paused' : status,
    timerEndsAt: endsAt,
    timerAllowOvertime: typeof value.timerAllowOvertime === 'boolean' ? value.timerAllowOvertime : false,
    timerSoundEnabled: typeof value.timerSoundEnabled === 'boolean' ? value.timerSoundEnabled : true,
    timerVibrationEnabled: typeof value.timerVibrationEnabled === 'boolean' ? value.timerVibrationEnabled : true,
  };
}

function migrateV1(value: unknown): StoredToolboxV2 {
  if (!isRecord(value)) return storedDefaults;
  return validateV2({
    ...storedDefaults,
    bpm: value.bpm,
    beatsPerMeasure: value.beatsPerMeasure,
    subdivision: value.subdivision,
    volume: value.volume,
    position: value.position,
  });
}

function serializableState(state: ToolboxState): StoredToolboxV2 {
  return {
    version: 2,
    bpm: state.bpm,
    beatsPerMeasure: state.beatsPerMeasure,
    subdivision: state.subdivision,
    volume: state.volume,
    position: state.position,
    tallyCount: state.tallyCount,
    tallyPreviousCount: state.tallyPreviousCount,
    tallyCapacity: state.tallyCapacity,
    tallyLastChangedAt: state.tallyLastChangedAt,
    timerDuration: state.timerDuration,
    timerTimeLeft: state.timerTimeLeft,
    timerStatus: state.timerStatus,
    timerEndsAt: state.timerEndsAt,
    timerAllowOvertime: state.timerAllowOvertime,
    timerSoundEnabled: state.timerSoundEnabled,
    timerVibrationEnabled: state.timerVibrationEnabled,
  };
}

function writeStored(value: StoredToolboxV2): string | null {
  if (typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(value));
    return null;
  } catch (error) {
    console.error('No se pudieron guardar las preferencias del toolbox.', error);
    return 'No se pudieron guardar los cambios en este dispositivo.';
  }
}

function readStoredTools(): { value: StoredToolboxV2; error: string | null } {
  if (typeof window === 'undefined') return { value: storedDefaults, error: null };
  try {
    const current = window.localStorage.getItem(STORAGE_KEY_V2);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (!isRecord(parsed) || parsed.version !== 2) {
        throw new Error('El esquema persistido del toolbox no corresponde a la versión 2.');
      }
      return { value: validateV2(parsed), error: null };
    }

    const legacy = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!legacy) return { value: storedDefaults, error: null };
    const migrated = migrateV1(JSON.parse(legacy));
    const migrationError = writeStored(migrated);
    return { value: migrated, error: migrationError };
  } catch (error) {
    console.error('No se pudieron recuperar las preferencias del toolbox.', error);
    return { value: storedDefaults, error: 'Las preferencias guardadas estaban dañadas; se cargaron valores seguros.' };
  }
}

const storedInitial = readStoredTools();
const initialNow = Date.now();
const initialDelta = storedInitial.value.timerEndsAt === null
  ? storedInitial.value.timerTimeLeft
  : Math.ceil((storedInitial.value.timerEndsAt - initialNow) / 1000);
const initialCanRun = storedInitial.value.timerStatus === 'running' || storedInitial.value.timerStatus === 'overtime';
const initialFinished = initialCanRun && initialDelta <= 0 && !storedInitial.value.timerAllowOvertime;

let timerTickHandle: ReturnType<typeof setTimeout> | null = null;

function cancelTimerTicker(): void {
  if (timerTickHandle !== null) {
    clearTimeout(timerTickHandle);
    timerTickHandle = null;
  }
}

function scheduleTimerTicker(): void {
  cancelTimerTicker();
  timerTickHandle = setTimeout(() => {
    timerTickHandle = null;
    useToolboxStore.getState().syncTimer();
    if (useToolboxStore.getState().timerIsRunning) scheduleTimerTicker();
  }, 250);
}

async function playTimerAlert(): Promise<void> {
  const audioContext = new AudioContext();
  await audioContext.resume();
  const startAt = audioContext.currentTime;
  for (let index = 0; index < 3; index += 1) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const toneStart = startAt + index * 0.28;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(index === 2 ? 880 : 660, toneStart);
    gain.gain.setValueAtTime(0.0001, toneStart);
    gain.gain.exponentialRampToValueAtTime(0.18, toneStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.2);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(toneStart);
    oscillator.stop(toneStart + 0.22);
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 950));
  await audioContext.close();
}

function emitTimerCompletionAlert(state: ToolboxState): void {
  if (typeof window === 'undefined') return;
  if (state.timerVibrationEnabled && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (error) {
      console.error('No se pudo activar la vibración del temporizador.', error);
      useToolboxStore.setState({ timerAlertError: 'El temporizador terminó, pero no se pudo activar la vibración.' });
    }
  }
  if (state.timerSoundEnabled) {
    void playTimerAlert().catch((error: unknown) => {
      console.error('No se pudo reproducir el aviso del temporizador.', error);
      useToolboxStore.setState({ timerAlertError: 'El temporizador terminó, pero el navegador bloqueó el aviso sonoro.' });
    });
  }
}

export const useToolboxStore = create<ToolboxState>((set, get) => {
  const persist = () => {
    const error = writeStored(serializableState(get()));
    set({ persistenceError: error });
  };

  const commitTimerSnapshot = (now: number, shouldPersist: boolean) => {
    const state = get();
    if (!state.timerIsRunning || state.timerEndsAt === null) return;
    const rawSeconds = Math.ceil((state.timerEndsAt - now) / 1000);
    if (rawSeconds <= 0 && !state.timerAllowOvertime) {
      const wasActive = state.timerStatus === 'running' || state.timerStatus === 'overtime';
      set({ timerTimeLeft: 0, timerIsRunning: false, timerStatus: 'finished', timerEndsAt: null });
      cancelTimerTicker();
      persist();
      if (wasActive) emitTimerCompletionAlert(get());
      return;
    }
    const nextStatus: TimerStatus = rawSeconds <= 0 ? 'overtime' : 'running';
    if (rawSeconds !== state.timerTimeLeft || nextStatus !== state.timerStatus) {
      set({ timerTimeLeft: rawSeconds, timerStatus: nextStatus });
      if (shouldPersist) persist();
    }
  };

  return {
    isOpen: false,
    isMinimized: false,
    activePanel: 'hub',
    isPlaying: false,
    sourceSongTitle: null,
    ...storedInitial.value,
    timerTimeLeft: initialFinished ? 0 : initialDelta,
    timerIsRunning: initialCanRun && !initialFinished,
    timerStatus: initialFinished ? 'finished' : storedInitial.value.timerStatus,
    timerEndsAt: initialFinished ? null : storedInitial.value.timerEndsAt,
    timerAlertError: null,
    persistenceError: storedInitial.error,

    open: (panel = 'hub') => set({ isOpen: true, isMinimized: false, activePanel: panel }),
    close: () => set({ isOpen: false, isMinimized: false, activePanel: 'hub', isPlaying: false, timerIsRunning: false }),
    toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
    setActivePanel: (activePanel) => set({ activePanel, isMinimized: false }),

    setBpm: (bpm) => {
      const next = Math.min(300, Math.max(30, Math.round(bpm)));
      set({ bpm: next, sourceSongTitle: null });
      persist();
    },
    loadSongTempo: (bpm, timeSignature, title) => {
      const beats = Math.min(12, Math.max(1, Number.parseInt(timeSignature?.split('/')[0] ?? '4', 10) || 4));
      const nextBpm = Math.min(300, Math.max(30, Math.round(bpm)));
      set({ bpm: nextBpm, beatsPerMeasure: beats, sourceSongTitle: title, isOpen: true, isMinimized: false, activePanel: 'metronome' });
      persist();
    },
    setBeatsPerMeasure: (beatsPerMeasure) => {
      set({ beatsPerMeasure: Math.min(12, Math.max(1, Math.round(beatsPerMeasure))) });
      persist();
    },
    setSubdivision: (subdivision) => {
      set({ subdivision });
      persist();
    },
    setVolume: (volume) => {
      set({ volume: Math.min(1, Math.max(0, volume)) });
      persist();
    },
    setPlaying: (isPlaying) => set((state) => ({ isPlaying, isOpen: isPlaying ? true : state.isOpen })),

    setTallyCount: (countOrUpdater) => {
      const current = get().tallyCount;
      const requested = typeof countOrUpdater === 'function' ? countOrUpdater(current) : countOrUpdater;
      const next = integer(requested, current, 0, MAX_TALLY);
      if (next === current) return;
      set({ tallyCount: next, tallyPreviousCount: current, tallyLastChangedAt: Date.now() });
      persist();
    },
    undoTally: () => {
      const state = get();
      if (state.tallyPreviousCount === null) return;
      set({ tallyCount: state.tallyPreviousCount, tallyPreviousCount: null, tallyLastChangedAt: Date.now() });
      persist();
    },
    resetTally: () => {
      const current = get().tallyCount;
      if (current === 0) return;
      set({ tallyCount: 0, tallyPreviousCount: current, tallyLastChangedAt: Date.now() });
      persist();
    },
    setTallyCapacity: (capacity) => {
      set({ tallyCapacity: integer(capacity, get().tallyCapacity, 1, MAX_TALLY) });
      persist();
    },

    setTimerDuration: (minutes) => {
      const next = integer(minutes, get().timerDuration, MIN_TIMER_MINUTES, MAX_TIMER_MINUTES);
      set({
        timerDuration: next,
        timerTimeLeft: next * 60,
        timerIsRunning: false,
        timerStatus: 'idle',
        timerEndsAt: null,
        timerAlertError: null,
      });
      cancelTimerTicker();
      persist();
    },
    setTimerTimeLeft: (timeOrUpdater) => {
      const state = get();
      const requested = typeof timeOrUpdater === 'function' ? timeOrUpdater(state.timerTimeLeft) : timeOrUpdater;
      const minimum = state.timerAllowOvertime ? -MAX_TIMER_MINUTES * 60 : 0;
      const next = integer(requested, state.timerTimeLeft, minimum, MAX_TIMER_MINUTES * 60);
      const shouldFinish = next <= 0 && !state.timerAllowOvertime;
      set({
        timerTimeLeft: shouldFinish ? 0 : next,
        timerEndsAt: state.timerIsRunning && !shouldFinish ? Date.now() + next * 1000 : null,
        timerIsRunning: shouldFinish ? false : state.timerIsRunning,
        timerStatus: shouldFinish ? 'finished' : state.timerStatus,
      });
      if (shouldFinish) cancelTimerTicker();
      persist();
      if (shouldFinish && state.timerIsRunning) emitTimerCompletionAlert(get());
    },
    setTimerIsRunning: (isRunning) => {
      if (isRunning) get().startTimer();
      else get().pauseTimer();
    },
    startTimer: () => {
      const state = get();
      const seconds = state.timerTimeLeft <= 0 && !state.timerAllowOvertime
        ? state.timerDuration * 60
        : state.timerTimeLeft;
      set({
        timerTimeLeft: seconds,
        timerEndsAt: Date.now() + seconds * 1000,
        timerIsRunning: true,
        timerStatus: seconds <= 0 ? 'overtime' : 'running',
        timerAlertError: null,
        isOpen: true,
      });
      persist();
      scheduleTimerTicker();
    },
    pauseTimer: () => {
      commitTimerSnapshot(Date.now(), false);
      const state = get();
      if (!state.timerIsRunning) return;
      set({ timerIsRunning: false, timerStatus: 'paused', timerEndsAt: null });
      cancelTimerTicker();
      persist();
    },
    resetTimer: () => {
      const duration = get().timerDuration;
      set({
        timerTimeLeft: duration * 60,
        timerIsRunning: false,
        timerStatus: 'idle',
        timerEndsAt: null,
        timerAlertError: null,
      });
      cancelTimerTicker();
      persist();
    },
    adjustTimer: (seconds) => {
      const state = get();
      const minimum = state.timerAllowOvertime ? -MAX_TIMER_MINUTES * 60 : 0;
      const next = integer(state.timerTimeLeft + seconds, state.timerTimeLeft, minimum, MAX_TIMER_MINUTES * 60);
      const finished = next <= 0 && !state.timerAllowOvertime;
      set({
        timerTimeLeft: finished ? 0 : next,
        timerEndsAt: state.timerIsRunning && !finished ? Date.now() + next * 1000 : null,
        timerIsRunning: finished ? false : state.timerIsRunning,
        timerStatus: finished ? 'finished' : state.timerIsRunning ? (next <= 0 ? 'overtime' : 'running') : state.timerStatus,
      });
      if (finished) cancelTimerTicker();
      persist();
      if (finished && state.timerIsRunning) emitTimerCompletionAlert(get());
    },
    syncTimer: (now = Date.now()) => commitTimerSnapshot(now, false),
    setTimerAllowOvertime: (timerAllowOvertime) => {
      set({ timerAllowOvertime });
      persist();
    },
    setTimerSoundEnabled: (timerSoundEnabled) => {
      set({ timerSoundEnabled });
      persist();
    },
    setTimerVibrationEnabled: (timerVibrationEnabled) => {
      set({ timerVibrationEnabled });
      persist();
    },
    clearTimerAlertError: () => set({ timerAlertError: null }),

    setPosition: (nextPosition) => {
      set({ position: position(nextPosition) });
      persist();
    },
  };
});

if (useToolboxStore.getState().timerIsRunning) scheduleTimerTicker();
