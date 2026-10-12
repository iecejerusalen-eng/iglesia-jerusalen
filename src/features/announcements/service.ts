import { supabase } from '../../config/supabase';
import type { ChurchAnnouncement } from './types';
import { isAnnouncementRelevantForHome } from './homeRelevance';

const announcementSelect = `
  id,
  title,
  summary,
  body,
  image_url,
  event_id,
  status,
  is_featured,
  publish_at,
  expires_at,
  created_by,
  created_at,
  updated_at,
  event:events(
    id,
    title,
    start_date,
    end_date,
    start_time,
    end_time,
    is_recurring,
    is_public
  )
`;

export async function fetchPublicChurchAnnouncements(
  limit = 3,
  options: { excludePastEvents?: boolean } = {},
): Promise<ChurchAnnouncement[]> {
  const checkedAt = new Date();
  const now = checkedAt.toISOString();
  const maxItems = Math.max(1, Math.min(limit, 12));
  const pageSize = options.excludePastEvents ? 50 : maxItems;
  const items: ChurchAnnouncement[] = [];
  // Filter before applying the display limit, so old featured notices cannot
  // displace a current announcement further down the feed.
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('church_announcements')
      .select(announcementSelect)
      .eq('status', 'published')
      .lte('publish_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_featured', { ascending: false })
      .order('publish_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    const rows = (data as unknown as ChurchAnnouncement[] | null) ?? [];
    items.push(...rows.filter((row) => !options.excludePastEvents || isAnnouncementRelevantForHome(row, checkedAt)));
    if (items.length >= maxItems || rows.length < pageSize) return items.slice(0, maxItems);
  }
}

export async function fetchChurchAnnouncements(): Promise<ChurchAnnouncement[]> {
  const { data, error } = await supabase
    .from('church_announcements')
    .select(announcementSelect)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as ChurchAnnouncement[] | null) ?? [];
}
