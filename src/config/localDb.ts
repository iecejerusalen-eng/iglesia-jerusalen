import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface JerusalenDB extends DBSchema {
  local_members: {
    key: string;
    value: any;
  };
  local_schedules: {
    key: string;
    value: any;
  };
  local_sermon_notes: {
    key: string;
    value: any;
  };
  sync_queue: {
    key: string;
    value: any;
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
