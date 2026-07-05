import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import type { LMSCourse, LMSSubject, LMSModule, LMSLesson } from '../../types';
import { 
  ArrowLeft, Plus, CheckCircle, Video, FileText, 
  FileQuestion, MessageSquare, Edit, Trash2, X, ChevronUp, 
  ChevronDown, Save, BookOpen, Layers, PlayCircle, Eye, Loader2
} from 'lucide-react';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import RichTextEditor from '../../components/admin/RichTextEditor';
import LMSQuizBuilder from '../../components/admin/LMSQuizBuilder';
import { toast } from 'sonner';

const CourseBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<LMSCourse | null>(null);
  const [subjects, setSubjects] = useState<LMSSubject[]>([]);
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [lessons, setLessons] = useState<LMSLesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Collapsed states
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Partial<LMSSubject> | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);

  // Module Modal
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<LMSModule> | null>(null);
  const [savingModule, setSavingModule] = useState(false);

  // Lesson Modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<LMSLesson> | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('lms_courses')
        .select('*')
        .eq('id', id)
        .single();
        
      if (courseError) throw courseError;
      setCourse(courseData);

      // 2. Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('lms_subjects')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true });
        
      if (subjectsError) throw subjectsError;
      const sortedSubjects = subjectsData || [];
      setSubjects(sortedSubjects);

      // 3. Fetch modules if subjects exist
      if (sortedSubjects.length > 0) {
        const subjectIds = sortedSubjects.map(s => s.id);
        const { data: modulesData, error: modulesError } = await supabase
          .from('lms_modules')
          .select('*')
          .in('subject_id', subjectIds)
          .order('order_index', { ascending: true });
          
        if (modulesError) throw modulesError;
        const sortedModules = modulesData || [];
        setModules(sortedModules);

        // 4. Fetch lessons if modules exist
        if (sortedModules.length > 0) {
          const moduleIds = sortedModules.map(m => m.id);
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lms_lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('order_index', { ascending: true });
            
          if (lessonsError) throw lessonsError;
          setLessons(lessonsData || []);
        } else {
          setLessons([]);
        }
      } else {
        setModules([]);
        setLessons([]);
      }
      
    } catch (err) {
      console.error('Error fetching course data:', err);
      toast.error('Error al cargar la estructura del curso.');
      navigate('/admin/lms');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, fetchCourseData]);

  // --- SUBJECT LOGIC ---
  const handleOpenSubjectModal = (subject?: LMSSubject) => {
    if (subject) {
      setEditingSubject(subject);
    } else {
      setEditingSubject({
        course_id: id,
        title: '',
        description: '',
        order_index: subjects.length
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject?.title || !id) return;
    
    setSavingSubject(true);
    try {
      if (editingSubject.id) {
        const { error } = await supabase.from('lms_subjects').update({
          title: editingSubject.title,
          description: editingSubject.description,
          updated_at: new Date().toISOString()
        }).eq('id', editingSubject.id);
        if (error) throw error;
        toast.success('Materia actualizada con éxito');
      } else {
        const { error } = await supabase.from('lms_subjects').insert([{
          course_id: id,
          title: editingSubject.title,
          description: editingSubject.description,
          order_index: editingSubject.order_index
        }]);
        if (error) throw error;
        toast.success('Materia creada con éxito');
      }
      await fetchCourseData();
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la materia');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!window.confirm('¿Eliminar esta materia? Se eliminarán todos sus módulos y lecciones.')) return;
    try {
      const { error } = await supabase.from('lms_subjects').delete().eq('id', subjectId);
      if (error) throw error;
      toast.success('Materia eliminada');
      await fetchCourseData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar materia');
    }
  };

  const moveSubject = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === subjects.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = subjects[index];
    const target = subjects[targetIndex];

    try {
      await Promise.all([
        supabase.from('lms_subjects').update({ order_index: targetIndex }).eq('id', current.id),
        supabase.from('lms_subjects').update({ order_index: index }).eq('id', target.id)
      ]);
      await fetchCourseData();
    } catch (err) {
      console.error(err);
      toast.error('Error al reordenar materias');
    }
  };

  // --- MODULE LOGIC ---
  const handleOpenModuleModal = (subjectId: string, moduleObj?: LMSModule) => {
    if (moduleObj) {
      setEditingModule(moduleObj);
    } else {
      const subjectModules = modules.filter(m => m.subject_id === subjectId);
      setEditingModule({
        subject_id: subjectId,
        title: '',
        description: '',
        order_index: subjectModules.length,
        is_hidden: false
      });
    }
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule?.title || !editingModule?.subject_id) return;
    
    setSavingModule(true);
    try {
      if (editingModule.id) {
        const { error } = await supabase.from('lms_modules').update({
          title: editingModule.title,
          description: editingModule.description,
          is_hidden: editingModule.is_hidden,
          updated_at: new Date().toISOString()
        }).eq('id', editingModule.id);
        if (error) throw error;
        toast.success('Módulo actualizado');
      } else {
        const { error } = await supabase.from('lms_modules').insert([{
          subject_id: editingModule.subject_id,
          title: editingModule.title,
          description: editingModule.description,
          order_index: editingModule.order_index,
          is_hidden: editingModule.is_hidden
        }]);
        if (error) throw error;
        toast.success('Módulo creado');
      }
      await fetchCourseData();
      setIsModuleModalOpen(false);
      setEditingModule(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el módulo');
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('¿Eliminar este módulo? Se eliminarán todas sus lecciones.')) return;
    try {
      const { error } = await supabase.from('lms_modules').delete().eq('id', moduleId);
      if (error) throw error;
      toast.success('Módulo eliminado');
      await fetchCourseData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar módulo');
    }
  };

  const moveModule = async (subjectId: string, index: number, direction: 'up' | 'down') => {
    const subjectModules = modules.filter(m => m.subject_id === subjectId).sort((a,b) => a.order_index - b.order_index);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === subjectModules.length - 1)) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = subjectModules[index];
    const target = subjectModules[targetIndex];

    try {
      await Promise.all([
        supabase.from('lms_modules').update({ order_index: targetIndex }).eq('id', current.id),
        supabase.from('lms_modules').update({ order_index: index }).eq('id', target.id)
      ]);
      await fetchCourseData();
    } catch (err) {
      console.error(err);
      toast.error('Error al reordenar módulos');
    }
  };

  // --- LESSON LOGIC ---
  const handleOpenLessonModal = (moduleId: string, type: LMSLesson['type'] = 'document', lesson?: LMSLesson) => {
    if (lesson) {
      setEditingLesson(lesson);
    } else {
      const moduleLessons = lessons.filter(l => l.module_id === moduleId);
      setEditingLesson({
        module_id: moduleId,
        title: '',
        type: type,
        description: '',
        content: '',
        settings: {},
        order_index: moduleLessons.length
      });
    }
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson?.title || !editingLesson?.module_id) return;
    
    setSavingLesson(true);
    try {
      if (editingLesson.id) {
        const { error } = await supabase.from('lms_lessons').update({
          title: editingLesson.title,
          description: editingLesson.description,
          type: editingLesson.type,
          content: editingLesson.content,
          settings: editingLesson.settings,
          updated_at: new Date().toISOString()
        }).eq('id', editingLesson.id);
        if (error) throw error;
        toast.success('Lección actualizada');
      } else {
        const { error } = await supabase.from('lms_lessons').insert([{
          module_id: editingLesson.module_id,
          title: editingLesson.title,
          type: editingLesson.type,
          description: editingLesson.description,
          content: editingLesson.content,
          settings: editingLesson.settings,
          order_index: editingLesson.order_index
        }]);
        if (error) throw error;
        toast.success('Lección creada');
      }
      await fetchCourseData();
      setIsLessonModalOpen(false);
      setEditingLesson(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la lección');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('¿Eliminar esta lección?')) return;
    try {
      const { error } = await supabase.from('lms_lessons').delete().eq('id', lessonId);
      if (error) throw error;
      toast.success('Lección eliminada');
      await fetchCourseData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar lección');
    }
  };

  const moveLesson = async (moduleId: string, index: number, direction: 'up' | 'down') => {
    const moduleLessons = lessons.filter(l => l.module_id === moduleId).sort((a,b) => a.order_index - b.order_index);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === moduleLessons.length - 1)) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = moduleLessons[index];
    const target = moduleLessons[targetIndex];

    try {
      await Promise.all([
        supabase.from('lms_lessons').update({ order_index: targetIndex }).eq('id', current.id),
        supabase.from('lms_lessons').update({ order_index: index }).eq('id', target.id)
      ]);
      await fetchCourseData();
    } catch (err) {
      console.error(err);
      toast.error('Error al reordenar lecciones');
    }
  };

  const toggleSubjectCollapse = (subjectId: string) => {
    setCollapsedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/lms')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} className="text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                  {course.title}
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${course.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {course.is_published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Estructura del Curso • 4 Niveles (Cursos ➔ Materias ➔ Módulos ➔ Lecciones)</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/lms/curso/${course.id}`)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg transition-colors font-medium flex items-center gap-2 cursor-pointer border border-transparent shadow-xs"
            >
              <Eye size={18} />
              Vista Alumno
            </button>
            <button 
              onClick={() => handleOpenSubjectModal()}
              className="px-4 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-semibold flex items-center gap-2 shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={18} />
              Nueva Materia
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Outline Hierarchy (Col-span 3) */}
        <div className="lg:col-span-3 space-y-6">
          {subjects.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 border-dashed animate-fade-in shadow-xs">
              <BookOpen className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Este curso no tiene materias creadas</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm">
                Agrega materias y luego subdivídelas en módulos con sus lecciones y actividades correspondientes.
              </p>
              <button 
                onClick={() => handleOpenSubjectModal()}
                className="px-6 py-2.5 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={20} />
                Agregar Primera Materia
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject, sIdx) => {
                const isSubCollapsed = collapsedSubjects[subject.id];
                const subjectModules = modules.filter(m => m.subject_id === subject.id);

                return (
                  <AnimeFadeUp key={subject.id} delay={sIdx * 0.05}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xs">
                      {/* Materia Header */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <button 
                          onClick={() => toggleSubjectCollapse(subject.id)}
                          className="flex items-center gap-3 text-left cursor-pointer flex-grow focus:outline-none"
                        >
                          <span className="w-8 h-8 bg-gold/15 text-gold dark:bg-gold/10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm">
                            M{sIdx + 1}
                          </span>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                              {subject.title}
                              <span className="text-xs font-normal text-gray-450 dark:text-gray-500">({subjectModules.length} módulos)</span>
                            </h3>
                            {subject.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{subject.description}</p>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 border-r border-gray-200 dark:border-white/10 pr-2 mr-2">
                            <button 
                              onClick={() => moveSubject(sIdx, 'up')}
                              disabled={sIdx === 0}
                              className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors cursor-pointer"
                              title="Subir Materia"
                            >
                              <ChevronUp size={18} />
                            </button>
                            <button 
                              onClick={() => moveSubject(sIdx, 'down')}
                              disabled={sIdx === subjects.length - 1}
                              className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors cursor-pointer"
                              title="Bajar Materia"
                            >
                              <ChevronDown size={18} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => handleOpenModuleModal(subject.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Nuevo Módulo en Materia"
                          >
                            <Plus size={14} />
                            Módulo
                          </button>
                          <button 
                            onClick={() => handleOpenSubjectModal(subject)}
                            className="p-1.5 text-gray-400 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Editar Materia"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                            title="Eliminar Materia"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Módulos de Materia */}
                      {!isSubCollapsed && (
                        <div className="p-4 bg-slate-50/25 dark:bg-slate-900/10 space-y-4">
                          {subjectModules.length === 0 ? (
                            <div className="text-center py-6 text-sm text-gray-450 dark:text-gray-500 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                              No hay módulos en esta materia. ¡Crea uno para organizar las lecciones!
                            </div>
                          ) : (
                            subjectModules.map((moduleObj, mIdx) => {
                              const isModCollapsed = collapsedModules[moduleObj.id];
                              const moduleLessons = lessons.filter(l => l.module_id === moduleObj.id);

                              return (
                                <div key={moduleObj.id} className="bg-white dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-white/5 overflow-hidden shadow-2xs">
                                  {/* Módulo Header */}
                                  <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 border-b border-gray-150 dark:border-white/5 flex items-center justify-between">
                                    <button 
                                      onClick={() => toggleModuleCollapse(moduleObj.id)}
                                      className="flex items-center gap-2 text-left cursor-pointer flex-grow focus:outline-none"
                                    >
                                      <span className="text-blue-600 dark:text-church-gold-bright flex-shrink-0">
                                        <Layers size={18} />
                                      </span>
                                      <div>
                                        <h4 className="font-bold text-slate-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                                          {moduleObj.title}
                                          <span className="text-[10px] font-normal text-gray-400">({moduleLessons.length} lecciones)</span>
                                        </h4>
                                      </div>
                                    </button>

                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-1 border-r border-gray-200 dark:border-white/5 pr-2 mr-2">
                                        <button 
                                          onClick={() => moveModule(subject.id, mIdx, 'up')}
                                          disabled={mIdx === 0}
                                          className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors cursor-pointer"
                                          title="Subir Módulo"
                                        >
                                          <ChevronUp size={16} />
                                        </button>
                                        <button 
                                          onClick={() => moveModule(subject.id, mIdx, 'down')}
                                          disabled={mIdx === subjectModules.length - 1}
                                          className="p-1 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors cursor-pointer"
                                          title="Bajar Módulo"
                                        >
                                          <ChevronDown size={16} />
                                        </button>
                                      </div>
                                      <button 
                                        onClick={() => handleOpenLessonModal(moduleObj.id, 'document')}
                                        className="p-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                                        title="Nueva Lección en Módulo"
                                      >
                                        <Plus size={12} />
                                        Lección
                                      </button>
                                      <button 
                                        onClick={() => handleOpenModuleModal(subject.id, moduleObj)}
                                        className="p-1 text-gray-400 hover:text-gold hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                        title="Editar Módulo"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteModule(moduleObj.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors cursor-pointer"
                                        title="Eliminar Módulo"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Lecciones inside Módulo */}
                                  {!isModCollapsed && (
                                    <div className="p-3 bg-white dark:bg-slate-950 space-y-2">
                                      {moduleLessons.length === 0 ? (
                                        <div className="text-center py-4 text-xs text-gray-450 dark:text-gray-500 border border-dashed border-gray-150 dark:border-slate-800 rounded-lg">
                                          No hay lecciones. Haz clic en "Lección" para agregar contenidos.
                                        </div>
                                      ) : (
                                        moduleLessons.map((lesson, lIdx) => (
                                          <div key={lesson.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-900/30 border border-gray-100 dark:border-white/5 rounded-xl hover:border-gold dark:hover:border-gold transition-all group">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-gray-500 group-hover:text-gold group-hover:bg-gold/10 transition-colors">
                                                {lesson.type === 'video' || lesson.type === 'video_link' ? <Video size={16} /> : null}
                                                {lesson.type === 'document' || lesson.type === 'resource' ? <FileText size={16} /> : null}
                                                {lesson.type === 'quiz' ? <FileQuestion size={16} /> : null}
                                                {lesson.type === 'forum' ? <MessageSquare size={16} /> : null}
                                                {lesson.type === 'h5p' || lesson.type === 'h5p_embed' ? <CheckCircle size={16} /> : null}
                                                {lesson.type === 'assignment' ? <FileText size={16} /> : null}
                                              </div>
                                              <div className="truncate">
                                                <h5 className="font-semibold text-slate-800 dark:text-gray-200 text-xs truncate">{lesson.title}</h5>
                                                <p className="text-[10px] text-gray-400 capitalize">{lesson.type === 'document' ? 'Material Lectura' : lesson.type}</p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <div className="flex gap-0.5 border-r border-gray-250 pr-2 mr-2">
                                                <button 
                                                  onClick={() => moveLesson(moduleObj.id, lIdx, 'up')}
                                                  disabled={lIdx === 0}
                                                  className="p-1 text-gray-450 hover:text-gold disabled:opacity-30 cursor-pointer"
                                                >
                                                  <ChevronUp size={14} />
                                                </button>
                                                <button 
                                                  onClick={() => moveLesson(moduleObj.id, lIdx, 'down')}
                                                  disabled={lIdx === moduleLessons.length - 1}
                                                  className="p-1 text-gray-450 hover:text-gold disabled:opacity-30 cursor-pointer"
                                                >
                                                  <ChevronDown size={14} />
                                                </button>
                                              </div>
                                              <button 
                                                onClick={() => handleOpenLessonModal(moduleObj.id, lesson.type, lesson)}
                                                className="p-1 text-gray-400 hover:text-gold cursor-pointer"
                                                title="Editar Lección"
                                              >
                                                <Edit size={14} />
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                                title="Eliminar Lección"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </AnimeFadeUp>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Tools (Col-span 1) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm sticky top-24">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Herramientas LMS</h3>
            
            <div className="space-y-2.5">
              <button 
                onClick={() => handleOpenSubjectModal()}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gold hover:text-gold dark:hover:border-gold text-slate-700 dark:text-gray-300 transition-colors text-left text-xs font-semibold cursor-pointer"
              >
                <Plus size={16} />
                Agregar Materia
              </button>

              <div className="pt-3 pb-1 border-t border-gray-100 dark:border-white/5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ayuda de Organización</div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Las materias corresponden a asignaturas globales. Dentro de cada materia, divide el contenido en módulos temáticos semanales y añade lecturas, foros, tareas o cuestionarios.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
                  <PlayCircle size={16} className="text-gold" />
                  <span>Método Pedagógico</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Basado en Metodología PACIE: sección de exposición, sección de rebote, sección de construcción y sección de comprobación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Modal */}
      {isSubjectModalOpen && editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in border border-gray-150 dark:border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
                {editingSubject.id ? 'Editar Materia' : 'Nueva Materia'}
              </h2>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Título de la Materia *</label>
                <input
                  type="text"
                  required
                  value={editingSubject.title || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                  placeholder="Ej. Antiguo Testamento, Historia de la Iglesia"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción Breve (Opcional)</label>
                <textarea
                  rows={3}
                  value={editingSubject.description || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                  placeholder="Descripción de la materia, objetivos de aprendizaje..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSubject}
                  className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {savingSubject ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {isModuleModalOpen && editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in border border-gray-150 dark:border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
                {editingModule.id ? 'Editar Módulo' : 'Nuevo Módulo'}
              </h2>
              <button onClick={() => setIsModuleModalOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveModule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Título del Módulo *</label>
                <input
                  type="text"
                  required
                  value={editingModule.title || ''}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                  placeholder="Ej. Semana 1: Pentateuco, Unidad 2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción o Resumen</label>
                <textarea
                  rows={2}
                  value={editingModule.description || ''}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                  placeholder="Contenido central que se estudiará en este módulo..."
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="isHiddenModule"
                  checked={editingModule.is_hidden || false}
                  onChange={(e) => setEditingModule({ ...editingModule, is_hidden: e.target.checked })}
                  className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                />
                <label htmlFor="isHiddenModule" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Ocultar unidad para estudiantes (borrador)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingModule}
                  className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {savingModule ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Guardar Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in border border-gray-150 dark:border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
                {editingLesson.id ? 'Editar Lección' : 'Nueva Lección'}
              </h2>
              <button onClick={() => setIsLessonModalOpen(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveLesson} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Título de la Lección *</label>
                  <input
                    type="text"
                    required
                    value={editingLesson.title || ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                    placeholder="Ej. Lectura Principal: Génesis 1-3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de Contenido</label>
                  <select
                    value={editingLesson.type || 'document'}
                    onChange={(e) => setEditingLesson({ ...editingLesson, type: e.target.value as LMSLesson['type'], content: '' })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none cursor-pointer"
                  >
                    <option value="document">Material de Estudio (Texto/HTML)</option>
                    <option value="video">Reproductor de Video (URL)</option>
                    <option value="quiz">Cuestionario Evaluable (Quiz)</option>
                    <option value="forum">Foro de Dudas y Debate</option>
                    <option value="h5p">Contenido Interactivo (Embed H5P)</option>
                    <option value="assignment">Entrega de Tarea / Proyecto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción de la Actividad (Opcional)</label>
                <textarea
                  rows={2}
                  value={editingLesson.description || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                  placeholder="Indica qué debe realizar el estudiante en esta lección..."
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-white/5">
                <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-2">Contenido de la Lección</label>
                
                {editingLesson.type === 'document' && (
                  <div className="bg-gray-55 dark:bg-slate-955 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                    <RichTextEditor 
                      content={editingLesson.content || ''} 
                      onChange={(html) => setEditingLesson({ ...editingLesson, content: html })} 
                    />
                  </div>
                )}
                
                {(editingLesson.type === 'video' || editingLesson.type === 'h5p') && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">
                      {editingLesson.type === 'video' ? 'Inserta la URL del video (ej. YouTube, Vimeo o MP4 directo).' : 'Inserta la URL del iframe embed del recurso H5P.'}
                    </p>
                    <input
                      type="url"
                      required
                      value={editingLesson.content || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                )}
                
                {editingLesson.type === 'quiz' && (
                  <div className="bg-gray-55 dark:bg-slate-955 p-4 rounded-xl border border-gray-250 dark:border-white/5">
                    <LMSQuizBuilder
                      content={editingLesson.content || '[]'}
                      onChange={(jsonContent) => setEditingLesson({ ...editingLesson, content: jsonContent })}
                    />
                  </div>
                )}

                {(editingLesson.type === 'assignment' || editingLesson.type === 'forum') && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center">
                    <CheckCircle className="mx-auto text-gold mb-2 opacity-60" size={32} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Este tipo de actividad se gestiona de forma interactiva en la vista del alumno (entrega de archivos / foro de mensajes).
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLesson}
                  className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {savingLesson ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Guardar Lección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseBuilder;
