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
import { useOnboarding } from '../../admin/onboarding/useOnboarding';
import { OnboardingPaso } from '../../admin/onboarding/OnboardingPaso';
import { OnboardingProgreso } from '../../admin/onboarding/OnboardingProgreso';
import type { OnboardingPasoData } from '../../admin/onboarding/useOnboarding';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const { user, firstName } = useAuthStore();
  const [detailsRequested, setDetailsRequested] = useState(false);
  const { hasPermission } = usePermissions();
  const onboarding = useOnboarding();
  const navigate = useNavigate();
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
    <div className="relative space-y-5 text-left md:space-y-7">
      {/* Radial gradient ambient — standard visual from AnalyticsDashboard */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.11),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_35%)]"
        aria-hidden="true"
      />

      <DashboardHero
        displayName={displayName}
        membersCount={data?.stats.membersCount}
      />

      {isError && (
        <div role="alert" className="rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm backdrop-blur-xl dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          No se pudieron cargar algunas métricas en este momento. Tus accesos y herramientas siguen disponibles abajo.
        </div>
      )}

      {!onboarding.isLoading && !onboarding.error && onboarding.pasos.length > 0 && onboarding.porcentaje < 80 && (
        <section className="rounded-3xl border border-amber-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-amber-400/20 dark:bg-slate-900/60 sm:p-5" aria-labelledby="onboarding-dashboard-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.15em] text-gold">🚀 Activa tu cuenta</p><h2 id="onboarding-dashboard-title" className="mt-1 text-lg font-black text-slate-900 dark:text-white">{onboarding.completados} de {onboarding.pasos.length} pasos completados</h2></div><span className="text-sm font-black text-primary dark:text-church-gold-bright">{onboarding.porcentaje}%</span>
          </div>
          <div className="mt-3"><OnboardingProgreso porcentaje={onboarding.porcentaje} /></div>
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-white/10">{onboarding.pasos.map((paso: OnboardingPasoData) => <OnboardingPaso key={paso.id} paso={paso} onAction={(item) => navigate(item.accion_ruta)} />)}</ul>
        </section>
      )}

      {!isError && <DashboardStats
        stats={stats}
        loading={isLoading}
        access={access}
      />}

      {!isError && access.members && !detailsRequested && (
        <section className="rounded-2xl border border-blue-200/60 bg-blue-50/60 p-5 shadow-sm backdrop-blur-xl dark:border-blue-400/20 dark:bg-blue-950/20" aria-labelledby="dashboard-details-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20"><BarChart3 size={19} /></span>
              <div>
                <h2 id="dashboard-details-title" className="text-sm font-black text-slate-900 dark:text-white">Análisis detallado bajo demanda</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">Carga gráficos, alertas y talentos solo cuando los necesites. El resumen principal ya está disponible sin descargar todo el CRM.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailsRequested(true)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-700/20 transition-all duration-200 hover:bg-blue-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
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
