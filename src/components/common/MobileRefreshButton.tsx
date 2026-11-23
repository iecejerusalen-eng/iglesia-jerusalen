import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function MobileRefreshButton() {
  const handleHardRefresh = () => {
    toast.loading('Recargando aplicación y limpiando caché...');
    
    // Attempt to clear caches if Service Worker is active
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      }).catch(console.error);
    }

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    
    // Add a small delay so the toast is visible
    setTimeout(() => {
      // Force reload from server bypassing cache (using a cache-busting query param)
      const url = new URL(window.location.href);
      url.searchParams.set('t', Date.now().toString());
      window.location.href = url.toString();
    }, 600);
  };

  return (
    <button
      onClick={handleHardRefresh}
      title="Recargar la aplicación · Ctrl+Shift+R"
      aria-label="Recargar la aplicación. Atajo del navegador: Ctrl+Shift+R."
      className="fixed bottom-20 left-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-900/90 text-white shadow-xl backdrop-blur-xl transition-all hover:bg-slate-800 hover:text-cyan-400 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
    >
      <RefreshCw size={16} aria-hidden="true" />
      <span aria-hidden="true" className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-slate-900 px-1.5 py-0.5 text-[7px] font-bold leading-none tracking-tight text-white shadow-lg">
        Ctrl+Shift+R
      </span>
    </button>
  );
}
