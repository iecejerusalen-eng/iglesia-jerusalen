import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DBPageSection } from '../types';
import { toast } from 'sonner';

export const usePageMutations = () => {
  const queryClient = useQueryClient();

  const saveSectionMutation = useMutation({
    mutationFn: async (section: DBPageSection) => {
      const { error } = await supabase
        .from('page_contents')
        .upsert({
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
        });

      if (error) throw error;
      return section;
    },
    onSuccess: (data) => {
      toast.success('Sección guardada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['page_contents', data.page] });
    },
    onError: (err: any) => {
      console.error('Error saving section:', err);
      toast.error('No se pudo guardar la sección: ' + (err.message || String(err)));
    }
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (sections: DBPageSection[]) => {
      const { error } = await supabase
        .from('page_contents')
        .upsert(sections.map(s => ({
          id: s.id,
          page: s.page,
          section: s.section,
          name: s.name,
          title: s.title,
          subtitle: s.subtitle,
          content_blocks: s.content_blocks,
          order_index: s.order_index,
          section_type: s.section_type,
          cover_image_url: s.cover_image_url || null,
          updated_at: new Date().toISOString()
        })));
      if (error) throw error;
      return sections;
    },
    onSuccess: (data) => {
      toast.success('Orden de secciones guardado.');
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['page_contents', data[0].page] });
      }
    },
    onError: (err: any) => {
      console.error('Error saving new section order:', err);
      toast.error('No se pudo persistir el orden: ' + (err.message || String(err)));
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async ({ id, remaining }: { id: string, remaining: DBPageSection[] }) => {
      const { error } = await supabase
        .from('page_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (remaining.length > 0) {
        const { error: orderError } = await supabase
          .from('page_contents')
          .upsert(remaining.map(s => ({
            id: s.id,
            page: s.page,
            section: s.section,
            name: s.name,
            title: s.title,
            subtitle: s.subtitle,
            content_blocks: s.content_blocks,
            order_index: s.order_index,
            section_type: s.section_type,
            cover_image_url: s.cover_image_url || null,
            updated_at: new Date().toISOString()
          })));
        if (orderError) throw orderError;
      }
      return { id, remaining };
    },
    onSuccess: (data) => {
      toast.success('Sección eliminada.');
      if (data.remaining.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['page_contents', data.remaining[0].page] });
      }
    },
    onError: (err: any) => {
      console.error('Error deleting section:', err);
      toast.error('Error al eliminar la sección: ' + (err.message || String(err)));
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
    onError: (err: any) => {
      console.error('Error adding new section:', err);
      toast.error('No se pudo crear la sección: ' + (err.message || String(err)));
    }
  });

  return {
    saveSectionMutation,
    reorderSectionsMutation,
    deleteSectionMutation,
    addSectionMutation
  };
};
