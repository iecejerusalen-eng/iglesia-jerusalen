import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Smile, Search, AlertCircle } from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { uploadFileToCloudinary } from '../../../lib/cloudinaryService';

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  difficulty_level: number;
  explanation: string;
  image_url?: string;
}

export const BiblionarioEditor = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  
  const [formData, setFormData] = useState<Partial<Question>>({});
  
  useEffect(() => {
    fetchQuestions();
  }, [filterLevel]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('game_biblionario_questions')
        .select('*')
        .order('difficulty_level', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (filterLevel !== 'all') {
        query = query.eq('difficulty_level', filterLevel);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setFormData(q);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      correct_option: 'a',
      difficulty_level: 1,
      image_url: ''
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      setUploadingImage(true);
      const publicUrl = await uploadFileToCloudinary(file, 'biblionario_assets', 'image');
      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error subiendo imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (activeEmojiPicker) {
      const field = `option_${activeEmojiPicker}` as keyof Question;
      const currentVal = formData[field] || '';
      setFormData({ ...formData, [field]: currentVal + emojiData.emoji });
      setActiveEmojiPicker(null);
    }
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        const { error } = await supabase
          .from('game_biblionario_questions')
          .insert([formData]);
        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('game_biblionario_questions')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      }
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      fetchQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Error al guardar la pregunta.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta pregunta?')) return;
    try {
      const { error } = await supabase
        .from('game_biblionario_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const handleResetLeaderboard = async () => {
    if (!window.confirm('¡ADVERTENCIA! Esto borrará TODAS las puntuaciones del juego Biblionario. ¿Estás absolutamente seguro?')) return;
    
    try {
      const { error } = await supabase
        .from('game_biblionario_scores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
      if (error) throw error;
      alert('La clasificación ha sido reseteada correctamente.');
    } catch (err) {
      console.error('Error resetting leaderboard:', err);
      alert('Error al resetear la clasificación.');
    }
  };

  const FormEditor = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {isAdding ? 'Nueva Pregunta' : 'Editar Pregunta'}
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pregunta
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
            rows={2}
            value={formData.question || ''}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Imagen (Opcional)
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <ImageIcon className="h-4 w-4" />
              {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </label>
            {formData.image_url && (
              <div className="relative">
                <img src={formData.image_url} alt="Preview" className="h-12 w-12 object-cover rounded" />
                <button 
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="O pega la URL de la imagen aquí"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opción A</label>
            <div className="flex">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-transparent text-gray-900 dark:text-white"
                value={formData.option_a || ''}
                onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
              />
              <button 
                onClick={() => setActiveEmojiPicker(activeEmojiPicker === 'a' ? null : 'a')}
                className="px-3 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg"
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {activeEmojiPicker === 'a' && (
              <div className="absolute z-10 top-full mt-1 right-0">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opción B</label>
            <div className="flex">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-transparent text-gray-900 dark:text-white"
                value={formData.option_b || ''}
                onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
              />
              <button 
                onClick={() => setActiveEmojiPicker(activeEmojiPicker === 'b' ? null : 'b')}
                className="px-3 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg"
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {activeEmojiPicker === 'b' && (
              <div className="absolute z-10 top-full mt-1 right-0">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opción C</label>
            <div className="flex">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-transparent text-gray-900 dark:text-white"
                value={formData.option_c || ''}
                onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
              />
              <button 
                onClick={() => setActiveEmojiPicker(activeEmojiPicker === 'c' ? null : 'c')}
                className="px-3 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg"
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {activeEmojiPicker === 'c' && (
              <div className="absolute z-10 top-full mt-1 right-0">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opción D</label>
            <div className="flex">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-transparent text-gray-900 dark:text-white"
                value={formData.option_d || ''}
                onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
              />
              <button 
                onClick={() => setActiveEmojiPicker(activeEmojiPicker === 'd' ? null : 'd')}
                className="px-3 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg"
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {activeEmojiPicker === 'd' && (
              <div className="absolute z-10 top-full mt-1 right-0">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opción Correcta</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
              value={formData.correct_option || 'a'}
              onChange={(e) => setFormData({ ...formData, correct_option: e.target.value as any })}
            >
              <option value="a">Opción A</option>
              <option value="b">Opción B</option>
              <option value="c">Opción C</option>
              <option value="d">Opción D</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nivel de Dificultad (1-15)</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
              value={formData.difficulty_level || 1}
              onChange={(e) => setFormData({ ...formData, difficulty_level: parseInt(e.target.value) })}
            >
              {[...Array(15)].map((_, i) => (
                <option key={i+1} value={i+1}>Nivel {i+1}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explicación (Opcional)</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white"
            value={formData.explanation || ''}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            placeholder="Ej: Jesús nació en Belén de Judea (Mateo 2:1)"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setIsAdding(false);
              setEditingId(null);
            }}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Biblionario - Editor de Preguntas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gestiona la base de datos de preguntas y niveles del juego.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleResetLeaderboard}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-medium"
          >
            <AlertCircle className="h-4 w-4" />
            Resetear Leaderboard
          </button>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Pregunta
          </button>
        </div>
      </div>

      {(isAdding || editingId) && <FormEditor />}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Search className="h-5 w-5 text-gray-400" />
            <select
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value="all">Todos los Niveles</option>
              {[...Array(15)].map((_, i) => (
                <option key={i+1} value={i+1}>Nivel {i+1}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Total: {questions.length} preguntas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pregunta</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opciones</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Cargando preguntas...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay preguntas en este nivel.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                        Nivel {q.difficulty_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {q.question}
                      </p>
                      {q.explanation && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          Ref: {q.explanation}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {['a', 'b', 'c', 'd'].map(opt => (
                          <span
                            key={opt}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              q.correct_option === opt
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 ring-1 ring-green-500'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                            title={(q as any)[`option_${opt}`]}
                          >
                            {opt.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(q)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
