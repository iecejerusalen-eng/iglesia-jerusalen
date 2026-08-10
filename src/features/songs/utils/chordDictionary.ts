import guitarDb from '@tombatossals/chords-db/lib/guitar.json';
import ukuleleDb from '@tombatossals/chords-db/lib/ukulele.json';
import { Chord, Note } from '@tonaljs/tonal';
import { parseChord, transposeNote } from './musicEngine';

export type InstrumentType = 'guitarra' | 'electrica' | 'ukelele' | 'piano' | 'bajo' | 'bateria' | 'ninguno';
type StringInstrument = 'guitarra' | 'electrica' | 'ukelele';

interface ChordDatabasePosition {
  frets: number[];
  fingers: number[];
  baseFret?: number;
  barres?: number[];
  midi?: number[];
}

interface ChordDatabaseEntry {
  suffix: string;
  positions: ChordDatabasePosition[];
}

interface ChordDatabase {
  chords: Record<string, ChordDatabaseEntry[]>;
}

export interface PianoChordData {
  instrument: 'piano';
  notes: string[];
  bassNote: string | null;
}

export interface StringChordData {
  instrument: StringInstrument;
  title: string;
  frets: number[];
  fingers: number[];
  baseFret?: number;
  barres?: number[];
  bassNote: string | null;
  usesBaseShape: boolean;
}

export type ResolvedChordData = PianoChordData | StringChordData;

const suffixMap: Record<string, string> = {
  '': 'major',
  M: 'major',
  m: 'minor',
  dim: 'dim',
  o: 'dim',
  dim7: 'dim7',
  o7: 'dim7',
  sus2: 'sus2',
  sus4: 'sus4',
  sus: 'sus4',
  '7sus4': '7sus4',
  '7sus': '7sus4',
  aug: 'aug',
  '+': 'aug',
  '6': '6',
  '69': '69',
  '6/9': '69',
  '7': '7',
  '7b5': '7b5',
  aug7: 'aug7',
  '+7': 'aug7',
  '9': '9',
  '9b5': '9b5',
  aug9: 'aug9',
  '+9': 'aug9',
  '7b9': '7b9',
  '7#9': '7#9',
  '11': '11',
  '9#11': '9#11',
  '13': '13',
  maj7: 'maj7',
  M7: 'maj7',
  maj7b5: 'maj7b5',
  'maj7#5': 'maj7#5',
  maj9: 'maj9',
  M9: 'maj9',
  maj11: 'maj11',
  M11: 'maj11',
  maj13: 'maj13',
  M13: 'maj13',
  m6: 'm6',
  m69: 'm69',
  m7: 'm7',
  m7b5: 'm7b5',
  m9: 'm9',
  m11: 'm11',
  mmaj7: 'mmaj7',
  mmaj7b5: 'mmaj7b5',
  mmaj9: 'mmaj9',
  mmaj11: 'mmaj11',
  add9: 'add9',
  madd9: 'madd9',
};

const STRING_TUNINGS: Record<'guitarra' | 'ukelele', number[]> = {
  guitarra: [40, 45, 50, 55, 59, 64],
  ukelele: [55, 60, 64, 69],
};

const formatKeyForDb = (key: string): string => {
  const map: Record<string, string> = {
    'C#': 'Csharp',
    Db: 'Csharp',
    'D#': 'Eb',
    'F#': 'Fsharp',
    Gb: 'Fsharp',
    'G#': 'Ab',
    'A#': 'Bb',
  };
  return map[key] || key;
};

const formatBassForDb = (note: string): string => {
  const map: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', 'A#': 'Bb' };
  return map[note] || note;
};

function normalizedNote(note: string): string {
  return transposeNote(note, 0, note.includes('b') ? 'flat' : 'sharp', note);
}

function baseChordData(chordName: string) {
  const parsed = parseChord(chordName);
  if (!parsed) return null;
  const root = normalizedNote(parsed.root);
  const bass = parsed.bass ? normalizedNote(parsed.bass) : null;
  const chord = Chord.get(`${root}${parsed.quality}`);
  if (chord.empty || !chord.tonic) return null;
  return { parsed, root, bass, chord };
}

