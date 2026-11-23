import { useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, BookOpen, Check, Clock3, Copy, ImagePlus, Palette,
  Plus, Save, Trash2, X,
} from 'lucide-react';
import { BibleVerseLink } from '../../components/ui/BibleVerseLink';
import type {
  LiveQuizEditorContent,
  LiveQuizEditorQuestion,
  LiveQuizOptionKey,
  LiveQuizPresentation,
} from './types';

const MAX_QUESTIONS = 30;
const ANSWER_KEYS: LiveQuizOptionKey[] = ['a', 'b', 'c', 'd'];
const ANSWER_COLORS = ['#e5484d', '#3675df', '#e4a700', '#15966a'];
const COLOR_PRESETS = ['#1e3a8a', '#c79d3f', '#6b4ce6', '#15836f', '#9c3d55', '#3b647d'];

interface LiveQuizEditorProps {
  roomId: string;
  initialContent: LiveQuizEditorContent;
  busy: boolean;
  onClose: () => void;
  onSave: (content: LiveQuizEditorContent) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
}

function newQuestion(): LiveQuizEditorQuestion {
  return {
    id: createId(),
    type: 'multiple_choice',
    text: '',
    options: ANSWER_KEYS.map((key) => ({ key, text: '' })),
    correct_option: 'a',
    time_seconds: 20,
    explanation: '',
    bible_reference: '',
    image_url: '',
    image_alt: '',
    color: '#1e3a8a',
  };
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `q-${Date.now()}`;
}

function contrastColor(hex: string): string {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return '#0f172a';
  const channels = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const luminance = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return luminance[0] * 0.2126 + luminance[1] * 0.7152 + luminance[2] * 0.0722 > 0.42 ? '#142033' : '#ffffff';
}

function validateContent(content: LiveQuizEditorContent): string | null {
  if (content.title.trim().length < 3 || content.title.trim().length > 80) return 'El título debe tener entre 3 y 80 caracteres.';
  if (content.questions.length < 1 || content.questions.length > MAX_QUESTIONS) return 'La sala necesita entre 1 y 30 preguntas.';
  if (content.presentation.subtitle.length > 120) return 'El subtítulo admite hasta 120 caracteres.';
  if (content.presentation.cover_image_url && !content.presentation.cover_image_alt.trim()) return 'Añade el texto alternativo de la imagen de portada.';

  for (const [index, question] of content.questions.entries()) {
    if (question.text.trim().length < 8 || question.text.trim().length > 180) return `La pregunta ${index + 1} debe tener entre 8 y 180 caracteres.`;
    if (question.options.length < 2 || question.options.length > 4) return `La pregunta ${index + 1} necesita entre 2 y 4 respuestas.`;
    if (question.options.some((option) => !option.text.trim() || option.text.trim().length > 80)) return `Completa cada respuesta de la pregunta ${index + 1} (máximo 80 caracteres).`;
    if (!question.options.some((option) => option.key === question.correct_option)) return `Marca la respuesta correcta de la pregunta ${index + 1}.`;
    if (question.time_seconds < 10 || question.time_seconds > 60) return `El tiempo de la pregunta ${index + 1} debe ser de 10 a 60 segundos.`;
    if (question.explanation.length > 500 || question.bible_reference.length > 100) return `Reduce la explicación o la cita de la pregunta ${index + 1}.`;
    if (question.image_url && !question.image_alt.trim()) return `Añade el texto alternativo de la imagen de la pregunta ${index + 1}.`;
  }
  return null;
}

