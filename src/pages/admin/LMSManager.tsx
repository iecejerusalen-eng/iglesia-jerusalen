import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  DoorOpen,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  PanelLeftClose,
  Plus,
  Settings,
  UserCheck,
  Users,
} from 'lucide-react';

import { useCourses } from '../../features/lms/hooks/useCourses';
import { useCategories, type CategoryItem } from '../../features/lms/hooks/useCategories';
import { useEnrollmentRequests } from '../../features/lms/hooks/useEnrollmentRequests';
import { CoursesList } from '../../features/lms/components/CoursesList';
import { CategoriesList } from '../../features/lms/components/CategoriesList';
import { CategoryForm } from '../../features/lms/components/CategoryForm';
import { EnrollmentRequestsList } from '../../features/lms/components/EnrollmentRequestsList';
import { LMSDefaultsForm } from '../../features/lms/components/LMSDefaultsForm';
import { AcademicStaffManager } from '../../features/lms/components/AcademicStaffManager';
import { UniversityCalendar } from '../../features/lms/components/UniversityCalendar';
import { SchoolManager } from '../../features/lms/components/SchoolManager';
import { SchoolSelector } from '../../features/lms/components/SchoolSelector';
import { ParticipantsTable } from '../../features/lms/components/ParticipantsTable';
import { LMSAnalytics } from '../../features/lms/components/LMSAnalytics';
import { SchoolAccessRequestsManager } from '../../features/lms/components/SchoolAccessRequestsManager';
import { LMSAdminOverview, type LMSAdminDestination } from '../../features/lms/components/LMSAdminOverview';

type LMSAdminTab = 'overview' | LMSAdminDestination;

