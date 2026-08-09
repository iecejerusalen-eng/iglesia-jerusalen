import { useAuthStore } from '../../store/useAuthStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

import { useDashboardStats } from '../../features/dashboard/hooks/useDashboardStats';
import { DashboardHero } from '../../features/dashboard/components/DashboardHero';
import { DashboardStats } from '../../features/dashboard/components/DashboardStats';
import { DashboardCharts } from '../../features/dashboard/components/DashboardCharts';
import { WeeklyAlerts } from '../../features/dashboard/components/WeeklyAlerts';
import { QuickLinks } from '../../features/dashboard/components/QuickLinks';
import { ModuleGrid } from '../../features/dashboard/components/ModuleGrid';
import { usePermissions } from '../../hooks/usePermissions';

const DashboardHome = () => {
  const { user, firstName } = useAuthStore();
  const { hasPermission } = usePermissions();
  const access = {
    members: hasPermission('members', 'view'),
    finances: hasPermission('finances', 'view'),
    petitions: hasPermission('petitions', 'view'),
    inventory: hasPermission('inventory', 'view'),
  };
  const { data, isLoading, isError } = useDashboardStats(access);

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
  const baptismsData = data?.baptismsData || [];

  return (
    <div className="space-y-5 text-left md:space-y-7">
      <DashboardHero 
        displayName={displayName} 
        membersCount={stats.membersCount} 
      />

      {isError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm backdrop-blur-xl dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          No se pudieron cargar algunas métricas en este momento. Tus accesos y herramientas siguen disponibles abajo.
        </div>
      )}

      <DashboardStats 
        stats={stats} 
        loading={isLoading}
        access={access}
      />

      {(access.members || access.petitions) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {access.members && (
            <DashboardCharts 
              loading={isLoading}
              ageData={ageData}
              areasData={areasData}
              talentsData={talentsData}
              talentCategoriesData={talentCategoriesData}
              baptismsData={baptismsData}
            />
          )}

          <AnimeFadeUp delay={250} duration={800} className={`space-y-5 lg:space-y-6 ${access.members ? '' : 'lg:col-span-3'}`}>
            {access.members && <WeeklyAlerts alerts={alerts} />}
            <QuickLinks />
          </AnimeFadeUp>
        </div>
      )}

      {!access.members && !access.petitions && <QuickLinks />}

      <ModuleGrid />
    </div>
  );
};

export default DashboardHome;
