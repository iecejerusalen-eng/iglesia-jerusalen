import type { Event as DbEvent } from '../../../types';

export type EventStatus = 'today' | 'upcoming' | 'past';

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-EC', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-EC', {
  weekday: 'short',
});

const SHORT_MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatEventDateRange(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate || startDate);

  if (startDate === endDate || !endDate) {
    return MONTH_FORMATTER.format(start);
  }

  return `${MONTH_FORMATTER.format(start)} · ${MONTH_FORMATTER.format(end)}`;
}

export function formatEventTime(startTime: string | null, endTime?: string | null): string {
  if (!startTime) return 'Horario por confirmar';

  const toDisplayTime = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return new Intl.DateTimeFormat('es-EC', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(2000, 0, 1, hours, minutes));
  };

  return endTime
    ? `${toDisplayTime(startTime)} – ${toDisplayTime(endTime)}`
    : toDisplayTime(startTime);
}

export function formatEventDayBadge(date: string): { day: string; month: string; weekday: string } {
  const parsed = parseLocalDate(date);
  return {
    day: String(parsed.getDate()).padStart(2, '0'),
    month: SHORT_MONTHS[parsed.getMonth()],
    weekday: WEEKDAY_FORMATTER.format(parsed).replace('.', '').toUpperCase(),
  };
}

export function eventOccursOnDate(event: DbEvent, date: Date): boolean {
  const dateKey = getLocalDateKey(date);
  return event.start_date <= dateKey && event.end_date >= dateKey;
}

export function getEventStatus(event: DbEvent, now = new Date()): EventStatus {
  const today = getLocalDateKey(now);
  if (event.start_date <= today && event.end_date >= today) return 'today';
  if (event.start_date > today) return 'upcoming';
  return 'past';
}

export function compareEventsChronologically(first: DbEvent, second: DbEvent): number {
  const dateComparison = first.start_date.localeCompare(second.start_date);
  if (dateComparison !== 0) return dateComparison;
  return (first.start_time || '23:59').localeCompare(second.start_time || '23:59');
}
