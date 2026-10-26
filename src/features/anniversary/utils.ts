const PROMO_START = Date.parse('2026-10-24T05:00:00.000Z');
export const ANNIVERSARY_PROMO_END = Date.parse('2026-10-26T05:00:00.000Z');

export function isAnniversaryPromoActive(now: Date = new Date()): boolean {
  const timestamp = now.getTime();
  return timestamp >= PROMO_START && timestamp < ANNIVERSARY_PROMO_END;
}
