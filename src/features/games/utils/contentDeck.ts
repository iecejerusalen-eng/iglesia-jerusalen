/**
 * Session-local shuffled decks for game content. Each ID is dealt once per cycle;
 * a new cycle is shuffled so repeated rounds do not restart on the same items.
 * No player data or score is written to storage.
 */
interface DeckState {
  signature: string;
  remaining: string[];
  last: string | null;
}

const memoryDecks = new Map<string, DeckState>();

export function drawContent<T>(
  items: T[],
  key: string,
  count: number,
  getId: (item: T) => string,
  random: () => number = Math.random,
): T[] {
  if (items.length === 0 || count <= 0) return [];
  const byId = new Map(items.map((item) => [getId(item), item]));
  const ids = [...byId.keys()];
  const signature = [...ids].sort().join('|');
  const storageKey = `game-content-deck:v1:${key}`;
  let deck: DeckState = memoryDecks.get(storageKey) ?? {
    signature,
    remaining: [],
    last: null,
  };

  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<typeof deck>;
      if (parsed.signature === signature && Array.isArray(parsed.remaining)) {
        deck = {
          signature,
          remaining: parsed.remaining.filter((id): id is string => typeof id === 'string' && byId.has(id)),
          last: typeof parsed.last === 'string' ? parsed.last : null,
        };
      }
    }
  } catch (error) {
    // Storage may be unavailable in private browsing; the in-memory draw still works.
    console.warn('No se pudo recuperar el mazo de contenido de la sesión; se barajará una copia nueva.', error);
  }
  if (deck.signature !== signature) deck = { signature, remaining: [], last: null };

  const draw: string[] = [];
  while (draw.length < Math.min(count, ids.length)) {
    if (deck.remaining.length === 0) {
      const nextCycle = shuffleIds(ids, random);
      if (nextCycle.length > 1 && nextCycle[0] === deck.last) {
        const different = nextCycle.findIndex((id) => id !== deck.last);
        [nextCycle[0], nextCycle[different]] = [nextCycle[different], nextCycle[0]];
      }
      deck.remaining = nextCycle;
    }
    const id = deck.remaining.shift();
    if (!id || draw.includes(id)) continue;
    draw.push(id);
    deck.last = id;
  }

  memoryDecks.set(storageKey, { ...deck, remaining: [...deck.remaining] });
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(deck));
  } catch (error) {
    // Continue without persistence when session storage is blocked or full.
    console.warn('No se pudo guardar el mazo de contenido de la sesión; la partida seguirá con este reparto.', error);
  }
  return draw.map((id) => byId.get(id)).filter((item): item is T => item !== undefined);
}

function shuffleIds(ids: string[], random: () => number): string[] {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
