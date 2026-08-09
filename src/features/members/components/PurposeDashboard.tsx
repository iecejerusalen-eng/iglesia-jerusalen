import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  Eye,
  Filter,
  Gift,
  HeartHandshake,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../../../config/supabase';
import type { MemberWithRelations } from '../utils/schema';

interface PurposeDashboardProps {
  members: MemberWithRelations[];
  loading: boolean;
  onEdit: (member: MemberWithRelations) => void;
}

interface MinistryMembership {
  member_id: string;
  ministry_id: string;
  role: string;
  created_at: string;
  ministries: { name: string } | null;
}

type FocusFilter = 'all' | 'ready' | 'unassigned' | 'leaders' | 'needs_profile';

const yearsBetween = (date?: string | null) => {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, (Date.now() - timestamp) / 31_556_952_000);
};

const formatTenure = (date?: string | null) => {
  const years = yearsBetween(date);
  if (years === null) return 'Sin fecha';
  if (years < 1) return `${Math.max(1, Math.round(years * 12))} meses`;
  return `${years.toFixed(years >= 10 ? 0 : 1)} años`;
};

const getNames = (items?: Array<{ catalog_roles: { name: string } }>) =>
  items?.map((item) => item.catalog_roles?.name).filter(Boolean) ?? [];

const getProfileStrength = (member: MemberWithRelations) => {
  const signals = [
    Boolean(member.ministry_id),
    Boolean(member.member_service_areas?.length),
    Boolean(member.member_talents?.length),
    Boolean(member.member_spiritual_gifts?.length),
    Boolean(member.phone || member.member_emails?.length),
    Boolean(member.conversion_date || member.baptism_date),
  ];
  return Math.round((signals.filter(Boolean).length / signals.length) * 100);
};

