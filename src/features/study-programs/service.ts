import { supabase } from '../../config/supabase';
import { openDB } from 'idb';
import type { LessonBlock } from '../../components/admin/BlockEditor';
import type { ProgramCatalogResult, StudyCohort, StudyProgram, StudyProgramDetail, StudyProgramLesson, StudyProgramSection } from './types';

interface DatabaseErrorLike { code?: string; message?: string }

const isMissingStudySchema = (error: DatabaseErrorLike | null): boolean =>
  Boolean(error && (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('study_programs')));

const slugify = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const safeBlocks = (value: unknown): LessonBlock[] => {
  if (Array.isArray(value)) return value as LessonBlock[];
  if (typeof value !== 'string' || value.trim() === '') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as LessonBlock[];
  } catch (error: unknown) {
    console.warn('El contenido heredado no usa JSON por bloques; se mostrará como HTML.', error);
  }
  return [{ id: `legacy-${slugify(value.slice(0, 32)) || 'content'}`, type: 'html', html: value }];
};

const countRelations = (value: unknown): number => Array.isArray(value) ? value.length : 0;

const offlineDatabase = typeof window === 'undefined' ? null : openDB('jerusalem-study-programs', 1, {
  upgrade(database) {
    if (!database.objectStoreNames.contains('programs')) database.createObjectStore('programs', { keyPath: 'id' });
  },
});

async function cacheOfflineProgram(program: StudyProgramDetail): Promise<void> {
  if (!offlineDatabase || !program.offline_enabled) return;
  const database = await offlineDatabase;
  await database.put('programs', program);
}

async function readOfflineProgram(identifier: string): Promise<StudyProgramDetail | null> {
  if (!offlineDatabase) return null;
  const database = await offlineDatabase;
  const all = await database.getAll('programs') as StudyProgramDetail[];
  return all.find((program) => program.id === identifier || program.slug === identifier) ?? null;
}

export async function fetchProgramCatalog(includeDrafts = false): Promise<ProgramCatalogResult> {
  let query = supabase
    .from('study_programs')
    .select('*, study_program_sections(id, study_program_lessons(id)), study_cohorts(id)')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false });
  if (!includeDrafts) query = query.eq('status', 'published');

  const { data, error } = await query;
  if (!error) {
    const programs = (data ?? []).map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags : [],
      lesson_count: Array.isArray(row.study_program_sections)
        ? row.study_program_sections.reduce((total: number, section: { study_program_lessons?: unknown }) => total + countRelations(section.study_program_lessons), 0)
        : 0,
      cohort_count: countRelations(row.study_cohorts),
      source: 'study_programs' as const,
    })) as StudyProgram[];
    return { programs, compatibilityMode: false };
  }
  if (!isMissingStudySchema(error)) throw error;

  const [resourcesResult, studiesResult] = await Promise.all([
    supabase.from('open_resources').select('*, open_sections(id, open_activities(id))').eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('studies').select('*').eq('is_published', true).order('created_at', { ascending: false }),
  ]);
  if (resourcesResult.error) throw resourcesResult.error;
  if (studiesResult.error) throw studiesResult.error;

  const openPrograms: StudyProgram[] = (resourcesResult.data ?? []).map((row) => ({
    id: row.id,
    slug: `${slugify(row.title)}-${row.id.slice(0, 8)}`,
    title: row.title,
    summary: row.description ?? '',
    description: row.description ?? '',
    cover_image_url: row.cover_image_url,
    program_type: 'self_guided',
    modality: 'online',
    access_type: 'public',
    audience: 'Todos',
    category: 'General',
    tags: [],
    duration_label: null,
    difficulty: 'inicial',
    requires_facilitator: false,
    allows_guest_progress: true,
    offline_enabled: false,
    is_featured: false,
    status: 'published',
    published_at: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lesson_count: Array.isArray(row.open_sections)
      ? row.open_sections.reduce((total: number, section: { open_activities?: unknown }) => total + countRelations(section.open_activities), 0)
      : 0,
    cohort_count: 0,
    source: 'open_resources',
  }));

  const downloads: StudyProgram[] = (studiesResult.data ?? []).map((row) => ({
    id: row.id,
    slug: `${slugify(row.title)}-${row.id.slice(0, 8)}`,
    title: row.title,
    summary: row.description ?? '',
    description: row.description ?? '',
    cover_image_url: row.cover_image_url,
    program_type: 'downloadable',
    modality: 'offline_package',
    access_type: 'public',
    audience: row.category,
    category: row.category,
    tags: [],
    duration_label: null,
    difficulty: 'inicial',
    requires_facilitator: false,
    allows_guest_progress: false,
    offline_enabled: true,
    is_featured: false,
    status: 'published',
    published_at: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lesson_count: 1,
    cohort_count: 0,
    source: 'studies',
  }));

  return { programs: [...openPrograms, ...downloads], compatibilityMode: true };
}

