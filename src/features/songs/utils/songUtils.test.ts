import { describe, expect, it } from 'vitest';
import { bracketTextToHtml, getOriginalKey, isValidChord, processBracketText } from './songUtils';

describe('song chord notation', () => {
  it('accepts common chord names', () => {
    expect(['C', 'F#m7', 'Bbmaj7', 'G/B', 'D7sus4', 'Cadd9'].every(isValidChord)).toBe(true);
  });

  it('rejects section labels and malformed chords', () => {
    expect(['Verse 1', 'Chorus', 'Bridge', 'H', 'C hello'].some(isValidChord)).toBe(false);
  });

  it('only converts valid bracket tokens into chord nodes', () => {
    const html = bracketTextToHtml('[Verse 1]\n[C]Santo [G/B]Señor');
    expect(html).toContain('[Verse 1]');
    expect(html).toContain('data-chord="C"');
    expect(html).toContain('data-chord="G/B"');
    expect(html).not.toContain('data-chord="Verse 1"');
  });

  it('transposes chords without altering labels', () => {
    expect(processBracketText('[Chorus] [C]Canto', 2)).toBe('[Chorus] [D]Canto');
    expect(getOriginalKey('[Verse 1]\n[F#m7]Línea')).toBe('F#');
  });
});
