import { describe, expect, it } from 'vitest';
import { getChordData, getChordVariationCount } from './chordDictionary';

describe('chordDictionary', () => {
  it.each(['C', 'D#', 'Gb', 'G#', 'A#', 'Bb'])('resolves enharmonic guitar roots for %s', (chord) => {
    expect(getChordData(chord, 'guitarra')).not.toBeNull();
  });

  it.each(['Cm7', 'F#maj7', 'Bbadd9', 'E7', 'Asus4'])('resolves common extended guitar chords for %s', (chord) => {
    expect(getChordData(chord, 'guitarra')).not.toBeNull();
  });

  it('exposes every available voicing instead of only the first one', () => {
    const count = getChordVariationCount('C', 'guitarra');
    expect(count).toBeGreaterThan(1);
    expect(getChordData('C', 'guitarra', count - 1)).not.toBeNull();
  });

  it('produces piano notes for altered and extended chords', () => {
    const data = getChordData('F#m7', 'piano');
    expect(data?.instrument).toBe('piano');
    if (data?.instrument === 'piano') expect(data.notes.length).toBeGreaterThanOrEqual(4);
  });

  it.each(['F/A', 'Bb/D'])('resolves guitar slash chords for %s', (chord) => {
    const data = getChordData(chord, 'guitarra');
    expect(data?.instrument).toBe('guitarra');
    if (data?.instrument === 'guitarra') {
      expect(data.bassNote).toBe(chord.split('/')[1]);
      expect(data.frets.some((fret) => fret >= 0)).toBe(true);
    }
  });

  it('generates a playable ukulele inversion instead of an empty grid', () => {
    const data = getChordData('Bb/D', 'ukelele');
    expect(data?.instrument).toBe('ukelele');
    if (data?.instrument === 'ukelele') {
      expect(data.bassNote).toBe('D');
      expect(data.frets).toHaveLength(4);
    }
  });

  it('separates the right-hand chord from the slash bass on piano', () => {
    const data = getChordData('Bb/D', 'piano');
    expect(data).toEqual({ instrument: 'piano', notes: ['Bb', 'D', 'F'], bassNote: 'D' });
  });
});
