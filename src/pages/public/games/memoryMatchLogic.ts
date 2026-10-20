export type MemoryDifficulty = 'easy' | 'medium' | 'hard';
export type MemoryMode = 'solo' | 'family';

export interface MemoryPair {
  id: string;
  pair_name: string;
  image_url: string | null;
  match_image_url: string | null;
  card_label: string;
  match_label: string;
  match_text: string;
  explanation: string;
  bible_reference: string;
  learning_question: string;
  learning_options: string[];
  learning_answer: string;
  difficulty: MemoryDifficulty;
}

export interface MemoryCard extends MemoryPair {
  side: 'a' | 'b';
  uniqueId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface RawMemoryPair {
  id: unknown;
  pair_name: unknown;
  image_url: unknown;
  match_image_url: unknown;
  card_label: unknown;
  match_label: unknown;
  match_text: unknown;
  explanation: unknown;
  bible_reference: unknown;
  learning_question: unknown;
  learning_options: unknown;
  learning_answer: unknown;
  difficulty: unknown;
}

export const DIFFICULTY_CONFIG: Record<MemoryDifficulty, { label: string; pairs: number; points: number }> = {
  easy: { label: 'Inicial', pairs: 4, points: 100 },
  medium: { label: 'Intermedio', pairs: 6, points: 150 },
  hard: { label: 'Desafío', pairs: 8, points: 200 },
};

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

export function prepareMemoryPairs(rows: RawMemoryPair[]): MemoryPair[] {
  const pairs: MemoryPair[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    const id = asText(row.id);
    const pairName = asText(row.pair_name);
    const matchText = asText(row.match_text);
    const explanation = asText(row.explanation);
    const bibleReference = asText(row.bible_reference);
    const difficulty = row.difficulty;
    const learningQuestion = asText(row.learning_question);
    const learningAnswer = asText(row.learning_answer);
    const options = Array.isArray(row.learning_options)
      ? row.learning_options.filter((option): option is string => typeof option === 'string' && Boolean(option.trim()))
      : [];
    if (
      !id || !pairName || !matchText || !explanation || !bibleReference || !learningQuestion || !learningAnswer ||
      !asText(row.image_url) || !asText(row.match_image_url) || options.length < 3 || !options.includes(learningAnswer) ||
      !['easy', 'medium', 'hard'].includes(String(difficulty)) ||
      pairName.toLocaleLowerCase('es') === matchText.toLocaleLowerCase('es') ||
      seen.has(id)
    ) return;

    seen.add(id);
    pairs.push({
      id,
      pair_name: pairName,
      image_url: asText(row.image_url),
      match_image_url: asText(row.match_image_url),
      card_label: asText(row.card_label) ?? 'Concepto',
      match_label: asText(row.match_label) ?? 'Relato',
      match_text: matchText,
      explanation,
      bible_reference: bibleReference,
      learning_question: learningQuestion,
      learning_options: options,
      learning_answer: learningAnswer,
      difficulty: difficulty as MemoryDifficulty,
    });
  });

  return pairs;
}

export function buildMemoryCards(
  pairs: MemoryPair[],
  difficulty: MemoryDifficulty,
  random: () => number = Math.random,
  selectedIds?: string[],
): MemoryCard[] {
  const size = DIFFICULTY_CONFIG[difficulty].pairs;
  const eligible = pairs.filter((pair) => {
    if (difficulty === 'easy') return pair.difficulty === 'easy';
    if (difficulty === 'medium') return pair.difficulty !== 'hard';
    return true;
  });
  if (eligible.length < size) return [];

  const selected = selectedIds
    ? selectedIds.map((id) => eligible.find((pair) => pair.id === id)).filter((pair): pair is MemoryPair => Boolean(pair))
    : shuffle(eligible, random).slice(0, size);
  if (selected.length < size) return [];
  const shuffledPairs = selected.slice(0, size);
  const cards = shuffledPairs.flatMap((pair): MemoryCard[] => [
    { ...pair, side: 'a', uniqueId: `${pair.id}-a`, isFlipped: false, isMatched: false },
    { ...pair, side: 'b', uniqueId: `${pair.id}-b`, isFlipped: false, isMatched: false },
  ]);
  return shuffle(cards, random);
}

export function calculateMemoryScore(elapsedSeconds: number, moves: number, pairCount: number): number {
  const baseScore = pairCount * 125;
  return Math.max(100, baseScore - Math.max(0, elapsedSeconds) * 2 - Math.max(0, moves - pairCount) * 10);
}

export function isMemoryMatch(first?: Pick<MemoryCard, 'id' | 'side'>, second?: Pick<MemoryCard, 'id' | 'side'>): boolean {
  return Boolean(first && second && first.id === second.id && first.side !== second.side);
}

export function awardFamilyPoint(scores: number[], activePlayer: number): number[] {
  return scores.map((score, index) => index === activePlayer ? score + 1 : score);
}

export function nextMemoryPlayer(activePlayer: number, playerCount: number, foundPair: boolean): number {
  if (playerCount < 2 || foundPair) return activePlayer;
  return (activePlayer + 1) % playerCount;
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
