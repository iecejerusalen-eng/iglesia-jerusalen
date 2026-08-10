export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

export interface PitchReading {
  name: (typeof NOTE_NAMES)[number];
  octave: number;
  cents: number;
  target: number;
  frequency: number;
}

export interface TapTempoResult {
  taps: number[];
  bpm: number | null;
}

export function frequencyToNote(frequency: number, concertA = 440): PitchReading | null {
  if (!Number.isFinite(frequency) || frequency <= 0 || !Number.isFinite(concertA) || concertA <= 0) return null;
  const midi = 69 + 12 * Math.log2(frequency / concertA);
  const rounded = Math.round(midi);
  const target = concertA * 2 ** ((rounded - 69) / 12);
  return {
    name: NOTE_NAMES[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1,
    cents: Math.max(-50, Math.min(50, Math.round(1200 * Math.log2(frequency / target)))),
    target,
    frequency,
  };
}

/** YIN pitch detector. Returns null for silence, weak or aperiodic signals. */
export function detectPitchYin(
  samples: Float32Array,
  sampleRate: number,
  options: { minFrequency?: number; maxFrequency?: number; threshold?: number; rmsThreshold?: number } = {},
): number | null {
  const minFrequency = options.minFrequency ?? 50;
  const maxFrequency = options.maxFrequency ?? 1200;
  const threshold = options.threshold ?? 0.12;
  const rmsThreshold = options.rmsThreshold ?? 0.01;
  if (samples.length < 4 || sampleRate <= 0 || minFrequency <= 0 || maxFrequency <= minFrequency) return null;

  let energy = 0;
  let mean = 0;
  for (const sample of samples) mean += sample;
  mean /= samples.length;
  for (const sample of samples) {
    const centered = sample - mean;
    energy += centered * centered;
  }
  if (Math.sqrt(energy / samples.length) < rmsThreshold) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(samples.length / 2));
  if (maxTau <= minTau) return null;

  const yin = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau += 1) {
    let difference = 0;
    const limit = samples.length - tau;
    for (let index = 0; index < limit; index += 1) {
      const delta = (samples[index] - mean) - (samples[index + tau] - mean);
      difference += delta * delta;
    }
    yin[tau] = difference;
  }

  yin[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += yin[tau];
    yin[tau] = runningSum === 0 ? 1 : (yin[tau] * tau) / runningSum;
  }

  let selectedTau = -1;
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (yin[tau] < threshold) {
      while (tau + 1 <= maxTau && yin[tau + 1] < yin[tau]) tau += 1;
      selectedTau = tau;
      break;
    }
  }
  if (selectedTau < 0) return null;

  const previous = selectedTau > 1 ? yin[selectedTau - 1] : yin[selectedTau];
  const current = yin[selectedTau];
  const next = selectedTau < maxTau ? yin[selectedTau + 1] : current;
  const denominator = 2 * (2 * current - next - previous);
  const refinedTau = denominator === 0 ? selectedTau : selectedTau + (next - previous) / denominator;
  const frequency = sampleRate / refinedTau;
  return Number.isFinite(frequency) && frequency >= minFrequency && frequency <= maxFrequency ? frequency : null;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function updateTapTempo(previousTaps: readonly number[], now: number): TapTempoResult {
  const lastTap = previousTaps.at(-1);
  const freshTaps = lastTap === undefined || now - lastTap > 2500 ? [now] : [...previousTaps, now].slice(-8);
  if (freshTaps.length < 2) return { taps: freshTaps, bpm: null };

  const intervals = freshTaps.slice(1).map((tap, index) => tap - freshTaps[index]).filter((gap) => gap >= 200 && gap <= 2000);
  const center = median(intervals);
  if (center === null) return { taps: freshTaps, bpm: null };
  const tolerance = Math.max(80, center * 0.25);
  const filtered = intervals.filter((gap) => Math.abs(gap - center) <= tolerance);
  const average = filtered.length > 0 ? filtered.reduce((sum, gap) => sum + gap, 0) / filtered.length : center;
  return { taps: freshTaps, bpm: Math.max(30, Math.min(300, Math.round(60000 / average))) };
}
