export interface DBPageSection {
  id: string;
  page: string;
  section: string;
  name: string;
  title: string;
  subtitle: string;
  content_blocks: Record<string, unknown>[];
  order_index: number;
  section_type: string;
  cover_image_url?: string;
}

export interface GallerySlide {
  id: string;
  url: string;
  caption?: string;
  category?: string;
  [key: string]: unknown;
}

export interface PageSectionMetadata {
  id: string;
  name: string;
  defaultTitle: string;
  defaultSubtitle: string;
  description: string;
}
