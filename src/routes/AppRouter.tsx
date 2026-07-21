import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { PageSkeleton } from '../components/common/Skeletons';

const lazyWithRetry = <T extends React.ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem('chunk-failed-reload');
      return component;
    } catch (error: unknown) {
      const message = (error as Error)?.message ?? '';
      if (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('error loading dynamically imported module')
      ) {
        if (!window.sessionStorage.getItem('chunk-failed-reload')) {
          window.sessionStorage.setItem('chunk-failed-reload', 'true');
          window.location.reload();
          return new Promise(() => {});
        }
      }
      window.sessionStorage.removeItem('chunk-failed-reload');
      throw error;
    }
  });
};

// --- PUBLIC PAGES ---
const Home = lazyWithRetry(() => import('../pages/public/Home'));
const Login = lazyWithRetry(() => import('../pages/auth/Login'));
const Store = lazyWithRetry(() => import('../pages/public/Store'));
const Cart = lazyWithRetry(() => import('../pages/public/Cart'));
const Donations = lazyWithRetry(() => import('../pages/public/Donations'));
const About = lazyWithRetry(() => import('../pages/public/About'));
const MinistriesOverview = lazyWithRetry(() => import('../pages/public/MinistriesOverview'));
const MinistryDetail = lazyWithRetry(() => import('../pages/public/MinistryDetail'));
const Sermons = lazyWithRetry(() => import('../pages/public/Sermons'));
const Contact = lazyWithRetry(() => import('../pages/public/Contact'));
const Events = lazyWithRetry(() => import('../pages/public/Events'));
const Petitions = lazyWithRetry(() => import('../pages/public/Petitions'));
const SongsLibrary = lazyWithRetry(() => import('../pages/public/SongsLibrary'));
const ProgramsOverview = lazyWithRetry(() => import('../pages/public/ProgramsOverview'));
const CertificateViewer = lazyWithRetry(() => import('../pages/lms/CertificateViewer'));
const VirtualClassroomLanding = lazyWithRetry(() => import('../pages/public/VirtualClassroomLanding'));
const Presentation = lazyWithRetry(() => import('../pages/public/Presentation').then(m => ({ default: m.Presentation })));
const ProgramDetail = lazyWithRetry(() => import('../pages/public/ProgramDetail'));
const MyPurchases = lazyWithRetry(() => import('../pages/public/MyPurchases'));
const SundaySchool = lazyWithRetry(() => import('../pages/public/SundaySchool'));
const ReadingPlan = lazyWithRetry(() => import('../pages/public/ReadingPlan'));
const SermonDetail = lazyWithRetry(() => import('../pages/public/SermonDetail'));
const Birthdays = lazyWithRetry(() => import('../pages/public/Birthdays'));
const Bible = lazyWithRetry(() => import('../pages/public/Bible'));
const CertificateVerification = lazyWithRetry(() => import('../pages/lms/CertificateVerification').then(m => ({ default: m.CertificateVerification })));
const GamesHub = lazyWithRetry(() => import('../pages/public/GamesHub').then(m => ({ default: m.GamesHub })));
const Biblionario = lazyWithRetry(() => import('../pages/public/games/Biblionario').then(m => ({ default: m.Biblionario })));
const Hangman = lazyWithRetry(() => import('../pages/public/games/Hangman').then(m => ({ default: m.Hangman })));
const MemoryMatch = lazyWithRetry(() => import('../pages/public/games/MemoryMatch').then(m => ({ default: m.MemoryMatch })));
const VolunteerSchedule = lazyWithRetry(() => import('../pages/public/VolunteerSchedule'));
const Bookings = lazyWithRetry(() => import('../pages/public/Bookings'));
const Missions = lazyWithRetry(() => import('../pages/public/Missions'));

// --- LMS PAGES ---
const Checkout = lazyWithRetry(() => import('../pages/public/Checkout'));
const OrderSuccess = lazyWithRetry(() => import('../pages/public/OrderSuccess'));
const StudentDashboard = lazyWithRetry(() => import('../pages/lms/StudentDashboard'));
const TeacherDashboard = lazyWithRetry(() => import('../pages/lms/TeacherDashboard'));
const LMSAcademicAdmin = lazyWithRetry(() => import('../pages/lms/LMSAcademicAdmin'));
const DirectorDashboard = lazyWithRetry(() => import('../pages/lms/DirectorDashboard'));
const CourseViewer = lazyWithRetry(() => import('../pages/lms/CourseViewer'));

