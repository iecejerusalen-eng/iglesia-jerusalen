import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';

export const useCareersMutations = () => {
  const queryClient = useQueryClient();

  const addCareerMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('careers')
        .insert([{ name: name.trim() }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
    }
  });

  const updateCareerMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string }) => {
      const { error } = await supabase
        .from('careers')
        .update({ name: payload.name.trim() })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
    }
  });

  const deleteCareerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('careers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      queryClient.invalidateQueries({ queryKey: ['lookups'] });
    }
  });

  return { addCareerMutation, updateCareerMutation, deleteCareerMutation };
};
