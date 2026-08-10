import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, Edit3, Plus, RefreshCw, Search, Trash2, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';

type Difficulty = 'easy' | 'medium' | 'hard';

interface CharacterRecord {
  id: string;
  name: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  clues: unknown;
  category: string;
  difficulty: Difficulty;
  image_url: string | null;
  is_active: boolean;
}

interface CharacterForm {
  name: string;
  distractors: [string, string, string];
  clues: [string, string, string, string];
  category: string;
  difficulty: Difficulty;
  imageUrl: string;
  isActive: boolean;
}

const emptyForm = (): CharacterForm => ({
  name: '',
  distractors: ['', '', ''],
  clues: ['', '', '', ''],
  category: 'Personajes',
  difficulty: 'medium',
  imageUrl: '',
  isActive: true
});

const parseClues = (value: unknown): [string, string, string, string] => {
  const clues = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, 4)
    : [];
  return [clues[0] ?? '', clues[1] ?? '', clues[2] ?? '', clues[3] ?? ''];
};

const difficultyLabel: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Intermedio',
  hard: 'Avanzado'
};

export const GuessCharacterEditor = () => {
  const [characters, setCharacters] = useState<CharacterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CharacterForm>(emptyForm);
  const [isOpen, setIsOpen] = useState(false);

  const loadCharacters = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_guess_characters')
      .select('id, name, option_a, option_b, option_c, option_d, clues, category, difficulty, image_url, is_active')
      .order('category')
      .order('name');

    if (error) {
      console.error('No se pudieron cargar los personajes:', error);
      toast.error('No se pudo cargar la biblioteca de personajes');
      setCharacters([]);
    } else {
      setCharacters((data ?? []) as CharacterRecord[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCharacters(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCharacters]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsOpen(true);
  };

  const openEdit = (character: CharacterRecord) => {
    const alternatives = [character.option_a, character.option_b, character.option_c, character.option_d]
      .filter(option => option !== character.name)
      .slice(0, 3);
    setEditingId(character.id);
    setForm({
      name: character.name,
      distractors: [alternatives[0] ?? '', alternatives[1] ?? '', alternatives[2] ?? ''],
      clues: parseClues(character.clues),
      category: character.category,
      difficulty: character.difficulty,
      imageUrl: character.image_url ?? '',
      isActive: character.is_active
    });
    setIsOpen(true);
  };

  const updateDistractor = (index: number, value: string) => {
    setForm(current => {
      const distractors: [string, string, string] = [...current.distractors];
      distractors[index] = value;
      return { ...current, distractors };
    });
  };

  const updateClue = (index: number, value: string) => {
    setForm(current => {
      const clues: [string, string, string, string] = [...current.clues];
      clues[index] = value;
      return { ...current, clues };
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const distractors = form.distractors.map(item => item.trim());
    const clues = form.clues.map(item => item.trim());
    const allOptions = [name, ...distractors];

    if (new Set(allOptions.map(item => item.toLocaleLowerCase('es'))).size !== 4) {
      toast.error('La respuesta y las tres alternativas deben ser diferentes');
      return;
    }
    if (clues.some(clue => clue.length < 8)) {
      toast.error('Cada pista debe contener al menos 8 caracteres');
      return;
    }

    setSaving(true);
    const payload = {
      name,
      option_a: name,
      option_b: distractors[0],
      option_c: distractors[1],
      option_d: distractors[2],
      clues,
      category: form.category.trim() || 'Personajes',
      difficulty: form.difficulty,
      image_url: form.imageUrl.trim() || null,
      is_active: form.isActive,
      updated_at: new Date().toISOString()
    };

    const result = editingId
      ? await supabase.from('game_guess_characters').update(payload).eq('id', editingId)
      : await supabase.from('game_guess_characters').insert(payload);

    if (result.error) {
      console.error('No se pudo guardar el personaje:', result.error);
      toast.error('No se pudo guardar el personaje');
    } else {
      toast.success(editingId ? 'Personaje actualizado' : 'Personaje agregado');
      setIsOpen(false);
      await loadCharacters();
    }
    setSaving(false);
  };

  const handleDelete = async (character: CharacterRecord) => {
    if (!window.confirm(`¿Eliminar a ${character.name}? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('game_guess_characters').delete().eq('id', character.id);
    if (error) {
      console.error('No se pudo eliminar el personaje:', error);
      toast.error('No se pudo eliminar el personaje');
      return;
    }
    toast.success('Personaje eliminado');
    await loadCharacters();
  };

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const filteredCharacters = characters.filter(character =>
    !normalizedQuery || `${character.name} ${character.category}`.toLocaleLowerCase('es').includes(normalizedQuery)
  );

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-8 text-white shadow-2xl sm:px-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              <BookOpen size={16} /> Contenido formativo
            </div>
            <h1 className="font-serif text-3xl font-black tracking-tight sm:text-4xl">Descubre el personaje</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Administra respuestas, distractores y pistas progresivas. Los cambios activos aparecen automáticamente en el juego público.
            </p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50">
            <Plus size={18} /> Nuevo personaje
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-white/75 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <span className="sr-only">Buscar personajes</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nombre o categoría" className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:ring-blue-950" />
          </label>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
            <span><strong className="text-slate-900 dark:text-white">{characters.length}</strong> personajes</span>
            <button type="button" onClick={() => void loadCharacters()} disabled={loading} className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5" aria-label="Actualizar biblioteca">
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(item => <div key={item} className="h-44 animate-pulse rounded-3xl bg-slate-100 dark:bg-white/5" />)}
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="py-16 text-center">
            <UserRound className="mx-auto mb-4 text-slate-300" size={44} />
            <p className="font-bold text-slate-800 dark:text-white">No se encontraron personajes</p>
            <p className="mt-1 text-sm text-slate-500">Prueba otra búsqueda o agrega el primero.</p>
          </div>
        ) : (
          <div className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCharacters.map(character => (
              <article key={character.id} className="group rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-5 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:from-slate-900 dark:to-slate-950">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><UserRound size={21} /></div>
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-slate-950 dark:text-white">{character.name}</h2>
                      <p className="truncate text-xs text-slate-500">{character.category}</p>
                    </div>
                  </div>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${character.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={character.is_active ? 'Activo' : 'Oculto'} />
                </div>
                <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600 dark:text-slate-300">{parseClues(character.clues)[0]}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 pt-4 dark:border-white/10">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">{difficultyLabel[character.difficulty]}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(character)} className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-500/10" aria-label={`Editar ${character.name}`}><Edit3 size={17} /></button>
                    <button type="button" onClick={() => void handleDelete(character)} className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10" aria-label={`Eliminar ${character.name}`}><Trash2 size={17} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="character-editor-title">
          <form onSubmit={handleSave} className="my-auto w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900/95 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Biblioteca bíblica</p>
                <h2 id="character-editor-title" className="mt-1 font-serif text-2xl font-black text-slate-950 dark:text-white">{editingId ? 'Editar personaje' : 'Nuevo personaje'}</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Cerrar"><X size={20} /></button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Respuesta correcta
                <input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:focus:ring-blue-950" placeholder="Ej. Moisés" />
              </label>
              {form.distractors.map((distractor, index) => (
                <label key={index} className="text-sm font-semibold text-slate-700 dark:text-slate-200">Alternativa {index + 1}
                  <input required value={distractor} onChange={event => updateDistractor(index, event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:focus:ring-blue-950" />
                </label>
              ))}
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Categoría
                <input required value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:focus:ring-blue-950" />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dificultad
                <select value={form.difficulty} onChange={event => setForm(current => ({ ...current, difficulty: event.target.value as Difficulty }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950">
                  <option value="easy">Fácil</option><option value="medium">Intermedio</option><option value="hard">Avanzado</option>
                </select>
              </label>
              <label className="sm:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Imagen opcional
                <input type="url" value={form.imageUrl} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:focus:ring-blue-950" placeholder="https://…" />
              </label>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Pistas progresivas</p>
              <p className="mt-1 text-xs text-slate-500">Empieza con una pista general y termina con la más evidente.</p>
              <div className="mt-3 grid gap-3">
                {form.clues.map((clue, index) => (
                  <label key={index} className="flex gap-3">
                    <span className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-50 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{index + 1}</span>
                    <span className="sr-only">Pista {index + 1}</span>
                    <textarea required rows={2} value={clue} onChange={event => updateClue(index, event.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950" />
                  </label>
                ))}
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
              <input type="checkbox" checked={form.isActive} onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
              Disponible en el juego público
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsOpen(false)} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Cancelar</button>
              <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-blue-700 px-6 text-sm font-bold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar personaje'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
};