// --- ADMIN PAGES ---
const DashboardHome = lazyWithRetry(() => import('../pages/admin/DashboardHome'));
const SermonsManager = lazyWithRetry(() => import('../pages/admin/SermonsManager'));
const FinanceDashboard = lazyWithRetry(() => import('../pages/admin/FinanceDashboard'));
const StoreManager = lazyWithRetry(() => import('../pages/admin/StoreManager'));
const StoreSettings = lazyWithRetry(() => import('../pages/admin/StoreSettings'));
const OrdersManager = lazyWithRetry(() => import('../pages/admin/OrdersManager'));
const MinistryManager = lazyWithRetry(() => import('../pages/admin/MinistryManager'));
const MinistryDashboard = lazyWithRetry(() => import('../pages/admin/MinistryDashboard'));
const MissionsManager = lazyWithRetry(() => import('../pages/admin/MissionsManager'));
const VolunteersManager = lazyWithRetry(() => import('../pages/admin/VolunteersManager'));
const BookingManager = lazyWithRetry(() => import('../pages/admin/BookingManager'));
const LogosManager = lazyWithRetry(() => import('../pages/admin/LogosManager'));
const UsersManager = lazyWithRetry(() => import('../pages/admin/UsersManager'));
const SettingsManager = lazyWithRetry(() => import('../pages/admin/SettingsManager'));
const AdminSettings = lazyWithRetry(() => import('../pages/admin/Settings/AdminSettings'));
const MembersManager = lazyWithRetry(() => import('../pages/admin/MembersManager'));
const EventsManager = lazyWithRetry(() => import('../pages/admin/EventsManager'));
const StrategicMap = lazyWithRetry(() => import('../pages/admin/StrategicMap'));
const PageEditor = lazyWithRetry(() => import('../pages/admin/PageEditor'));
const AnalyticsDashboard = lazyWithRetry(() => import('../pages/admin/AnalyticsDashboard'));
const NotificationsManager = lazyWithRetry(() => import('../pages/admin/NotificationsManager'));
const PetitionsManager = lazyWithRetry(() => import('../pages/admin/PetitionsManager'));
const SongsManager = lazyWithRetry(() => import('../pages/admin/SongsManager'));
const LMSManager = lazyWithRetry(() => import('../pages/admin/LMSManager'));
const LMSLandingEditor = lazyWithRetry(() => import('../pages/admin/LMSLandingEditor'));
const LMSAnalyticsDashboard = lazyWithRetry(() => import('../pages/admin/LMSAnalyticsDashboard'));
const CourseBuilder = lazyWithRetry(() => import('../pages/admin/CourseBuilder'));
const LMSCourseSettings = lazyWithRetry(() => import('../pages/admin/LMSCourseSettings'));
const LMSGradebook = lazyWithRetry(() => import('../pages/admin/LMSGradebook'));
const ChatManager = lazyWithRetry(() => import('../pages/admin/ChatManager'));
const OpenResourcesManager = lazyWithRetry(() => import('../pages/admin/OpenResourcesManager'));
const ComponentStylesManager = lazyWithRetry(() => import('../pages/admin/ComponentStylesManager'));
const ComponentLibrary = lazyWithRetry(() => import('../pages/admin/ComponentLibrary'));
const OpenResourceBuilder = lazyWithRetry(() => import('../pages/admin/OpenResourceBuilder'));
const PluginManager = lazyWithRetry(() => import('../pages/admin/PluginManager'));
const ProductionBoard = lazyWithRetry(() => import('../pages/admin/ProductionBoard'));
const MediaVault = lazyWithRetry(() => import('../pages/admin/MediaVault'));
const InventoryManager = lazyWithRetry(() => import('../pages/admin/InventoryManager'));
const AnimationCatalog = lazyWithRetry(() => import('../pages/admin/AnimationCatalog'));
const PresentationEditor = lazyWithRetry(() => import('../pages/admin/PresentationEditor').then(m => ({ default: m.PresentationEditor })));
const GamesManager = lazyWithRetry(() => import('../pages/admin/GamesManager').then(m => ({ default: m.GamesManager })));
const BiblionarioEditor = lazyWithRetry(() => import('../pages/admin/games/BiblionarioEditor').then(m => ({ default: m.BiblionarioEditor })));
const HangmanEditor = lazyWithRetry(() => import('../pages/admin/games/HangmanEditor').then(m => ({ default: m.HangmanEditor })));
const MemoryEditor = lazyWithRetry(() => import('../pages/admin/games/MemoryEditor').then(m => ({ default: m.MemoryEditor })));
const AudioLibrary = lazyWithRetry(() => import('../pages/admin/games/AudioLibrary').then(m => ({ default: m.AudioLibrary })));
const DesignCatalog = lazyWithRetry(() => import('../pages/admin/DesignCatalog'));
const CertificatesManager = lazyWithRetry(() => import('../pages/admin/CertificatesManager'));

