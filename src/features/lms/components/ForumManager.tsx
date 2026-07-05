import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { MessageSquare, Plus, Trash2, Shield, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export function ForumManager({ courseId }: { courseId: string }) {
  const { user } = useAuthStore();
  const [forums, setForums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchForums = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lms_forums')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForums(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (courseId) {
        await fetchForums();
      }
    };
    init();
  }, [courseId]);

  const handleCreateForum = async () => {
    if (!newTitle.trim() || !user) return;
    try {
      const { error } = await supabase
        .from('lms_forums')
        .insert({
          course_id: courseId,
          title: newTitle,
          description: newDescription,
          created_by: user.id
        });

      if (error) throw error;
      toast.success('Foro creado');
      setIsCreating(false);
      setNewTitle('');
      setNewDescription('');
      fetchForums();
    } catch (err) {
      console.error(err);
      toast.error('Error al crear foro');
    }
  };

  const toggleLock = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('lms_forums')
        .update({ is_locked: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Foro desbloqueado' : 'Foro bloqueado');
      setForums(prev => prev.map(f => f.id === id ? { ...f, is_locked: !currentStatus } : f));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteForum = async (id: string) => {
    if (!window.confirm('¿Eliminar este foro y todas sus respuestas?')) return;
    try {
      const { error } = await supabase
        .from('lms_forums')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Foro eliminado');
      setForums(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-slate-800 rounded-xl"></div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-500" /> Hilos de Debate
        </h3>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
        >
          <Plus size={14} /> Nuevo Foro
        </button>
      </div>

      {isCreating && (
        <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-gray-100 dark:border-white/5 space-y-3">
          <input 
            type="text" 
            placeholder="Título del debate"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg outline-none text-sm font-bold"
          />
          <textarea 
            placeholder="Descripción (opcional)"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg outline-none text-sm resize-none"
            rows={2}
          ></textarea>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsCreating(false)} className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">Cancelar</button>
            <button onClick={handleCreateForum} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Crear Hilo</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {forums.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Shield size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay foros creados. Inicia un debate.</p>
          </div>
        ) : (
          forums.map(forum => (
            <div key={forum.id} className="p-4 flex items-center justify-between group">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${forum.is_locked ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  {forum.is_locked ? <Lock size={16} /> : <MessageSquare size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{forum.title}</h4>
                  <p className="text-xs text-gray-500">{forum.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleLock(forum.id, forum.is_locked)} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded" title={forum.is_locked ? "Desbloquear" : "Bloquear (Solo lectura)"}>
                  {forum.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
                </button>
                <button onClick={() => deleteForum(forum.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
