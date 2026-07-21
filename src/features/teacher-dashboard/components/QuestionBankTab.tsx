import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Plus, Edit2, Trash2, Save, X, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuestionBankTabProps {
  courseId: string | null;
  courses?: any[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Question {
  id: string;
  category_id: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  content: string;
  options: any;
  correct_answer: any;
  points: number;
  explanation: string;
}

export function QuestionBankTab({ courseId, courses }: QuestionBankTabProps) {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [activeTab, setActiveTab] = useState<'questions' | 'categories'>('questions');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  
  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New Question Form
  const [newQCategoryId, setNewQCategoryId] = useState('');
  const [newQType, setNewQType] = useState<'multiple_choice' | 'true_false' | 'essay'>('multiple_choice');
  const [newQContent, setNewQContent] = useState('');
  const [newQPoints, setNewQPoints] = useState(1);
  const [newQExplanation, setNewQExplanation] = useState('');

  useEffect(() => {
    if (courseId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [courseId]);

  const loadData = async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [catsRes, qRes] = await Promise.all([
        supabase.from('lms_question_categories').select('*').eq('course_id', courseId).order('name'),
        supabase.from('lms_questions').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
      ]);

      if (catsRes.error) throw catsRes.error;
      if (qRes.error) throw qRes.error;

      setCategories(catsRes.data || []);
      setQuestions(qRes.data || []);
      
      if (catsRes.data && catsRes.data.length > 0) {
        setNewQCategoryId(catsRes.data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading question bank:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!courseId || !newCatName) return;
    try {
      const { data, error } = await supabase
        .from('lms_question_categories')
        .insert([{ course_id: courseId, name: newCatName, description: newCatDesc }])
        .select()
        .single();
      
      if (error) throw error;
      setCategories([...categories, data]);
      setShowAddCategory(false);
      setNewCatName('');
      setNewCatDesc('');
      if (!newQCategoryId) setNewQCategoryId(data.id);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateQuestion = async () => {
    if (!courseId || !newQCategoryId || !newQContent) return;
    try {
      const { data, error } = await supabase
        .from('lms_questions')
        .insert([{
          course_id: courseId,
          category_id: newQCategoryId,
          type: newQType,
          content: newQContent,
          points: newQPoints,
          explanation: newQExplanation,
          options: newQType === 'multiple_choice' ? [] : null,
          correct_answer: newQType === 'true_false' ? true : null
        }])
        .select()
        .single();
      
      if (error) throw error;
      setQuestions([data, ...questions]);
      setShowAddQuestion(false);
      setNewQContent('');
      setNewQExplanation('');
      setNewQPoints(1);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar pregunta?')) return;
    try {
      const { error } = await supabase.from('lms_questions').delete().eq('id', id);
      if (error) throw error;
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (!courseId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
        <BookOpen className="h-12 w-12 mb-4 opacity-50" />
        <p>Selecciona un curso para ver su banco de preguntas</p>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-white/70">Cargando banco de preguntas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Banco de Preguntas</h2>
          <p className="text-white/60">Gestiona las preguntas y categorías para tus evaluaciones.</p>
        </div>
        <div className="flex space-x-2 bg-black/20 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'questions' ? 'bg-gold text-white shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            Preguntas
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'categories' ? 'bg-gold text-white shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            Categorías
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Categorías</h3>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="flex items-center px-4 py-2 bg-gold hover:bg-gold-light text-white rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Categoría
            </button>
          </div>

          {showAddCategory && (
            <div className="mb-8 p-6 bg-black/20 rounded-xl border border-white/5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                  placeholder="Ej. Unidad 1, Matemáticas Básicas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 text-white/60 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCatName}
                  className="px-6 py-2 bg-gold hover:bg-gold-light text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <h4 className="font-bold text-white mb-1">{cat.name}</h4>
                <p className="text-sm text-white/60 mb-3">{cat.description || 'Sin descripción'}</p>
                <div className="text-xs text-gold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {questions.filter(q => q.category_id === cat.id).length} preguntas
                </div>
              </div>
            ))}
            {categories.length === 0 && !showAddCategory && (
              <p className="text-white/40 col-span-full py-4 text-center">No hay categorías. Crea una para empezar.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Preguntas</h3>
            <button
              onClick={() => {
                if (categories.length === 0) {
                  alert('Debes crear al menos una categoría primero.');
                  setActiveTab('categories');
                  return;
                }
                setShowAddQuestion(!showAddQuestion);
              }}
              className="flex items-center px-4 py-2 bg-gold hover:bg-gold-light text-white rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Pregunta
            </button>
          </div>

          {showAddQuestion && (
            <div className="mb-8 p-6 bg-black/20 rounded-xl border border-white/5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Categoría</label>
                  <select
                    value={newQCategoryId}
                    onChange={(e) => setNewQCategoryId(e.target.value)}
                    className="w-full bg-[#1a1f36] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Tipo de Pregunta</label>
                  <select
                    value={newQType}
                    onChange={(e: any) => setNewQType(e.target.value)}
                    className="w-full bg-[#1a1f36] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="multiple_choice">Opción Múltiple</option>
                    <option value="true_false">Verdadero o Falso</option>
                    <option value="essay">Desarrollo / Ensayo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Enunciado</label>
                <textarea
                  value={newQContent}
                  onChange={(e) => setNewQContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gold h-24 resize-none"
                  placeholder="Escribe la pregunta aquí..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Puntuación</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newQPoints}
                    onChange={(e) => setNewQPoints(parseFloat(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Explicación (Opcional)</label>
                  <input
                    type="text"
                    value={newQExplanation}
                    onChange={(e) => setNewQExplanation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                    placeholder="Feedback que verá el alumno"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowAddQuestion(false)}
                  className="px-4 py-2 text-white/60 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateQuestion}
                  disabled={!newQContent}
                  className="px-6 py-2 bg-gold hover:bg-gold-light text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {questions.map(q => {
              const cat = categories.find(c => c.id === q.category_id);
              return (
                <div key={q.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-start group">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white/60">
                        {q.type === 'multiple_choice' ? 'Múltiple' : q.type === 'true_false' ? 'V/F' : 'Ensayo'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-gold">
                        {cat?.name || 'Sin Categoría'}
                      </span>
                      <span className="text-xs text-white/50">{q.points} pt(s)</span>
                    </div>
                    <p className="text-white font-medium">{q.content}</p>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Eliminar Pregunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {questions.length === 0 && !showAddQuestion && (
              <p className="text-white/40 text-center py-8">No hay preguntas en este curso. ¡Agrega la primera!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
