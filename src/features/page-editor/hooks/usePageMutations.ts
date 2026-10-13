import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DBPageSection } from '../types';
import { toast } from 'sonner';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return String(error);
};

export const usePageMutations = () => {
  const queryClient = useQueryClient();

  const saveSectionMutation = useMutation({
    mutationFn: async (section: DBPageSection) => {
      const payload = {
          id: section.id,
          page: section.page,
          section: section.section,
          name: section.name,
          title: section.title?.trim() || '',
          subtitle: section.subtitle?.trim() || '',
          content_blocks: section.content_blocks || [],
          order_index: section.order_index,
          section_type: section.section_type,
          cover_image_url: section.cover_image_url || null,
          updated_at: new Date().toISOString()
        };
      const result = section.updated_at
        ? await supabase.from('page_contents').update(payload).eq('id', section.id).eq('updated_at', section.updated_at).select().maybeSingle()
        : await supabase.from('page_contents').insert(payload).select().single();
      if (result.error) throw result.error;
      if (!result.data) throw new Error('Otra persona cambió esta sección. Recarga y compara antes de guardar.');
      return result.data as DBPageSection;
    },
    onSuccess: (data) => {
      toast.success('Sección guardada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['page_contents', data.page] });
    },
    onError: (err: unknown) => {
      console.error('Error saving section:', err);
      toast.error('No se pudo guardar la sección: ' + getErrorMessage(err));
    }
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (sections: DBPageSection[]) => {
      const result = await supabase.rpc('reorder_page_sections', { items: sections.map(section => ({ id: section.id, order_index: section.order_index, expected_updated_at: section.updated_at ?? null })) });
      if (result.error) throw result.error;
      return result.data as DBPageSection[];

    },
    onSuccess: (data) => {
      toast.success('Orden de secciones guardado.');
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['page_contents', data[0].page] });
      }
    },
    onError: (err: unknown) => {
      console.error('Error saving new section order:', err);
      toast.error('No se pudo persistir el orden: ' + getErrorMessage(err));
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async ({ id, remaining }: { id: string, remaining: DBPageSection[] }) => {
      const { error } = await supabase
        .from('page_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { id, remaining };
    },
    onSuccess: (data) => {
      toast.success('Sección eliminada.');
      if (data.remaining.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['page_contents', data.remaining[0].page] });
      }
    },
    onError: (err: unknown) => {
      console.error('Error deleting section:', err);
      toast.error('Error al eliminar la sección: ' + getErrorMessage(err));
    }
  });

  const addSectionMutation = useMutation({
    mutationFn: async (section: DBPageSection) => {
      const { error } = await supabase
        .from('page_contents')
        .upsert({
          id: section.id,
          page: section.page,
          section: section.section,
          name: section.name,
          title: section.title,
          subtitle: section.subtitle,
          content_blocks: section.content_blocks,
          order_index: section.order_index,
          section_type: section.section_type,
          cover_image_url: section.cover_image_url || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return section;
    },
    onSuccess: (data) => {
      toast.success('Sección agregada con éxito.');
      queryClient.invalidateQueries({ queryKey: ['page_contents', data.page] });
    },
    onError: (err: unknown) => {
      console.error('Error adding new section:', err);
      toast.error('No se pudo crear la sección: ' + getErrorMessage(err));
    }
  });

  return {
    saveSectionMutation,
    reorderSectionsMutation,
    deleteSectionMutation,
    addSectionMutation
  };
};
