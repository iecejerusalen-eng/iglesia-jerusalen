import { Users, Heart, Activity, Layers } from 'lucide-react';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import { NumberTicker } from '../../../components/ui/magicui/number-ticker';
import { BorderBeam } from '../../../components/ui/magicui/border-beam';
import type { DashboardAccess, DashboardStats as StatsType } from '../types';

interface DashboardStatsProps {
  stats: StatsType;
  loading: boolean;
  access: DashboardAccess;
}

export const DashboardStats = ({ stats, loading, access }: DashboardStatsProps) => {
  const visibleCount = Object.values(access).filter(Boolean).length;
  if (visibleCount === 0) return null;
  const currencyFormatter = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <AnimeStaggerGrid className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4" staggerDelay={80} duration={600}>
      {/* Total Members CRM */}
      {access.members && (
      <div className="group relative flex min-w-0 cursor-default flex-col items-start gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-3.5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.6)] backdrop-blur-2xl transition-all duration-300 hover:border-blue-300/70 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/65 sm:flex-row sm:items-center sm:p-5 lg:hover:-translate-y-1">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/70 text-primary transition-transform duration-300 group-hover:scale-105 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-church-gold-bright sm:size-12 sm:rounded-2xl">
          <Users size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Membresía CRM</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
          <span className="text-xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight sm:text-2xl">
                <NumberTicker value={stats.membersCount} />
              </span>
              <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Líderes activos: {stats.leadersCount}</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Donaciones */}
      {access.finances && (
      <div className="group relative flex min-w-0 cursor-default flex-col items-start gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-3.5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.6)] backdrop-blur-2xl transition-all duration-300 hover:border-amber-300/70 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/65 sm:flex-row sm:items-center sm:p-5 lg:hover:-translate-y-1">
        <BorderBeam size={150} duration={12} delay={1} colorFrom="#f59e0b" colorTo="#d97706" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50/70 text-gold transition-transform duration-300 group-hover:scale-105 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400 sm:size-12 sm:rounded-2xl">
          <Heart size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Finanzas Totales</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
              <span className="break-all text-xl font-extrabold tracking-tight text-gray-800 dark:text-gray-100 sm:text-2xl">{currencyFormatter.format(stats.totalDonationsAmount)}</span>
              <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Donaciones registradas</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Peticiones */}
      {access.petitions && (
      <div className="group relative flex min-w-0 cursor-default flex-col items-start gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-3.5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.6)] backdrop-blur-2xl transition-all duration-300 hover:border-rose-300/70 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/65 sm:flex-row sm:items-center sm:p-5 lg:hover:-translate-y-1">
        <BorderBeam size={150} duration={12} delay={3} colorFrom="#ef4444" colorTo="#dc2626" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50/70 text-accent-red transition-transform duration-300 group-hover:scale-105 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 sm:size-12 sm:rounded-2xl">
          <Activity size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Peticiones Oración</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
              <span className="text-xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight sm:text-2xl">
                <NumberTicker value={stats.petitionsCount} />
              </span>
              <span className="text-[9px] text-accent-red block font-bold mt-0.5">Pendientes de oración: {stats.pendingPetitions}</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Patrimonio e Inventario */}
      {access.inventory && (
      <div className="group relative flex min-w-0 cursor-default flex-col items-start gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-3.5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.6)] backdrop-blur-2xl transition-all duration-300 hover:border-violet-300/70 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/65 sm:flex-row sm:items-center sm:p-5 lg:hover:-translate-y-1">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50/70 text-accent-purple transition-transform duration-300 group-hover:scale-105 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-400 sm:size-12 sm:rounded-2xl">
          <Layers size={22} />
        </div>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Activos e Inventario</span>
          {loading ? (
            <div className="h-6 w-16 bg-slate-105 dark:bg-slate-800 animate-pulse rounded mt-1"></div>
          ) : (
            <div>
              <span className="text-xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight sm:text-2xl">
                <NumberTicker value={stats.inventoryCount} /> <span className="text-sm font-medium text-gray-500">uds</span>
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-bold mt-0.5">
                Valor estimado: {currencyFormatter.format(stats.inventoryValue)}
              </span>
            </div>
          )}
        </div>
      </div>
      )}
    </AnimeStaggerGrid>
  );
};