export default function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
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
          <Route path="/misiones" element={<Missions />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/peticiones" element={<Petitions />} />
          <Route path="/recursos/alabanzas" element={<SongsLibrary />} />
          <Route path="/programas" element={<ProgramsOverview />} />
          <Route path="/programas/:id" element={<ProgramDetail />} />
          <Route path="/aula-virtual" element={<VirtualClassroomLanding />} />
          <Route path="/certificados/:id" element={<CertificateViewer />} />
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
          <Route path="/mi-horario" element={<VolunteerSchedule />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/cert-verify/:hash" element={<CertificateVerification />} />
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
            <Route path="/lms/admin" element={<LMSAcademicAdmin />} />
            <Route path="/lms/director" element={<DirectorDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
          </Route>
          
          <Route element={<AdminLayout />}>
            <Route path="/admin/lms/course/settings/:id" element={<LMSCourseSettings />} />
            <Route path="/admin/lms/course/:id" element={<CourseBuilder />} />
            <Route path="/admin/lms/gradebook/:id" element={<LMSGradebook />} />
          </Route>

          <Route path="/lms/curso/:id" element={<CourseViewer />} />
        </Route>

        {/* Protected Admin Modules */}
        <Route element={<ProtectedRoute module="production" />}><Route element={<AdminLayout />}><Route path="/admin/produccion" element={<ProductionBoard />} /></Route></Route>
        <Route element={<ProtectedRoute module="media_vault" />}><Route element={<AdminLayout />}><Route path="/admin/media-vault" element={<MediaVault />} /></Route></Route>
        <Route element={<ProtectedRoute module="ministries" />}><Route element={<AdminLayout />}>
          <Route path="/admin/ministerios" element={<MinistryManager />} />
          <Route path="/admin/ministerios/:id" element={<MinistryDashboard />} />
        </Route></Route>
        <Route element={<ProtectedRoute module="logos" />}><Route element={<AdminLayout />}><Route path="/admin/logos" element={<LogosManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="events" />}><Route element={<AdminLayout />}><Route path="/admin/eventos" element={<EventsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="missions" />}><Route element={<AdminLayout />}><Route path="/admin/misiones" element={<MissionsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="volunteering" />}><Route element={<AdminLayout />}><Route path="/admin/voluntariado" element={<VolunteersManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="bookings" />}><Route element={<AdminLayout />}><Route path="/admin/reservas" element={<BookingManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="members" />}><Route element={<AdminLayout />}><Route path="/admin/miembros" element={<MembersManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="certificates" />}><Route element={<AdminLayout />}><Route path="/admin/certificados" element={<CertificatesManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="map" />}><Route element={<AdminLayout />}><Route path="/admin/mapa-estrategico" element={<StrategicMap />} /></Route></Route>
        <Route element={<ProtectedRoute module="notifications" />}><Route element={<AdminLayout />}><Route path="/admin/notificaciones" element={<NotificationsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="sermons" />}><Route element={<AdminLayout />}><Route path="/admin/sermones" element={<SermonsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="songs" />}><Route element={<AdminLayout />}><Route path="/admin/alabanzas" element={<SongsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="programs" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/lms" element={<LMSManager />} />
            <Route path="/admin/lms/matriculas" element={<LMSManager />} />
            <Route path="/admin/lms/landing-editor" element={<LMSLandingEditor />} />
            <Route path="/admin/lms/analytics" element={<LMSAnalyticsDashboard />} />
            <Route path="/admin/recursos-abiertos" element={<OpenResourcesManager />} />
            <Route path="/admin/recursos-abiertos/:id" element={<OpenResourceBuilder />} />
            <Route path="/admin/juegos" element={<GamesManager />} />
            <Route path="/admin/juegos/audio-library" element={<AudioLibrary />} />
            <Route path="/admin/juegos/quien-quiere-ser-biblionario" element={<BiblionarioEditor />} />
            <Route path="/admin/juegos/ahorcado-biblico" element={<HangmanEditor />} />
            <Route path="/admin/juegos/memorama-biblico" element={<MemoryEditor />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="diseno" />}><Route element={<AdminLayout />}><Route path="/admin/presentacion" element={<PresentationEditor />} /></Route></Route>
        <Route element={<ProtectedRoute module="pages" />}><Route element={<AdminLayout />}><Route path="/admin/paginas" element={<PageEditor />} /></Route></Route>
        <Route element={<ProtectedRoute module="analytics" />}><Route element={<AdminLayout />}><Route path="/admin/analisis" element={<AnalyticsDashboard />} /></Route></Route>
        <Route element={<ProtectedRoute module="finances" />}><Route element={<AdminLayout />}><Route path="/admin/finanzas" element={<FinanceDashboard />} /></Route></Route>
        <Route element={<ProtectedRoute module="products" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/productos" element={<StoreManager />} />
            <Route path="/admin/ordenes" element={<OrdersManager />} />
            <Route path="/admin/pagos-envios" element={<StoreSettings />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="settings" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/configuracion" element={<SettingsManager />} />
            <Route path="/admin/extensiones" element={<PluginManager />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="appearance" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/apariencia" element={<AdminSettings />} />
            <Route path="/admin/componentes" element={<ComponentLibrary />} />
            <Route path="/admin/estilos" element={<ComponentStylesManager />} />
            <Route path="/admin/apariencia/botones" element={<ComponentStylesManager />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="users" />}><Route element={<AdminLayout />}><Route path="/admin/usuarios" element={<UsersManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="petitions" />}><Route element={<AdminLayout />}><Route path="/admin/peticiones" element={<PetitionsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="chat" />}><Route element={<AdminLayout />}><Route path="/admin/chat" element={<ChatManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="inventory" />}><Route element={<AdminLayout />}><Route path="/admin/inventario" element={<InventoryManager />} /></Route></Route>
      </Routes>
    </Suspense>
  );
}
