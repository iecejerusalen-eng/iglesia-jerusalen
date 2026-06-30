import { useEffect, Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { GlobalErrorBoundary } from './components/common/ErrorBoundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'sonner';
import ScrollToTop from './components/common/ScrollToTop';
import ConfirmDialog from './components/common/ConfirmDialog';
import CRMRegistrationPrompt from './components/common/CRMRegistrationPrompt';
import BirthdayCelebrationModal from './components/common/BirthdayCelebrationModal';

const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem('chunk-failed-reload');
      return component;
    } catch (error: any) {
      if (
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('error loading dynamically imported module')
      ) {
        if (!window.sessionStorage.getItem('chunk-failed-reload')) {
          window.sessionStorage.setItem('chunk-failed-reload', 'true');
          window.location.reload();
          return new Promise(() => {}); // Prevent rendering during reload
        }
      }
      window.sessionStorage.removeItem('chunk-failed-reload');
      throw error;
    }
  });
};

// Lazy loaded pages
const Home = lazyWithRetry(() => import('./pages/public/Home'));
const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const Store = lazyWithRetry(() => import('./pages/public/Store'));
const Cart = lazyWithRetry(() => import('./pages/public/Cart'));
const Donations = lazyWithRetry(() => import('./pages/public/Donations'));
const About = lazyWithRetry(() => import('./pages/public/About'));
const MinistriesOverview = lazyWithRetry(() => import('./pages/public/MinistriesOverview'));
const MinistryDetail = lazyWithRetry(() => import('./pages/public/MinistryDetail'));
const Sermons = lazyWithRetry(() => import('./pages/public/Sermons'));
const Contact = lazyWithRetry(() => import('./pages/public/Contact'));
const Events = lazyWithRetry(() => import('./pages/public/Events'));
const Petitions = lazyWithRetry(() => import('./pages/public/Petitions'));
const SongsLibrary = lazyWithRetry(() => import('./pages/public/SongsLibrary'));
const ProgramsOverview = lazyWithRetry(() => import('./pages/public/ProgramsOverview'));
const VirtualClassroomLanding = lazyWithRetry(() => import('./pages/public/VirtualClassroomLanding'));
const Presentation = lazyWithRetry(() => import('./pages/public/Presentation').then(m => ({ default: m.Presentation })));
const ProgramDetail = lazyWithRetry(() => import('./pages/public/ProgramDetail'));
const MyPurchases = lazyWithRetry(() => import('./pages/public/MyPurchases'));
const Checkout = lazyWithRetry(() => import('./pages/public/Checkout'));
const OrderSuccess = lazyWithRetry(() => import('./pages/public/OrderSuccess'));
const DashboardHome = lazyWithRetry(() => import('./pages/admin/DashboardHome'));
const SermonsManager = lazyWithRetry(() => import('./pages/admin/SermonsManager'));
const FinanceDashboard = lazyWithRetry(() => import('./pages/admin/FinanceDashboard'));
const StoreManager = lazyWithRetry(() => import('./pages/admin/StoreManager'));
const StoreSettings = lazyWithRetry(() => import('./pages/admin/StoreSettings'));
const OrdersManager = lazyWithRetry(() => import('./pages/admin/OrdersManager'));
const MinistryManager = lazyWithRetry(() => import('./pages/admin/MinistryManager'));
const MinistryDashboard = lazyWithRetry(() => import('./pages/admin/MinistryDashboard'));
const LogosManager = lazyWithRetry(() => import('./pages/admin/LogosManager'));
const UsersManager = lazyWithRetry(() => import('./pages/admin/UsersManager'));
const SettingsManager = lazyWithRetry(() => import('./pages/admin/SettingsManager'));
const AdminSettings = lazyWithRetry(() => import('./pages/admin/Settings/AdminSettings'));
const MembersManager = lazyWithRetry(() => import('./pages/admin/MembersManager'));
const EventsManager = lazyWithRetry(() => import('./pages/admin/EventsManager'));
const StrategicMap = lazyWithRetry(() => import('./pages/admin/StrategicMap'));
const PageEditor = lazyWithRetry(() => import('./pages/admin/PageEditor'));
const AnalyticsDashboard = lazyWithRetry(() => import('./pages/admin/AnalyticsDashboard'));
const NotificationsManager = lazyWithRetry(() => import('./pages/admin/NotificationsManager'));
const PetitionsManager = lazyWithRetry(() => import('./pages/admin/PetitionsManager'));
const SongsManager = lazyWithRetry(() => import('./pages/admin/SongsManager'));
const LMSManager = lazyWithRetry(() => import('./pages/admin/LMSManager'));
const CourseBuilder = lazyWithRetry(() => import('./pages/admin/CourseBuilder'));
const LMSGradebook = lazyWithRetry(() => import('./pages/admin/LMSGradebook'));
const ChatManager = lazyWithRetry(() => import('./pages/admin/ChatManager'));
const OpenResourcesManager = lazyWithRetry(() => import('./pages/admin/OpenResourcesManager'));
const OpenResourceBuilder = lazyWithRetry(() => import('./pages/admin/OpenResourceBuilder'));
const PluginManager = lazyWithRetry(() => import('./pages/admin/PluginManager'));
const SundaySchool = lazyWithRetry(() => import('./pages/public/SundaySchool'));
const ReadingPlan = lazyWithRetry(() => import('./pages/public/ReadingPlan'));
const SermonDetail = lazyWithRetry(() => import('./pages/public/SermonDetail'));
const ProductionBoard = lazyWithRetry(() => import('./pages/admin/ProductionBoard'));
const MediaVault = lazyWithRetry(() => import('./pages/admin/MediaVault'));
const InventoryManager = lazyWithRetry(() => import('./pages/admin/InventoryManager'));
const AnimationCatalog = lazyWithRetry(() => import('./pages/admin/AnimationCatalog'));
const Birthdays = lazyWithRetry(() => import('./pages/public/Birthdays'));
const Bible = lazyWithRetry(() => import('./pages/public/Bible'));
const StudentDashboard = lazyWithRetry(() => import('./pages/lms/StudentDashboard'));
const TeacherDashboard = lazyWithRetry(() => import('./pages/lms/TeacherDashboard'));
const CourseViewer = lazyWithRetry(() => import('./pages/lms/CourseViewer'));

