import React, { Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import ProtectedRoute from '../components/common/ProtectedRoute';
import { PageSkeleton } from '../components/common/Skeletons';
import { lazyWithRetry } from '../utils/lazyWithRetry';

// Los layouts cargan navegación, búsqueda y herramientas globales. Mantenerlos
// fuera del bundle del router evita descargar el panel administrativo al visitar
// una página pública desde un móvil.
const PublicLayout = lazyWithRetry(() => import('../layouts/PublicLayout'));
const AdminLayout = lazyWithRetry(() => import('../layouts/AdminLayout'));

// --- PUBLIC PAGES ---
const Home = lazyWithRetry(() => import('../pages/public/Home'));
const PlanYourVisit = lazyWithRetry(() => import('../pages/public/PlanYourVisit'));
const Login = lazyWithRetry(() => import('../pages/auth/Login'));
const Store = lazyWithRetry(() => import('../pages/public/Store'));
const Cart = lazyWithRetry(() => import('../pages/public/Cart'));
const Donations = lazyWithRetry(() => import('../pages/public/Donations'));
const About = lazyWithRetry(() => import('../pages/public/About'));
const MinistriesOverview = lazyWithRetry(() => import('../pages/public/MinistriesOverview'));
const MinistryDetail = lazyWithRetry(() => import('../pages/public/MinistryDetail'));
const MinistryPageDetail = lazyWithRetry(() => import('../pages/public/MinistryPageDetail'));
const Sermons = lazyWithRetry(() => import('../pages/public/Sermons'));
const Expositores = lazyWithRetry(() => import('../pages/public/Expositores'));
const Contact = lazyWithRetry(() => import('../pages/public/Contact'));
const Events = lazyWithRetry(() => import('../pages/public/Events'));
const ChurchAnnouncementsPage = lazyWithRetry(() => import('../pages/public/ChurchAnnouncementsPage'));
const Petitions = lazyWithRetry(() => import('../pages/public/Petitions'));
const SongsLibrary = lazyWithRetry(() => import('../pages/public/SongsLibrary'));
const ProgramsOverview = lazyWithRetry(() => import('../pages/public/ProgramsOverview'));
const CertificateViewer = lazyWithRetry(() => import('../pages/lms/CertificateViewer'));
const VirtualClassroomLanding = lazyWithRetry(() => import('../pages/public/VirtualClassroomLanding'));
const Presentation = lazyWithRetry(() => import('../pages/public/Presentation').then(m => ({ default: m.Presentation })));
const ProgramDetail = lazyWithRetry(() => import('../pages/public/ProgramDetail'));
const EditorialSpacePage = lazyWithRetry(() => import('../pages/public/EditorialSpacePage'));
const EditorialDocumentPage = lazyWithRetry(() => import('../pages/public/EditorialDocumentPage'));
const PublicationsHub = lazyWithRetry(() => import('../pages/public/PublicationsHub'));
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
const GuessCharacter = lazyWithRetry(() => import('../pages/public/games/GuessCharacter').then(m => ({ default: m.GuessCharacter })));
const VolunteerSchedule = lazyWithRetry(() => import('../pages/public/VolunteerSchedule'));
const Bookings = lazyWithRetry(() => import('../pages/public/Bookings'));
const Missions = lazyWithRetry(() => import('../pages/public/Missions'));
const MissionExplorer = lazyWithRetry(() => import('../pages/public/MissionExplorer'));
const Terms = lazyWithRetry(() => import('../pages/public/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazyWithRetry(() => import('../pages/public/Privacy').then(m => ({ default: m.Privacy })));
const CrmOnboarding = lazyWithRetry(() => import('../pages/public/CrmOnboarding'));
const Podcast = lazyWithRetry(() => import('../pages/public/Podcast'));
const PodcastManager = lazyWithRetry(() => import('../pages/admin/PodcastManager'));
const CommunityFeed = lazyWithRetry(() => import('../pages/public/CommunityFeed'));
const DynamicFormRenderer = lazyWithRetry(() => import('../pages/public/DynamicFormRenderer'));
const LiveStream = lazyWithRetry(() => import('../pages/public/LiveStream'));
const FamiliesManager = lazyWithRetry(() => import('../pages/admin/FamiliesManager'));
const ChildCheckInKiosk = lazyWithRetry(() => import('../pages/admin/ChildCheckInKiosk'));
const FormBuilderManager = lazyWithRetry(() => import('../pages/admin/FormBuilderManager'));
const PredictiveEngagementDashboard = lazyWithRetry(() => import('../pages/admin/PredictiveEngagementDashboard'));
const CampusManager = lazyWithRetry(() => import('../pages/admin/CampusManager'));
const CrmPipelineManager = lazyWithRetry(() => import('../pages/admin/CrmPipelineManager'));
const WorkflowsManager = lazyWithRetry(() => import('../pages/admin/WorkflowsManager'));
const CampaignsManager = lazyWithRetry(() => import('../pages/admin/CampaignsManager'));
const GroupsManager = lazyWithRetry(() => import('../pages/admin/GroupsManager'));
const QRCheckInKiosk = lazyWithRetry(() => import('../features/checkin/components/QRCheckInKiosk').then(m => ({ default: m.QRCheckInKiosk })));

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
const SpeakersManager = lazyWithRetry(() => import('../pages/admin/SpeakersManager'));
const FinanceDashboard = lazyWithRetry(() => import('../pages/admin/FinanceDashboard'));
const DonationPageManager = lazyWithRetry(() => import('../pages/admin/DonationPageManager'));
const StoreManager = lazyWithRetry(() => import('../pages/admin/StoreManager'));
const PointOfSaleManager = lazyWithRetry(() => import('../pages/admin/PointOfSaleManager'));
const StoreSettings = lazyWithRetry(() => import('../pages/admin/StoreSettings'));
const OrdersManager = lazyWithRetry(() => import('../pages/admin/OrdersManager'));
const MinistryManager = lazyWithRetry(() => import('../pages/admin/MinistryManager'));
const MinistryDashboard = lazyWithRetry(() => import('../pages/admin/MinistryDashboard'));
const MissionsManager = lazyWithRetry(() => import('../pages/admin/MissionsManager'));
const VolunteersManager = lazyWithRetry(() => import('../pages/admin/VolunteersManager'));
const BookingManager = lazyWithRetry(() => import('../pages/admin/BookingManager'));
const CredentialsVault = lazyWithRetry(() => import('../pages/admin/CredentialsVault'));
const LogosManager = lazyWithRetry(() => import('../pages/admin/LogosManager'));
const UsersManager = lazyWithRetry(() => import('../pages/admin/UsersManager'));
const SettingsManager = lazyWithRetry(() => import('../pages/admin/SettingsManager'));
const AdminSettings = lazyWithRetry(() => import('../pages/admin/Settings/AdminSettings'));
const MembersManager = lazyWithRetry(() => import('../pages/admin/MembersManager'));
const EventsManager = lazyWithRetry(() => import('../pages/admin/EventsManager'));
const ChurchAnnouncementsManager = lazyWithRetry(() => import('../pages/admin/ChurchAnnouncementsManager'));
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
const StudyProgramsManager = lazyWithRetry(() => import('../pages/admin/StudyProgramsManager'));
const StudyProgramBuilder = lazyWithRetry(() => import('../pages/admin/StudyProgramBuilder'));
const EditorialManager = lazyWithRetry(() => import('../pages/admin/EditorialManager'));
const EditorialWorkspace = lazyWithRetry(() => import('../pages/admin/EditorialWorkspace'));
const PluginManager = lazyWithRetry(() => import('../pages/admin/PluginManager'));
const MenuManager = lazyWithRetry(() => import('../pages/admin/MenuManager'));
const ProductionBoard = lazyWithRetry(() => import('../pages/admin/ProductionBoard'));
const ProPresenterManager = lazyWithRetry(() => import('../pages/admin/ProPresenterManager'));
const HolyricsConnectionManager = lazyWithRetry(() => import('../pages/admin/HolyricsConnectionManager'));
const MediaVault = lazyWithRetry(() => import('../pages/admin/MediaVault'));
const InventoryManager = lazyWithRetry(() => import('../pages/admin/InventoryManager'));
const AnimationCatalog = lazyWithRetry(() => import('../pages/admin/AnimationCatalog'));
const PresentationEditor = lazyWithRetry(() => import('../pages/admin/PresentationEditor').then(m => ({ default: m.PresentationEditor })));
const GamesManager = lazyWithRetry(() => import('../pages/admin/GamesManager').then(m => ({ default: m.GamesManager })));
const BiblionarioEditor = lazyWithRetry(() => import('../pages/admin/games/BiblionarioEditor').then(m => ({ default: m.BiblionarioEditor })));
const HangmanEditor = lazyWithRetry(() => import('../pages/admin/games/HangmanEditor').then(m => ({ default: m.HangmanEditor })));
const MemoryEditor = lazyWithRetry(() => import('../pages/admin/games/MemoryEditor').then(m => ({ default: m.MemoryEditor })));
const GuessCharacterEditor = lazyWithRetry(() => import('../pages/admin/games/GuessCharacterEditor').then(m => ({ default: m.GuessCharacterEditor })));
const AudioLibrary = lazyWithRetry(() => import('../pages/admin/games/AudioLibrary').then(m => ({ default: m.AudioLibrary })));
const DesignCatalog = lazyWithRetry(() => import('../pages/admin/DesignCatalog'));
const CertificatesManager = lazyWithRetry(() => import('../pages/admin/CertificatesManager'));
const CrmSubmissions = lazyWithRetry(() => import('../pages/admin/CrmSubmissions'));
const ContentHub = lazyWithRetry(() => import('../pages/admin/ContentHub'));
const ContactInbox = lazyWithRetry(() => import('../pages/admin/ContactInbox'));
const AuditLogViewer = lazyWithRetry(() => import('../pages/admin/AuditLogViewer'));
const SchedulesManager = lazyWithRetry(() => import('../pages/admin/SchedulesManager'));
const WorshipPlanner = lazyWithRetry(() => import('../pages/admin/WorshipPlanner'));
const DiscipleshipManager = lazyWithRetry(() => import('../pages/admin/DiscipleshipManager'));
const AdminNotFound = lazyWithRetry(() => import('../pages/admin/AdminNotFound'));

export default function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/presentacion" element={<Presentation />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/visita" element={<PlanYourVisit />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tienda" element={<Store />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/ministerios" element={<MinistriesOverview />} />
          <Route path="/ministerios/:slug" element={<MinistryDetail />} />
          <Route path="/ministerios/:slug/*" element={<MinistryPageDetail />} />
          <Route path="/predicas" element={<Sermons />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="/expositores" element={<Expositores />} />
          <Route path="/misiones" element={<Missions />} />
          <Route path="/misiones/:section" element={<MissionExplorer />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/terminos" element={<Terms />} />
          <Route path="/privacidad" element={<Privacy />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/anuncios" element={<ChurchAnnouncementsPage />} />
          <Route path="/peticiones" element={<Petitions />} />
          <Route path="/recursos/alabanzas" element={<SongsLibrary />} />
          <Route path="/recursos/alabanzas/:songSlug" element={<SongsLibrary />} />
          <Route path="/programas" element={<ProgramsOverview />} />
          <Route path="/programas/:id" element={<ProgramDetail />} />
          <Route path="/publicaciones" element={<PublicationsHub />} />
          <Route path="/publicaciones/:spaceSlug" element={<EditorialSpacePage />} />
          <Route path="/publicaciones/:spaceSlug/:documentId" element={<EditorialDocumentPage />} />
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
          <Route path="/recursos/juegos/descubre-el-personaje" element={<GuessCharacter />} />
          <Route path="/mi-horario" element={<VolunteerSchedule />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/comunidad" element={<CommunityFeed />} />
          <Route path="/en-vivo" element={<LiveStream />} />
          <Route path="/formularios/:formId" element={<DynamicFormRenderer />} />
          <Route path="/cert-verify/:hash" element={<CertificateVerification />} />
        </Route>
        
        {/* Hidden Public Route */}
        <Route path="/registro-miembro/ingreso" element={<CrmOnboarding />} />

        <Route element={<ProtectedRoute module="dashboard" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardHome />} />
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
          <Route path="/lms/curso/:id" element={<CourseViewer />} />
        </Route>

        <Route element={<ProtectedRoute module="programs" />}>
          <Route element={<PublicLayout />}>
            <Route path="/lms/admin" element={<LMSAcademicAdmin />} />
          </Route>
          
          <Route element={<AdminLayout />}>
            <Route path="/admin/lms/course/settings/:id" element={<LMSCourseSettings />} />
            <Route path="/admin/lms/course/:id" element={<CourseBuilder />} />
            <Route path="/admin/lms/gradebook/:id" element={<LMSGradebook />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute module="lms_director" />}>
          <Route element={<PublicLayout />}>
            <Route path="/lms/director" element={<DirectorDashboard />} />
          </Route>
        </Route>

        {/* Protected Admin Modules */}
        <Route element={<ProtectedRoute module="production" />}><Route element={<AdminLayout />}><Route path="/admin/produccion" element={<ProductionBoard />} /></Route></Route>
        <Route element={<ProtectedRoute module="propresenter" />}><Route element={<AdminLayout />}><Route path="/admin/propresenter" element={<ProPresenterManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="production" />}><Route element={<AdminLayout />}><Route path="/admin/holyrics" element={<HolyricsConnectionManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="media_vault" />}><Route element={<AdminLayout />}><Route path="/admin/media-vault" element={<MediaVault />} /></Route></Route>
        <Route element={<ProtectedRoute module="ministries" />}><Route element={<AdminLayout />}>
          <Route path="/admin/ministerios" element={<MinistryManager />} />
          <Route path="/admin/ministerios/:id" element={<MinistryDashboard />} />
        </Route></Route>
        <Route element={<ProtectedRoute module="logos" />}><Route element={<AdminLayout />}><Route path="/admin/logos" element={<LogosManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="events" />}><Route element={<AdminLayout />}><Route path="/admin/eventos" element={<EventsManager />} /><Route path="/admin/horarios" element={<SchedulesManager />} /><Route path="/admin/tiempo-de-culto" element={<WorshipPlanner />} /></Route></Route>
        <Route element={<ProtectedRoute module="missions" />}><Route element={<AdminLayout />}><Route path="/admin/misiones" element={<MissionsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="volunteering" />}><Route element={<AdminLayout />}><Route path="/admin/voluntariado" element={<VolunteersManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="bookings" />}><Route element={<AdminLayout />}><Route path="/admin/reservas" element={<BookingManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="credentials_vault" />}><Route element={<AdminLayout />}><Route path="/admin/boveda-credenciales" element={<CredentialsVault />} /></Route></Route>
        <Route element={<ProtectedRoute module="members" />}><Route element={<AdminLayout />}>
          <Route path="/admin/miembros" element={<MembersManager />} />
          <Route path="/admin/solicitudes" element={<CrmSubmissions />} />
        </Route></Route>
        <Route element={<ProtectedRoute module="crm_pipeline" />}><Route element={<AdminLayout />}><Route path="/admin/crm-pipeline" element={<CrmPipelineManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="workflows_automations" />}><Route element={<AdminLayout />}><Route path="/admin/automatizaciones" element={<WorkflowsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="mass_campaigns" />}><Route element={<AdminLayout />}><Route path="/admin/campanas" element={<CampaignsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="small_groups_admin" />}><Route element={<AdminLayout />}><Route path="/admin/grupos" element={<GroupsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="checkin_kiosk_admin" />}><Route element={<AdminLayout />}><Route path="/admin/checkin-kiosk" element={<QRCheckInKiosk />} /></Route></Route>
        <Route element={<ProtectedRoute module="certificates" />}><Route element={<AdminLayout />}><Route path="/admin/certificados" element={<CertificatesManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="map" />}><Route element={<AdminLayout />}><Route path="/admin/mapa-estrategico" element={<StrategicMap />} /></Route></Route>
        <Route element={<ProtectedRoute module="notifications" />}><Route element={<AdminLayout />}><Route path="/admin/notificaciones" element={<NotificationsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="sermons" />}><Route element={<AdminLayout />}><Route path="/admin/sermones" element={<SermonsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="podcast" />}><Route element={<AdminLayout />}><Route path="/admin/podcast" element={<PodcastManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="families" />}><Route element={<AdminLayout />}><Route path="/admin/familias" element={<FamiliesManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="child_checkin" />}><Route element={<AdminLayout />}><Route path="/admin/checkin-infantil" element={<ChildCheckInKiosk />} /></Route></Route>
        <Route element={<ProtectedRoute module="form_builder" />}><Route element={<AdminLayout />}><Route path="/admin/formularios" element={<FormBuilderManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="pastoral_health" />}><Route element={<AdminLayout />}><Route path="/admin/salud-pastoral" element={<PredictiveEngagementDashboard />} /></Route></Route>
        <Route element={<ProtectedRoute module="campuses" />}><Route element={<AdminLayout />}><Route path="/admin/sedes" element={<CampusManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="speakers" />}><Route element={<AdminLayout />}>
          <Route path="/admin/pastores" element={<SpeakersManager />} />
          <Route path="/admin/liderazgo" element={<Navigate to="/admin/pastores" replace />} />
        </Route></Route>
        <Route element={<ProtectedRoute module="songs" />}><Route element={<AdminLayout />}><Route path="/admin/alabanzas" element={<SongsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="programs" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/lms" element={<LMSManager />} />
            <Route path="/admin/lms/landing-editor" element={<LMSLandingEditor />} />
            <Route path="/admin/lms/analytics" element={<LMSAnalyticsDashboard />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="lms_enrollments" />}><Route element={<AdminLayout />}><Route path="/admin/lms/matriculas" element={<LMSManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="games" />}><Route element={<AdminLayout />}>
          <Route path="/admin/juegos" element={<GamesManager />} />
          <Route path="/admin/juegos/quien-quiere-ser-biblionario" element={<BiblionarioEditor />} />
          <Route path="/admin/juegos/ahorcado-biblico" element={<HangmanEditor />} />
          <Route path="/admin/juegos/memorama-biblico" element={<MemoryEditor />} />
          <Route path="/admin/juegos/descubre-el-personaje" element={<GuessCharacterEditor />} />
        </Route></Route>
        <Route element={<ProtectedRoute module="audio_library" />}><Route element={<AdminLayout />}><Route path="/admin/juegos/audio-library" element={<AudioLibrary />} /></Route></Route>
        <Route element={<ProtectedRoute module="study_programs" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/programas" element={<StudyProgramsManager />} />
            <Route path="/admin/programas/:id" element={<StudyProgramBuilder />} />
            <Route path="/admin/discipulado" element={<DiscipleshipManager />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="editorial" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/publicaciones" element={<EditorialManager />} />
            <Route path="/admin/publicaciones/:id" element={<EditorialWorkspace />} />
            <Route path="/admin/anuncios" element={<ChurchAnnouncementsManager />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="open_resources" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/recursos-abiertos" element={<OpenResourcesManager />} />
            <Route path="/admin/recursos-abiertos/:id" element={<OpenResourceBuilder />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="presentation_editor" />}><Route element={<AdminLayout />}><Route path="/admin/presentacion" element={<PresentationEditor />} /></Route></Route>
        <Route element={<ProtectedRoute module="design" />}><Route element={<AdminLayout />}><Route path="/admin/diseno" element={<DesignCatalog />} /></Route></Route>
        <Route element={<ProtectedRoute module="animations" />}><Route element={<AdminLayout />}><Route path="/admin/animaciones" element={<AnimationCatalog />} /></Route></Route>
        <Route element={<ProtectedRoute module="pages" />}><Route element={<AdminLayout />}><Route path="/admin/contenido" element={<ContentHub />} /><Route path="/admin/paginas" element={<PageEditor />} /></Route></Route>
        <Route element={<ProtectedRoute module="analytics" />}><Route element={<AdminLayout />}><Route path="/admin/analisis" element={<AnalyticsDashboard />} /></Route></Route>
        <Route element={<ProtectedRoute module="finances" />}><Route element={<AdminLayout />}><Route path="/admin/finanzas" element={<FinanceDashboard />} /><Route path="/admin/finanzas/donaciones" element={<DonationPageManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="products" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/productos" element={<StoreManager />} />
            <Route path="/admin/pos" element={<PointOfSaleManager />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="orders" />}><Route element={<AdminLayout />}><Route path="/admin/ordenes" element={<OrdersManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="store_settings" />}><Route element={<AdminLayout />}><Route path="/admin/pagos-envios" element={<StoreSettings />} /></Route></Route>
        <Route element={<ProtectedRoute module="settings" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/configuracion" element={<SettingsManager />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="plugins" />}><Route element={<AdminLayout />}><Route path="/admin/extensiones" element={<PluginManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="appearance" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/apariencia" element={<AdminSettings />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute module="menu_manager" />}><Route element={<AdminLayout />}><Route path="/admin/apariencia/menu" element={<MenuManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="components" />}><Route element={<AdminLayout />}><Route path="/admin/componentes" element={<ComponentLibrary />} /></Route></Route>
        <Route element={<ProtectedRoute module="button_studio" />}><Route element={<AdminLayout />}><Route path="/admin/estilos" element={<Navigate to="/admin/apariencia/botones" replace />} /><Route path="/admin/apariencia/botones" element={<ComponentStylesManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="users" />}><Route element={<AdminLayout />}><Route path="/admin/usuarios" element={<UsersManager />} /><Route path="/admin/actividad" element={<AuditLogViewer />} /></Route></Route>
        <Route element={<ProtectedRoute module="petitions" />}><Route element={<AdminLayout />}><Route path="/admin/peticiones" element={<PetitionsManager />} /></Route></Route>
        <Route element={<ProtectedRoute module="chat" />}><Route element={<AdminLayout />}><Route path="/admin/chat" element={<ChatManager />} /><Route path="/admin/buzon" element={<ContactInbox />} /></Route></Route>
        <Route element={<ProtectedRoute module="inventory" />}><Route element={<AdminLayout />}><Route path="/admin/inventario" element={<InventoryManager />} /></Route></Route>
        <Route element={<ProtectedRoute />}><Route element={<AdminLayout />}><Route path="/admin/*" element={<AdminNotFound />} /></Route></Route>
      </Routes>
    </Suspense>
  );
}
