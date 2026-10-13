import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export interface RecoveryDraft<T> { value: T; baseline: string; savedAt: string }
export function useRecoveryDraft<T>(documentKey: string, value: T, baseline: T, dirty: boolean, enabled: boolean) {
  const userId = useAuthStore(state => state.user?.id);
  const key = userId ? `jerusalen-recovery:${userId}:${documentKey}` : null;
  const [recovery, setRecovery] = useState<RecoveryDraft<T> | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!key || !enabled) return;
    const timer = window.setTimeout(() => {
      setRecovery(null); setSavedAt(null); setError(null);
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !('value' in parsed) || !('savedAt' in parsed) || !('baseline' in parsed) || typeof parsed.savedAt !== 'string' || typeof parsed.baseline !== 'string') throw new Error('La copia de recuperación no es válida.');
        if (Date.now() - Date.parse(parsed.savedAt) > 86400000) { sessionStorage.removeItem(key); return; }
        setRecovery(parsed as RecoveryDraft<T>);
      } catch (e) { console.error('No se pudo leer la recuperación del editor', e); setError('No se pudo leer la copia de recuperación de esta pestaña.'); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, enabled]);
  useEffect(() => {
    if (!key || !enabled || !dirty) return;
    const persist = () => {
      try {
        const stamp = new Date().toISOString();
        sessionStorage.setItem(key, JSON.stringify({ value, baseline: JSON.stringify(baseline), savedAt: stamp }));
        setSavedAt(stamp); setError(null);
      } catch (e) { console.error('No se pudo guardar la recuperación del editor', e); setError('Autoguardado no disponible. Guarda tus cambios antes de salir.'); }
    };
    const timer = window.setTimeout(persist, 700);
    const beforeNavigation = (event: MouseEvent) => { if (event.target instanceof Element && event.target.closest('a[href]')) persist(); };
    window.addEventListener('beforeunload',persist);
    window.addEventListener('jerusalen-editor-leaving',persist);
    document.addEventListener('click',beforeNavigation,true);
    return () => { window.clearTimeout(timer); window.removeEventListener('beforeunload',persist); window.removeEventListener('jerusalen-editor-leaving',persist); document.removeEventListener('click',beforeNavigation,true); };
  }, [key, enabled, dirty, value, baseline]);
  const clear = () => {
    try { if (key) sessionStorage.removeItem(key); setRecovery(null); setSavedAt(null); }
    catch (e) { console.error('No se pudo quitar la recuperación', e); setError('No se pudo quitar la copia de recuperación.'); }
  };
  return { recovery, savedAt, error, clear };
}
