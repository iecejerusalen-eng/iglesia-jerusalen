import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { LMSCourse } from '../../../types';
import { toast } from 'sonner';

export const useCourses = () => {
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lms_courses').select('*, lms_schools(name, slug, color), lms_levels(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as LMSCourse[];
    }
  });

  const createCourse = useMutation({
    mutationFn: async (payload: Partial<LMSCourse>) => {
      const { data, error } = await supabase.from('lms_courses').insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso creado con éxito');
    },
    onError: () => toast.error('Error al guardar el curso.')
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: Partial<LMSCourse> }) => {
      const { data, error } = await supabase.from('lms_courses').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso actualizado con éxito');
    },
    onError: () => toast.error('Error al actualizar el curso.')
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      // Usamos el RPC para saltarnos restricciones complejas de RLS en cascada
      const { error } = await supabase.rpc('delete_lms_course', { p_course_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error al eliminar el curso:', error);
      toast.error('Error al eliminar el curso. Verifica si tiene dependencias activas.');
    }
  });

  return { courses, isLoading, createCourse, updateCourse, deleteCourse };
};

