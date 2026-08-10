import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2, Type, AlertCircle } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { compressImageToWebP } from '../../../utils/imageCompression';
import { toast } from 'sonner';

interface AssignmentDropzoneProps {
  courseId: string;
  lessonId: string;
  maxSizeMB?: number;
  onSuccess?: () => void;
}

interface LessonSubmission {
  id: string;
  file_url: string | null;
  text_content: string | null;
  grade: number | null;
  teacher_feedback: string | null;
  status: string | null;
  submitted_at: string;
}

export function AssignmentDropzone({ courseId, lessonId, maxSizeMB = 5, onSuccess }: AssignmentDropzoneProps) {
  const { user } = useAuthStore();
  const [submissionMode, setSubmissionMode] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingText, setSubmittingText] = useState(false);
  const [progress, setProgress] = useState(0);
  const [existingSubmission, setExistingSubmission] = useState<LessonSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  // Constants
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  const loadExistingSubmission = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lms_lesson_submissions')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setExistingSubmission(data || null);
      if (data?.text_content && !data?.file_url) {
        setTextContent(data.text_content);
        setSubmissionMode('text');
      }
    } catch (err) {
      console.error('Error fetching submission', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadExistingSubmission(), 0);
    return () => window.clearTimeout(timer);
  }, [loadExistingSubmission]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const validateFile = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error('Solo se permiten documentos PDF e imágenes (se convertirán a WebP).');
      return false;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      toast.error(`El archivo excede el límite de ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        const processedFile = await compressImageToWebP(droppedFile);
        setFile(processedFile);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        const processedFile = await compressImageToWebP(selectedFile);
        setFile(processedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(15); // Start progress

    try {
      // 1. Get Pre-signed URL from Edge Function
      const { data: presignData, error: presignError } = await supabase.functions.invoke('r2-presign', {
        body: {
          fileName: file.name,
          fileType: file.type,
          courseId,
          lessonId
        }
      });

      if (presignError) throw new Error('Error de conexión con servicio de archivos R2: ' + presignError.message);
      if (!presignData || presignData.error) throw new Error(presignData?.error || 'Error al obtener URL pre-firmada');

      const { uploadUrl, fileKey } = presignData;
      setProgress(50);

      // 2. Upload file directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Fallo al subir el archivo al almacenamiento R2');
      }
      setProgress(85);

      // 3. Register submission in Database
      const { error: dbError } = await supabase
        .from('lms_lesson_submissions')
        .upsert({
          lesson_id: lessonId,
          student_id: user.id,
          file_url: fileKey,
          submitted_at: new Date().toISOString()
        }, { onConflict: 'lesson_id,student_id' });

      if (dbError) throw dbError;

      setProgress(100);
      toast.success('¡Tarea entregada con éxito!');
      setFile(null);
      await loadExistingSubmission();
      if (onSuccess) onSuccess();

    } catch (err: unknown) {
      console.error('Upload Error:', err);
      const errMsg = err instanceof Error ? err.message : 'Ocurrió un error al entregar la tarea';
      toast.error(`${errMsg}. Activando modo de respuesta por texto.`);
      setStorageUnavailable(true);
      setSubmissionMode('text');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim() || !user) {
      toast.error('Por favor escribe el contenido de tu entrega.');
      return;
    }
    setSubmittingText(true);

    try {
      const { error: dbError } = await supabase
        .from('lms_lesson_submissions')
        .upsert({
          lesson_id: lessonId,
          student_id: user.id,
          text_content: textContent.trim(),
          submitted_at: new Date().toISOString()
        }, { onConflict: 'lesson_id,student_id' });

      if (dbError) throw dbError;

      toast.success('¡Tarea en texto entregada con éxito!');
      await loadExistingSubmission();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Text Submission Error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al entregar la tarea');
    } finally {
      setSubmittingText(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gold" /></div>;
  }

  // Si ya hay una entrega y está calificada
  if (existingSubmission?.grade !== null && existingSubmission?.grade !== undefined) {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-200 dark:border-green-800/30">
        <div className="flex items-start gap-4">
          <div className="bg-green-500 text-white p-3 rounded-full">
            <CheckCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-400">Tarea Calificada</h3>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-bold">Calificación:</span> {existingSubmission.grade}
            </div>
            {existingSubmission.text_content && (
              <div className="mt-3 bg-white dark:bg-slate-900 p-4 rounded-xl text-sm border border-gray-100 dark:border-white/5">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Texto entregado:</p>
                <p className="italic">{existingSubmission.text_content}</p>
              </div>
            )}
            {existingSubmission.teacher_feedback && (
              <div className="mt-3 bg-white dark:bg-slate-900 p-4 rounded-xl text-sm italic border border-gray-100 dark:border-white/5">
                <p className="text-xs font-bold text-green-600 dark:text-green-400 not-italic mb-1">Retroalimentación del docente:</p>
                "{existingSubmission.teacher_feedback}"
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {existingSubmission && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 flex items-center gap-3">
          <CheckCircle className="text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-400">Entrega Registrada</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">Esperando calificación del docente. Puedes actualizar tu entrega enviando un nuevo archivo o texto.</p>
            {existingSubmission.text_content && (
              <div className="mt-2 text-xs bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-blue-100 dark:border-blue-900/20">
                <span className="font-bold">Contenido actual:</span> {existingSubmission.text_content}
              </div>
            )}
          </div>
        </div>
      )}

      {storageUnavailable && (
        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800/30 flex items-center gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            El servicio de archivos en la nube no está disponible temporalmente. Puedes enviar tu tarea ingresando la respuesta en texto a continuación.
          </p>
        </div>
      )}

      {/* Submission Mode Selector */}
      <div className="flex border-b border-gray-200 dark:border-white/10 gap-4">
        <button
          type="button"
          onClick={() => setSubmissionMode('file')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            submissionMode === 'file'
              ? 'border-gold text-slate-900 dark:text-white'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <UploadCloud size={18} />
          Adjuntar Archivo
        </button>
        <button
          type="button"
          onClick={() => setSubmissionMode('text')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            submissionMode === 'text'
              ? 'border-gold text-slate-900 dark:text-white'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Type size={18} />
          Respuesta en Texto
        </button>
      </div>

      {submissionMode === 'file' ? (
        <>
          <div
            className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
              isDragging 
                ? 'border-gold bg-gold/5 scale-[1.01]' 
                : file ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                : 'border-gray-300 dark:border-gray-700 hover:border-gold hover:bg-slate-50 dark:hover:bg-slate-900/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={uploading}
            />

            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 relative">
                  <FileIcon className="text-green-500" size={32} />
                  <button 
                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:scale-110 transition-transform z-10"
                    disabled={uploading}
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white">{file.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 pointer-events-none transition-transform group-hover:scale-110">
                  <UploadCloud className="text-gray-400 dark:text-gray-500" size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 pointer-events-none">
                  Arrastra tu archivo aquí
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 pointer-events-none max-w-sm mx-auto">
                  Soporta PDF o Imágenes. Las imágenes se comprimirán automáticamente a WebP para ahorrar datos. (Máx {maxSizeMB}MB)
                </p>
                <span className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-full text-sm font-semibold pointer-events-none shadow-sm">
                  Seleccionar Archivo
                </span>
              </>
            )}
          </div>

          {/* Visual Progress Indicator */}
          {uploading && (
            <div className="w-full space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-white/10 animate-fade-in">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-gold" size={14} />
                  Subiendo archivo al servidor...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gold h-full transition-all duration-300 ease-out rounded-full" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {file && (
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-gold hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1 flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Subiendo... {progress}%
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} />
                    Entregar Tarea
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Rich Text Fallback Mode */
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Respuesta o Contenido de la Tarea
            </label>
            <textarea
              rows={8}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Escribe o pega aquí la respuesta de tu tarea, informe o explicaciones..."
              className="w-full p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-gold outline-none text-sm leading-relaxed"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleTextSubmit}
              disabled={submittingText || !textContent.trim()}
              className="bg-gold hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {submittingText ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              Entregar Tarea en Texto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

