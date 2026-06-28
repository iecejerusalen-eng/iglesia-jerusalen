import { useAuthStore } from '../../store/useAuthStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

import { useDashboardStats } from '../../features/dashboard/hooks/useDashboardStats';
import { DashboardHero } from '../../features/dashboard/components/DashboardHero';
import { DashboardStats } from '../../features/dashboard/components/DashboardStats';
import { DashboardCharts } from '../../features/dashboard/components/DashboardCharts';
import { WeeklyAlerts } from '../../features/dashboard/components/WeeklyAlerts';
import { QuickLinks } from '../../features/dashboard/components/QuickLinks';
import { ModuleGrid } from '../../features/dashboard/components/ModuleGrid';

const DashboardHome = () => {
  const { user, firstName, role, roles } = useAuthStore();
  const userRoles = roles || (role ? [role] : []);
  
  const { data, isLoading } = useDashboardStats();

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
    <div className="space-y-8 text-left">
      <DashboardHero 
        displayName={displayName} 
        membersCount={stats.membersCount} 
      />

      <DashboardStats 
        stats={stats} 
        loading={isLoading} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCharts 
          loading={isLoading}
          ageData={ageData}
          areasData={areasData}
          talentsData={talentsData}
          talentCategoriesData={talentCategoriesData}
          baptismsData={baptismsData}
        />

        <AnimeFadeUp delay={250} duration={800} className="space-y-6">
          <WeeklyAlerts alerts={alerts} />
          <QuickLinks userRoles={userRoles} />
        </AnimeFadeUp>
      </div>

      <ModuleGrid />
    </div>
  );
};

export default DashboardHome;