interface NavigationItem {
  id: LMSAdminTab;
  label: string;
  description: string;
  icon: typeof BookOpen;
  badge?: number;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const VALID_TABS = new Set<LMSAdminTab>([
  'overview', 'schools', 'school-access', 'courses', 'categories', 'requests',
  'participants', 'analytics', 'defaults', 'staff', 'calendar',
]);

export default function LMSManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSchoolId, setSelectedSchoolId] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem> | null>(null);

  const { courses, isLoading: loadingCourses } = useCourses();
  const { isLoading: loadingCategories } = useCategories();
  const { requests, isLoading: loadingRequests } = useEnrollmentRequests();

  const requestedTab = searchParams.get('tab');
  const legacyTab: LMSAdminTab = location.pathname.includes('matriculas') ? 'school-access' : 'overview';
  const activeTab: LMSAdminTab = requestedTab && VALID_TABS.has(requestedTab as LMSAdminTab)
    ? requestedTab as LMSAdminTab
    : legacyTab;

  const visibleCourses = useMemo(
    () => selectedSchoolId === 'all' ? courses : courses.filter(course => course.school_id === selectedSchoolId),
    [courses, selectedSchoolId],
  );
  const filteredRequests = useMemo(
    () => selectedSchoolId === 'all' ? requests : requests.filter(request => request.lms_courses?.school_id === selectedSchoolId),
    [requests, selectedSchoolId],
  );

  const navigationGroups: NavigationGroup[] = [
    {
      label: 'Centro académico',
      items: [
        { id: 'overview', label: 'Resumen', description: 'Estado y tareas prioritarias', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Estructura educativa',
      items: [
        { id: 'schools', label: 'Escuelas y niveles', description: 'Edades, rangos y paralelos', icon: Building2 },
        { id: 'courses', label: 'Cursos', description: 'Currículo y contenidos', icon: BookOpen },
        { id: 'categories', label: 'Categorías', description: 'Clasificación académica', icon: FolderOpen },
        { id: 'calendar', label: 'Calendario', description: 'Sesiones y actividades', icon: Calendar },
      ],
    },
    {
      label: 'Personas y acceso',
      items: [
        { id: 'school-access', label: 'Acceso a escuelas', description: 'Solicitudes y admisión', icon: DoorOpen },
        { id: 'requests', label: 'Matrículas a cursos', description: 'Inscripciones pendientes', icon: Inbox, badge: filteredRequests.length },
        { id: 'participants', label: 'Participantes', description: 'Estudiantes y miembros', icon: Users },
        { id: 'staff', label: 'Docentes y turnos', description: 'Carga y horarios', icon: UserCheck },
      ],
    },
    {
      label: 'Control y configuración',
      items: [
        { id: 'analytics', label: 'Analíticas', description: 'Rendimiento académico', icon: BarChart3 },
        { id: 'defaults', label: 'Configuración', description: 'Escalas y formatos', icon: Settings },
      ],
    },
  ];

  const allNavigationItems = navigationGroups.flatMap(group => group.items);
  const currentNavigationItem = allNavigationItems.find(item => item.id === activeTab) ?? allNavigationItems[0];

  const changeTab = (tab: LMSAdminTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') nextParams.delete('tab');
    else nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  };

  const openCategoryModal = (category?: CategoryItem) => {
    setEditingCategory(category ?? null);
    setIsCategoryModalOpen(true);
  };

  const isCurrentTabLoading = (
    (activeTab === 'courses' && loadingCourses)
    || (activeTab === 'categories' && loadingCategories)
    || (activeTab === 'requests' && loadingRequests)
  );

  const renderPrimaryAction = () => {
    if (activeTab === 'courses' || activeTab === 'overview') {
      return (
        <button onClick={() => navigate('/admin/lms/course/settings/new')} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/15 transition hover:-translate-y-0.5 hover:bg-amber-300">
          <Plus size={18} /> Nuevo curso
        </button>
      );
    }
    if (activeTab === 'categories') {
      return (
        <button onClick={() => openCategoryModal()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/15 transition hover:-translate-y-0.5 hover:bg-amber-300">
          <Plus size={18} /> Nueva categoría
        </button>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-3 sm:p-5 lg:p-7">
      <header className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70 sm:p-7">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-900 p-3 text-amber-300 shadow-lg sm:block">
              <BookOpen size={27} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">Administración académica</span>
                <span className="text-xs text-slate-400">Aula Virtual</span>
              </div>
              <h1 className="mt-2 font-sans text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">{currentNavigationItem.label}</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{currentNavigationItem.description}. El contenido visible respeta el alcance autorizado para tu cuenta.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SchoolSelector value={selectedSchoolId} onChange={setSelectedSchoolId} className="w-full sm:w-auto" />
            {renderPrimaryAction()}
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.75rem] border border-slate-200/70 bg-white/75 p-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70 lg:block">
          <div className="mb-3 flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Herramientas</span>
            <PanelLeftClose size={16} className="text-slate-400" />
          </div>
          <nav aria-label="Herramientas de administración del Aula Virtual" className="space-y-5">
            {navigationGroups.map(group => (
              <div key={group.label}>
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">{group.label}</p>
                <div className="mt-2 space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button key={item.id} onClick={() => changeTab(item.id)} aria-current={active ? 'page' : undefined} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? 'bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}>
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-amber-300 text-slate-950' : 'bg-slate-100 text-slate-500 group-hover:text-indigo-600 dark:bg-white/5 dark:text-slate-400'}`}><Icon size={17} /></span>
                        <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.label}</strong><span className={`mt-0.5 block truncate text-[10px] ${active ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>{item.description}</span></span>
                        {typeof item.badge === 'number' && item.badge > 0 && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-slate-950">{item.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-5 space-y-2 border-t border-slate-200/70 p-3 pt-5 dark:border-white/10">
            <button onClick={() => navigate('/admin/lms/landing-editor')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:text-slate-300">Editar portada pública</button>
            <button onClick={() => navigate('/admin/programas')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:text-slate-300">Administrar Programas de Estudios</button>
          </div>
        </aside>

        <main className="mt-5 min-w-0 lg:mt-0">
          <div className="mb-4 rounded-2xl border border-slate-200/70 bg-white/75 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:hidden">
            <label htmlFor="lms-admin-mobile-nav" className="mb-2 block text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">Sección administrativa</label>
            <select id="lms-admin-mobile-nav" value={activeTab} onChange={event => changeTab(event.target.value as LMSAdminTab)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white">
              {navigationGroups.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map(item => <option key={item.id} value={item.id}>{item.label}{item.badge ? ` (${item.badge})` : ''}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {isCurrentTabLoading ? (
            <div className="grid min-h-72 place-items-center rounded-[2rem] border border-slate-200/70 bg-white/75 dark:border-white/10 dark:bg-slate-950/70">
              <div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-amber-400" /><p className="mt-3 text-sm text-slate-500">Sincronizando información académica…</p></div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'overview' && <LMSAdminOverview selectedSchoolId={selectedSchoolId} courses={visibleCourses} pendingCourseRequests={filteredRequests.length} onNavigate={changeTab} onCreateCourse={() => navigate('/admin/lms/course/settings/new')} />}
              {activeTab === 'schools' && <SchoolManager />}
              {activeTab === 'courses' && <CoursesList courses={visibleCourses} onEditCourse={course => { if (course) navigate(`/admin/lms/course/settings/${course.id}`); }} />}
              {activeTab === 'categories' && <CategoriesList selectedSchoolId={selectedSchoolId} onEditCategory={openCategoryModal} />}
              {activeTab === 'school-access' && <SchoolAccessRequestsManager schoolId={selectedSchoolId} />}
              {activeTab === 'requests' && <EnrollmentRequestsList selectedSchoolId={selectedSchoolId} />}
              {activeTab === 'participants' && (
                <div className="space-y-5"><div><h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Directorio de participantes</h2><p className="mt-1 text-sm text-slate-500">Matrículas, estudiantes y docentes dentro de la escuela seleccionada.</p></div><ParticipantsTable schoolId={selectedSchoolId} /></div>
              )}
              {activeTab === 'staff' && <AcademicStaffManager schoolId={selectedSchoolId} />}
              {activeTab === 'calendar' && <UniversityCalendar role="admin" schoolId={selectedSchoolId} editable />}
              {activeTab === 'analytics' && <LMSAnalytics schoolId={selectedSchoolId} />}
              {activeTab === 'defaults' && <LMSDefaultsForm />}
            </div>
          )}
        </main>
      </div>

      {isCategoryModalOpen && (
        <CategoryForm editingCategory={editingCategory} onClose={() => setIsCategoryModalOpen(false)} />
      )}
    </div>
  );
}
