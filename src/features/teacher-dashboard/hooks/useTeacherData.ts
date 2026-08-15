import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

interface MemberDetails {
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
}

export interface TeacherStudent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emergency_name: string;
  emergency_phone: string;
  medical_notes: string;
}

export interface TeacherSession {
  id: string;
  course_id: string;
  title: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  location: string | null;
  sync_link: string | null;
  notes: string | null;
  created_at: string;
}

export interface TeacherGroup {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface TeacherActivity {
  id: string;
  module_id: string;
  title: string;
  type: string;
  description: string | null;
  order_index: number;
}

export interface TeacherSubmission {
  id: string;
  lesson_id: string;
  student_id: string;
  text_content: string | null;
  file_url: string | null;
  grade: number | null;
  teacher_feedback: string | null;
  status: string;
  submitted_at: string;
  graded_at: string | null;
  profiles: { first_name: string; last_name: string } | null;
}

export interface TeacherAnnouncement {
  id: string;
  course_id: string;
  title: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface TutoringWithProfile {
  id: string;
  course_id: string;
  teacher_id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  profiles: { first_name: string; last_name: string } | null;
}

function memberDetails(value: unknown): MemberDetails | null {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  return {
    phone: typeof record.phone === 'string' ? record.phone : null,
    emergency_contact_name: typeof record.emergency_contact_name === 'string' ? record.emergency_contact_name : null,
    emergency_contact_phone: typeof record.emergency_contact_phone === 'string' ? record.emergency_contact_phone : null,
    medical_notes: typeof record.medical_notes === 'string' ? record.medical_notes : null,
  };
}

export function useTeacherData(selectedCourseId: string | undefined, activeTab: string, selectedSchoolId: string, selectedPeriodId?: string) {
  const { user, roles, role: primaryRole } = useAuthStore();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['teacher-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No hay una sesión docente activa.');
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_teacher, first_name')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user?.id),
  });

  const userRoles = roles?.length ? roles : primaryRole ? [primaryRole] : [];
  const isAdmin = userRoles.some((role) => ['admin', 'pastor', 'editor'].includes(role));
  const isTeacher = Boolean(profile?.is_teacher) || isAdmin || userRoles.some((role) => ['teacher', 'maestro', 'docente'].includes(role));

  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['teacher-courses', user?.id, selectedSchoolId, selectedPeriodId, isAdmin],
    queryFn: async () => {
      if (!user?.id) throw new Error('No hay una sesión docente activa.');
      let query = supabase
        .from('lms_courses')
        .select('id, title, description, cover_image_url, school_id, level_id, period_id, format, grading_scale, is_published, created_at, updated_at')
        .eq('school_id', selectedSchoolId);

      if (selectedPeriodId) query = query.or(`period_id.eq.${selectedPeriodId},period_id.is.null`);

      if (!isAdmin) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('lms_course_teachers')
          .select('course_id')
          .eq('user_id', user.id);
        if (assignmentsError) throw assignmentsError;
        const assignedIds = assignments?.map((assignment) => assignment.course_id) ?? [];
        if (assignedIds.length === 0) return [];
        query = query.in('id', assignedIds);
      }

