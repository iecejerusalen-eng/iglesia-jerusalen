import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ExternalLink, GraduationCap, Layers3, Plus, Search, Sparkles, Users, WifiOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { fetchProgramCatalog } from '../../features/study-programs/service';
import type { StudyProgram, StudyProgramAccess, StudyProgramModality, StudyProgramType } from '../../features/study-programs/types';
import { usePermissions } from '../../hooks/usePermissions';

interface ProgramDraft {
  title: string; slug: string; summary: string; description: string; program_type: StudyProgramType;
  modality: StudyProgramModality; access_type: StudyProgramAccess; audience: string; category: string;
  duration_label: string; difficulty: 'inicial' | 'intermedio' | 'avanzado'; requires_facilitator: boolean;
  allows_guest_progress: boolean; offline_enabled: boolean;
}

const emptyDraft: ProgramDraft = {
  title: '', slug: '', summary: '', description: '', program_type: 'self_guided', modality: 'online', access_type: 'public',
  audience: 'Todos', category: 'Discipulado', duration_label: '', difficulty: 'inicial', requires_facilitator: false,
  allows_guest_progress: true, offline_enabled: false,
};

const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const typeLabels: Record<StudyProgramType, string> = { community_group: 'Grupo en comunidad', self_guided: 'Autoguiado', facilitated: 'Con facilitador', downloadable: 'Descargable' };

