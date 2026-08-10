import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Clock, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, 
  Award, XCircle, RotateCcw, HelpCircle, Check, X
} from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { toast } from 'sonner';

export interface QuizPlayerProps {
  lessonId: string;
  onComplete: () => void;
}

export interface QuizOption {
  value: string;
  label: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  content: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options: QuizOption[] | null;
  points: number;
  correctAnswer?: string | boolean;
}

export type AnswerValue = string | boolean;

interface QuestionResult {
  question: Question;
  userAnswer: AnswerValue | undefined;
  isCorrect: boolean;
  earnedPoints: number;
}

interface EvaluationResult {
  totalPoints: number;
  earnedPoints: number;
  scorePercentage: number;
  results: QuestionResult[];
}

function normalizeOptions(rawOptions: unknown): QuizOption[] | null {
  if (!Array.isArray(rawOptions)) return null;
  const result: QuizOption[] = [];

  rawOptions.forEach((opt, index) => {
    if (typeof opt === 'string') {
      result.push({
        value: opt,
        label: opt,
      });
    } else if (opt && typeof opt === 'object') {
      const rec = opt as Record<string, unknown>;
      const label = String(rec.label || rec.text || rec.value || `Opción ${index + 1}`);
      const value = String(rec.value || rec.id || rec.text || label);
      const isCorrect = typeof rec.isCorrect === 'boolean'
        ? rec.isCorrect
        : Boolean(rec.correct || rec.is_correct);

      result.push({
        value,
        label,
        isCorrect,
      });
    }
  });

  return result.length > 0 ? result : null;
}

function normalizeQuestion(raw: unknown, index: number): Question | null {
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!item || typeof item !== 'object') return null;
  const rec = item as Record<string, unknown>;

  const id = String(rec.id || `q_${index + 1}`);
  const content = String(rec.content || rec.text || rec.question_text || rec.title || '');
  if (!content) return null;

  let rawType = String(rec.type || rec.question_type || 'multiple_choice');
  if (rawType === 'open_ended' || rawType === 'short_answer') rawType = 'essay';
  if (!['multiple_choice', 'true_false', 'essay'].includes(rawType)) {
    rawType = 'multiple_choice';
  }

  let options = normalizeOptions(rec.options);

  // Default options for true_false if missing
  if (rawType === 'true_false' && (!options || options.length === 0)) {
    options = [
      { value: 'true', label: 'Verdadero', isCorrect: rec.correctAnswer === true || rec.correct_answer === 'true' || rec.correct_answer === true },
      { value: 'false', label: 'Falso', isCorrect: rec.correctAnswer === false || rec.correct_answer === 'false' || rec.correct_answer === false },
    ];
  }

  const points = typeof rec.points === 'number' ? rec.points : Number(rec.points) || 1;
  const correctAnswer = rec.correct_answer !== undefined ? rec.correct_answer : rec.correctAnswer;

  return {
    id,
    content,
    type: rawType as Question['type'],
    options,
    points,
    correctAnswer: typeof correctAnswer === 'string' || typeof correctAnswer === 'boolean' ? correctAnswer : undefined,
  };
}

function parseJSONQuestions(rawContent: unknown, rawSettings: unknown): Question[] {
  const tryParse = (val: unknown): unknown => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return val;
  };

  const parsedContent = tryParse(rawContent);
  const parsedSettings = tryParse(rawSettings);

  const extractList = (parsed: unknown): unknown[] => {
    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object') {
      const rec = parsed as Record<string, unknown>;
      if (Array.isArray(rec.questions)) return rec.questions;
      if (Array.isArray(rec.quiz)) return rec.quiz;
      if (rec.quiz && typeof rec.quiz === 'object' && Array.isArray((rec.quiz as Record<string, unknown>).questions)) {
        return (rec.quiz as Record<string, unknown>).questions as unknown[];
      }
    }
    return [];
  };

  let rawList = extractList(parsedContent);
  if (rawList.length === 0) {
    rawList = extractList(parsedSettings);
  }

  return rawList
    .map((item, idx) => normalizeQuestion(item, idx))
    .filter((q): q is Question => q !== null);
}

