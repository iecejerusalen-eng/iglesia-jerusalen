import type { AccidentalPreference, SongStructureBlock } from '../../../types';
import { Chord } from '@tonaljs/tonal';

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

export interface ParsedChord {
  root: string;
  quality: string;
  bass: string | null;
}

export interface HarmonyScoreOptions {
  title: string;
  artist?: string | null;
  key: string | null;
  timeSignature?: string | null;
  blocks: SongStructureBlock[];
  fallbackText?: string;
  transpose?: number;
  accidentalPreference?: AccidentalPreference;
}

const CHORD_REGEX = /^([A-G](?:(?:#{1,2})|(?:b{1,2}))?)([^/\s[\]]*)(?:\/([A-G](?:(?:#{1,2})|(?:b{1,2}))?))?$/;
const NATURAL_NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ROMAN_DEGREES: Record<number, string> = {
  0: 'I',
  1: '♭II',
  2: 'II',
  3: '♭III',
  4: 'III',
  5: 'IV',
  6: '♭V',
  7: 'V',
  8: '♭VI',
  9: 'VI',
  10: '♭VII',
  11: 'VII',
};

function noteIndex(note: string): number {
  const normalized = note.replaceAll('♯', '#').replaceAll('♭', 'b');
  const match = normalized.match(/^([A-G])([#b]*)$/);
  if (!match) return -1;
  const accidentalOffset = [...match[2]].reduce((total, accidental) => total + (accidental === '#' ? 1 : -1), 0);
  return ((NATURAL_NOTE_INDEX[match[1]] + accidentalOffset) % 12 + 12) % 12;
}

export function parseChord(chord: string): ParsedChord | null {
  const normalizedChord = chord.trim().replaceAll('♯', '#').replaceAll('♭', 'b');
  const match = normalizedChord.match(CHORD_REGEX);
  if (!match) return null;
  const [, root, quality, bass] = match;
  if (noteIndex(root) < 0 || (bass && noteIndex(bass) < 0)) return null;
  if (Chord.get(`${root}${quality}`).empty) return null;
  return { root, quality, bass: bass ?? null };
}

export function isChord(chord: string): boolean {
  return parseChord(chord) !== null;
}

export function resolveAccidentalPreference(
  key: string | null | undefined,
  preference: AccidentalPreference = 'auto',
): Exclude<AccidentalPreference, 'auto'> {
  if (preference !== 'auto') return preference;
  if (!key) return 'sharp';
  return key.includes('b') || FLAT_KEYS.has(key) ? 'flat' : 'sharp';
}

export function transposeNote(
  note: string,
  semitones: number,
  preference: AccidentalPreference = 'auto',
  keyContext?: string | null,
): string {
  const index = noteIndex(note);
  if (index < 0) return note;
  const transposedIndex = ((index + semitones) % 12 + 12) % 12;
  const resolvedPreference = resolveAccidentalPreference(keyContext ?? note, preference);
  return resolvedPreference === 'flat' ? FLAT_NOTES[transposedIndex] : SHARP_NOTES[transposedIndex];
}

export function transposeChord(
  chord: string,
  semitones: number,
  preference: AccidentalPreference = 'auto',
  keyContext?: string | null,
): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const root = transposeNote(parsed.root, semitones, preference, keyContext);
  const bass = parsed.bass ? `/${transposeNote(parsed.bass, semitones, preference, keyContext)}` : '';
  return `${root}${parsed.quality}${bass}`;
}

export function chordToNashville(chord: string, key: string | null): string {
  const parsedChord = parseChord(chord);
  const parsedKey = key ? parseChord(key) : null;
  if (!parsedChord || !parsedKey) return chord;
  const keyIndex = noteIndex(parsedKey.root);
  const degreeFor = (note: string): string => {
    const interval = ((noteIndex(note) - keyIndex) % 12 + 12) % 12;
    return ROMAN_DEGREES[interval] ?? note;
  };
  const tonalChord = Chord.get(`${parsedChord.root}${parsedChord.quality}`);
  const isDiminished = tonalChord.quality === 'Diminished';
  const isMinor = tonalChord.quality === 'Minor';
  const isAugmented = tonalChord.quality === 'Augmented';
  let degree = degreeFor(parsedChord.root);
  if (isMinor || isDiminished) degree = degree.toLocaleLowerCase('es');
  let quality = parsedChord.quality;
  if (isMinor) quality = quality.replace(/^m(?!aj)/, '');
  if (isDiminished) quality = `°${quality.replace(/^(?:dim|o)/, '')}`;
  if (isAugmented) quality = `+${quality.replace(/^(?:aug|\+)/, '')}`;
  quality = quality
    .replace(/^M(?=\d)/, 'maj')
    .replaceAll('b', '♭')
    .replaceAll('#', '♯');
  const bass = parsedChord.bass ? `/${degreeFor(parsedChord.bass)}` : '';
  return `${degree}${quality}${bass}`;
}

export function extractChords(text: string): string[] {
  return [...text.matchAll(/\[([^\]]+)]/g)]
    .map((match) => match[1].trim())
    .filter(isChord);
}

export function uniqueChords(text: string): string[] {
  return [...new Set(extractChords(text))];
}

export function getSongChordText(blocks: SongStructureBlock[] | null | undefined, fallbackText = ''): string {
  if (!blocks?.length) return fallbackText;
  return blocks
    .map((block) => block.type === 'lyrics' ? block.lyrics : '')
    .filter(Boolean)
    .join('\n');
}

export function detectKeyCandidate(text: string): string | null {
  const firstChord = extractChords(text)[0];
  return firstChord ? parseChord(firstChord)?.root ?? null : null;
}

export function transposeBracketText(
  text: string,
  semitones: number,
  options: { nashville?: boolean; key?: string | null; preference?: AccidentalPreference } = {},
): string {
  const { nashville = false, key = null, preference = 'auto' } = options;
  const transposedKey = key ? transposeNote(key, semitones, preference, key) : null;
  return text.replace(/\[([^\]]+)]/g, (original, rawChord: string) => {
    const chord = rawChord.trim();
    if (!isChord(chord)) return original;
    const transposed = transposeChord(chord, semitones, preference, key);
    return `[${nashville ? chordToNashville(transposed, transposedKey) : transposed}]`;
  });
}

function escapeAbcText(value: string): string {
  return value.replace(/["\\]/g, '').replace(/\r?\n/g, ' ').trim();
}

function normalizedMeter(value: string | null | undefined): string {
  return /^\d{1,2}\/\d{1,2}$/.test(value ?? '') ? value as string : '4/4';
}

/**
 * Generates an honest harmonic lead sheet: chord symbols over rhythmic rests.
 * It intentionally does not invent a vocal melody. A real melody can be entered
 * as an ABC block and rendered by SheetMusicViewer.
 */
export function generateHarmonyScoreAbc(options: HarmonyScoreOptions): string | null {
  const sourceText = getSongChordText(options.blocks, options.fallbackText ?? '');
  const sourceChords = extractChords(sourceText);
  if (!sourceChords.length) return null;

  const transpose = options.transpose ?? 0;
  const preference = options.accidentalPreference ?? 'auto';
  const key = options.key
    ? transposeNote(options.key, transpose, preference, options.key)
    : 'C';
  const chords = sourceChords.map((chord) => transposeChord(chord, transpose, preference, options.key));
  const measures: string[] = [];
  for (let index = 0; index < chords.length; index += 4) {
    const measureChords = chords.slice(index, index + 4);
    measures.push(`${measureChords.map((chord) => `"${escapeAbcText(chord)}"z`).join(' ')} |`);
  }

  const bodyLines: string[] = [];
  for (let index = 0; index < measures.length; index += 4) {
    bodyLines.push(measures.slice(index, index + 4).join(' '));
  }

  return [
    'X:1',
    `T:${escapeAbcText(options.title)}`,
    options.artist ? `C:${escapeAbcText(options.artist)}` : '',
    `M:${normalizedMeter(options.timeSignature)}`,
    'L:1/4',
    'Q:1/4=84',
    `K:${key}`,
    ...bodyLines,
  ].filter(Boolean).join('\n');
}

export function slugifySongTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}
