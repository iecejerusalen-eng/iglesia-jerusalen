import { Users, Heart, Activity, Layers } from 'lucide-react';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import type { DashboardStats as StatsType } from '../types';

interface DashboardStatsProps {
  stats: StatsType;
  loading: boolean;
}

export const DashboardStats = ({ stats, loading }: DashboardStatsProps) => {
  return (
    <AnimeStaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={80} duration={600}>
      {/* Total Members CRM */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:-translate-y-1.5 hover:shadow-lg hover:border-gold/45 transition-all duration-300 flex items-center gap-4 group cursor-default relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="w-12 h-12 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Users size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Membresía CRM</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
              <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{stats.membersCount}</span>
              <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Líderes activos: {stats.leadersCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Donaciones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:-translate-y-1.5 hover:shadow-lg hover:border-gold/45 transition-all duration-300 flex items-center gap-4 group cursor-default relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="w-12 h-12 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 text-gold dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Heart size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Finanzas Totales</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
              <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">${stats.totalDonationsAmount.toLocaleString('es-EC', { maximumFractionDigits: 0 })}</span>
              <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Donaciones registradas</span>
            </div>
          )}
        </div>
      </div>

      {/* Peticiones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:-translate-y-1.5 hover:shadow-lg hover:border-gold/45 transition-all duration-300 flex items-center gap-4 group cursor-default relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="w-12 h-12 rounded-2xl bg-rose-50/70 dark:bg-red-950/20 text-accent-red dark:text-red-400 border border-rose-100 dark:border-red-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Activity size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Peticiones Oración</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
              <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{stats.petitionsCount}</span>
              <span className="text-[9px] text-accent-red block font-bold mt-0.5">Pendientes de oración: {stats.pendingPetitions}</span>
            </div>
          )}
        </div>
      </div>

      {/* Patrimonio e Inventario */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-5 shadow-2xs hover:-translate-y-1.5 hover:shadow-lg hover:border-gold/45 transition-all duration-300 flex items-center gap-4 group cursor-default relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="w-12 h-12 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 text-accent-purple dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Layers size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Activos e Inventario</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
              <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">{stats.inventoryCount} uds</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-bold mt-0.5">Valor estimado: ${stats.inventoryValue.toLocaleString('es-EC', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>
      </div>
    </AnimeStaggerGrid>
  );
};
