import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import type { OpenResource, OpenSection, OpenActivity } from '../../types';
import { Save, Plus, ArrowLeft, Trash2, X, Video, FileText, FileQuestion, Edit, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import RichTextEditor from '../../components/admin/RichTextEditor';
import LMSQuizBuilder from '../../components/admin/LMSQuizBuilder';

const OpenResourceBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [resource, setResource] = useState<OpenResource | null>(null);
  const [sections, setSections] = useState<OpenSection[]>([]);
  const [activities, setActivities] = useState<OpenActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Section Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<OpenSection> | null>(null);
  const [savingSection, setSavingSection] = useState(false);

  // Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Partial<OpenActivity> | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);

  useEffect(() => {
    if (id) {
      fetchResourceData();
    }
  }, [id]);

  const fetchResourceData = async () => {
    setLoading(true);
    try {
      // Fetch resource
      const { data: resourceData, error: resourceError } = await supabase
        .from('open_resources')
        .select('*')
        .eq('id', id)
        .single();
        
      if (resourceError) throw resourceError;
      setResource(resourceData);

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('open_sections')
        .select('*')
        .eq('resource_id', id)
        .order('order_index', { ascending: true });
        
      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // Fetch activities if we have sections
      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map(s => s.id);
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('open_activities')
          .select('*')
          .in('section_id', sectionIds)
          .order('order_index', { ascending: true });
          
        if (activitiesError) throw activitiesError;
        setActivities(activitiesData || []);
      }
      
    } catch (err) {
      console.error('Error fetching resource data:', err);
      alert('Error al cargar la información del recurso.');
      navigate('/admin/recursos-abiertos');
    } finally {
      setLoading(false);
    }
  };

  // --- SECTION LOGIC ---
  const handleOpenSectionModal = (section?: OpenSection) => {
    if (section) {
      setEditingSection(section);
    } else {
      setEditingSection({
        resource_id: id,
        title: '',
        description: '',
        order_index: sections.length
      });
    }
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection?.title || !id) return;
    
    setSavingSection(true);
    try {
      if (editingSection.id) {
        const { error } = await supabase.from('open_sections').update({
          title: editingSection.title,
          description: editingSection.description
        }).eq('id', editingSection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('open_sections').insert([{
          resource_id: id,
          title: editingSection.title,
          description: editingSection.description,
          order_index: editingSection.order_index
        }]);
        if (error) throw error;
      }
      await fetchResourceData();
      setIsSectionModalOpen(false);
      setEditingSection(null);
    } catch (err) {
      console.error('Error saving section:', err);
      alert('Error al guardar la sección');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('¿Eliminar esta sección? Todas sus actividades se perderán.')) return;
    try {
      const { error } = await supabase.from('open_sections').delete().eq('id', sectionId);
      if (error) throw error;
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (err) {
      console.error('Error deleting section:', err);
      alert('Error al eliminar sección');
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    const updatedSections = newSections.map((s, i) => ({ ...s, order_index: i }));
    setSections(updatedSections);
    try {
      await Promise.all([
        supabase.from('open_sections').update({ order_index: targetIndex }).eq('id', temp.id),
        supabase.from('open_sections').update({ order_index: index }).eq('id', newSections[index].id)
      ]);
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const handleOpenActivityModal = (sectionId: string, type: string = 'document', activity?: OpenActivity) => {
    if (activity) {
      setEditingActivity(activity);
    } else {
      const sectionActivities = activities.filter(a => a.section_id === sectionId);
      setEditingActivity({
        section_id: sectionId,
        title: '',
        type: type,
        content: '',
        order_index: sectionActivities.length
      });
    }
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity?.title || !editingActivity?.section_id) return;
    
    setSavingActivity(true);
    try {
      if (editingActivity.id) {
        const { error } = await supabase.from('open_activities').update({
          title: editingActivity.title,
          type: editingActivity.type,
          content: editingActivity.content,
          settings: editingActivity.settings || {},
          updated_at: new Date().toISOString()
        }).eq('id', editingActivity.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('open_activities').insert([{
          section_id: editingActivity.section_id,
          title: editingActivity.title,
          type: editingActivity.type,
          content: editingActivity.content,
          settings: editingActivity.settings || {},
          order_index: editingActivity.order_index
        }]);
        if (error) throw error;
      }
      await fetchResourceData();
      setIsActivityModalOpen(false);
      setEditingActivity(null);
    } catch (err) {
      console.error('Error saving activity:', err);
      alert('Error al guardar la actividad');
    } finally {
      setSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try {
      const { error } = await supabase.from('open_activities').delete().eq('id', activityId);
      if (error) throw error;
      setActivities(activities.filter(a => a.id !== activityId));
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert('Error al eliminar actividad');
    }
  };

  const moveActivity = async (sectionId: string, index: number, direction: 'up' | 'down') => {
    const sectionActivities = activities.filter(a => a.section_id === sectionId).sort((a, b) => a.order_index - b.order_index);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sectionActivities.length - 1)) return;
    
    const newActivities = [...sectionActivities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newActivities[index];
    newActivities[index] = newActivities[targetIndex];
    newActivities[targetIndex] = temp;
    
    const updatedSectionActivities = newActivities.map((a, i) => ({ ...a, order_index: i }));
    
    setActivities(prev => {
      const others = prev.filter(a => a.section_id !== sectionId);
      return [...others, ...updatedSectionActivities];
    });

    try {
      await Promise.all([
        supabase.from('open_activities').update({ order_index: targetIndex }).eq('id', temp.id),
        supabase.from('open_activities').update({ order_index: index }).eq('id', newActivities[index].id)
      ]);
    } catch (err) {
      console.error('Error updating activity order:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!resource) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/recursos-abiertos')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                  {resource.title}
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${resource.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {resource.is_published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Constructor de Recursos • Contenido Abierto</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => handleOpenSectionModal()}
              className="px-4 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Nueva Sección
            </button>
          </div>
        </div>
      </div>

      {/* Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content (Sections) */}
        <div className="lg:col-span-3 space-y-6">
          {sections.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 border-dashed">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Este recurso está vacío</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Comienza agregando secciones o módulos.
              </p>
              <button 
                onClick={() => handleOpenSectionModal()}
                className="px-6 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Agregar Primera Sección
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <AnimeFadeUp key={section.id} delay={index * 0.1}>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-white/10 flex items-center justify-between cursor-move">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{section.title}</h3>
                          {section.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 border-r border-gray-200 dark:border-white/10 pr-2 mr-2">
                        <button 
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button 
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenSectionModal(section)}
                          className="p-2 text-gray-400 hover:text-gold transition-colors"
                          title="Editar Sección"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar Sección"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Activities inside section */}
                    <div className="p-4 space-y-2">
                      {activities.filter(a => a.section_id === section.id).length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
                          No hay actividades en esta sección.
                        </div>
                      ) : (
                        activities.filter(a => a.section_id === section.id).sort((a,b) => a.order_index - b.order_index).map((activity, actIndex, filteredArr) => (
                          <div key={activity.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-lg hover:border-gold dark:hover:border-gold transition-colors group cursor-pointer">
                            <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400 group-hover:text-gold group-hover:bg-gold/10 transition-colors">
                              {activity.type === 'video' && <Video size={18} />}
                              {activity.type === 'document' && <FileText size={18} />}
                              {activity.type === 'quiz' && <FileQuestion size={18} />}
                              {activity.type === 'h5p' && <CheckCircle size={18} />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-white text-sm">{activity.title}</h4>
                            </div>
                            <div className="flex gap-1 border-r border-gray-200 dark:border-white/10 pr-2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); moveActivity(section.id, actIndex, 'up'); }}
                                disabled={actIndex === 0}
                                className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); moveActivity(section.id, actIndex, 'down'); }}
                                disabled={actIndex === filteredArr.length - 1}
                                className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenActivityModal(section.id, activity.type, activity); }}
                                className="p-1 text-gray-400 hover:text-gold transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activity.id); }}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <div className="pt-2">
                        <button 
                          onClick={() => handleOpenActivityModal(section.id, 'document')}
                          className="text-sm font-medium text-gold hover:text-yellow-600 transition-colors flex items-center gap-1"
                        >
                          <Plus size={16} /> Agregar Contenido
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimeFadeUp>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar (Tools) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm sticky top-24">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Herramientas</h3>
            
            <div className="space-y-2">
              <button 
                onClick={() => handleOpenSectionModal()}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:border-gold hover:text-gold dark:hover:border-gold text-slate-700 dark:text-gray-300 transition-colors text-left text-sm font-medium"
              >
                <Plus size={18} />
                Agregar Sección
              </button>
              
              <div className="pt-4 pb-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bloques de Contenido</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => sections.length > 0 && handleOpenActivityModal(sections[0].id, 'video')} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:border-gold hover:text-gold dark:hover:border-gold text-slate-600 dark:text-gray-400 transition-colors cursor-pointer">
                  <Video size={20} />
                  <span className="text-xs font-medium">Video</span>
                </button>
                <button onClick={() => sections.length > 0 && handleOpenActivityModal(sections[0].id, 'document')} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:border-gold hover:text-gold dark:hover:border-gold text-slate-600 dark:text-gray-400 transition-colors cursor-pointer">
                  <FileText size={20} />
                  <span className="text-xs font-medium">Material</span>
                </button>
                <button onClick={() => sections.length > 0 && handleOpenActivityModal(sections[0].id, 'quiz')} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:border-gold hover:text-gold dark:hover:border-gold text-slate-600 dark:text-gray-400 transition-colors cursor-pointer">
                  <FileQuestion size={20} />
                  <span className="text-xs font-medium">Test</span>
                </button>
                <button onClick={() => sections.length > 0 && handleOpenActivityModal(sections[0].id, 'h5p')} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:border-gold hover:text-gold dark:hover:border-gold text-slate-600 dark:text-gray-400 transition-colors cursor-pointer">
                  <CheckCircle size={20} />
                  <span className="text-xs font-medium">H5P</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Modal */}
      {isSectionModalOpen && editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                {editingSection.id ? 'Editar Sección' : 'Nueva Sección'}
              </h2>
              <button onClick={() => setIsSectionModalOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSection} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título de la Sección *</label>
                <input
                  type="text"
                  required
                  value={editingSection.title || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                  placeholder="Ej. Introducción, Tema 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción Breve (Opcional)</label>
                <textarea
                  rows={2}
                  value={editingSection.description || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                  placeholder="De qué trata esta sección..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSection}
                  className="px-6 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {savingSection ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {isActivityModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                {editingActivity.id ? 'Editar Contenido' : 'Nuevo Contenido'}
              </h2>
              <button onClick={() => setIsActivityModalOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveActivity} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                  <input
                    type="text"
                    required
                    value={editingActivity.title || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                    placeholder="Ej. Video explicativo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Contenido</label>
                  <select
                    value={editingActivity.type || 'document'}
                    onChange={(e) => setEditingActivity({ ...editingActivity, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                  >
                    <option value="document">Documento / Material (HTML)</option>
                    <option value="video">Video</option>
                    <option value="quiz">Cuestionario (Quiz)</option>
                    <option value="h5p">Contenido Interactivo (H5P)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contenido
                </label>
                
                {/* Editor Condicional según el Tipo */}
                {editingActivity.type === 'document' && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                    <RichTextEditor 
                      content={editingActivity.content || ''} 
                      onChange={(html) => setEditingActivity({ ...editingActivity, content: html })} 
                    />
                  </div>
                )}
                
                {(editingActivity.type === 'video' || editingActivity.type === 'h5p') && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {editingActivity.type === 'video' ? 'Ingresa la URL del video (YouTube, Vimeo, MP4).' : 'Ingresa la URL de inserción (Embed) de tu contenido H5P.'}
                    </p>
                    <input
                      type="url"
                      value={editingActivity.content || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, content: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                      placeholder="https://..."
                    />
                  </div>
                )}
                
                {editingActivity.type === 'quiz' && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-white/10">
                    <LMSQuizBuilder
                      content={editingActivity.content || ''}
                      onChange={(content) => setEditingActivity({ ...editingActivity, content })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingActivity}
                  className="px-6 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {savingActivity ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      Guardar
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

export default OpenResourceBuilder;
