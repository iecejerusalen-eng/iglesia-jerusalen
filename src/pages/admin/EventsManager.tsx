import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { useConfirmStore } from '../../store/useConfirmStore';
import AdminHeader from '../../components/admin/AdminHeader';
import { Plus, LayoutGrid, List, Calendar as CalendarIcon, Search, Filter, FileDown } from 'lucide-react';
import type { Event as DbEvent, Profile } from '../../types';

// Feature Components
import EventFormModal from '../../features/events/components/EventFormModal';
import EventsTable from '../../features/events/components/EventsTable';
import EventsGrid from '../../features/events/components/EventsGrid';
import EventsCalendar from '../../features/events/components/calendar/EventsCalendar';
import CalendarPdfDialog from '../../components/common/CalendarPdfDialog';
import { exportEventsPdf } from '../../utils/calendarPdfExport';

type MainViewMode = 'table' | 'grid' | 'calendar';

const EventsManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const { user, role, roles } = useAuthStore();
  const userRoles = roles || (role ? [role] : []);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [ministries, setMinistries] = useState<{ id: string; name: string }[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null);
  const [viewMode, setViewMode] = useState<MainViewMode>('calendar');
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  // For pre-filling form from Calendar
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [initialStartTime, setInitialStartTime] = useState<string | undefined>(undefined);
  const [initialEndTime, setInitialEndTime] = useState<string | undefined>(undefined);
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMinistry, setFilterMinistry] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) setUserProfile(profile);
      }

      const { data: minData } = await supabase
        .from('ministries')
        .select('id, name');
      setMinistries(minData || []);

      await fetchEvents();
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const query = supabase.from('events').select('*, ministries(name, slug)');
      const { data, error } = await query.order('start_date', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err: unknown) {
      console.error('Error fetching events:', err);
      toast.error('Error al cargar eventos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setInitialDate(undefined);
    setInitialStartTime(undefined);
    setInitialEndTime(undefined);
    setShowForm(true);
  };

  const handleCalendarCreate = (date: string, startTime?: string, endTime?: string) => {
    setEditingEvent(null);
    setInitialDate(date);
    setInitialStartTime(startTime);
    setInitialEndTime(endTime);
    setShowForm(true);
  };

  const handleOpenEdit = (event: DbEvent) => {
    setEditingEvent(event);
    setInitialDate(undefined);
    setInitialStartTime(undefined);
    setInitialEndTime(undefined);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar evento',
      message: '¿Estás seguro de eliminar este evento?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Evento eliminado con éxito.');
      fetchEvents();
    } catch (err: unknown) {
      console.error('Error deleting event:', err);
      toast.error('No se pudo eliminar el evento: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setActionLoading(false);
    }
  };

  const visibleEvents = events.filter(e => {
    // Permission filter
    if (userRoles.includes('leader') && userProfile?.ministry_id) {
      if (e.ministry_id !== userProfile.ministry_id) return false;
    }

    // Ministry filter
    if (filterMinistry !== 'all' && e.ministry_id !== filterMinistry) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (filterStatus === 'upcoming' && e.start_date < today) return false;
      if (filterStatus === 'past' && e.start_date >= today) return false;
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(query);
      const matchDesc = e.description?.toLowerCase().includes(query) || false;
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  const handleExportPdf = (orientation: 'portrait' | 'landscape') => {
    const filterLabel = filterStatus !== 'all' 
      ? (filterStatus === 'upcoming' ? 'Próximos' : 'Pasados') 
      : (filterMinistry !== 'all' ? ministries.find(m => m.id === filterMinistry)?.name : 'Todos');
      
    exportEventsPdf(visibleEvents, {
      viewMode,
      orientation,
      filterLabel
    });
  };

  return (
    <AnimeFadeUp className="space-y-6 max-w-7xl mx-auto">
      <AdminHeader 
        title="Gestor de Eventos" 
        description="Publica, edita y organiza los cultos y actividades especiales en el calendario interactivo."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toolbar */}
            <div className="flex bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-1 shadow-sm overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'}`}
                title="Vista Calendario"
              >
                <CalendarIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'}`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'}`}
                title="Vista Lista"
              >
                <List size={18} />
              </button>
            </div>

            <button
              onClick={() => setShowPdfDialog(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-white/10"
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            
            <button
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
          </div>
        }
      />

      {/* Advanced Search and Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar eventos por título o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-white"
          />
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-gray-400 hidden sm:block" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'upcoming' | 'past')}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-700 dark:text-gray-300 font-medium"
            >
              <option value="all">Todos los estados</option>
              <option value="upcoming">Próximos</option>
              <option value="past">Pasados</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto">
            <select
              value={filterMinistry}
              onChange={(e) => setFilterMinistry(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-700 dark:text-gray-300 font-medium"
            >
              <option value="all">Todos los ministerios</option>
              {ministries.map(min => (
                <option key={min.id} value={min.id}>{min.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Views Container */}
      <div className="mt-6">
        {viewMode === 'calendar' && (
          <EventsCalendar
            events={visibleEvents}
            onCreateEvent={handleCalendarCreate}
            onEditEvent={handleOpenEdit}
          />
        )}

        {viewMode === 'grid' && (
          <EventsGrid
            events={visibleEvents}
            loading={loading}
            actionLoading={actionLoading}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        )}

        {viewMode === 'table' && (
          <EventsTable
            events={visibleEvents}
            loading={loading}
            actionLoading={actionLoading}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <EventFormModal
          editingEvent={editingEvent}
          initialDate={initialDate}
          initialStartTime={initialStartTime}
          initialEndTime={initialEndTime}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchEvents();
          }}
          userRoles={userRoles}
          userProfile={userProfile}
          ministries={ministries}
        />
      )}

      {/* PDF Export Dialog */}
      {showPdfDialog && (
        <CalendarPdfDialog
          title="Exportar Eventos"
          onClose={() => setShowPdfDialog(false)}
          onExport={handleExportPdf}
        />
      )}
    </AnimeFadeUp>
  );
};

export default EventsManager;
