import type { LucideIcon } from 'lucide-react';

export type SearchItemSource = 
  | 'static_route' 
  | 'admin_module'
  | 'sermon' 
  | 'course' 
  | 'editorial_space'
  | 'ministry' 
  | 'song' 
  | 'event' 
  | 'announcement' 
  | 'schedule' 
  | 'product' 
  | 'changelog' 
  | 'dynamic_form'
  | 'custom_link';

export interface SearchIndexItem {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  category: string;
  keywords: string[];
  icon?: LucideIcon | string;
  badge?: string;
  isExternal?: boolean;
  source: SearchItemSource;
  meta?: Record<string, unknown>;
}

export interface CustomSearchLink {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  keywords?: string[];
  category?: string;
  icon?: string;
  badge?: string;
  is_external?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface ParsedBibleReference {
  bookName: string;
  bookId: string;
  chapter: number;
  verses: string;
}

export interface SearchAggregatedResults {
  // Direct shortcuts & Bible reference
  bibleRef: ParsedBibleReference | null;
  
  // Dynamic collections
  sermons: SearchIndexItem[];
  courses: SearchIndexItem[];
  editorialSpaces: SearchIndexItem[];
  dynamicForms: SearchIndexItem[];
  songs: SearchIndexItem[];
  events: SearchIndexItem[];
  ministries: SearchIndexItem[];
  announcements: SearchIndexItem[];
  changelog: SearchIndexItem[];
  schedules: SearchIndexItem[];
  products: SearchIndexItem[];
  
  // Navigation & Configured
  sitePages: SearchIndexItem[];
  adminModules: SearchIndexItem[];
  customLinks: SearchIndexItem[];
}
