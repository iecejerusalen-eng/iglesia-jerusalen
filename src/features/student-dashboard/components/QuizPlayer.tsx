import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Clock, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { toast } from 'sonner';

interface QuizPlayerProps {
  lessonId: string;
  onComplete: () => void;
}

interface Question {
  id: string;
  content: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options: string[] | null;
  points: number;
}

export function QuizPlayer({ lessonId, onComplete }: QuizPlayerProps) {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes default
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadQuiz = async () => {
    if (!user) return;
    try {
      // Create or get active attempt
      let { data: attempt } = await supabase
        .from('lms_quiz_attempts')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', user.id)
        .eq('status', 'in_progress')
        .maybeSingle();

      if (!attempt) {
        const { data: newAttempt, error: attemptError } = await supabase
          .from('lms_quiz_attempts')
          .insert([{ lesson_id: lessonId, student_id: user.id }])
          .select()
          .single();

        if (attemptError) throw attemptError;
        attempt = newAttempt;
      }
      setAttemptId(attempt.id);

      // Fetch questions mapping
      const { data: quizQuestions, error: qqError } = await supabase
        .from('lms_quiz_questions')
        .select(`
          question_id,
          lms_questions (
            id, content, type, options, points
          )
        `)
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (qqError) throw qqError;

      const mappedQuestions = (quizQuestions || []).map(qq => qq.lms_questions).filter(Boolean) as any;
      setQuestions(mappedQuestions);

      // Load existing answers for this attempt
      const { data: existingAnswers } = await supabase
        .from('lms_quiz_answers')
        .select('question_id, answer_data')
        .eq('attempt_id', attempt.id);

      if (existingAnswers) {
        const loadedAnswers: Record<string, any> = {};
        existingAnswers.forEach(a => {
          loadedAnswers[a.question_id] = a.answer_data;
        });
        setAnswers(loadedAnswers);
      }

    } catch (err: any) {
      console.error('Error loading quiz:', err);
      toast.error('Error al cargar la evaluación');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnswer = async (questionId: string, value: any) => {
    if (!attemptId) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto save to backend
    try {
      const { error } = await supabase
        .from('lms_quiz_answers')
        .upsert({
          attempt_id: attemptId,
          question_id: questionId,
          answer_data: value
        }, { onConflict: 'attempt_id,question_id' });
        
      if (error) throw error;
    } catch (err) {
      console.error('Error auto-saving answer:', err);
    }
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!attemptId) return;
    if (!isAutoSubmit && !confirm('¿Estás seguro de enviar la evaluación? No podrás modificar tus respuestas.')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Auto-grading logic for multiple choice / true false can go here via edge function
      // For now, we just mark as completed
      const { error } = await supabase
        .from('lms_quiz_attempts')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', attemptId);

      if (error) throw error;
      
      toast.success(isAutoSubmit ? 'Tiempo finalizado. Evaluación enviada.' : 'Evaluación enviada con éxito');
      onComplete();
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      toast.error('Error al enviar la evaluación');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Evaluación no disponible</h3>
        <p className="text-gray-400">Esta evaluación no tiene preguntas configuradas aún.</p>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimeFadeUp className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center space-x-2 text-white/80">
          <CheckCircle className="w-5 h-5 text-gold" />
          <span className="font-medium">
            Pregunta {currentQuestionIdx + 1} de {questions.length}
          </span>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold ${
          timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-black/30 text-white/90'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-medium text-white">{currentQ.content}</h3>
          <span className="text-sm font-bold text-gold bg-gold/10 px-3 py-1 rounded-full whitespace-nowrap ml-4">
            {currentQ.points} pt(s)
          </span>
        </div>

        <div className="space-y-4">
          {currentQ.type === 'multiple_choice' && (currentQ.options || []).map((opt, i) => (
            <label key={i} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
              answers[currentQ.id] === opt 
                ? 'bg-gold/20 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                : 'bg-black/20 border-white/10 hover:border-white/30'
            }`}>
              <input 
                type="radio" 
                name={currentQ.id} 
                value={opt}
                checked={answers[currentQ.id] === opt}
                onChange={() => saveAnswer(currentQ.id, opt)}
                className="hidden"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                answers[currentQ.id] === opt ? 'border-gold' : 'border-white/30'
              }`}>
                {answers[currentQ.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
              </div>
              <span className="text-white/90">{opt}</span>
            </label>
          ))}

          {currentQ.type === 'true_false' && ['Verdadero', 'Falso'].map((opt, i) => {
            const val = opt === 'Verdadero';
            return (
              <label key={i} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                answers[currentQ.id] === val 
                  ? 'bg-gold/20 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                  : 'bg-black/20 border-white/10 hover:border-white/30'
              }`}>
                <input 
                  type="radio" 
                  name={currentQ.id} 
                  value={opt}
                  checked={answers[currentQ.id] === val}
                  onChange={() => saveAnswer(currentQ.id, val)}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  answers[currentQ.id] === val ? 'border-gold' : 'border-white/30'
                }`}>
                  {answers[currentQ.id] === val && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                </div>
                <span className="text-white/90">{opt}</span>
              </label>
            );
          })}

          {currentQ.type === 'essay' && (
            <textarea
              value={answers[currentQ.id] || ''}
              onChange={(e) => saveAnswer(currentQ.id, e.target.value)}
              className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-none"
              placeholder="Escribe tu respuesta aquí..."
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIdx === 0}
          className="flex items-center px-6 py-3 rounded-xl font-bold text-white/70 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Anterior
        </button>

        {currentQuestionIdx === questions.length - 1 ? (
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center px-8 py-3 bg-gold hover:bg-gold-light text-white rounded-xl font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Enviando...' : 'Finalizar Evaluación'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
          >
            Siguiente
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </AnimeFadeUp>
  );
}
