import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { AlertCircle, Gift, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { useBirthdays, type BirthdayInfo, MONTH_NAMES } from '../../features/birthdays/hooks/useBirthdays';
import { BirthdaysHero } from '../../features/birthdays/components/BirthdaysHero';
import { BirthdaysFilters, type BirthdayTab, type BirthdayViewMode } from '../../features/birthdays/components/BirthdaysFilters';
import { BirthdaysList } from '../../features/birthdays/components/BirthdaysList';
import { BirthdayMessagingCenter } from '../../features/birthdays/components/BirthdayMessagingCenter';
import CalendarPdfDialog from '../../components/common/CalendarPdfDialog';
import { exportBirthdaysPdf } from '../../utils/calendarPdfExport';
import { usePermissions } from '../../hooks/usePermissions';

function matchesSearch(item: BirthdayInfo, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase('es');
  if (!normalized) return true;
  return `${item.member.first_name} ${item.member.last_name} ${item.member.ministry_name || ''}`
    .toLocaleLowerCase('es')
    .includes(normalized);
}

export default function Birthdays() {
  const { birthdayList, loading, refreshing, error, lastUpdated, refetch } = useBirthdays();
  const { user, hasPermission } = usePermissions();
  const { width, height } = useWindowSize();
  const [activeTab, setActiveTab] = useState<BirthdayTab>('semana');
  const [viewMode, setViewMode] = useState<BirthdayViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiRecipient, setConfettiRecipient] = useState('');
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [showMessagingCenter, setShowMessagingCenter] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<BirthdayInfo | null>(null);
  const canManageMessages = Boolean(user) && hasPermission('notifications', 'edit');

  const counts = useMemo(() => ({
    hoy: birthdayList.filter((item) => item.isToday).length,
    semana: birthdayList.filter((item) => item.isThisWeek).length,
    mes: birthdayList.filter((item) => item.isThisMonth).length,
  }), [birthdayList]);

  const searchedBirthdays = useMemo(
    () => birthdayList.filter((item) => matchesSearch(item, searchQuery)),
    [birthdayList, searchQuery]
  );

  const filteredBirthdays = useMemo(() => {
    const filtered = searchedBirthdays.filter((item) => {
      if (activeTab === 'hoy') return item.isToday;
      if (activeTab === 'semana') return item.isThisWeek;
      return item.isThisMonth;
    });
    return filtered.sort((a, b) => activeTab === 'semana' ? a.daysRemaining - b.daysRemaining : a.day - b.day || a.member.last_name.localeCompare(b.member.last_name, 'es'));
  }, [activeTab, searchedBirthdays]);

  const handleCelebrate = (name: string) => {
    setConfettiRecipient(name);
    setShowConfetti(true);
    toast.success(`¡Celebramos con alegría la vida de ${name}!`);
    window.setTimeout(() => setShowConfetti(false), 4200);
  };

  const handleMessage = (birthday: BirthdayInfo) => {
    setMessageRecipient(birthday);
    setShowMessagingCenter(true);
  };

  const closeMessagingCenter = () => {
    setShowMessagingCenter(false);
    setMessageRecipient(null);
  };

  const handleExportPdf = (orientation: 'portrait' | 'landscape') => {
    const isCalendarView = viewMode === 'calendar' || viewMode === 'year';
    const filterLabel = viewMode === 'calendar'
      ? `${MONTH_NAMES[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`
      : viewMode === 'year'
        ? `Año ${new Date().getFullYear()}`
        : activeTab === 'hoy' ? 'Hoy' : activeTab === 'semana' ? 'Próximos 7 días' : 'Este mes';

    exportBirthdaysPdf(isCalendarView ? searchedBirthdays : filteredBirthdays, {
      viewMode,
      orientation,
      filterLabel,
      calendarMonth: `${MONTH_NAMES[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`,
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7fb] px-4 py-8 transition-colors dark:bg-slate-950 md:px-8 md:py-10">
      <Helmet>
        <title>Cumpleaños | Iglesia Jerusalén</title>
        <meta name="description" content="Celebra los cumpleaños de la familia de la Iglesia Jerusalén con información pública autorizada desde nuestro CRM." />
      </Helmet>

      <div className="pointer-events-none absolute left-[-10rem] top-32 h-96 w-96 rounded-full bg-church-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[32rem] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true">
          <Confetti width={width} height={height} recycle={false} numberOfPieces={320} gravity={0.12} />
          <div className="absolute inset-x-4 top-1/3 flex justify-center">
            <div className="max-w-sm rounded-3xl border border-church-gold/40 bg-white/90 px-6 py-5 text-center shadow-2xl backdrop-blur-2xl dark:bg-slate-900/90">
              <Gift className="mx-auto text-church-gold-dark dark:text-church-gold-light" size={30} />
              <h2 className="mt-2 font-serif text-lg font-bold text-primary dark:text-white">¡Celebramos su vida!</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Que Dios bendiga abundantemente a <strong>{confettiRecipient}</strong>.</p>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <div id="birthdays_hero" className="scroll-mt-24">
          <BirthdaysHero todayCount={counts.hoy} weekCount={counts.semana} monthCount={counts.mes} totalCount={birthdayList.length} nextBirthday={birthdayList[0]} />
        </div>

        <div className="mt-6 space-y-5">
          <div id="birthdays_today" className="scroll-mt-24">
            <BirthdaysFilters activeTab={activeTab} setActiveTab={setActiveTab} viewMode={viewMode} setViewMode={setViewMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} counts={counts} onExportPdf={() => setShowPdfDialog(true)} canExport={(viewMode === 'calendar' || viewMode === 'year' ? searchedBirthdays : filteredBirthdays).length > 0} onRefresh={() => void refetch()} isRefreshing={refreshing} />
          </div>

          {canManageMessages && (
            <div className="mx-auto flex max-w-7xl flex-col gap-3 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-emerald-500/15 p-2 text-emerald-700 dark:text-emerald-300"><MessageCircle size={18} /></span>
                <div><p className="text-sm font-bold text-slate-800 dark:text-white">Mensajería de cumpleaños</p><p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">Personaliza una felicitación o prepara una cola para varias personas con teléfono registrado.</p></div>
              </div>
              <button type="button" onClick={() => { setMessageRecipient(null); setShowMessagingCenter(true); }} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700"><MessageCircle size={15} /> Crear felicitaciones</button>
            </div>
          )}

          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
            <span>{loading ? 'Sincronizando con el CRM…' : `${(viewMode === 'calendar' || viewMode === 'year' ? searchedBirthdays : filteredBirthdays).length} resultado${(viewMode === 'calendar' || viewMode === 'year' ? searchedBirthdays : filteredBirthdays).length === 1 ? '' : 's'} en la selección`}</span>
            {lastUpdated && <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Actualizado {lastUpdated.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>

          <div id="birthdays-results" role="tabpanel" aria-labelledby={`birthday-tab-${activeTab}`} className="scroll-mt-24">
            <div id="birthdays_card">
            {loading ? (
              <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Cargando cumpleaños" aria-busy="true">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-[1.75rem] border border-white/70 bg-white/60 dark:border-white/10 dark:bg-slate-900/60" />)}
              </div>
            ) : error ? (
              <div role="alert" className="mx-auto max-w-7xl rounded-[2rem] border border-red-200 bg-white/75 px-6 py-14 text-center shadow-sm backdrop-blur-2xl dark:border-red-500/20 dark:bg-slate-900/70">
                <AlertCircle className="mx-auto text-accent-red" size={40} />
                <h2 className="mt-4 font-serif text-xl font-bold text-slate-800 dark:text-white">No pudimos consultar los cumpleaños</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">La información no se reemplazó con datos ficticios. Verifica que la migración de cumpleaños públicos esté aplicada y vuelve a intentarlo.</p>
                <button type="button" onClick={() => void refetch()} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white transition hover:bg-primary-dark"><RefreshCw size={15} /> Reintentar conexión</button>
              </div>
            ) : birthdayList.length === 0 ? (
              <BirthdayEmptyState kind="not-configured" onOpenYear={() => setViewMode('year')} />
            ) : searchQuery.trim() && searchedBirthdays.length === 0 ? (
              <BirthdayEmptyState kind="search" onClearSearch={() => setSearchQuery('')} />
            ) : filteredBirthdays.length === 0 && viewMode !== 'calendar' && viewMode !== 'year' ? (
              <BirthdayEmptyState kind="period" onOpenYear={() => setViewMode('year')} />
            ) : (
              <BirthdaysList birthdays={filteredBirthdays} allBirthdays={searchedBirthdays} viewMode={viewMode} onCelebrate={handleCelebrate} onMessage={canManageMessages ? handleMessage : undefined} currentCalendarDate={currentCalendarDate} setCurrentCalendarDate={setCurrentCalendarDate} />
            )}
            </div>
          </div>
        </div>
      </div>

      {showPdfDialog && <CalendarPdfDialog onClose={() => setShowPdfDialog(false)} onExport={handleExportPdf} title="Exportar cumpleaños públicos" />}
      {showMessagingCenter && canManageMessages && <BirthdayMessagingCenter birthdays={searchedBirthdays} initialBirthday={messageRecipient} onClose={closeMessagingCenter} />}
    </div>
  );
}

function BirthdayEmptyState({
  kind,
  onOpenYear,
  onClearSearch,
}: {
  kind: 'not-configured' | 'search' | 'period';
  onOpenYear?: () => void;
  onClearSearch?: () => void;
}) {
  const content = {
    'not-configured': {
      title: 'Aún no hay cumpleaños públicos configurados',
      message: 'Cuando un miembro autorice publicar su nombre y día de cumpleaños, aparecerá aquí. La información privada del CRM no se muestra.',
      icon: ShieldCheck,
    },
    search: {
      title: 'No encontramos coincidencias',
      message: 'Prueba con otro nombre o ministerio, o limpia la búsqueda para ver todos los registros públicos.',
      icon: AlertCircle,
    },
    period: {
      title: 'No hay cumpleaños en este periodo',
      message: 'Puedes consultar el calendario anual para ver la distribución completa de cumpleaños públicos.',
      icon: Gift,
    },
  }[kind];
  const Icon = content.icon;

  return (
    <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-white/65 px-6 py-14 text-center shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
      <Icon className="mx-auto text-church-gold-medium" size={42} />
      <h2 className="mt-4 font-serif text-xl font-bold text-slate-800 dark:text-white">{content.title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{content.message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onOpenYear && <button type="button" onClick={onOpenYear} className="rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white transition hover:bg-primary-dark">Ver calendario anual</button>}
        {onClearSearch && <button type="button" onClick={onClearSearch} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 transition hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Limpiar búsqueda</button>}
        {kind === 'not-configured' && <a href="/contacto" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 transition hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Contactar a la iglesia</a>}
      </div>
    </div>
  );
}
