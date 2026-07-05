import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, ArrowRight } from 'lucide-react';
import type { LMSCourse } from '../../types';

import { useCourses } from '../../features/lms/hooks/useCourses';
import { useCategories, type CategoryItem } from '../../features/lms/hooks/useCategories';
import { useEnrollmentRequests } from '../../features/lms/hooks/useEnrollmentRequests';

import { CoursesList } from '../../features/lms/components/CoursesList';
import { CourseForm } from '../../features/lms/components/CourseForm';
import { CategoriesList } from '../../features/lms/components/CategoriesList';
import { CategoryForm } from '../../features/lms/components/CategoryForm';
import { EnrollmentRequestsList } from '../../features/lms/components/EnrollmentRequestsList';
import { LMSDefaultsForm } from '../../features/lms/components/LMSDefaultsForm';
import { AcademicStaffManager } from '../../features/lms/components/AcademicStaffManager';
import { UniversityCalendar } from '../../features/lms/components/UniversityCalendar';

export default function LMSManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = location.pathname.includes('matriculas') ? 'requests' : 'courses';
  const [activeTab, setActiveTab] = useState<'courses' | 'categories' | 'requests' | 'defaults' | 'staff' | 'calendar'>(initialTab);

  const { courses, isLoading: loadingCourses } = useCourses();
  const { categories, isLoading: loadingCategories } = useCategories();
  const { requests, isLoading: loadingRequests } = useEnrollmentRequests();

  // Course Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<LMSCourse> & { category_id?: string } | null>(null);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (location.pathname.includes('matriculas')) {
        setActiveTab('requests');
      } else if (location.pathname === '/admin/lms') {
        setActiveTab('courses');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleOpenCourseModal = (course?: LMSCourse) => {
    if (course) {
      setEditingCourse({
        ...course,
        start_date: course.start_date ? course.start_date.substring(0, 10) : ''
      });
    } else {
      setEditingCourse(null);
    }
    setIsCourseModalOpen(true);
  };

  const handleOpenCategoryModal = (cat?: CategoryItem) => {
    setEditingCategory(cat || null);
    setIsCategoryModalOpen(true);
  };

  const loading = (activeTab === 'courses' && loadingCourses) || 
                  (activeTab === 'categories' && loadingCategories) || 
                  (activeTab === 'requests' && loadingRequests);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="text-gold" size={32} />
            Administración de Aula Virtual (LMS)
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Administra cursos, asigna categorías de estudio, aprueba solicitudes de alumnos y configura valores predeterminados.
          </p>
        </div>
        
        {activeTab === 'courses' && (
          <button
            onClick={() => navigate('/admin/lms/course/settings/new')}
            className="bg-gold hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={20} />
            Nuevo Curso
          </button>
        )}
        {activeTab === 'categories' && (
          <button
            onClick={() => handleOpenCategoryModal()}
            className="bg-gold hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={20} />
            Nueva Categoría
          </button>
        )}
      </div>

      {/* Quick Navigation Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Administración Adicional</p>
          <p className="text-[11px] text-indigo-650/80 dark:text-indigo-400/80">Gestiona estudios de libre consumo, material de descarga y el diseño visual de la Landing Page.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            onClick={() => navigate('/admin/lms/analytics')}
            className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            Ver Analíticas LMS
            <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => navigate('/admin/lms/landing-editor')}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            Editar Landing Page
            <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => navigate('/admin/recursos-abiertos')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            Programas Libres
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto pb-px gap-2">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'courses' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Cursos
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Categorías
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'requests' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Solicitudes ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('defaults')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'defaults' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Formatos / Configuración
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'staff' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Docentes y Turnos (CRM)
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Calendario General
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'courses' && (
            <CoursesList 
              courses={courses}
              onEditCourse={handleOpenCourseModal}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesList onEditCategory={handleOpenCategoryModal} />
          )}

          {activeTab === 'requests' && (
            <EnrollmentRequestsList />
          )}

          {activeTab === 'defaults' && (
            <LMSDefaultsForm />
          )}

          {activeTab === 'staff' && (
            <AcademicStaffManager />
          )}

          {activeTab === 'calendar' && (
            <UniversityCalendar role="admin" editable={true} />
          )}
        </div>
      )}

      {isCourseModalOpen && (
        <CourseForm
          editingCourse={editingCourse}
          categories={categories}
          onClose={() => setIsCourseModalOpen(false)}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryForm
          editingCategory={editingCategory}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}
