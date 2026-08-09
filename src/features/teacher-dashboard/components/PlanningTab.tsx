import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckSquare, ChevronDown, ChevronRight, File, FileText, Loader2, MonitorPlay, Plus, Quote, Save, Trash2, Upload, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import BlockEditor from '../../../components/admin/BlockEditor';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

interface PlanningModule { id: string; title: string; description: string | null; order_index: number; }
interface PlanningLesson { id: string; module_id: string; title: string; type: string; description: string | null; order_index: number; }
interface PlanningResource { id: string; module_id: string | null; title: string; file_url: string; file_size: number | null; }

interface PlanningTabProps {
  modules?: PlanningModule[];
  materials: PlanningLesson[];
  activities: PlanningLesson[];
  resources?: PlanningResource[];
  courseId?: string;
  schoolType?: 'age_based' | 'rank_based' | 'custom';
}

type LessonType = 'document' | 'assignment' | 'quiz' | 'memory_verse' | 'final_exam';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export function PlanningTab({ modules = [], materials, activities, resources = [], courseId, schoolType = 'custom' }: PlanningTabProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [uploadingModuleId, setUploadingModuleId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('document');
  const [lessonContent, setLessonContent] = useState('[]');
  const [memoryVerse, setMemoryVerse] = useState('');
  const [lessonPoints, setLessonPoints] = useState('10');
  const [lessonDueDate, setLessonDueDate] = useState('');
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  const invalidatePlanning = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-planning', courseId] });
  };

  const resetComposer = () => {
    setLessonTitle('');
    setLessonDescription('');
    setLessonType('document');
    setLessonContent('[]');
    setMemoryVerse('');
    setLessonPoints('10');
    setLessonDueDate('');
    setShowComposer(false);
  };

  const handleSaveLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!courseId || !lessonModuleId || !lessonTitle.trim()) {
      toast.error('Selecciona una semana y escribe el título de la actividad.');
      return;
    }
    setIsSavingLesson(true);
    try {
      const moduleLessons = [...materials, ...activities].filter((lesson) => lesson.module_id === lessonModuleId);
      const { error } = await supabase.from('lms_lessons').insert({
        module_id: lessonModuleId,
        title: lessonTitle.trim(),
        description: lessonDescription.trim() || null,
        type: lessonType === 'final_exam' ? 'quiz' : lessonType,
        content: lessonContent,
        due_date: lessonDueDate ? new Date(lessonDueDate).toISOString() : null,
        settings: {
          activity_kind: lessonType,
          memory_verse: memoryVerse.trim() || null,
          points: Number(lessonPoints) || 0,
          completion_mode: lessonType === 'memory_verse' ? 'teacher_or_student_check' : 'standard',
          grading_scope: lessonType === 'final_exam' ? 'annual' : 'weekly',
          requires_leadership_review: lessonType === 'final_exam',
        },
        order_index: moduleLessons.length,
      });
      if (error) throw error;
      await invalidatePlanning();
      toast.success('Actividad semanal creada.');
      resetComposer();
    } catch (error: unknown) {
      console.error('Error creating weekly lesson:', error);
      toast.error(errorMessage(error));
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !courseId || !user || !uploadingModuleId) return;
    event.target.value = '';
    setIsUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'bin';
      const filePath = `${courseId}/${uploadingModuleId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('lms_resources').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('lms_resources').getPublicUrl(filePath);
      const { error: databaseError } = await supabase.from('lms_course_resources').insert({
        course_id: courseId,
        module_id: uploadingModuleId,
        title: file.name,
        file_url: publicUrlData.publicUrl,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        created_by: user.id,
      });
      if (databaseError) throw databaseError;
      await invalidatePlanning();
      toast.success('Recurso subido correctamente.');
    } catch (error: unknown) {
      console.error('Error uploading LMS resource:', error);
      toast.error(errorMessage(error));
    } finally {
      setIsUploading(false);
      setUploadingModuleId(null);
    }
  };

  const deleteResource = async (resourceId: string) => {
    if (!window.confirm('¿Eliminar este recurso de la clase?')) return;
    try {
      const { error } = await supabase.from('lms_course_resources').delete().eq('id', resourceId);
      if (error) throw error;
      await invalidatePlanning();
      toast.success('Recurso eliminado.');
    } catch (error: unknown) {
      console.error('Error deleting LMS resource:', error);
      toast.error(errorMessage(error));
    }
  };

  const lessonIcon = (type: string) => {
    if (type === 'video') return <Video size={14} className="text-blue-500" />;
    if (type === 'quiz') return <CheckSquare size={14} className="text-emerald-500" />;
    if (type === 'assignment') return <BookOpen size={14} className="text-amber-500" />;
    if (type === 'memory_verse') return <Quote size={14} className="text-violet-500" />;
    if (type === 'zoom') return <MonitorPlay size={14} className="text-indigo-500" />;
    return <FileText size={14} className="text-slate-500" />;
  };

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar" onChange={handleUploadFile} />

      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 dark:border-indigo-400/15 dark:from-indigo-500/10 dark:to-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-wider text-indigo-500">Planificación semanal</p><h2 className="mt-1 font-serif text-xl font-black text-slate-900 dark:text-white">Lecciones, tareas y versículos por bloques</h2><p className="mt-1 text-sm text-slate-500">Combina contenido, preguntas, juegos, recursos y calificaciones.</p></div>
        <button type="button" disabled={modules.length === 0} onClick={() => { setLessonModuleId(modules[0]?.id || ''); setShowComposer(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50"><Plus size={17} /> Nueva actividad</button>
      </div>

      {showComposer && (
        <form onSubmit={handleSaveLesson} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-amber-500">Editor docente</p><h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Nueva actividad semanal</h3></div><button type="button" onClick={resetComposer} aria-label="Cerrar editor" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5"><X size={19} /></button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold text-slate-500">Semana / unidad<select value={lessonModuleId} onChange={(event) => setLessonModuleId(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-white/10 dark:bg-slate-950"><option value="">Selecciona...</option>{modules.map((module, index) => <option key={module.id} value={module.id}>Semana {index + 1}: {module.title}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-500">Tipo<select value={lessonType} onChange={(event) => setLessonType(event.target.value as LessonType)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-white/10 dark:bg-slate-950"><option value="document">Lección / blog</option><option value="assignment">Tarea calificable</option><option value="quiz">Evaluación semanal</option><option value="memory_verse">Versículo semanal</option>{schoolType === 'rank_based' && <option value="final_exam">Examen final anual</option>}</select></label>
            <label className="text-xs font-bold text-slate-500 md:col-span-2">Título<input value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-white/10 dark:bg-slate-950" /></label>
            <label className="text-xs font-bold text-slate-500 md:col-span-2">Descripción<textarea value={lessonDescription} onChange={(event) => setLessonDescription(event.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-950" /></label>
            {lessonType === 'memory_verse' && <label className="text-xs font-bold text-slate-500 md:col-span-2"><span className="flex items-center gap-2"><Quote size={14} /> Versículo para memorizar</span><textarea value={memoryVerse} onChange={(event) => setMemoryVerse(event.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-400/15 dark:bg-amber-500/10" /></label>}
            <label className="text-xs font-bold text-slate-500">Puntaje<input type="number" min="0" value={lessonPoints} onChange={(event) => setLessonPoints(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-white/10 dark:bg-slate-950" /></label>
            <label className="text-xs font-bold text-slate-500">Fecha límite<input type="datetime-local" value={lessonDueDate} onChange={(event) => setLessonDueDate(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-white/10 dark:bg-slate-950" /></label>
          </div>
          <div className="mt-5"><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Contenido interactivo</p><div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950"><BlockEditor content={lessonContent} onChange={setLessonContent} /></div></div>
          <div className="mt-5 flex justify-end"><button type="submit" disabled={isSavingLesson} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-6 text-sm font-black text-slate-950 disabled:opacity-60">{isSavingLesson ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Guardar actividad</button></div>
        </form>
      )}

      {modules.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900"><BookOpen className="mx-auto text-slate-300" size={42} /><h3 className="mt-4 font-serif text-lg font-bold">No hay semanas planificadas</h3><p className="mt-1 text-sm text-slate-500">Crea primero la estructura del curso para organizar sus actividades por semana.</p></div>
      ) : modules.map((module, index) => {
        const isExpanded = Boolean(expandedModules[module.id]);
        const moduleLessons = [...materials, ...activities].filter((lesson) => lesson.module_id === module.id).sort((a, b) => a.order_index - b.order_index);
        const moduleResources = resources.filter((resource) => resource.module_id === module.id);
        return (
          <article key={module.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <button type="button" onClick={() => setExpandedModules((current) => ({ ...current, [module.id]: !current[module.id] }))} className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03]"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-sm font-black text-amber-600">{index + 1}</span><div className="min-w-0"><h3 className="truncate font-bold text-slate-900 dark:text-white">Semana {index + 1}: {module.title}</h3><p className="truncate text-xs text-slate-500">{module.description || 'Sin descripción'}</p></div></div><span className="flex items-center gap-3 text-xs font-bold text-slate-400"><span>{moduleLessons.length} actividades</span>{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span></button>
            {isExpanded && <div className="space-y-5 border-t border-slate-100 p-5 dark:border-white/5"><div className="space-y-2">{moduleLessons.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400 dark:bg-slate-950">Semana sin actividades.</p> : moduleLessons.map((lesson) => <div key={lesson.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-950/60"><span className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">{lessonIcon(lesson.type)}</span><div><p className="text-sm font-bold text-slate-800 dark:text-white">{lesson.title}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{lesson.type === 'memory_verse' ? 'Versículo semanal' : lesson.type}</p></div></div>)}</div><div><div className="mb-3 flex items-center justify-between"><h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><File size={14} /> Recursos</h4><button type="button" disabled={isUploading} onClick={() => { setUploadingModuleId(module.id); fileInputRef.current?.click(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"><Upload size={13} /> Subir archivo</button></div><div className="grid gap-2 sm:grid-cols-2">{moduleResources.map((resource) => <div key={resource.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/5"><FileText className="shrink-0 text-rose-500" size={18} /><a href={resource.file_url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-bold text-indigo-600">{resource.title}</a><button type="button" onClick={() => void deleteResource(resource.id)} aria-label={`Eliminar ${resource.title}`} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button></div>)}</div></div></div>}
          </article>
        );
      })}
    </div>
  );
}
