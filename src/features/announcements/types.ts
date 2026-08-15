export type ChurchAnnouncementStatus = 'draft' | 'published' | 'archived';

export interface AnnouncementEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  is_public?: boolean;
}

export interface ChurchAnnouncement {
  id: string;
  title: string;
  summary: string;
  body: string;
  image_url: string | null;
  event_id: string | null;
  status: ChurchAnnouncementStatus;
  is_featured: boolean;
  publish_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  event: AnnouncementEvent | null;
}

export type AnnouncementDraft = Pick<
  ChurchAnnouncement,
  'title' | 'summary' | 'body' | 'image_url' | 'event_id' | 'status' | 'is_featured' | 'publish_at' | 'expires_at'
>;