      const { data, error } = await query.order('title', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(user?.id && profile && selectedSchoolId),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['course-students', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('lms_enrollments')
        .select('user_id')
        .eq('course_id', selectedCourseId)
        .eq('role', 'student')
        .eq('status', 'active');
      if (enrollmentsError) throw enrollmentsError;
      if (!enrollments?.length) return [];

      const studentIds = enrollments.map((enrollment) => enrollment.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, member_id, members:member_id(phone, emergency_contact_name, emergency_contact_phone, medical_notes)')
        .in('id', studentIds);
      if (profilesError) throw profilesError;

      return enrollments.map((enrollment) => {
        const studentProfile = profilesData?.find((item) => item.id === enrollment.user_id);
        const member = memberDetails(studentProfile?.members);
        return {
          id: enrollment.user_id,
          first_name: studentProfile?.first_name || 'Estudiante',
          last_name: studentProfile?.last_name || '',
          email: studentProfile?.email || '',
          phone: member?.phone || 'S/N',
          emergency_name: member?.emergency_contact_name || 'S/N',
          emergency_phone: member?.emergency_contact_phone || 'S/N',
          medical_notes: member?.medical_notes || 'Ninguna',
        };
      });
    },
    enabled: Boolean(selectedCourseId),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['course-sessions', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from('lms_class_sessions')
        .select('id, course_id, title, session_date, start_time, end_time, status, location, sync_link, notes, created_at')
        .eq('course_id', selectedCourseId)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(selectedCourseId) && ['students', 'classes', 'overview'].includes(activeTab),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['course-groups', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from('lms_student_groups')
        .select('id, course_id, name, description, created_at')
        .eq('course_id', selectedCourseId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(selectedCourseId) && activeTab === 'students',
  });

  const { data: planningData = { modules: [], materials: [], activities: [], resources: [] } } = useQuery({
    queryKey: ['course-planning', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return { modules: [], materials: [], activities: [], resources: [] };
      const { data: modules, error: modulesError } = await supabase
        .from('lms_modules')
        .select('id, subject_id, title, description, order_index, is_hidden, created_at, updated_at, lms_subjects!inner(course_id)')
        .eq('lms_subjects.course_id', selectedCourseId)
        .order('order_index', { ascending: true });
      if (modulesError) throw modulesError;
      const moduleIds = modules?.map((module) => module.id) ?? [];
      if (moduleIds.length === 0) return { modules: [], materials: [], activities: [], resources: [] };

      const [materialsResult, evaluationsResult, resourcesResult] = await Promise.all([
        supabase.from('lms_lessons').select('id, module_id, title, type, description, order_index').in('module_id', moduleIds).in('type', ['video', 'pdf', 'zoom', 'document']),
        supabase.from('lms_lessons').select('id, module_id, title, type, description, order_index').in('module_id', moduleIds).in('type', ['assignment', 'quiz']),
        supabase.from('lms_course_resources').select('id, course_id, module_id, title, file_url, file_type, file_size, created_by, created_at').eq('course_id', selectedCourseId),
      ]);
      if (materialsResult.error) throw materialsResult.error;
      if (evaluationsResult.error) throw evaluationsResult.error;
      if (resourcesResult.error) throw resourcesResult.error;

      return {
        modules: modules ?? [],
        materials: materialsResult.data ?? [],
        activities: evaluationsResult.data ?? [],
        resources: resourcesResult.data ?? [],
      };
    },
    enabled: Boolean(selectedCourseId) && activeTab === 'planning',
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['course-submissions', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data: modules, error: modulesError } = await supabase
        .from('lms_modules')
        .select('id, lms_subjects!inner(course_id)')
        .eq('lms_subjects.course_id', selectedCourseId);
      if (modulesError) throw modulesError;
      const moduleIds = modules?.map((module) => module.id) ?? [];
      if (moduleIds.length === 0) return [];

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lms_lessons')
        .select('id')
        .in('module_id', moduleIds)
        .in('type', ['assignment', 'quiz']);
      if (lessonsError) throw lessonsError;
      const lessonIds = lessonsData?.map((lesson) => lesson.id) ?? [];
      if (lessonIds.length === 0) return [];

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('lms_lesson_submissions')
        .select('id, lesson_id, student_id, text_content, file_url, grade, teacher_feedback, status, submitted_at, graded_at')
        .in('lesson_id', lessonIds);
      if (submissionsError) throw submissionsError;
      if (!submissionsData?.length) return [];

      const studentIds = [...new Set(submissionsData.map((submission) => submission.student_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds);
      if (profilesError) throw profilesError;

      return submissionsData.map((submission) => {
        const studentProfile = profilesData?.find((item) => item.id === submission.student_id);
        return {
          ...submission,
          profiles: studentProfile ? { first_name: studentProfile.first_name || '', last_name: studentProfile.last_name || '' } : null,
        };
      });
    },
    enabled: Boolean(selectedCourseId) && ['grades', 'overview', 'compliance'].includes(activeTab),
  });

  const { data: commData = { announcements: [], tutoring: [] } } = useQuery({
    queryKey: ['course-comm', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return { announcements: [], tutoring: [] };
      const [announcementsResult, tutoringResult] = await Promise.all([
        supabase.from('lms_announcements').select('id, course_id, title, content, created_by, created_at').eq('course_id', selectedCourseId).order('created_at', { ascending: false }),
        supabase.from('lms_tutoring_appointments').select('id, course_id, teacher_id, student_id, scheduled_at, duration_minutes, status, notes, created_at').eq('course_id', selectedCourseId).order('scheduled_at', { ascending: true }),
      ]);
      if (announcementsResult.error) throw announcementsResult.error;
      if (tutoringResult.error) throw tutoringResult.error;

      let mappedTutoring: TutoringWithProfile[] = [];
      if (tutoringResult.data?.length) {
        const studentIds = [...new Set(tutoringResult.data.map((appointment) => appointment.student_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', studentIds);
        if (profilesError) throw profilesError;
        mappedTutoring = tutoringResult.data.map((appointment) => {
          const studentProfile = profilesData?.find((item) => item.id === appointment.student_id);
          return {
            ...appointment,
            profiles: studentProfile ? { first_name: studentProfile.first_name || '', last_name: studentProfile.last_name || '' } : null,
          };
        });
      }

      return { announcements: announcementsResult.data ?? [], tutoring: mappedTutoring };
    },
    enabled: Boolean(selectedCourseId) && activeTab === 'comm',
  });

  const { data: finalGrades = [] } = useQuery({
    queryKey: ['course-final-grades', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('lms_enrollments')
        .select('id, user_id')
        .eq('course_id', selectedCourseId)
        .eq('role', 'student')
        .eq('status', 'active');
      if (enrollmentsError) throw enrollmentsError;
      if (!enrollments?.length) return [];

      const { data: grades, error: gradesError } = await supabase
        .from('lms_grades')
        .select('id, enrollment_id, subject_id, final_grade, comments, graded_by, created_at, updated_at')
        .in('enrollment_id', enrollments.map((enrollment) => enrollment.id));
      if (gradesError) throw gradesError;

      return (grades ?? []).map((grade) => ({
        ...grade,
        user_id: enrollments.find((enrollment) => enrollment.id === grade.enrollment_id)?.user_id,
      }));
    },
    enabled: Boolean(selectedCourseId) && activeTab === 'grades',
  });

  const { data: pendingAttendanceCount = 0 } = useQuery({
    queryKey: ['pending-attendance-count', selectedCourseId, sessions.map((s) => s.id).join(',')],
    queryFn: async () => {
      if (!selectedCourseId || sessions.length === 0) return 0;
      const sessionIds = sessions.map((s) => s.id);
      const { data: attendanceRecords, error } = await supabase
        .from('lms_attendance')
        .select('session_id')
        .in('session_id', sessionIds);

      if (error) throw error;
      const sessionsWithAttendance = new Set(attendanceRecords?.map((a) => a.session_id) ?? []);
      const todayStr = new Date().toISOString().split('T')[0];

      const pending = sessions.filter((s) => {
        const sDate = s.session_date ? s.session_date.split('T')[0] : '';
        return sDate <= todayStr && !sessionsWithAttendance.has(s.id);
      });

      return pending.length;
    },
    enabled: Boolean(selectedCourseId) && ['overview', 'classes', 'students'].includes(activeTab),
  });

  return {
    profile,
    isTeacher,
    isLoading: isProfileLoading || isCoursesLoading,
    courses: courses ?? [],
    students,
    sessions,
    groups,
    modules: planningData.modules,
    materials: planningData.materials,
    resources: planningData.resources,
    activities: planningData.activities,
    submissions,
    announcements: commData.announcements,
    tutoring: commData.tutoring,
    finalGrades,
    pendingAttendanceCount,
  };
}

export function useSessionAttendance(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: async () => {
      if (!sessionId) return {};
      const { data, error } = await supabase
        .from('lms_attendance')
        .select('student_id, status')
        .eq('session_id', sessionId);
      if (error) throw error;
      const attendance: Record<string, 'present' | 'zoom' | 'absent' | 'late' | 'excused'> = {};
      data?.forEach((item) => {
        attendance[item.student_id] = item.status;
      });
      return attendance;
    },
    enabled: Boolean(sessionId),
  });
}
