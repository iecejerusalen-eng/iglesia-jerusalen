import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { LMSAssignmentSubmission, LMSActivity } from '../../../types';
import { toast } from 'sonner';

interface Props {
  activity: LMSActivity;
  studentId: string;
}

const LMSAssignment = ({ activity, studentId }: Props) => {
  const [submission, setSubmission] = useState<LMSAssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    fetchSubmission();
  }, [activity.id, studentId]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_assignment_submissions')
        .select('*')
        .eq('activity_id', activity.id)
        .eq('student_id', studentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        setSubmission(data as any);
        setTextContent(data.text_content || '');
      }
    } catch (err) {
      console.error('Error fetching submission:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let fileUrl = submission?.file_url || null;

      if (file) {
        // Upload to a media bucket or documents bucket
        const fileExt = file.name.split('.').pop();
        const fileName = `${activity.id}_${studentId}_${Date.now()}.${fileExt}`;
        const filePath = `assignments/${fileName}`;

        // Assuming a generic 'media' bucket exists based on other components
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        fileUrl = publicUrlData.publicUrl;
      }

      if (submission) {
        // Update existing
        const { error } = await supabase
          .from('lms_assignment_submissions')
          .update({
            file_url: fileUrl,
            text_content: textContent,
            submitted_at: new Date().toISOString()
          })
          .eq('id', submission.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('lms_assignment_submissions')
          .insert([{
            activity_id: activity.id,
            student_id: studentId,
            file_url: fileUrl,
            text_content: textContent
          }]);
          
        if (error) throw error;
      }

      toast.success('Tarea entregada con éxito');
      fetchSubmission();
    } catch (err: any) {
      toast.error('Error al entregar la tarea: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Cargando estado de la entrega...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 mt-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Upload size={18} className="text-indigo-600" /> 
        Entrega de Tarea
      </h4>

      {/* Submission Status */}
      <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/5">
        {submission ? (
          <>
            {submission.grade ? (
              <CheckCircle className="text-emerald-500 mt-0.5" size={20} />
            ) : (
              <Clock className="text-amber-500 mt-0.5" size={20} />
            )}
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {submission.grade ? 'Calificado' : 'Entregado, pendiente de calificación'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Última modificación: {new Date(submission.submitted_at).toLocaleString()}
              </p>
              {submission.grade && (
                <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-md p-3">
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Calificación: {submission.grade}</p>
                  {submission.teacher_feedback && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                      <strong>Comentario:</strong> {submission.teacher_feedback}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="text-rose-500 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Sin entregar</p>
              <p className="text-xs text-gray-500 mt-1">No has enviado nada para esta tarea aún.</p>
            </div>
          </>
        )}
      </div>

      {/* Form (only editable if not graded) */}
      {!submission?.grade && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comentarios / Texto de la entrega (opcional)
            </label>
            <textarea
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Escribe aquí el contenido de tu tarea o comentarios adicionales..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Archivo adjunto
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-white/10 flex items-center gap-2">
                <FileText size={16} />
                Seleccionar archivo
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }} 
                />
              </label>
              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                {file ? file.name : (submission?.file_url ? 'Archivo ya subido (se reemplazará)' : 'Ningún archivo')}
              </span>
            </div>
            {submission?.file_url && !file && (
              <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
                Ver archivo actual
              </a>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {uploading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
              {submission ? 'Actualizar Entrega' : 'Enviar Tarea'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSAssignment;
