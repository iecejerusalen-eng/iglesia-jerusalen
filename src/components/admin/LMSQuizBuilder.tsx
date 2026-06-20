import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  text: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  points: number;
}

interface LMSQuizBuilderProps {
  content: string;
  onChange: (content: string) => void;
}

const LMSQuizBuilder: React.FC<LMSQuizBuilderProps> = ({ content, onChange }) => {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.questions) setQuestions(parsed.questions);
      } catch (e) {
        console.error("Error parsing quiz content", e);
      }
    }
  }, [content]);

  // Sync to parent when questions change
  const notifyChange = (newQuestions: Question[]) => {
    onChange(JSON.stringify({ questions: newQuestions }));
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'multiple_choice',
      text: '',
      options: [
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: true },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }
      ],
      points: 1
    };
    const newQs = [...questions, newQuestion];
    setQuestions(newQs);
    notifyChange(newQs);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    const newQs = questions.map(q => q.id === id ? { ...q, ...updates } : q);
    setQuestions(newQs);
    notifyChange(newQs);
  };

  const handleDeleteQuestion = (id: string) => {
    const newQs = questions.filter(q => q.id !== id);
    setQuestions(newQs);
    notifyChange(newQs);
  };

  const handleAddOption = (questionId: string) => {
    const newQs = questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: [...q.options, { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }]
        };
      }
      return q;
    });
    setQuestions(newQs);
    notifyChange(newQs);
  };

  const handleUpdateOption = (questionId: string, optionId: string, text: string) => {
    const newQs = questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map(o => o.id === optionId ? { ...o, text } : o)
        };
      }
      return q;
    });
    setQuestions(newQs);
    notifyChange(newQs);
  };

  const handleSetCorrectOption = (questionId: string, optionId: string) => {
    const newQs = questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map(o => ({ ...o, isCorrect: o.id === optionId }))
        };
      }
      return q;
    });
    setQuestions(newQs);
    notifyChange(newQs);
  };

  const handleDeleteOption = (questionId: string, optionId: string) => {
    const newQs = questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.filter(o => o.id !== optionId)
        };
      }
      return q;
    });
    setQuestions(newQs);
    notifyChange(newQs);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
            <p className="text-gray-500 mb-4">No hay preguntas en este cuestionario.</p>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-yellow-600 transition"
            >
              <Plus size={18} />
              Agregar la primera pregunta
            </button>
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative group">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 text-gray-300 dark:text-gray-600 cursor-move">
                  <GripVertical size={20} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Pregunta {index + 1}</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleUpdateQuestion(q.id, { text: e.target.value })}
                        placeholder="Escribe la pregunta aquí..."
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold outline-none"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Puntos</label>
                      <input
                        type="number"
                        min="1"
                        value={q.points}
                        onChange={(e) => handleUpdateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold outline-none"
                      />
                    </div>
                  </div>

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2 ml-4 border-l-2 border-gray-100 dark:border-slate-700 pl-4">
                      {q.options.map((opt, optIndex) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectOption(q.id, opt.id)}
                            className={`p-1.5 rounded-full border ${opt.isCorrect ? 'bg-green-100 border-green-500 text-green-600 dark:bg-green-900/30' : 'border-gray-300 text-gray-400 hover:border-green-500'}`}
                            title={opt.isCorrect ? 'Respuesta correcta' : 'Marcar como correcta'}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                            placeholder={`Opción ${optIndex + 1}`}
                            className={`flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-slate-900 border ${opt.isCorrect ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-slate-700'} rounded-lg focus:ring-1 focus:ring-gold outline-none`}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(q.id, opt.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500"
                            disabled={q.options!.length <= 2}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddOption(q.id)}
                        className="text-sm text-gold hover:text-yellow-600 font-medium"
                      >
                        + Agregar opción
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {questions.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            >
              <Plus size={18} />
              Agregar Pregunta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LMSQuizBuilder;
