import { useEffect, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { GlobalErrorBoundary } from './components/common/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Toaster as SonnerToaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import ScrollToTop from './components/common/ScrollToTop';
import ConfirmDialog from './components/common/ConfirmDialog';
import AppRouter from './routes/AppRouter';

// Heavy modals — lazy loaded so they don't block the initial bundle
const CRMRegistrationPrompt = lazy(() => import('./components/common/CRMRegistrationPrompt'));
const BirthdayCelebrationModal = lazy(() => import('./components/common/BirthdayCelebrationModal'));

import { supabase } from './config/supabase';
import { initLocalDatabase } from './config/localDb';
import { usePluginStore } from './store/usePluginStore';

export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // 1. Iniciar autenticación
    initializeAuth();

    // 2. Cargar plugins activos (almacenamiento en caché)
    usePluginStore.getState().fetchPlugins();

    // 3. Inicializar base de datos PWA SQLite/IndexedDB
    initLocalDatabase().catch((err) =>
      console.warn('Advertencia al inicializar la BD local:', err)
    );
  }, [initializeAuth]);

  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('church_settings')
          .select('logo_url')
          .limit(1)
          .maybeSingle();

        // Table may not exist yet — silently skip without logging to console
        if (error) return;

        if (data?.logo_url) {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'shortcut icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.logo_url;
        }
      } catch {
        // Silently ignore — church_settings table may not exist in this deployment
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
        <SonnerToaster
          position="bottom-center"
          offset={48}
          theme="dark"
          toastOptions={{
            duration: 4000,
          }}
        />
        <HotToaster
          position="bottom-center"
          containerStyle={{
            bottom: 48,
          }}
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#ffffff',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(16px)',
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '0.75rem 1.25rem',
              maxWidth: '90vw',
            },
          }}
        />
        <ConfirmDialog />
        <BrowserRouter>
          <ScrollToTop />
          {/* Modales cargados bajo demanda */}
          <Suspense fallback={null}>
            <CRMRegistrationPrompt />
            <BirthdayCelebrationModal />
          </Suspense>
          <AppRouter />
        </BrowserRouter>
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
}