export async function fetchProgramDetail(identifier: string): Promise<StudyProgramDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
  let programQuery = supabase
    .from('study_programs')
    .select('*, study_program_sections(*, study_program_lessons(*)), study_cohorts(id, program_id, name, description, status, capacity, starts_on, ends_on, timezone, schedule_text, meeting_provider, registration_deadline)');
  programQuery = isUuid ? programQuery.eq('id', identifier) : programQuery.eq('slug', identifier);
  const { data, error } = await programQuery.maybeSingle();

  if (!error && data) {
    const sections: StudyProgramSection[] = (data.study_program_sections ?? [])
      .map((section: StudyProgramSection & { study_program_lessons?: StudyProgramLesson[] }) => ({
        ...section,
        lessons: (section.study_program_lessons ?? []).map((lesson) => ({ ...lesson, content_blocks: safeBlocks(lesson.content_blocks) }))
          .sort((a, b) => a.order_index - b.order_index),
      }))
      .sort((a: StudyProgramSection, b: StudyProgramSection) => a.order_index - b.order_index);
    const detail = {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
      sections,
      cohorts: (data.study_cohorts ?? []) as StudyCohort[],
      lesson_count: sections.reduce((total, section) => total + section.lessons.length, 0),
      cohort_count: countRelations(data.study_cohorts),
      source: 'study_programs',
    } as StudyProgramDetail;
    await cacheOfflineProgram(detail);
    return detail;
  }
  if (error && !isMissingStudySchema(error)) {
    const cached = await readOfflineProgram(identifier);
    if (cached) return cached;
    throw error;
  }

  if (!isUuid) return null;
  const { data: resource, error: resourceError } = await supabase
    .from('open_resources')
    .select('*, open_sections(*, open_activities(*))')
    .eq('id', identifier)
    .eq('is_published', true)
    .maybeSingle();
  if (resourceError) throw resourceError;
  if (!resource) return null;

  const sections: StudyProgramSection[] = (resource.open_sections ?? [])
    .map((section: { id: string; resource_id: string; title: string; description: string | null; order_index: number; open_activities?: Array<{ id: string; section_id: string; title: string; type: string; content: string | null; order_index: number }> }) => ({
      id: section.id,
      program_id: section.resource_id,
      title: section.title,
      description: section.description ?? '',
      order_index: section.order_index,
      is_published: true,
      lessons: (section.open_activities ?? []).map((activity) => ({
        id: activity.id,
        section_id: activity.section_id,
        title: activity.title,
        summary: '',
        lesson_type: activity.type === 'video_link' ? 'activity' as const : 'lesson' as const,
        content_blocks: safeBlocks(activity.content),
        estimated_minutes: null,
        order_index: activity.order_index,
        is_preview: true,
        is_published: true,
      })).sort((a, b) => a.order_index - b.order_index),
    })).sort((a: StudyProgramSection, b: StudyProgramSection) => a.order_index - b.order_index);

  return {
    id: resource.id,
    slug: `${slugify(resource.title)}-${resource.id.slice(0, 8)}`,
    title: resource.title,
    summary: resource.description ?? '',
    description: resource.description ?? '',
    cover_image_url: resource.cover_image_url,
    program_type: 'self_guided', modality: 'online', access_type: 'public', audience: 'Todos', category: 'General', tags: [],
    duration_label: null, difficulty: 'inicial', requires_facilitator: false, allows_guest_progress: true, offline_enabled: false,
    is_featured: false, status: 'published', published_at: resource.created_at, created_at: resource.created_at, updated_at: resource.updated_at,
    lesson_count: sections.reduce((total, section) => total + section.lessons.length, 0), cohort_count: 0, source: 'open_resources', sections, cohorts: [],
  };
}