function databaseFor(instrument: StringInstrument): ChordDatabase {
  return (instrument === 'ukelele' ? ukuleleDb : guitarDb) as ChordDatabase;
}

function resolveBaseEntry(chordName: string, instrument: StringInstrument): ChordDatabaseEntry | null {
  const resolved = baseChordData(chordName);
  if (!resolved) return null;
  const keyData = databaseFor(instrument).chords[formatKeyForDb(resolved.root)];
  if (!keyData) return null;
  const mappedSuffix = resolved.chord.aliases.map((alias) => suffixMap[alias]).find(Boolean)
    || suffixMap[resolved.chord.type]
    || (resolved.chord.quality === 'Minor' ? 'minor' : 'major');
  return keyData.find((candidate) => candidate.suffix === mappedSuffix) ?? null;
}

function resolveExactInversionEntry(chordName: string, instrument: StringInstrument): ChordDatabaseEntry | null {
  const resolved = baseChordData(chordName);
  if (!resolved?.bass) return null;
  if (resolved.parsed.quality && resolved.parsed.quality !== 'M' && resolved.parsed.quality !== 'm') return null;
  const keyData = databaseFor(instrument).chords[formatKeyForDb(resolved.root)];
  if (!keyData) return null;
  const minorPrefix = resolved.chord.quality === 'Minor' ? 'm' : '';
  const inversionSuffix = `${minorPrefix}/${formatBassForDb(resolved.bass)}`;
  return keyData.find((candidate) => candidate.suffix === inversionSuffix) ?? null;
}

function absoluteFrets(position: ChordDatabasePosition): number[] {
  const baseFret = position.baseFret ?? 1;
  return position.frets.map((fret) => fret > 0 && baseFret > 1 ? fret + baseFret - 1 : fret);
}

function inferBarreFrets(frets: number[]): number[] {
  const counts = new Map<number, number>();
  frets.forEach((fret) => {
    if (fret > 0) counts.set(fret, (counts.get(fret) ?? 0) + 1);
  });
  return [...counts.entries()].filter(([, count]) => count >= 2).map(([fret]) => fret);
}

function assignFingers(frets: number[], barres: number[]): number[] {
  const uniqueFrets = [...new Set(frets.filter((fret) => fret > 0))].sort((a, b) => a - b);
  const fingerByFret = new Map<number, number>();
  uniqueFrets.forEach((fret, index) => fingerByFret.set(fret, Math.min(4, index + 1)));
  barres.forEach((fret) => fingerByFret.set(fret, 1));
  return frets.map((fret) => fret > 0 ? fingerByFret.get(fret) ?? 1 : 0);
}

function relativePosition(frets: number[]): ChordDatabasePosition | null {
  const positiveFrets = frets.filter((fret) => fret > 0);
  if (!positiveFrets.length) return null;
  const lowest = Math.min(...positiveFrets);
  const highest = Math.max(...positiveFrets);
  if (highest - lowest > 5) return null;
  const baseFret = highest > 5 ? lowest : 1;
  const relativeFrets = frets.map((fret) => fret > 0 && baseFret > 1 ? fret - baseFret + 1 : fret);
  if (Math.max(...relativeFrets) > 6) return null;
  const barres = inferBarreFrets(relativeFrets);
  return {
    frets: relativeFrets,
    fingers: assignFingers(relativeFrets, barres),
    baseFret,
    barres,
  };
}

