import { useState, useRef } from 'react';
import { BookOpen, Award, Upload, File, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';

interface PlanningTabProps {
  materials: any[];
  activities: any[];
  resources?: any[];
  courseId?: string;
}

export function PlanningTab({ materials, activities, resources = [], courseId }: PlanningTabProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !courseId || !user) return;

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsUploading(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lms_resources')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lms_resources')
        .getPublicUrl(fileName);

      // 3. Save to lms_course_resources table
      const { error: dbError } = await supabase
        .from('lms_course_resources')
        .insert({
          course_id: courseId,
          title: file.name,
          file_url: publicUrl,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          created_by: user.id
        });

      if (dbError) throw dbError;

      toast.success('Recurso subido correctamente. Recarga la página para verlo.');
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      toast.error('Error al subir el archivo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;
    try {
      const { error } = await supabase.from('lms_course_resources').delete().eq('id', id);
      if (error) throw error;
      toast.success('Recurso eliminado. Recarga la página.');
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={18} className="text-gold" />
            Gestor de Archivos (Recursos)
          </h3>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !courseId}
            className="flex items-center gap-2 bg-gold hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Subir Archivo
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleUploadFile}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
          />
        </div>
        
        <div className="space-y-3">
          {resources.length === 0 ? (
            <p className="text-xs text-gray-500 py-6">No hay archivos adicionales compartidos en este curso.</p>
          ) : (
            resources.map(res => (
              <div key={res.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center text-gold">
                    <File size={14} />
                  </div>
                  <div>
                    <a href={res.file_url} target="_blank" rel="noopener noreferrer" className="font-bold text-xs text-blue-600 hover:underline line-clamp-1">
                      {res.title}
                    </a>
                    <p className="text-[10px] text-gray-400">{(res.file_size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteResource(res.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        
        {materials.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase">Lecciones del Temario</h4>
            <div className="space-y-2">
              {materials.map(mat => (
                <div key={mat.id} className="p-2 flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-gray-300">{mat.title}</span>
                  <span className="text-[9px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded font-bold">{mat.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Award size={18} className="text-gold" />
          Evaluaciones Programadas
        </h3>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-xs text-gray-500 py-6">No hay exámenes o cuestionarios calendarizados.</p>
          ) : (
            activities.map(act => (
              <div key={act.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-850 dark:text-white">{act.title}</p>
                  <p className="text-[9px] text-gray-400">Tipo: <span className="capitalize">{act.type === 'assignment' ? 'Tarea' : 'Cuestionario'}</span></p>
                </div>
                <span className="text-[10px] text-gold bg-gold/15 px-2.5 py-1 rounded-full font-bold">Evaluación</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
