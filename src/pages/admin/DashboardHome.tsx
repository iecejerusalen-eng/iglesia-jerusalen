import { useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

import { useDashboardStats } from '../../features/dashboard/hooks/useDashboardStats';
import { DashboardHero } from '../../features/dashboard/components/DashboardHero';
import { DashboardStats } from '../../features/dashboard/components/DashboardStats';
import { DashboardCharts } from '../../features/dashboard/components/DashboardCharts';
import { TalentsSkillsHub } from '../../features/dashboard/components/TalentsSkillsHub';
import { WeeklyAlerts } from '../../features/dashboard/components/WeeklyAlerts';
import { QuickLinks } from '../../features/dashboard/components/QuickLinks';
import { ModuleGrid } from '../../features/dashboard/components/ModuleGrid';
import { usePermissions } from '../../hooks/usePermissions';

const DashboardHome = () => {
  const { user, firstName } = useAuthStore();
  const [detailsRequested, setDetailsRequested] = useState(false);
  const { hasPermission } = usePermissions();
  const access = {
    members: hasPermission('members', 'view'),
    finances: hasPermission('finances', 'view'),
    petitions: hasPermission('petitions', 'view'),
    inventory: hasPermission('inventory', 'view'),
    volunteering: hasPermission('volunteering', 'view'),
  };
  const { data, isLoading, isError } = useDashboardStats(access, detailsRequested);

  const displayName = firstName ? `${firstName}` : user?.email?.split('@')[0] || 'Usuario';

  // Default values to prevent errors while loading
  const stats = data?.stats || {
    usersCount: 0,
    sermonsCount: 0,
    totalDonationsAmount: 0,
    membersCount: 0,
    leadersCount: 0,
    inventoryCount: 0,
    inventoryValue: 0,
    petitionsCount: 0,
    pendingPetitions: 0,
    ministriesCount: 0,
  };
  const alerts = data?.alerts || [];
  const ageData = data?.ageData || [];
  const areasData = data?.areasData || [];
  const talentsData = data?.talentsData || [];
  const talentCategoriesData = data?.talentCategoriesData || [];
  const talentDirectory = data?.talentDirectory || [];
  const baptismsData = data?.baptismsData || [];

  return (
    <div className="space-y-5 text-left md:space-y-7">
      <DashboardHero 
        displayName={displayName} 
        membersCount={data?.stats.membersCount}
      />

      {isError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm backdrop-blur-xl dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          No se pudieron cargar algunas métricas en este momento. Tus accesos y herramientas siguen disponibles abajo.
        </div>
      )}

      {!isError && <DashboardStats
        stats={stats} 
        loading={isLoading}
        access={access}
      />}

      {!isError && access.members && !detailsRequested && (
        <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5 shadow-sm dark:border-blue-400/20 dark:bg-blue-950/20" aria-labelledby="dashboard-details-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm"><BarChart3 size={19} /></span>
              <div>
                <h2 id="dashboard-details-title" className="text-sm font-black text-slate-900 dark:text-white">Análisis detallado bajo demanda</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">Carga gráficos, alertas y talentos solo cuando los necesites. El resumen principal ya está disponible sin descargar todo el CRM.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailsRequested(true)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
            >
              {detailsRequested && isLoading ? <Loader2 size={15} className="animate-spin" /> : <BarChart3 size={15} />}
              Cargar análisis
            </button>
          </div>
        </section>
      )}

      {!isError && access.members && detailsRequested && (
        <TalentsSkillsHub directory={talentDirectory} loading={isLoading} canViewNeeds={access.volunteering} />
      )}

      {!isError && access.members && detailsRequested && (
        <DashboardCharts
          loading={isLoading}
          ageData={ageData}
          areasData={areasData}
          talentsData={talentsData}
          talentCategoriesData={talentCategoriesData}
          talentDirectory={talentDirectory}
          baptismsData={baptismsData}
          showAnalyticsLink={hasPermission('analytics', 'view')}
        />
      )}

      <AnimeFadeUp delay={250} duration={700} className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        {access.members && <WeeklyAlerts alerts={alerts} />}
        <QuickLinks />
      </AnimeFadeUp>

      <ModuleGrid />
    </div>
  );
};

export default DashboardHome;