const PresentationEditor = lazyWithRetry(() => import('./pages/admin/PresentationEditor').then(m => ({ default: m.PresentationEditor })));
const GamesManager = lazyWithRetry(() => import('./pages/admin/GamesManager').then(m => ({ default: m.GamesManager })));
const BiblionarioEditor = lazyWithRetry(() => import('./pages/admin/games/BiblionarioEditor').then(m => ({ default: m.BiblionarioEditor })));
const GamesHub = lazyWithRetry(() => import('./pages/public/GamesHub').then(m => ({ default: m.GamesHub })));
const Biblionario = lazyWithRetry(() => import('./pages/public/games/Biblionario').then(m => ({ default: m.Biblionario })));

const Hangman = lazyWithRetry(() => import('./pages/public/games/Hangman').then(m => ({ default: m.Hangman })));
const HangmanEditor = lazyWithRetry(() => import('./pages/admin/games/HangmanEditor').then(m => ({ default: m.HangmanEditor })));
const MemoryMatch = lazyWithRetry(() => import('./pages/public/games/MemoryMatch').then(m => ({ default: m.MemoryMatch })));
const MemoryEditor = lazyWithRetry(() => import('./pages/admin/games/MemoryEditor').then(m => ({ default: m.MemoryEditor })));
const AudioLibrary = lazyWithRetry(() => import('./pages/admin/games/AudioLibrary').then(m => ({ default: m.AudioLibrary })));

const DesignCatalog = lazyWithRetry(() => import('./pages/admin/DesignCatalog'));

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

