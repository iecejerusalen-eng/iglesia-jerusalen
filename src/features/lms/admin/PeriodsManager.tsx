import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Calendar, Plus, Edit3 } from 'lucide-react';
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
interface SchoolOption { id: string; name: string; }

export function PeriodsManager() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', schoolId: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);

  const fetchPeriods = async () => {
    try {
      const [{ data, error }, { data: schoolsData, error: schoolsError }] = await Promise.all([
        supabase.from('lms_academic_periods').select(`*, lms_schools(name)`).order('start_date', { ascending: false }),
        supabase.from('lms_schools').select('id, name').eq('is_active', true).order('sort_order', { ascending: true }),
      ]);
      if (error) throw error;
      if (schoolsError) throw schoolsError;
      setPeriods(data || []);
      setSchools((schoolsData || []) as SchoolOption[]);
    } catch (err: unknown) {
      toast.error('Error cargando períodos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchPeriods(), 0);
    return () => window.clearTimeout(timer);
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
    } catch (err: unknown) {
      toast.error('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const createPeriod = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.schoolId || !form.startDate || !form.endDate) {
      toast.error('Completa el nombre, escuela y fechas del periodo.');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('La fecha final debe ser posterior a la fecha inicial.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('lms_academic_periods').insert({ name: form.name.trim(), school_id: form.schoolId, start_date: form.startDate, end_date: form.endDate, is_active: false });
      if (error) throw error;
      toast.success('Periodo académico creado.');
      setForm({ name: '', schoolId: '', startDate: '', endDate: '' });
      setShowForm(false);
      await fetchPeriods();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el periodo.');
    } finally {
      setSaving(false);
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
        <button type="button" onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm">
          <Plus size={18} /> Nuevo Período
        </button>
      </div>

      {showForm && (
        <form onSubmit={createPeriod} className="grid gap-4 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-400/20 dark:bg-slate-900 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nombre<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="2026 - 2027" className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950" /></label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Escuela<select value={form.schoolId} onChange={(event) => setForm((current) => ({ ...current, schoolId: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950"><option value="">Selecciona una escuela</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Inicio<input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950" /></label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Fin<input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950" /></label>
          <div className="flex gap-2 sm:col-span-2"><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-emerald-600 px-5 font-bold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Crear periodo'}</button><button type="button" onClick={() => setShowForm(false)} className="min-h-11 rounded-xl border border-slate-200 px-5 font-bold dark:border-white/10">Cancelar</button></div>
        </form>
      )}

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
