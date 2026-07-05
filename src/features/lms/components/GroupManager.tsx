import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Plus, Users, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface GroupManagerProps {
  courseId: string;
}

export function GroupManager({ courseId }: GroupManagerProps) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  
  // Create / Edit State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lms_groups')
        .select('*')
        .eq('course_id', courseId)
        .order('name');
        
      if (error) throw error;
      setGroups(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [courseId]);

  const openNewForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIsFormOpen(true);
  };

  const openEditForm = (group: any) => {
    setEditingId(group.id);
    setName(group.name);
    setDescription(group.description || '');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    
    try {
      const payload = {
        course_id: courseId,
        name: name.trim(),
        description: description.trim()
      };

      if (editingId) {
        const { error } = await supabase.from('lms_groups').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Grupo actualizado');
      } else {
        const { error } = await supabase.from('lms_groups').insert([payload]);
        if (error) throw error;
        toast.success('Grupo creado');
      }
      
      setIsFormOpen(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, groupName: string) => {
    if (!confirm(`¿Eliminar el grupo "${groupName}"? Se perderán las asignaciones de estudiantes a este grupo.`)) return;
    
    try {
      const { error } = await supabase.from('lms_groups').delete().eq('id', id);
      if (error) throw error;
      toast.success('Grupo eliminado');
      fetchGroups();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gold" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold font-serif flex items-center gap-2">
            <Users className="text-gold" /> Grupos de Estudio / Paralelos
          </h3>
          <p className="text-sm text-gray-500">Divide a tus estudiantes en grupos paralelos para facilitar la evaluación.</p>
        </div>
        {!isFormOpen && (
          <button onClick={openNewForm} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus size={16} /> Crear Grupo
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold">{editingId ? 'Editar Grupo' : 'Nuevo Grupo'}</h4>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Grupo</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ej. Paralelo A, Sábados Mañana"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-gold outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción (Opcional)</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Breve detalle..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-gold outline-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="bg-gold hover:bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Guardar Grupo
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length === 0 && !isFormOpen ? (
          <div className="col-span-full p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-500">
            No has creado ningún grupo todavía.
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 hover:border-gold transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{group.name}</h4>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditForm(group)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(group.id, group.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{group.description || 'Sin descripción'}</p>
              
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase pt-4 border-t border-gray-100 dark:border-white/5">
                <span>ID: {group.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
