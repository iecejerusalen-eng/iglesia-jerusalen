import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

export type PublicCourseAccess = 'enrolled' | 'pending' | 'approved' | 'rejected' | 'none';

export interface PublicSchoolCourse {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  duration: string | null;
  schedule: string | null;
  levelId: string | null;
  levelName: string | null;
  levelSortOrder: number;
  access: PublicCourseAccess;
}

export interface PublicCatalogSchool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  color: string;
  schoolType: 'age_based' | 'rank_based' | 'custom';
  sortOrder: number;
  courses: PublicSchoolCourse[];
}

interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  color: string | null;
  school_type: 'age_based' | 'rank_based' | 'custom';
  sort_order: number | null;
}

interface LevelRelation {
  name: string;
  sort_order: number | null;
}

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  duration: string | null;
  schedule: string | null;
  school_id: string | null;
  level_id: string | null;
  lms_levels: LevelRelation | LevelRelation[] | null;
}

interface EnrollmentRow {
  course_id: string;
}

interface EnrollmentRequestRow {
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
}

const schoolPriority = (school: Pick<SchoolRow, 'slug' | 'name' | 'sort_order'>) => {
  const identity = `${school.slug} ${school.name}`.toLocaleLowerCase('es');
  if (identity.includes('dominical')) return 0;
  if (identity.includes('cadete')) return 1;
  return 10 + (school.sort_order ?? 0);
};

function normalizeLevel(value: CourseRow['lms_levels']): LevelRelation | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function usePublicSchoolCatalog() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  const catalogQuery = useQuery({
    queryKey: ['public-lms-school-catalog', user?.id ?? 'guest'],
    queryFn: async (): Promise<PublicCatalogSchool[]> => {
      const [schoolsResult, coursesResult] = await Promise.all([
        supabase
          .from('lms_schools')
          .select('id, name, slug, description, cover_image_url, color, school_type, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('lms_courses')
          .select('id, title, description, cover_image_url, duration, schedule, school_id, level_id, lms_levels(name, sort_order)')
          .eq('is_published', true)
          .not('school_id', 'is', null)
          .order('created_at', { ascending: false }),
      ]);

      if (schoolsResult.error) throw schoolsResult.error;
      if (coursesResult.error) throw coursesResult.error;

      let enrollments: EnrollmentRow[] = [];
      let requests: EnrollmentRequestRow[] = [];

      if (user?.id) {
        const [enrollmentsResult, requestsResult] = await Promise.all([
          supabase
            .from('lms_enrollments')
            .select('course_id')
            .eq('user_id', user.id)
            .or('status.eq.active,status.is.null'),
          supabase
            .from('lms_enrollment_requests')
            .select('course_id, status')
            .eq('user_id', user.id),
        ]);

        if (enrollmentsResult.error) throw enrollmentsResult.error;
        if (requestsResult.error) throw requestsResult.error;
        enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[];
        requests = (requestsResult.data ?? []) as EnrollmentRequestRow[];
      }

      const enrolledCourseIds = new Set(enrollments.map(enrollment => enrollment.course_id));
      const requestByCourse = new Map(requests.map(request => [request.course_id, request.status]));
      const courses = (coursesResult.data ?? []) as CourseRow[];

      return ((schoolsResult.data ?? []) as SchoolRow[])
        .sort((left, right) => schoolPriority(left) - schoolPriority(right) || left.name.localeCompare(right.name, 'es'))
        .map((school): PublicCatalogSchool => ({
          id: school.id,
          name: school.name,
          slug: school.slug,
          description: school.description,
          coverImageUrl: school.cover_image_url,
          color: school.color || '#4F46E5',
          schoolType: school.school_type,
          sortOrder: school.sort_order ?? 0,
          courses: courses
            .filter(course => course.school_id === school.id)
            .map((course): PublicSchoolCourse => {
              const level = normalizeLevel(course.lms_levels);
              const requestStatus = requestByCourse.get(course.id);
              return {
                id: course.id,
                title: course.title,
                description: course.description,
                coverImageUrl: course.cover_image_url,
                duration: course.duration,
                schedule: course.schedule,
                levelId: course.level_id,
                levelName: level?.name ?? null,
                levelSortOrder: level?.sort_order ?? Number.MAX_SAFE_INTEGER,
                access: enrolledCourseIds.has(course.id) ? 'enrolled' : requestStatus ?? 'none',
              };
            })
            .sort((left, right) => left.levelSortOrder - right.levelSortOrder || left.title.localeCompare(right.title, 'es')),
        }));
    },
  });

  const requestEnrollment = useMutation({
    mutationFn: async ({ courseId, notes }: { courseId: string; notes?: string }) => {
      if (!user?.id) throw new Error('Debes iniciar sesión para solicitar una matrícula.');
      const { error } = await supabase.rpc('request_lms_course_enrollment', {
        p_course_id: courseId,
        p_notes: notes?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['public-lms-school-catalog', user?.id ?? 'guest'] });
      await queryClient.invalidateQueries({ queryKey: ['lms-enrollment-requests'] });
    },
  });

  return {
    schools: catalogQuery.data ?? [],
    isLoading: catalogQuery.isLoading,
    error: catalogQuery.error,
    refetch: catalogQuery.refetch,
    requestEnrollment,
    isAuthenticated: Boolean(user?.id),
  };
}
