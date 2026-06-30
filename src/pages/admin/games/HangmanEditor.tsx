import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export const HangmanEditor = () => {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<any>(null);
  
  // Form State
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('easy');

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_hangman_words')
        .select('*')
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        word: word.toUpperCase(),
        hint,
        category,
        difficulty
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

  const resetForm = () => {
    setEditingWord(null);
    setWord('');
    setHint('');
    setCategory('');
    setDifficulty('easy');
  };

  const openEdit = (w: any) => {
    setEditingWord(w);
    setWord(w.word);
    setHint(w.hint);
    setCategory(w.category);
    setDifficulty(w.difficulty);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor: Ahorcado Bíblico</h1>
          <p className="text-gray-500">Gestiona las palabras y pistas del juego.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Añadir Palabra
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando palabras...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium">Palabra</th>
                <th className="p-4 font-medium">Pista</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium">Dificultad</th>
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
                      {w.difficulty}
                    </span>
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
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
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
                    onChange={e => setDifficulty(e.target.value)}
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