export default function StudyProgramsManager() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('study_programs', 'edit');
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<ProgramDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProgramCatalog(true);
      setPrograms(result.programs);
      setSchemaReady(!result.compatibilityMode);
    } catch (error: unknown) {
      console.error('No se pudo cargar la administración de programas.', error);
      toast.error('No se pudo cargar Programas de Estudios.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPrograms(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPrograms]);

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('es');
    return programs.filter((program) => !value || `${program.title} ${program.category} ${program.audience}`.toLocaleLowerCase('es').includes(value));
  }, [programs, query]);

  const createProgram = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('study_programs').insert({
      ...draft,
      title: draft.title.trim(),
      slug: draft.slug || slugify(draft.title),
      duration_label: draft.duration_label || null,
      status: 'draft',
    }).select('id').single();
    setSaving(false);
    if (error) {
      console.error('No se pudo crear el programa.', error);
      toast.error(error.code === '23505' ? 'Ya existe un programa con esa dirección.' : 'No se pudo crear el programa.');
      return;
    }
    toast.success('Programa creado como borrador.');
    setShowCreate(false);
    setDraft(emptyDraft);
    navigate(`/admin/programas/${data.id}`);
  };

  const stats = {
    published: programs.filter((program) => program.status === 'published').length,
    groups: programs.filter((program) => program.program_type === 'community_group').length,
    selfGuided: programs.filter((program) => program.program_type === 'self_guided').length,
  };

  return (
    <div className="space-y-7 pb-16">
      <header className="relative overflow-hidden rounded-[2rem] border border-blue-400/15 bg-gradient-to-br from-[#10275e] via-[#173783] to-[#09162f] p-7 text-white shadow-2xl shadow-blue-950/15 sm:p-9">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em]"><Sparkles size={13} /> Formación flexible</span><h1 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">Programas de Estudios</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/85">Crea grupos en vivo, estudios autoguiados y materiales descargables. Este espacio es independiente del control académico del Aula Virtual.</p></div>
          <div className="flex flex-wrap gap-3"><button onClick={() => window.open('/programas', '_blank', 'noopener,noreferrer')} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10"><ExternalLink size={16} /> Ver página pública</button><button onClick={() => setShowCreate(true)} disabled={!schemaReady || !canEdit} className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={18} /> Nuevo programa</button></div>
        </div>
      </header>

      {!schemaReady && <div className="flex gap-3 rounded-2xl border border-amber-300/40 bg-amber-50 p-5 text-sm text-amber-950 dark:bg-amber-400/10 dark:text-amber-100"><WifiOff className="shrink-0" /><div><strong className="block">Migración pendiente</strong><p className="mt-1">Puedes consultar el contenido heredado, pero la edición completa se habilita al instalar <code>study_programs_domain</code> en Supabase.</p><button onClick={() => navigate('/admin/recursos-abiertos')} className="mt-3 font-bold underline">Abrir editor anterior temporalmente</button></div></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([{ label: 'Total', value: programs.length, icon: Layers3 }, { label: 'Publicados', value: stats.published, icon: BookOpen }, { label: 'Grupos', value: stats.groups, icon: Users }, { label: 'Autoguiados', value: stats.selfGuided, icon: GraduationCap }]).map(({ label, value, icon: StatIcon }) => {
          return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span><StatIcon size={18} className="text-blue-700 dark:text-amber-300" /></div><strong className="mt-3 block text-3xl">{value}</strong></div>;
        })}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <label className="relative block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><span className="sr-only">Buscar programas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, categoría o audiencia…" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950" /></label>
        {loading ? <div className="grid gap-4 py-6 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />)}</div> : filtered.length ? <div className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((program) => (
          <button key={`${program.source}-${program.id}`} onClick={() => program.source === 'study_programs' ? navigate(`/admin/programas/${program.id}`) : navigate(`/admin/recursos-abiertos/${program.id}`)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/60">
            <div className="h-28 bg-gradient-to-br from-blue-950 to-indigo-700">{program.cover_image_url && <img src={program.cover_image_url} alt="" className="h-full w-full object-cover opacity-75" />}</div>
            <div className="p-5"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">{typeLabels[program.program_type]}</span><span className={`h-2.5 w-2.5 rounded-full ${program.status === 'published' ? 'bg-emerald-500' : 'bg-slate-300'}`} title={program.status} /></div><h2 className="mt-3 truncate font-serif text-xl font-bold group-hover:text-blue-700 dark:group-hover:text-amber-300">{program.title}</h2><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{program.summary || 'Sin resumen todavía.'}</p><div className="mt-4 flex gap-4 text-[11px] font-semibold text-slate-500"><span>{program.lesson_count ?? 0} lecciones</span><span>{program.cohort_count ?? 0} grupos</span></div></div>
          </button>
        ))}</div> : <div className="py-16 text-center text-slate-500"><BookOpen className="mx-auto mb-3 opacity-40" size={42} />No hay programas que coincidan con la búsqueda.</div>}
      </section>

      {showCreate && <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"><form onSubmit={createProgram} className="mx-auto my-8 max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8"><div className="flex items-start justify-between"><div><span className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-amber-300">Nuevo</span><h2 className="mt-1 font-serif text-2xl font-bold">Crear programa</h2></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X /></button></div><div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-bold">Nombre<input required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: slugify(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label>
        <label className="text-sm font-bold">Tipo<select value={draft.program_type} onChange={(event) => setDraft((current) => ({ ...current, program_type: event.target.value as StudyProgramType, requires_facilitator: ['community_group', 'facilitated'].includes(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-white/10 dark:bg-slate-950">{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm font-bold">Modalidad<select value={draft.modality} onChange={(event) => setDraft((current) => ({ ...current, modality: event.target.value as StudyProgramModality }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-white/10 dark:bg-slate-950"><option value="online">En línea</option><option value="in_person">Presencial</option><option value="hybrid">Híbrido</option><option value="offline_package">Paquete sin conexión</option></select></label>
        <label className="text-sm font-bold">Acceso<select value={draft.access_type} onChange={(event) => setDraft((current) => ({ ...current, access_type: event.target.value as StudyProgramAccess }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-white/10 dark:bg-slate-950"><option value="public">Público</option><option value="account">Con cuenta</option><option value="approval">Con aprobación</option><option value="invitation">Por invitación</option></select></label>
        <label className="text-sm font-bold">Audiencia<input value={draft.audience} onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label>
        <label className="sm:col-span-2 text-sm font-bold">Resumen<textarea required value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label>
      </div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-5 py-3 text-sm font-bold">Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Creando…' : 'Crear y editar contenido'}</button></div></form></div>}
    </div>
  );
}
