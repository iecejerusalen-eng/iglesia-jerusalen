import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'open_ended';
  points: number;
  options: { id: number; text: string }[];
  order_num: number;
}

interface Quiz {
  id: string;
  lesson_id: string;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  shuffle_questions: boolean;
}

interface QuizTakerProps {
  quizId: string;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export function QuizTaker({ quizId, onComplete, onCancel }: QuizTakerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Quiz Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('lms_quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        const { data: questionsData, error: questionsError } = await supabase
          .from('lms_quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_num', { ascending: true });

        if (questionsError) throw questionsError;

        let finalQuestions = questionsData;
        if (quizData.shuffle_questions) {
          finalQuestions = [...questionsData].sort(() => Math.random() - 0.5);
        }
        
        setQuestions(finalQuestions);

        if (quizData.time_limit_minutes > 0) {
          setTimeLeft(quizData.time_limit_minutes * 60);
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Error al cargar la evaluación');
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, onCancel]);

  const handleAnswerSelect = (questionId: string, value: string | number | boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // 1. Calculate Score (simple auto-grading for multiple choice)
      // Note: Open-ended questions require manual grading. 
      // For this MVP, we assume a basic score calculation or mark as pending review.
      const score = 0; 
      
      const { error } = await supabase
        .from('lms_quiz_attempts')
        .insert({
          quiz_id: quizId,
          student_id: user.id,
          answers: answers,
          score: score, // To be calculated properly on backend or triggered via Edge Function
          is_passed: score >= (quiz?.passing_score || 0),
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Evaluación enviada con éxito');
      onComplete(score);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Error al enviar la evaluación');
      setIsSubmitting(false);
    }
  }, [answers, quiz, quizId, onComplete]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting, handleSubmit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-gray-500 mb-6">No se encontraron preguntas para esta evaluación.</p>
        <button onClick={onCancel} className="bg-primary text-white px-6 py-2 rounded-xl">
          Volver
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-gray-150 dark:border-white/10 flex flex-col h-full max-h-[80vh] min-h-[500px]">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">Evaluación en Curso</h2>
          <p className="text-sm text-gray-400">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-gold'}`}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-slate-800 w-full">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="mb-8">
              <span className="text-sm font-bold text-primary uppercase tracking-wider mb-2 block">
                Valor: {currentQuestion.points} pts
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-black text-slate-900 dark:text-white leading-tight">
                {currentQuestion.question_text}
              </h3>
            </div>

            <div className="space-y-3">
              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options?.map((option) => (
                <label 
                  key={option.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === option.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[currentQuestion.id] === option.id ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion.id] === option.id && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                  <span className="text-lg font-medium text-slate-800 dark:text-gray-200">
                    {option.text}
                  </span>
                </label>
              ))}

              {currentQuestion.question_type === 'true_false' && [
                { id: 1, text: 'Verdadero', value: true },
                { id: 2, text: 'Falso', value: false }
              ].map((option) => (
                <label 
                  key={option.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[currentQuestion.id] === option.value ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion.id] === option.value && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                  <span className="text-lg font-medium text-slate-800 dark:text-gray-200">
                    {option.text}
                  </span>
                </label>
              ))}

              {currentQuestion.question_type === 'open_ended' && (
                <textarea
                  className="w-full h-40 p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-transparent focus:border-primary focus:ring-0 resize-none text-lg"
                  placeholder="Escribe tu respuesta aquí..."
                  value={(answers[currentQuestion.id] as string) || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Navigation */}
      <div className="bg-gray-50 dark:bg-slate-800/50 p-4 md:p-6 border-t border-gray-150 dark:border-white/10 flex items-center justify-between sticky bottom-0">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 text-gray-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 font-bold px-4 py-2"
        >
          <ChevronLeft size={20} />
          Anterior
        </button>

        <div className="flex gap-2">
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors shadow-lg"
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length < questions.length}
              className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <CheckCircle size={20} />
              )}
              Entregar Evaluación
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