const aggregateNames = (members: MemberWithRelations[], key: 'talents' | 'gifts' | 'areas') => {
  const counts = new Map<string, number>();
  members.forEach((member) => {
    const source = key === 'talents'
      ? member.member_talents
      : key === 'gifts'
        ? member.member_spiritual_gifts
        : member.member_service_areas;
    getNames(source).forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

const StatCard = ({ icon: Icon, label, value, detail, tone }: {
  icon: typeof Users;
  label: string;
  value: string | number;
  detail: string;
  tone: string;
}) => (
  <article className="group relative overflow-hidden rounded-[1.6rem] border border-white/60 bg-white/70 p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,.7)] backdrop-blur-2xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900/65">
    <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl ${tone}`} />
    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/60 bg-white/70 text-primary shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-church-gold-bright">
        <Icon size={20} />
      </span>
    </div>
  </article>
);

export const PurposeDashboard = ({ members, loading, onEdit }: PurposeDashboardProps) => {
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState<FocusFilter>('all');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [selected, setSelected] = useState<MemberWithRelations | null>(null);

  const { data: memberships = [] } = useQuery({
    queryKey: ['member-ministry-tenure'],
    queryFn: async (): Promise<MinistryMembership[]> => {
      const { data, error } = await supabase
        .from('ministry_members')
        .select('member_id, ministry_id, role, created_at, ministries(name)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MinistryMembership[];
    },
  });

  const membershipsByMember = useMemo(() => {
    const map = new Map<string, MinistryMembership[]>();
    memberships.forEach((membership) => {
      const current = map.get(membership.member_id) ?? [];
      current.push(membership);
      map.set(membership.member_id, current);
    });
    return map;
  }, [memberships]);

  const analytics = useMemo(() => {
    const withPurposeProfile = members.filter((member) =>
      member.member_talents?.length || member.member_spiritual_gifts?.length || member.member_service_areas?.length
    );
    const activated = members.filter((member) => member.ministry_id || membershipsByMember.has(member.id));
    const readyToActivate = members.filter((member) =>
      !member.ministry_id && !membershipsByMember.has(member.id)
      && Boolean(member.member_talents?.length || member.member_spiritual_gifts?.length)
    );
    const missingProfile = members.filter((member) => getProfileStrength(member) < 50);
    const ministryCounts = new Map<string, number>();
    members.forEach((member) => {
      const name = member.ministries?.name ?? 'Sin ministerio';
      ministryCounts.set(name, (ministryCounts.get(name) ?? 0) + 1);
    });
    return {
      withPurposeProfile,
      activated,
      readyToActivate,
      missingProfile,
      talents: aggregateNames(members, 'talents'),
      gifts: aggregateNames(members, 'gifts'),
      areas: aggregateNames(members, 'areas'),
      ministries: [...ministryCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      totalTithes: members.reduce((sum, member) => sum + (member.tithes_sum || 0), 0),
    };
  }, [members, membershipsByMember]);

  const filteredMembers = useMemo(() => members.filter((member) => {
    const term = search.trim().toLocaleLowerCase('es');
    const searchable = [
      member.first_name,
      member.last_name,
      member.ministries?.name,
      ...getNames(member.member_talents),
      ...getNames(member.member_spiritual_gifts),
      ...getNames(member.member_service_areas),
    ].filter(Boolean).join(' ').toLocaleLowerCase('es');
    if (term && !searchable.includes(term)) return false;
    const hasAssignment = Boolean(member.ministry_id || membershipsByMember.has(member.id));
    const hasCallingSignals = Boolean(member.member_talents?.length || member.member_spiritual_gifts?.length);
    if (focus === 'ready') return !hasAssignment && hasCallingSignals;
    if (focus === 'unassigned') return !hasAssignment;
    if (focus === 'leaders') return member.is_leader;
    if (focus === 'needs_profile') return getProfileStrength(member) < 50;
    return true;
  }).sort((a, b) => getProfileStrength(b) - getProfileStrength(a)), [focus, members, membershipsByMember, search]);

  const coverageMax = Math.max(1, ...analytics.talents.slice(0, 6).map((item) => item.count));
  const activationRate = members.length ? Math.round((analytics.activated.length / members.length) * 100) : 0;
  const profileRate = members.length ? Math.round((analytics.withPurposeProfile.length / members.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(30,58,138,.98),rgba(49,46,129,.94)_50%,rgba(15,23,42,.98))] p-6 text-white shadow-2xl md:p-8">
        <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-church-gold/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.18em] backdrop-blur-xl">
              <Compass size={14} className="text-church-gold-bright" /> Mapa de dones y servicio
            </span>
            <h2 className="mt-4 max-w-3xl font-serif text-3xl font-bold leading-tight md:text-5xl">
              Personas antes que puestos. <span className="text-church-gold-bright">Propósito antes que ocupación.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80 md:text-base">
              Una vista pastoral para descubrir capacidades, evitar sobrecarga y acompañar a cada persona hacia un servicio saludable y significativo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <p className="text-3xl font-black">{activationRate}%</p>
              <p className="mt-1 text-xs text-blue-100/75">con ministerio o equipo registrado</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <p className="text-3xl font-black">{profileRate}%</p>
              <p className="mt-1 text-xs text-blue-100/75">con señales de dones o servicio</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Familia registrada" value={members.length} detail="Miembros activos en el CRM" tone="bg-blue-400/20" />
        <StatCard icon={Target} label="Listos para conversar" value={analytics.readyToActivate.length} detail="Tienen dones o talentos y aún no un equipo" tone="bg-amber-400/25" />
        <StatCard icon={UserRoundCheck} label="En servicio" value={analytics.activated.length} detail="Vinculados a uno o más ministerios" tone="bg-emerald-400/20" />
        <StatCard icon={Sparkles} label="Perfil por completar" value={analytics.missingProfile.length} detail="Faltan datos para orientar con cuidado" tone="bg-violet-400/20" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <article className="glass-card rounded-[1.75rem] p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary dark:text-church-gold-bright">Radar de capacidades</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">Talentos con mayor cobertura</h3>
            </div>
            <Award className="text-church-gold" />
          </div>
          <div className="mt-6 space-y-4">
            {analytics.talents.slice(0, 6).map((item) => (
              <div key={item.name}>
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>{item.name}</span><span>{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#1e3a8a,#c79d3f)]" style={{ width: `${Math.max(8, (item.count / coverageMax) * 100)}%` }} />
                </div>
              </div>
            ))}
            {!analytics.talents.length && <p className="py-8 text-center text-sm text-slate-400">Aún no hay talentos catalogados.</p>}
          </div>
        </article>

        <article className="glass-card rounded-[1.75rem] p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary dark:text-church-gold-bright">Embudo de activación</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">De conocer a acompañar</h3>
            </div>
            <TrendingUp className="text-emerald-500" />
          </div>
          <div className="mt-6 space-y-3">
            {[
              { label: 'Miembros registrados', value: members.length, icon: Users, color: 'bg-blue-600' },
              { label: 'Perfil de dones / talentos', value: analytics.withPurposeProfile.length, icon: Gift, color: 'bg-violet-500' },
              { label: 'Sirviendo actualmente', value: analytics.activated.length, icon: HeartHandshake, color: 'bg-emerald-500' },
            ].map((step, index) => (
              <div key={step.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/60 p-3 dark:border-white/5 dark:bg-white/[.03]">
                <span className={`grid h-9 w-9 place-items-center rounded-xl text-white ${step.color}`}><step.icon size={17} /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800 dark:text-white">{step.label}</p><p className="text-xs text-slate-400">Etapa {index + 1}</p></div>
                <span className="text-xl font-black text-slate-900 dark:text-white">{step.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200/60 bg-amber-50/70 p-4 text-xs leading-5 text-amber-900 dark:border-amber-500/15 dark:bg-amber-500/10 dark:text-amber-100">
            <strong>{analytics.readyToActivate.length} conversaciones sugeridas:</strong> esta cifra no asigna personas automáticamente; invita a escuchar, confirmar disponibilidad y discernir junto a ellas.
          </div>
        </article>
      </section>

      <section className="glass-card overflow-hidden rounded-[1.75rem]">
        <div className="border-b border-slate-100 p-5 dark:border-white/5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary dark:text-church-gold-bright">Directorio inteligente</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">Personas y posibilidades de servicio</h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-72">
                <span className="sr-only">Buscar por persona, ministerio, don o talento</span>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Persona, ministerio, don o talento…" className="h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950/60" />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={16} /></button>}
              </label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950/60">
                <button type="button" onClick={() => setView('cards')} aria-label="Vista de tarjetas" className={`rounded-lg p-2 ${view === 'cards' ? 'bg-white text-primary shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                <button type="button" onClick={() => setView('table')} aria-label="Vista de tabla" className={`rounded-lg p-2 ${view === 'table' ? 'bg-white text-primary shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-400'}`}><List size={18} /></button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-slate-400"><Filter size={14} /> Enfocar:</span>
            {([
              ['all', 'Todos'], ['ready', 'Listos para conversar'], ['unassigned', 'Sin ministerio'], ['leaders', 'Liderazgo'], ['needs_profile', 'Perfil incompleto'],
            ] as Array<[FocusFilter, string]>).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFocus(value)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${focus === value ? 'border-primary bg-primary text-white shadow-md shadow-primary/15' : 'border-slate-200 bg-white/60 text-slate-500 hover:border-primary/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="p-5 md:p-6">
          {loading ? <div className="h-72 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" /> : view === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredMembers.map((member) => {
                const strength = getProfileStrength(member);
                const talents = getNames(member.member_talents);
                const gifts = getNames(member.member_spiritual_gifts);
                const memberMemberships = membershipsByMember.get(member.id) ?? [];
                return (
                  <article key={member.id} className="group rounded-[1.5rem] border border-slate-200/80 bg-white/65 p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl dark:border-white/10 dark:bg-slate-950/35">
                    <div className="flex items-start gap-3">
                      {member.photo_url ? <img src={member.photo_url} alt={`Foto de ${member.first_name} ${member.last_name}`} className="h-12 w-12 rounded-2xl object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-sm font-black text-white">{member.first_name[0]}{member.last_name[0]}</span>}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-bold text-slate-900 dark:text-white">{member.first_name} {member.last_name}</h4>
                        <p className="truncate text-xs text-slate-500">{member.ministries?.name ?? memberMemberships[0]?.ministries?.name ?? 'Aún sin ministerio'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${strength >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>{strength}%</span>
                    </div>
                    <div className="mt-4 flex min-h-14 flex-wrap content-start gap-1.5">
                      {[...gifts.map((name) => ({ name, kind: 'Don' })), ...talents.map((name) => ({ name, kind: 'Talento' }))].slice(0, 4).map((item) => <span key={`${item.kind}-${item.name}`} className="rounded-full border border-violet-200/60 bg-violet-50/70 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:border-violet-400/15 dark:bg-violet-500/10 dark:text-violet-200">{item.name}</span>)}
                      {!gifts.length && !talents.length && <span className="text-xs italic text-slate-400">Falta conversar sobre dones y talentos</span>}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={14} /> {memberMemberships[0] ? formatTenure(memberMemberships[0].created_at) : 'Sin antigüedad'}</span>
                      <button type="button" onClick={() => setSelected(member)} className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-church-gold-bright">Ver perfil <ChevronRight size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50/90 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-white/5"><tr><th className="px-4 py-3">Miembro</th><th className="px-4 py-3">Función / ministerio</th><th className="px-4 py-3">Dones y talentos</th><th className="px-4 py-3">Tiempo de servicio</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3" /></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredMembers.map((member) => {
                    const tenure = membershipsByMember.get(member.id)?.[0];
                    return <tr key={member.id} className="bg-white/50 hover:bg-blue-50/50 dark:bg-transparent dark:hover:bg-white/[.03]">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{member.first_name} {member.last_name}</td>
                      <td className="px-4 py-3 text-slate-500">{member.leadership_role || member.ministries?.name || tenure?.role || 'Sin asignación'}</td>
                      <td className="max-w-sm px-4 py-3 text-xs text-slate-500">{[...getNames(member.member_spiritual_gifts), ...getNames(member.member_talents)].join(', ') || 'Por registrar'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatTenure(tenure?.created_at)}</td>
                      <td className="px-4 py-3 font-black text-slate-700 dark:text-slate-200">{getProfileStrength(member)}%</td>
                      <td className="px-4 py-3"><button type="button" onClick={() => setSelected(member)} aria-label={`Ver perfil de ${member.first_name}`} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Eye size={17} /></button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !filteredMembers.length && <div className="py-16 text-center"><Search className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-bold text-slate-600 dark:text-slate-300">No encontramos perfiles con estos filtros.</p></div>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-violet-200/60 bg-violet-50/60 p-4 dark:border-violet-500/15 dark:bg-violet-500/10"><Gift className="text-violet-600" /><p className="mt-3 font-bold text-violet-950 dark:text-violet-100">Dones no son cargos</p><p className="mt-1 text-xs leading-5 text-violet-800/70 dark:text-violet-200/70">El tablero propone conversaciones; nunca declara el llamado de una persona ni la asigna sin consentimiento.</p></div>
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4 dark:border-emerald-500/15 dark:bg-emerald-500/10"><HeartHandshake className="text-emerald-600" /><p className="mt-3 font-bold text-emerald-950 dark:text-emerald-100">Servir sin quemarse</p><p className="mt-1 text-xs leading-5 text-emerald-800/70 dark:text-emerald-200/70">Cruza capacidad, disponibilidad y tiempo de servicio para detectar rotación y prevenir sobrecarga.</p></div>
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-500/15 dark:bg-amber-500/10"><CircleDollarSign className="text-amber-600" /><p className="mt-3 font-bold text-amber-950 dark:text-amber-100">Finanzas separadas del llamado</p><p className="mt-1 text-xs leading-5 text-amber-800/70 dark:text-amber-200/70">Los diezmos ({new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(analytics.totalTithes)}) solo se muestran agregados y nunca influyen en afinidad o liderazgo.</p></div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm md:items-center md:p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="purpose-member-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] border border-white/20 bg-white p-5 shadow-2xl dark:bg-slate-950 md:rounded-[2rem] md:p-7">
            <div className="flex items-start gap-4">
              {selected.photo_url ? <img src={selected.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-xl font-black text-white">{selected.first_name[0]}{selected.last_name[0]}</span>}
              <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary dark:text-church-gold-bright">Perfil de servicio</p><h3 id="purpose-member-title" className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">{selected.first_name} {selected.last_name}</h3><p className="text-sm text-slate-500">{selected.leadership_role || selected.ministries?.name || 'Explorando su lugar de servicio'}</p></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar perfil" className="rounded-xl border border-slate-200 p-2 text-slate-400 dark:border-white/10"><X size={19} /></button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10"><Gift className="text-blue-600" size={19} /><p className="mt-2 text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-100">Dones</p><p className="mt-2 text-sm leading-6 text-blue-800/75 dark:text-blue-200/75">{getNames(selected.member_spiritual_gifts).join(', ') || 'Por conversar'}</p></div>
              <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-500/10"><Award className="text-violet-600" size={19} /><p className="mt-2 text-xs font-black uppercase tracking-wider text-violet-900 dark:text-violet-100">Talentos</p><p className="mt-2 text-sm leading-6 text-violet-800/75 dark:text-violet-200/75">{getNames(selected.member_talents).join(', ') || 'Por registrar'}</p></div>
              <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10"><BriefcaseBusiness className="text-emerald-600" size={19} /><p className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-100">Áreas prácticas</p><p className="mt-2 text-sm leading-6 text-emerald-800/75 dark:text-emerald-200/75">{getNames(selected.member_service_areas).join(', ') || 'Por registrar'}</p></div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Trayectoria registrada</p><p className="mt-1 font-bold text-slate-800 dark:text-white">{membershipsByMember.get(selected.id)?.length || (selected.ministry_id ? 1 : 0)} equipo(s)</p></div><Clock3 className="text-church-gold" /></div>
              <div className="mt-3 space-y-2">{(membershipsByMember.get(selected.id) ?? []).map((membership) => <div key={`${membership.member_id}-${membership.ministry_id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-white/5"><span className="font-semibold">{membership.ministries?.name} · {membership.role}</span><span className="text-xs text-slate-400">{formatTenure(membership.created_at)}</span></div>)}</div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">Cerrar</button>
              <button type="button" onClick={() => { onEdit(selected); setSelected(null); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">Completar ficha <ArrowRight size={16} /></button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
