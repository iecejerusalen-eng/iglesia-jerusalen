import { test, expect } from 'vitest';
import { parseBibleReferences } from '../bibleParser';

test('parseBibleReferences parses correctly', () => {
  const inputs = [
    'jn 3:16',
    'juan 3:16',
    'Juan 3:6',
    'juaN 3:16',
    'jn3:16',
    'jn 3 16',
    'Juan 3 16',
    '3 16 Juan',
    'San Juan 3 16',
    'San Juan 3:16',
    'Juan 3:16',
    's.jn 3:16'
  ];

  for (const input of inputs) {
    const result = parseBibleReferences(input);
    const ref = Array.isArray(result) ? result[0] : result;
    
    expect(ref).toBeDefined();

    const expectedVerses = input === 'Juan 3:6' ? '6' : '16';
    
    expect(ref.bookId).toBe('juan');
    expect(String(ref.chapter)).toBe('3');
    expect(String(ref.verses)).toBe(expectedVerses);
  }
});
