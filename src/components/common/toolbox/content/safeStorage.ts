export interface StorageReadResult<T> {
  value: T;
  error: Error | null;
}

function toError(error: unknown, message: string): Error {
  return error instanceof Error ? error : new Error(message);
}

export function readJsonStorage<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): StorageReadResult<T> {
  if (typeof window === 'undefined') return { value: fallback, error: null };

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { value: fallback, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!validate(parsed)) {
      return { value: fallback, error: new Error(`Los datos guardados en "${key}" no tienen un formato válido.`) };
    }
    return { value: parsed, error: null };
  } catch (error: unknown) {
    return { value: fallback, error: toError(error, `No se pudo leer "${key}".`) };
  }
}

export function writeJsonStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

