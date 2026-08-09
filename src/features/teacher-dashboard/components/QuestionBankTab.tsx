import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, BookOpen, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';

type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

interface QuestionBankTabProps {
  courseId: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Question {
  id: string;
  category_id: string | null;
  type: QuestionType;
  content: string;
  options: unknown;
  correct_answer: unknown;
  points: number;
  explanation: string | null;
}

interface OptionDraft {
  id: string;
  text: string;
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-gold dark:border-white/10 dark:bg-slate-950 dark:text-white';

export function QuestionBankTab({ courseId }: QuestionBankTabProps) {
  const queryClient = useQueryClient();
  const queryKey = ['teacher-question-bank', courseId] as const;
  const [activeTab, setActiveTab] = useState<'questions' | 'categories'>('questions');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [questionCategoryId, setQuestionCategoryId] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [questionContent, setQuestionContent] = useState('');
  const [questionPoints, setQuestionPoints] = useState(1);
  const [questionExplanation, setQuestionExplanation] = useState('');
  const [options, setOptions] = useState<OptionDraft[]>([
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('');
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(true);

  const { data = { categories: [], questions: [] }, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!courseId) return { categories: [] as Category[], questions: [] as Question[] };
      const [categoriesResult, questionsResult] = await Promise.all([
        supabase.from('lms_question_categories').select('id, name, description').eq('course_id', courseId).order('name'),
        supabase.from('lms_questions').select('id, category_id, type, content, options, correct_answer, points, explanation').eq('course_id', courseId).order('created_at', { ascending: false }),
      ]);
      if (categoriesResult.error) throw categoriesResult.error;
      if (questionsResult.error) throw questionsResult.error;
      return {
        categories: (categoriesResult.data || []) as Category[],
        questions: (questionsResult.data || []) as Question[],
      };
    },
    enabled: Boolean(courseId),
  });

  const refresh = async () => queryClient.invalidateQueries({ queryKey });

  const createCategory = useMutation({
    mutationFn: async () => {
      if (!courseId || !categoryName.trim()) throw new Error('Escribe el nombre de la categoría.');
      const { error: insertError } = await supabase.from('lms_question_categories').insert({
        course_id: courseId,
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
      });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      await refresh();
      setCategoryName('');
      setCategoryDescription('');
      setShowCategoryForm(false);
      toast.success('Categoría creada');
    },
    onError: (mutationError) => toast.error(mutationError instanceof Error ? mutationError.message : 'No se pudo crear la categoría'),
  });

  const createQuestion = useMutation({
    mutationFn: async () => {
      if (!courseId || !questionContent.trim()) throw new Error('Escribe el enunciado.');
      const categoryId = questionCategoryId || data.categories[0]?.id;
      if (!categoryId) throw new Error('Crea o selecciona una categoría.');

      const cleanOptions = options.filter((option) => option.text.trim()).map((option) => ({ ...option, text: option.text.trim() }));
      if (questionType === 'multiple_choice' && (cleanOptions.length < 2 || !correctOptionId || !cleanOptions.some((option) => option.id === correctOptionId))) {
        throw new Error('Agrega al menos dos opciones y marca la respuesta correcta.');
      }

      const { error: insertError } = await supabase.from('lms_questions').insert({
        course_id: courseId,
        category_id: categoryId,
        type: questionType,
        content: questionContent.trim(),
        points: questionPoints,
        explanation: questionExplanation.trim() || null,
        options: questionType === 'multiple_choice' ? cleanOptions : null,
        correct_answer: questionType === 'multiple_choice' ? correctOptionId : questionType === 'true_false' ? trueFalseAnswer : null,
      });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      await refresh();
      setQuestionContent('');
      setQuestionExplanation('');
      setQuestionPoints(1);
      setOptions([{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]);
      setCorrectOptionId('');
      setShowQuestionForm(false);
      toast.success('Pregunta guardada');
    },
    onError: (mutationError) => toast.error(mutationError instanceof Error ? mutationError.message : 'No se pudo guardar la pregunta'),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from('lms_questions').delete().eq('id', id);
      if (deleteError) throw deleteError;
    },
    onSuccess: async () => { await refresh(); toast.success('Pregunta eliminada'); },
    onError: () => toast.error('No se pudo eliminar la pregunta'),
  });

  if (!courseId) return <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white/80 py-14 text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><BookOpen className="mb-4 opacity-50" size={46} /><p>Selecciona un curso para abrir su banco de preguntas.</p></div>;
  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gold" /></div>;
  if (error) return <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle size={20} />No se pudo cargar el banco de preguntas.</div>;

