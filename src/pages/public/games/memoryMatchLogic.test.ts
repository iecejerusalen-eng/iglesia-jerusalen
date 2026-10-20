import { describe, expect, it } from 'vitest';
import {
  awardFamilyPoint,
  buildMemoryCards,
  calculateMemoryScore,
  isMemoryMatch,
  nextMemoryPlayer,
  prepareMemoryPairs,
  type RawMemoryPair,
} from './memoryMatchLogic';

const pairs: RawMemoryPair[] = [
  { id: '1', pair_name: 'Noé', match_text: 'Construyó un arca', explanation: 'Dios le indicó a Noé que preparara un arca.', bible_reference: 'Génesis 6:14-22', difficulty: 'easy', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
  { id: '2', pair_name: 'Moisés', match_text: 'La zarza ardiente', explanation: 'Dios llamó a Moisés desde una zarza que ardía.', bible_reference: 'Éxodo 3:2-4', difficulty: 'easy', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
  { id: '3', pair_name: 'David', match_text: 'Venció a Goliat', explanation: 'David venció al filisteo con una piedra y una honda.', bible_reference: '1 Samuel 17:49-50', difficulty: 'easy', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
  { id: '4', pair_name: 'Jesús', match_text: 'Agua convertida en vino', explanation: 'La primera señal de Jesús en el Evangelio de Juan ocurrió en Caná.', bible_reference: 'Juan 2:1-11', difficulty: 'easy', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
  { id: '5', pair_name: 'Rut', match_text: 'Acompañó a Noemí', explanation: 'Rut decidió permanecer con Noemí y acompañarla a Belén.', bible_reference: 'Rut 1:16-17', difficulty: 'medium', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
  { id: '6', pair_name: 'Zaqueo', match_text: 'Subió a un sicómoro', explanation: 'Zaqueo subió a un árbol para poder ver a Jesús.', bible_reference: 'Lucas 19:1-5', difficulty: 'medium', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
  { id: '7', pair_name: 'Bezaleel', match_text: 'Diseñó objetos del tabernáculo', explanation: 'Dios capacitó a Bezaleel para trabajar en los objetos del tabernáculo.', bible_reference: 'Éxodo 31:1-5', difficulty: 'hard', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
  { id: '8', pair_name: 'Eutico', match_text: 'Cayó de una ventana mientras Pablo hablaba', explanation: 'Eutico cayó desde una ventana durante la enseñanza de Pablo y fue hallado vivo.', bible_reference: 'Hechos 20:7-12', difficulty: 'hard', image_url: '/image-a.png', match_image_url: '/image-b.png', card_label: 'Concepto', match_label: 'Relato', learning_question: '¿Qué enseña?', learning_options: ['Respuesta', 'Opción B', 'Opción C'], learning_answer: 'Respuesta' },
];

describe('memoryMatchLogic', () => {
  it('keeps only complete, distinct, uniquely identified pairs', () => {
    const prepared = prepareMemoryPairs([
      ...pairs,
      { ...pairs[0], id: 'incomplete', bible_reference: '' },
      { ...pairs[1], id: 'same-face', match_text: 'Moisés' },
      { ...pairs[2], id: '1' },
    ]);
    expect(prepared).toHaveLength(8);
  });

  it('deals 4, 6, or 8 semantic pairs according to difficulty', () => {
    const prepared = prepareMemoryPairs(pairs);
    const easyCards = buildMemoryCards(prepared, 'easy');
    expect(easyCards).toHaveLength(8);
    expect(easyCards.filter((card) => card.id === '1').map((card) => card.side).sort()).toEqual(['a', 'b']);
    expect(easyCards.find((card) => card.id === '1' && card.side === 'a')?.pair_name).not.toBe(
      easyCards.find((card) => card.id === '1' && card.side === 'b')?.match_text,
    );
    expect(buildMemoryCards(prepared, 'medium')).toHaveLength(12);
    expect(buildMemoryCards(prepared, 'hard')).toHaveLength(16);
  });

  it('does not start a level that lacks enough reviewed pairs', () => {
    expect(buildMemoryCards(prepareMemoryPairs(pairs.slice(0, 3)), 'easy')).toEqual([]);
  });

  it('awards a higher base score for a larger level and penalizes time and extra moves', () => {
    expect(calculateMemoryScore(0, 4, 8)).toBeGreaterThan(calculateMemoryScore(120, 20, 4));
    expect(calculateMemoryScore(120, 20, 4)).toBe(100);
  });

  it('keeps the turn after a match and passes after a miss', () => {
    expect(nextMemoryPlayer(1, 4, true)).toBe(1);
    expect(nextMemoryPlayer(1, 4, false)).toBe(2);
    expect(nextMemoryPlayer(3, 4, false)).toBe(0);
    expect(nextMemoryPlayer(0, 1, false)).toBe(0);
  });

  it('recognizes only opposite faces of the same pair', () => {
    expect(isMemoryMatch({ id: '1', side: 'a' }, { id: '1', side: 'b' })).toBe(true);
    expect(isMemoryMatch({ id: '1', side: 'a' }, { id: '1', side: 'a' })).toBe(false);
    expect(isMemoryMatch({ id: '1', side: 'a' }, { id: '2', side: 'b' })).toBe(false);
  });

  it('awards a family point only to the player who found the pair', () => {
    const scores = [2, 1, 0];
    expect(awardFamilyPoint(scores, 1)).toEqual([2, 2, 0]);
    expect(scores).toEqual([2, 1, 0]);
  });
});
