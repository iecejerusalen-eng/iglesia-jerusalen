import { useEffect, useState } from 'react';
import { learningSlugSchema } from './learningDocument';

export const LEARNING_PROGRESS_KEY = 'jerusalen-learning-progress-v1';
const changed = 'jerusalen-learning-progress-changed';
function readProgress(): { completed: string[]; error: string | null } {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY) ?? '[]');
    if (!Array.isArray(value) || !value.every(slug => learningSlugSchema.safeParse(slug).success)) throw new Error('El progreso guardado no tiene el formato esperado.');
    return { completed: [...new Set<string>(value)], error: null };
  } catch (error) {
    console.error('No se pudo leer el progreso de aprendizaje:', error);
    return { completed: [], error: 'No se pudo leer el progreso de este dispositivo.' };
  }
}
export function useLearningProgress() {
  const [state, setState] = useState(readProgress);
  useEffect(() => {
    const refresh = () => setState(readProgress());
    const fromStorage = (event: StorageEvent) => { if (event.key === LEARNING_PROGRESS_KEY || event.key === null) refresh(); };
    window.addEventListener(changed, refresh); window.addEventListener('storage', fromStorage);
    return () => { window.removeEventListener(changed, refresh); window.removeEventListener('storage', fromStorage); };
  }, []);
  const write = (completed: string[]) => {
    try { localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(completed)); window.dispatchEvent(new Event(changed)); }
    catch (error) { console.error('No se pudo guardar el progreso:', error); setState(current => ({ ...current, error: 'Tu navegador no permitió guardar el progreso. Puedes continuar leyendo.' })); }
  };
  const toggle = (slug: string) => {
    learningSlugSchema.parse(slug);
    const current = readProgress();
    if (current.error) { setState(current); return; }
    write(current.completed.includes(slug) ? current.completed.filter(item => item !== slug) : [...current.completed, slug]);
  };
  return { ...state, toggle, reset: () => write([]) };
}
