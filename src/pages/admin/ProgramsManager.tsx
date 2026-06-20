import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import BlockEditor from '../../components/admin/BlockEditor';
import MediaUploader from '../../components/common/MediaUploader';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import {
  Plus, Edit3, Trash2, X, GraduationCap, BookOpen,
  ArrowUp, ArrowDown, ChevronRight, FolderPlus, FolderOpen,
  FileText, Search
} from 'lucide-react';
import type { Program, ProgramModule, ProgramLesson } from '../../types';
import MediaSearchModal from '../../components/admin/MediaSearchModal';

const programSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
});

const moduleSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
});

const lessonSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
});

type ProgramFormData = z.infer<typeof programSchema>;
type ModuleFormData = z.infer<typeof moduleSchema>;
type LessonFormData = z.infer<typeof lessonSchema>;

const ProgramsManager = () => {
  const { isReadOnly } = usePermissions();
  const readOnly = isReadOnly('programs');
  const confirm = useConfirmStore((state) => state.confirm);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Program form
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [coverImage, setCoverImage] = useState('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Module management
  const [modules, setModules] = useState<ProgramModule[]>([]);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<ProgramModule | null>(null);

  // Lesson management
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [lessons, setLessons] = useState<ProgramLesson[]>([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<ProgramLesson | null>(null);
  const [selectedModuleIdForNewLesson, setSelectedModuleIdForNewLesson] = useState<string | null>(null);
  const [publicContent, setPublicContent] = useState('');
  const [teacherContent, setTeacherContent] = useState('');

  const programForm = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: { title: '', description: '' },
  });

  const moduleForm = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: '', description: '' },
  });

  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '' },
  });

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    if (data) setPrograms(data);
    setLoading(false);
  };

  const fetchModulesAndLessons = async (programId: string) => {
    try {
      const [modulesRes, lessonsRes] = await Promise.all([
        supabase.from('program_modules').select('*').eq('program_id', programId).order('order'),
        supabase.from('program_lessons').select('*').eq('program_id', programId).order('order'),
      ]);
      if (modulesRes.data) setModules(modulesRes.data);
      if (lessonsRes.data) setLessons(lessonsRes.data);
    } catch (err) {
      console.error('Error fetching modules/lessons:', err);
      // Fallback: fetch flat lessons if modules table doesn't exist
      const { data } = await supabase.from('program_lessons').select('*').eq('program_id', programId).order('order');
      if (data) setLessons(data);
      setModules([]);
    }
  };

  const selectProgram = (program: Program) => {
    setSelectedProgram(program);
    fetchModulesAndLessons(program.id);
  };

  // Program CRUD
  const openCreateProgram = () => {
    setEditingProgram(null);
    programForm.reset({ title: '', description: '' });
    setCoverImage('');
    setShowProgramForm(true);
  };

  const openEditProgram = (program: Program) => {
    setEditingProgram(program);
    programForm.reset({ title: program.title, description: program.description || '' });
    setCoverImage(program.cover_image || '');
    setShowProgramForm(true);
  };

  const onSubmitProgram = async (data: ProgramFormData) => {
    const payload = { title: data.title, description: data.description || null, cover_image: coverImage || null };

    if (editingProgram) {
      const { error } = await supabase.from('programs').update(payload).eq('id', editingProgram.id);
      if (error) { toast.error('Error al actualizar'); return; }
      toast.success('Programa actualizado');
    } else {
      const { error } = await supabase.from('programs').insert(payload);
      if (error) { toast.error('Error al crear'); return; }
      toast.success('Programa creado');
    }
    setShowProgramForm(false);
    fetchPrograms();
  };

  const deleteProgram = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar programa de estudio',
      message: '¿Estás seguro de que deseas eliminar este programa, todos sus módulos y sus lecciones vinculadas?\n\nEsta acción no se puede deshacer.',
      confirmText: 'Eliminar todo',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Programa eliminado');
    if (selectedProgram?.id === id) { setSelectedProgram(null); setLessons([]); setModules([]); }
    fetchPrograms();
  };

  // Module CRUD
  const openCreateModule = () => {
    setEditingModule(null);
    moduleForm.reset({ title: '', description: '' });
    setShowModuleForm(true);
  };

  const openEditModule = (module: ProgramModule) => {
    setEditingModule(module);
    moduleForm.reset({ title: module.title, description: module.description || '' });
    setShowModuleForm(true);
  };

  const onSubmitModule = async (data: ModuleFormData) => {
    if (!selectedProgram) return;
    const payload = {
      program_id: selectedProgram.id,
      title: data.title,
      description: data.description || null,
      order: editingModule ? editingModule.order : modules.length,
    };

    if (editingModule) {
      const { error } = await supabase.from('program_modules').update(payload).eq('id', editingModule.id);
      if (error) { toast.error('Error al actualizar módulo'); return; }
      toast.success('Módulo actualizado');
    } else {
      const { error } = await supabase.from('program_modules').insert(payload);
      if (error) { toast.error('Error al crear módulo'); return; }
      toast.success('Módulo creado');
    }
    setShowModuleForm(false);
    fetchModulesAndLessons(selectedProgram.id);
  };

  const deleteModule = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar módulo',
      message: '¿Eliminar este volumen/módulo?\n\nLas lecciones vinculadas se mantendrán pero quedarán sin módulo asignado.',
      confirmText: 'Eliminar módulo',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (!selectedProgram) return;

    // Disconnect lessons first so they don't break or delete depending on schema (we set them to null module_id, or let cascade cascade)
    // Actually, SQL script has ON DELETE CASCADE. If cascade deletes them, it's better to warn the user, or let CASCADE handle it.
    const { error } = await supabase.from('program_modules').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar módulo'); return; }
    toast.success('Módulo eliminado');
    fetchModulesAndLessons(selectedProgram.id);
  };

  const moveModule = async (index: number, direction: 'up' | 'down') => {
    if (!selectedProgram) return;
    const newModules = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newModules.length) return;

    const tempOrder = newModules[index].order;
    newModules[index].order = newModules[swapIndex].order;
    newModules[swapIndex].order = tempOrder;

    await Promise.all([
      supabase.from('program_modules').update({ order: newModules[index].order }).eq('id', newModules[index].id),
      supabase.from('program_modules').update({ order: newModules[swapIndex].order }).eq('id', newModules[swapIndex].id),
    ]);

    fetchModulesAndLessons(selectedProgram.id);
  };

  // Lesson CRUD
  const openCreateLesson = (moduleId: string | null = null) => {
    setEditingLesson(null);
    lessonForm.reset({ title: '' });
    setSelectedModuleIdForNewLesson(moduleId);
    setPublicContent('');
    setTeacherContent('');
    setShowLessonForm(true);
  };

  const openEditLesson = (lesson: ProgramLesson) => {
    setEditingLesson(lesson);
    lessonForm.reset({ title: lesson.title });
    setSelectedModuleIdForNewLesson(lesson.module_id || null);
    setPublicContent(lesson.public_content || '');
    setTeacherContent(lesson.teacher_content || '');
    setShowLessonForm(true);
  };

  const onSubmitLesson = async (data: LessonFormData) => {
    if (!selectedProgram) return;

    const sameGroupLessons = lessons.filter(l => l.module_id === selectedModuleIdForNewLesson);
    const order = editingLesson && editingLesson.module_id === selectedModuleIdForNewLesson
      ? editingLesson.order 
      : sameGroupLessons.length;

    const payload = {
      program_id: selectedProgram.id,
      module_id: selectedModuleIdForNewLesson || null,
      title: data.title,
      public_content: publicContent,
      teacher_content: teacherContent,
      order: order,
    };

    if (editingLesson) {
      const { error } = await supabase.from('program_lessons').update(payload).eq('id', editingLesson.id);
      if (error) { toast.error('Error al actualizar lección'); return; }
      toast.success('Lección actualizada');
    } else {
      const { error } = await supabase.from('program_lessons').insert(payload);
      if (error) { toast.error('Error al crear lección'); return; }
      toast.success('Lección creada');
    }
    setShowLessonForm(false);
    fetchModulesAndLessons(selectedProgram.id);
  };

  const deleteLesson = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar lección',
      message: '¿Estás seguro de que deseas eliminar esta lección?',
      confirmText: 'Eliminar lección',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (!selectedProgram) return;
    const { error } = await supabase.from('program_lessons').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Lección eliminada');
    fetchModulesAndLessons(selectedProgram.id);
  };

  const moveLesson = async (lessonId: string, direction: 'up' | 'down', moduleId: string | null) => {
    if (!selectedProgram) return;
    
    const groupLessons = lessons.filter(l => l.module_id === moduleId);
    const index = groupLessons.findIndex(l => l.id === lessonId);
    if (index === -1) return;
    
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= groupLessons.length) return;

    const currentLesson = groupLessons[index];
    const swapLesson = groupLessons[swapIndex];

    const tempOrder = currentLesson.order;
    
    await Promise.all([
      supabase.from('program_lessons').update({ order: swapLesson.order }).eq('id', currentLesson.id),
      supabase.from('program_lessons').update({ order: tempOrder }).eq('id', swapLesson.id),
    ]);

    fetchModulesAndLessons(selectedProgram.id);
  };

  const standaloneLessons = lessons.filter(l => !l.module_id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-805 flex items-center gap-2">
            <GraduationCap className="text-indigo-600" size={28} />
            Programas de Estudio
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-450 mt-1">Administra la estructura curricular: Planes, Módulos y Lecciones bíblicas.</p>
        </div>
        {!readOnly && (
          <button onClick={openCreateProgram}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all cursor-pointer text-xs font-semibold shadow-sm hover:shadow active:scale-98">
            <Plus size={16} /> Nuevo Programa
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Programs List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Estudios / Programas</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl text-gray-400">
              <BookOpen size={36} className="mx-auto mb-2 opacity-25" />
              <p className="text-xs font-medium">No hay programas de estudio creados</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {programs.map((p) => (
                <div key={p.id}
                  onClick={() => selectProgram(p)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedProgram?.id === p.id
                      ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200 shadow-xxs'
                      : 'bg-white border-gray-150 hover:border-indigo-200 hover:bg-slate-50/50'
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {p.cover_image ? (
                        <img src={p.cover_image} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-150 dark:border-white/10 shadow-xxs" />
                      ) : (
                        <div className="w-11 h-11 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 border border-indigo-100">
                          <BookOpen size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{p.title}</h3>
                        {p.description && <p className="text-xxs text-gray-400 line-clamp-2 mt-0.5 font-light leading-normal">{p.description}</p>}
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <button onClick={(e) => { e.stopPropagation(); openEditProgram(p); }}
                          className="p-1 rounded-lg hover:bg-indigo-100/50 text-gray-400 hover:text-indigo-650 cursor-pointer transition-colors"><Edit3 size={13} /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteProgram(p.id); }}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-650 cursor-pointer transition-colors"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Modules and Lessons Hierarchy Panel */}
        <div className="lg:col-span-2">
          {!selectedProgram ? (
            <div className="text-center py-24 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xxs">
              <ChevronRight size={36} className="mb-2 opacity-20 rotate-90 lg:rotate-0" />
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Ningún Programa Seleccionado</p>
              <p className="text-xs text-gray-450 mt-1 max-w-xs leading-normal">Elige un estudio de la columna izquierda para estructurar sus volúmenes y contenidos.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Program Workspace Header */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-4 md:p-5 shadow-xxs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Estudio Seleccionado</span>
                  <h2 className="text-base font-serif font-bold text-gray-850 truncate mt-0.5">{selectedProgram.title}</h2>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button onClick={openCreateModule}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:text-indigo-600 hover:border-indigo-300 rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-xxs">
                      <FolderPlus size={14} /> Nuevo Módulo
                    </button>
                    <button onClick={() => openCreateLesson(null)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-xxs">
                      <Plus size={14} /> Nueva Lección General
                    </button>
                  </div>
                )}
              </div>

              {/* 3-Level Structured List */}
              <div className="space-y-4">
                {modules.length === 0 && standaloneLessons.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-xxs">
                    <FolderOpen size={40} className="mx-auto mb-2 opacity-25" />
                    <p className="text-xs font-medium">Este programa de estudio no contiene módulos ni lecciones aún</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Usa los botones superiores para organizar la estructura.</p>
                  </div>
                ) : (
                  <>
                    {/* Render Modules/Volumes */}
                    {modules.map((module, modIndex) => {
                      const moduleLessons = lessons.filter(l => l.module_id === module.id);
                      return (
                        <div key={module.id} className="bg-slate-50/50 border border-gray-150 dark:border-white/10 rounded-2xl p-4 shadow-xxs space-y-3">
                          {/* Module Bar */}
                          <div className="flex items-start justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 shadow-xxs">
                            <div className="min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  Módulo {modIndex + 1}
                                </span>
                                <span className="text-[10px] text-gray-400">({moduleLessons.length} lecciones)</span>
                              </div>
                              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mt-1">{module.title}</h3>
                              {module.description && <p className="text-xxs text-gray-400 font-light mt-0.5 leading-normal">{module.description}</p>}
                            </div>

                            {!readOnly && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => moveModule(modIndex, 'up')} disabled={modIndex === 0}
                                  className="p-1 rounded-lg hover:bg-slate-105 text-gray-400 disabled:opacity-20 cursor-pointer transition-colors"><ArrowUp size={13} /></button>
                                <button onClick={() => moveModule(modIndex, 'down')} disabled={modIndex === modules.length - 1}
                                  className="p-1 rounded-lg hover:bg-slate-105 text-gray-400 disabled:opacity-20 cursor-pointer transition-colors"><ArrowDown size={13} /></button>
                                <button onClick={() => openEditModule(module)}
                                  className="p-1 rounded-lg hover:bg-indigo-50 text-gray-450 hover:text-indigo-650 cursor-pointer transition-colors"><Edit3 size={13} /></button>
                                <button onClick={() => deleteModule(module.id)}
                                  className="p-1 rounded-lg hover:bg-red-50 text-gray-455 hover:text-red-650 cursor-pointer transition-colors"><Trash2 size={13} /></button>
                                <button onClick={() => openCreateLesson(module.id)}
                                  className="ml-1 flex items-center gap-0.5 px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                                  <Plus size={10} /> Lección
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Lessons inside this Module */}
                          <div className="pl-4 md:pl-6 space-y-2">
                            {moduleLessons.length === 0 ? (
                              <div className="text-center py-4 bg-white/60 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                <p className="text-xxs text-gray-450 italic">Sin lecciones vinculadas a este módulo.</p>
                              </div>
                            ) : (
                              moduleLessons.map((lesson, index) => (
                                <div key={lesson.id} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl p-3 flex items-center justify-between hover:border-indigo-150 transition-colors shadow-xxs">
                                  <div className="flex items-center gap-2.5 min-w-0 pr-4">
                                    <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-md text-[10px] font-bold">{index + 1}</span>
                                    <span className="font-medium text-gray-750 text-xs truncate">{lesson.title}</span>
                                    {lesson.teacher_content && (
                                      <span className="text-[9px] bg-purple-50 border border-purple-100 text-purple-700 font-bold px-1 py-0 rounded-md shrink-0">+ Guía Maestro</span>
                                    )}
                                  </div>
                                  {!readOnly && (
                                    <div className="flex gap-0.5">
                                      <button onClick={() => moveLesson(lesson.id, 'up', module.id)} disabled={index === 0}
                                        className="p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowUp size={12} /></button>
                                      <button onClick={() => moveLesson(lesson.id, 'down', module.id)} disabled={index === moduleLessons.length - 1}
                                        className="p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowDown size={12} /></button>
                                      <button onClick={() => openEditLesson(lesson)}
                                        className="p-1 rounded hover:bg-indigo-50/50 text-gray-400 hover:text-indigo-600 cursor-pointer"><Edit3 size={12} /></button>
                                      <button onClick={() => deleteLesson(lesson.id)}
                                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-650 cursor-pointer"><Trash2 size={12} /></button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Standalone Lessons Group */}
                    {standaloneLessons.length > 0 && (
                      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-4 shadow-xxs space-y-3">
                        <div className="border-b border-gray-100 dark:border-white/5 pb-2">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Lecciones Generales (Sin Módulo)</h3>
                        </div>
                        <div className="space-y-2">
                          {standaloneLessons.map((lesson, index) => (
                            <div key={lesson.id} className="bg-slate-50/40 border border-gray-150 dark:border-white/10 rounded-xl p-3 flex items-center justify-between hover:border-indigo-150 transition-colors shadow-xxs">
                              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                                <span className="w-5 h-5 flex items-center justify-center bg-gray-100 text-gray-500 dark:text-gray-450 rounded-md text-[10px] font-bold">{index + 1}</span>
                                <span className="font-medium text-gray-750 text-xs truncate">{lesson.title}</span>
                                {lesson.teacher_content && (
                                  <span className="text-[9px] bg-purple-50 border border-purple-100 text-purple-700 font-bold px-1 py-0 rounded-md shrink-0">+ Guía Maestro</span>
                                )}
                              </div>
                              {!readOnly && (
                                <div className="flex gap-0.5">
                                  <button onClick={() => moveLesson(lesson.id, 'up', null)} disabled={index === 0}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowUp size={12} /></button>
                                  <button onClick={() => moveLesson(lesson.id, 'down', null)} disabled={index === standaloneLessons.length - 1}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowDown size={12} /></button>
                                  <button onClick={() => openEditLesson(lesson)}
                                    className="p-1 rounded hover:bg-indigo-50/50 text-gray-400 hover:text-indigo-600 cursor-pointer"><Edit3 size={12} /></button>
                                  <button onClick={() => deleteLesson(lesson.id)}
                                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-650 cursor-pointer"><Trash2 size={12} /></button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Program Form Modal */}
      {showProgramForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowProgramForm(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-150 dark:border-white/10">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-base font-serif font-bold text-gray-800 dark:text-gray-100">{editingProgram ? 'Editar Programa' : 'Nuevo Programa'}</h2>
              <button onClick={() => setShowProgramForm(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 dark:text-gray-450 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={programForm.handleSubmit(onSubmitProgram)} className="p-5 space-y-4">
              <div>
                <label htmlFor="program-title" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                <input id="program-title" {...programForm.register('title')} className="w-full border border-gray-305 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder="Ej: Escuela de Liderazgo" />
                {programForm.formState.errors.title && <p className="text-red-500 text-xxs mt-1">{programForm.formState.errors.title.message}</p>}
              </div>
              <div>
                <label htmlFor="program-description" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea id="program-description" {...programForm.register('description')} rows={3} className="w-full border border-gray-305 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none" placeholder="Descripción corta del programa..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Imagen de Portada</label>
                {coverImage ? (
                  <div className="relative inline-block w-full">
                    <img src={coverImage} alt="" className="w-full h-36 object-cover rounded-xl border border-gray-200 dark:border-white/10" />
                    <button type="button" onClick={() => setCoverImage('')} className="absolute top-2 right-2 bg-red-505 text-white p-1 rounded-full cursor-pointer shadow-sm"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <MediaUploader folder="programas" onUploadSuccess={(url: string) => setCoverImage(url)} />
                    <span className="text-xxs text-gray-400">o</span>
                    <div className="flex-1 flex gap-1.5">
                      <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Pegar URL de imagen" className="flex-grow border border-gray-305 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 outline-none" />
                      <button
                        type="button"
                        onClick={() => setIsMediaModalOpen(true)}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-gray-600 dark:text-gray-400 cursor-pointer flex items-center justify-center shrink-0 border border-gray-250"
                        title="Buscar en internet"
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/5">
                <button type="button" onClick={() => setShowProgramForm(false)} className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-450 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm">{editingProgram ? 'Actualizar' : 'Crear Programa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {showModuleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowModuleForm(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-150 dark:border-white/10">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-base font-serif font-bold text-gray-800 dark:text-gray-100">{editingModule ? 'Editar Módulo' : 'Nuevo Módulo / Volumen'}</h2>
              <button onClick={() => setShowModuleForm(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 dark:text-gray-450 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={moduleForm.handleSubmit(onSubmitModule)} className="p-5 space-y-4">
              <div>
                <label htmlFor="module-title" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Título del Módulo *</label>
                <input id="module-title" {...moduleForm.register('title')} className="w-full border border-gray-305 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder="Ej: Volumen 1: Fundamentos Doctrinarios" />
                {moduleForm.formState.errors.title && <p className="text-red-500 text-xxs mt-1">{moduleForm.formState.errors.title.message}</p>}
              </div>
              <div>
                <label htmlFor="module-description" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea id="module-description" {...moduleForm.register('description')} rows={3} className="w-full border border-gray-305 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none" placeholder="Resumen del contenido de este volumen..." />
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/5">
                <button type="button" onClick={() => setShowModuleForm(false)} className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-450 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm">{editingModule ? 'Actualizar' : 'Crear Módulo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowLessonForm(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-150 dark:border-white/10 my-4">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-base font-serif font-bold text-gray-800 dark:text-gray-100">{editingLesson ? 'Editar Lección' : 'Nueva Lección'}</h2>
              <button onClick={() => setShowLessonForm(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 dark:text-gray-450 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={lessonForm.handleSubmit(onSubmitLesson)} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lesson-title" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Título de la Lección *</label>
                  <input id="lesson-title" {...lessonForm.register('title')} className="w-full border border-gray-305 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder="Ej: Lección 1 - Dios en la Creación" />
                  {lessonForm.formState.errors.title && <p className="text-red-500 text-xxs mt-1">{lessonForm.formState.errors.title.message}</p>}
                </div>
                <div>
                  <label htmlFor="lesson-module" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vincular a Módulo / Volumen</label>
                  <select
                    id="lesson-module"
                    value={selectedModuleIdForNewLesson || ''}
                    onChange={(e) => setSelectedModuleIdForNewLesson(e.target.value || null)}
                    className="w-full border border-gray-305 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 outline-none"
                  >
                    <option value="">Lección General (Sin Módulo)</option>
                    {modules.map(mod => (
                      <option key={mod.id} value={mod.id}>{mod.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Public content */}
              <div>
                <label className="block text-xs font-semibold text-gray-750 mb-1.5 flex items-center gap-1">
                  <FileText size={13} className="text-indigo-500" />
                  📖 Contenido Público (para Estudiantes)
                </label>
                <BlockEditor content={publicContent} onChange={setPublicContent} disabled={readOnly} />
              </div>

              {/* Teacher content */}
              <div className="bg-purple-50/40 border border-purple-150 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-semibold text-purple-800 flex items-center gap-1">
                  <GraduationCap size={14} className="text-purple-600" />
                  🎓 Guía del Maestro (Acceso Restringido)
                </label>
                <p className="text-xxs text-purple-600 font-light">Este material solo se mostrará a los roles autorizados (Maestro, Pastor, Admin).</p>
                <BlockEditor content={teacherContent} onChange={setTeacherContent} disabled={readOnly} />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/5">
                <button type="button" onClick={() => setShowLessonForm(false)} className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-450 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm">{editingLesson ? 'Actualizar Lección' : 'Crear Lección'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Media Search Modal */}
      <MediaSearchModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          setCoverImage(url);
        }}
        allowedTypes={['image']}
        title="Buscar Imagen de Portada"
      />
    </div>
  );
};

export default ProgramsManager;
