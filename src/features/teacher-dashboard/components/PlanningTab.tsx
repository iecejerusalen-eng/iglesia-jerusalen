import { useState, useRef } from 'react';
import { BookOpen, Award, Upload, File, Loader2, Trash2, ChevronDown, ChevronRight, Video, FileText, MonitorPlay, CheckSquare } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';

interface PlanningTabProps {
  modules?: any[];
  materials: any[];
  activities: any[];
  resources?: any[];
  courseId?: string;
}

export function PlanningTab({ modules = [], materials, activities, resources = [], courseId }: PlanningTabProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingModuleId, setUploadingModuleId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUploadClick = (moduleId: string) => {
    setUploadingModuleId(moduleId);
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !courseId || !user || !uploadingModuleId) return;

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/${uploadingModuleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('lms_resources')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lms_resources')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('lms_course_resources')
        .insert({
          course_id: courseId,
          module_id: uploadingModuleId,
          title: file.name,
          file_url: publicUrl,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          created_by: user.id
        });

      if (dbError) throw dbError;

      toast.success('Recurso subido correctamente. Recarga la página.');
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      toast.error('Error al subir el archivo: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadingModuleId(null);
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

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video': return <Video size={14} className="text-blue-500" />;
      case 'pdf': return <FileText size={14} className="text-red-500" />;
      case 'zoom': return <MonitorPlay size={14} className="text-indigo-500" />;
      case 'assignment': return <BookOpen size={14} className="text-amber-500" />;
      case 'quiz': return <CheckSquare size={14} className="text-emerald-500" />;
      default: return <File size={14} className="text-gray-500" />;
    }
  };

  if (modules.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm">
        <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-2">No hay unidades planificadas</h3>
        <p className="text-sm text-gray-500">Cree un módulo o unidad temática primero para poder organizar sus lecciones, recursos y evaluaciones por semanas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleUploadFile}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
      />

      {modules.map((mod, index) => {
        const isExpanded = expandedModules[mod.id];
        const modMaterials = materials.filter(m => m.module_id === mod.id);
        const modActivities = activities.filter(a => a.module_id === mod.id);
        const modResources = resources.filter(r => r.module_id === mod.id);

        return (
          <div key={mod.id} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
            {/* Header Accordion */}
            <div 
              onClick={() => toggleModule(mod.id)}
              className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center text-gold font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                    Semana {index + 1}: {mod.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{mod.description || 'Sin descripción'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2 text-[10px] font-bold text-gray-400">
                  <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-gray-200 dark:border-white/5">{modMaterials.length} Temas</span>
                  <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-gray-200 dark:border-white/5">{modActivities.length} Tareas</span>
                  <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-gray-200 dark:border-white/5">{modResources.length} Archivos</span>
                </div>
                {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-5 border-t border-gray-150 dark:border-white/5 space-y-6">
                
                {/* Lecciones y Evaluaciones combinadas */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <BookOpen size={14} className="text-gold" />
                    Temario y Evaluaciones
                  </h4>
                  {modMaterials.length === 0 && modActivities.length === 0 ? (
                    <p className="text-[11px] text-gray-400 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg">No hay temas ni evaluaciones en esta semana.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...modMaterials, ...modActivities].map(item => (
                        <div key={item.id} className="p-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                              {getIconForType(item.type)}
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{item.title}</span>
                          </div>
                          <span className="text-[9px] uppercase font-bold text-gray-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-gray-200 dark:border-white/5">
                            {item.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recursos Documentales */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-gray-300 flex items-center gap-2">
                      <File size={14} className="text-gold" />
                      Material de Apoyo (Recursos)
                    </h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUploadClick(mod.id); }}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-gold hover:text-yellow-600 bg-gold/10 hover:bg-gold/20 px-2 py-1 rounded transition-colors"
                    >
                      {isUploading && uploadingModuleId === mod.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      Subir Archivo
                    </button>
                  </div>
                  
                  {modResources.length === 0 ? (
                    <p className="text-[11px] text-gray-400 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-dashed border-gray-200 dark:border-white/10 text-center">
                      No hay archivos compartidos. Puedes subir PDFs, Diapositivas o Documentos para tus alumnos.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {modResources.map(res => (
                        <div key={res.id} className="p-3 bg-white dark:bg-slate-950 border border-gray-150 dark:border-white/10 rounded-xl flex items-start gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                            <FileText size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <a href={res.file_url} target="_blank" rel="noopener noreferrer" className="font-bold text-xs text-blue-600 hover:underline truncate block">
                              {res.title}
                            </a>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase">
                                {(res.file_size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <button 
                                onClick={() => handleDeleteResource(res.id)}
                                className="text-[10px] text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
