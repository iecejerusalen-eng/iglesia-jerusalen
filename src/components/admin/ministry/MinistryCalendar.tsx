import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Edit2, Globe, Lock } from 'lucide-react';
import type { Event as DbEvent } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePermissions } from '../../../hooks/usePermissions';

export default function MinistryCalendar({ ministryId }: { ministryId: string }) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for creating/editing an event
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const { role } = useAuthStore();
  const { hasPermission, isReadOnly } = usePermissions();
  const canEdit = role === 'admin' || role === 'leader' || (!isReadOnly('ministries') && hasPermission('ministries', 'edit'));

  useEffect(() => {
    fetchEvents();
  }, [ministryId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('ministry_id', ministryId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching ministry events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingEventId(null);
    setTitle('');
    setDescription('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setStartTime('');
    setEndTime('');
    setIsPublic(false);
  };

  const handleEdit = (ev: DbEvent) => {
    setIsEditing(true);
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description || '');
    setStartDate(ev.start_date);
    setEndDate(ev.end_date);
    setStartTime(ev.start_time || '');
    setEndTime(ev.end_time || '');
    setIsPublic(ev.is_public ?? false);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (!confirm('¿Seguro que deseas eliminar este evento?')) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Error al eliminar evento.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        start_date: startDate,
        end_date: endDate || startDate,
        start_time: startTime || null,
        end_time: endTime || null,
        ministry_id: ministryId,
        is_public: isPublic,
        is_recurring: false // Basic implementation for this scope
      };

      if (editingEventId) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEventId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert(payload);
        if (error) throw error;
      }
      
      setIsEditing(false);
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Error al guardar el evento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && events.length === 0) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 mb-6">
          {editingEventId ? 'Editar Evento' : 'Nuevo Evento'}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Inicio (Opcional)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Fin (Opcional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <label htmlFor="isPublic" className="flex-1 cursor-pointer">
              <span className="block font-semibold text-gray-800">Evento Público</span>
              <span className="text-sm text-gray-500">Si lo marcas, aparecerá en el calendario general de la iglesia. De lo contrario, es solo para el ministerio.</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 font-medium text-white bg-primary hover:bg-blue-900 rounded-lg flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Guardar Evento
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Calendario Interno</h3>
          <p className="text-sm text-gray-500">Eventos, reuniones o actividades exclusivas de este ministerio.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleCreateNew}
            className="bg-primary hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Nuevo Evento
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Fecha y Hora</th>
              <th className="px-4 py-3">Visibilidad</th>
              {canEdit && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 4 : 3} className="px-4 py-8 text-center text-gray-400">
                  No hay eventos programados.
                </td>
              </tr>
            ) : (
              events.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800">{ev.title}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-gray-400" />
                      {new Date(ev.start_date + 'T12:00:00').toLocaleDateString('es-ES', { 
                        month: 'short', day: 'numeric' 
                      })}
                      {ev.start_time && ` - ${ev.start_time.slice(0, 5)}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {ev.is_public ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <Globe size={12} /> Público
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        <Lock size={12} /> Privado
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(ev)}
                          className="text-gray-400 hover:text-primary p-1.5 rounded-md"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-md"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
