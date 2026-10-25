import { describe, expect, it } from 'vitest';
import { buildGoogleCalendarUrl } from './googleCalendar';

describe('buildGoogleCalendarUrl', () => {
  const event = {
    title: 'Aniversario Jerusalén',
    start_date: '2026-10-25',
    end_date: '2026-10-25',
    start_time: '09:00',
    end_time: null,
    description: 'Preludio a las 08:45. Culto a las 09:00.',
    location_name: null,
  };

  it('uses a full-day calendar entry when the event has no confirmed end time', () => {
    const url = new URL(buildGoogleCalendarUrl(event));
    expect(url.searchParams.get('dates')).toBe('20261025/20261026');
    expect(url.searchParams.get('details')).toContain('Preludio a las 08:45. Culto a las 09:00.');
    expect(url.searchParams.get('details')).toMatch(/Hora de inicio:.*9:00/);
  });

  it('keeps an exact timed interval when both start and end are confirmed', () => {
    const url = new URL(buildGoogleCalendarUrl({ ...event, start_time: '09:00', end_time: '10:30' }));
    expect(url.searchParams.get('dates')).toBe('20261025T090000/20261025T103000');
  });
});
