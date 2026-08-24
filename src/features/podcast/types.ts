export type AudioSourceType = 'upload' | 'file' | 'url' | 'embed';

export interface AudioChapter {
  id: string;
  title: string;
  seconds: number;
}

export interface AISermonSummary {
  executive_summary?: string;
  key_points?: string[];
  central_verse?: string;
  practical_application?: string;
}

export interface PodcastShow {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  language?: string;
  itunes_category?: string;
  itunes_subcategory?: string;
  author?: string;
  email?: string;
  website_url?: string;
  spotify_url?: string;
  apple_podcasts_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PodcastSeries {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  sort_order?: number;
  created_at?: string;
}

export interface PodcastEpisode {
  id: string;
  show_id?: string;
  series_id?: string;
  title: string;
  description?: string;
  show_notes?: string;
  audio_url: string;
  audio_source_type: AudioSourceType;
  audio_duration_seconds?: number;
  cover_image_url?: string;
  transcript?: string;
  ai_summary?: AISermonSummary;
  chapters?: AudioChapter[];
  season_number?: number;
  episode_number?: number;
  status: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields for UI convenience
  series?: PodcastSeries;
}
