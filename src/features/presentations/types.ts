export type PresentationBlockType = 'text' | 'image' | 'video' | 'shape' | 'columns' | 'divider';

export interface PresentationBlock {
  id: string;
  type: PresentationBlockType;
  content?: string;
  url?: string;
  alt?: string;
  columns?: string[];
  background?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface PresentationSlideDocument {
  id: string;
  title: string;
  notes?: string;
  background?: string;
  blocks: PresentationBlock[];
}

export interface PresentationDocument {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  slides: PresentationSlideDocument[];
  theme: { accent?: string; font?: string };
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}
