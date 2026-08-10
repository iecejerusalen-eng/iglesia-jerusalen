import { AlertTriangle, CalendarDays, CheckCircle2, HeartHandshake, PackageSearch, Users } from 'lucide-react';
import type { AnalyticsDatasets, AnalyticsRow, DateFilter } from '../types';
import { filterRowsByDate } from '../hooks/useChartData';

interface AnalyticsOverviewProps {
  datasets: AnalyticsDatasets;
  dateFilter: DateFilter;
  updatedAt: number;
}

function numberFrom(row: AnalyticsRow, key: string): number {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AnalyticsOverview({ datasets, dateFilter, updatedAt }: AnalyticsOverviewProps) {
  const members = filterRowsByDate(datasets.members, dateFilter);
  const donations = filterRowsByDate(datasets.donations, dateFilter);
  const petitions = filterRowsByDate(datasets.petitions, dateFilter);
  const inventory = filterRowsByDate(datasets.inventory, dateFilter);
  const completedDonations = donations.filter((row) => row.status === 'completed');
  const donationTotal = completedDonations.reduce((sum, row) => sum + numberFrom(row, 'amount'), 0);
  const openPetitions = petitions.filter((row) => row.status !== 'respondida').length;
  const criticalInventory = inventory.filter((row) => row.status === 'critico').length;
  const completeProfiles = members.filter(
    (row) => Boolean(row.gender) && Boolean(row.birth_date) && Boolean(row.leadership_role),
  ).length;
  const profileQuality = members.length === 0 ? 0 : Math.round((completeProfiles / members.length) * 100);

  const today = new Date();
  const monthAhead = new Date(today);
  monthAhead.setDate(today.getDate() + 30);
  const upcomingEvents = datasets.events.filter((row) => {
    if (typeof row.start_date !== 'string') return false;
    const date = new Date(row.start_date);
    return !Number.isNaN(date.getTime()) && date >= today && date <= monthAhead;
  }).length;

  const metrics = [
    {
      label: 'Miembros del periodo',
      value: members.length.toLocaleString('es-ES'),
      detail: `${profileQuality}% con perfil analítico completo`,
      icon: Users,
      color: 'from-blue-500/18 to-cyan-400/8 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Donaciones completadas',
      value: formatMoney(donationTotal),
      detail: `${completedDonations.length} movimientos confirmados`,
      icon: HeartHandshake,
      color: 'from-emerald-500/18 to-teal-400/8 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Peticiones por atender',
      value: openPetitions.toLocaleString('es-ES'),
      detail: openPetitions === 0 ? 'No hay pendientes en el periodo' : 'Pendientes o en oración',
      icon: CheckCircle2,
      color: 'from-violet-500/18 to-fuchsia-400/8 text-violet-700 dark:text-violet-300',
    },
    {
      label: 'Inventario crítico',
      value: criticalInventory.toLocaleString('es-ES'),
      detail: `${upcomingEvents} eventos en los próximos 30 días`,
      icon: criticalInventory > 0 ? AlertTriangle : PackageSearch,
      color: criticalInventory > 0
        ? 'from-amber-500/20 to-orange-400/8 text-amber-700 dark:text-amber-300'
        : 'from-slate-500/14 to-slate-300/5 text-slate-700 dark:text-slate-300',
    },
  ];

  return (
    <section aria-labelledby="analytics-summary-title" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
            Lectura ejecutiva
          </p>
          <h2 id="analytics-summary-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            Lo que requiere atención ahora
          </h2>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays size={14} aria-hidden="true" />
          Actualizado {new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(updatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-60`} aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{metric.label}</p>
                  <p className="mt-3 truncate text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{metric.detail}</p>
                </div>
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-white/65 shadow-sm dark:bg-white/10 ${metric.color}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
