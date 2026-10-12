import type { ChurchAnnouncement } from './types';

// Keep an event visible through its final day in the church's timezone.
// General notices and recurring events need an explicit editorial expiry.
export function isAnnouncementRelevantForHome(announcement: ChurchAnnouncement, now = new Date()): boolean {
  const event = announcement.event;
  if (!event || event.is_recurring !== false) return true;
  const finalDate = event.end_date || event.start_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) return true;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  return finalDate >= today;
}
