import { X, Clock, FileText, CheckCircle, BookOpen } from 'lucide-react';
import { AssignmentDropzone } from './AssignmentDropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: string;
  title: string;
  module: string;
  dueDate: string;
  status: string;
  grade: number | string | null;
  type: string;
}

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  courseId: string;
  onSuccess: () => void;
}

export function ActivityDetailModal({ isOpen, onClose, activity, courseId, onSuccess }: ActivityDetailModalProps) {
  if (!isOpen || !activity) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                  <BookOpen size={12} />
                  {activity.module}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 ${
                  activity.status === 'graded' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  activity.status === 'submitted' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {activity.status === 'graded' ? <CheckCircle size={12} /> : 
                   activity.status === 'submitted' ? <FileText size={12} /> : 
                   <Clock size={12} />}
                  {activity.status === 'graded' ? 'Calificada' : 
                   activity.status === 'submitted' ? 'Entregada' : 'Pendiente'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                {activity.title}
              </h2>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                <Clock size={16} className="text-orange-500" /> 
                <span className="font-semibold text-slate-700 dark:text-gray-300">Fecha de Entrega:</span> 
                {new Date(activity.dueDate).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow bg-slate-50/50 dark:bg-[#0B1120]">
            <div className="space-y-8">
              
              {/* Instrucciones (Placeholder until we fetch content from DB) */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  Instrucciones de la Tarea
                </h3>
                <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
                  <p>Por favor, revisa el material de la lección antes de enviar esta asignación. Asegúrate de cumplir con los siguientes requisitos:</p>
                  <ul>
                    <li>Formato PDF o Imagen legible.</li>
                    <li>Incluye tus nombres completos en la primera página.</li>
                    <li>Respeta la fecha límite de entrega.</li>
                  </ul>
                  <p>Cualquier entrega atrasada será calificada sobre el 80%.</p>
                </div>
              </div>

              {/* Entrega */}
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  Tu Entrega
                </h3>
                <AssignmentDropzone 
                  courseId={courseId} 
                  lessonId={activity.id} 
                  onSuccess={() => {
                    onSuccess();
                  }}
                />
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
