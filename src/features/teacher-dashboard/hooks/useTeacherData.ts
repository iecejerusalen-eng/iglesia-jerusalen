import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

export function useTeacherData(selectedCourseId: string | undefined, activeTab: string) {
  const { user } = useAuthStore();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['teacher-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role, is_teacher, first_name')
        .eq('id', user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isAdmin = ['admin', 'pastor'].includes(profile?.role || '');
  const isTeacher = profile?.is_teacher || isAdmin;

  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      let query = supabase.from('lms_courses').select('*');
      if (!isAdmin) {
        const { data: assignments } = await supabase
          .from('lms_course_teachers')
          .select('course_id')
          .eq('user_id', user?.id);
        const assignedIds = assignments?.map(a => a.course_id) || [];
        if (assignedIds.length === 0) return [];
        query = query.in('id', assignedIds);
      }
      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id && !!profile,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['course-students', selectedCourseId],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('lms_enrollments')
        .select('user_id')
        .eq('course_id', selectedCourseId)
        .eq('role', 'student');
      
      if (!enrollments?.length) return [];
      const studentIds = enrollments.map(e => e.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          member_id,
          members:member_id (
            phone,
            emergency_contact_name,
            emergency_contact_phone,
            medical_notes
          )
        `)
        .in('id', studentIds);

      return enrollments.map((e: any) => {
        const p = profilesData?.find(p => p.id === e.user_id);
        return {
          id: e.user_id,
          first_name: p?.first_name || 'Estudiante',
          last_name: p?.last_name || '',
          email: p?.email || '',
          phone: (p?.members as any)?.phone || 'S/N',
          emergency_name: (p?.members as any)?.emergency_contact_name || 'S/N',
          emergency_phone: (p?.members as any)?.emergency_contact_phone || 'S/N',
          medical_notes: (p?.members as any)?.medical_notes || 'Ninguna'
        };
      });
    },
    enabled: !!selectedCourseId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['course-sessions', selectedCourseId],
    queryFn: async () => {
      const { data } = await supabase
        .from('lms_class_sessions')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('session_date', { ascending: false });
      return data || [];
    },
    enabled: !!selectedCourseId && activeTab === 'students',
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['course-groups', selectedCourseId],
    queryFn: async () => {
      const { data } = await supabase
        .from('lms_student_groups')
        .select('*')
        .eq('course_id', selectedCourseId);
      return data || [];
    },
    enabled: !!selectedCourseId && activeTab === 'students',
  });

  const { data: planningData = { materials: [], activities: [] } } = useQuery({
    queryKey: ['course-planning', selectedCourseId],
    queryFn: async () => {
      const { data: sections } = await supabase
        .from('lms_sections')
        .select('id')
        .eq('course_id', selectedCourseId);
      const sectionIds = sections?.map(s => s.id) || [];
      if (sectionIds.length === 0) return { materials: [], activities: [] };

      const [{ data: materialsData }, { data: evalData }] = await Promise.all([
        supabase.from('lms_activities').select('*').in('section_id', sectionIds).eq('type', 'resource'),
        supabase.from('lms_activities').select('*').in('section_id', sectionIds).in('type', ['assignment', 'quiz'])
      ]);
      return { materials: materialsData || [], activities: evalData || [] };
    },
    enabled: !!selectedCourseId && activeTab === 'planning',
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['course-submissions', selectedCourseId],
    queryFn: async () => {
      const { data: sections } = await supabase
        .from('lms_sections')
        .select('id')
        .eq('course_id', selectedCourseId);
      const sectionIds = sections?.map(s => s.id) || [];
      if (sectionIds.length === 0) return [];
      
      const { data: evalData } = await supabase
        .from('lms_activities')
        .select('id, title, type')
        .in('section_id', sectionIds)
        .in('type', ['assignment', 'quiz']);
      const activityIds = evalData?.map(a => a.id) || [];
      if (activityIds.length === 0) return [];

      const { data: subsData } = await supabase
        .from('lms_assignment_submissions')
        .select('*')
        .in('activity_id', activityIds);
      if (!subsData?.length) return [];

      const studentIds = [...new Set(subsData.map(s => s.student_id))];
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds);

      return subsData.map(sub => {
        const profile = profData?.find(p => p.id === sub.student_id);
        return {
          ...sub,
          profiles: profile ? {
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          } : null
        };
      });
    },
    enabled: !!selectedCourseId && activeTab === 'grades',
  });

  const { data: commData = { announcements: [], tutoring: [] } } = useQuery({
    queryKey: ['course-comm', selectedCourseId],
    queryFn: async () => {
      const [{ data: annData }, { data: tutData }] = await Promise.all([
        supabase.from('lms_announcements').select('*').eq('course_id', selectedCourseId).order('created_at', { ascending: false }),
        supabase.from('lms_tutoring_appointments').select('*').eq('course_id', selectedCourseId).order('scheduled_at', { ascending: true })
      ]);
      
      let mappedTutoring: any[] = [];
      if (tutData && tutData.length > 0) {
        const studentIds = [...new Set(tutData.map(t => t.student_id))];
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', studentIds);
        
        mappedTutoring = tutData.map(t => {
          const profile = profData?.find(p => p.id === t.student_id);
          return {
            ...t,
            profiles: profile ? { first_name: profile.first_name || '', last_name: profile.last_name || '' } : null
          };
        });
      }

      return { announcements: annData || [], tutoring: mappedTutoring };
    },
    enabled: !!selectedCourseId && activeTab === 'comm',
  });

  return {
    profile,
    isTeacher,
    isLoading: isProfileLoading || (isTeacher && isCoursesLoading),
    courses: courses || [],
    students,
    sessions,
    groups,
    materials: planningData.materials,
    activities: planningData.activities,
    submissions,
    announcements: commData.announcements,
    tutoring: commData.tutoring,
  };
}

export function useSessionAttendance(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: async () => {
      if (!sessionId) return {};
      const { data } = await supabase
        .from('lms_attendance')
        .select('student_id, status')
        .eq('session_id', sessionId);
      const map: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
      data?.forEach(item => {
        map[item.student_id] = item.status;
      });
      return map;
    },
    enabled: !!sessionId,
  });
}
