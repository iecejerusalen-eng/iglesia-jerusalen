import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { GlobalErrorBoundary } from './components/common/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'sonner';
import ScrollToTop from './components/common/ScrollToTop';
import ConfirmDialog from './components/common/ConfirmDialog';
import CRMRegistrationPrompt from './components/common/CRMRegistrationPrompt';
import BirthdayCelebrationModal from './components/common/BirthdayCelebrationModal';
import AppRouter from './routes/AppRouter';

import { supabase } from './config/supabase';
import { initLocalDatabase } from './config/localDb';
import { useSyncStore } from './store/useSyncStore';
import { useThemeStore } from './store/useThemeStore';
import { usePluginStore } from './store/usePluginStore';

function App() {
  useEffect(() => {
    const initDb = async () => {
      await initLocalDatabase();
      const syncStore = useSyncStore.getState();
      if (syncStore.isOnline) {
        await syncStore.pullFromServer();
        await syncStore.syncOfflineQueue();
      }
    };
    initDb().catch(console.error);
    useAuthStore.getState().initializeAuth();
    usePluginStore.getState().fetchPlugins().catch(console.error);
    
    // Initialize Theme
    const themeStore = useThemeStore.getState();
    themeStore.setTheme(themeStore.theme);
    
    // Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = useThemeStore.getState().theme;
      if (currentTheme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Dynamic Favicon Loader
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('logos')
          .select('storage_path')
          .is('ministry_id', null)
          .eq('variant', 'circular')
          .eq('color_mode', 'color')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const publicUrl = supabase.storage
            .from('logos')
            .getPublicUrl(data[0].storage_path).data.publicUrl;

          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = publicUrl;
        }
      } catch (err) {
        console.error('Error loading dynamic favicon:', err);
      }
    };

    const timer = setTimeout(() => {
      updateFavicon();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <HelmetProvider>
      <GlobalErrorBoundary>
        <Toaster richColors position="top-right" />
        <ConfirmDialog />
        <BrowserRouter>
          <ScrollToTop />
          <CRMRegistrationPrompt />
          <BirthdayCelebrationModal />
          <AppRouter />
        </BrowserRouter>
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
