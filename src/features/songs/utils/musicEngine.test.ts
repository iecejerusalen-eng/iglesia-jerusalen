import { describe, expect, it } from 'vitest';
import {
  chordToNashville,
  detectKeyCandidate,
  extractChords,
  generateHarmonyScoreAbc,
  isChord,
  parseChord,
  slugifySongTitle,
  transposeBracketText,
  transposeChord,
  transposeNote,
  uniqueChords,
} from './musicEngine';

describe('musicEngine', () => {
  it('parses extended and slash chords without losing their quality', () => {
    expect(parseChord('F#m7b5/C#')).toEqual({ root: 'F#', quality: 'm7b5', bass: 'C#' });
    expect(isChord('Bbadd9')).toBe(true);
    expect(isChord('Coro')).toBe(false);
  });

  it('transposes roots and slash bass notes', () => {
    expect(transposeChord('D/F#', 2, 'sharp', 'D')).toBe('E/G#');
    expect(transposeChord('Bbmaj7/D', 2, 'flat', 'Bb')).toBe('Cmaj7/E');
  });

  it('uses the requested enharmonic spelling', () => {
    expect(transposeNote('C', 1, 'sharp')).toBe('C#');
    expect(transposeNote('C', 1, 'flat')).toBe('Db');
    expect(transposeChord('A#', 0, 'flat', 'Bb')).toBe('Bb');
    expect(transposeChord('A##', 0, 'sharp')).toBe('B');
  });

  it('converts chord qualities and inversions to Nashville notation', () => {
    expect(chordToNashville('Bm7/D', 'G')).toBe('iii7/V');
    expect(chordToNashville('F', 'C')).toBe('IV');
    expect(chordToNashville('Dm', 'C')).toBe('ii');
    expect(chordToNashville('B', 'C')).toBe('VII');
  });

  it('transposes complete bracket text and leaves section labels intact', () => {
    const source = '[Intro]\n[D]Santo [G/B]por siempre';
    expect(transposeBracketText(source, 2, { key: 'D', preference: 'sharp' }))
      .toBe('[Intro]\n[E]Santo [A/C#]por siempre');
    expect(transposeBracketText('[A#]Santo [D#]Dios', 0, { key: 'Bb', preference: 'flat' }))
      .toBe('[Bb]Santo [Eb]Dios');
  });

  it('extracts chords in appearance order and finds a key candidate', () => {
    const source = '[G]Mil [C]generaciones [G]cantan [D/F#]hoy';
    expect(extractChords(source)).toEqual(['G', 'C', 'G', 'D/F#']);
    expect(uniqueChords(source)).toEqual(['G', 'C', 'D/F#']);
    expect(detectKeyCandidate(source)).toBe('G');
  });

  it('generates a harmonic score with rests instead of inventing melody notes', () => {
    const abc = generateHarmonyScoreAbc({
      title: 'Santo por siempre',
      key: 'G',
      timeSignature: '4/4',
      blocks: [],
      fallbackText: '[G] [C] [Em] [D]',
    });
    expect(abc).toContain('K:G');
    expect(abc).toContain('"G"z "C"z "Em"z "D"z |');
    expect(abc).not.toMatch(/\b[A-G][,']*\d/);
  });

  it('creates stable URL slugs for Spanish titles', () => {
    expect(slugifySongTitle('¡Cuán Grande es Él!')).toBe('cuan-grande-es-el');
  });
});
