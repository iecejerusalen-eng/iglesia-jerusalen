import { describe, expect, it } from 'vitest';
import { normalizeForGuess, normalizeHangmanWord, prepareHangmanWords } from './hangmanContent';

describe('hangmanContent', () => {
  it('normaliza tildes sin convertir la Ñ en N', () => {
    expect(normalizeForGuess('Moisés')).toBe('MOISES');
    expect(normalizeForGuess('niño')).toBe('NIÑO');
  });

  it('traduce la respuesta heredada BETLEHEM y su pista al español', () => {
    expect(normalizeHangmanWord({
      id: '1',
      word: 'BETLEHEM',
      hint: 'City where Jesus was born',
      category: 'City',
      difficulty: 'easy',
    })).toEqual({
      id: '1',
      word: 'BELÉN',
      hint: 'Ciudad de Judea donde nació Jesús',
      category: 'Lugar',
      difficulty: 'easy',
      bible_reference: 'Lucas 2:4-7',
    });
  });

  it('restaura las tildes españolas de las respuestas heredadas', () => {
    const result = prepareHangmanWords([
      { id: '1', word: 'JERUSALEN', hint: 'La ciudad santa', category: 'Lugar' },
      { id: '2', word: 'MOISES', hint: 'Abrió el mar Rojo', category: 'Personaje' },
      { id: '3', word: 'GENESIS', hint: 'Libro de los comienzos', category: 'Libro' },
    ]);

    expect(result.rejectedIds).toEqual([]);
    expect(result.words.map((word) => word.word)).toEqual(['JERUSALÉN', 'MOISÉS', 'GÉNESIS']);
    expect(result.words.every((word) => word.bible_reference.length > 0)).toBe(true);
  });

  it('acepta contenido nuevo cuando incluye una referencia revisada', () => {
    expect(normalizeHangmanWord({
      id: '4',
      word: 'LÁMPARA',
      hint: 'Imagen usada para describir la Palabra de Dios',
      category: 'Símbolo',
      difficulty: 'medium',
      bible_reference: 'Salmo 119:105',
    })?.bible_reference).toBe('Salmo 119:105');
  });

  it('rechaza registros nuevos incompletos o sin referencia', () => {
    const result = prepareHangmanWords([
      { id: '5', word: 'UNKNOWN', hint: 'An English clue', category: 'Concept' },
      { id: '6', word: 'VACÍO', hint: '', category: 'Concepto', bible_reference: 'Juan 1:1' },
    ]);

    expect(result.words).toEqual([]);
    expect(result.rejectedIds).toEqual(['5', '6']);
  });
});
