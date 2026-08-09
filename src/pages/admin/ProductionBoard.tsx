import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import {
  Columns, Plus, Trash2, ArrowRight, ArrowLeft, RefreshCw, X,
  Layers, Hammer, Move, FileText
} from 'lucide-react';
import type { Ministry } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const ticketSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  ministry_id: z.string().min(1, 'Seleccione el ministerio solicitante'),
  material_type: z.string().min(1, 'Especifique el tipo de material'),
  dimensions: z.string().min(1, 'Especifique las dimensiones (ej: 100x150cm)'),
  machinery_required: z.string().min(1, 'Especifique la maquinaria requerida'),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done']),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface ProductionTicket {
  id: string;
  title: string;
  description: string;
  material_type: string;
  dimensions: string;
  machinery_required: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'done';
  ministry_id: string;
  created_at: string;
  ministries?: {
    name: string;
    theme_color: string;
  };
}

const COLUMNS = [
  { id: 'backlog', name: 'Reserva / Backlog', color: 'border-t-slate-500 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300' },
  { id: 'todo', name: 'Por Hacer', color: 'border-t-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
  { id: 'in_progress', name: 'En Progreso', color: 'border-t-amber-500 bg-amber-50/40 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { id: 'done', name: 'Completado', color: 'border-t-green-500 bg-green-50/40 dark:bg-green-950/40 text-green-700 dark:text-green-300' }
] as const;

const ProductionBoard = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const { role } = useAuthStore();
  const [tickets, setTickets] = useState<ProductionTicket[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = ['admin', 'multimedia', 'editor', 'secretary', 'pastor'].includes(role || '');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      ministry_id: '',
      material_type: 'madera MDF 3mm',
      dimensions: '',
      machinery_required: 'corte láser',
      status: 'todo',
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch production tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('production_tickets')
        .select('*, ministries(name, theme_color)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Fetch ministries for selection
      const { data: minData, error: minError } = await supabase
        .from('ministries')
        .select('*')
        .order('name');

      if (minError) throw minError;
      setMinistries(minData || []);
    } catch (err) {
      console.error('Error fetching production board data:', err);
      toast.error('Error al cargar datos de producción');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleCreateTicket = async (data: TicketFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('production_tickets')
        .insert({
          title: data.title,
          description: data.description || '',
          ministry_id: data.ministry_id,
          material_type: data.material_type,
          dimensions: data.dimensions,
          machinery_required: data.machinery_required,
          status: data.status,
        });

      if (error) throw error;

      toast.success('Ticket de producción creado correctamente');
      setShowModal(false);
      reset();
      fetchData();
    } catch (err) {
      console.error('Error creating production ticket:', err);
      toast.error('No se pudo crear el ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: 'backlog' | 'todo' | 'in_progress' | 'done') => {
    if (!canEdit) {
      toast.error('No tienes permisos para modificar el estado de los tickets.');
      return;
    }

    try {
      const { error } = await supabase
        .from('production_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Update state locally for fast UI response
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      toast.success('Estado del ticket actualizado');
    } catch (err) {
      console.error('Error updating ticket status:', err);
      toast.error('Error al actualizar estado');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!canEdit) return;
    const confirmed = await confirm({
      title: 'Eliminar ticket de producción',
      message: '¿Estás seguro de eliminar este ticket de producción?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('production_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.filter(t => t.id !== ticketId));
      toast.success('Ticket de producción eliminado');
    } catch (err) {
      console.error('Error deleting ticket:', err);
      toast.error('No se pudo eliminar el ticket');
    }
  };

  const moveTicket = (ticket: ProductionTicket, direction: 'left' | 'right') => {
    const colOrder = ['backlog', 'todo', 'in_progress', 'done'] as const;
    const currentIdx = colOrder.indexOf(ticket.status);
    let newIdx = currentIdx;

    if (direction === 'left' && currentIdx > 0) newIdx = currentIdx - 1;
    if (direction === 'right' && currentIdx < colOrder.length - 1) newIdx = currentIdx + 1;

    if (newIdx !== currentIdx) {
      handleUpdateStatus(ticket.id, colOrder[newIdx]);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 space-y-8">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Columns className="text-primary w-8 h-8" />
            Producción
          </h1>
          <p className="text-gray-500 dark:text-gray-450 text-sm">
            Control de materiales y requerimientos de producción gráfica.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 transition-colors shadow-sm cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw size={18} />
          </button>
          
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 cursor-pointer transition-all"
            >
              <Plus size={18} />
              Nuevo Ticket
            </button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
           {Array.from({length: 4}).map((_, i) => (
             <div key={i} className="rounded-2xl border-t-4 border-gray-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 p-4 h-[500px] animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-32 bg-gray-100 dark:bg-slate-800/50 rounded-xl"></div>
                  <div className="h-32 bg-gray-100 dark:bg-slate-800/50 rounded-xl"></div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((col, i) => {
            const colTickets = tickets.filter(t => t.status === col.id);

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={col.id} 
                className={`rounded-2xl border-t-4 border border-gray-150 dark:border-white/10 p-4 shadow-xl backdrop-blur-xl flex flex-col space-y-4 min-h-[600px] ${col.color}`}
              >
                {/* Column Title */}
                <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-white/10 pb-3">
                  <h3 className="font-bold text-sm tracking-wide">{col.name}</h3>
                  <span className="text-xs bg-white/60 dark:bg-black/40 border border-gray-200/50 dark:border-white/10 font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {colTickets.length}
                  </span>
                </div>

                {/* Tickets list */}
                <div className="space-y-4 overflow-y-auto max-h-[650px] pr-1 custom-scrollbar pb-10">
                    <AnimatePresence>
                      {colTickets.map((ticket) => (
                        <motion.div
                          layout
                          layoutId={ticket.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          key={ticket.id}
                          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-white/10 p-4 shadow-sm hover:shadow-xl transition-shadow space-y-3 relative group"
                        >
                          {/* Requester Ministry Tag */}
                          {ticket.ministries && (
                            <span 
                              className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm"
                              style={{ backgroundColor: ticket.ministries.theme_color || '#d97706' }}
                            >
                              {ticket.ministries.name}
                            </span>
                          )}

                          <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">{ticket.title}</h4>
                          {ticket.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-450 line-clamp-2 leading-relaxed">{ticket.description}</p>
                          )}

                          {/* Specs badges */}
                          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100/50 dark:border-white/5">
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-gray-50/80 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-white/5 px-2 py-1 rounded-md">
                              <Layers size={10} />
                              {ticket.material_type}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-gray-50/80 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-white/5 px-2 py-1 rounded-md">
                              <Move size={10} />
                              {ticket.dimensions}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-gray-50/80 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-white/5 px-2 py-1 rounded-md">
                              <Hammer size={10} />
                              {ticket.machinery_required}
                            </span>
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100/50 dark:border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1.5">
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => moveTicket(ticket, 'left')}
                                    disabled={col.id === 'backlog'}
                                    className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 disabled:opacity-30 cursor-pointer shadow-sm bg-gray-50 dark:bg-black/20"
                                    title="Mover a la izquierda"
                                  >
                                    <ArrowLeft size={12} />
                                  </button>
                                  <button
                                    onClick={() => moveTicket(ticket, 'right')}
                                    disabled={col.id === 'done'}
                                    className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 disabled:opacity-30 cursor-pointer shadow-sm bg-gray-50 dark:bg-black/20"
                                    title="Mover a la derecha"
                                  >
                                    <ArrowRight size={12} />
                                  </button>
                                </>
                              )}
                            </div>

                            {canEdit && (
                              <button
                                onClick={() => handleDeleteTicket(ticket.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                title="Eliminar ticket"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                  {colTickets.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 border border-dashed border-gray-300 dark:border-white/20 rounded-xl bg-white/20 dark:bg-black/10 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider"
                    >
                      No hay tickets
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 md:p-8 w-full max-w-lg shadow-2xl z-10 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-gray-150 dark:border-white/10 pb-4">
                <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="text-primary" />
                  Nuevo Ticket de Producción
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreateTicket)} className="space-y-5">
                {/* Solicitante */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Ministerio Solicitante</label>
                  <select
                    {...register('ministry_id')}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">Selecciona un ministerio...</option>
                    {ministries.map(min => (
                      <option key={min.id} value={min.id}>{min.name}</option>
                    ))}
                  </select>
                  {errors.ministry_id && <p className="text-[11px] text-red-500 font-semibold">{errors.ministry_id.message}</p>}
                </div>

                {/* Titulo */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Título del Trabajo</label>
                  <input
                    type="text"
                    {...register('title')}
                    placeholder="Ej: Letrero acrílico para recepción, Banner del campamento"
                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {errors.title && <p className="text-[11px] text-red-500 font-semibold">{errors.title.message}</p>}
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Descripción / Detalles</label>
                  <textarea
                    rows={3}
                    {...register('description')}
                    placeholder="Instrucciones especiales, colores, acabados..."
                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all custom-scrollbar"
                  />
                </div>

                {/* Material & Dimensiones */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Material</label>
                    <select
                      {...register('material_type')}
                      className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="madera MDF 3mm">Madera MDF 3mm</option>
                      <option value="madera MDF 6mm">Madera MDF 6mm</option>
                      <option value="acrílico transparente 3mm">Acrílico Transp. 3mm</option>
                      <option value="acrílico color 3mm">Acrílico Color 3mm</option>
                      <option value="vinil adhesivo">Vinil Adhesivo</option>
                      <option value="vinil textil">Vinil Textil</option>
                      <option value="lona banner">Lona Banner</option>
                      <option value="papel fotográfico">Papel Fotográfico</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Medidas</label>
                    <input
                      type="text"
                      {...register('dimensions')}
                      placeholder="Ej: 100x150cm"
                      className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    {errors.dimensions && <p className="text-[11px] text-red-500 font-semibold">{errors.dimensions.message}</p>}
                  </div>
                </div>

                {/* Maquinaria & Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Maquinaria Requerida</label>
                    <select
                      {...register('machinery_required')}
                      className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="corte láser">Corte Láser</option>
                      <option value="plotter de corte">Plotter de Corte</option>
                      <option value="plotter de impresión">Plotter de Impresión</option>
                      <option value="ruteadora CNC">Ruteadora CNC</option>
                      <option value="impresión 3D">Impresión 3D</option>
                      <option value="ninguna">Ninguna</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Estado Inicial</label>
                    <select
                      {...register('status')}
                      className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="backlog">Reserva / Backlog</option>
                      <option value="todo">Por Hacer</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="done">Completado</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-150 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 font-bold rounded-xl text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Guardando...' : 'Crear Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProductionBoard;
