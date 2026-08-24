import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const CHUNK_RELOAD_KEY = 'chunk-failed-reload';
const CHUNK_ERROR_MARKERS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Expected a JavaScript module script but the server responded with a MIME type',
] as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isChunkLoadError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return CHUNK_ERROR_MARKERS.some((marker) => message.includes(marker.toLowerCase()));
}

async function refreshApplicationAssets(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.update()));
  }

  const refreshedUrl = new URL(window.location.href);
  refreshedUrl.searchParams.set('_asset_refresh', String(Date.now()));
  window.location.replace(refreshedUrl.toString());
}

function removeAssetRefreshParam(): void {
  const currentUrl = new URL(window.location.href);
  if (!currentUrl.searchParams.has('_asset_refresh')) return;

  currentUrl.searchParams.delete('_asset_refresh');
  window.history.replaceState(
    window.history.state,
    document.title,
    `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
  );
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      removeAssetRefreshParam();
      return component;
    } catch (error: unknown) {
      if (!isChunkLoadError(error)) throw error;

      const previousAttempts = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
      if (previousAttempts < 1) {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(previousAttempts + 1));
        try {
          await refreshApplicationAssets();
        } catch (refreshError: unknown) {
          console.error('No se pudo actualizar los recursos de la aplicación.', {
            chunkError: error,
            refreshError,
          });
        }
      }

      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw new Error(
        'No se pudo cargar esta sección porque la versión de la aplicación quedó desactualizada. Recarga la página.',
        { cause: error },
      );
    }
  }) as unknown as LazyExoticComponent<T>;
}
