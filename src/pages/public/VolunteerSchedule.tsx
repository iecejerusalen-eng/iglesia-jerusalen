import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { VolunteerShift, VolunteerAssignment } from '../../types';
import { Calendar, Clock, CheckCircle2, Shield, Heart } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function VolunteerSchedule() {
  const { user, member } = useAuth();
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);
  const [myAssignments, setMyAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Cargar todos los turnos futuros
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select(`
          *,
          ministries ( name, theme_color )
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (shiftsError) throw shiftsError;
      setShifts(shiftsData || []);

      // Si está logueado y tiene member_id, cargar sus asignaciones
      if (member?.id) {
        const { data: assignData, error: assignError } = await supabase
          .from('volunteer_assignments')
          .select('*')
          .eq('member_id', member.id);

        if (assignError) throw assignError;
        setMyAssignments(assignData || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar horarios de voluntariado');
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  const handleRegister = async (shiftId: string) => {
    if (!user) return toast.error('Debes iniciar sesión para anotarte.');
    if (!member?.id) return toast.error('No se ha encontrado tu perfil de miembro. Contacta a un administrador.');

    try {
      const { error } = await supabase
        .from('volunteer_assignments')
        .insert([{ shift_id: shiftId, member_id: member.id, status: 'pending' }]);

      if (error) {
        if (error.code === '23505') return toast.error('Ya estás registrado en este turno.');
        throw error;
      }
      
      toast.success('Te has registrado correctamente. Espera la confirmación.');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar turno');
    }
  };

  const handleCancel = async (assignmentId: string) => {
    if (!confirm('¿Estás seguro de cancelar tu participación?')) return;
    try {
      const { error } = await supabase
        .from('volunteer_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      toast.success('Participación cancelada');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al cancelar');
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  return (
    <>
      <Helmet>
        <title>Mi Horario de Servicio | Iglesia Jerusalén</title>
      </Helmet>

      <div className="bg-surface dark:bg-slate-950 min-h-screen pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <AnimeFadeUp>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-4 uppercase tracking-widest border border-indigo-500/20">
                <Heart className="w-4 h-4" /> Servir a Dios
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">
                Horarios de Voluntariado
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Encuentra oportunidades para servir y formar parte de nuestros equipos de trabajo.
              </p>
            </div>
          </AnimeFadeUp>

          {!user ? (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center max-w-2xl mx-auto">
              <Shield className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold dark:text-white mb-2">Inicia Sesión para Servir</h2>
              <p className="text-slate-500 mb-6">Necesitas una cuenta para registrarte en los turnos de voluntariado.</p>
              <Link to="/login" className="inline-block bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                Iniciar Sesión
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista de Turnos Disponibles */}
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-indigo-500" /> Próximos Turnos
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" /></div>
                ) : shifts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500">No hay turnos programados en este momento.</p>
                  </div>
                ) : (
                  <AnimeStaggerGrid className="space-y-4">
                    {shifts.map(shift => {
                      const isRegistered = myAssignments.some(a => a.shift_id === shift.id);
                      return (
                        <div key={shift.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-indigo-500/30 transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-500 uppercase">{formatDate(shift.start_time)}</span>
                              {shift.ministries && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${shift.ministries.theme_color}20`, color: shift.ministries.theme_color }}>
                                  {shift.ministries.name}
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{shift.title}</h4>
                            <p className="text-sm text-slate-500 mb-3">{shift.description}</p>
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
                            </div>
                          </div>
                          
                          <div className="w-full md:w-auto text-right">
                            {isRegistered ? (
                              <button disabled className="w-full md:w-auto bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Anotado
                              </button>
                            ) : (
                              <button onClick={() => handleRegister(shift.id)} className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-bold transition-colors">
                                Anotarme
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </AnimeStaggerGrid>
                )}
              </div>

              {/* Mis Asignaciones (Sidebar) */}
              <div>
                <div className="bg-indigo-50 dark:bg-slate-900 rounded-3xl p-6 border border-indigo-100 dark:border-slate-800 sticky top-24">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Mis Turnos</h3>
                  
                  {myAssignments.length === 0 ? (
                    <p className="text-sm text-slate-500">Aún no te has registrado en ningún turno.</p>
                  ) : (
                    <div className="space-y-4">
                      {myAssignments.map(assignment => {
                        const shift = shifts.find(s => s.id === assignment.shift_id);
                        if (!shift) return null;
                        
                        return (
                          <div key={assignment.id} className="bg-white dark:bg-slate-950 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800/50">
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{shift.title}</h5>
                            <div className="text-xs text-slate-500 mt-1 mb-3">
                              {formatDate(shift.start_time)} • {formatTime(shift.start_time)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                                assignment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                assignment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {assignment.status === 'pending' ? 'Pendiente' : 'Confirmado'}
                              </span>
                              
                              <button onClick={() => handleCancel(assignment.id)} className="text-[10px] text-red-500 font-bold hover:underline">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
