import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import type { CertificateTemplate } from '../types';

export const useTemplateMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (template: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .insert(template)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success('Plantilla guardada exitosamente');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al guardar la plantilla');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificateTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success('Plantilla actualizada exitosamente');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al actualizar la plantilla');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success('Plantilla eliminada exitosamente');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error al eliminar la plantilla');
    },
  });

  return {
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
