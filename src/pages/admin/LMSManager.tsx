import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { 
  Plus, BookOpen, Edit, 
  Trash2, X, Save, Check, Ban, AlertCircle, FileText, ArrowRight
} from 'lucide-react';
import type { LMSCourse } from '../../types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import MediaUploader from '../../components/common/MediaUploader';
import { toast } from 'sonner';
import { logAuditEvent } from '../../utils/auditLogger';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

interface EnrollmentRequest {
  id: string;
  course_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
  lms_courses?: { title: string };
  profiles?: { first_name: string; last_name: string; email: string };
}

export default function LMSManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = location.pathname.includes('matriculas') ? 'requests' : 'courses';
  const [activeTab, setActiveTab] = useState<'courses' | 'categories' | 'requests' | 'defaults'>(initialTab);
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Course Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<LMSCourse> & { category_id?: string } | null>(null);

  // Category Modal / State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem> | null>(null);

  // Default Settings State
  const [defaultFormat, setDefaultFormat] = useState('weekly');
  const [defaultScale, setDefaultScale] = useState('10/10');
  const [passingGrade, setPassingGrade] = useState('7');

  useEffect(() => {
    if (location.pathname.includes('matriculas')) {
      setActiveTab('requests');
    } else if (location.pathname === '/admin/lms') {
      setActiveTab('courses');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'courses') {
        const { data, error } = await supabase
          .from('lms_courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data || []);
        
        // Fetch categories for the select input
        const { data: catData } = await supabase.from('lms_course_categories').select('*');
        setCategories(catData || []);
      } 
      else if (activeTab === 'categories') {
        const { data, error } = await supabase
          .from('lms_course_categories')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } 
      else if (activeTab === 'requests') {
        const { data: reqData, error: reqError } = await supabase
          .from('lms_enrollment_requests')
          .select(`
            *,
            lms_courses(title)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (reqError) throw reqError;

        if (reqData && reqData.length > 0) {
          const userIds = [...new Set(reqData.map(r => r.user_id))];
          const { data: profData, error: profError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', userIds);

          if (profError) throw profError;

          const mappedRequests = reqData.map(req => {
            const profile = profData?.find(p => p.id === req.user_id);
            return {
              ...req,
              profiles: profile ? {
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || ''
              } : undefined
            };
          });
          setRequests(mappedRequests as any[]);
        } else {
          setRequests([]);
        }
      }
      else if (activeTab === 'defaults') {
        // Mock default configuration mapping from course defaults
        const savedFormat = localStorage.getItem('lms_default_format') || 'weekly';
        const savedScale = localStorage.getItem('lms_default_scale') || '10/10';
        const savedPassing = localStorage.getItem('lms_default_passing') || '7';
        setDefaultFormat(savedFormat);
        setDefaultScale(savedScale);
        setPassingGrade(savedPassing);
      }
    } catch (err) {
      console.error('Error fetching LMS data:', err);
      toast.error('Error al cargar datos del LMS');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // COURSES LOGIC
  // ==========================================
  const handleOpenCourseModal = (course?: LMSCourse) => {
    if (course) {
      setEditingCourse({
        ...course,
        start_date: course.start_date ? course.start_date.substring(0, 10) : ''
      });
    } else {
      setEditingCourse({
        title: '',
        description: '',
        format: 'weekly',
        grading_scale: '10/10',
        is_published: false,
        cover_image_url: '',
        category_id: '',
        capacity: 0,
        start_date: '',
        duration: '',
        schedule: ''
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title) return;
    
    setSaving(true);
    try {
      const payload = {
        title: editingCourse.title,
        description: editingCourse.description,
        format: editingCourse.format,
        grading_scale: editingCourse.grading_scale,
        is_published: editingCourse.is_published,
        cover_image_url: editingCourse.cover_image_url,
        category_id: editingCourse.category_id || null,
        capacity: editingCourse.capacity || 0,
        start_date: editingCourse.start_date || null,
        duration: editingCourse.duration || null,
        schedule: editingCourse.schedule || null,
        updated_at: new Date().toISOString()
      };

      if (editingCourse.id) {
        const { error } = await supabase
          .from('lms_courses')
          .update(payload)
          .eq('id', editingCourse.id);
        
        if (error) throw error;
        toast.success('Curso actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('lms_courses')
          .insert([payload]);
          
        if (error) throw error;
        toast.success('Curso creado con éxito');
      }
      
      setIsCourseModalOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el curso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este curso?')) return;
    try {
      const { error } = await supabase
        .from('lms_courses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setCourses(courses.filter(c => c.id !== id));
      toast.success('Curso eliminado');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar el curso.');
    }
  };

  // ==========================================
  // CATEGORIES LOGIC
  // ==========================================
  const handleOpenCategoryModal = (cat?: CategoryItem) => {
    if (cat) {
      setEditingCategory(cat);
    } else {
      setEditingCategory({ name: '', description: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    setSaving(true);
    try {
      if (editingCategory.id) {
        const { error } = await supabase
          .from('lms_course_categories')
          .update({
            name: editingCategory.name,
            description: editingCategory.description
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Categoría actualizada');
      } else {
        const { error } = await supabase
          .from('lms_course_categories')
          .insert([{
            name: editingCategory.name,
            description: editingCategory.description
          }]);
        if (error) throw error;
        toast.success('Categoría creada');
      }
      setIsCategoryModalOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Los cursos asociados se mantendrán sin categoría.')) return;
    try {
      const { error } = await supabase
        .from('lms_course_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Categoría eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar la categoría');
    }
  };

  // ==========================================
  // MATRICULAS (ENROLLMENT REQUESTS)
  // ==========================================
  const handleProcessRequest = async (request: EnrollmentRequest, approve: boolean) => {
    try {
      if (approve) {
        // Insert student enrollment
        const { error: enrollError } = await supabase
          .from('lms_enrollments')
          .insert([{
            course_id: request.course_id,
            user_id: request.user_id,
            role: 'student'
          }]);
        if (enrollError) throw enrollError;
        
        // Update request status to approved
        const { error: reqError } = await supabase
          .from('lms_enrollment_requests')
          .update({ status: 'approved' })
          .eq('id', request.id);
        if (reqError) throw reqError;
        
        toast.success('Matrícula aprobada e inscrita con éxito');
      } else {
        // Update request status to rejected
        const { error: reqError } = await supabase
          .from('lms_enrollment_requests')
          .update({ status: 'rejected' })
          .eq('id', request.id);
        if (reqError) throw reqError;
        
        toast.success('Matrícula rechazada');
      }

      await logAuditEvent('ENROLLMENT_PROCESS', 'lms_enrollment_requests', request.id, {
        course_id: request.course_id,
        course_title: request.lms_courses?.title || 'Unknown',
        student_id: request.user_id,
        student_name: request.profiles ? `${request.profiles.first_name} ${request.profiles.last_name}` : 'Unknown',
        approved: approve
      });

      fetchInitialData();
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar la solicitud');
    }
  };

  // ==========================================
  // DEFAULTS LOGIC
  // ==========================================
  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('lms_default_format', defaultFormat);
    localStorage.setItem('lms_default_scale', defaultScale);
    localStorage.setItem('lms_default_passing', passingGrade);
    toast.success('Configuración predeterminada del entorno guardada');
  };

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
            onClick={() => handleOpenCourseModal()}
            className="bg-gold hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nuevo Curso
          </button>
        )}
        {activeTab === 'categories' && (
          <button
            onClick={() => handleOpenCategoryModal()}
            className="bg-gold hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nueva Categoría
          </button>
        )}
      </div>

      {/* Quick Navigation Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">¿Deseas administrar los Programas de Estudio o la Biblioteca?</p>
          <p className="text-[11px] text-indigo-650/80 dark:text-indigo-400/80">Los estudios de libre consumo y material de descarga (PDFs) se gestionan por separado.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/recursos-abiertos')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          Administrar Programas y Estudios
          <ArrowRight size={14} />
        </button>
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
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: COURSES GRID */}
          {activeTab === 'courses' && (
            <>
              {courses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay cursos creados</h3>
                  <p className="text-gray-500 dark:text-gray-400">Comienza creando tu primer curso o programa educativo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course, index) => (
                    <AnimeFadeUp key={course.id} delay={index * 0.05}>
                      <div 
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow cursor-pointer text-left"
                        onClick={() => navigate(`/admin/lms/course/${course.id}`)}
                      >
                        <div className="h-40 bg-gray-200 dark:bg-slate-800 relative">
                          {course.cover_image_url ? (
                            <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="text-gray-400" size={40} />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 flex gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${course.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                              {course.is_published ? 'Publicado' : 'Borrador'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-gold transition-colors">{course.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                              {course.description || 'Sin descripción'}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Formato: <span className="capitalize font-medium text-slate-700 dark:text-gray-300">{course.format === 'weekly' ? 'Semanal' : 'Temas'}</span>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/lms/gradebook/${course.id}`); }}
                                className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                                title="Calificaciones (Gradebook)"
                              >
                                <FileText size={16} />
                              </button>
                              <button 
                                onClick={() => handleOpenCourseModal(course)}
                                className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                                title="Editar Curso"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCourse(course.id)}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Eliminar Curso"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimeFadeUp>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: CATEGORIES LIST */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/10">
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Nombre</th>
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Descripción</th>
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-500">No hay categorías configuradas.</td>
                      </tr>
                    ) : (
                      categories.map(cat => (
                        <tr key={cat.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-sm text-gray-900 dark:text-white">{cat.name}</td>
                          <td className="p-4 text-xs text-gray-600 dark:text-gray-400">{cat.description || 'Sin descripción'}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleOpenCategoryModal(cat)} className="p-2 text-gray-400 hover:text-gold rounded-lg"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ENROLLMENT REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/10">
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Alumno</th>
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Curso Solicitado</th>
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Notas de Solicitud</th>
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Fecha</th>
                      <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300 text-right">Aprobación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">No hay solicitudes de matrícula pendientes.</td>
                      </tr>
                    ) : (
                      requests.map(req => (
                        <tr key={req.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50">
                          <td className="p-4">
                            <p className="font-bold text-sm text-slate-850 dark:text-white">
                              {req.profiles ? `${req.profiles.first_name} ${req.profiles.last_name}` : 'Estudiante'}
                            </p>
                            <p className="text-[10px] text-gray-400">{req.profiles?.email}</p>
                          </td>
                          <td className="p-4 font-semibold text-xs text-gray-700 dark:text-gray-300">
                            {req.lms_courses?.title}
                          </td>
                          <td className="p-4 text-xs italic text-gray-500 dark:text-gray-400">
                            "{req.notes || 'Ninguna'}"
                          </td>
                          <td className="p-4 text-[10px] text-gray-450">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleProcessRequest(req, true)} 
                                className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-all cursor-pointer"
                                title="Aprobar Inscripción"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => handleProcessRequest(req, false)} 
                                className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                                title="Rechazar Inscripción"
                              >
                                <Ban size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DEFAULT FORMATS SETTINGS */}
          {activeTab === 'defaults' && (
            <form onSubmit={handleSaveDefaults} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl text-left space-y-5">
              <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle size={18} className="text-gold" />
                Formatos por Defecto del Entorno
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Formato de Aula Predeterminado</label>
                  <select
                    value={defaultFormat}
                    onChange={e => setDefaultFormat(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  >
                    <option value="weekly">Semanal (Planificación cronológica)</option>
                    <option value="topics">Por Temas (PACIE modular por bloques)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Sistema de Evaluación Global</label>
                  <select
                    value={defaultScale}
                    onChange={e => setDefaultScale(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  >
                    <option value="10/10">Escala de 0 a 10 puntos</option>
                    <option value="letters">Criterio cualitativo por Letras (A-F)</option>
                    <option value="pass_fail">Binario Aprobado/Reprobado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nota Mínima de Aprobación</label>
                  <input
                    type="text"
                    value={passingGrade}
                    onChange={e => setPassingGrade(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                    placeholder="Ej. 7 o A"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 dark:border-white/5 flex justify-end">
                <button
                  type="submit"
                  className="bg-gold hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  Guardar Valores
                </button>
              </div>
            </form>
          )}

        </div>
      )}

      {/* Course Modal */}
      {isCourseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                {editingCourse.id ? 'Editar Curso' : 'Nuevo Curso'}
              </h2>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCourse} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Curso *</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.title || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Ej. Escuela Dominical: El Libro de Juan"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Describe brevemente de qué trata este curso..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato</label>
                  <select
                    value={editingCourse.format || 'weekly'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, format: e.target.value as 'weekly' | 'topics' })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  >
                    <option value="weekly">Semanal (Por Fechas)</option>
                    <option value="topics">Por Temas (Unidades)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría del Curso</label>
                  <select
                    value={editingCourse.category_id || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  >
                    <option value="">Sin Categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={editingCourse.start_date || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (semanas, meses, etc.)</label>
                  <input
                    type="text"
                    value={editingCourse.duration || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Ej. 8 Semanas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horario</label>
                  <input
                    type="text"
                    value={editingCourse.schedule || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, schedule: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Ej. Sábados 19:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cupo Máximo (0 para libre)</label>
                  <input
                    type="number"
                    value={editingCourse.capacity || 0}
                    onChange={(e) => setEditingCourse({ ...editingCourse, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sistema de Calificación</label>
                  <select
                    value={editingCourse.grading_scale || '10/10'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, grading_scale: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                  >
                    <option value="10/10">Base 10 (0 a 10)</option>
                    <option value="letters">Letras (A, B, C, D, F)</option>
                    <option value="pass_fail">Aprobado / Reprobado</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen de Portada</label>
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl">
                    <MediaUploader
                      onUploadSuccess={(url) => setEditingCourse({ ...editingCourse, cover_image_url: url })}
                      folder="lms_covers"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingCourse.is_published || false}
                      onChange={(e) => setEditingCourse({ ...editingCourse, is_published: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/30 dark:peer-focus:ring-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </label>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white block text-sm">Curso Publicado</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Si está desactivado, los estudiantes no podrán verlo.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar Curso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-left animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                {editingCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Ej. Escuela Dominical"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Describe la categoría..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20 p-4 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save size={16} />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
