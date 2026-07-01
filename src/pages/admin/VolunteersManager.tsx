import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { VolunteerShift, VolunteerAssignment, Ministry } from '../../types';
import { Shield, Plus, Calendar, Users, Trash2, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VolunteersManager() {
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [ministries, setMinistries] = useState<Pick<Ministry, 'id' | 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<VolunteerShift>>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    required_volunteers: 1,
    ministry_id: ''
  });

  const loadData = async () => {
    try {
      const [shiftsRes, assignRes, minRes] = await Promise.all([
        supabase.from('volunteer_shifts').select('*, ministries(name)').order('start_time', { ascending: false }),
        supabase.from('volunteer_assignments').select('*, members(first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('ministries').select('id, name').order('name')
      ]);

      if (shiftsRes.error) throw shiftsRes.error;
      if (assignRes.error) throw assignRes.error;
      if (minRes.error) throw minRes.error;

      setShifts(shiftsRes.data || []);
      setAssignments(assignRes.data || []);
      setMinistries(minRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos de voluntariado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, []);

  const handleOpenModal = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      required_volunteers: 1,
      ministry_id: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time || !formData.end_time) {
      return toast.error('Completa los campos requeridos');
    }

    try {
      const { error } = await supabase.from('volunteer_shifts').insert([{
        ...formData,
        ministry_id: formData.ministry_id || null
      }]);
      
      if (error) throw error;
      toast.success('Turno creado');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al crear turno');
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('¿Eliminar este turno y todas sus asignaciones?')) return;
    try {
      const { error } = await supabase.from('volunteer_shifts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Turno eliminado');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateAssignmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('volunteer_assignments').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success('Estado actualizado');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar estado');
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-ES', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-500" /> Voluntariado
          </h1>
          <p className="text-slate-500 mt-2">Gestiona los turnos y asignaciones de servicio.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Crear Turno
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Turnos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Turnos Programados
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? <p className="text-center text-slate-500 py-10">Cargando...</p> : shifts.map(shift => {
              const shiftAssignments = assignments.filter(a => a.shift_id === shift.id);
              const confirmedCount = shiftAssignments.filter(a => a.status === 'confirmed').length;

              return (
                <div key={shift.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{shift.title}</h3>
                    <button onClick={() => handleDeleteShift(shift.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-col gap-1 mb-3">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDateTime(shift.start_time)} - {new Date(shift.end_time).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                    {shift.ministries && <span className="text-indigo-500 font-medium">{shift.ministries.name}</span>}
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3">
                    <div className="flex justify-between items-center text-xs font-semibold mb-2">
                      <span className="text-slate-500 uppercase tracking-wider">Voluntarios</span>
                      <span className={`${confirmedCount >= shift.required_volunteers ? 'text-green-500' : 'text-amber-500'}`}>
                        {confirmedCount} / {shift.required_volunteers}
                      </span>
                    </div>
                    {shiftAssignments.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {shiftAssignments.map(a => (
                          <div key={a.id} className="flex items-center justify-between text-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-md">
                            <span className="dark:text-slate-300">{a.members?.first_name} {a.members?.last_name}</span>
                            <div className="flex items-center gap-2">
                              {a.status === 'pending' && (
                                <>
                                  <button onClick={() => handleUpdateAssignmentStatus(a.id, 'confirmed')} className="text-green-500 hover:bg-green-50 p-1 rounded"><CheckCircle2 className="w-4 h-4" /></button>
                                  <button onClick={() => handleUpdateAssignmentStatus(a.id, 'cancelled')} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                              {a.status === 'confirmed' && <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">Confirmado</span>}
                              {a.status === 'cancelled' && <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">Cancelado</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">Sin registros aún</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel derecho u otras métricas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Solicitudes Recientes
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {assignments.filter(a => a.status === 'pending').map(a => {
               const shift = shifts.find(s => s.id === a.shift_id);
               return (
                 <div key={a.id} className="border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4">
                   <div className="font-bold text-slate-900 dark:text-white">{a.members?.first_name} {a.members?.last_name}</div>
                   <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Solicita servir en: <strong>{shift?.title}</strong></div>
                   <div className="text-xs text-slate-500 mt-1">{shift ? formatDateTime(shift.start_time) : ''}</div>
                   
                   <div className="flex gap-2 mt-3">
                     <button onClick={() => handleUpdateAssignmentStatus(a.id, 'confirmed')} className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded-lg">Aprobar</button>
                     <button onClick={() => handleUpdateAssignmentStatus(a.id, 'cancelled')} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-lg">Rechazar</button>
                   </div>
                 </div>
               );
             })}
             {assignments.filter(a => a.status === 'pending').length === 0 && (
               <p className="text-center text-slate-500 py-10">No hay solicitudes pendientes.</p>
             )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">Nuevo Turno</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Título</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2" placeholder="Ej. Ujieres Culto Dominical" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Ministerio (Opcional)</label>
                <select value={formData.ministry_id || ''} onChange={e => setFormData({...formData, ministry_id: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2">
                  <option value="">Selecciona un ministerio</option>
                  {ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Inicio</label>
                  <input type="datetime-local" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Fin</label>
                  <input type="datetime-local" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Voluntarios Requeridos</label>
                <input type="number" min="1" required value={formData.required_volunteers} onChange={e => setFormData({...formData, required_volunteers: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2" />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
