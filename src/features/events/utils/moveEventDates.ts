const MILLISECONDS_PER_DAY = 86_400_000;

/** Moves an event while preserving its calendar-day duration in UTC date-only arithmetic. */
export function moveEventDates(startDate: string, endDate: string | null, targetDate: string) {
  const sourceStart = new Date(`${startDate}T00:00:00Z`);
  const destinationStart = new Date(`${targetDate}T00:00:00Z`);
  const dayOffset = Math.round((destinationStart.getTime() - sourceStart.getTime()) / MILLISECONDS_PER_DAY);
  const nextEnd = new Date(`${endDate || startDate}T00:00:00Z`);
  nextEnd.setUTCDate(nextEnd.getUTCDate() + dayOffset);

  return { start_date: targetDate, end_date: nextEnd.toISOString().slice(0, 10) };
}
