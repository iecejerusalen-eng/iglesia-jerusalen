import { describe, expect, it } from 'vitest';
import { isAnniversaryPromoActive } from './utils';

describe('isAnniversaryPromoActive', () => {
  it('starts at midnight on October 24 in Ecuador', () => {
    expect(isAnniversaryPromoActive(new Date('2026-10-24T04:59:59.999Z'))).toBe(false);
    expect(isAnniversaryPromoActive(new Date('2026-10-24T05:00:00.000Z'))).toBe(true);
  });

  it('ends at midnight after October 25 in Ecuador', () => {
    expect(isAnniversaryPromoActive(new Date('2026-10-26T04:59:59.999Z'))).toBe(true);
    expect(isAnniversaryPromoActive(new Date('2026-10-26T05:00:00.000Z'))).toBe(false);
  });
});
