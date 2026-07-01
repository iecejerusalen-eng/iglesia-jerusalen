import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Space, SpaceBooking } from '../../types';
import { Users, Calendar, Clock, ArrowRight, Home } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../components/animations/AnimeWrappers';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Bookings() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myBookings, setMyBookings] = useState<SpaceBooking[]>([]);

  const loadData = useCallback(async () => {
    try {
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (spacesError) throw spacesError;
      setSpaces(spacesData || []);

      if (user) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('space_bookings')
          .select('*, spaces(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;
        setMyBookings(bookingsData || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar espacios');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  const handleOpenModal = (space: Space) => {
    if (!user) {
      toast.error('Debes iniciar sesión para reservar un espacio');
      return;
    }
    setSelectedSpace(space);
    setFormData({ title: '', description: '', date: '', start_time: '', end_time: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !user) return;
    
    // Validar hora
    if (formData.start_time >= formData.end_time) {
      return toast.error('La hora de inicio debe ser anterior a la de fin');
    }

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.start_time}`).toISOString();
      const endDateTime = new Date(`${formData.date}T${formData.end_time}`).toISOString();

      const { error } = await supabase.from('space_bookings').insert([{
        space_id: selectedSpace.id,
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        start_time: startDateTime,
        end_time: endDateTime,
        status: 'pending'
      }]);

      if (error) throw error;
      toast.success('Solicitud enviada correctamente. Espera confirmación.');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al solicitar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reservar Espacios | Iglesia Jerusalén</title>
      </Helmet>

      <div className="bg-surface dark:bg-slate-950 min-h-screen pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <AnimeFadeUp>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-4 uppercase tracking-widest border border-emerald-500/20">
                <Home className="w-4 h-4" /> Uso de Instalaciones
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">
                Reservar un Espacio
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Solicita el uso de aulas, templos y áreas comunes para tus reuniones, ensayos o eventos del ministerio.
              </p>
            </div>
          </AnimeFadeUp>

          {!user && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 text-center mb-10 max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-amber-800 dark:text-amber-400 font-medium">Inicia sesión para gestionar tus reservas.</p>
              <Link to="/login" className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold whitespace-nowrap">Ir a Login</Link>
            </div>
          )}

          {user && myBookings.length > 0 && (
            <div className="mb-16">
              <h3 className="text-2xl font-bold dark:text-white mb-6">Mis Solicitudes de Reserva</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBookings.map(booking => (
                  <div key={booking.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{booking.title}</h4>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                        booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        booking.status === 'cancelled' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.status === 'approved' ? 'Aprobada' : booking.status === 'rejected' ? 'Rechazada' : booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mb-3">{booking.spaces?.name}</div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(booking.start_time).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(booking.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-10 flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">
              Espacios Disponibles
            </h2>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          </div>

          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500" /></div>
          ) : (
            <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {spaces.map(space => (
                <AnimeHoverCard key={space.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all flex flex-col group">
                  <div className="h-48 overflow-hidden relative">
                    <img src={space.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'} alt={space.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                      <Users className="w-3.5 h-3.5" /> Cap. {space.capacity || 'N/A'}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{space.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{space.description}</p>
                    
                    {space.features && space.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {space.features.map(f => (
                          <span key={f} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <button onClick={() => handleOpenModal(space)} className="mt-auto w-full py-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-emerald-200 dark:border-emerald-800">
                      Solicitar Reserva <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </AnimeHoverCard>
              ))}
            </AnimeStaggerGrid>
          )}

        </div>
      </div>

      {isModalOpen && selectedSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">Reservar {selectedSpace.name}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Motivo de Reserva</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" placeholder="Ej. Ensayo Ministerio de Alabanza" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Detalles adicionales (opcional)</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Fecha</label>
                <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Hora de inicio</label>
                  <input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Hora de fin</label>
                  <input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">Enviar Solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
