// src/utils/bibleParser.ts

// A simplified map of common Spanish book names to the IDs used in the API
export const BIBLE_BOOK_MAP: Record<string, string> = {
  'génesis': 'genesis', 'genesis': 'genesis',
  'éxodo': 'exodo', 'exodo': 'exodo',
  'levítico': 'levitico', 'levitico': 'levitico',
  'números': 'numeros', 'numeros': 'numeros',
  'deuteronomio': 'deuteronomio',
  'josué': 'josue', 'josue': 'josue',
  'jueces': 'jueces',
  'rut': 'rut',
  '1 samuel': '1-samuel',
  '2 samuel': '2-samuel',
  '1 reyes': '1-reyes',
  '2 reyes': '2-reyes',
  '1 crónicas': '1-cronicas', '1 cronicas': '1-cronicas',
  '2 crónicas': '2-cronicas', '2 cronicas': '2-cronicas',
  'esdras': 'esdras',
  'nehemías': 'nehemias', 'nehemias': 'nehemias',
  'ester': 'ester',
  'job': 'job',
  'salmos': 'salmos', 'salmo': 'salmos',
  'proverbios': 'proverbios',
  'eclesiastés': 'eclesiastes', 'eclesiastes': 'eclesiastes',
  'cantares': 'cantares', 'cantar de los cantares': 'cantares',
  'isaías': 'isaias', 'isaias': 'isaias',
  'jeremías': 'jeremias', 'jeremias': 'jeremias',
  'lamentaciones': 'lamentaciones',
  'ezequiel': 'ezequiel',
  'daniel': 'daniel',
  'oseas': 'oseas',
  'joel': 'joel',
  'amós': 'amos', 'amos': 'amos',
  'abdías': 'abdias', 'abdias': 'abdias',
  'jonás': 'jonas', 'jonas': 'jonas',
  'miqueas': 'miqueas',
  'nahúm': 'nahum', 'nahum': 'nahum',
  'habacuc': 'habacuc',
  'sofonías': 'sofonias', 'sofonias': 'sofonias',
  'hageo': 'hageo',
  'zacarías': 'zacarias', 'zacarias': 'zacarias',
  'malaquías': 'malaquias', 'malaquias': 'malaquias',
  'mateo': 'mateo',
  'marcos': 'marcos',
  'lucas': 'lucas',
  'juan': 'juan',
  'hechos': 'hechos', 'hechos de los apostoles': 'hechos',
  'romanos': 'romanos',
  '1 corintios': '1-corintios',
  '2 corintios': '2-corintios',
  'gálatas': 'galatas', 'galatas': 'galatas',
  'efesios': 'efesios',
  'filipenses': 'filipenses',
  'colosenses': 'colosenses',
  '1 tesalonicenses': '1-tesalonicenses', '1 ts.': '1-tesalonicenses', '1 ts': '1-tesalonicenses',
  '2 tesalonicenses': '2-tesalonicenses', '2 ts.': '2-tesalonicenses', '2 ts': '2-tesalonicenses',
  '1 timoteo': '1-timoteo',
  '2 timoteo': '2-timoteo',
  'tito': 'tito',
  'filemón': 'filemon', 'filemon': 'filemon',
  'hebreos': 'hebreos',
  'santiago': 'santiago',
  '1 pedro': '1-pedro',
  '2 pedro': '2-pedro',
  '1 juan': '1-juan',
  '2 juan': '2-juan',
  '3 juan': '3-juan',
  'judas': 'judas',
  'apocalipsis': 'apocalipsis'
};

export interface ParsedVerse {
  original: string;
  bookId: string;
  bookName: string;
  chapter: string;
  verses: string;
}

/**
 * Parses a string containing multiple bible references separated by semicolons
 * (e.g., "Juan 3:16; Romanos 5:8") into an array of parsed objects.
 */
export function parseBibleReferences(text: string): ParsedVerse[] {
  const parts = text.split(';').map(p => p.trim()).filter(Boolean);
  const results: ParsedVerse[] = [];
  
  // Basic regex to match standard Bible references in Spanish:
  // e.g., "1 Juan 3:16-18", "Santiago 5:14", "Cantar de los Cantares 2:1", "2 Corintios 13 y 14"
  const regex = /^((?:[123]\s+)?[A-Za-záéíóúÁÉÍÓÚñÑ\s]+)\s+(\d+)(?:[:\s]+([\d\-,yY\s]+))?/;

  for (const part of parts) {
    const match = part.match(regex);
    if (match) {
      const rawBookName = match[1].trim();
      const chapter = match[2].trim();
      const verses = match[3] ? match[3].trim() : '';
      
      const normalizedBook = rawBookName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const bookId = BIBLE_BOOK_MAP[normalizedBook] || BIBLE_BOOK_MAP[rawBookName.toLowerCase()] || rawBookName.toLowerCase().replace(/\s+/g, '');

      results.push({
        original: part,
        bookId,
        bookName: rawBookName,
        chapter,
        verses
      });
    } else {
       results.push({
        original: part,
        bookId: '',
        bookName: '',
        chapter: '',
        verses: ''
      });
    }
  }

  return results;
}

/**
 * Helper to expand verse ranges into an array of numbers.
 * e.g., "14-16" -> [14, 15, 16]
 * "1,3,5" -> [1, 3, 5]
 */
export function parseVerseRange(verseStr: string): number[] {
  const result: number[] = [];
  if (!verseStr) return result;

  const parts = verseStr.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          result.push(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) result.push(num);
    }
  }
  return [...new Set(result)].sort((a, b) => a - b);
}
