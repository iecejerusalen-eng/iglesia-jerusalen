import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import type { CertificateFont } from '../types';

export const useFontMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (font: Omit<CertificateFont, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('certificate_fonts')
        .insert(font)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-fonts'] });
      toast.success('Fuente guardada exitosamente');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al guardar la fuente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certificate_fonts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-fonts'] });
      toast.success('Fuente eliminada exitosamente');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al eliminar la fuente');
    },
  });

  return {
    createFont: createMutation.mutateAsync,
    deleteFont: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
