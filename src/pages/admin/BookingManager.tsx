import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { Space, SpaceBooking } from '../../types';
import { Home, Plus, Trash2, Calendar, Clock, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '../../utils/cloudinary';

export default function BookingManager() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookings, setBookings] = useState<SpaceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
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
      setLoading(true);

      // 1. Fetch spaces
      const spacesRes = await supabase.from('spaces').select('*').order('name');
      if (spacesRes.data) {
        setSpaces(spacesRes.data);
      }

      // 2. Fetch bookings with fallback for profiles join
      let bookingsData: SpaceBooking[] = [];
      const bookingsWithProfiles = await supabase
        .from('space_bookings')
        .select('*, spaces(name), profiles(email, first_name, last_name)')
        .order('start_time', { ascending: false });

      if (!bookingsWithProfiles.error && bookingsWithProfiles.data) {
        bookingsData = bookingsWithProfiles.data as SpaceBooking[];
      } else {
        // Fallback: fetch without profiles join, then manual enrichment
        const basicBookings = await supabase
          .from('space_bookings')
          .select('*, spaces(name)')
          .order('start_time', { ascending: false });

        if (basicBookings.data) {
          bookingsData = basicBookings.data as SpaceBooking[];
          const userIds = Array.from(new Set(bookingsData.map(b => b.user_id).filter(Boolean)));
          if (userIds.length > 0) {
            const profilesRes = await supabase
              .from('profiles')
              .select('id, email, first_name, last_name')
              .in('id', userIds);

            if (profilesRes.data) {
              const profilesMap = new Map(profilesRes.data.map(p => [p.id, p]));
              bookingsData = bookingsData.map(b => ({
                ...b,
                profiles: b.user_id ? profilesMap.get(b.user_id) : undefined
              }));
            }
          }
        }
      }

      setBookings(bookingsData);
    } catch (err) {
      console.error('Error al cargar datos de reservas:', err);
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

  const handleOpenSpaceModal = (spaceToEdit?: Space) => {
    if (spaceToEdit) {
      setEditingSpace(spaceToEdit);
      setSpaceFormData({
        name: spaceToEdit.name,
        description: spaceToEdit.description || '',
        capacity: spaceToEdit.capacity || 0,
        features: spaceToEdit.features || [],
        is_active: spaceToEdit.is_active ?? true,
        image_url: spaceToEdit.image_url || ''
      });
      setFeaturesInput((spaceToEdit.features || []).join(', '));
    } else {
      setEditingSpace(null);
      setSpaceFormData({
        name: '',
        description: '',
        capacity: 0,
        features: [],
        is_active: true,
        image_url: ''
      });
      setFeaturesInput('');
    }
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
        name: spaceFormData.name,
        description: spaceFormData.description,
        capacity: spaceFormData.capacity,
        features: featuresArray,
        is_active: spaceFormData.is_active,
        image_url: finalImageUrl
      };

      if (editingSpace) {
        const { error } = await supabase.from('spaces').update(payload).eq('id', editingSpace.id);
        if (error) throw error;
        toast.success('Espacio actualizado');
      } else {
        const { error } = await supabase.from('spaces').insert([payload]);
        if (error) throw error;
        toast.success('Espacio creado');
      }
      
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
      toast.success('Estado de reserva actualizado');
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
            <Home className="w-8 h-8 text-emerald-500" /> Reservas de Espacios
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gestiona templos, aulas y aprueba las solicitudes de reserva de la congregación.</p>
        </div>
        <button
          onClick={() => handleOpenSpaceModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-md transition-colors"
        >
          <Plus className="w-5 h-5" /> Nuevo Espacio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Espacios Físicos */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-500" /> Espacios Administrados ({spaces.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? <p className="text-center text-slate-500 py-10">Cargando espacios...</p> : spaces.map(space => (
              <div key={space.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-4 flex gap-4 bg-white/50 dark:bg-slate-950/40 hover:border-emerald-500/50 transition-colors">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                  {space.image_url ? (
                    <img src={space.image_url} alt={space.name} className="w-full h-full object-cover" />
                  ) : (
                    <Home className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{space.name}</h3>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleOpenSpaceModal(space)} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors" title="Editar Espacio">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteSpace(space.id)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors" title="Eliminar Espacio">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">{space.description || 'Sin descripción.'}</p>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Capacidad: {space.capacity} personas</div>
                  <div className="flex flex-wrap gap-1">
                    {space.features?.map(f => (
                      <span key={f} className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-md font-semibold">
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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" /> Solicitudes de Reserva ({bookings.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {bookings.map(booking => (
               <div key={booking.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-white/50 dark:bg-slate-950/40">
                 <div className="flex justify-between items-start mb-2 gap-2">
                   <div>
                     <h4 className="font-bold text-slate-900 dark:text-white">{booking.title}</h4>
                     <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5"><strong>Espacio:</strong> {booking.spaces?.name || 'Espacio'}</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                       {booking.profiles ? (
                         <>
                           {booking.profiles.first_name} {booking.profiles.last_name} &lt;{booking.profiles.email}&gt;
                         </>
                       ) : 'Usuario registrado'}
                     </div>
                   </div>
                   <span className={`text-[10px] font-extrabold px-2.5 py-1 uppercase tracking-wider rounded-full border ${
                     booking.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40' :
                     booking.status === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40' :
                     booking.status === 'cancelled' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' :
                     'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                   }`}>
                     {booking.status === 'approved' ? 'Aprobada' : booking.status === 'rejected' ? 'Rechazada' : booking.status === 'pending' ? 'Pendiente' : booking.status}
                   </span>
                 </div>
                 
                 <div className="text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col gap-1">
                   <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Inicio: {formatDateTime(booking.start_time)}</span>
                   <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Fin: {formatDateTime(booking.end_time)}</span>
                 </div>

                 {booking.status === 'pending' && (
                   <div className="flex gap-2 mt-3 border-t border-slate-100 dark:border-white/5 pt-3">
                     <button onClick={() => handleUpdateBookingStatus(booking.id, 'approved')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">Aprobar Reserva</button>
                     <button onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-xl transition-colors">Rechazar</button>
                   </div>
                 )}
               </div>
             ))}
             {bookings.length === 0 && (
               <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-sm">No hay solicitudes de reserva registradas.</p>
             )}
          </div>
        </div>
      </div>

      {isSpaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold dark:text-white">{editingSpace ? 'Editar Espacio' : 'Nuevo Espacio'}</h2>
              <button onClick={() => setIsSpaceModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSpaceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 dark:text-slate-300">Nombre del Espacio *</label>
                <input type="text" required value={spaceFormData.name} onChange={e => setSpaceFormData({...spaceFormData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Ej. Aula 1, Templo Principal" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 dark:text-slate-300">Descripción</label>
                <textarea rows={2} value={spaceFormData.description || ''} onChange={e => setSpaceFormData({...spaceFormData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 dark:text-slate-300">Capacidad (Personas)</label>
                  <input type="number" value={spaceFormData.capacity || 0} onChange={e => setSpaceFormData({...spaceFormData, capacity: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 dark:text-slate-300">Estado</label>
                  <select value={spaceFormData.is_active ? 'true' : 'false'} onChange={e => setSpaceFormData({...spaceFormData, is_active: e.target.value === 'true'})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none">
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 dark:text-slate-300">Características (separadas por coma)</label>
                <input type="text" value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none" placeholder="Ej. Proyector, Aire Acondicionado, Sonido" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 dark:text-slate-300">Foto del Espacio</label>
                <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-slate-800 dark:file:text-slate-300" />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 -mx-6 -mb-6 p-4">
                <button type="button" onClick={() => setIsSpaceModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold text-sm">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md">
                  {editingSpace ? 'Guardar Cambios' : 'Crear Espacio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
