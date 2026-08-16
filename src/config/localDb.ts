import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Schedule } from '../types';
import type { LocalMemberRow } from '../features/members/utils/schema';
import type { SyncQueueItem } from '../features/sync/services/syncWorker';

type LocalMemberRecord = Omit<LocalMemberRow, 'emails' | 'phones' | 'service_areas' | 'talents' | 'spiritual_gifts'> & {
  emails?: string;
  phones?: string;
  service_areas?: string;
  talents?: string;
  spiritual_gifts?: string;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
  version?: number;
  dedicated_verse?: string | null;
  [key: string]: unknown;
};

type LocalScheduleRecord = Schedule & {
  updated_at?: string;
  version?: number;
};

interface LocalSermonNote {
  id: string;
  user_id: string;
  sermon_id: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
  [key: string]: unknown;
}

export interface JerusalenDB extends DBSchema {
  local_members: {
    key: string;
    value: LocalMemberRecord;
  };
  local_schedules: {
    key: string;
    value: LocalScheduleRecord;
  };
  local_sermon_notes: {
    key: string;
    value: LocalSermonNote;
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
  };
}

let dbPromise: Promise<IDBPDatabase<JerusalenDB>>;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<JerusalenDB>('jerusalen_local', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('local_members')) {
          db.createObjectStore('local_members', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('local_schedules')) {
          db.createObjectStore('local_schedules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('local_sermon_notes')) {
          db.createObjectStore('local_sermon_notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function initLocalDatabase(): Promise<void> {
  try {
    await getDb();
    console.log('Local IndexedDB database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize local IndexedDB database:', error);
  }
}
