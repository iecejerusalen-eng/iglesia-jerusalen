export interface BirthdayMember {
  id: string;
  first_name: string;
  last_name: string;
  birth_month: number;
  birth_day: number;
  photo_url?: string | null;
  ministry_name?: string | null;
  dedicated_verse?: string | null;
}

export interface PageSection {
  id: string;
  page?: string;
  section?: string;
  section_type: string;
  name: string;
  title: string | null;
  subtitle: string | null;
  content_blocks?: any;
  order_index?: number;
  cover_image_url?: string | null;
  updated_at?: string;
}
