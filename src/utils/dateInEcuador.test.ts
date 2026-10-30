import { describe, expect, it } from 'vitest';
import { ecuadorDateKey, ecuadorDayOfYear } from './dateInEcuador';

describe('dateInEcuador', () => {
  it('keeps the Ecuador calendar day after UTC midnight', () => {
    const justAfterUtcMidnight = new Date('2026-10-26T01:00:00.000Z');
    expect(ecuadorDateKey(justAfterUtcMidnight)).toBe('2026-10-25');
  });

  it('switches to the next Ecuador day at local midnight', () => {
    expect(ecuadorDateKey(new Date('2026-10-26T04:59:59.999Z'))).toBe('2026-10-25');
    expect(ecuadorDateKey(new Date('2026-10-26T05:00:00.000Z'))).toBe('2026-10-26');
  });

  it('calculates day of year from the Ecuador date', () => {
    expect(ecuadorDayOfYear(new Date('2026-10-26T01:00:00.000Z'))).toBe(298);
  });
});