export function LiveQuizEditor({ roomId, initialContent, busy, onClose, onSave, onUploadImage }: LiveQuizEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [selectedId, setSelectedId] = useState('presentation');
  const [error, setError] = useState<string | null>(null);
  const selectedIndex = content.questions.findIndex((question) => question.id === selectedId);
  const selectedQuestion = selectedIndex >= 0 ? content.questions[selectedIndex] : null;
  const readyCount = useMemo(() => content.questions.filter((question) => question.text.trim().length >= 8
    && question.options.length >= 2 && question.options.every((option) => option.text.trim())).length, [content.questions]);

  const updatePresentation = (changes: Partial<LiveQuizPresentation>) => {
    setContent((current) => ({ ...current, presentation: { ...current.presentation, ...changes } }));
    setError(null);
  };

  const updateQuestion = (id: string, changes: Partial<LiveQuizEditorQuestion>) => {
    setContent((current) => ({
      ...current,
      questions: current.questions.map((question) => question.id === id ? { ...question, ...changes } : question),
    }));
    setError(null);
  };

  const addQuestion = (duplicate?: LiveQuizEditorQuestion) => {
    if (content.questions.length >= MAX_QUESTIONS) return;
    const question = duplicate ? { ...duplicate, id: createId(), options: duplicate.options.map((option) => ({ ...option })) } : newQuestion();
    setContent((current) => ({ ...current, questions: [...current.questions, question] }));
    setSelectedId(question.id);
  };

  const moveQuestion = (index: number, offset: number) => {
    const destination = index + offset;
    if (destination < 0 || destination >= content.questions.length) return;
    setContent((current) => {
      const questions = [...current.questions];
      [questions[index], questions[destination]] = [questions[destination], questions[index]];
      return { ...current, questions };
    });
  };

  const deleteQuestion = (question: LiveQuizEditorQuestion) => {
    if (content.questions.length <= 1) return;
    const questions = content.questions.filter((item) => item.id !== question.id);
    setContent((current) => ({ ...current, questions }));
    setSelectedId(questions[Math.max(0, selectedIndex - 1)]?.id ?? 'presentation');
  };

  const changeQuestionType = (question: LiveQuizEditorQuestion, type: LiveQuizEditorQuestion['type']) => {
    updateQuestion(question.id, {
      type,
      options: type === 'true_false'
        ? [{ key: 'a', text: 'Verdadero' }, { key: 'b', text: 'Falso' }]
        : ANSWER_KEYS.map((key) => ({ key, text: '' })),
      correct_option: type === 'true_false' && question.correct_option !== 'a' && question.correct_option !== 'b' ? 'a' : question.correct_option,
    });
  };

  const changeOption = (question: LiveQuizEditorQuestion, key: LiveQuizOptionKey, text: string) => {
    updateQuestion(question.id, { options: question.options.map((option) => option.key === key ? { ...option, text } : option) });
  };

  const addOption = (question: LiveQuizEditorQuestion) => {
    const key = ANSWER_KEYS.find((candidate) => !question.options.some((option) => option.key === candidate));
    if (!key || question.options.length >= 4) return;
    updateQuestion(question.id, { options: [...question.options, { key, text: '' }] });
  };

  const removeOption = (question: LiveQuizEditorQuestion, key: LiveQuizOptionKey) => {
    if (question.options.length <= 2) return;
    const options = question.options.filter((option) => option.key !== key);
    updateQuestion(question.id, { options, correct_option: question.correct_option === key ? options[0].key : question.correct_option });
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateContent(content);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await onSave(content);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No pudimos guardar los cambios.');
    }
  };

  return <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_28px_100px_-48px_rgba(15,23,42,.6)] dark:border-white/10 dark:bg-slate-900/90" aria-labelledby="live-quiz-editor-title" data-room-id={roomId}>
    <form onSubmit={(event) => void save(event)}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onClose} aria-label="Volver a la sala" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"><ArrowLeft size={18} /></button>
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Editor de sala</p><h1 id="live-quiz-editor-title" className="truncate font-serif text-xl font-bold sm:text-2xl">Prepara tu reto bíblico</h1></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline">{readyCount}/{content.questions.length} preguntas completas</span>
          <button type="button" onClick={onClose} className="hidden min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 sm:inline-flex"><X size={15} /> Salir</button>
          <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-black text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-300 dark:text-blue-950 dark:hover:bg-amber-200"><Save size={16} /> {busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </header>

      <div className="grid min-h-[70vh] xl:grid-cols-[220px_minmax(0,1fr)_310px]">
        <aside className="border-b border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/35 xl:border-b-0 xl:border-r" aria-label="Secciones del editor">
          <button type="button" onClick={() => setSelectedId('presentation')} aria-current={selectedId === 'presentation' ? 'page' : undefined} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${selectedId === 'presentation' ? 'border-blue-200 bg-blue-50 text-blue-950 shadow-sm dark:border-amber-200/30 dark:bg-amber-300/10 dark:text-white' : 'border-transparent text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-white/5'}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-200"><Palette size={17} /></span><span className="min-w-0"><span className="block text-sm font-black">Presentación</span><span className="block text-[10px] text-slate-500">Portada y estilo</span></span>
          </button>
          <div className="mt-6 flex items-center justify-between gap-2 px-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Preguntas <span className="font-semibold">{content.questions.length}</span></p><button type="button" onClick={() => addQuestion()} disabled={content.questions.length >= MAX_QUESTIONS} aria-label="Añadir pregunta" className="grid size-9 place-items-center rounded-xl bg-blue-950 text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 dark:bg-amber-300 dark:text-blue-950"><Plus size={17} /></button></div>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {content.questions.map((question, index) => <li key={question.id}>
              <div className={`flex items-stretch overflow-hidden rounded-2xl border transition ${selectedId === question.id ? 'border-amber-400 bg-white shadow-sm dark:bg-white/[.06]' : 'border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/[.02]'}`}>
                <button type="button" onClick={() => setSelectedId(question.id)} aria-current={selectedId === question.id ? 'page' : undefined} className="min-h-[58px] min-w-0 flex-1 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"><span className="flex items-center gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">{index + 1}</span><span className="truncate text-xs font-bold">{question.text.trim() || 'Nueva pregunta'}</span></span><span className="ml-8 mt-1 block text-[9px] font-bold uppercase tracking-[.12em] text-slate-500">{question.type === 'true_false' ? 'Verdadero o falso' : 'Opción múltiple'}</span></button>
                <div className="flex shrink-0 flex-col border-l border-slate-200 dark:border-white/10">
                  <button type="button" onClick={() => moveQuestion(index, -1)} disabled={index === 0} aria-label={`Mover pregunta ${index + 1} arriba`} className="grid min-h-7 min-w-8 flex-1 place-items-center text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-30 dark:hover:bg-white/10"><ArrowUp size={13} /></button>
                  <button type="button" onClick={() => moveQuestion(index, 1)} disabled={index === content.questions.length - 1} aria-label={`Mover pregunta ${index + 1} abajo`} className="grid min-h-7 min-w-8 flex-1 place-items-center text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-30 dark:hover:bg-white/10"><ArrowDown size={13} /></button>
                </div>
              </div>
            </li>)}
          </ol>
          <button type="button" onClick={() => addQuestion()} disabled={content.questions.length >= MAX_QUESTIONS} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 text-xs font-black text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 dark:border-white/15 dark:text-blue-200 dark:hover:bg-white/5"><Plus size={15} /> Añadir pregunta</button>
          <p className="mt-3 text-[10px] leading-5 text-slate-500">Puedes ordenar con las flechas. Máximo {MAX_QUESTIONS} preguntas.</p>
        </aside>

        <div className="min-w-0 p-5 sm:p-7">
          {selectedId === 'presentation' ? <PresentationFields content={content} onTitleChange={(title) => setContent((current) => ({ ...current, title }))} onChange={updatePresentation} onUploadImage={onUploadImage} /> : selectedQuestion ? <QuestionFields
            question={selectedQuestion}
            index={selectedIndex}
            questionCount={content.questions.length}
            onChange={(changes) => updateQuestion(selectedQuestion.id, changes)}
            onChangeType={(type) => changeQuestionType(selectedQuestion, type)}
            onChangeOption={(key, text) => changeOption(selectedQuestion, key, text)}
            onAddOption={() => addOption(selectedQuestion)}
            onRemoveOption={(key) => removeOption(selectedQuestion, key)}
            onDuplicate={() => addQuestion(selectedQuestion)}
            onDelete={() => deleteQuestion(selectedQuestion)}
            onUploadImage={onUploadImage}
          /> : <p className="text-sm text-slate-500">Selecciona una pregunta o añade una nueva.</p>}
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">{error}</p>}
        </div>

        <aside className="border-t border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/35 xl:border-l xl:border-t-0 xl:p-5" aria-label="Vista previa">
          <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Vista previa</p><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 dark:bg-white/5">{selectedId === 'presentation' ? 'Portada' : `Pregunta ${selectedIndex + 1}`}</span></div>
          <EditorPreview title={content.title} presentation={content.presentation} question={selectedQuestion} questionIndex={selectedIndex + 1} />
          <p className="mt-3 text-[10px] leading-5 text-slate-500">Así verán el contenido en sus pantallas. La respuesta correcta aparece cuando la persona anfitriona la revela.</p>
        </aside>
      </div>
    </form>
  </section>;
}

