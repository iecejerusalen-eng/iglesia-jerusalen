import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

export function useCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['lms-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_course_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        toast.error('Error al cargar categorías');
        throw error;
      }
      return data as CategoryItem[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const { error } = await supabase.from('lms_course_categories').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-categories'] });
      toast.success('Categoría creada con éxito');
    },
    onError: () => {
      toast.error('Error al crear la categoría');
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string; description: string } }) => {
      const { error } = await supabase.from('lms_course_categories').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-categories'] });
      toast.success('Categoría actualizada con éxito');
    },
    onError: () => {
      toast.error('Error al actualizar la categoría');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lms_course_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-categories'] });
      toast.success('Categoría eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la categoría');
    },
  });

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
