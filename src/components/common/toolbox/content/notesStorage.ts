import { readJsonStorage, removeStorage, writeJsonStorage } from './safeStorage';

export const NOTES_STORAGE_KEY = 'jerusalen-toolbox-notes-v2';
const LEGACY_STORAGE_KEY = 'jerusalen-toolbox-notes';

export interface QuickNoteDocument {
  text: string;
  updatedAt: string | null;
}

function isQuickNoteDocument(value: unknown): value is QuickNoteDocument {
  return typeof value === 'object' && value !== null
    && 'text' in value && typeof value.text === 'string'
    && 'updatedAt' in value && (typeof value.updatedAt === 'string' || value.updatedAt === null);
}

export function loadQuickNote(): { note: QuickNoteDocument; error: Error | null } {
  const empty: QuickNoteDocument = { text: '', updatedAt: null };
  const current = readJsonStorage(NOTES_STORAGE_KEY, empty, isQuickNoteDocument);
  if (current.error || current.value.text) return { note: current.value, error: current.error };

  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return { note: empty, error: null };
    const migrated = { text: legacy, updatedAt: new Date().toISOString() };
    writeJsonStorage(NOTES_STORAGE_KEY, migrated);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return { note: migrated, error: null };
  } catch (error: unknown) {
    return { note: empty, error: error instanceof Error ? error : new Error('No se pudieron migrar las notas anteriores.') };
  }
}

export function saveQuickNote(note: QuickNoteDocument): void {
  writeJsonStorage(NOTES_STORAGE_KEY, note);
}

export function deleteQuickNote(): void {
  removeStorage(NOTES_STORAGE_KEY);
  removeStorage(LEGACY_STORAGE_KEY);
}
