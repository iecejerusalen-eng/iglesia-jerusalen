import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ToolboxStoreModule = typeof import('../useToolboxStore');

const defaults = {
  bpm: 80,
  beatsPerMeasure: 4,
  subdivision: 1 as const,
  volume: 0.75,
  position: null,
  tallyCount: 0,
  tallyPreviousCount: null,
  tallyCapacity: 500,
  tallyLastChangedAt: null,
  timerDuration: 45,
  timerTimeLeft: 45 * 60,
  timerStatus: 'idle' as const,
  timerEndsAt: null,
  timerAllowOvertime: false,
  timerSoundEnabled: false,
  timerVibrationEnabled: false,
};

async function loadStore(): Promise<ToolboxStoreModule> {
  vi.resetModules();
  return import('../useToolboxStore');
}

describe('useToolboxStore persistence and timer engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T15:00:00.000Z'));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('migrates and validates v1 preferences into the v2 schema', async () => {
    window.localStorage.setItem('jerusalen-toolbox-v1', JSON.stringify({
      bpm: 999,
      beatsPerMeasure: 3,
      subdivision: 2,
      volume: -4,
      position: { x: 28, y: 40 },
    }));

    const { useToolboxStore } = await loadStore();
    const state = useToolboxStore.getState();
    const persisted = JSON.parse(window.localStorage.getItem('jerusalen-toolbox-v2') ?? '{}') as Record<string, unknown>;

    expect(state.bpm).toBe(300);
    expect(state.beatsPerMeasure).toBe(3);
    expect(state.subdivision).toBe(2);
    expect(state.volume).toBe(0);
    expect(state.position).toEqual({ x: 28, y: 40 });
    expect(persisted.version).toBe(2);
  });

  it('reports corrupted storage and loads safe defaults', async () => {
    window.localStorage.setItem('jerusalen-toolbox-v2', '{not-json');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { useToolboxStore } = await loadStore();

    expect(useToolboxStore.getState().bpm).toBe(80);
    expect(useToolboxStore.getState().persistenceError).toContain('dañadas');
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('calculates remaining time from endsAt after a background delay', async () => {
    const { useToolboxStore } = await loadStore();
    useToolboxStore.setState({ ...defaults, timerDuration: 1, timerTimeLeft: 60 });

    useToolboxStore.getState().startTimer();
    vi.setSystemTime(new Date('2026-08-10T15:00:37.000Z'));
    useToolboxStore.getState().syncTimer();

    expect(useToolboxStore.getState().timerTimeLeft).toBe(23);
    expect(useToolboxStore.getState().timerStatus).toBe('running');

    vi.setSystemTime(new Date('2026-08-10T15:01:05.000Z'));
    useToolboxStore.getState().syncTimer();

    expect(useToolboxStore.getState().timerTimeLeft).toBe(0);
    expect(useToolboxStore.getState().timerStatus).toBe('finished');
    expect(useToolboxStore.getState().timerIsRunning).toBe(false);
  });

  it('continues into explicit overtime when enabled', async () => {
    const { useToolboxStore } = await loadStore();
    useToolboxStore.setState({ ...defaults, timerDuration: 1, timerTimeLeft: 60, timerAllowOvertime: true });

    useToolboxStore.getState().startTimer();
    vi.setSystemTime(new Date('2026-08-10T15:01:12.000Z'));
    useToolboxStore.getState().syncTimer();

    expect(useToolboxStore.getState().timerTimeLeft).toBe(-12);
    expect(useToolboxStore.getState().timerStatus).toBe('overtime');
    expect(useToolboxStore.getState().timerIsRunning).toBe(true);
    useToolboxStore.getState().resetTimer();
  });

  it('persists tally changes, capacity and a single-step undo', async () => {
    const { useToolboxStore } = await loadStore();
    useToolboxStore.setState({ ...defaults });

    useToolboxStore.getState().setTallyCapacity(120);
    useToolboxStore.getState().setTallyCount((count) => count + 1);
    useToolboxStore.getState().setTallyCount((count) => count + 1);
    expect(useToolboxStore.getState().tallyCount).toBe(2);
    expect(useToolboxStore.getState().tallyPreviousCount).toBe(1);

    useToolboxStore.getState().undoTally();
    const persisted = JSON.parse(window.localStorage.getItem('jerusalen-toolbox-v2') ?? '{}') as Record<string, unknown>;

    expect(useToolboxStore.getState().tallyCount).toBe(1);
    expect(useToolboxStore.getState().tallyPreviousCount).toBeNull();
    expect(persisted.tallyCount).toBe(1);
    expect(persisted.tallyCapacity).toBe(120);
  });
});
