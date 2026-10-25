import type { Event as DbEvent } from '../../../types';
import { formatEventTime } from './eventPresentation';

function toGoogleCalendarDate(date: string, time: string | null): string {
  if (!time) return date.replaceAll('-', '');
  const normalizedTime = time.replaceAll(':', '').slice(0, 4);
  return `${date.replaceAll('-', '')}T${normalizedTime}00`;
}

function addCalendarDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  return nextDay.toISOString().slice(0, 10);
}

export function buildGoogleCalendarUrl(event: Pick<DbEvent, 'title' | 'start_date' | 'end_date' | 'start_time' | 'end_time' | 'description' | 'location_name'>): string {
  const hasTimedRange = Boolean(event.start_time && event.end_time);
  const start = toGoogleCalendarDate(event.start_date, hasTimedRange ? event.start_time : null);
  const calendarEndDate = hasTimedRange ? event.end_date : addCalendarDay(event.end_date);
  const end = toGoogleCalendarDate(calendarEndDate, hasTimedRange ? event.end_time : null);
  const details = [
    event.description,
    event.start_time && !hasTimedRange ? `Hora de inicio: ${formatEventTime(event.start_time, null)}.` : null,
  ].filter(Boolean).join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details,
    location: event.location_name || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
