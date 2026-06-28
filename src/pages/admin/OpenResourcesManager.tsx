import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { 
  Plus, BookOpen, LayoutDashboard, Edit, 
  Trash2, X, Save, FileText, Video, Eye, Shield, ArrowRight
} from 'lucide-react';
import type { OpenResource, Study } from '../../types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import MediaUploader from '../../components/common/MediaUploader';
import { toast } from 'sonner';

const OpenResourcesManager = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'open_courses' | 'studies'>('open_courses');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Open Resources (Courses) States ───────────────────────────────────
  const [resources, setResources] = useState<OpenResource[]>([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Partial<OpenResource> | null>(null);

  // ── Studies States ────────────────────────────────────────────────────
  const [studies, setStudies] = useState<Study[]>([]);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<Partial<Study> | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'open_courses') {
        const { data, error } = await supabase
          .from('open_resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources(data || []);
      } else {
        const { data, error } = await supabase
          .from('studies')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStudies(data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  // ── Course (OpenResource) Handlers ────────────────────────────────────
  const handleOpenCourseModal = (resource?: OpenResource) => {
    if (resource) {
      setEditingResource(resource);
    } else {
      setEditingResource({
        title: '',
        description: '',
        is_published: false,
        cover_image_url: ''
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleCloseCourseModal = () => {
    setIsCourseModalOpen(false);
    setEditingResource(null);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource?.title) return;
    
    setSaving(true);
    try {
      const payload = {
        title: editingResource.title,
        description: editingResource.description,
        is_published: editingResource.is_published,
        cover_image_url: editingResource.cover_image_url,
        updated_at: new Date().toISOString()
      };

      if (editingResource.id) {
        const { error } = await supabase
          .from('open_resources')
          .update(payload)
          .eq('id', editingResource.id);
        
        if (error) throw error;
        toast.success('Curso abierto actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('open_resources')
          .insert([payload]);
          
        if (error) throw error;
        toast.success('Curso abierto creado con éxito');
      }
      
      await fetchData();
      handleCloseCourseModal();
    } catch (err) {
      console.error('Error saving resource:', err);
      toast.error('Error al guardar el recurso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este curso abierto? Se eliminarán todas sus secciones y actividades.')) return;
    
    try {
      const { error } = await supabase
        .from('open_resources')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setResources(resources.filter(r => r.id !== id));
      toast.success('Curso abierto eliminado con éxito');
    } catch (err) {
      console.error('Error deleting resource:', err);
      toast.error('Error al eliminar el recurso.');
    }
  };

  // ── Study Handlers ───────────────────────────────────────────────────
  const handleOpenStudyModal = (study?: Study) => {
    if (study) {
      setEditingStudy(study);
    } else {
      setEditingStudy({
        title: '',
        description: '',
        category: 'Generales',
        cover_image_url: '',
        pdf_url: '',
        video_url: '',
        read_now_url: '',
        is_published: true
      });
    }
    setIsStudyModalOpen(true);
  };

  const handleCloseStudyModal = () => {
    setIsStudyModalOpen(false);
    setEditingStudy(null);
  };

  const handleSaveStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudy?.title || !editingStudy?.category) return;

    setSaving(true);
    try {
      const payload = {
        title: editingStudy.title,
        description: editingStudy.description,
        category: editingStudy.category,
        cover_image_url: editingStudy.cover_image_url || null,
        pdf_url: editingStudy.pdf_url || null,
        video_url: editingStudy.video_url || null,
        read_now_url: editingStudy.read_now_url || null,
        is_published: editingStudy.is_published,
        updated_at: new Date().toISOString()
      };

      if (editingStudy.id) {
        const { error } = await supabase
          .from('studies')
          .update(payload)
          .eq('id', editingStudy.id);
        
        if (error) throw error;
        toast.success('Estudio bíblico actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('studies')
          .insert([payload]);
          
        if (error) throw error;
        toast.success('Estudio bíblico creado con éxito');
      }

      await fetchData();
      handleCloseStudyModal();
    } catch (err) {
      console.error('Error saving study:', err);
      toast.error('Error al guardar el estudio.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudy = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este estudio bíblico?')) return;

    try {
      const { error } = await supabase
        .from('studies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStudies(studies.filter(s => s.id !== id));
      toast.success('Estudio bíblico eliminado con éxito');
    } catch (err) {
      console.error('Error deleting study:', err);
      toast.error('Error al eliminar el estudio.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="text-gold" size={32} />
            Administración de Programas y Estudios
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Administra los programas (cursos abiertos de libre consumo) y la biblioteca de estudios (guías/PDFs de descarga directa).
          </p>
        </div>
        
        {activeTab === 'open_courses' ? (
          <button
            onClick={() => handleOpenCourseModal()}
            className="bg-gold hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={20} />
            Nuevo Curso Abierto
          </button>
        ) : (
          <button
            onClick={() => handleOpenStudyModal()}
            className="bg-gold hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={20} />
            Nuevo Estudio
          </button>
        )}
      </div>

      {/* Quick Navigation Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">¿Deseas administrar los Cursos con Matrícula del Aula Virtual?</p>
          <p className="text-[11px] text-indigo-650/80 dark:text-indigo-400/80">Los cursos formales del Aula Virtual (que requieren inscripción, seguimiento y notas) se gestionan por separado.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/lms')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          Ir al Aula Virtual (LMS)
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto pb-px gap-2">
        <button
          onClick={() => setActiveTab('open_courses')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'open_courses' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Cursos Abiertos ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('studies')}
          className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'studies' ? 'border-gold text-gold font-extrabold' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Biblioteca de Estudios ({studies.length})
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {activeTab === 'open_courses' ? 'Total Cursos Abiertos' : 'Total Estudios'}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'open_courses' ? resources.length : studies.length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Publicados en Web</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'open_courses' 
                ? resources.filter(r => r.is_published).length 
                : studies.filter(s => s.is_published).length
              }
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: OPEN COURSES (LMS LIBRE) */}
          {activeTab === 'open_courses' && (
            resources.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay cursos abiertos creados</h3>
                <p className="text-gray-500 dark:text-gray-400">Comienza creando el primer curso libre sin inscripción.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource, index) => (
                  <AnimeFadeUp key={resource.id} delay={index * 0.05}>
                    <div 
                      className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow cursor-pointer text-left"
                      onClick={() => navigate(`/admin/recursos-abiertos/${resource.id}`)}
                    >
                      <div className="h-40 bg-gray-200 dark:bg-slate-800 relative">
                        {resource.cover_image_url ? (
                          <img loading="lazy" src={resource.cover_image_url} alt={resource.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="text-gray-400" size={40} />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${resource.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {resource.is_published ? 'Publicado' : 'Borrador'}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-gold transition-colors">{resource.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                            {resource.description || 'Sin descripción'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider flex items-center gap-1">
                            <Shield size={12} /> Libre Acceso
                          </span>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleOpenCourseModal(resource)}
                              className="p-2 text-gray-505 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors cursor-pointer"
                              title="Editar Datos"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteResource(resource.id)}
                              className="p-2 text-gray-505 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
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
            )
          )}

          {/* TAB 2: STUDIES LIBRARY (BIBLIOTECA) */}
          {activeTab === 'studies' && (
            studies.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay estudios en la biblioteca</h3>
                <p className="text-gray-500 dark:text-gray-400">Agrega tu primer estudio, guía en PDF o video asíncrono.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden text-left">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/10">
                        <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Estudio / Título</th>
                        <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Categoría</th>
                        <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Recursos Asignados</th>
                        <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Estado</th>
                        <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studies.map(study => (
                        <tr key={study.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                                {study.cover_image_url ? (
                                  <img loading="lazy" src={study.cover_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="text-gray-450 m-2" size={24} />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1">{study.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-1 max-w-sm">{study.description || 'Sin descripción'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/35">
                              Para: {study.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 text-gray-500 dark:text-gray-400">
                              {study.pdf_url && <span title="PDF asignado"><FileText size={16} className="text-emerald-500" /></span>}
                              {study.video_url && <span title="Video asignado"><Video size={16} className="text-blue-500" /></span>}
                              {study.read_now_url && <span title="Lectura web asignada"><Eye size={16} className="text-gold" /></span>}
                              {!study.pdf_url && !study.video_url && !study.read_now_url && (
                                <span className="text-xxs italic text-gray-400">Sin recursos</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              study.is_published ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                            }`}>
                              {study.is_published ? 'Publicado' : 'Borrador'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => handleOpenStudyModal(study)} 
                                className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteStudy(study.id)} 
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ── Modal: Open Course (open_resources) ─────────────────────────── */}
      {isCourseModalOpen && editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                {editingResource.id ? 'Editar Curso Abierto' : 'Nuevo Curso Abierto'}
              </h2>
              <button onClick={handleCloseCourseModal} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveResource} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Curso *</label>
                  <input
                    type="text"
                    required
                    value={editingResource.title || ''}
                    onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Ej. Mujeres de la Biblia"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={editingResource.description || ''}
                    onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Describe de qué trata este programa abierto..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen de Portada</label>
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl">
                    <MediaUploader
                      onUploadSuccess={(url) => setEditingResource({ ...editingResource, cover_image_url: url })}
                      folder="open_resources"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingResource.is_published || false}
                      onChange={(e) => setEditingResource({ ...editingResource, is_published: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/30 dark:peer-focus:ring-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </label>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white block text-sm">Curso Publicado</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Si está desactivado, no aparecerá en el catálogo web público.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={handleCloseCourseModal}
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
                      Guardar Curso Abierto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Study (studies) ─────────────────────────────────────── */}
      {isStudyModalOpen && editingStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                {editingStudy.id ? 'Editar Estudio Bíblico' : 'Nuevo Estudio Bíblico'}
              </h2>
              <button onClick={handleCloseStudyModal} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveStudy} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Estudio *</label>
                  <input
                    type="text"
                    required
                    value={editingStudy.title || ''}
                    onChange={(e) => setEditingStudy({ ...editingStudy, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Ej. La Armadura de Dios"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={editingStudy.description || ''}
                    onChange={(e) => setEditingStudy({ ...editingStudy, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Describe de qué trata este recurso..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría del Estudio *</label>
                  <select
                    value={editingStudy.category || 'Generales'}
                    onChange={(e) => setEditingStudy({ ...editingStudy, category: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="Generales">Generales / Devocionales</option>
                    <option value="Damas">Estudios para Damas</option>
                    <option value="Caballeros">Estudios para Caballeros</option>
                    <option value="Jóvenes">Estudios para Jóvenes / Universitarios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enlace de Lectura Directa</label>
                  <input
                    type="url"
                    value={editingStudy.read_now_url || ''}
                    onChange={(e) => setEditingStudy({ ...editingStudy, read_now_url: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold"
                    placeholder="https://ejemplo.com/articulo"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enlace de Video Embebido (opcional)</label>
                  <input
                    type="url"
                    value={editingStudy.video_url || ''}
                    onChange={(e) => setEditingStudy({ ...editingStudy, video_url: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold"
                    placeholder="https://www.youtube.com/embed/XXXXX (Enlace de inserción)"
                  />
                </div>

                {/* File Upload panels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guía o Documento PDF</label>
                  <div className="p-3 border border-dashed border-gray-300 dark:border-white/10 rounded-xl space-y-2">
                    <MediaUploader
                      onUploadSuccess={(url) => setEditingStudy({ ...editingStudy, pdf_url: url })}
                      folder="studies_pdfs"
                      allowedFormats={['pdf']}
                      label="Subir PDF"
                    />
                    {editingStudy.pdf_url && (
                      <p className="text-[10px] text-green-500 font-bold truncate">✓ Cargado: {editingStudy.pdf_url}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen de Portada</label>
                  <div className="p-3 border border-dashed border-gray-300 dark:border-white/10 rounded-xl space-y-2">
                    <MediaUploader
                      onUploadSuccess={(url) => setEditingStudy({ ...editingStudy, cover_image_url: url })}
                      folder="studies_covers"
                      allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                      label="Subir Imagen"
                    />
                    {editingStudy.cover_image_url && (
                      <p className="text-[10px] text-green-500 font-bold truncate">✓ Cargada: {editingStudy.cover_image_url}</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingStudy.is_published || false}
                      onChange={(e) => setEditingStudy({ ...editingStudy, is_published: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/30 dark:peer-focus:ring-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </label>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white block text-sm">Estudio Publicado</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Si está desactivado, no se mostrará en la biblioteca.</span>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-150 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={handleCloseStudyModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-650 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
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
                      Guardar Estudio
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

export default OpenResourcesManager;
