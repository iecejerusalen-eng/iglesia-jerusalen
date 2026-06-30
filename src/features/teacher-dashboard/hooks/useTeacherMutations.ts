import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/useAuthStore';

export function useTeacherMutations(selectedCourseId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const addSession = useMutation({
    mutationFn: async ({ title, date }: { title: string; date: string }) => {
      const { data, error } = await supabase
        .from('lms_class_sessions')
        .insert([{ course_id: selectedCourseId, title, session_date: date }])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-sessions', selectedCourseId] });
      toast.success('Clase / Sesión creada');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al agregar sesión');
    }
  });

  const addGroup = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from('lms_student_groups')
        .insert([{ course_id: selectedCourseId, name, description }])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-groups', selectedCourseId] });
      toast.success('Subgrupo de trabajo creado');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al crear subgrupo');
    }
  });

  const addAnnouncement = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data, error } = await supabase
        .from('lms_announcements')
        .insert([{ course_id: selectedCourseId, title, content, created_by: user?.id }])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-comm', selectedCourseId] });
      toast.success('Anuncio publicado');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al publicar anuncio');
    }
  });

  const addTutoring = useMutation({
    mutationFn: async ({ studentId, time, notes }: { studentId: string; time: string; notes: string }) => {
      const { error } = await supabase
        .from('lms_tutoring_appointments')
        .insert([{ course_id: selectedCourseId, student_id: studentId, teacher_id: user?.id, scheduled_at: new Date(time).toISOString(), notes }])
        .select();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-comm', selectedCourseId] });
      toast.success('Tutoría programada');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al agendar tutoría');
    }
  });

  const updateAttendance = useMutation({
    mutationFn: async ({ sessionId, studentId, status }: { sessionId: string; studentId: string; status: 'present'|'absent'|'late'|'excused' }) => {
      const { error } = await supabase
        .from('lms_attendance')
        .upsert([{ session_id: sessionId, student_id: studentId, status }], { onConflict: 'session_id,student_id' });
      if (error) throw error;
      return { sessionId, studentId, status };
    },
    onSuccess: (data) => {
      toast.success('Asistencia registrada');
      queryClient.setQueryData(['session-attendance', data.sessionId], (old: any) => ({
        ...old,
        [data.studentId]: data.status
      }));
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al guardar asistencia');
    }
  });

  return { addSession, addGroup, addAnnouncement, addTutoring, updateAttendance };
}
