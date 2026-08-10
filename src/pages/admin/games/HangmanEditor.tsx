import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { BookOpen, Edit2, Languages, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeHangmanWord, type HangmanDifficulty } from '../../public/games/hangmanContent';

interface HangmanWord {
  id: string;
  word: string;
  hint: string;
  category: string;
  difficulty: HangmanDifficulty;
  bible_reference: string;
}

export const HangmanEditor = () => {
  const [words, setWords] = useState<HangmanWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<HangmanWord | null>(null);
  
  // Form State
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<HangmanDifficulty>('easy');
  const [bibleReference, setBibleReference] = useState('');

  const fetchWords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_hangman_words')
        .select('id, word, hint, category, difficulty, bible_reference')
        .order('category')
        .order('word');
      
      if (error) throw error;
      setWords(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar palabras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchWords(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setEditingWord(null);
    setWord('');
    setHint('');
    setCategory('');
    setDifficulty('easy');
    setBibleReference('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalized = normalizeHangmanWord({
        id: editingWord?.id ?? 'nueva-adivinanza',
        word,
        hint,
        category,
        difficulty,
        bible_reference: bibleReference,
      });
      if (!normalized) {
        toast.error('Completa la respuesta, la pista, la categoría y la referencia bíblica.');
        return;
      }
      const payload = {
        word: normalized.word,
        hint: normalized.hint,
        category: normalized.category,
        difficulty: normalized.difficulty,
        bible_reference: normalized.bible_reference,
      };

      if (editingWord) {
        const { error } = await supabase
          .from('game_hangman_words')
          .update(payload)
          .eq('id', editingWord.id);
        if (error) throw error;
        toast.success('Palabra actualizada');
      } else {
        const { error } = await supabase
          .from('game_hangman_words')
          .insert([payload]);
        if (error) throw error;
        toast.success('Palabra añadida');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchWords();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar palabra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta palabra?')) return;
    try {
      const { error } = await supabase
        .from('game_hangman_words')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Palabra eliminada');
      fetchWords();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const openEdit = (w: HangmanWord) => {
    setEditingWord(w);
    setWord(w.word);
    setHint(w.hint);
    setCategory(w.category);
    setDifficulty(w.difficulty);
    setBibleReference(w.bible_reference);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20 sm:flex-row sm:items-center">
        <div>
          <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300"><Languages size={14} /> Contenido en español</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor: Ahorcado Bíblico</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona respuestas, pistas y el pasaje que se revela al terminar.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5"
        >
          <Plus size={20} /> Añadir adivinanza
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando palabras...</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium">Palabra</th>
                <th className="p-4 font-medium">Pista</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium">Dificultad</th>
                <th className="p-4 font-medium">Referencia bíblica</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {words.map(w => (
                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 font-mono font-bold">{w.word}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{w.hint}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{w.category}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs text-white ${
                      w.difficulty === 'easy' ? 'bg-green-500' : 
                      w.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {w.difficulty === 'easy' ? 'Fácil' : w.difficulty === 'medium' ? 'Intermedio' : 'Difícil'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"><BookOpen size={14} /> {w.bible_reference}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(w)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(w.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900/95">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              {editingWord ? 'Editar Palabra' : 'Nueva Palabra'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Palabra</label>
                <input 
                  required
                  type="text" 
                  value={word}
                  onChange={e => setWord(e.target.value.toUpperCase())}
                  className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono uppercase"
                  placeholder="EJEMPLO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Pista</label>
                <input 
                  required
                  type="text" 
                  value={hint}
                  onChange={e => setHint(e.target.value)}
                  className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Una pista útil..."
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium dark:text-gray-300"><BookOpen size={15} className="text-amber-500" /> Referencia bíblica</label>
                <input
                  required
                  type="text"
                  value={bibleReference}
                  onChange={event => setBibleReference(event.target.value)}
                  className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej. Marcos 10:46-52"
                />
                <p className="mt-1.5 text-xs text-gray-500">Se mostrará únicamente cuando el jugador termine la adivinanza.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Categoría</label>
                  <input 
                    required
                    type="text" 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Ej. Personajes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Dificultad</label>
                  <select 
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as HangmanDifficulty)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
