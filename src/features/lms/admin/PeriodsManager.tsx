import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Calendar, Plus, Edit3, Trash2 } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { toast } from 'sonner';

interface Period {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  school_id: string;
  lms_schools?: { name: string };
}

export function PeriodsManager() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_academic_periods')
        .select(`*, lms_schools(name)`)
        .order('start_date', { ascending: false });
        
      if (error) throw error;
      setPeriods(data || []);
    } catch (err: any) {
      toast.error('Error cargando períodos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean, schoolId: string) => {
    try {
      // Si vamos a activarlo, opcionalmente desactivar los otros de la misma escuela
      if (!currentStatus) {
        await supabase
          .from('lms_academic_periods')
          .update({ is_active: false })
          .eq('school_id', schoolId);
      }

      const { error } = await supabase.from('lms_academic_periods').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      
      toast.success('Estado del período actualizado');
      fetchPeriods();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando períodos...</div>;

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Períodos Académicos</h2>
            <p className="text-sm text-gray-500">Solo los períodos activos son visibles para los alumnos.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm">
          <Plus size={18} /> Nuevo Período
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Período</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Escuela</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fechas</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {periods.map(period => (
              <tr key={period.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{period.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {period.lms_schools?.name || '---'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    period.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400'
                  }`}>
                    {period.is_active ? 'Activo' : 'Archivado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => toggleStatus(period.id, period.is_active, period.school_id)}
                      className="text-xs font-bold px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {period.is_active ? 'Archivar' : 'Activar'}
                    </button>
                    <button className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                      <Edit3 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No hay períodos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AnimeFadeUp>
  );
}
