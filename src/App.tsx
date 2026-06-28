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

// Lazy loaded pages
const Home = lazy(() => import('./pages/public/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Store = lazy(() => import('./pages/public/Store'));
const Cart = lazy(() => import('./pages/public/Cart'));
const Donations = lazy(() => import('./pages/public/Donations'));
const About = lazy(() => import('./pages/public/About'));
const MinistriesOverview = lazy(() => import('./pages/public/MinistriesOverview'));
const MinistryDetail = lazy(() => import('./pages/public/MinistryDetail'));
const Sermons = lazy(() => import('./pages/public/Sermons'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Events = lazy(() => import('./pages/public/Events'));
const Petitions = lazy(() => import('./pages/public/Petitions'));
const SongsLibrary = lazy(() => import('./pages/public/SongsLibrary'));
const ProgramsOverview = lazy(() => import('./pages/public/ProgramsOverview'));
const VirtualClassroomLanding = lazy(() => import('./pages/public/VirtualClassroomLanding'));
const ProgramDetail = lazy(() => import('./pages/public/ProgramDetail'));
const MyPurchases = lazy(() => import('./pages/public/MyPurchases'));
const Checkout = lazy(() => import('./pages/public/Checkout'));
const OrderSuccess = lazy(() => import('./pages/public/OrderSuccess'));
const DashboardHome = lazy(() => import('./pages/admin/DashboardHome'));
const SermonsManager = lazy(() => import('./pages/admin/SermonsManager'));
const FinanceDashboard = lazy(() => import('./pages/admin/FinanceDashboard'));
const StoreManager = lazy(() => import('./pages/admin/StoreManager'));
const StoreSettings = lazy(() => import('./pages/admin/StoreSettings'));
const OrdersManager = lazy(() => import('./pages/admin/OrdersManager'));
const MinistryManager = lazy(() => import('./pages/admin/MinistryManager'));
const MinistryDashboard = lazy(() => import('./pages/admin/MinistryDashboard'));
const LogosManager = lazy(() => import('./pages/admin/LogosManager'));
const UsersManager = lazy(() => import('./pages/admin/UsersManager'));
const SettingsManager = lazy(() => import('./pages/admin/SettingsManager'));
const AdminSettings = lazy(() => import('./pages/admin/Settings/AdminSettings'));
const MembersManager = lazy(() => import('./pages/admin/MembersManager'));
const EventsManager = lazy(() => import('./pages/admin/EventsManager'));
const StrategicMap = lazy(() => import('./pages/admin/StrategicMap'));
const PageEditor = lazy(() => import('./pages/admin/PageEditor'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const NotificationsManager = lazy(() => import('./pages/admin/NotificationsManager'));
const PetitionsManager = lazy(() => import('./pages/admin/PetitionsManager'));
const SongsManager = lazy(() => import('./pages/admin/SongsManager'));
const LMSManager = lazy(() => import('./pages/admin/LMSManager'));
const CourseBuilder = lazy(() => import('./pages/admin/CourseBuilder'));
const LMSGradebook = lazy(() => import('./pages/admin/LMSGradebook'));
const ChatManager = lazy(() => import('./pages/admin/ChatManager'));
const OpenResourcesManager = lazy(() => import('./pages/admin/OpenResourcesManager'));
const OpenResourceBuilder = lazy(() => import('./pages/admin/OpenResourceBuilder'));
const PluginManager = lazy(() => import('./pages/admin/PluginManager'));
const SundaySchool = lazy(() => import('./pages/public/SundaySchool'));
const ReadingPlan = lazy(() => import('./pages/public/ReadingPlan'));
const SermonDetail = lazy(() => import('./pages/public/SermonDetail'));
const ProductionBoard = lazy(() => import('./pages/admin/ProductionBoard'));
const MediaVault = lazy(() => import('./pages/admin/MediaVault'));
const InventoryManager = lazy(() => import('./pages/admin/InventoryManager'));
const AnimationCatalog = lazy(() => import('./pages/admin/AnimationCatalog'));
const DesignCatalog = lazy(() => import('./pages/admin/DesignCatalog'));
const Birthdays = lazy(() => import('./pages/public/Birthdays'));
const Bible = lazy(() => import('./pages/public/Bible'));
const StudentDashboard = lazy(() => import('./pages/lms/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/lms/TeacherDashboard'));
const CourseViewer = lazy(() => import('./pages/lms/CourseViewer'));

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

