import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'sonner';
import ScrollToTop from './components/common/ScrollToTop';
import ConfirmDialog from './components/common/ConfirmDialog';
import CRMRegistrationPrompt from './components/common/CRMRegistrationPrompt';
import BirthdayCelebrationModal from './components/common/BirthdayCelebrationModal';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Store from './pages/public/Store';
import Cart from './pages/public/Cart';
import Donations from './pages/public/Donations';
import About from './pages/public/About';
import MinistriesOverview from './pages/public/MinistriesOverview';
import MinistryDetail from './pages/public/MinistryDetail';
import Sermons from './pages/public/Sermons';
import Contact from './pages/public/Contact';
import Events from './pages/public/Events';
import Petitions from './pages/public/Petitions';
import SongsLibrary from './pages/public/SongsLibrary';
import ProgramsOverview from './pages/public/ProgramsOverview';
import VirtualClassroomLanding from './pages/public/VirtualClassroomLanding';
import ProgramDetail from './pages/public/ProgramDetail';
import MyPurchases from './pages/public/MyPurchases';

import DashboardHome from './pages/admin/DashboardHome';
import SermonsManager from './pages/admin/SermonsManager';
import FinanceDashboard from './pages/admin/FinanceDashboard';
import StoreManager from './pages/admin/StoreManager';
import MinistryManager from './pages/admin/MinistryManager';
import MinistryDashboard from './pages/admin/MinistryDashboard';
import LogosManager from './pages/admin/LogosManager';
import UsersManager from './pages/admin/UsersManager';
import SettingsManager from './pages/admin/SettingsManager';
import MembersManager from './pages/admin/MembersManager';
import EventsManager from './pages/admin/EventsManager';
import StrategicMap from './pages/admin/StrategicMap';
import PageEditor from './pages/admin/PageEditor';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import NotificationsManager from './pages/admin/NotificationsManager';
import PetitionsManager from './pages/admin/PetitionsManager';
import SongsManager from './pages/admin/SongsManager';
import LMSManager from './pages/admin/LMSManager';
import CourseBuilder from './pages/admin/CourseBuilder';
import LMSGradebook from './pages/admin/LMSGradebook';
import ChatManager from './pages/admin/ChatManager';
import OpenResourcesManager from './pages/admin/OpenResourcesManager';
import OpenResourceBuilder from './pages/admin/OpenResourceBuilder';
import PluginManager from './pages/admin/PluginManager';
import SundaySchool from './pages/public/SundaySchool';
import ReadingPlan from './pages/public/ReadingPlan';
import SermonDetail from './pages/public/SermonDetail';
import ProductionBoard from './pages/admin/ProductionBoard';
import MediaVault from './pages/admin/MediaVault';
import InventoryManager from './pages/admin/InventoryManager';
import AnimationCatalog from './pages/admin/AnimationCatalog';
import Birthdays from './pages/public/Birthdays';
import StudentDashboard from './pages/lms/StudentDashboard';
import TeacherDashboard from './pages/lms/TeacherDashboard';
import CourseViewer from './pages/lms/CourseViewer';
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
    initDb();
    useAuthStore.getState().initializeAuth();
    usePluginStore.getState().fetchPlugins();
    
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
    <>
      <Toaster richColors position="top-right" />
      <ConfirmDialog />
      <BrowserRouter>
        <ScrollToTop />
        <CRMRegistrationPrompt />
        <BirthdayCelebrationModal />
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
          </Route>

          <Route element={<ProtectedRoute module="dashboard" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<DashboardHome />} />
              <Route path="/admin/animaciones" element={<AnimationCatalog />} />
            </Route>
          </Route>

          {/* LMS Dashboards (Public Layout but protected) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PublicLayout />}>
              <Route path="/lms/estudiante" element={<StudentDashboard />} />
              <Route path="/lms/docente" element={<TeacherDashboard />} />
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
            </Route>
          </Route>

          {/* Protected Routes: Church Settings */}
          <Route element={<ProtectedRoute module="settings" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/configuracion" element={<SettingsManager />} />
              <Route path="/admin/extensiones" element={<PluginManager />} />
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
      </BrowserRouter>
    </>
  );
}

export default App;

