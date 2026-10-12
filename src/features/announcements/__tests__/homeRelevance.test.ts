import { describe, expect, it } from 'vitest';
import { isAnnouncementRelevantForHome } from '../homeRelevance';
import type { ChurchAnnouncement } from '../types';

const notice = (event: ChurchAnnouncement['event']): ChurchAnnouncement => ({
  id: 'notice', title: 'Anuncio', summary: '', body: '', image_url: null,
  event_id: event?.id ?? null, status: 'published', is_featured: true,
  publish_at: '2026-08-01T00:00:00Z', expires_at: null, created_by: null,
  created_at: '', updated_at: '', event,
});
const event = { id: 'event', title: 'Actividad', start_date: '2026-09-05', end_date: '2026-09-05', start_time: null, end_time: null, is_recurring: false };

describe('Home announcement relevance', () => {
  it('excludes past one-off events, even when featured without an expiry', () => {
    expect(isAnnouncementRelevantForHome(notice(event), new Date('2026-10-11T15:00:00Z'))).toBe(false);
  });
  it('keeps general notices, recurring events and unknown recurrence', () => {
    const now = new Date('2026-10-11T15:00:00Z');
    expect(isAnnouncementRelevantForHome(notice(null), now)).toBe(true);
    expect(isAnnouncementRelevantForHome(notice({ ...event, is_recurring: true }), now)).toBe(true);
    expect(isAnnouncementRelevantForHome(notice({ ...event, is_recurring: undefined }), now)).toBe(true);
  });
  it('uses the last day of a multi-day event and Guayaquil midnight, regardless of viewer timezone', () => {
    const multiDay = notice({ ...event, end_date: '2026-10-11' });
    expect(isAnnouncementRelevantForHome(multiDay, new Date('2026-10-12T04:59:59Z'))).toBe(true);
    expect(isAnnouncementRelevantForHome(multiDay, new Date('2026-10-12T05:00:00Z'))).toBe(false);
  });
});
