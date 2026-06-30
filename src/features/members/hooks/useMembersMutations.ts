import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSyncStore } from '../../../store/useSyncStore';
import { logAuditEvent } from '../../../utils/auditLogger';
import type { MemberForm as MemberFormType } from '../utils/schema';

export const useMembersMutations = () => {
  const queryClient = useQueryClient();

  const saveMemberMutation = useMutation({
    mutationFn: async (payload: { 
      id: string; 
      editing: boolean; 
      data: any; 
      name: string; 
      dni: string | null;
      areas: string[];
      talents: string[];
      gifts: string[];
      emails: { email: string }[];
    }) => {
      const syncStore = useSyncStore.getState();

      await syncStore.enqueueMutation(
        'members',
        payload.id,
        payload.editing ? 'UPDATE' : 'INSERT',
        payload.data
      );

      // Handle emails
      await syncStore.enqueueMutation(
        'member_emails',
        payload.id,
        'DELETE_BY_MEMBER' as any,
        { member_id: payload.id }
      );

      for (const email of payload.emails) {
        if (email.email) {
          await syncStore.enqueueMutation(
            'member_emails',
            crypto.randomUUID(),
            'INSERT',
            { member_id: payload.id, email: email.email.trim() }
          );
        }
      }

      // Handle skills (areas, talents, gifts)
      const clearAndInsertSkills = async (type: 'member_service_areas' | 'member_talents' | 'member_spiritual_gifts', items: string[]) => {
        await syncStore.enqueueMutation(
          type,
          payload.id,
          'DELETE_BY_MEMBER' as any,
          { member_id: payload.id }
        );
        for (const roleId of items) {
          await syncStore.enqueueMutation(
            type,
            crypto.randomUUID(),
            'INSERT',
            { member_id: payload.id, role_id: roleId }
          );
        }
      };

      await clearAndInsertSkills('member_service_areas', payload.areas);
      await clearAndInsertSkills('member_talents', payload.talents);
      await clearAndInsertSkills('member_spiritual_gifts', payload.gifts);

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

  const handleSave = async (
    data: MemberFormType, 
    editingId: string | null, 
    areas: string[], 
    talents: string[], 
    gifts: string[]
  ): Promise<boolean> => {
    try {
      const id = editingId || crypto.randomUUID();
      const { emails, ...memberData } = data;
      
      const payloadData = {
        ...memberData,
        id,
        is_leader: data.is_leader || false,
      };

      await saveMemberMutation.mutateAsync({
        id,
        editing: !!editingId,
        data: payloadData,
        name: `${data.first_name} ${data.last_name}`,
        dni: data.dni || null,
        areas,
        talents,
        gifts,
        emails: emails || []
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    try {
      await deleteMemberMutation.mutateAsync({ id, name });
    } catch (error) {
      // Handled in mutation
    }
  };

  return { 
    handleSave, 
    handleDelete, 
    isPending: saveMemberMutation.isPending || deleteMemberMutation.isPending 
  };
};
