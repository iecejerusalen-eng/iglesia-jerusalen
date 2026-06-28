import { create } from 'zustand';
import { toast } from 'sonner';
import { enqueueMutation } from '../features/sync/services/syncQueue';
import { processSyncQueue } from '../features/sync/services/syncWorker';
import { pullFromServer } from '../features/sync/services/syncPull';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  setOnlineStatus: (status: boolean) => void;
  enqueueMutation: (
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: any
  ) => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  pullFromServer: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => {
  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      set({ isOnline: true });
      toast.success('Conexión de red restablecida. Sincronizando datos...');
      get().syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      set({ isOnline: false });
      toast.warning('Dispositivo sin conexión a internet. Los cambios se guardarán localmente.');
    });
  }

  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,

    setOnlineStatus: (status: boolean) => {
      set({ isOnline: status });
      if (status) {
        get().syncOfflineQueue();
      }
    },

    enqueueMutation: async (
      tableName: string,
      recordId: string,
      action: 'INSERT' | 'UPDATE' | 'DELETE',
      payload: any
    ) => {
      await enqueueMutation(tableName, recordId, action, payload);
    },

    syncOfflineQueue: async () => {
      const { isSyncing, isOnline } = get();
      await processSyncQueue(
        isSyncing,
        isOnline,
        (status) => set({ isSyncing: status })
      );
    },

    pullFromServer: async () => {
      await pullFromServer();
    }
  };
});
