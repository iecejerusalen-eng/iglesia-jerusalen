import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { ArrowLeft, Users, Calendar, Clock, FileText, Settings, ShieldAlert, Loader2 } from 'lucide-react';
import type { Ministry } from '../../types';
import MinistryMembers from '../../components/admin/ministry/MinistryMembers';
import SmartScheduler from '../../components/admin/ministry/SmartScheduler';
import MeetingNotes from '../../components/admin/ministry/MeetingNotes';
import MinistryCalendar from '../../components/admin/ministry/MinistryCalendar';

export default function MinistryDashboard() {
  const { id } = useParams();
  const { role, ministryId } = useAuthStore();
  const { hasPermission, isReadOnly } = usePermissions();

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detalles');

  useEffect(() => {
    fetchMinistry();
  }, [id]);

  const fetchMinistry = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setMinistry(data);
    } catch (err) {
      console.error('Error fetching ministry:', err);
    } finally {
      setLoading(false);
    }
  };

  const isGlobalReadOnly = isReadOnly('ministries');
  const canEdit = role === 'admin' || (role === 'leader' && id === ministryId) || (role !== 'leader' && !isGlobalReadOnly && hasPermission('ministries', 'edit'));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 dark:border-white/10">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ministerio no encontrado</h2>
        <Link to="/admin/ministerios" className="text-primary hover:underline mt-2 inline-block">Volver</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'detalles', label: 'Información General', icon: Settings },
    { id: 'miembros', label: 'Miembros', icon: Users },
    { id: 'calendario', label: 'Calendario Interno', icon: Calendar },
    { id: 'planificador', label: 'Planificador de Reuniones', icon: Clock },
    { id: 'actas', label: 'Actas', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/ministerios" className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-450 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {ministry.name}
            {!canEdit && <span className="bg-gray-100 text-gray-500 dark:text-gray-450 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-semibold border border-gray-200 dark:border-white/10">Solo Lectura</span>}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-450">Panel de control del ministerio/departamento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-150 dark:border-white/10 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'detalles' && (
            <div className="text-gray-600 dark:text-gray-400">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Detalles del Ministerio</h3>
              <p>Aquí se mostraría la vista de edición o detalles generales del ministerio.</p>
              {/* Could embed the MinistryManager form or a summary here */}
            </div>
          )}

          {activeTab === 'miembros' && (
            <MinistryMembers ministryId={ministry.id} />
          )}

          {activeTab === 'calendario' && (
            <MinistryCalendar ministryId={ministry.id} />
          )}

          {activeTab === 'planificador' && (
            <SmartScheduler ministryId={ministry.id} />
          )}

          {activeTab === 'actas' && (
            <MeetingNotes ministryId={ministry.id} />
          )}
        </div>
      </div>
    </div>
  );
}
