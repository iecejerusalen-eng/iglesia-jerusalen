import { BarChart3, RefreshCw, Sparkles } from 'lucide-react';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { toast } from 'sonner';

interface AnalyticsHeaderProps {
  dateFilter: string;
  setDateFilter: (filter: 'all' | '30days' | '90days' | 'thisyear') => void;
  onReset: () => void;
  onRefresh: () => void;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'builder' | 'forms') => void;
  widgetCount: number;
}

export function AnalyticsHeader({
  dateFilter,
  setDateFilter,
  onReset,
  onRefresh,
  loading,
  activeTab,
  setActiveTab,
  widgetCount
}: AnalyticsHeaderProps) {
  const confirm = useConfirmStore((state) => state.confirm);

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Restablecer paneles',
      message: '¿Estás seguro de restablecer todos los paneles al estado predeterminado? Se perderán los reportes personalizados que hayas guardado.',
      confirmText: 'Restablecer',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmed) return;
    onReset();
    toast.success('Paneles restablecidos a los 8 predeterminados.');
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-150 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary dark:text-church-gold-bright flex items-center gap-2">
            <BarChart3 className="text-gold" />
            Consola Inteligente de Analíticas (BI)
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Plataforma interactiva de Business Intelligence. Construye reportes, analiza datos y consulta al Asistente Inteligente.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                toast.success('Filtro temporal aplicado globalmente.');
              }}
              className="px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer shadow-xs focus:outline-none"
            >
              <option value="all">Todos los tiempos</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="thisyear">Este año ({new Date().getFullYear()})</option>
            </select>
          </div>

          <button
            onClick={handleReset}
            className="p-2.5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-gray-450 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
            title="Restablecer paneles predeterminados"
          >
            <RefreshCw size={14} className="text-amber-500" />
            Restablecer Paneles
          </button>

          <button
            onClick={onRefresh}
            className="p-2.5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-gray-450 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar Datos
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-white text-primary shadow-xs dark:bg-slate-800 dark:text-church-gold-bright'
              : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Panel Personalizado ({widgetCount})
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'builder'
              ? 'bg-white text-primary shadow-xs dark:bg-slate-800 dark:text-church-gold-bright'
              : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Sparkles size={12} className="text-gold" />
          Constructor y Asistente Inteligente
        </button>
        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'forms'
              ? 'bg-white text-primary shadow-xs dark:bg-slate-800 dark:text-church-gold-bright'
              : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Respuestas de Cuestionarios
        </button>
      </div>
    </>
  );
}
