import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function MobileRefreshButton() {
  const handleHardRefresh = () => {
    toast.loading('Recargando aplicación...');
    
    // Attempt to clear caches if Service Worker is active
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      }).catch(console.error);
    }
    
    // Add a small delay so the toast is visible
    setTimeout(() => {
      // Force reload from server bypassing cache
      window.location.reload();
    }, 400);
  };

  return (
    <button
      onClick={handleHardRefresh}
      title="Recargar página"
      className="fixed bottom-4 left-4 z-[9999] md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/40 text-white/50 backdrop-blur-xl shadow-lg transition-all hover:bg-slate-800/60 hover:text-white active:scale-90"
    >
      <RefreshCw size={16} />
    </button>
  );
}
