import { describe, expect, it } from 'vitest';
import type { Event as DbEvent } from '../../../types';
import {
  eventOccursOnDate,
  formatEventTime,
  getEventStatus,
  getLocalDateKey,
  parseLocalDate,
} from './eventPresentation';

const baseEvent: DbEvent = {
  id: 'event-1',
  title: 'Culto especial',
  description: null,
  start_date: '2026-08-02',
  end_date: '2026-08-04',
  start_time: '19:00',
  end_time: '21:00',
  is_recurring: false,
  ministry_id: null,
  leaders_in_charge: [],
  created_at: '2026-08-01T00:00:00Z',
};

describe('eventPresentation', () => {
  it('parses database dates without shifting the local calendar day', () => {
    const date = parseLocalDate('2026-08-02');
    expect(getLocalDateKey(date)).toBe('2026-08-02');
  });

  it('detects every date inside a multi-day event', () => {
    expect(eventOccursOnDate(baseEvent, new Date(2026, 7, 3))).toBe(true);
    expect(eventOccursOnDate(baseEvent, new Date(2026, 7, 5))).toBe(false);
  });

  it('classifies current, future and past events', () => {
    expect(getEventStatus(baseEvent, new Date(2026, 7, 3))).toBe('today');
    expect(getEventStatus(baseEvent, new Date(2026, 7, 1))).toBe('upcoming');
    expect(getEventStatus(baseEvent, new Date(2026, 7, 5))).toBe('past');
  });

  it('formats event hours and supports missing schedules', () => {
    expect(formatEventTime(null)).toBe('Horario por confirmar');
    expect(formatEventTime('19:00', '21:00')).toContain('–');
  });
});
