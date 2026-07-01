import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { Space, SpaceBooking } from '../../types';
import { Home, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/cloudinary';

export default function BookingManager() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookings, setBookings] = useState<SpaceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [spaceFormData, setSpaceFormData] = useState<Partial<Space>>({
    name: '',
    description: '',
    capacity: 0,
    features: [],
    is_active: true,
    image_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [featuresInput, setFeaturesInput] = useState('');

  const loadData = async () => {
    try {
      const [spacesRes, bookingsRes] = await Promise.all([
        supabase.from('spaces').select('*').order('name'),
        supabase.from('space_bookings').select('*, spaces(name), users(email)').order('start_time', { ascending: false })
      ]);

      if (spacesRes.error) throw spacesRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      setSpaces(spacesRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, []);

  const handleOpenSpaceModal = () => {
    setSpaceFormData({
      name: '',
      description: '',
      capacity: 0,
      features: [],
      is_active: true,
      image_url: ''
    });
    setFeaturesInput('');
    setSelectedFile(null);
    setIsSpaceModalOpen(true);
  };

  const handleSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceFormData.name) return toast.error('El nombre es requerido');

    try {
      let finalImageUrl = spaceFormData.image_url;

      if (selectedFile) {
        toast.loading('Subiendo imagen...', { id: 'upload' });
        const result = await uploadImage(selectedFile, 'spaces');
        if (result.secure_url) {
          finalImageUrl = result.secure_url;
        }
        toast.dismiss('upload');
      }

      const featuresArray = featuresInput.split(',').map(f => f.trim()).filter(f => f);

      const payload = {
        ...spaceFormData,
        features: featuresArray,
        image_url: finalImageUrl
      };

      const { error } = await supabase.from('spaces').insert([payload]);
      if (error) throw error;
      
      toast.success('Espacio creado');
      setIsSpaceModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar espacio');
      toast.dismiss('upload');
    }
  };

  const handleDeleteSpace = async (id: string) => {
    if (!confirm('¿Eliminar este espacio y todas sus reservas?')) return;
    try {
      const { error } = await supabase.from('spaces').delete().eq('id', id);
      if (error) throw error;
      toast.success('Espacio eliminado');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('space_bookings').update({ status }).eq('id', id);
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
            <Home className="w-8 h-8 text-emerald-500" /> Reservas de Espacios
          </h1>
          <p className="text-slate-500 mt-2">Gestiona aulas, templos y aprueba las solicitudes de uso.</p>
        </div>
        <button
          onClick={handleOpenSpaceModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Espacio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Espacios Físicos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-500" /> Espacios Administrados
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? <p className="text-center text-slate-500 py-10">Cargando...</p> : spaces.map(space => (
              <div key={space.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-4">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                  {space.image_url ? (
                    <img src={space.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Home className="w-8 h-8 text-slate-400 m-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{space.name}</h3>
                    <button onClick={() => handleDeleteSpace(space.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">{space.description}</p>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Capacidad: {space.capacity}</div>
                  <div className="flex flex-wrap gap-1">
                    {space.features?.map(f => (
                      <span key={f} className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Solicitudes de Reservas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" /> Solicitudes de Reserva
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {bookings.map(booking => (
               <div key={booking.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h4 className="font-bold text-slate-900 dark:text-white">{booking.title}</h4>
                     <div className="text-sm text-slate-600 dark:text-slate-400"><strong>Espacio:</strong> {booking.spaces?.name}</div>
                     <div className="text-xs text-slate-500 mt-1">{booking.users?.email}</div>
                   </div>
                   <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded ${
                     booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                     booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                     booking.status === 'cancelled' ? 'bg-slate-100 text-slate-700' :
                     'bg-amber-100 text-amber-700'
                   }`}>
                     {booking.status}
                   </span>
                 </div>
                 
                 <div className="text-xs text-slate-500 mb-3 bg-slate-50 dark:bg-slate-950 p-2 rounded flex flex-col gap-1">
                   <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Inicio: {formatDateTime(booking.start_time)}</span>
                   <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Fin: {formatDateTime(booking.end_time)}</span>
                 </div>

                 {booking.status === 'pending' && (
                   <div className="flex gap-2 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                     <button onClick={() => handleUpdateBookingStatus(booking.id, 'approved')} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">Aprobar</button>
                     <button onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors">Rechazar</button>
                   </div>
                 )}
               </div>
             ))}
             {bookings.length === 0 && (
               <p className="text-center text-slate-500 py-10">No hay reservas registradas.</p>
             )}
          </div>
        </div>
      </div>

      {isSpaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">Nuevo Espacio</h2>
              <button onClick={() => setIsSpaceModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSpaceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Nombre del Espacio</label>
                <input type="text" required value={spaceFormData.name} onChange={e => setSpaceFormData({...spaceFormData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" placeholder="Ej. Aula 1, Templo Principal" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Descripción</label>
                <textarea rows={2} value={spaceFormData.description || ''} onChange={e => setSpaceFormData({...spaceFormData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Capacidad (Personas)</label>
                  <input type="number" value={spaceFormData.capacity || 0} onChange={e => setSpaceFormData({...spaceFormData, capacity: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Estado</label>
                  <select value={spaceFormData.is_active ? 'true' : 'false'} onChange={e => setSpaceFormData({...spaceFormData, is_active: e.target.value === 'true'})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white">
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Características (separadas por coma)</label>
                <input type="text" value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" placeholder="Ej. Proyector, AC, Pizarra" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Foto del Espacio</label>
                <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700" />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsSpaceModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
