const ECUADOR_TIME_ZONE = 'America/Guayaquil';
const MILLISECONDS_PER_DAY = 86_400_000;

export function ecuadorDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: ECUADOR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function ecuadorDayOfYear(date = new Date()): number {
  const [year, month, day] = ecuadorDateKey(date).split('-').map(Number);
  const dayStart = Date.UTC(year, month - 1, day);
  const yearStart = Date.UTC(year, 0, 1);
  return Math.floor((dayStart - yearStart) / MILLISECONDS_PER_DAY) + 1;
}
