// src/utils/bibleParser.ts

// A simplified map of common Spanish book names to the IDs used in the API
export const BIBLE_BOOK_MAP: Record<string, string> = {
  // Pentateuco
  'génesis': 'genesis', 'genesis': 'genesis', 'gn': 'genesis', 'ge': 'genesis',
  'éxodo': 'exodo', 'exodo': 'exodo', 'ex': 'exodo',
  'levítico': 'levitico', 'levitico': 'levitico', 'lv': 'levitico', 'le': 'levitico',
  'números': 'numeros', 'numeros': 'numeros', 'nm': 'numeros', 'nu': 'numeros',
  'deuteronomio': 'deuteronomio', 'dt': 'deuteronomio',
  
  // Históricos
  'josué': 'josue', 'josue': 'josue', 'jos': 'josue',
  'jueces': 'jueces', 'jue': 'jueces',
  'rut': 'rut', 'rt': 'rut',
  '1 samuel': '1-samuel', '1samuel': '1-samuel', '1 sa': '1-samuel', '1sa': '1-samuel', '1 sm': '1-samuel', '1sm': '1-samuel',
  '2 samuel': '2-samuel', '2samuel': '2-samuel', '2 sa': '2-samuel', '2sa': '2-samuel', '2 sm': '2-samuel', '2sm': '2-samuel',
  '1 reyes': '1-reyes', '1reyes': '1-reyes', '1 re': '1-reyes', '1re': '1-reyes', '1 rey': '1-reyes', '1rey': '1-reyes',
  '2 reyes': '2-reyes', '2reyes': '2-reyes', '2 re': '2-reyes', '2re': '2-reyes', '2 rey': '2-reyes', '2rey': '2-reyes',
  '1 crónicas': '1-cronicas', '1 cronicas': '1-cronicas', '1cronicas': '1-cronicas', '1 cr': '1-cronicas', '1cr': '1-cronicas', '1 cro': '1-cronicas', '1cro': '1-cronicas',
  '2 crónicas': '2-cronicas', '2 cronicas': '2-cronicas', '2cronicas': '2-cronicas', '2 cr': '2-cronicas', '2cr': '2-cronicas', '2 cro': '2-cronicas', '2cro': '2-cronicas',
  'esdras': 'esdras', 'esd': 'esdras',
  'nehemías': 'nehemias', 'nehemias': 'nehemias', 'ne': 'nehemias', 'neh': 'nehemias',
  'ester': 'ester', 'est': 'ester',
  
  // Poéticos
  'job': 'job', 'jb': 'job',
  'salmos': 'salmos', 'salmo': 'salmos', 'sal': 'salmos', 'sa': 'salmos', 'sl': 'salmos',
  'proverbios': 'proverbios', 'pr': 'proverbios', 'pro': 'proverbios', 'prov': 'proverbios',
  'eclesiastés': 'eclesiastes', 'eclesiastes': 'eclesiastes', 'ec': 'eclesiastes', 'ecl': 'eclesiastes',
  'cantares': 'cantares', 'cantar de los cantares': 'cantares', 'cnt': 'cantares', 'can': 'cantares',
  
  // Profetas Mayores
  'isaías': 'isaias', 'isaias': 'isaias', 'is': 'isaias',
  'jeremías': 'jeremias', 'jeremias': 'jeremias', 'jer': 'jeremias', 'je': 'jeremias',
  'lamentaciones': 'lamentaciones', 'lm': 'lamentaciones', 'lam': 'lamentaciones',
  'ezequiel': 'ezequiel', 'ez': 'ezequiel', 'eze': 'ezequiel',
  'daniel': 'daniel', 'dn': 'daniel', 'dan': 'daniel',
  
  // Profetas Menores
  'oseas': 'oseas', 'os': 'oseas',
  'joel': 'joel', 'jl': 'joel',
  'amós': 'amos', 'amos': 'amos', 'am': 'amos',
  'abdías': 'abdias', 'abdias': 'abdias', 'abd': 'abdias', 'ob': 'abdias',
  'jonás': 'jonas', 'jonas': 'jonas', 'jon': 'jonas',
  'miqueas': 'miqueas', 'miq': 'miqueas', 'mi': 'miqueas',
  'nahúm': 'nahum', 'nahum': 'nahum', 'nah': 'nahum', 'na': 'nahum',
  'habacuc': 'habacuc', 'hab': 'habacuc',
  'sofonías': 'sofonias', 'sofonias': 'sofonias', 'sof': 'sofonias', 'so': 'sofonias',
  'hageo': 'hageo', 'hag': 'hageo', 'hg': 'hageo',
  'zacarías': 'zacarias', 'zacarias': 'zacarias', 'zac': 'zacarias', 'za': 'zacarias',
  'malaquías': 'malaquias', 'malaquias': 'malaquias', 'mal': 'malaquias',
  
  // Evangelios
  'mateo': 'mateo', 'mt': 'mateo',
  'marcos': 'marcos', 'mr': 'marcos', 'mc': 'marcos',
  'lucas': 'lucas', 'lc': 'lucas', 'lu': 'lucas',
  'juan': 'juan', 'jn': 'juan',
  
  // Historia
  'hechos': 'hechos', 'hechos de los apostoles': 'hechos', 'hch': 'hechos',
  
  // Cartas Paulinas
  'romanos': 'romanos', 'ro': 'romanos', 'rom': 'romanos',
  '1 corintios': '1-corintios', '1corintios': '1-corintios', '1 co': '1-corintios', '1co': '1-corintios', '1 cor': '1-corintios', '1cor': '1-corintios',
  '2 corintios': '2-corintios', '2corintios': '2-corintios', '2 co': '2-corintios', '2co': '2-corintios', '2 cor': '2-corintios', '2cor': '2-corintios',
  'gálatas': 'galatas', 'galatas': 'galatas', 'ga': 'galatas', 'gal': 'galatas',
  'efesios': 'efesios', 'ef': 'efesios',
  'filipenses': 'filipenses', 'fil': 'filipenses', 'flp': 'filipenses',
  'colosenses': 'colosenses', 'col': 'colosenses',
  '1 tesalonicenses': '1-tesalonicenses', '1tesalonicenses': '1-tesalonicenses', '1 ts': '1-tesalonicenses', '1ts': '1-tesalonicenses', '1 tes': '1-tesalonicenses', '1tes': '1-tesalonicenses',
  '2 tesalonicenses': '2-tesalonicenses', '2tesalonicenses': '2-tesalonicenses', '2 ts': '2-tesalonicenses', '2ts': '2-tesalonicenses', '2 tes': '2-tesalonicenses', '2tes': '2-tesalonicenses',
  '1 timoteo': '1-timoteo', '1timoteo': '1-timoteo', '1 ti': '1-timoteo', '1ti': '1-timoteo', '1 tim': '1-timoteo', '1tim': '1-timoteo',
  '2 timoteo': '2-timoteo', '2timoteo': '2-timoteo', '2 ti': '2-timoteo', '2ti': '2-timoteo', '2 tim': '2-timoteo', '2tim': '2-timoteo',
  'tito': 'tito', 'tit': 'tito',
  'filemón': 'filemon', 'filemon': 'filemon', 'flm': 'filemon',
  
  // Cartas Generales
  'hebreos': 'hebreos', 'heb': 'hebreos',
  'santiago': 'santiago', 'stg': 'santiago',
  '1 pedro': '1-pedro', '1pedro': '1-pedro', '1 pe': '1-pedro', '1pe': '1-pedro',
  '2 pedro': '2-pedro', '2pedro': '2-pedro', '2 pe': '2-pedro', '2pe': '2-pedro',
  '1 juan': '1-juan', '1juan': '1-juan', '1 jn': '1-juan', '1jn': '1-juan',
  '2 juan': '2-juan', '2juan': '2-juan', '2 jn': '2-juan', '2jn': '2-juan',
  '3 juan': '3-juan', '3juan': '3-juan', '3 jn': '3-juan', '3jn': '3-juan',
  'judas': 'judas', 'jud': 'judas',
  'apocalipsis': 'apocalipsis', 'ap': 'apocalipsis', 'apo': 'apocalipsis'
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
  // e.g., "1 Juan 3:16-18", "Santiago 5:14", "Cantar de los Cantares 2:1", "1Sa 23 7"
  const regex = /^([123]?\s*[A-Za-záéíóúÁÉÍÓÚñÑ\.]+)\s+(\d+)(?:[:\s]+([\d\-,yY\s]+))?/;

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