function generateInversionPositions(chordName: string, instrument: StringInstrument): ChordDatabasePosition[] {
  const resolved = baseChordData(chordName);
  const baseEntry = resolveBaseEntry(chordName, instrument);
  if (!resolved?.bass || !baseEntry) return [];
  const normalizedInstrument = instrument === 'ukelele' ? 'ukelele' : 'guitarra';
  const tuning = STRING_TUNINGS[normalizedInstrument];
  const bassPitch = Note.chroma(resolved.bass);
  const chordPitches = new Set(resolved.chord.notes.map((note) => Note.chroma(note)).filter((pitch): pitch is number => typeof pitch === 'number'));
  if (typeof bassPitch !== 'number') return [];
  const requiredChordTones = Math.min(3, chordPitches.size);
  const candidates: Array<{ position: ChordDatabasePosition; score: number }> = [];

  baseEntry.positions.forEach((sourcePosition) => {
    const sourceFrets = absoluteFrets(sourcePosition);
    const sourceCenter = sourceFrets.filter((fret) => fret > 0).reduce((sum, fret, _, values) => sum + fret / values.length, 0);
    tuning.forEach((openMidi, bassStringIndex) => {
      for (let bassFret = 0; bassFret <= 12; bassFret += 1) {
        if ((openMidi + bassFret) % 12 !== bassPitch) continue;
        const bassMidi = openMidi + bassFret;
        const frets = [...sourceFrets];
        for (let index = 0; index < bassStringIndex; index += 1) frets[index] = -1;
        frets[bassStringIndex] = bassFret;
        for (let index = bassStringIndex + 1; index < frets.length; index += 1) {
          if (frets[index] >= 0 && tuning[index] + frets[index] <= bassMidi) frets[index] = -1;
        }
        const soundingPitches = new Set<number>();
        frets.forEach((fret, stringIndex) => {
          if (fret >= 0) soundingPitches.add((tuning[stringIndex] + fret) % 12);
        });
        const representedChordTones = [...chordPitches].filter((pitch) => soundingPitches.has(pitch)).length;
        if (representedChordTones < requiredChordTones) continue;
        const position = relativePosition(frets);
        if (!position) continue;
        candidates.push({
          position,
          score: bassStringIndex * 4 + Math.abs(bassFret - sourceCenter) + (position.baseFret ?? 1) * 0.05,
        });
      }
    });
  });

  const unique = new Map<string, { position: ChordDatabasePosition; score: number }>();
  candidates.forEach((candidate) => {
    const key = `${candidate.position.baseFret}:${candidate.position.frets.join(',')}`;
    const current = unique.get(key);
    if (!current || candidate.score < current.score) unique.set(key, candidate);
  });
  return [...unique.values()].sort((a, b) => a.score - b.score).slice(0, 4).map(({ position }) => position);
}

function resolveStringPositions(chordName: string, instrument: StringInstrument): { positions: ChordDatabasePosition[]; usesBaseShape: boolean } {
  const resolved = baseChordData(chordName);
  if (!resolved) return { positions: [], usesBaseShape: false };
  if (!resolved.bass) return { positions: resolveBaseEntry(chordName, instrument)?.positions ?? [], usesBaseShape: false };
  const exact = resolveExactInversionEntry(chordName, instrument);
  if (exact?.positions.length) return { positions: exact.positions, usesBaseShape: false };
  const generated = generateInversionPositions(chordName, instrument);
  if (generated.length) return { positions: generated, usesBaseShape: false };
  return { positions: resolveBaseEntry(chordName, instrument)?.positions ?? [], usesBaseShape: true };
}

export function getChordVariationCount(chordName: string, instrument: InstrumentType): number {
  if (instrument === 'piano' || instrument === 'bajo') return 1;
  if (instrument === 'ninguno' || instrument === 'bateria') return 0;
  return resolveStringPositions(chordName, instrument).positions.length;
}

export function getChordData(chordName: string, instrument: InstrumentType, variation = 0): ResolvedChordData | null {
  try {
    const resolved = baseChordData(chordName);
    if (!resolved) return null;

    if (instrument === 'piano') {
      return {
        instrument: 'piano',
        notes: resolved.chord.notes,
        bassNote: resolved.bass,
      };
    }

    if (instrument === 'guitarra' || instrument === 'electrica' || instrument === 'ukelele') {
      const { positions, usesBaseShape } = resolveStringPositions(chordName, instrument);
      if (!positions.length) return null;
      const position = positions[Math.abs(variation) % positions.length];
      return {
        instrument,
        title: chordName,
        frets: position.frets,
        fingers: position.fingers,
        baseFret: position.baseFret,
        barres: position.barres,
        bassNote: resolved.bass,
        usesBaseShape,
      };
    }
  } catch (error) {
    console.error('No se pudo resolver la digitación del acorde.', { chordName, instrument, error });
  }
  return null;
}
