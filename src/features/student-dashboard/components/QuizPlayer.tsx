import React, { useCallback, useEffect, useState } from 'react';
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
  options: Array<{ value: string; label: string }> | null;
  points: number;
}

type AnswerValue = string | boolean;

function normalizeOptions(value: unknown): Array<{ value: string; label: string }> | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((option) => {
    if (typeof option === 'string') return [{ value: option, label: option }];
    if (option && typeof option === 'object' && typeof (option as Record<string, unknown>).text === 'string') {
      const record = option as Record<string, unknown>;
      return [{ value: String(record.id || record.text), label: String(record.text) }];
    }
    return [];
  });
}

function normalizeQuestion(value: unknown): Question | null {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.content !== 'string') return null;
  if (!['multiple_choice', 'true_false', 'essay'].includes(String(record.type))) return null;
  return {
    id: record.id,
    content: record.content,
    type: record.type as Question['type'],
    options: normalizeOptions(record.options),
    points: typeof record.points === 'number' ? record.points : Number(record.points) || 1,
  };
}

export function QuizPlayer({ lessonId, onComplete }: QuizPlayerProps) {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes default
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    if (!user) return;
    try {
      // Create or get active attempt
      const { data: existingAttempt, error: existingAttemptError } = await supabase
        .from('lms_quiz_attempts')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', user.id)
        .eq('status', 'in_progress')
        .maybeSingle();
      if (existingAttemptError) throw existingAttemptError;
      let attempt = existingAttempt;

      if (!attempt) {
        const { data: newAttempt, error: attemptError } = await supabase
          .from('lms_quiz_attempts')
          .insert([{ lesson_id: lessonId, student_id: user.id }])
          .select()
          .single();

        if (attemptError) throw attemptError;
        attempt = newAttempt;
      }
      if (!attempt) throw new Error('No se pudo crear el intento de evaluación.');
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

      const mappedQuestions = (quizQuestions || []).flatMap((item) => {
        const question = normalizeQuestion(item.lms_questions);
        return question ? [question] : [];
      });
      setQuestions(mappedQuestions);

      // Load existing answers for this attempt
      const { data: existingAnswers, error: answersError } = await supabase
        .from('lms_quiz_answers')
        .select('question_id, answer_data')
        .eq('attempt_id', attempt.id);
      if (answersError) throw answersError;

      if (existingAnswers) {
        const loadedAnswers: Record<string, AnswerValue> = {};
        existingAnswers.forEach(a => {
          if (typeof a.answer_data === 'string' || typeof a.answer_data === 'boolean') {
            loadedAnswers[a.question_id] = a.answer_data;
          }
        });
        setAnswers(loadedAnswers);
      }

    } catch (err: unknown) {
      console.error('Error loading quiz:', err);
      toast.error('Error al cargar la evaluación');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, user]);

  const saveAnswer = async (questionId: string, value: AnswerValue) => {
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

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!attemptId) return;
    if (!isAutoSubmit && !confirm('¿Estás seguro de enviar la evaluación? No podrás modificar tus respuestas.')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_lms_quiz_attempt', { p_attempt_id: attemptId });

      if (error) throw error;
      
      toast.success(isAutoSubmit ? 'Tiempo finalizado. Evaluación enviada.' : 'Evaluación enviada con éxito');
      onComplete();
    } catch (err: unknown) {
      console.error('Error submitting quiz:', err);
      toast.error('Error al enviar la evaluación');
      setIsSubmitting(false);
    }
  }, [attemptId, onComplete]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuiz(), 0);
    return () => window.clearTimeout(timer);
  }, [loadQuiz]);

  useEffect(() => {
    if (timeLeft <= 0) {
      const submitTimer = window.setTimeout(() => void handleSubmit(true), 0);
      return () => window.clearTimeout(submitTimer);
    }
    const timer = window.setInterval(() => setTimeLeft((previous) => previous - 1), 1000);
    return () => window.clearInterval(timer);
  }, [handleSubmit, timeLeft]);

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
              answers[currentQ.id] === opt.value
                ? 'bg-gold/20 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                : 'bg-black/20 border-white/10 hover:border-white/30'
            }`}>
              <input 
                type="radio" 
                name={currentQ.id} 
                value={opt.value}
                checked={answers[currentQ.id] === opt.value}
                onChange={() => saveAnswer(currentQ.id, opt.value)}
                className="hidden"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                answers[currentQ.id] === opt.value ? 'border-gold' : 'border-white/30'
              }`}>
                {answers[currentQ.id] === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
              </div>
              <span className="text-white/90">{opt.label}</span>
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
              value={String(answers[currentQ.id] ?? '')}
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