  const selectedCategoryId = questionCategoryId || data.categories[0]?.id || '';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Banco de preguntas</h2><p className="text-sm text-slate-500">Preguntas reutilizables y respuestas correctas reales.</p></div>
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {(['questions', 'categories'] as const).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}>{tab === 'questions' ? 'Preguntas' : 'Categorías'}</button>)}
        </div>
      </div>

      {activeTab === 'categories' ? (
        <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-7">
          <div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-slate-900 dark:text-white">Categorías</h3><button type="button" onClick={() => setShowCategoryForm((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-white"><Plus size={16} /> Nueva</button></div>
          {showCategoryForm && <div className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/30 sm:grid-cols-2"><input className={inputClass} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Nombre" /><input className={inputClass} value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Descripción" /><button type="button" disabled={createCategory.isPending} onClick={() => createCategory.mutate()} className="min-h-10 rounded-xl bg-indigo-600 px-4 font-bold text-white sm:col-span-2">Guardar categoría</button></div>}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{data.categories.map((category) => <article key={category.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><h4 className="font-bold text-slate-900 dark:text-white">{category.name}</h4><p className="mt-1 text-sm text-slate-500">{category.description || 'Sin descripción'}</p><p className="mt-3 flex items-center gap-1 text-xs font-bold text-gold"><CheckCircle2 size={13} />{data.questions.filter((question) => question.category_id === category.id).length} preguntas</p></article>)}</div>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-7">
          <div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-slate-900 dark:text-white">Preguntas</h3><button type="button" onClick={() => { if (!data.categories.length) { setActiveTab('categories'); setShowCategoryForm(true); toast.info('Primero crea una categoría'); } else setShowQuestionForm((value) => !value); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-white"><Plus size={16} /> Nueva</button></div>
          {showQuestionForm && <div className="mb-6 space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/30 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2"><select className={inputClass} value={selectedCategoryId} onChange={(event) => setQuestionCategoryId(event.target.value)}>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select className={inputClass} value={questionType} onChange={(event) => setQuestionType(event.target.value as QuestionType)}><option value="multiple_choice">Opción múltiple</option><option value="true_false">Verdadero o falso</option><option value="essay">Desarrollo</option></select></div>
            <textarea className={`${inputClass} min-h-24`} value={questionContent} onChange={(event) => setQuestionContent(event.target.value)} placeholder="Enunciado de la pregunta" />
            {questionType === 'multiple_choice' && <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Opciones (marca la correcta)</p>{options.map((option, index) => <div key={option.id} className="flex items-center gap-2"><input type="radio" name="correct-option" checked={correctOptionId === option.id} onChange={() => setCorrectOptionId(option.id)} className="size-4 accent-emerald-500" /><input className={inputClass} value={option.text} onChange={(event) => setOptions((current) => current.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item))} placeholder={`Opción ${index + 1}`} />{options.length > 2 && <button type="button" onClick={() => setOptions((current) => current.filter((item) => item.id !== option.id))} className="rounded-lg p-2 text-red-500"><Trash2 size={16} /></button>}</div>)}<button type="button" onClick={() => setOptions((current) => [...current, { id: crypto.randomUUID(), text: '' }])} className="text-sm font-bold text-indigo-600">+ Agregar opción</button></div>}
            {questionType === 'true_false' && <select className={inputClass} value={String(trueFalseAnswer)} onChange={(event) => setTrueFalseAnswer(event.target.value === 'true')}><option value="true">Verdadero</option><option value="false">Falso</option></select>}
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]"><input className={inputClass} type="number" min="0.5" step="0.5" value={questionPoints} onChange={(event) => setQuestionPoints(Number(event.target.value) || 1)} /><input className={inputClass} value={questionExplanation} onChange={(event) => setQuestionExplanation(event.target.value)} placeholder="Explicación o retroalimentación" /></div>
            <button type="button" disabled={createQuestion.isPending} onClick={() => createQuestion.mutate()} className="min-h-11 w-full rounded-xl bg-indigo-600 font-bold text-white">Guardar pregunta</button>
          </div>}
          <div className="space-y-3">{data.questions.map((question) => { const category = data.categories.find((item) => item.id === question.category_id); return <article key={question.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div><div className="mb-2 flex flex-wrap gap-2"><span className="rounded-md bg-indigo-500/10 px-2 py-1 text-[10px] font-black uppercase text-indigo-600">{question.type === 'multiple_choice' ? 'Múltiple' : question.type === 'true_false' ? 'V/F' : 'Desarrollo'}</span><span className="rounded-md bg-gold/10 px-2 py-1 text-[10px] font-black uppercase text-gold">{category?.name || 'Sin categoría'}</span><span className="px-1 py-1 text-xs text-slate-400">{question.points} pts</span></div><p className="font-semibold text-slate-900 dark:text-white">{question.content}</p></div><button type="button" onClick={() => { if (window.confirm('¿Eliminar esta pregunta?')) deleteQuestion.mutate(question.id); }} className="shrink-0 rounded-xl p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={17} /></button></article>; })}{!data.questions.length && <p className="py-10 text-center text-slate-500">Todavía no hay preguntas.</p>}</div>
        </section>
      )}
    </div>
  );
}
