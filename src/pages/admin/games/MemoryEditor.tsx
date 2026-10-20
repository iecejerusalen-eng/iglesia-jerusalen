import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { BookOpen, Eye, EyeOff, Image as ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import type { MemoryDifficulty } from '../../public/games/memoryMatchLogic';

interface MemoryPairRecord {
  id: string;
  pair_name: string;
  image_url: string | null;
  match_image_url: string | null;
  card_label: string | null;
  match_label: string | null;
  match_text: string | null;
  explanation: string | null;
  bible_reference: string | null;
  difficulty: MemoryDifficulty;
  learning_question: string | null;
  learning_options: unknown;
  learning_answer: string | null;
  is_active: boolean;
}

interface PairForm {
  pairName: string;
  imageUrl: string;
  matchImageUrl: string;
  cardLabel: string;
  matchLabel: string;
  matchText: string;
  explanation: string;
  bibleReference: string;
  difficulty: MemoryDifficulty;
  learningQuestion: string;
  learningOptions: string;
  learningAnswer: string;
}

const EMPTY_FORM: PairForm = {
  pairName: '',
  imageUrl: '',
  matchImageUrl: '',
  cardLabel: 'Objeto',
  matchLabel: 'Relato',
  matchText: '',
  explanation: '',
  bibleReference: '',
  difficulty: 'easy',
  learningQuestion: '',
  learningOptions: '',
  learningAnswer: '',
};

const DIFFICULTY_LABELS: Record<MemoryDifficulty, string> = {
  easy: 'Inicial',
  medium: 'Intermedio',
  hard: 'Desafío',
};

const isImageSource = (value: string | null | undefined): boolean =>
  typeof value === 'string' && /^(https?:\/\/|\/)/i.test(value.trim());

export const MemoryEditor = () => {
  const [pairs, setPairs] = useState<MemoryPairRecord[]>([]);
  const [form, setForm] = useState<PairForm>(EMPTY_FORM);
  const [editingPair, setEditingPair] = useState<MemoryPairRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const intent = useRef<'draft' | 'publish'>('draft');

  const publishable = useMemo(() => {
    const first = form.pairName.trim().toLocaleLowerCase('es');
    const second = form.matchText.trim().toLocaleLowerCase('es');
    return Boolean(
      first && second && first !== second &&
      form.explanation.trim() && form.bibleReference.trim() && isImageSource(form.imageUrl) && isImageSource(form.matchImageUrl) &&
      form.learningQuestion.trim() && form.learningAnswer.trim() &&
      form.learningOptions.split('\n').map((option) => option.trim()).filter(Boolean).length >= 3 &&
      form.learningOptions.split('\n').map((option) => option.trim()).filter(Boolean).includes(form.learningAnswer.trim()),
    );
  }, [form]);

  const fetchPairs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('game_memory_cards')
      .select('id,pair_name,image_url,match_image_url,card_label,match_label,match_text,explanation,bible_reference,difficulty,learning_question,learning_options,learning_answer,is_active')
      .order('pair_name');
    if (error) {
      console.error('No se pudieron cargar las parejas del Memorama.', error);
      setLoadError('No pudimos cargar el contenido. Revisa tu conexión e inténtalo de nuevo.');
      setPairs([]);
    } else {
      setPairs((data ?? []) as MemoryPairRecord[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchPairs(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPairs]);

  const resetForm = () => {
    setEditingPair(null);
    setForm(EMPTY_FORM);
  };

  const editPair = (pair: MemoryPairRecord) => {
    setEditingPair(pair);
    setForm({
      pairName: pair.pair_name,
      imageUrl: pair.image_url ?? '',
      matchImageUrl: pair.match_image_url ?? '',
      cardLabel: pair.card_label ?? 'Concepto',
      matchLabel: pair.match_label ?? 'Relato',
      matchText: pair.match_text ?? '',
      explanation: pair.explanation ?? '',
      bibleReference: pair.bible_reference ?? '',
      difficulty: pair.difficulty,
      learningQuestion: pair.learning_question ?? '',
      learningOptions: Array.isArray(pair.learning_options) ? pair.learning_options.filter((item): item is string => typeof item === 'string').join('\n') : '',
      learningAnswer: pair.learning_answer ?? '',
    });
    document.getElementById('memory-pair-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const publish = intent.current === 'publish';
    intent.current = 'draft';
    if (!form.pairName.trim()) {
      toast.error('Añade el concepto de la primera carta.');
      return;
    }
    if (publish && !publishable) {
      toast.error('Completa las imágenes, explicación, referencia y pregunta de repaso antes de publicar.');
      return;
    }

    setSaving(true);
    const payload = {
      pair_name: form.pairName.trim(),
      image_url: form.imageUrl.trim() || null,
      match_image_url: form.matchImageUrl.trim() || null,
      card_label: form.cardLabel.trim() || 'Concepto',
      match_label: form.matchLabel.trim() || 'Relato',
      match_text: form.matchText.trim() || null,
      explanation: form.explanation.trim() || null,
      bible_reference: form.bibleReference.trim() || null,
      difficulty: form.difficulty,
      learning_question: form.learningQuestion.trim() || null,
      learning_options: form.learningOptions.split('\n').map((option) => option.trim()).filter(Boolean),
      learning_answer: form.learningAnswer.trim() || null,
      is_active: publish,
    };

    try {
      const result = editingPair
        ? await supabase.from('game_memory_cards').update(payload).eq('id', editingPair.id)
        : await supabase.from('game_memory_cards').insert([payload]);
      if (result.error) throw result.error;
      toast.success(publish ? 'Pareja publicada en el juego.' : 'Borrador guardado.');
      resetForm();
      await fetchPairs();
    } catch (error) {
      console.error('No se pudo guardar la pareja del Memorama.', error);
      toast.error('No se pudo guardar. Comprueba los campos y vuelve a intentarlo.');
    } finally {
      setSaving(false);
    }
  };

  const deletePair = async (pair: MemoryPairRecord) => {
    if (!window.confirm(`¿Eliminar la pareja “${pair.pair_name}”? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('game_memory_cards').delete().eq('id', pair.id);
    if (error) {
      console.error('No se pudo eliminar la pareja del Memorama.', error);
      toast.error('No se pudo eliminar la pareja.');
      return;
    }
    toast.success('Pareja eliminada.');
    if (editingPair?.id === pair.id) resetForm();
    await fetchPairs();
  };

  const togglePublish = async (pair: MemoryPairRecord) => {
    const options = Array.isArray(pair.learning_options) ? pair.learning_options.filter((item): item is string => typeof item === 'string') : [];
    const complete = Boolean(pair.pair_name.trim() && isImageSource(pair.image_url) && isImageSource(pair.match_image_url) && pair.match_text?.trim() && pair.explanation?.trim() && pair.bible_reference?.trim() && pair.learning_question?.trim() && pair.learning_answer?.trim() && options.length >= 3 && options.includes(pair.learning_answer.trim())
      && pair.pair_name.trim().toLocaleLowerCase('es') !== pair.match_text?.trim().toLocaleLowerCase('es'));
    if (!pair.is_active && !complete) {
      toast.error('Completa las imágenes, explicación, referencia y pregunta de repaso antes de publicar.');
      return;
    }
    const { error } = await supabase.from('game_memory_cards').update({ is_active: !pair.is_active }).eq('id', pair.id);
    if (error) {
      console.error('No se pudo cambiar el estado de la pareja.', error);
      toast.error('No se pudo cambiar el estado de publicación.');
      return;
    }
    toast.success(pair.is_active ? 'Pareja retirada del juego.' : 'Pareja publicada.');
    await fetchPairs();
  };

  const updateField = <K extends keyof PairForm>(key: K, value: PairForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return <main className="relative mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.11),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_35%)]" />
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">Formación · Juego público</p><h1 className="mt-2 font-serif text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">Parejas del Memorama</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Relaciona dos ideas bíblicas distintas. Revisa la vista previa y añade una referencia antes de publicar el contenido.</p></div>
      <button type="button" onClick={() => { resetForm(); document.getElementById('memory-pair-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-4 font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-400 dark:text-slate-950"><Plus size={18} /> Nueva pareja</button>
    </header>

    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:p-6" aria-labelledby="pair-list-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="pair-list-title" className="text-xl font-bold text-slate-950 dark:text-white">Biblioteca de contenido</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pairs.filter((pair) => pair.is_active).length} publicadas · {pairs.length} en total</p></div><button type="button" onClick={() => void fetchPairs()} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">Actualizar</button></div>
      {loading ? <p role="status" className="py-10 text-center text-slate-500">Cargando contenido…</p> : loadError ? <div role="alert" className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-900 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">{loadError}<button type="button" onClick={() => void fetchPairs()} className="ml-3 font-black underline">Reintentar</button></div> : pairs.length === 0 ? <p className="py-10 text-center text-slate-500 dark:text-slate-400">Aún no hay parejas. Crea una para comenzar.</p> : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {pairs.map((pair) => {
            const options = Array.isArray(pair.learning_options) ? pair.learning_options.filter((item): item is string => typeof item === 'string') : [];
            const complete = Boolean(isImageSource(pair.image_url) && isImageSource(pair.match_image_url) && pair.match_text?.trim() && pair.explanation?.trim() && pair.bible_reference?.trim() && pair.learning_question?.trim() && pair.learning_answer?.trim() && options.length >= 3 && options.includes(pair.learning_answer.trim())
              && pair.pair_name.trim().toLocaleLowerCase('es') !== pair.match_text?.trim().toLocaleLowerCase('es'));
            return <li key={pair.id} className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-bold text-slate-950 dark:text-white">{pair.pair_name} <span className="text-slate-400">↔</span> {pair.match_text || 'Asociación pendiente'}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${pair.is_active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>{pair.is_active ? 'Publicada' : 'Borrador'}</span></div><p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{pair.explanation || 'Añade una explicación bíblica.'}</p><p className="mt-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200"><BookOpen size={14} />{pair.bible_reference || 'Referencia pendiente'} · {DIFFICULTY_LABELS[pair.difficulty]}</p>{!complete && <p className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300">Falta completar el contenido para publicarlo.</p>}</div>
                <div className="flex shrink-0 gap-1.5">{[pair.image_url, pair.match_image_url].filter((image): image is string => Boolean(image)).map((image, imageIndex) => <div key={`${pair.id}-${imageIndex}`} className="grid size-12 place-items-center overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">{/^(https?:\/\/|\/)/.test(image) ? <img src={image} alt="" className="size-full object-cover" /> : <span className="text-2xl">{image}</span>}</div>)}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                <button type="button" onClick={() => editPair(pair)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/15 dark:text-white dark:hover:bg-white/5">Editar y previsualizar</button>
                <button type="button" onClick={() => void togglePublish(pair)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/15 dark:text-white dark:hover:bg-white/5" aria-label={pair.is_active ? `Retirar ${pair.pair_name}` : `Publicar ${pair.pair_name}`}>{pair.is_active ? <EyeOff size={14} /> : <Eye size={14} />}{pair.is_active ? 'Retirar' : 'Publicar'}</button>
                <button type="button" onClick={() => void deletePair(pair)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-300 dark:hover:bg-rose-500/10" aria-label={`Eliminar ${pair.pair_name}`}><Trash2 size={14} /> Eliminar</button>
              </div>
            </li>;
          })}
        </ul>
      )}
    </section>

    <section id="memory-pair-editor" className="scroll-mt-24 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:p-6">
      <div className="mb-5"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-blue-700 dark:text-blue-300">{editingPair ? 'Editar contenido' : 'Crear contenido'}</p><h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{editingPair ? editingPair.pair_name : 'Nueva asociación bíblica'}</h2></div>
      <form onSubmit={(event) => void handleSave(event)} className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primera carta" value={form.pairName} onChange={(value) => updateField('pairName', value)} required maxLength={100} placeholder="Ej. David" />
            <Field label="Imagen de la primera carta" value={form.imageUrl} onChange={(value) => updateField('imageUrl', value)} maxLength={2000} placeholder="Ruta pública, URL o emoji" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Etiqueta de carta 1" value={form.cardLabel} onChange={(value) => updateField('cardLabel', value)} maxLength={32} placeholder="Objeto" /><Field label="Imagen de la carta asociada" value={form.matchImageUrl} onChange={(value) => updateField('matchImageUrl', value)} maxLength={2000} placeholder="Ruta pública o URL" /><Field label="Etiqueta de carta 2" value={form.matchLabel} onChange={(value) => updateField('matchLabel', value)} maxLength={32} placeholder="Relato" /></div>
          <Field label="Carta que forma pareja" value={form.matchText} onChange={(value) => updateField('matchText', value)} maxLength={220} placeholder="Ej. Venció a Goliat" />
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Pregunta de repaso
            <input value={form.learningQuestion} onChange={(event) => updateField('learningQuestion', event.target.value)} maxLength={220} placeholder="¿Qué hizo David con la espada de Goliat?" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal dark:border-white/15 dark:bg-slate-900 dark:text-white" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Opciones (una por línea)
            <textarea value={form.learningOptions} onChange={(event) => updateField('learningOptions', event.target.value)} rows={4} maxLength={600} placeholder={'La guardó en el templo\nLa usó para derrotar al gigante\nLa entregó al rey'} className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal dark:border-white/15 dark:bg-slate-900 dark:text-white" />
          </label><Field label="Respuesta correcta (exacta)" value={form.learningAnswer} onChange={(value) => updateField('learningAnswer', value)} maxLength={180} placeholder="La usó para derrotar al gigante" /></div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Explicación breve
            <textarea value={form.explanation} onChange={(event) => updateField('explanation', event.target.value)} maxLength={600} rows={3} placeholder="Explica por qué se relacionan estas dos cartas." className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal leading-6 text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-white/15 dark:bg-slate-900 dark:text-white" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Referencia bíblica" value={form.bibleReference} onChange={(value) => updateField('bibleReference', value)} maxLength={120} placeholder="Ej. 1 Samuel 17:49-50" />
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Nivel
              <select value={form.difficulty} onChange={(event) => updateField('difficulty', event.target.value as MemoryDifficulty)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-900 dark:text-white">
                {(Object.keys(DIFFICULTY_LABELS) as MemoryDifficulty[]).map((value) => <option key={value} value={value}>{DIFFICULTY_LABELS[value]}</option>)}
              </select>
            </label>
          </div>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Antes de publicar, verifica que la explicación corresponda a la cita. El juego muestra la referencia, no reproduce una traducción bíblica.</p>
          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            <button type="submit" disabled={saving} onClick={() => { intent.current = 'draft'; }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:text-white dark:hover:bg-white/5"><Save size={16} />Guardar borrador</button>
            <button type="submit" disabled={saving || !publishable} onClick={() => { intent.current = 'publish'; }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-4 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-slate-950"><Eye size={16} />Guardar y publicar</button>
            {editingPair && <button type="button" onClick={resetForm} className="min-h-11 rounded-xl px-4 font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">Cancelar edición</button>}
          </div>
        </div>

        <aside className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/70 sm:p-6">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vista previa de las cartas</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PreviewCard title={form.pairName || 'Primera carta'} image={form.imageUrl} />
            <PreviewCard title={form.matchText || 'Carta asociada'} image={form.matchImageUrl} />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
            <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">Al encontrar la pareja</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{form.explanation || 'La explicación que completes aparecerá durante la partida.'}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200"><BookOpen size={14} />{form.bibleReference || 'Referencia bíblica pendiente'}</p>
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:text-slate-300"><strong>Repaso:</strong> {form.learningQuestion || 'Añade una pregunta para recordar el pasaje.'}<br /><strong>Respuesta:</strong> {form.learningAnswer || 'Pendiente'}</p>
          </div>
          {!publishable && <p className="mt-4 rounded-xl bg-amber-100/80 p-3 text-xs leading-5 text-amber-950 dark:bg-amber-300/10 dark:text-amber-100">Para publicar, completa ambas imágenes, las dos cartas, explicación, referencia y pregunta de repaso. Añade al menos tres opciones e incluye la respuesta correcta exactamente.</p>}
        </aside>
      </form>
    </section>
  </main>;
};

function Field({ label, value, onChange, required = false, maxLength, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; maxLength?: number; placeholder?: string }) {
  return <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">{label}
    <input required={required} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-white/15 dark:bg-slate-900 dark:text-white" />
  </label>;
}

function PreviewCard({ title, image }: { title: string; image?: string }) {
  return <div className="grid min-h-36 place-items-center rounded-2xl border-2 border-blue-900/20 bg-white p-4 text-center shadow-md dark:border-blue-300/20 dark:bg-slate-100">
    {image && (/^(https?:\/\/|\/)/.test(image) ? <img src={image} alt="" className="mb-2 size-12 rounded-xl object-cover" /> : image.trim().startsWith('<svg') ? <span className="mb-2 grid size-10 place-items-center" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(image, { USE_PROFILES: { svg: true } }) }} /> : <span className="mb-2 text-3xl">{image}</span>)}
    {!image && <ImageIcon size={20} className="mb-2 text-blue-900" aria-hidden="true" />}
    <span className="break-words text-sm font-black text-slate-900">{title}</span>
  </div>;
}
