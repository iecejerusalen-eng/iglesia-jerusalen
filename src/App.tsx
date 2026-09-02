import { useEffect, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { GlobalErrorBoundary } from './components/common/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Toaster as SonnerToaster } from 'sonner';
import ScrollToTop from './components/common/ScrollToTop';
import ConfirmDialog from './components/common/ConfirmDialog';
import AppRouter from './routes/AppRouter';

// Heavy modals — lazy loaded so they don't block the initial bundle
const CRMRegistrationPrompt = lazy(() => import('./components/common/CRMRegistrationPrompt'));
const BirthdayCelebrationModal = lazy(() => import('./components/common/BirthdayCelebrationModal'));

import { supabase } from './config/supabase';
import { initLocalDatabase } from './config/localDb';
import { usePluginStore } from './store/usePluginStore';

const GlobalContextMenu = lazy(() => import('./components/common/GlobalContextMenu'));
const GlobalToolbox = lazy(() => import('./components/common/GlobalToolbox'));
const MobileRefreshButton = lazy(() => import('./components/common/MobileRefreshButton'));
import { I18nProvider } from './i18n/i18nContext';
const CommandPalette = lazy(() => import('./components/common/CommandPalette'));

export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // 1. Iniciar autenticación
    initializeAuth();

    // 2. Cargar plugins activos (almacenamiento en caché)
    const deferredStartup = window.setTimeout(() => {
      void usePluginStore.getState().fetchPlugins();
      void initLocalDatabase().catch((err) =>
        console.warn('Advertencia al inicializar la BD local:', err)
      );
    }, 1200);

    return () => window.clearTimeout(deferredStartup);
  }, [initializeAuth]);

  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('church_settings')
          .select('logo_url')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('No fue posible cargar el favicon desde church_settings.', error);
          return;
        }

        if (data?.logo_url) {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'shortcut icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.logo_url;
        }
      } catch (error) {
        console.warn('Falló la actualización dinámica del favicon.', error);
      }
    };

    const timer = setTimeout(() => {
      updateFavicon();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <I18nProvider>
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
          <ConfirmDialog />
          <BrowserRouter>
            <Suspense fallback={null}>
              <GlobalContextMenu>
                <ScrollToTop />
                <CommandPalette />
                {/* Modales cargados bajo demanda */}
                <CRMRegistrationPrompt />
                <BirthdayCelebrationModal />
                <AppRouter />
                <GlobalToolbox />
                <MobileRefreshButton />
              </GlobalContextMenu>
            </Suspense>
          </BrowserRouter>
        </GlobalErrorBoundary>
      </HelmetProvider>
    </I18nProvider>
  );
}
