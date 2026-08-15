import { describe, expect, it } from 'vitest';
import { getInvalidChordTokens } from './songUtils';

describe('song bracket validation', () => {
  it('detects invalid bracket tokens', () => {
    expect(getInvalidChordTokens('[C]Santo\n[Coro]\n[G/B]SeÃ±or')).toEqual(['Coro']);
  });
});
