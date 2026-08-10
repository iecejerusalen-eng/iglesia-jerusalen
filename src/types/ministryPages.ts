import type { LessonBlock } from '../components/admin/BlockEditor';

export type MinistryPageStatus = 'draft' | 'published';

export interface MinistryGalleryItem {
  id: string;
  url: string;
  alt: string;
  caption: string;
}

export interface MinistryPage {
  id: string;
  ministry_id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  icon: string;
  depth: number;
  sort_order: number;
  status: MinistryPageStatus;
  is_password_protected: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MinistryPageContent {
  content_blocks: LessonBlock[];
  gallery: MinistryGalleryItem[];
  updated_at: string | null;
}

export interface MinistryPageWithContent extends MinistryPage {
  content: MinistryPageContent;
}

export const emptyMinistryPageContent = (): MinistryPageContent => ({
  content_blocks: [],
  gallery: [],
  updated_at: null,
});
