import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import type { Badge, ReadingPlan } from '../../types';

type ActiveTab = 'plans' | 'badges';

interface ReadingProgressRow {
  plan_id: string;
  user_id: string;
  completed_chapters: number;
}

interface UserBadgeRow {
  badge_id: string;
  user_id: string;
}

interface PlanDraft {
  title: string;
  description: string;
  total_chapters: string;
}

interface BadgeDraft {
  name: string;
  description: string;
  image_url: string;
}

const EMPTY_PLAN: PlanDraft = { title: '', description: '', total_chapters: '' };
const EMPTY_BADGE: BadgeDraft = { name: '', description: '', image_url: '' };
const INPUT_CLASS = 'w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950 dark:text-white';

function isValidImageUrl(value: string) {
  if (!value) return true;
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function DiscipleshipManager() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('study_programs', 'edit') || hasPermission('programs', 'edit');
  const [activeTab, setActiveTab] = useState<ActiveTab>('plans');
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<ReadingProgressRow[]>([]);
  const [awards, setAwards] = useState<UserBadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(EMPTY_PLAN);
  const [badgeDraft, setBadgeDraft] = useState<BadgeDraft>(EMPTY_BADGE);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [plansResult, badgesResult, progressResult, awardsResult] = await Promise.all([
      supabase.from('reading_plans').select('id,title,description,total_chapters,created_at').order('created_at', { ascending: true }),
      supabase.from('badges').select('id,name,description,image_url,created_at').order('created_at', { ascending: true }),
      supabase.from('user_reading_progress').select('plan_id,user_id,completed_chapters'),
      supabase.from('user_badges').select('badge_id,user_id'),
    ]);

    const firstError = plansResult.error || badgesResult.error || progressResult.error || awardsResult.error;
    if (firstError) {
      console.error('No se pudo cargar el gestor de discipulado.', firstError);
      setLoadError('No pudimos cargar los planes, las insignias o sus métricas. Revisa el acceso e inténtalo de nuevo.');
    } else {
      setPlans((plansResult.data ?? []) as ReadingPlan[]);
      setBadges((badgesResult.data ?? []) as Badge[]);
      setProgress((progressResult.data ?? []) as ReadingProgressRow[]);
      setAwards((awardsResult.data ?? []) as UserBadgeRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const planMetrics = useMemo(() => {
    const result = new Map<string, { readers: number; chapters: number; completed: number }>();
    for (const plan of plans) result.set(plan.id, { readers: 0, chapters: 0, completed: 0 });
    for (const item of progress) {
      const plan = plans.find((candidate) => candidate.id === item.plan_id);
      const metric = result.get(item.plan_id);
      if (!plan || !metric) continue;
      metric.readers += 1;
      metric.chapters += item.completed_chapters;
      if (item.completed_chapters >= plan.total_chapters) metric.completed += 1;
    }
    return result;
  }, [plans, progress]);

  const badgeMetrics = useMemo(() => {
    const result = new Map<string, number>();
    for (const award of awards) result.set(award.badge_id, (result.get(award.badge_id) ?? 0) + 1);
    return result;
  }, [awards]);

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const filteredPlans = plans.filter((plan) => !normalizedQuery || `${plan.title} ${plan.description ?? ''}`.toLocaleLowerCase('es').includes(normalizedQuery));
  const filteredBadges = badges.filter((badge) => !normalizedQuery || `${badge.name} ${badge.description ?? ''}`.toLocaleLowerCase('es').includes(normalizedQuery));
  const uniqueReaders = new Set(progress.map((item) => item.user_id)).size;
  const uniqueRecipients = new Set(awards.map((item) => item.user_id)).size;
  const totalChaptersRead = progress.reduce((total, item) => total + item.completed_chapters, 0);

  const closeForm = () => {
    setShowForm(false);
    setEditingPlanId(null);
    setEditingBadgeId(null);
    setPlanDraft(EMPTY_PLAN);
    setBadgeDraft(EMPTY_BADGE);
  };

  const openNew = () => {
    if (!canEdit) return;
    closeForm();
    setShowForm(true);
  };

  const editPlan = (plan: ReadingPlan) => {
    setEditingPlanId(plan.id);
    setEditingBadgeId(null);
    setPlanDraft({ title: plan.title, description: plan.description ?? '', total_chapters: String(plan.total_chapters) });
    setShowForm(true);
  };

  const editBadge = (badge: Badge) => {
    setEditingBadgeId(badge.id);
    setEditingPlanId(null);
    setBadgeDraft({ name: badge.name, description: badge.description ?? '', image_url: badge.image_url ?? '' });
    setShowForm(true);
  };

  const savePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = planDraft.title.trim();
    const chapters = Number(planDraft.total_chapters);
    if (title.length < 3) return toast.error('El título debe tener al menos 3 caracteres.');
    if (!Number.isInteger(chapters) || chapters < 1 || chapters > 2000) return toast.error('Los capítulos deben ser un número entero entre 1 y 2000.');

    setSaving(true);
    const values = { title, description: planDraft.description.trim() || null, total_chapters: chapters };
    const result = editingPlanId
      ? await supabase.from('reading_plans').update(values).eq('id', editingPlanId)
      : await supabase.from('reading_plans').insert(values);
    setSaving(false);
    if (result.error) {
      console.error('No se pudo guardar el plan de lectura.', result.error);
      toast.error('No se pudo guardar el plan de lectura.');
      return;
    }
    toast.success(editingPlanId ? 'Plan actualizado.' : 'Plan creado.');
    closeForm();
    await loadData();
  };

  const saveBadge = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = badgeDraft.name.trim();
    const imageUrl = badgeDraft.image_url.trim();
    if (name.length < 3) return toast.error('El nombre debe tener al menos 3 caracteres.');
    if (!isValidImageUrl(imageUrl)) return toast.error('Usa una URL http(s) o una ruta interna que comience con /.');

    setSaving(true);
    const values = { name, description: badgeDraft.description.trim() || null, image_url: imageUrl || null };
    const result = editingBadgeId
      ? await supabase.from('badges').update(values).eq('id', editingBadgeId)
      : await supabase.from('badges').insert(values);
    setSaving(false);
    if (result.error) {
      console.error('No se pudo guardar la insignia.', result.error);
      toast.error(result.error.code === '23505' ? 'Ya existe una insignia con ese nombre.' : 'No se pudo guardar la insignia.');
      return;
    }
    toast.success(editingBadgeId ? 'Insignia actualizada.' : 'Insignia creada.');
    closeForm();
    await loadData();
  };

  const deletePlan = async (plan: ReadingPlan) => {
    const readers = planMetrics.get(plan.id)?.readers ?? 0;
    if (!window.confirm(`¿Eliminar “${plan.title}”?${readers ? ` También se eliminará el progreso de ${readers} participante(s).` : ''}`)) return;
    const { error } = await supabase.from('reading_plans').delete().eq('id', plan.id);
    if (error) {
      console.error('No se pudo eliminar el plan de lectura.', error);
      toast.error('No se pudo eliminar el plan de lectura.');
      return;
    }
    toast.success('Plan eliminado.');
    await loadData();
  };

  const deleteBadge = async (badge: Badge) => {
    const recipients = badgeMetrics.get(badge.id) ?? 0;
    if (!window.confirm(`¿Eliminar “${badge.name}”?${recipients ? ` También desaparecerá de ${recipients} perfil(es).` : ''}`)) return;
    const { error } = await supabase.from('badges').delete().eq('id', badge.id);
    if (error) {
      console.error('No se pudo eliminar la insignia.', error);
      toast.error('No se pudo eliminar la insignia.');
      return;
    }
    toast.success('Insignia eliminada.');
    await loadData();
  };

  return (
    <div className="space-y-6 pb-16">
      <AdminHeader
        eyebrow="Formación y crecimiento"
        title="Discipulado"
        description="Administra los planes de lectura bíblica y las insignias congregacionales desde un solo lugar."
        action={<button type="button" onClick={openNew} disabled={!canEdit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17} /> {activeTab === 'plans' ? 'Nuevo plan' : 'Nueva insignia'}</button>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Planes', value: plans.length, icon: BookOpen },
          { label: 'Lectores', value: uniqueReaders, icon: Users },
          { label: 'Capítulos leídos', value: totalChaptersRead, icon: CheckCircle2 },
          { label: 'Personas con logros', value: uniqueRecipients, icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><Icon size={18} className="text-gold" /></div>
            <strong className="mt-3 block text-3xl text-slate-900 dark:text-white">{value.toLocaleString('es-CO')}</strong>
          </div>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-950" role="tablist" aria-label="Contenido de discipulado">
            <button type="button" role="tab" aria-selected={activeTab === 'plans'} onClick={() => { setActiveTab('plans'); closeForm(); }} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeTab === 'plans' ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-church-gold-bright' : 'text-slate-500'}`}>Planes de lectura <span className="ml-1 opacity-60">{plans.length}</span></button>
            <button type="button" role="tab" aria-selected={activeTab === 'badges'} onClick={() => { setActiveTab('badges'); closeForm(); }} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeTab === 'badges' ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-church-gold-bright' : 'text-slate-500'}`}>Insignias <span className="ml-1 opacity-60">{badges.length}</span></button>
          </div>
          <label className="relative block lg:w-80"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><span className="sr-only">Buscar</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeTab === 'plans' ? 'Buscar planes…' : 'Buscar insignias…'} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-950" /></label>
        </div>

        {loadError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"><p>{loadError}</p><button type="button" onClick={() => void loadData()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-current px-4 py-2 font-bold"><RefreshCw size={15} /> Reintentar</button></div>
        ) : loading ? (
          <div className="flex min-h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 animate-spin" size={22} /> Cargando discipulado…</div>
        ) : activeTab === 'plans' ? (
          filteredPlans.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{filteredPlans.map((plan) => {
            const metric = planMetrics.get(plan.id) ?? { readers: 0, chapters: 0, completed: 0 };
            return <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50"><div className="flex items-start justify-between gap-4"><div className="rounded-xl bg-blue-50 p-3 text-primary dark:bg-blue-500/10 dark:text-blue-300"><BookOpen size={22} /></div>{canEdit && <div className="flex gap-1"><button type="button" onClick={() => editPlan(plan)} aria-label={`Editar ${plan.title}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10"><Edit3 size={16} /></button><button type="button" onClick={() => void deletePlan(plan)} aria-label={`Eliminar ${plan.title}`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={16} /></button></div>}</div><h2 className="mt-4 font-serif text-xl font-bold text-slate-900 dark:text-white">{plan.title}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{plan.description || 'Sin descripción.'}</p><div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center dark:border-white/10"><Metric value={plan.total_chapters} label="Capítulos" /><Metric value={metric.readers} label="Lectores" /><Metric value={metric.completed} label="Completados" /></div></article>;
          })}</div> : <EmptyState icon={BookOpen} text={query ? 'No hay planes que coincidan con la búsqueda.' : 'Todavía no hay planes de lectura. Crea el primero para comenzar.'} />
        ) : filteredBadges.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredBadges.map((badge) => <article key={badge.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/50"><div className="flex items-start gap-4"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{badge.image_url ? <img src={badge.image_url} alt="" className="size-full object-cover" /> : <Award size={28} />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate font-serif text-lg font-bold text-slate-900 dark:text-white">{badge.name}</h2>{canEdit && <div className="flex shrink-0"><button type="button" onClick={() => editBadge(badge)} aria-label={`Editar ${badge.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10"><Edit3 size={15} /></button><button type="button" onClick={() => void deleteBadge(badge)} aria-label={`Eliminar ${badge.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={15} /></button></div>}</div><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{badge.description || 'Sin descripción.'}</p></div></div><div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300"><Users size={15} className="text-gold" /> {badgeMetrics.get(badge.id) ?? 0} persona(s) la han obtenido</div></article>)}</div>
        ) : <EmptyState icon={Award} text={query ? 'No hay insignias que coincidan con la búsqueda.' : 'Todavía no hay insignias. Crea la primera para reconocer el progreso.'} />}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="discipleship-form-title">
          <form onSubmit={activeTab === 'plans' ? savePlan : saveBadge} className="mx-auto my-10 max-w-xl rounded-[1.75rem] bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-gold">{editingPlanId || editingBadgeId ? 'Editar' : 'Crear'}</p><h2 id="discipleship-form-title" className="mt-1 font-serif text-2xl font-bold">{activeTab === 'plans' ? 'Plan de lectura' : 'Insignia'}</h2></div><button type="button" onClick={closeForm} aria-label="Cerrar" className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X /></button></div>
            {activeTab === 'plans' ? <div className="mt-7 space-y-5"><Field label="Título"><input required maxLength={120} value={planDraft.title} onChange={(event) => setPlanDraft((current) => ({ ...current, title: event.target.value }))} className={`${INPUT_CLASS} h-12`} /></Field><Field label="Descripción"><textarea rows={4} maxLength={1000} value={planDraft.description} onChange={(event) => setPlanDraft((current) => ({ ...current, description: event.target.value }))} className={`${INPUT_CLASS} py-3`} /></Field><Field label="Cantidad de capítulos"><input required type="number" min={1} max={2000} step={1} value={planDraft.total_chapters} onChange={(event) => setPlanDraft((current) => ({ ...current, total_chapters: event.target.value }))} className={`${INPUT_CLASS} h-12`} /></Field></div> : <div className="mt-7 space-y-5"><Field label="Nombre"><input required maxLength={100} value={badgeDraft.name} onChange={(event) => setBadgeDraft((current) => ({ ...current, name: event.target.value }))} className={`${INPUT_CLASS} h-12`} /></Field><Field label="Descripción"><textarea rows={4} maxLength={600} value={badgeDraft.description} onChange={(event) => setBadgeDraft((current) => ({ ...current, description: event.target.value }))} className={`${INPUT_CLASS} py-3`} /></Field><Field label="URL de imagen (opcional)"><div className="relative"><ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input type="text" value={badgeDraft.image_url} onChange={(event) => setBadgeDraft((current) => ({ ...current, image_url: event.target.value }))} placeholder="https://… o /imagen.webp" className={`${INPUT_CLASS} h-12 pl-10`} /></div></Field></div>}
            <div className="mt-8 flex justify-end gap-3"><button type="button" onClick={closeForm} className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300">Cancelar</button><button type="submit" disabled={saving} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving && <Loader2 className="animate-spin" size={16} />}{saving ? 'Guardando…' : 'Guardar'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div><strong className="block text-lg text-slate-900 dark:text-white">{value.toLocaleString('es-CO')}</strong><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span></div>;
}

function EmptyState({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) {
  return <div className="py-16 text-center text-slate-500"><Icon className="mx-auto mb-3 opacity-40" size={42} /><p className="text-sm">{text}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">{label}<span className="mt-2 block font-normal">{children}</span></label>;
}
