import { describe, expect, it } from 'vitest';
import {
  calculateAge,
  isValidChatContent,
  MAX_BROADCAST_RECIPIENTS,
  uniqueRecipientIds,
} from './chatRules';

describe('chat rules', () => {
  it('does not classify missing, invalid, or future birth dates as youth', () => {
    const today = new Date('2026-08-10T12:00:00Z');
    expect(calculateAge(null, today)).toBeNull();
    expect(calculateAge('invalid', today)).toBeNull();
    expect(calculateAge('2030-01-01', today)).toBeNull();
  });

  it('calculates age around the birthday boundary', () => {
    const today = new Date('2026-08-10T12:00:00Z');
    expect(calculateAge('1996-08-10', today)).toBe(30);
    expect(calculateAge('1996-08-11', today)).toBe(29);
  });

  it('accepts only trimmed messages between 1 and 1000 characters', () => {
    expect(isValidChatContent('   ')).toBe(false);
    expect(isValidChatContent('Hola 🙏')).toBe(true);
    expect(isValidChatContent('a'.repeat(1001))).toBe(false);
  });

  it('deduplicates recipients before applying the broadcast limit', () => {
    const ids = Array.from({ length: MAX_BROADCAST_RECIPIENTS }, (_, index) => `profile-${index}`);
    expect(uniqueRecipientIds([...ids, ids[0], ''])).toHaveLength(MAX_BROADCAST_RECIPIENTS);
  });
});
