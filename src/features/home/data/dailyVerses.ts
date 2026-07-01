// src/features/home/data/dailyVerses.ts

export interface DailyVerseReference {
  bookId: string;
  chapter: number;
  verses: string;
  reference: string;
}

// A curated list of verses. 
// We don't need exactly 365 because the random selector will shuffle and pick from the available pool.
export const CURATED_VERSES: DailyVerseReference[] = [
  { bookId: 'juan', chapter: 3, verses: '16', reference: 'Juan 3:16' },
  { bookId: 'filipenses', chapter: 4, verses: '13', reference: 'Filipenses 4:13' },
  { bookId: 'salmos', chapter: 23, verses: '1', reference: 'Salmo 23:1' },
  { bookId: 'jeremias', chapter: 29, verses: '11', reference: 'Jeremías 29:11' },
  { bookId: 'romanos', chapter: 8, verses: '28', reference: 'Romanos 8:28' },
  { bookId: 'proverbios', chapter: 3, verses: '5-6', reference: 'Proverbios 3:5-6' },
  { bookId: 'isaias', chapter: 41, verses: '10', reference: 'Isaías 41:10' },
  { bookId: 'salmos', chapter: 46, verses: '1', reference: 'Salmo 46:1' },
  { bookId: 'galatas', chapter: 5, verses: '22-23', reference: 'Gálatas 5:22-23' },
  { bookId: 'hebreos', chapter: 11, verses: '1', reference: 'Hebreos 11:1' },
  { bookId: '2-timoteo', chapter: 1, verses: '7', reference: '2 Timoteo 1:7' },
  { bookId: '1-corintios', chapter: 10, verses: '13', reference: '1 Corintios 10:13' },
  { bookId: 'proverbios', chapter: 4, verses: '23', reference: 'Proverbios 4:23' },
  { bookId: 'romanos', chapter: 12, verses: '2', reference: 'Romanos 12:2' },
  { bookId: 'mateo', chapter: 11, verses: '28', reference: 'Mateo 11:28' },
  { bookId: 'hebreos', chapter: 4, verses: '12', reference: 'Hebreos 4:12' },
  { bookId: 'santiago', chapter: 1, verses: '5', reference: 'Santiago 1:5' },
  { bookId: 'isaias', chapter: 40, verses: '31', reference: 'Isaías 40:31' },
  { bookId: 'josue', chapter: 1, verses: '9', reference: 'Josué 1:9' },
  { bookId: 'lamentaciones', chapter: 3, verses: '22-23', reference: 'Lamentaciones 3:22-23' },
  { bookId: 'salmos', chapter: 119, verses: '105', reference: 'Salmo 119:105' },
  { bookId: 'mateo', chapter: 6, verses: '33', reference: 'Mateo 6:33' },
  { bookId: 'colosenses', chapter: 3, verses: '23', reference: 'Colosenses 3:23' },
  { bookId: 'efesios', chapter: 2, verses: '8-9', reference: 'Efesios 2:8-9' },
  { bookId: '1-pedro', chapter: 5, verses: '7', reference: '1 Pedro 5:7' },
  { bookId: 'romanos', chapter: 5, verses: '8', reference: 'Romanos 5:8' },
  { bookId: 'filipenses', chapter: 4, verses: '6-7', reference: 'Filipenses 4:6-7' },
  { bookId: 'salmos', chapter: 27, verses: '1', reference: 'Salmo 27:1' },
  { bookId: '1-juan', chapter: 1, verses: '9', reference: '1 Juan 1:9' },
  { bookId: 'hebreos', chapter: 12, verses: '1-2', reference: 'Hebreos 12:1-2' },
  { bookId: 'mateo', chapter: 28, verses: '19-20', reference: 'Mateo 28:19-20' },
  { bookId: 'romanos', chapter: 10, verses: '9', reference: 'Romanos 10:9' },
  { bookId: 'salmos', chapter: 37, verses: '4', reference: 'Salmo 37:4' },
  { bookId: 'proverbios', chapter: 16, verses: '3', reference: 'Proverbios 16:3' },
  { bookId: 'isaias', chapter: 53, verses: '5', reference: 'Isaías 53:5' },
  { bookId: 'juan', chapter: 14, verses: '6', reference: 'Juan 14:6' },
  { bookId: 'hechos', chapter: 1, verses: '8', reference: 'Hechos 1:8' },
  { bookId: 'romanos', chapter: 8, verses: '38-39', reference: 'Romanos 8:38-39' },
  { bookId: '1-tesalonicenses', chapter: 5, verses: '16-18', reference: '1 Tesalonicenses 5:16-18' },
  { bookId: 'santiago', chapter: 4, verses: '7', reference: 'Santiago 4:7' },
  { bookId: '2-corintios', chapter: 5, verses: '17', reference: '2 Corintios 5:17' },
  { bookId: 'salmos', chapter: 91, verses: '1-2', reference: 'Salmo 91:1-2' },
  { bookId: 'juan', chapter: 1, verses: '12', reference: 'Juan 1:12' },
  { bookId: 'efesios', chapter: 6, verses: '11', reference: 'Efesios 6:11' },
  { bookId: 'salmos', chapter: 1, verses: '1-2', reference: 'Salmo 1:1-2' },
  { bookId: 'proverbios', chapter: 3, verses: '9-10', reference: 'Proverbios 3:9-10' },
  { bookId: 'isaias', chapter: 26, verses: '3', reference: 'Isaías 26:3' },
  { bookId: 'juan', chapter: 8, verses: '32', reference: 'Juan 8:32' },
  { bookId: 'romanos', chapter: 12, verses: '1', reference: 'Romanos 12:1' },
  { bookId: 'filipenses', chapter: 2, verses: '3-4', reference: 'Filipenses 2:3-4' },
  { bookId: 'colosenses', chapter: 3, verses: '15', reference: 'Colosenses 3:15' },
  { bookId: '1-juan', chapter: 4, verses: '18', reference: '1 Juan 4:18' },
  { bookId: 'hebreos', chapter: 10, verses: '24-25', reference: 'Hebreos 10:24-25' },
  { bookId: 'santiago', chapter: 1, verses: '22', reference: 'Santiago 1:22' },
  { bookId: '1-pedro', chapter: 2, verses: '9', reference: '1 Pedro 2:9' },
  { bookId: 'mateo', chapter: 5, verses: '14-16', reference: 'Mateo 5:14-16' },
  { bookId: 'lucas', chapter: 9, verses: '23', reference: 'Lucas 9:23' },
  { bookId: 'juan', chapter: 15, verses: '5', reference: 'Juan 15:5' },
  { bookId: 'hechos', chapter: 4, verses: '12', reference: 'Hechos 4:12' },
  { bookId: 'galatas', chapter: 2, verses: '20', reference: 'Gálatas 2:20' }
];

// Seeded random number generator
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Returns a deterministically shuffled array based on the year.
 * This ensures the order changes every year.
 */
export function getYearlyShuffledVerses(year: number): DailyVerseReference[] {
  const verses = [...CURATED_VERSES];
  const rand = mulberry32(year);
  
  // Fisher-Yates shuffle with seeded random
  for (let i = verses.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [verses[i], verses[j]] = [verses[j], verses[i]];
  }
  
  return verses;
}

/**
 * Gets the specific verse for a given day of the year (0-365).
 * It will loop through the shuffled array if the day exceeds the array length.
 */
export function getVerseForDay(year: number, dayOfYear: number): DailyVerseReference {
  const shuffled = getYearlyShuffledVerses(year);
  const index = dayOfYear % shuffled.length;
  return shuffled[index];
}
