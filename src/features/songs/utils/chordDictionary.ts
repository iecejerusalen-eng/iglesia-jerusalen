import guitarDb from '@tombatossals/chords-db/lib/guitar.json';
import ukuleleDb from '@tombatossals/chords-db/lib/ukulele.json';
import { Chord } from '@tonaljs/tonal';

export type InstrumentType = 'guitarra' | 'electrica' | 'ukelele' | 'piano' | 'bajo' | 'bateria' | 'ninguno';

interface ChordDatabasePosition {
  frets: number[];
  fingers: number[];
  baseFret?: number;
  barres?: number[];
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
}

export interface StringChordData {
  instrument: 'guitarra' | 'electrica' | 'ukelele';
  title: string;
  frets: number[];
  fingers: number[];
  baseFret?: number;
  barres?: number[];
}

export type ResolvedChordData = PianoChordData | StringChordData;

// Map tonaljs aliases to chords-db suffixes
const suffixMap: Record<string, string> = {
  '': 'major',
  'M': 'major',
  'm': 'minor',
  'dim': 'dim',
  'o': 'dim',
  'dim7': 'dim7',
  'o7': 'dim7',
  'sus2': 'sus2',
  'sus4': 'sus4',
  'sus': 'sus4',
  '7sus4': '7sus4',
  '7sus': '7sus4',
  'aug': 'aug',
  '+': 'aug',
  '6': '6',
  '69': '69',
  '6/9': '69',
  '7': '7',
  '7b5': '7b5',
  'aug7': 'aug7',
  '+7': 'aug7',
  '9': '9',
  '9b5': '9b5',
  'aug9': 'aug9',
  '+9': 'aug9',
  '7b9': '7b9',
  '7#9': '7#9',
  '11': '11',
  '9#11': '9#11',
  '13': '13',
  'maj7': 'maj7',
  'M7': 'maj7',
  'maj7b5': 'maj7b5',
  'maj7#5': 'maj7#5',
  'maj9': 'maj9',
  'M9': 'maj9',
  'maj11': 'maj11',
  'M11': 'maj11',
  'maj13': 'maj13',
  'M13': 'maj13',
  'm6': 'm6',
  'm69': 'm69',
  'm7': 'm7',
  'm7b5': 'm7b5',
  'm9': 'm9',
  'm11': 'm11',
  'mmaj7': 'mmaj7',
  'mmaj7b5': 'mmaj7b5',
  'mmaj9': 'mmaj9',
  'mmaj11': 'mmaj11',
  'add9': 'add9',
  'madd9': 'madd9',
};

const formatKeyForDb = (key: string): string => {
  const map: Record<string, string> = {
    'C#': 'Csharp',
    'Db': 'Csharp',
    'D#': 'Eb',
    'F#': 'Fsharp',
    'Gb': 'Fsharp',
    'G#': 'Ab',
    'A#': 'Bb',
  };
  return map[key] || key;
};

function resolveDatabaseEntry(chordName: string, instrument: 'guitarra' | 'electrica' | 'ukelele'): ChordDatabaseEntry | null {
  const parsed = Chord.get(chordName);
  if (parsed.empty) return null;
  const db = (instrument === 'ukelele' ? ukuleleDb : guitarDb) as ChordDatabase;
  const rootKey = formatKeyForDb(parsed.tonic || '');
  const keyData = db.chords[rootKey];
  if (!keyData) return null;
  const mappedSuffix = parsed.aliases.map((alias) => suffixMap[alias]).find(Boolean)
    || suffixMap[parsed.type]
    || (parsed.quality === 'Minor' ? 'minor' : 'major');
  return keyData.find((candidate) => candidate.suffix === mappedSuffix) ?? null;
}

export function getChordVariationCount(chordName: string, instrument: InstrumentType): number {
  if (instrument === 'piano' || instrument === 'bajo') return 1;
  if (instrument === 'ninguno' || instrument === 'bateria') return 0;
  return resolveDatabaseEntry(chordName, instrument)?.positions.length ?? 0;
}

export const getChordData = (chordName: string, instrument: InstrumentType, variation = 0): ResolvedChordData | null => {
  try {
    const parsed = Chord.get(chordName);
    if (parsed.empty) return null;

    if (instrument === 'piano') {
      return {
        instrument: 'piano',
        notes: parsed.notes
      };
    }

    if (instrument === 'guitarra' || instrument === 'electrica' || instrument === 'ukelele') {
      const chordVariations = resolveDatabaseEntry(chordName, instrument);
      
      if (chordVariations && chordVariations.positions.length > 0) {
        const pos = chordVariations.positions[Math.abs(variation) % chordVariations.positions.length];
        
        // svGuitar expects fingers in a specific format for rendering
        // pos.frets: array of frets [E, A, D, G, B, e]
        // pos.fingers: array of fingers
        
        // For StringChordDiagram we only need title and fingers if we want full custom 
        // But for now, we can pass it so StringChordDiagram can draw it perfectly.
        return {
          instrument,
          title: chordName,
          frets: pos.frets,
          fingers: pos.fingers,
          baseFret: pos.baseFret,
          barres: pos.barres
        };
      }
    }
  } catch (e) {
    console.error("Error parsing chord:", chordName, e);
  }
  return null;
};
