import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { ProgramModule } from '../../../types';
import { toast } from 'sonner';

export const useModules = (programId: string | null) => {
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules', programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await supabase.from('program_modules').select('*').eq('program_id', programId).order('order');
      if (error) throw error;
      return data as ProgramModule[];
    },
    enabled: !!programId
  });

  const createModule = useMutation({
    mutationFn: async (payload: Partial<ProgramModule>) => {
      const { data, error } = await supabase.from('program_modules').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', programId] });
      toast.success('Módulo creado');
    },
    onError: () => toast.error('Error al crear módulo')
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: Partial<ProgramModule> }) => {
      const { data, error } = await supabase.from('program_modules').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', programId] });
      toast.success('Módulo actualizado');
    },
    onError: () => toast.error('Error al actualizar módulo')
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('program_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', programId] });
      toast.success('Módulo eliminado');
    },
    onError: () => toast.error('Error al eliminar módulo')
  });

  const updateModuleOrders = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      await Promise.all(
        updates.map(u => supabase.from('program_modules').update({ order: u.order }).eq('id', u.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', programId] });
    }
  });

  return { modules, isLoading, createModule, updateModule, deleteModule, updateModuleOrders };
};