function evaluateQuiz(questions: Question[], answers: Record<string, AnswerValue>): EvaluationResult {
  let totalPoints = 0;
  let earnedPoints = 0;
  const results: QuestionResult[] = [];

  for (const q of questions) {
    const qPoints = q.points || 1;
    totalPoints += qPoints;
    const userAns = answers[q.id];
    let isCorrect = false;

    if (userAns !== undefined && userAns !== null && String(userAns).trim() !== '') {
      if (q.type === 'multiple_choice') {
        const correctOpt = q.options?.find((o) => o.isCorrect === true);
        if (correctOpt) {
          const strAns = String(userAns);
          if (strAns === correctOpt.value || strAns === correctOpt.label) {
            isCorrect = true;
          }
        } else if (q.correctAnswer !== undefined) {
          if (String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
            isCorrect = true;
          }
        }
      } else if (q.type === 'true_false') {
        const correctOpt = q.options?.find((o) => o.isCorrect === true);
        if (correctOpt) {
          const strAns = String(userAns);
          const boolAns = userAns === true || strAns === 'true' || strAns === 'Verdadero';
          const optIsTrue = correctOpt.value === 'true' || correctOpt.label === 'Verdadero';
          if (strAns === correctOpt.value || strAns === correctOpt.label || boolAns === optIsTrue) {
            isCorrect = true;
          }
        } else if (q.correctAnswer !== undefined) {
          const normUser = userAns === true || userAns === 'true' || userAns === 'Verdadero';
          const normCorrect = q.correctAnswer === true || q.correctAnswer === 'true' || q.correctAnswer === 'Verdadero';
          if (normUser === normCorrect) {
            isCorrect = true;
          }
        } else {
          isCorrect = true;
        }
      } else if (q.type === 'essay') {
        if (q.correctAnswer !== undefined && String(q.correctAnswer).trim() !== '') {
          isCorrect = String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        } else {
          isCorrect = true;
        }
      }
    }

    const earned = isCorrect ? qPoints : 0;
    earnedPoints += earned;

    results.push({
      question: q,
      userAnswer: userAns,
      isCorrect,
      earnedPoints: earned,
    });
  }

  const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;

  return {
    totalPoints,
    earnedPoints,
    scorePercentage,
    results,
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

  // Score feedback state
  const [showResults, setShowResults] = useState(false);
  const [scoreData, setScoreData] = useState<EvaluationResult | null>(null);

  const loadQuiz = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Try to get or create active attempt from lms_quiz_attempts
      try {
        const { data: existingAttempt } = await supabase
          .from('lms_quiz_attempts')
          .select('*')
          .eq('lesson_id', lessonId)
          .eq('student_id', user.id)
          .eq('status', 'in_progress')
          .maybeSingle();

        let attempt = existingAttempt;
        if (!attempt) {
          const { data: newAttempt } = await supabase
            .from('lms_quiz_attempts')
            .insert([{ lesson_id: lessonId, student_id: user.id }])
            .select()
            .maybeSingle();
          attempt = newAttempt;
        }
        if (attempt) {
          setAttemptId(attempt.id);
          // Load previous saved answers for this attempt
          const { data: existingAnswers } = await supabase
            .from('lms_quiz_answers')
            .select('question_id, answer_data')
            .eq('attempt_id', attempt.id);

          if (existingAnswers && existingAnswers.length > 0) {
            const loadedAnswers: Record<string, AnswerValue> = {};
            existingAnswers.forEach((a) => {
              if (typeof a.answer_data === 'string' || typeof a.answer_data === 'boolean') {
                loadedAnswers[a.question_id] = a.answer_data;
              }
            });
            setAnswers(loadedAnswers);
          }
        }
      } catch (attemptErr) {
        console.warn('lms_quiz_attempts table not fully available, falling back to local attempt:', attemptErr);
      }

      // 2. Fetch questions - Source 1: lms_quiz_questions -> lms_questions
      let loadedQuestions: Question[] = [];

      try {
        const { data: quizQuestions } = await supabase
          .from('lms_quiz_questions')
          .select(`
            question_id,
            order_index,
            lms_questions (
              id, content, type, options, points, correct_answer
            )
          `)
          .eq('lesson_id', lessonId)
          .order('order_index');

        if (quizQuestions && quizQuestions.length > 0) {
          loadedQuestions = quizQuestions.flatMap((item, idx) => {
            const q = normalizeQuestion(item.lms_questions, idx);
            return q ? [q] : [];
          });
        }
      } catch (qqError) {
        console.warn('Could not load from lms_quiz_questions:', qqError);
      }

      // 3. Source 2 Fallback: Read lesson content / settings (from LMSQuizBuilder)
      if (loadedQuestions.length === 0) {
        // Query lms_lessons
        const { data: lessonData } = await supabase
          .from('lms_lessons')
          .select('content, settings')
          .eq('id', lessonId)
          .maybeSingle();

        if (lessonData) {
          loadedQuestions = parseJSONQuestions(lessonData.content, lessonData.settings);
        } else {
          // Fallback to lms_activities (PACIE section model)
          const { data: actData } = await supabase
            .from('lms_activities')
            .select('content, settings')
            .eq('id', lessonId)
            .maybeSingle();

          if (actData) {
            loadedQuestions = parseJSONQuestions(actData.content, actData.settings);
          }
        }
      }

      setQuestions(loadedQuestions);
    } catch (err: unknown) {
      console.error('Error loading quiz:', err);
      toast.error('Error al cargar la evaluación');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, user]);

  const saveAnswer = async (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!attemptId) return;

    // Auto save answer to backend
    try {
      await supabase
        .from('lms_quiz_answers')
        .upsert(
          {
            attempt_id: attemptId,
            question_id: questionId,
            answer_data: value,
          },
          { onConflict: 'attempt_id,question_id' }
        );
    } catch (err) {
      console.warn('Error auto-saving answer:', err);
    }
  };

  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (!user) return;
      if (!isAutoSubmit && !confirm('¿Estás seguro de enviar la evaluación? No podrás modificar tus respuestas.')) {
        return;
      }

      setIsSubmitting(true);
      try {
        const evaluation = evaluateQuiz(questions, answers);
        setScoreData(evaluation);
        setShowResults(true);

        // 1. Save grade into lms_lesson_quiz_grades
        try {
          const { error: gradeError } = await supabase
            .from('lms_lesson_quiz_grades')
            .upsert(
              [
                {
                  lesson_id: lessonId,
                  student_id: user.id,
                  score: evaluation.earnedPoints,
                  max_score: evaluation.totalPoints,
                  completed_at: new Date().toISOString(),
                },
              ],
              { onConflict: 'lesson_id,student_id' }
            );

          if (gradeError) {
            console.warn('Upsert lms_lesson_quiz_grades fallback execution:', gradeError);
            const { data: existingGrade } = await supabase
              .from('lms_lesson_quiz_grades')
              .select('id')
              .eq('lesson_id', lessonId)
              .eq('student_id', user.id)
              .maybeSingle();

            if (existingGrade) {
              await supabase
                .from('lms_lesson_quiz_grades')
                .update({
                  score: evaluation.earnedPoints,
                  max_score: evaluation.totalPoints,
                  completed_at: new Date().toISOString(),
                })
                .eq('id', existingGrade.id);
            } else {
              await supabase.from('lms_lesson_quiz_grades').insert([
                {
                  lesson_id: lessonId,
                  student_id: user.id,
                  score: evaluation.earnedPoints,
                  max_score: evaluation.totalPoints,
                  completed_at: new Date().toISOString(),
                },
              ]);
            }
          }
        } catch (gErr) {
          console.error('Error saving to lms_lesson_quiz_grades:', gErr);
        }

        // 2. Update lms_quiz_attempts if available
        if (attemptId) {
          try {
            await supabase
              .from('lms_quiz_attempts')
              .update({
                status: 'completed',
                score: evaluation.scorePercentage,
                completed_at: new Date().toISOString(),
              })
              .eq('id', attemptId);
          } catch (aErr) {
            console.warn('Error updating lms_quiz_attempts:', aErr);
          }
        } else {
          try {
            await supabase.from('lms_quiz_attempts').insert([
              {
                lesson_id: lessonId,
                student_id: user.id,
                status: 'completed',
                score: evaluation.scorePercentage,
                completed_at: new Date().toISOString(),
              },
            ]);
          } catch (aErr) {
            console.warn('Error inserting lms_quiz_attempts:', aErr);
          }
        }

        toast.success(isAutoSubmit ? 'Tiempo finalizado. Evaluación enviada.' : 'Evaluación enviada con éxito');
      } catch (err: unknown) {
        console.error('Error submitting quiz:', err);
        toast.error('Error al enviar la evaluación');
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, questions, answers, lessonId, attemptId]
  );

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIdx(0);
    setTimeLeft(30 * 60);
    setShowResults(false);
    setScoreData(null);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuiz(), 0);
    return () => window.clearTimeout(timer);
  }, [loadQuiz]);

  useEffect(() => {
    if (showResults) return;
    if (timeLeft <= 0) {
      const submitTimer = window.setTimeout(() => void handleSubmit(true), 0);
      return () => window.clearTimeout(submitTimer);
    }
    const timer = window.setInterval(() => setTimeLeft((previous) => previous - 1), 1000);
    return () => window.clearInterval(timer);
  }, [handleSubmit, timeLeft, showResults]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto" />
      </div>
    );
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

  // --- RESULTS FEEDBACK SCREEN ---
  if (showResults && scoreData) {
    const passed = scoreData.scorePercentage >= 60;

    return (
      <AnimeFadeUp className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            passed ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
            passed ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            {passed ? 'Aprobado' : 'No Aprobado'}
          </span>

          <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white mb-2">
            Resultado de tu Evaluación
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Obtuviste <strong className="text-gold font-bold">{scoreData.earnedPoints}</strong> de <strong className="text-gold font-bold">{scoreData.totalPoints}</strong> puntos posibles ({scoreData.scorePercentage}%).
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleRetake}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
            <button
              onClick={onComplete}
              className="px-8 py-2.5 bg-gold hover:bg-yellow-600 text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Continuar
            </button>
          </div>
        </div>

        {/* Detailed Answer Review */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-gray-100 dark:border-white/10 pb-4">
            Revisión de Respuestas
          </h3>

          <div className="space-y-4">
            {scoreData.results.map((res, idx) => {
              const correctOpt = res.question.options?.find((o) => o.isCorrect === true);
              const correctText = correctOpt ? correctOpt.label : (String(res.question.correctAnswer || ''));

              return (
                <div
                  key={res.question.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    res.isCorrect
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        res.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {res.isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </span>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {idx + 1}. {res.question.content}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-gold bg-gold/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {res.earnedPoints} / {res.question.points} pt(s)
                    </span>
                  </div>

                  <div className="ml-8 space-y-1 text-xs">
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong className="text-gray-500">Tu respuesta: </strong>
                      {res.userAnswer !== undefined ? String(res.userAnswer) : <em className="text-gray-400">Sin responder</em>}
                    </p>
                    {!res.isCorrect && correctText && (
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        <strong>Respuesta correcta: </strong>
                        {correctText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AnimeFadeUp>
    );
  }

  // --- QUIZ TAKING SCREEN ---
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
          <HelpCircle className="w-5 h-5 text-gold" />
          <span className="font-medium">
            Pregunta {currentQuestionIdx + 1} de {questions.length}
          </span>
        </div>
        <div
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold ${
            timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-black/30 text-white/90'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-medium text-white leading-relaxed">{currentQ.content}</h3>
          <span className="text-sm font-bold text-gold bg-gold/10 px-3 py-1 rounded-full whitespace-nowrap ml-4 border border-gold/20">
            {currentQ.points} pt(s)
          </span>
        </div>

        <div className="space-y-4">
          {currentQ.type === 'multiple_choice' &&
            (currentQ.options || []).map((opt, i) => (
              <label
                key={i}
                className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                  answers[currentQ.id] === opt.value || answers[currentQ.id] === opt.label
                    ? 'bg-gold/20 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'bg-black/20 border-white/10 hover:border-white/30'
                }`}
              >
                <input
                  type="radio"
                  name={currentQ.id}
                  value={opt.value}
                  checked={answers[currentQ.id] === opt.value || answers[currentQ.id] === opt.label}
                  onChange={() => saveAnswer(currentQ.id, opt.value)}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    answers[currentQ.id] === opt.value || answers[currentQ.id] === opt.label ? 'border-gold' : 'border-white/30'
                  }`}
                >
                  {(answers[currentQ.id] === opt.value || answers[currentQ.id] === opt.label) && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                  )}
                </div>
                <span className="text-white/90 font-medium">{opt.label}</span>
              </label>
            ))}

          {currentQ.type === 'true_false' &&
            ['Verdadero', 'Falso'].map((opt, i) => {
              const val = opt === 'Verdadero';
              const isChecked = answers[currentQ.id] === val || answers[currentQ.id] === opt || answers[currentQ.id] === String(val);
              return (
                <label
                  key={i}
                  className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-gold/20 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                      : 'bg-black/20 border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQ.id}
                    value={opt}
                    checked={isChecked}
                    onChange={() => saveAnswer(currentQ.id, val)}
                    className="hidden"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      isChecked ? 'border-gold' : 'border-white/30'
                    }`}
                  >
                    {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                  </div>
                  <span className="text-white/90 font-medium">{opt}</span>
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

      {/* Question Quick Jump Pills */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
          const isCurrent = idx === currentQuestionIdx;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIdx(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-gold text-white shadow-md ring-2 ring-gold/50 scale-105'
                  : isAnswered
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIdx === 0}
          className="flex items-center px-6 py-3 rounded-xl font-bold text-white/70 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Anterior
        </button>

        {currentQuestionIdx === questions.length - 1 ? (
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center px-8 py-3 bg-gold hover:bg-yellow-600 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? 'Enviando...' : 'Finalizar Evaluación'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Siguiente
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </AnimeFadeUp>
  );
}

export default QuizPlayer;
