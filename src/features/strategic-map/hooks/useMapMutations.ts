import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../../store/useConfirmStore';

export const useMapMutations = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirmStore((state) => state.confirm);

  const createCellMutation = useMutation({
    mutationFn: async (newCell: {
      name: string;
      sector: string;
      leader_id: string;
      latitude: number;
      longitude: number;
      status: 'active' | 'paused' | 'planning' | 'archived';
      capacity: number | null;
      coverage_radius_m: number;
    }) => {
      const { error } = await supabase
        .from('cells')
        .insert([{
          name: newCell.name,
          sector: newCell.sector || null,
          leader_id: newCell.leader_id || null,
          latitude: newCell.latitude,
          longitude: newCell.longitude,
          status: newCell.status,
          capacity: newCell.capacity,
          coverage_radius_m: newCell.coverage_radius_m,
        }]);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Célula "${variables.name}" creada con éxito.`);
      queryClient.invalidateQueries({ queryKey: ['map-cells'] });
    },
    onError: (error) => {
      console.error('Map cell create failed:', error);
      toast.error(`No se pudo guardar la célula: ${error.message}`);
    }
  });

  const deleteCellMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cells')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-cells'] });
    },
    onError: (error) => {
      console.error('Map cell deletion failed:', error);
      toast.error(`No se pudo eliminar la célula: ${error.message}`);
    }
  });

  const handleDeleteCell = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Eliminar célula',
      message: `¿Estás seguro de eliminar lógicamente la célula "${name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    
    if (confirmed) {
      deleteCellMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`Célula "${name}" eliminada.`);
        }
      });
    }
  };

  return {
    createCell: createCellMutation.mutate,
    isCreatingCell: createCellMutation.isPending,
    handleDeleteCell,
    isDeletingCell: deleteCellMutation.isPending
  };
};
