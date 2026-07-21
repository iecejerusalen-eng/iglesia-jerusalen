import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Building, Edit3, Trash2, Plus } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { toast } from 'sonner';

interface School {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export function SchoolsManager() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase.from('lms_schools').select('*').order('name');
      if (error) throw error;
      setSchools(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error('Error cargando escuelas: ' + err.message);
      } else {
        toast.error('Error cargando escuelas');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSchools();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('lms_schools').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast.success('Estado actualizado');
      fetchSchools();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error('Error: ' + err.message);
      } else {
        toast.error('Error desconocido');
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando escuelas...</div>;

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
            <Building size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Escuelas e Institutos</h2>
            <p className="text-sm text-gray-500">Administra las sedes o institutos que usan el LMS.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm">
          <Plus size={18} /> Nueva Escuela
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schools.map(school => (
          <div key={school.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{school.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  school.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {school.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{school.description || 'Sin descripción'}</p>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
              <button 
                onClick={() => toggleStatus(school.id, school.is_active)}
                className="text-xs font-bold px-4 py-2 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                {school.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 ml-auto">
                <Edit3 size={16} />
              </button>
              <button className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AnimeFadeUp>
  );
}
