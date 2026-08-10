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
      title="Recargar página forzosamente"
      className="fixed bottom-20 left-4 z-[9999] md:hidden flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-900/80 text-white backdrop-blur-xl shadow-2xl transition-all hover:bg-slate-800 hover:text-cyan-400 active:scale-90"
    >
      <RefreshCw size={20} />
    </button>
  );
}
