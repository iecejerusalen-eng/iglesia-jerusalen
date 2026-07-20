import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2 } from 'lucide-react';
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

export function AssignmentDropzone({ courseId, lessonId, maxSizeMB = 5, onSuccess }: AssignmentDropzoneProps) {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Error fetching submission', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId, user]);

  useEffect(() => {
    loadExistingSubmission();
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
        // Compress if image
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
    setProgress(10); // Start progress

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

      if (presignError) throw new Error('Error de conexión con R2: ' + presignError.message);
      if (presignData.error) throw new Error(presignData.error);

      const { uploadUrl, fileKey } = presignData;
      setProgress(40);

      // 2. Upload file directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Fallo al subir el archivo a R2');
      }
      setProgress(80);

      // 3. Register submission in Database
      // 3. Register submission in Database
      
      const { error: dbError } = await supabase
        .from('lms_lesson_submissions')
        .upsert({
          lesson_id: lessonId,
          student_id: user.id,
          file_url: fileKey, // Store the key, we can reconstruct the public URL later
          submitted_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setProgress(100);
      toast.success('¡Tarea entregada con éxito!');
      setFile(null);
      await loadExistingSubmission();
      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error('Upload Error:', err);
      toast.error(err.message || 'Ocurrió un error al entregar la tarea');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gold" /></div>;
  }

  // Si ya hay una entrega y está calificada
  if (existingSubmission?.grade) {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-200 dark:border-green-800/30">
        <div className="flex items-start gap-4">
          <div className="bg-green-500 text-white p-3 rounded-full">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-800 dark:text-green-400">Tarea Calificada</h3>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-bold">Calificación:</span> {existingSubmission.grade}
            </div>
            {existingSubmission.teacher_feedback && (
              <div className="mt-3 bg-white dark:bg-slate-900 p-4 rounded-xl text-sm italic border border-gray-100 dark:border-white/5">
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
      {existingSubmission && !existingSubmission.grade && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 flex items-center gap-3">
          <CheckCircle className="text-blue-500" />
          <div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-400">Entrega Registrada</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">Esperando calificación del docente. Puedes subir un nuevo archivo para reemplazar tu entrega anterior.</p>
          </div>
        </div>
      )}

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
    </div>
  );
}
