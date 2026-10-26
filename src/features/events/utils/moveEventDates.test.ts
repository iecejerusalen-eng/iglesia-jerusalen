import { describe, expect, it } from 'vitest';
import { moveEventDates } from './moveEventDates';

describe('moveEventDates', () => {
  it('moves a one-day event by one calendar day without timezone drift', () => {
    expect(moveEventDates('2026-10-25', '2026-10-25', '2026-10-26')).toEqual({
      start_date: '2026-10-26',
      end_date: '2026-10-26',
    });
  });

  it('preserves the length of a multi-day event when moving it backwards', () => {
    expect(moveEventDates('2026-10-25', '2026-10-27', '2026-10-20')).toEqual({
      start_date: '2026-10-20',
      end_date: '2026-10-22',
    });
  });

  it('uses the start date when the original event has no end date', () => {
    expect(moveEventDates('2026-10-25', null, '2026-10-28')).toEqual({
      start_date: '2026-10-28',
      end_date: '2026-10-28',
    });
  });
});
