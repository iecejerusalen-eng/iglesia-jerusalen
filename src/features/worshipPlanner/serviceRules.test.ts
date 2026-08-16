import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WORSHIP_RULES,
  generateWorshipServiceDrafts,
  getNthWeekdayOfMonth,
} from './serviceRules';

describe('worship service rules', () => {
  it('finds the first Sunday of a month', () => {
    expect(getNthWeekdayOfMonth(2026, 7, 0, 1)).toBe('2026-08-02');
  });

  it('finds the third Sunday of a month', () => {
    expect(getNthWeekdayOfMonth(2026, 7, 0, 3)).toBe('2026-08-16');
  });

  it('generates the configured Santa Cena and missions services', () => {
    const drafts = generateWorshipServiceDrafts('2026-08-01', '2026-08-31', DEFAULT_WORSHIP_RULES);
    expect(drafts.map((draft) => `${draft.serviceDate}:${draft.serviceType}`)).toEqual([
      '2026-08-02:santa_cena',
      '2026-08-16:misionero',
    ]);
  });

  it('does not create a fifth Sunday when the month has only four', () => {
    expect(getNthWeekdayOfMonth(2026, 1, 0, 5)).toBeNull();
  });
});
