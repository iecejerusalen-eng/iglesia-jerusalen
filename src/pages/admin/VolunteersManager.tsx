import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { VolunteerShift, VolunteerAssignment, Ministry } from '../../types';
import { Shield, Plus, Calendar, Users, Trash2, CheckCircle2, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const SERVICE_TEMPLATES: Array<Pick<VolunteerShift, 'title' | 'description' | 'category' | 'effort_level' | 'skills_needed' | 'required_volunteers'>> = [
  { title: 'Equipo de cocina y refrigerio', description: 'Preparar, servir y dejar en orden el área de alimentos.', category: 'cocina', effort_level: 'moderado', skills_needed: ['Cocina', 'Hospitalidad'], required_volunteers: 4 },
  { title: 'Jornada de limpieza', description: 'Limpieza y organización de las áreas comunes de la iglesia.', category: 'limpieza', effort_level: 'moderado', skills_needed: ['Orden', 'Limpieza'], required_volunteers: 6 },
  { title: 'Mantenimiento eléctrico', description: 'Revisión segura de luminarias, conexiones y necesidades eléctricas.', category: 'mantenimiento', effort_level: 'fisico', skills_needed: ['Electricidad'], required_volunteers: 2 },
  { title: 'Pintura y renovación de espacios', description: 'Preparar superficies, pintar y ordenar los materiales al finalizar.', category: 'pintura', effort_level: 'fisico', skills_needed: ['Pintura', 'Mantenimiento'], required_volunteers: 5 },
];

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
    ministry_id: '',
    category: 'general',
    effort_level: 'moderado',
    skills_needed: [],
    location: '',
    is_published: true,
  });

  const loadData = async () => {
    try {
      const [shiftsRes, assignRes, minRes] = await Promise.all([
        supabase.from('volunteer_shifts').select('*, ministries(name)').order('start_time', { ascending: false }).limit(50),
        supabase.from('volunteer_assignments').select('*, members(first_name, last_name)').order('created_at', { ascending: false }).limit(100),
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
    Promise.resolve().then(() => loadData());
  }, []);

  const handleOpenModal = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      required_volunteers: 1,
      ministry_id: '',
      category: 'general',
      effort_level: 'moderado',
      skills_needed: [],
      location: '',
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenTemplate = (template: typeof SERVICE_TEMPLATES[number]) => {
    setFormData({
      ...template,
      start_time: '',
      end_time: '',
      ministry_id: '',
      location: '',
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time || !formData.end_time) {
      return toast.error('Completa los campos requeridos');
    }

    try {
      const startTimeIso = new Date(formData.start_time).toISOString();
      const endTimeIso = new Date(formData.end_time).toISOString();

      const { error } = await supabase.from('volunteer_shifts').insert([{
        ...formData,
        start_time: startTimeIso,
        end_time: endTimeIso,
        ministry_id: formData.ministry_id || null
      }]);
      
      if (error) {
        console.error('Error al insertar turno de voluntariado:', error);
        throw error;
      }

      toast.success('Turno creado con éxito');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ? `Error al crear turno: ${err.message}` : 'Error al crear turno');
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-500" /> Voluntariado
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Gestiona los turnos y asignaciones de servicio.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Crear Turno
        </button>
      </motion.div>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/15 dark:bg-indigo-500/10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="lg:w-64"><p className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Necesidades frecuentes</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Crea una oportunidad completa en menos pasos.</p></div>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
            {SERVICE_TEMPLATES.map((template) => <button key={template.title} type="button" onClick={() => handleOpenTemplate(template)} className="shrink-0 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{template.title}</button>)}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Turnos */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px]"
        >
          <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800/50">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Turnos Programados
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {loading ? (
              // SKELETON LOADER
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div className="w-6 h-6 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
                  <div className="h-24 bg-gray-100 dark:bg-slate-950 rounded-lg"></div>
                </div>
              ))
            ) : shifts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay turnos programados.</p>
            ) : (
              <AnimatePresence>
                {shifts.map((shift, i) => {
                  const shiftAssignments = assignments.filter(a => a.shift_id === shift.id);
                  const confirmedCount = shiftAssignments.filter(a => a.status === 'confirmed').length;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={shift.id} 
                      className="border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{shift.title}</h3>
                        <button onClick={() => handleDeleteShift(shift.id)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1 mb-3">
                        <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5 text-indigo-500" /> {formatDateTime(shift.start_time)} - {new Date(shift.end_time).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                        {shift.ministries && <span className="text-indigo-500 font-bold ml-5">{shift.ministries.name}</span>}
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-slate-950 rounded-lg p-3 border border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center text-[10px] font-bold mb-2 uppercase tracking-wider">
                          <span className="text-gray-500 dark:text-gray-400">Voluntarios</span>
                          <span className={`px-2 py-0.5 rounded-full ${confirmedCount >= shift.required_volunteers ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {confirmedCount} / {shift.required_volunteers}
                          </span>
                        </div>
                        {shiftAssignments.length > 0 ? (
                          <div className="space-y-2 mt-2">
                            {shiftAssignments.map(a => (
                              <div key={a.id} className="flex items-center justify-between text-sm bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 p-2 rounded-md shadow-xs">
                                <span className="dark:text-gray-200 font-medium">{a.members?.first_name} {a.members?.last_name}</span>
                                <div className="flex items-center gap-1">
                                  {a.status === 'pending' && (
                                    <>
                                      <button onClick={() => handleUpdateAssignmentStatus(a.id, 'confirmed')} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded-md transition-colors cursor-pointer"><CheckCircle2 className="w-4 h-4" /></button>
                                      <button onClick={() => handleUpdateAssignmentStatus(a.id, 'cancelled')} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                  )}
                                  {a.status === 'confirmed' && <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 px-2 py-1 rounded-md uppercase">Confirmado</span>}
                                  {a.status === 'cancelled' && <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 px-2 py-1 rounded-md uppercase">Cancelado</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-2 italic">Aún no hay voluntarios asignados</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Solicitudes Recientes */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden h-[600px] flex flex-col"
        >
          <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800/50">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Solicitudes Pendientes
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {loading ? (
                // SKELETON LOADER
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3 mb-4"></div>
                    <div className="flex gap-2">
                       <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded flex-1"></div>
                       <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded flex-1"></div>
                    </div>
                  </div>
                ))
             ) : assignments.filter(a => a.status === 'pending').map((a, i) => {
               const shift = shifts.find(s => s.id === a.shift_id);
               return (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.05 }}
                   key={a.id} 
                   className="border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl p-4 shadow-sm"
                 >
                   <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                     {a.members?.first_name} {a.members?.last_name}
                   </div>
                   <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 font-medium">Solicita servir en: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{shift?.title}</span></div>
                   <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{shift ? formatDateTime(shift.start_time) : ''}</div>
                   
                   <div className="flex gap-2 mt-4">
                     <button onClick={() => handleUpdateAssignmentStatus(a.id, 'confirmed')} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg shadow-sm transition-colors cursor-pointer">Aprobar</button>
                     <button onClick={() => handleUpdateAssignmentStatus(a.id, 'cancelled')} className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 rounded-lg shadow-sm transition-colors cursor-pointer">Rechazar</button>
                   </div>
                 </motion.div>
               );
             })}
             {!loading && assignments.filter(a => a.status === 'pending').length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3 opacity-60">
                 <CheckCircle2 className="w-12 h-12" />
                 <p className="text-sm">Todo al día.<br/>No hay solicitudes pendientes.</p>
               </div>
             )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-white/10 shadow-2xl z-10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-t-2xl">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Shield className="text-indigo-500 w-5 h-5" />
                  Nuevo Turno
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Título</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white outline-none transition-all" placeholder="Ej. Ujieres Culto Dominical" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Qué se hará</label>
                  <textarea required rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full resize-none bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white outline-none transition-all" placeholder="Explica la tarea, el resultado esperado y cómo estará acompañado el equipo." />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Categoría</label>
                    <select value={formData.category || 'general'} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 dark:text-white outline-none"><option value="general">Servicio general</option><option value="cocina">Cocina</option><option value="limpieza">Limpieza</option><option value="mantenimiento">Mantenimiento</option><option value="pintura">Pintura</option><option value="ninos">Niños</option><option value="medios">Medios</option><option value="bienvenida">Bienvenida</option></select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Esfuerzo</label>
                    <select value={formData.effort_level || 'moderado'} onChange={e => setFormData({...formData, effort_level: e.target.value as VolunteerShift['effort_level']})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 dark:text-white outline-none"><option value="ligero">Ligero</option><option value="moderado">Moderado</option><option value="fisico">Físico</option></select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Lugar</label>
                    <input value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 dark:text-white outline-none" placeholder="Ej. Cocina" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Habilidades útiles <span className="font-normal normal-case">(separadas por coma)</span></label>
                  <input value={(formData.skills_needed || []).join(', ')} onChange={e => setFormData({...formData, skills_needed: e.target.value.split(',').map(item => item.trim()).filter(Boolean)})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 dark:text-white outline-none" placeholder="Electricidad, pintura, cocina, organización…" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Ministerio (Opcional)</label>
                  <select value={formData.ministry_id || ''} onChange={e => setFormData({...formData, ministry_id: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white outline-none transition-all">
                    <option value="">Selecciona un ministerio</option>
                    {ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Inicio</label>
                    <input type="datetime-local" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Fin</label>
                    <input type="datetime-local" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white outline-none transition-all text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Voluntarios Requeridos</label>
                  <input type="number" min="1" required value={formData.required_volunteers} onChange={e => setFormData({...formData, required_volunteers: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white outline-none transition-all" />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer">Guardar Turno</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
