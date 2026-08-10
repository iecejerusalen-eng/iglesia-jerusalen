export type HangmanDifficulty = 'easy' | 'medium' | 'hard';

export interface HangmanWord {
  id: string;
  word: string;
  hint: string;
  category: string;
  difficulty: HangmanDifficulty;
  bible_reference: string;
}

export interface RawHangmanWord {
  id: unknown;
  word: unknown;
  hint: unknown;
  category: unknown;
  difficulty?: unknown;
  bible_reference?: unknown;
}

interface ReviewedLegacyContent {
  reference: string;
  word?: string;
  hint?: string;
  category?: string;
}

const REVIEWED_LEGACY_CONTENT: Record<string, ReviewedLegacyContent> = {
  APOCALIPSIS: { reference: 'Apocalipsis 1:1' },
  BARTIMEO: { reference: 'Marcos 10:46-52' },
  BETANIA: { reference: 'Juan 11:1' },
  BETLEHEM: {
    word: 'BELÉN',
    hint: 'Ciudad de Judea donde nació Jesús',
    category: 'Lugar',
    reference: 'Lucas 2:4-7',
  },
  BETHLEHEM: {
    word: 'BELÉN',
    hint: 'Ciudad de Judea donde nació Jesús',
    category: 'Lugar',
    reference: 'Lucas 2:4-7',
  },
  BELEN: { word: 'BELÉN', reference: 'Lucas 2:4-7' },
  BIENAVENTURANZAS: { reference: 'Mateo 5:3-12' },
  CORINTO: { reference: '1 Corintios 1:2; 2 Corintios 1:1' },
  DAVID: { reference: '1 Samuel 17:49-50' },
  DEUTERONOMIO: { reference: 'Deuteronomio 1:1' },
  DORCAS: { reference: 'Hechos 9:36' },
  ECLESIASTES: { word: 'ECLESIASTÉS', reference: 'Eclesiastés 3:1' },
  EMANUEL: { reference: 'Mateo 1:23' },
  FILIPOS: { reference: 'Hechos 16:22-24' },
  GEDEON: { word: 'GEDEÓN', reference: 'Jueces 7:7' },
  GENESIS: { word: 'GÉNESIS', reference: 'Génesis 1:1' },
  GETSEMANI: { word: 'GETSEMANÍ', reference: 'Mateo 26:36-39' },
  GOLGOTA: { word: 'GÓLGOTA', reference: 'Juan 19:17' },
  HABACUC: { reference: 'Habacuc 2:4' },
  JERUSALEN: { word: 'JERUSALÉN', reference: 'Apocalipsis 21:2' },
  MELQUISEDEC: { reference: 'Génesis 14:18' },
  MOISES: { word: 'MOISÉS', reference: 'Éxodo 14:21' },
  NAZARET: { reference: 'Lucas 2:39-40' },
  NEHEMIAS: { word: 'NEHEMÍAS', reference: 'Nehemías 2:17-18' },
  PENTATEUCO: { reference: 'Lucas 24:44' },
  PENTECOSTES: { word: 'PENTECOSTÉS', reference: 'Hechos 2:1-4' },
  PRISCILA: { reference: 'Hechos 18:24-26' },
  REDENCION: { word: 'REDENCIÓN', reference: 'Efesios 1:7' },
  RESURRECCION: { word: 'RESURRECCIÓN', reference: 'Mateo 28:5-6' },
  SANSON: { word: 'SANSÓN', reference: 'Jueces 16:17' },
  TRANSFIGURACION: { word: 'TRANSFIGURACIÓN', reference: 'Mateo 17:1-5' },
};

export const normalizeForGuess = (value: string) => value
  .toLocaleUpperCase('es')
  .replaceAll('Ñ', '__ENYE__')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replaceAll('__ENYE__', 'Ñ');

function asRequiredText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asDifficulty(value: unknown): HangmanDifficulty {
  return value === 'medium' || value === 'hard' ? value : 'easy';
}

export function normalizeHangmanWord(raw: RawHangmanWord): HangmanWord | null {
  const id = asRequiredText(raw.id);
  const rawWord = asRequiredText(raw.word);
  const rawHint = asRequiredText(raw.hint);
  const rawCategory = asRequiredText(raw.category);
  if (!id || !rawWord || !rawHint || !rawCategory) return null;

  const reviewed = REVIEWED_LEGACY_CONTENT[normalizeForGuess(rawWord)];
  const reference = asRequiredText(raw.bible_reference) ?? reviewed?.reference ?? null;
  if (!reference) return null;

  return {
    id,
    word: reviewed?.word ?? rawWord.toLocaleUpperCase('es'),
    hint: reviewed?.hint ?? rawHint,
    category: reviewed?.category ?? rawCategory,
    difficulty: asDifficulty(raw.difficulty),
    bible_reference: reference,
  };
}

export function prepareHangmanWords(rows: RawHangmanWord[]): {
  words: HangmanWord[];
  rejectedIds: string[];
} {
  const words: HangmanWord[] = [];
  const rejectedIds: string[] = [];

  rows.forEach((row) => {
    const word = normalizeHangmanWord(row);
    if (word) {
      words.push(word);
      return;
    }
    rejectedIds.push(typeof row.id === 'string' ? row.id : 'registro-sin-id');
  });

  return { words, rejectedIds };
}

export const DIFFICULTY_LABELS: Record<HangmanDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Intermedio',
  hard: 'Desafío',
};
