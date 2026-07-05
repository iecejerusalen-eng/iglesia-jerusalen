import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { GradebookPro } from '../../features/lms/components/GradebookPro';

const LMSGradebook = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link to={`/admin/lms/course/settings/${id}`} className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gold transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Volver al Curso
      </Link>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="text-gold" size={32} />
            Libreta de Calificaciones (Gradebook)
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Matriz de evaluación, retroalimentación y cálculo automático.
          </p>
        </div>
      </div>

      {id && <GradebookPro courseId={id} />}
    </div>
  );
};

export default LMSGradebook;
