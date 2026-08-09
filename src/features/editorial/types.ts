import type { LessonBlock } from '../../components/admin/BlockEditor';

export type EditorialOwnerType = 'church' | 'ministry' | 'study_program';
export type EditorialVisibility = 'public' | 'members' | 'password' | 'editors';
export type EditorialStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type EditorialDocumentType = 'page' | 'post';
export type EditorialEditorRole = 'owner' | 'editor' | 'author' | 'moderator';

export interface EditorialSpace {
  id: string;
  slug: string;
  name: string;
  description: string;
  owner_type: EditorialOwnerType;
  ministry_id: string | null;
  program_id: string | null;
  cover_image_url: string | null;
  accent_color: string;
  is_published?: boolean;
  allow_comments: boolean;
  created_at?: string;
}

export interface EditorialCategory {
  id: string;
  space_id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  order_index: number;
}

export interface EditorialDocumentSummary {
  id: string;
  parent_id: string | null;
  category_id: string | null;
  document_type: EditorialDocumentType;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  visibility: EditorialVisibility;
  is_locked: boolean;
  is_featured: boolean;
  published_at: string | null;
  depth: number;
  order_index: number;
}

export interface EditorialDocument extends EditorialDocumentSummary {
  content_blocks: LessonBlock[] | null;
  allow_comments: boolean;
  status?: EditorialStatus;
  scheduled_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  author_id?: string | null;
}

export interface EditorialSpaceFeed {
  space: EditorialSpace;
  categories: EditorialCategory[];
  documents: EditorialDocumentSummary[];
}

export interface EditorialDocumentResponse {
  is_locked: boolean;
  lock_reason: EditorialVisibility | null;
  document: EditorialDocument;
}

export interface EditorialEditor {
  space_id: string;
  user_id: string;
  editor_role: EditorialEditorRole;
  profiles?: { first_name: string | null; last_name: string | null; email: string | null; photo_url: string | null } | null;
}

