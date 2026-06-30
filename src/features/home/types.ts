export interface BirthdayMember {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  photo_url?: string | null;
  ageTurning: number;
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
