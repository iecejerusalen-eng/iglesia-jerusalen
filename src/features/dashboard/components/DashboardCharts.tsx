import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Layers,
  Search,
  Sparkles,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartSkeleton } from '../../../components/common/Skeletons';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { CustomTooltip } from './CustomTooltip';
import type {
  AgeDataPoint,
  AreaDataPoint,
  BaptismDataPoint,
  TalentCategoryDataPoint,
  TalentDataPoint,
  TalentDirectoryEntry,
} from '../types';

interface DashboardChartsProps {
  loading: boolean;
  areasData: AreaDataPoint[];
  talentCategoriesData: TalentCategoryDataPoint[];
  talentsData: TalentDataPoint[];
  talentDirectory: TalentDirectoryEntry[];
  ageData: AgeDataPoint[];
  baptismsData: BaptismDataPoint[];
  showAnalyticsLink: boolean;
}

const normalizeSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .trim();

const compactLabel = (value: string) => value.length > 20 ? `${value.slice(0, 18)}…` : value;

const glassCard = 'relative overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/70 p-4 shadow-[0_24px_70px_-44px_rgba(15,23,42,.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65 sm:p-5';

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center text-xs font-semibold text-slate-400 dark:border-white/10 dark:bg-white/[0.02]">
      {children}
    </div>
  );
}

