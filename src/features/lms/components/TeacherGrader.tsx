import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface QuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  started_at: string;
  completed_at: string;
  score: number;
  is_passed: boolean;
  answers: Record<string, string | boolean>;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export function TeacherGrader({ quizId }: { quizId: string }) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAttempts() {
      try {
        const { data, error } = await supabase
          .from('lms_quiz_attempts')
          .select(`
            *,
            profiles (first_name, last_name)
          `)
          .eq('quiz_id', quizId)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });

        if (error) throw error;
        
        const formattedData = (data || []).map(attempt => ({
          ...attempt,
          profiles: Array.isArray(attempt.profiles) ? attempt.profiles[0] : attempt.profiles
        })) as unknown as QuizAttempt[];

        setAttempts(formattedData);
      } catch (error) {
        console.error('Error fetching attempts:', error);
        toast.error('Error al cargar intentos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttempts();
  }, [quizId]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 dark:bg-slate-800 rounded-3xl border border-gray-150 dark:border-white/10">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sin intentos aún</h3>
        <p className="text-gray-500 dark:text-gray-400">Ningún estudiante ha completado esta evaluación.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 overflow-hidden">
      <div className="p-6 border-b border-gray-150 dark:border-white/10">
        <h3 className="text-lg font-bold">Intentos de Evaluación</h3>
      </div>
      <div className="divide-y divide-gray-150 dark:divide-white/10">
        {attempts.map(attempt => (
          <div key={attempt.id} className="p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {attempt.profiles?.first_name} {attempt.profiles?.last_name}
              </p>
              <p className="text-sm text-gray-500">
                Enviado: {new Date(attempt.completed_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-lg">{attempt.score} pts</p>
                <div className={`flex items-center gap-1 text-sm font-medium ${attempt.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                  {attempt.is_passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {attempt.is_passed ? 'Aprobado' : 'Reprobado'}
                </div>
              </div>
              <button className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-4 py-2 rounded-xl font-medium transition-colors">
                Revisar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
