import { describe, expect, it } from 'vitest';
import { detectPitchYin, frequencyToNote, median, updateTapTempo } from './audioMath';

function sine(frequency: number, sampleRate = 48_000, length = 4096): Float32Array {
  return Float32Array.from({ length }, (_, index) => Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.8);
}

describe('audioMath', () => {
  it('detecta una onda A4 con YIN', () => {
    expect(detectPitchYin(sine(440), 48_000)).toBeCloseTo(440, 0);
  });

  it('rechaza silencio', () => {
    expect(detectPitchYin(new Float32Array(4096), 48_000)).toBeNull();
  });

  it('convierte frecuencia usando calibración y limita cents', () => {
    expect(frequencyToNote(442, 442)).toMatchObject({ name: 'A', octave: 4, cents: 0, target: 442 });
    expect(frequencyToNote(1, 440)?.cents).toBeGreaterThanOrEqual(-50);
  });

  it('calcula mediana sin mutar la entrada', () => {
    const values = [7, 1, 3];
    expect(median(values)).toBe(3);
    expect(values).toEqual([7, 1, 3]);
  });

  it('calcula TAP, descarta un intervalo atípico y reinicia tras una pausa', () => {
    let result = updateTapTempo([], 0);
    result = updateTapTempo(result.taps, 500);
    result = updateTapTempo(result.taps, 1000);
    result = updateTapTempo(result.taps, 1800);
    result = updateTapTempo(result.taps, 2300);
    expect(result.bpm).toBe(120);
    expect(updateTapTempo(result.taps, 5000)).toEqual({ taps: [5000], bpm: null });
  });
});
