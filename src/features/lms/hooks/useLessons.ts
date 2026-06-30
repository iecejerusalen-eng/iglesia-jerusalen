import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { ProgramLesson } from '../../../types';
import { toast } from 'sonner';

export const useLessons = (programId: string | null) => {
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await supabase.from('program_lessons').select('*').eq('program_id', programId).order('order');
      if (error) throw error;
      return data as ProgramLesson[];
    },
    enabled: !!programId
  });

  const createLesson = useMutation({
    mutationFn: async (payload: Partial<ProgramLesson>) => {
      const { data, error } = await supabase.from('program_lessons').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', programId] });
      toast.success('Lección creada');
    },
    onError: () => toast.error('Error al crear lección')
  });

  const updateLesson = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: Partial<ProgramLesson> }) => {
      const { data, error } = await supabase.from('program_lessons').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', programId] });
      toast.success('Lección actualizada');
    },
    onError: () => toast.error('Error al actualizar lección')
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('program_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', programId] });
      toast.success('Lección eliminada');
    },
    onError: () => toast.error('Error al eliminar')
  });

  const updateLessonOrders = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      await Promise.all(
        updates.map(u => supabase.from('program_lessons').update({ order: u.order }).eq('id', u.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', programId] });
    }
  });

  return { lessons, isLoading, createLesson, updateLesson, deleteLesson, updateLessonOrders };
};
