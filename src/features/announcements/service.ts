import { supabase } from '../../config/supabase';
import type { ChurchAnnouncement } from './types';

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
    location_name,
    is_public
  )
`;

export async function fetchPublicChurchAnnouncements(limit = 3): Promise<ChurchAnnouncement[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('church_announcements')
    .select(announcementSelect)
    .eq('status', 'published')
    .lte('publish_at', now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('is_featured', { ascending: false })
    .order('publish_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 12)));

  if (error) throw error;
  return (data as unknown as ChurchAnnouncement[] | null) ?? [];
}

export async function fetchChurchAnnouncements(): Promise<ChurchAnnouncement[]> {
  const { data, error } = await supabase
    .from('church_announcements')
    .select(announcementSelect)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as ChurchAnnouncement[] | null) ?? [];
}