function ChartHeading({ icon: Icon, title, description }: { icon: typeof Layers; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-blue-300">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function TalentFinder({ entries, loading }: { entries: TalentDirectoryEntry[]; loading: boolean }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const normalizedQuery = normalizeSearch(query);

  const categories = useMemo(() => (
    Array.from(new Set(entries.map((entry) => entry.category))).sort((a, b) => a.localeCompare(b, 'es'))
  ), [entries]);

  const popularTalents = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.talentName, (counts.get(entry.talentName) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).slice(0, 6);
  }, [entries]);

  const matches = useMemo(() => entries.filter((entry) => {
    const matchesCategory = category === 'Todas' || entry.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return normalizeSearch(`${entry.talentName} ${entry.category} ${entry.memberName}`).includes(normalizedQuery);
  }), [category, entries, normalizedQuery]);

  const uniqueMembers = new Set(matches.map((entry) => entry.memberId)).size;

  return (
    <section className={`${glassCard} bg-gradient-to-br from-white/85 via-white/70 to-blue-50/60 dark:from-slate-900/85 dark:via-slate-900/70 dark:to-blue-950/25`} aria-labelledby="talent-finder-title">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] xl:items-start">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
            <UserRoundSearch size={13} /> Directorio de capacidades
          </span>
          <h2 id="talent-finder-title" className="mt-3 font-serif text-2xl font-bold text-primary dark:text-white">Encuentra a la persona indicada</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Busca un talento, una habilidad, una categoría o el nombre de un miembro para formar equipos de servicio.
          </p>

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. fotografía, enseñanza, música…"
              className="h-13 w-full rounded-2xl border border-slate-200/80 bg-white/85 pl-12 pr-11 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
              aria-label="Buscar talentos, habilidades o miembros"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Limpiar búsqueda">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2" aria-label="Talentos frecuentes">
            {popularTalents.map(([talent, count]) => (
              <button key={talent} type="button" onClick={() => setQuery(talent)} className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-blue-300">
                {talent} <span className="text-slate-400">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/65 p-3 dark:border-white/10 dark:bg-slate-950/35 sm:p-4">
          <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{loading ? 'Consultando directorio…' : `${uniqueMembers} ${uniqueMembers === 1 ? 'persona' : 'personas'}`}</p>
              <p className="text-[11px] text-slate-500">{matches.length} coincidencias de capacidades</p>
            </div>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" aria-label="Filtrar por categoría">
              <option value="Todas">Todas las categorías</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-18 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />)
            ) : matches.length ? matches.slice(0, 20).map((entry) => (
              <article key={`${entry.memberId}-${entry.category}-${entry.talentName}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/70 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-black text-white">
                  {entry.photoUrl ? <img src={entry.photoUrl} alt="" className="h-full w-full object-cover" /> : entry.memberName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs text-slate-900 dark:text-white">{entry.memberName}</strong>
                  <span className="mt-0.5 block truncate text-[11px] font-bold text-blue-700 dark:text-blue-300">{entry.talentName}</span>
                  <span className="block truncate text-[10px] text-slate-400">{entry.category}</span>
                </span>
              </article>
            )) : (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 px-4 py-9 text-center text-xs font-semibold text-slate-400 dark:border-white/10">
                No encontramos miembros con ese criterio.
              </div>
            )}
          </div>

          <Link to="/admin/miembros" className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-black text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200">
            Abrir directorio completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export const DashboardCharts = ({
  loading,
  areasData,
  talentCategoriesData,
  talentsData,
  talentDirectory,
  ageData,
  baptismsData,
  showAnalyticsLink,
}: DashboardChartsProps) => {
  const [skillsTab, setSkillsTab] = useState<'individual' | 'categories'>('categories');
  const activeTalentData = skillsTab === 'categories' ? talentCategoriesData : talentsData;
  const talentDescription = skillsTab === 'categories'
    ? 'Agrupación general para comprender la diversidad del equipo.'
    : 'Talentos específicos con más personas disponibles.';

  return (
    <AnimeFadeUp delay={100} duration={700} className="space-y-5 lg:space-y-6">
      <TalentFinder entries={talentDirectory} loading={loading} />

      <section className="grid gap-5 xl:grid-cols-2" aria-label="Indicadores visuales de la comunidad">
        <article className={glassCard}>
          <ChartHeading icon={Layers} title="Áreas de servicio" description="Dónde están sirviendo actualmente los miembros." />
          <div className="mt-5 h-72">
            {loading ? <ChartSkeleton /> : areasData.length ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={areasData.slice(0, 9)} layout="vertical" margin={{ top: 4, right: 30, left: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardAreas" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke="#94a3b8" opacity={0.18} />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                  <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} tickFormatter={compactLabel} />
                  <Tooltip cursor={{ fill: '#3b82f610' }} content={<CustomTooltip />} />
                  <Bar dataKey="miembros" name="Miembros" fill="url(#dashboardAreas)" radius={[0, 8, 8, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart>Agrega áreas de servicio a los perfiles para visualizar su distribución.</EmptyChart>}
          </div>
        </article>

        <article className={glassCard}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <ChartHeading icon={BookOpen} title="Talentos y habilidades" description={talentDescription} />
            <div className="inline-flex self-start rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5" role="tablist" aria-label="Nivel de detalle de talentos">
              {([
                ['categories', 'Categorías'],
                ['individual', 'Detalle'],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" role="tab" aria-selected={skillsTab === value} onClick={() => setSkillsTab(value)} className={`min-h-9 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider transition ${skillsTab === value ? 'bg-white text-blue-800 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 h-72">
            {loading ? <ChartSkeleton /> : activeTalentData.length ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={activeTalentData.slice(0, 9)} layout="vertical" margin={{ top: 4, right: 30, left: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardTalents" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke="#94a3b8" opacity={0.18} />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                  <YAxis type="category" dataKey="name" width={115} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} tickFormatter={compactLabel} />
                  <Tooltip cursor={{ fill: '#8b5cf610' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Personas" fill="url(#dashboardTalents)" radius={[0, 8, 8, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart>Registra talentos en el directorio para construir este mapa de capacidades.</EmptyChart>}
          </div>
        </article>

        <article className={glassCard}>
          <ChartHeading icon={Users} title="Composición por edades" description="Distribución generacional de los perfiles con fecha de nacimiento." />
          <div className="mt-5 h-64">
            {loading ? <ChartSkeleton /> : ageData.some((item) => item.cantidad > 0) ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={ageData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardAges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" />
                      <stop offset="100%" stopColor="#5eead4" stopOpacity={0.38} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="#94a3b8" opacity={0.18} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: '#14b8a610' }} content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" name="Miembros" fill="url(#dashboardAges)" radius={[8, 8, 3, 3]} maxBarSize={46} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart>Faltan fechas de nacimiento para calcular la distribución generacional.</EmptyChart>}
          </div>
        </article>

        <article className={glassCard}>
          <ChartHeading icon={Sparkles} title="Bautismos en aguas" description="Evolución anual basada en fechas registradas en el CRM." />
          <div className="mt-5 h-64">
            {loading ? <ChartSkeleton /> : baptismsData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={baptismsData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardBaptisms" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="#94a3b8" opacity={0.18} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cantidad" name="Bautizados" stroke="#2563eb" strokeWidth={3} fill="url(#dashboardBaptisms)" activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : baptismsData.length === 1 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white text-center dark:border-blue-400/15 dark:from-blue-500/10 dark:to-transparent">
                <span className="text-5xl font-black tracking-tight text-blue-700 dark:text-blue-300">{baptismsData[0].cantidad}</span>
                <span className="mt-2 text-xs font-black uppercase tracking-[.16em] text-slate-500">Bautismos en {baptismsData[0].year}</span>
                <p className="mt-3 max-w-xs px-5 text-xs leading-5 text-slate-400">Se necesitan al menos dos años registrados para mostrar una tendencia.</p>
              </div>
            ) : <EmptyChart>Registra fechas de bautismo para comenzar el historial.</EmptyChart>}
          </div>
        </article>
      </section>

      {showAnalyticsLink && <div className="flex justify-end">
        <Link to="/admin/analisis" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-4 text-xs font-black text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-blue-300">
          Ver análisis completo <ChevronRight size={15} />
        </Link>
      </div>}
    </AnimeFadeUp>
  );
};
