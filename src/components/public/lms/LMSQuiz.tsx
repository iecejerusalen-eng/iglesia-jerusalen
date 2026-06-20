import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import type { LMSActivity } from '../../../types';

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  text: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  points: number;
}

interface LMSQuizProps {
  activity: LMSActivity;
  onComplete?: () => void;
}

const LMSQuiz: React.FC<LMSQuizProps> = ({ activity, onComplete }) => {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    if (activity.content) {
      try {
        const parsed = JSON.parse(activity.content);
        if (parsed.questions) setQuestions(parsed.questions);
      } catch (e) {
        console.error("Error parsing quiz content", e);
      }
    }
    
    checkPreviousSubmission();
  }, [activity]);

  const checkPreviousSubmission = async () => {
    if (!user || !activity.id) return;
    
    try {
      const { data, error } = await supabase
        .from('lms_assignment_submissions')
        .select('*')
        .eq('activity_id', activity.id)
        .eq('student_id', user.id)
        .single();
        
      if (!error && data) {
        setSubmission(data);
        if (data.text_content) {
          try {
            const parsedAnswers = JSON.parse(data.text_content);
            setAnswers(parsedAnswers);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error fetching submission:', err);
    }
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (submission) return; // Cannot change if already submitted
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Check if all questions answered
    if (Object.keys(answers).length < questions.length) {
      toast.error('Por favor responde todas las preguntas antes de enviar.');
      return;
    }

    setLoading(true);
    
    try {
      // Calculate grade
      let score = 0;
      let totalPoints = 0;
      
      questions.forEach(q => {
        totalPoints += q.points;
        const selectedOptionId = answers[q.id];
        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          const correctOption = q.options?.find(o => o.isCorrect);
          if (correctOption && correctOption.id === selectedOptionId) {
            score += q.points;
          }
        }
      });
      
      const gradeStr = `${score}/${totalPoints}`;

      const { data, error } = await supabase
        .from('lms_assignment_submissions')
        .insert([{
          activity_id: activity.id,
          student_id: user.id,
          text_content: JSON.stringify(answers),
          status: 'graded',
          grade: gradeStr,
          graded_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setSubmission(data);
      toast.success('¡Cuestionario enviado correctamente!');
      
      if (onComplete) {
        onComplete();
      }
      
    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast.error('Error al enviar el cuestionario');
    } finally {
      setLoading(false);
    }
  };

  if (!activity) return null;

  if (questions.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-xl text-center">
        <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
        <p className="text-gray-500">Este cuestionario aún no tiene preguntas configuradas.</p>
      </div>
    );
  }

  const isSubmitted = !!submission;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {isSubmitted && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8 flex items-start gap-4">
          <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-600 dark:text-green-300">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-green-800 dark:text-green-300 text-lg mb-1">
              ¡Cuestionario Completado!
            </h3>
            <p className="text-green-700 dark:text-green-400 mb-2">
              Ya has enviado tus respuestas para esta actividad.
            </p>
            <div className="inline-block bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-green-200 dark:border-green-700 shadow-sm">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Calificación:</span>
              <span className="font-bold text-lg text-slate-900 dark:text-white">{submission.grade}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, index) => {
          const selectedId = answers[q.id];
          let isCorrect = false;
          
          if (isSubmitted && q.options) {
            const correctOpt = q.options.find(o => o.isCorrect);
            isCorrect = correctOpt?.id === selectedId;
          }

          return (
            <div key={q.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-slate-900 dark:text-white">
                  <span className="text-gold font-bold mr-2">{index + 1}.</span>
                  {q.text}
                </h3>
                <span className="text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-1 rounded">
                  {q.points} pt{q.points !== 1 ? 's' : ''}
                </span>
              </div>

              {q.options && (
                <div className="space-y-3 mt-4">
                  {q.options.map(opt => {
                    const isSelected = selectedId === opt.id;
                    let optClass = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ";
                    
                    if (!isSubmitted) {
                      optClass += isSelected 
                        ? "border-gold bg-yellow-50 dark:bg-gold/10 text-slate-900 dark:text-white" 
                        : "border-gray-200 dark:border-white/10 hover:border-gold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300";
                    } else {
                      // Show results
                      if (opt.isCorrect) {
                        optClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-medium";
                      } else if (isSelected && !opt.isCorrect) {
                        optClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
                      } else {
                        optClass += "border-gray-200 dark:border-white/10 opacity-50 text-gray-500";
                      }
                      optClass = optClass.replace("cursor-pointer", "cursor-default");
                    }

                    return (
                      <div 
                        key={opt.id} 
                        className={optClass}
                        onClick={() => handleSelectAnswer(q.id, opt.id)}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-gold bg-gold' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span>{opt.text}</span>
                        {isSubmitted && opt.isCorrect && (
                          <CheckCircle className="ml-auto text-green-500" size={18} />
                        )}
                        {isSubmitted && isSelected && !opt.isCorrect && (
                          <AlertCircle className="ml-auto text-red-500" size={18} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {isSubmitted && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-50 text-green-800 dark:bg-green-900/10 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/10 dark:text-red-400'}`}>
                  {isCorrect ? '¡Respuesta correcta!' : 'Respuesta incorrecta.'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(answers).length < questions.length}
            className="flex items-center gap-2 px-8 py-3 bg-gold hover:bg-yellow-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            Enviar Respuestas
          </button>
        </div>
      )}
    </div>
  );
};

export default LMSQuiz;
