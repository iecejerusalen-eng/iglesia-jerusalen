import { beforeEach, describe, expect, it } from 'vitest';
import { deleteQuickNote, loadQuickNote, NOTES_STORAGE_KEY, saveQuickNote } from '../notesStorage';

describe('notesStorage', () => {
  beforeEach(() => window.localStorage.clear());

  it('guarda y recupera texto con su fecha', () => {
    const note = { text: 'Bosquejo del mensaje', updatedAt: '2026-08-10T10:00:00.000Z' };
    saveQuickNote(note);
    expect(loadQuickNote()).toEqual({ note, error: null });
  });

  it('migra el formato anterior sin perder el contenido', () => {
    window.localStorage.setItem('jerusalen-toolbox-notes', 'Contenido anterior');
    const loaded = loadQuickNote();
    expect(loaded.note.text).toBe('Contenido anterior');
    expect(loaded.note.updatedAt).not.toBeNull();
    expect(window.localStorage.getItem(NOTES_STORAGE_KEY)).toContain('Contenido anterior');
    expect(window.localStorage.getItem('jerusalen-toolbox-notes')).toBeNull();
  });

  it('reporta datos corruptos en lugar de tratarlos como una nota válida', () => {
    window.localStorage.setItem(NOTES_STORAGE_KEY, '{dato roto');
    const loaded = loadQuickNote();
    expect(loaded.note).toEqual({ text: '', updatedAt: null });
    expect(loaded.error).toBeInstanceOf(Error);
  });

  it('elimina tanto el formato actual como el anterior', () => {
    saveQuickNote({ text: 'Actual', updatedAt: null });
    window.localStorage.setItem('jerusalen-toolbox-notes', 'Anterior');
    deleteQuickNote();
    expect(window.localStorage.getItem(NOTES_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem('jerusalen-toolbox-notes')).toBeNull();
  });
});