function PresentationFields({ content, onTitleChange, onChange, onUploadImage }: {
  content: LiveQuizEditorContent;
  onTitleChange: (title: string) => void;
  onChange: (changes: Partial<LiveQuizPresentation>) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  return <div className="space-y-6">
    <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">Antes de comenzar</p><h2 className="mt-1 font-serif text-2xl font-bold">Diseña la presentación</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Define el título, la portada y los colores que acompañarán el reto.</p></div>
    <Field label="Título de la sala" hint="3–80 caracteres"><input aria-label="Título de la sala" value={content.title} maxLength={80} onChange={(event) => onTitleChange(event.target.value)} className={inputClass} placeholder="Reto bíblico en vivo" /></Field>
    <Field label="Subtítulo" hint="Una frase breve para recibir al grupo"><textarea aria-label="Subtítulo de la presentación" rows={2} maxLength={120} value={content.presentation.subtitle} onChange={(event) => onChange({ subtitle: event.target.value })} className={inputClass} placeholder="Descubramos juntos lo que enseñan las Escrituras" /></Field>
    <ImageField label="Imagen de portada" value={content.presentation.cover_image_url} alt={content.presentation.cover_image_alt} onChange={(cover_image_url) => onChange({ cover_image_url, cover_image_alt: cover_image_url ? content.presentation.cover_image_alt : '' })} onAltChange={(cover_image_alt) => onChange({ cover_image_alt })} onUploadImage={onUploadImage} />
    <div className="grid gap-5 sm:grid-cols-2"><ColorField label="Fondo de presentación" value={content.presentation.background_color} onChange={(background_color) => onChange({ background_color })} /><ColorField label="Color de acento" value={content.presentation.accent_color} onChange={(accent_color) => onChange({ accent_color })} /></div>
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-950 dark:border-blue-300/10 dark:bg-blue-300/[.06] dark:text-blue-100"><p className="font-black">Consejo de presentación</p><p className="mt-1">Usa una imagen panorámica y colores con buen contraste para que el título se lea desde el proyector.</p></div>
  </div>;
}

function QuestionFields({ question, index, questionCount, onChange, onChangeType, onChangeOption, onAddOption, onRemoveOption, onDuplicate, onDelete, onUploadImage }: {
  question: LiveQuizEditorQuestion;
  index: number;
  questionCount: number;
  onChange: (changes: Partial<LiveQuizEditorQuestion>) => void;
  onChangeType: (type: LiveQuizEditorQuestion['type']) => void;
  onChangeOption: (key: LiveQuizOptionKey, text: string) => void;
  onAddOption: () => void;
  onRemoveOption: (key: LiveQuizOptionKey) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">Pregunta {index + 1} de {questionCount}</p><h2 className="mt-1 font-serif text-2xl font-bold">Edita el contenido</h2></div><div className="flex gap-2"><button type="button" onClick={onDuplicate} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"><Copy size={14} /> Duplicar</button><button type="button" onClick={onDelete} disabled={questionCount <= 1} className="grid size-10 place-items-center rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-30 dark:border-rose-300/20 dark:text-rose-200" aria-label="Eliminar pregunta"><Trash2 size={15} /></button></div></div>
    <Field label="Tipo de pregunta"><div className="grid grid-cols-2 gap-2"><TypeButton active={question.type === 'multiple_choice'} onClick={() => onChangeType('multiple_choice')}>Opción múltiple</TypeButton><TypeButton active={question.type === 'true_false'} onClick={() => onChangeType('true_false')}>Verdadero o falso</TypeButton></div></Field>
    <Field label="Pregunta" hint="8–180 caracteres"><textarea aria-label="Texto de la pregunta" rows={3} maxLength={180} value={question.text} onChange={(event) => onChange({ text: event.target.value })} className={inputClass} placeholder="Escribe la pregunta para el grupo…" /></Field>
    <ImageField label="Imagen de la pregunta" value={question.image_url} alt={question.image_alt} onChange={(image_url) => onChange({ image_url, image_alt: image_url ? question.image_alt : '' })} onAltChange={(image_alt) => onChange({ image_alt })} onUploadImage={onUploadImage} />
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-black">Respuestas</h3>{question.type === 'multiple_choice' && question.options.length < 4 && <button type="button" onClick={onAddOption} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-black text-blue-900 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-blue-200 dark:hover:bg-white/5"><Plus size={14} /> Añadir opción</button>}</div>
    <div className="grid gap-2 sm:grid-cols-2">
      {question.options.map((option, optionIndex) => {
        const correct = question.correct_option === option.key;
        const color = ANSWER_COLORS[optionIndex] ?? ANSWER_COLORS[0];
        return <div key={option.key} className={`flex min-h-[58px] items-center gap-2 rounded-xl border p-2.5 transition ${correct ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-300/30 dark:bg-emerald-300/[.07]' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.02]'}`}>
          <label className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-white focus-within:ring-2 focus-within:ring-amber-500" style={{ backgroundColor: color }} title={correct ? 'Respuesta correcta' : 'Marcar como correcta'}><input type="radio" name={`correct-${question.id}`} value={option.key} checked={correct} onChange={() => onChange({ correct_option: option.key })} aria-label={`Marcar ${option.text || `opción ${optionIndex + 1}`} como respuesta correcta`} className="size-4 accent-emerald-500" /></label>
          {question.type === 'true_false' ? <span className="min-w-0 flex-1 px-2 text-sm font-bold">{option.text}</span> : <input value={option.text} maxLength={80} onChange={(event) => onChangeOption(option.key, event.target.value)} aria-label={`Texto de la opción ${optionIndex + 1}`} placeholder={`Opción ${optionIndex + 1}`} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm font-semibold outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-500" />}
          {question.type === 'multiple_choice' && question.options.length > 2 && <button type="button" onClick={() => onRemoveOption(option.key)} aria-label={`Quitar opción ${optionIndex + 1}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-white/10"><X size={14} /></button>}
          {correct && <span className="sr-only">Respuesta correcta</span>}
        </div>;
      })}
    </div>
    <div className="grid gap-5 sm:grid-cols-2"><Field label="Tiempo para responder"><span className="relative block"><Clock3 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><select aria-label="Tiempo para responder" value={question.time_seconds} onChange={(event) => onChange({ time_seconds: Number(event.target.value) })} className={`${inputClass} pl-9`}>{[10, 15, 20, 30, 45, 60].map((seconds) => <option key={seconds} value={seconds}>{seconds} segundos</option>)}</select></span></Field><ColorField label="Color de esta pregunta" value={question.color} onChange={(color) => onChange({ color })} /></div>
    <Field label="Cita bíblica" hint="Se abre en el popup bíblico al revelar la respuesta"><span className="relative block"><BookOpen size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input aria-label="Cita bíblica" value={question.bible_reference} maxLength={100} onChange={(event) => onChange({ bible_reference: event.target.value })} className={`${inputClass} pl-9`} placeholder="Ejemplo: Génesis 1:1" /></span>{question.bible_reference.trim() && <div className="mt-2 rounded-xl bg-blue-50/70 px-3 py-2 text-xs dark:bg-blue-300/[.06]"><span className="mr-1 text-slate-500">Probar popup:</span><BibleVerseLink reference={question.bible_reference} preview className="font-black text-blue-900 underline decoration-blue-300 underline-offset-2 dark:text-blue-100" /></div>}</Field>
    <Field label="Explicación al revelar" hint="Hasta 500 caracteres"><textarea aria-label="Explicación al revelar la respuesta" rows={3} maxLength={500} value={question.explanation} onChange={(event) => onChange({ explanation: event.target.value })} className={inputClass} placeholder="Explica brevemente por qué esa respuesta es correcta…" /></Field>
  </div>;
}

function EditorPreview({ title, presentation, question, questionIndex }: { title: string; presentation: LiveQuizPresentation; question: LiveQuizEditorQuestion | null; questionIndex: number }) {
  const background = question ? '#ffffff' : presentation.background_color;
  const textColor = contrastColor(background);
  return <article className="mt-3 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
    <div className="min-h-36 p-4" style={{ backgroundColor: background, color: textColor }}>
      {question?.image_url ? <img src={question.image_url} alt={question.image_alt} className="mb-3 h-32 w-full rounded-xl object-cover" /> : !question && presentation.cover_image_url ? <img src={presentation.cover_image_url} alt={presentation.cover_image_alt} className="mb-3 h-36 w-full rounded-xl object-cover" /> : <div className="mb-4 grid h-24 place-items-center rounded-xl border border-current/15 bg-white/40 text-slate-400 dark:bg-black/10"><ImagePlus size={23} /><span className="mt-1 text-[9px] font-bold">Tu imagen aparecerá aquí</span></div>}
      <p className="text-[9px] font-black uppercase tracking-[.15em]" style={{ color: presentation.accent_color }}>{question ? `Pregunta ${questionIndex}` : 'Presentación'}</p>
      <h3 className="mt-1 break-words font-serif text-lg font-bold leading-snug">{question?.text || title || 'Título de la sala'}</h3>
      {!question && <p className="mt-1 text-xs leading-5 opacity-80">{presentation.subtitle || 'Subtítulo para recibir al grupo'}</p>}
      {question && <>
        <div className="mt-3 grid gap-2">{question.options.map((option, index) => <div key={option.key} className="flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] font-bold text-white" style={{ backgroundColor: ANSWER_COLORS[index] ?? ANSWER_COLORS[0] }}><span className="grid size-5 place-items-center rounded-md bg-black/15">{String.fromCharCode(65 + index)}</span><span className="min-w-0 flex-1 break-words">{option.text || `Opción ${index + 1}`}</span>{question.correct_option === option.key && <Check size={13} />}</div>)}</div>
        {question.bible_reference.trim() && <p className="mt-3 text-[10px] font-semibold" style={{ color: presentation.accent_color }}><BibleVerseLink reference={question.bible_reference} preview className="underline underline-offset-2" /></p>}
      </>}
    </div>
    <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-[9px] font-bold text-slate-500 dark:border-white/10"><span>{question?.type === 'true_false' ? 'Verdadero o falso' : question ? 'Opción múltiple' : 'Vista de participantes'}</span>{question && <span>{question.time_seconds}s</span>}</div>
  </article>;
}

function ImageField({ label, value, alt, onChange, onAltChange, onUploadImage }: {
  label: string;
  value: string;
  alt: string;
  onChange: (value: string) => void;
  onAltChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      onChange(await onUploadImage(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No pudimos subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><label htmlFor={inputId} className="block text-xs font-black text-slate-900 dark:text-white">{label}</label><p className="mt-1 text-[10px] text-slate-500">JPG, PNG o WebP · hasta 4 MB</p></div><input ref={inputRef} id={inputId} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void handleFile(event)} className="sr-only" /><button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 px-3 text-xs font-black text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 dark:border-blue-200/20 dark:text-blue-100 dark:hover:bg-white/5"><ImagePlus size={15} /> {uploading ? 'Subiendo…' : value ? 'Cambiar imagen' : 'Subir imagen'}</button></div>
    {error && <p role="alert" className="mt-3 text-xs font-bold text-rose-700 dark:text-rose-200">{error}</p>}
    {value && <div className="mt-4 grid gap-3 sm:grid-cols-[112px_1fr]"><img src={value} alt={alt} className="h-24 w-28 rounded-xl object-cover" /><div className="min-w-0"><label htmlFor={`${inputId}-alt`} className="block text-[10px] font-black text-slate-700 dark:text-slate-200">Texto alternativo</label><input id={`${inputId}-alt`} value={alt} maxLength={180} onChange={(event) => onAltChange(event.target.value)} className={`${inputClass} mt-1`} placeholder="Describe lo que muestra la imagen" /><button type="button" onClick={() => onChange('')} className="mt-2 text-[10px] font-black text-rose-700 underline underline-offset-2 dark:text-rose-200">Quitar imagen</button></div></div>}
  </div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return <div><label htmlFor={id} className="block text-xs font-black text-slate-800 dark:text-slate-200">{label}</label><div className="mt-2 flex flex-wrap items-center gap-2"><input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-11 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-slate-900" aria-label={`Elegir ${label.toLowerCase()}`} /><code className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">{value.toUpperCase()}</code><div className="flex gap-1.5" aria-label="Colores sugeridos">{COLOR_PRESETS.map((color) => <button key={color} type="button" onClick={() => onChange(color)} aria-label={`Usar color ${color}`} aria-pressed={value.toLowerCase() === color} className="size-6 rounded-full border border-black/10 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" style={{ backgroundColor: color }} />)}</div></div></div>;
}

function TypeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 rounded-xl border px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${active ? 'border-blue-950 bg-blue-950 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-blue-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5'}`}>{children}</button>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const labelId = useId();
  return <div role="group" aria-labelledby={labelId}><p id={labelId} className="text-xs font-black text-slate-800 dark:text-slate-200">{label}</p>{hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}<div className="mt-2">{children}</div></div>;
}

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950/40 dark:text-white';
