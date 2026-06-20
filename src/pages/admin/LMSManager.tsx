import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, BookOpen, Settings, LayoutDashboard, Edit, Trash2, X, Save } from 'lucide-react';
import type { LMSCourse } from '../../types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import MediaUploader from '../../components/common/MediaUploader';

const LMSManager = () => {
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<LMSCourse> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lms_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course?: LMSCourse) => {
    if (course) {
      setEditingCourse(course);
    } else {
      setEditingCourse({
        title: '',
        description: '',
        format: 'weekly',
        grading_scale: '10/10',
        is_published: false,
        cover_image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title) return;
    
    setSaving(true);
    try {
      if (editingCourse.id) {
        // Update
        const { error } = await supabase
          .from('lms_courses')
          .update({
            title: editingCourse.title,
            description: editingCourse.description,
            format: editingCourse.format,
            grading_scale: editingCourse.grading_scale,
            is_published: editingCourse.is_published,
            cover_image_url: editingCourse.cover_image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCourse.id);
        
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('lms_courses')
          .insert([{
            title: editingCourse.title,
            description: editingCourse.description,
            format: editingCourse.format,
            grading_scale: editingCourse.grading_scale,
            is_published: editingCourse.is_published,
            cover_image_url: editingCourse.cover_image_url
          }]);
          
        if (error) throw error;
      }
      
      await fetchCourses();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving course:', err);
      alert('Error al guardar el curso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este curso? Se eliminarán todas sus lecciones y actividades.')) return;
    
    try {
      const { error } = await supabase
        .from('lms_courses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Error al eliminar el curso.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="text-gold" size={32} />
            Gestión Educativa (LMS)
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Administra los cursos, escuelas dominicales y programas educativos.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nuevo Curso
        </button>
      </div>

      {/* Stats/Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Cursos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{courses.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cursos Activos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {courses.filter(c => c.is_published).length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-purple-600 dark:text-purple-400">
            <Settings size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Metodología</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">PACIE</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay cursos creados</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Comienza creando tu primer curso o programa educativo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <AnimeFadeUp key={course.id} delay={index * 0.1}>
              <div 
                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/admin/lms/course/${course.id}`}
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
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-gold transition-colors">{course.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                    {course.description || 'Sin descripción'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Formato: <span className="capitalize font-medium text-slate-700 dark:text-gray-300">{course.format === 'weekly' ? 'Semanal' : 'Temas'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/admin/lms/gradebook/${course.id}`; }}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Calificaciones (Gradebook)"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(course)}
                        className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                        title="Editar Curso"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar Curso"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </AnimeFadeUp>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar Curso */}
      {isModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                {editingCourse.id ? 'Editar Curso' : 'Nuevo Curso'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
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
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                    placeholder="Ej. Escuela Dominical: El Libro de Juan"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                    placeholder="Describe brevemente de qué trata este curso..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato</label>
                  <select
                    value={editingCourse.format || 'weekly'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, format: e.target.value as 'weekly' | 'topics' })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                  >
                    <option value="weekly">Semanal (Por Fechas)</option>
                    <option value="topics">Por Temas (Unidades)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sistema de Calificación</label>
                  <select
                    value={editingCourse.grading_scale || '10/10'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, grading_scale: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                  >
                    <option value="10/10">Base 10 (0 a 10)</option>
                    <option value="letters">Letras (A, B, C, D, F)</option>
                    <option value="pass_fail">Aprobado / Reprobado</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagen de Portada
                  </label>
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
                    <span className="font-medium text-slate-900 dark:text-white block">Curso Publicado</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Si está desactivado, los estudiantes no podrán verlo.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
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
    </div>
  );
};

export default LMSManager;
