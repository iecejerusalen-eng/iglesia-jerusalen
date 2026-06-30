import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Program } from '../../../types';
import { toast } from 'sonner';

export const usePrograms = () => {
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Program[];
    }
  });

  const createProgram = useMutation({
    mutationFn: async (payload: Partial<Program>) => {
      const { data, error } = await supabase.from('programs').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Programa creado');
    },
    onError: () => toast.error('Error al crear')
  });

  const updateProgram = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: Partial<Program> }) => {
      const { data, error } = await supabase.from('programs').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Programa actualizado');
    },
    onError: () => toast.error('Error al actualizar')
  });

  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Programa eliminado');
    },
    onError: () => toast.error('Error al eliminar')
  });

  return { programs, isLoading, createProgram, updateProgram, deleteProgram };
};