import ProtectedRoute from './components/common/ProtectedRoute';
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
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/presentacion" element={<Presentation />} />
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/tienda" element={<Store />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/nosotros" element={<About />} />
            <Route path="/ministerios" element={<MinistriesOverview />} />
            <Route path="/ministerios/:slug" element={<MinistryDetail />} />
            <Route path="/predicas" element={<Sermons />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/peticiones" element={<Petitions />} />
            <Route path="/recursos/alabanzas" element={<SongsLibrary />} />
            <Route path="/programas" element={<ProgramsOverview />} />
            <Route path="/programas/:id" element={<ProgramDetail />} />
            <Route path="/aula-virtual" element={<VirtualClassroomLanding />} />
            <Route path="/mis-compras" element={<MyPurchases />} />
            <Route path="/escuela-dominical" element={<SundaySchool />} />
            <Route path="/plan-lectura" element={<ReadingPlan />} />
            <Route path="/predicas/:id" element={<SermonDetail />} />
            <Route path="/cumpleanos" element={<Birthdays />} />
            <Route path="/recursos/biblia" element={<Bible />} />
            <Route path="/recursos/juegos" element={<GamesHub />} />
            <Route path="/recursos/juegos/quien-quiere-ser-biblionario" element={<Biblionario />} />
            <Route path="/recursos/juegos/ahorcado-biblico" element={<Hangman />} />
            <Route path="/recursos/juegos/memorama-biblico" element={<MemoryMatch />} />
          </Route>

          <Route element={<ProtectedRoute module="dashboard" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<DashboardHome />} />
              <Route path="/admin/animaciones" element={<AnimationCatalog />} />
              <Route path="/admin/diseno" element={<DesignCatalog />} />
            </Route>
          </Route>

          {/* LMS Dashboards (Public Layout but protected) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PublicLayout />}>
              <Route path="/lms/estudiante" element={<StudentDashboard />} />
              <Route path="/lms/docente" element={<TeacherDashboard />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
            </Route>
            
            <Route element={<AdminLayout />}>
              {/* LMS Teacher Accessible Tools */}
              <Route path="/admin/lms/course/:id" element={<CourseBuilder />} />
              <Route path="/admin/lms/gradebook/:id" element={<LMSGradebook />} />
            </Route>

            {/* Full-screen LMS Course Player */}
            <Route path="/lms/curso/:id" element={<CourseViewer />} />
          </Route>

          {/* Protected Routes: Production */}
          <Route element={<ProtectedRoute module="production" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/produccion" element={<ProductionBoard />} />
            </Route>
          </Route>

          {/* Protected Routes: Media Vault */}
          <Route element={<ProtectedRoute module="media_vault" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/media-vault" element={<MediaVault />} />
            </Route>
          </Route>

          {/* Protected Routes: Ministries */}
          <Route element={<ProtectedRoute module="ministries" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/ministerios" element={<MinistryManager />} />
              <Route path="/admin/ministerios/:id" element={<MinistryDashboard />} />
            </Route>
          </Route>

          {/* Protected Routes: Logos */}
          <Route element={<ProtectedRoute module="logos" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/logos" element={<LogosManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Events */}
          <Route element={<ProtectedRoute module="events" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/eventos" element={<EventsManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Members */}
          <Route element={<ProtectedRoute module="members" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/miembros" element={<MembersManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Strategic Map */}
          <Route element={<ProtectedRoute module="map" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/mapa-estrategico" element={<StrategicMap />} />
            </Route>
          </Route>

          {/* Protected Routes: Notifications */}
          <Route element={<ProtectedRoute module="notifications" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/notificaciones" element={<NotificationsManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Sermons */}
          <Route element={<ProtectedRoute module="sermons" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/sermones" element={<SermonsManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Songs */}
          <Route element={<ProtectedRoute module="songs" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/alabanzas" element={<SongsManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Programs */}
          <Route element={<ProtectedRoute module="programs" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/lms" element={<LMSManager />} />
              <Route path="/admin/lms/matriculas" element={<LMSManager />} />
              <Route path="/admin/recursos-abiertos" element={<OpenResourcesManager />} />
              <Route path="/admin/recursos-abiertos/:id" element={<OpenResourceBuilder />} />
              <Route path="/admin/juegos" element={<GamesManager />} />
              <Route path="/admin/juegos/audio-library" element={<AudioLibrary />} />
              <Route path="/admin/juegos/quien-quiere-ser-biblionario" element={<BiblionarioEditor />} />
              <Route path="/admin/juegos/ahorcado-biblico" element={<HangmanEditor />} />
              <Route path="/admin/juegos/memorama-biblico" element={<MemoryEditor />} />
            </Route>
          </Route>

          {/* Protected Routes: Editor de Presentación */}
          <Route element={<ProtectedRoute module="diseno" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/presentacion" element={<PresentationEditor />} />
            </Route>
          </Route>

          {/* Protected Routes: Pages Editor */}
          <Route element={<ProtectedRoute module="pages" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/paginas" element={<PageEditor />} />
            </Route>
          </Route>

          {/* Protected Routes: Analytics */}
          <Route element={<ProtectedRoute module="analytics" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/analisis" element={<AnalyticsDashboard />} />
            </Route>
          </Route>

          {/* Protected Routes: Finances */}
          <Route element={<ProtectedRoute module="finances" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/finanzas" element={<FinanceDashboard />} />
            </Route>
          </Route>

          {/* Protected Routes: Products */}
          <Route element={<ProtectedRoute module="products" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/productos" element={<StoreManager />} />
              <Route path="/admin/ordenes" element={<OrdersManager />} />
              <Route path="/admin/pagos-envios" element={<StoreSettings />} />
            </Route>
          </Route>

          {/* Protected Routes: Church Settings */}
          <Route element={<ProtectedRoute module="settings" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/configuracion" element={<SettingsManager />} />
              <Route path="/admin/extensiones" element={<PluginManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Appearance / Customization */}
          <Route element={<ProtectedRoute module="appearance" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/apariencia" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Protected Routes: User Management */}
          <Route element={<ProtectedRoute module="users" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/usuarios" element={<UsersManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Petitions */}
          <Route element={<ProtectedRoute module="petitions" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/peticiones" element={<PetitionsManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Chat */}
          <Route element={<ProtectedRoute module="chat" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/chat" element={<ChatManager />} />
            </Route>
          </Route>

          {/* Protected Routes: Inventory */}
          <Route element={<ProtectedRoute module="inventory" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/inventario" element={<InventoryManager />} />
            </Route>
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
}

export default App;

