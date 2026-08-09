import type { LessonBlock } from '../../components/admin/BlockEditor';

export type StudyProgramType = 'community_group' | 'self_guided' | 'facilitated' | 'downloadable';
export type StudyProgramModality = 'online' | 'in_person' | 'hybrid' | 'offline_package';
export type StudyProgramAccess = 'public' | 'account' | 'approval' | 'invitation';
export type StudyProgramStatus = 'draft' | 'published' | 'archived';

export interface StudyProgram {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  cover_image_url: string | null;
  program_type: StudyProgramType;
  modality: StudyProgramModality;
  access_type: StudyProgramAccess;
  audience: string;
  category: string;
  tags: string[];
  duration_label: string | null;
  difficulty: 'inicial' | 'intermedio' | 'avanzado';
  requires_facilitator: boolean;
  allows_guest_progress: boolean;
  offline_enabled: boolean;
  is_featured: boolean;
  status: StudyProgramStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  lesson_count?: number;
  cohort_count?: number;
  source?: 'study_programs' | 'open_resources' | 'studies';
}

export interface StudyProgramSection {
  id: string;
  program_id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  lessons: StudyProgramLesson[];
}

export interface StudyProgramLesson {
  id: string;
  section_id: string;
  title: string;
  summary: string;
  lesson_type: 'lesson' | 'devotional' | 'reading' | 'activity' | 'meeting' | 'download';
  content_blocks: LessonBlock[];
  estimated_minutes: number | null;
  order_index: number;
  is_preview: boolean;
  is_published: boolean;
}

export interface StudyCohort {
  id: string;
  program_id: string;
  name: string;
  description: string;
  status: 'planned' | 'open' | 'active' | 'completed' | 'cancelled';
  capacity: number | null;
  starts_on: string | null;
  ends_on: string | null;
  timezone: string;
  schedule_text: string | null;
  meeting_provider: 'google_meet' | 'zoom' | 'teams' | 'other' | null;
  registration_deadline: string | null;
}

export interface StudyMembership {
  id: string;
  program_id: string;
  cohort_id: string | null;
  user_id: string;
  member_role: 'director' | 'editor' | 'facilitator' | 'moderator' | 'analyst' | 'participant';
  status: 'pending' | 'active' | 'declined' | 'completed' | 'withdrawn';
  joined_at: string | null;
  profiles?: { first_name: string | null; last_name: string | null; email: string | null } | null;
}

export interface StudyProgramDetail extends StudyProgram {
  sections: StudyProgramSection[];
  cohorts: StudyCohort[];
}

export interface ProgramCatalogResult {
  programs: StudyProgram[];
  compatibilityMode: boolean;
}
