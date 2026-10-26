import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSyncStore } from '../../../store/useSyncStore';
import { logAuditEvent } from '../../../utils/auditLogger';
import type { MemberForm as MemberFormType } from '../utils/schema';
import { createMemberSyncPayload } from '../utils/memberSyncPayload';

export const useMembersMutations = () => {
  const queryClient = useQueryClient();

  const saveMemberMutation = useMutation({
    mutationFn: async (payload: { 
      id: string; 
      editing: boolean; 
      data: Record<string, unknown>; 
      name: string; 
      dni: string | null;
      areas: string[];
      talents: string[];
      gifts: string[];
    }) => {
      const syncStore = useSyncStore.getState();

      await syncStore.enqueueMutation(
        'members',
        payload.id,
        payload.editing ? 'UPDATE' : 'INSERT',
        payload.data
      );

      await logAuditEvent(
        payload.editing ? 'UPDATE' : 'CREATE',
        'members',
        payload.id,
        {
          name: payload.name,
          dni: payload.dni
        }
      );

      if (syncStore.isOnline) {
        await syncStore.syncOfflineQueue();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Miembro guardado con éxito');
    },
    onError: (error) => {
      console.error('Error saving member:', error);
      toast.error('Error al guardar el miembro. Revisa tu conexión.');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string }) => {
      const syncStore = useSyncStore.getState();

      await syncStore.enqueueMutation(
        'members',
        payload.id,
        'DELETE',
        { deleted_at: new Date().toISOString() }
      );

      await logAuditEvent(
        'DELETE',
        'members',
        payload.id,
        {
          name: payload.name || 'Desconocido'
        }
      );

      if (syncStore.isOnline) {
        await syncStore.syncOfflineQueue();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Miembro eliminado');
    },
    onError: (error) => {
      console.error('Error deleting member:', error);
      toast.error('Error al eliminar el miembro.');
    }
  });

  const restoreMemberMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string }) => {
      const syncStore = useSyncStore.getState();

      await syncStore.enqueueMutation(
        'members',
        payload.id,
        'UPDATE',
        { deleted_at: null }
      );

      await logAuditEvent(
        'UPDATE',
        'members',
        payload.id,
        {
          name: payload.name || 'Desconocido',
          notes: 'Miembro restaurado de la papelera'
        }
      );

      if (syncStore.isOnline) {
        await syncStore.syncOfflineQueue();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['deleted_members'] });
      toast.success('Miembro restaurado exitosamente');
    },
    onError: (error) => {
      console.error('Error restoring member:', error);
      toast.error('Error al restaurar el miembro.');
    }
  });

  const handleSave = async (
    data: MemberFormType, 
    editingId: string | null, 
    areas: string[], 
    talents: string[], 
    gifts: string[]
  ): Promise<boolean> => {
    try {
      const id = editingId || crypto.randomUUID();
      const payloadData = createMemberSyncPayload(data, id, areas, talents, gifts);

      await saveMemberMutation.mutateAsync({
        id,
        editing: !!editingId,
        data: payloadData,
        name: `${data.first_name} ${data.last_name}`,
        dni: data.dni || null,
        areas,
        talents,
        gifts,
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    try {
      await deleteMemberMutation.mutateAsync({ id, name });
    } catch {
      // Handled in mutation
    }
  };

  return { 
    handleSave, 
    handleDelete,
    restoreMemberMutation,
    isPending: saveMemberMutation.isPending || deleteMemberMutation.isPending || restoreMemberMutation.isPending
  };
};
