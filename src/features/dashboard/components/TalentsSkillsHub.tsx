import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Search,
  Sparkles,
  Users,
  UserRoundSearch,
} from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { useDashboardServiceNeeds } from '../hooks/useDashboardServiceNeeds';
import type { DashboardServiceNeed, TalentDirectoryEntry } from '../types';

interface TalentsSkillsHubProps {
  directory: TalentDirectoryEntry[];
  loading: boolean;
  canViewNeeds: boolean;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
const card = 'rounded-[1.6rem] border border-white/70 bg-white/75 p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70';

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });

function NeedCard({ need }: { need: DashboardServiceNeed }) {
  const coverage = Math.min(100, Math.round((need.confirmedVolunteers / need.requiredVolunteers) * 100));
  const matched = need.matchedSkills.length;
  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{need.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <CalendarClock size={13} /> {formatDate(need.startTime)}{need.location ? ` · ${need.location}` : ''}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${coverage >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'}`}>
          {need.confirmedVolunteers}/{need.requiredVolunteers}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><span className={`block h-full rounded-full ${coverage >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${coverage}%` }} /></div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {need.skillsNeeded.length ? need.skillsNeeded.map((skill) => <span key={skill} className={`rounded-full border px-2 py-1 text-[10px] font-bold ${need.matchedSkills.includes(skill) ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'}`}>{skill}</span>) : <span className="text-[11px] text-slate-400">Sin habilidades específicas</span>}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <Users size={13} /> {matched ? `${need.matchedPeople} persona${need.matchedPeople === 1 ? '' : 's'} con coincidencias` : 'Aún no hay coincidencias registradas'}
      </p>
    </article>
  );
}

export function TalentsSkillsHub({ directory, loading, canViewNeeds }: TalentsSkillsHubProps) {
  const [query, setQuery] = useState('');
  const needsQuery = useDashboardServiceNeeds(canViewNeeds, directory);
  const needs = needsQuery.data ?? [];
  const uniquePeople = new Set(directory.map((entry) => entry.memberId)).size;
  const uniqueSkills = new Set(directory.map((entry) => normalize(entry.talentName))).size;
  const filtered = useMemo(() => {
    const search = normalize(query.trim());
    return directory.filter((entry) => !search || normalize(`${entry.memberName} ${entry.talentName} ${entry.category}`).includes(search)).slice(0, 8);
  }, [directory, query]);

  return (
    <AnimeFadeUp delay={80} duration={700}>
      <section className={`${card} overflow-hidden bg-gradient-to-br from-white/90 via-white/75 to-violet-50/65 dark:from-slate-900/90 dark:via-slate-900/75 dark:to-violet-950/25`} aria-labelledby="talents-skills-hub-title">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><Sparkles size={20} /></span>
            <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700 dark:text-violet-300">Centro de capacidades</p><h2 id="talents-skills-hub-title" className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Talentos y habilidades</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Encuentra personas para servir y detecta dónde hace falta apoyo.</p></div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-xl bg-white/80 px-3 py-2 text-slate-600 shadow-sm dark:bg-white/5 dark:text-slate-300"><strong className="text-violet-700 dark:text-violet-300">{loading ? '—' : uniqueSkills}</strong> capacidades</span>
            <span className="rounded-xl bg-white/80 px-3 py-2 text-slate-600 shadow-sm dark:bg-white/5 dark:text-slate-300"><strong className="text-violet-700 dark:text-violet-300">{loading ? '—' : uniquePeople}</strong> personas</span>
            <span className="rounded-xl bg-white/80 px-3 py-2 text-slate-600 shadow-sm dark:bg-white/5 dark:text-slate-300"><strong className="text-violet-700 dark:text-violet-300">{needs.length}</strong> necesidades</span>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><ClipboardList size={16} className="text-amber-500" /> Necesidades próximas</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Se comparan automáticamente con las habilidades registradas.</p></div><Link to="/admin/voluntariado" className="inline-flex items-center gap-1 text-xs font-black text-violet-700 hover:text-violet-900 dark:text-violet-300">Gestionar <ArrowRight size={14} /></Link></div>
            {needsQuery.isLoading ? <div className="grid gap-3 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" /><div className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" /></div> : needsQuery.isError ? <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 px-4 py-6 text-sm font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">No se pudieron consultar las necesidades de servicio. Revisa los permisos de Voluntariado.</div> : needs.length ? <div className="grid gap-3 sm:grid-cols-2">{needs.slice(0, 4).map((need) => <NeedCard key={need.id} need={need} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-9 text-center dark:border-white/10"><CheckCircle2 className="mx-auto text-emerald-500" size={24} /><p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">No hay necesidades próximas</p><p className="mt-1 text-xs text-slate-400">Cuando crees un turno con habilidades, aparecerá aquí.</p></div>}
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/35">
            <div className="flex items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><UserRoundSearch size={16} className="text-blue-500" /> Buscar por capacidad</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Solo muestra nombre y capacidad; los datos de contacto están en el CRM.</p></div><Link to="/admin/miembros" aria-label="Abrir miembros" className="text-slate-400 hover:text-blue-600"><ArrowRight size={17} /></Link></div>
            <div className="relative mt-4"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fotografía, música, cocina…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-white" aria-label="Buscar en talentos y habilidades" /></div>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1 custom-scrollbar">{loading ? <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" /> : filtered.length ? filtered.map((entry) => <div key={`${entry.memberId}-${entry.talentName}`} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/75 p-2.5 dark:border-white/10 dark:bg-white/[0.04]"><span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-600 text-[10px] font-black text-white">{entry.photoUrl ? <img src={entry.photoUrl} alt="" className="h-full w-full object-cover" /> : entry.memberName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-xs text-slate-800 dark:text-white">{entry.memberName}</strong><span className="block truncate text-[10px] font-bold text-blue-700 dark:text-blue-300">{entry.talentName}</span></span></div>) : <p className="py-6 text-center text-xs font-semibold text-slate-400">No encontramos coincidencias.</p>}</div>
            <Link to="/admin/miembros" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-blue-700 dark:text-blue-300">Abrir CRM de miembros <ArrowRight size={13} /></Link>
          </div>
        </div>
      </section>
    </AnimeFadeUp>
  );
}
