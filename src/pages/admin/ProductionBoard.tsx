import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
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
  { id: 'backlog', name: 'Reserva / Backlog', color: 'border-t-slate-500 bg-slate-50/50' },
  { id: 'todo', name: 'Por Hacer', color: 'border-t-blue-500 bg-blue-50/30' },
  { id: 'in_progress', name: 'En Progreso', color: 'border-t-amber-500 bg-amber-50/30' },
  { id: 'done', name: 'Completado', color: 'border-t-green-500 bg-green-50/30' }
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
        .order('created_at', { ascending: false });

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
    fetchData();
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-800 flex items-center gap-2">
            <Columns className="text-primary" />
            Logística de Producción (Kanban)
          </h1>
          <p className="text-gray-500 text-sm">
            Control de materiales y requerimientos de producción gráfica para los ministerios de la iglesia.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw size={18} />
          </button>
          
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus size={18} />
              Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-40">
          <RefreshCw className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter(t => t.status === col.id);

            return (
              <div 
                key={col.id} 
                className={`rounded-2xl border-t-4 border border-gray-150 p-4 shadow-sm flex flex-col space-y-4 min-h-[500px] ${col.color}`}
              >
                {/* Column Title */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h3 className="font-bold text-sm text-gray-750">{col.name}</h3>
                  <span className="text-xs bg-white border border-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                    {colTickets.length}
                  </span>
                </div>

                {/* Tickets list */}
                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                  <AnimatePresence mode="popLayout">
                    {colTickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                      >
                        {/* Requester Ministry Tag */}
                        {ticket.ministries && (
                          <span 
                            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: ticket.ministries.theme_color || '#d97706' }}
                          >
                            {ticket.ministries.name}
                          </span>
                        )}

                        <h4 className="font-bold text-gray-800 text-sm leading-snug">{ticket.title}</h4>
                        {ticket.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ticket.description}</p>
                        )}

                        {/* Specs badges */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Layers size={10} />
                            {ticket.material_type}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Move size={10} />
                            {ticket.dimensions}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Hammer size={10} />
                            {ticket.machinery_required}
                          </span>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
                          <div className="flex gap-1.5">
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => moveTicket(ticket, 'left')}
                                  disabled={col.id === 'backlog'}
                                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-slate-50 text-gray-500 disabled:opacity-30 cursor-pointer"
                                  title="Mover a la izquierda"
                                >
                                  <ArrowLeft size={12} />
                                </button>
                                <button
                                  onClick={() => moveTicket(ticket, 'right')}
                                  disabled={col.id === 'done'}
                                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-slate-50 text-gray-500 disabled:opacity-30 cursor-pointer"
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
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar ticket"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {colTickets.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-white/50 text-gray-400 text-xs">
                      No hay tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowModal(false)}></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-gray-200 p-6 md:p-8 w-full max-w-lg shadow-2xl z-10 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-gray-150 pb-4">
                <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-primary" />
                  Nuevo Ticket de Producción
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreateTicket)} className="space-y-4">
                {/* Solicitante */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Ministerio Solicitante</label>
                  <select
                    {...register('ministry_id')}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Título del Trabajo</label>
                  <input
                    type="text"
                    {...register('title')}
                    placeholder="Ej: Letrero acrílico para recepción, Banner del campamento"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {errors.title && <p className="text-[11px] text-red-500 font-semibold">{errors.title.message}</p>}
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Descripción / Detalles</label>
                  <textarea
                    rows={3}
                    {...register('description')}
                    placeholder="Instrucciones especiales, colores, acabados..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Material & Dimensiones */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Material</label>
                    <select
                      {...register('material_type')}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Medidas</label>
                    <input
                      type="text"
                      {...register('dimensions')}
                      placeholder="Ej: 100x150cm"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    {errors.dimensions && <p className="text-[11px] text-red-500 font-semibold">{errors.dimensions.message}</p>}
                  </div>
                </div>

                {/* Maquinaria & Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Maquinaria Requerida</label>
                    <select
                      {...register('machinery_required')}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Estado Inicial</label>
                    <select
                      {...register('status')}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="backlog">Reserva / Backlog</option>
                      <option value="todo">Por Hacer</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="done">Completado</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 font-bold rounded-xl text-gray-600 text-sm cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm shadow-md cursor-pointer transition-all disabled:opacity-50"
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
