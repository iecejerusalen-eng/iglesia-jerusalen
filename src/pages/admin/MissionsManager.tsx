import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Globe2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  UploadCloud,
  UsersRound,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { Button } from '../../components/ui/button';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import type { Mission } from '../../types';
import { uploadImage } from '../../utils/cloudinary';

const PAGE_SIZE = 12;
type MissionScope = NonNullable<Mission['scope']>;
type MissionStatus = Mission['status'];
type FilterStatus = 'all' | MissionStatus;
type FilterScope = 'all' | MissionScope;

interface MissionFormData {
  title: string; description: string; location: string; goal_amount: string; current_amount: string;
  status: MissionStatus; image_url: string; scope: MissionScope; country_code: string; region: string;
  city: string; is_published: boolean; start_date: string; end_date: string;
}

const emptyForm = (): MissionFormData => ({ title: '', description: '', location: '', goal_amount: '0', current_amount: '0', status: 'active', image_url: '', scope: 'local', country_code: 'EC', region: '', city: '', is_published: true, start_date: '', end_date: '' });
const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const statusLabel: Record<MissionStatus, string> = { active: 'Activa', completed: 'Completada', paused: 'Pausada' };
const scopeLabel: Record<MissionScope, string> = { local: 'Local', national: 'Ecuador', international: 'Internacional' };
const statusStyle: Record<MissionStatus, string> = { active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200', completed: 'border-blue-400/30 bg-blue-400/10 text-blue-700 dark:text-blue-200', paused: 'border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-200' };
const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)) : 'Sin fecha';

export default function MissionsManager() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FilterStatus>('all');
  const [scope, setScope] = useState<FilterScope>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<MissionFormData>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('missions', 'edit');

  const loadMissions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let query = supabase.from('missions').select('*', { count: 'exact' });
      if (search.trim()) query = query.ilike('title', `%${search.trim().replace(/[%_]/g, '')}%`);
      if (status !== 'all') query = query.eq('status', status);
      if (scope !== 'all') query = query.eq('scope', scope);
      const { data, count, error: queryError } = await query.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (queryError) throw queryError;
      setMissions((data ?? []) as Mission[]); setTotalCount(count ?? 0);
    } catch (loadError: unknown) {
      const message = `No se pudieron cargar los proyectos: ${getErrorMessage(loadError)}`;
      setError(message); toast.error(message); console.error('Missions load failed', loadError);
    } finally { setLoading(false); }
  }, [page, scope, search, status]);

  useEffect(() => { const timer = window.setTimeout(() => { void loadMissions(); }, 0); return () => window.clearTimeout(timer); }, [loadMissions]);
  const stats = useMemo(() => ({ active: missions.filter((item) => item.status === 'active').length, published: missions.filter((item) => item.is_published).length, raised: missions.reduce((sum, item) => sum + (Number(item.current_amount) || 0), 0) }), [missions]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const openForm = (mission?: Mission) => {
    if (!canEdit) { toast.error('Tu rol solo permite consultar proyectos.'); return; }
    setEditing(mission ?? null);
    setIsFormOpen(true);
    setFile(null);
    setForm(mission ? { title: mission.title, description: mission.description ?? '', location: mission.location ?? '', goal_amount: String(mission.goal_amount ?? 0), current_amount: String(mission.current_amount ?? 0), status: mission.status, image_url: mission.image_url ?? '', scope: mission.scope ?? 'local', country_code: mission.country_code ?? 'EC', region: mission.region ?? '', city: mission.city ?? '', is_published: mission.is_published ?? true, start_date: mission.start_date ?? '', end_date: mission.end_date ?? '' } : emptyForm());
  };

  const saveMission = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) { toast.error('No tienes permisos para modificar misiones.'); return; }
    if (!form.title.trim()) { toast.error('El título es obligatorio.'); return; }
    setSaving(true);
    try {
      let imageUrl = form.image_url.trim() || null;
      if (file) { toast.loading('Subiendo imagen…', { id: 'mission-upload' }); imageUrl = (await uploadImage(file, 'missions')).secure_url; toast.dismiss('mission-upload'); }
      const payload = { title: form.title.trim(), description: form.description.trim() || null, location: form.location.trim() || null, goal_amount: Math.max(0, Number(form.goal_amount) || 0), current_amount: Math.max(0, Number(form.current_amount) || 0), status: form.status, image_url: imageUrl, scope: form.scope, country_code: form.country_code.trim().toUpperCase() || null, region: form.region.trim() || null, city: form.city.trim() || null, is_published: form.is_published, start_date: form.start_date || null, end_date: form.end_date || null };
      const result = editing ? await supabase.from('missions').update(payload).eq('id', editing.id) : await supabase.from('missions').insert(payload);
      if (result.error) throw result.error;
      toast.success(editing ? 'Proyecto actualizado.' : 'Proyecto creado.'); setEditing(null); setIsFormOpen(false); await loadMissions();
    } catch (saveError: unknown) { toast.dismiss('mission-upload'); toast.error(`No se pudo guardar el proyecto: ${getErrorMessage(saveError)}`); console.error('Mission save failed', saveError); }
    finally { setSaving(false); }
  };

  const deleteMission = async (mission: Mission) => {
    if (!canEdit) { toast.error('No tienes permisos para eliminar proyectos.'); return; }
    if (!window.confirm(`¿Eliminar “${mission.title}”? Esta acción no se puede deshacer.`)) return;
    setDeletingId(mission.id);
    try { const { error: deleteError } = await supabase.from('missions').delete().eq('id', mission.id); if (deleteError) throw deleteError; toast.success('Proyecto eliminado.'); await loadMissions(); }
    catch (deleteError: unknown) { toast.error(`No se pudo eliminar: ${getErrorMessage(deleteError)}`); console.error('Mission delete failed', deleteError); }
    finally { setDeletingId(null); }
  };

  return <AnimeFadeUp className="mx-auto max-w-[1600px] space-y-6">
    <AdminHeader title="Centro de misiones" description="Organiza proyectos, destinos, objetivos y avances de la obra misionera." action={canEdit ? <Button type="button" onClick={() => openForm()}><Plus size={17} /> Nuevo proyecto</Button> : undefined} />
    <section className="grid gap-4 sm:grid-cols-3"><StatCard label="Proyectos visibles" value={totalCount} icon={Globe2} tone="text-sky-600" /><StatCard label="Proyectos activos" value={stats.active} icon={Target} tone="text-emerald-600" /><StatCard label="Fondos registrados" value={money(stats.raised)} icon={UsersRound} tone="text-amber-600" /></section>
    <section className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Buscar por título…" className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-11 pr-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" /></label><select value={status} onChange={(event) => { setStatus(event.target.value as FilterStatus); setPage(0); }} className="h-12 rounded-2xl border border-slate-200 bg-white/70 px-4 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"><option value="all">Todos los estados</option><option value="active">Activas</option><option value="paused">Pausadas</option><option value="completed">Completadas</option></select><select value={scope} onChange={(event) => { setScope(event.target.value as FilterScope); setPage(0); }} className="h-12 rounded-2xl border border-slate-200 bg-white/70 px-4 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"><option value="all">Todos los ámbitos</option><option value="local">Local</option><option value="national">Ecuador</option><option value="international">Internacional</option></select><Button type="button" variant="outline" onClick={() => void loadMissions()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar</Button></div><p className="mt-3 text-xs text-slate-500">{totalCount} proyectos encontrados · {stats.published} publicados en esta página</p></section>
    {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-rose-300/50 bg-rose-50/80 p-4 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"><span>{error}</span><Button type="button" variant="outline" onClick={() => void loadMissions()}>Reintentar</Button></div>}
    <section className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55">{loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-white/10" />)}</div> : missions.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><Target size={42} className="text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-800 dark:text-white">No hay proyectos con estos filtros</h2><p className="mt-1 text-sm text-slate-500">Prueba otra búsqueda o crea el primer proyecto.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{missions.map((mission) => <MissionCard key={mission.id} mission={mission} canEdit={canEdit} deleting={deletingId === mission.id} onEdit={() => openForm(mission)} onDelete={() => void deleteMission(mission)} />)}</div>} {!loading && totalPages > 1 && <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 pt-4 text-xs text-slate-500 dark:border-white/10"><span>Página {page + 1} de {totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}><ChevronLeft size={16} /></Button><Button type="button" variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}><ChevronRight size={16} /></Button></div></div>}</section>
    {isFormOpen ? <MissionForm form={form} setForm={setForm} file={file} setFile={setFile} editing={editing} saving={saving} onSubmit={saveMission} onClose={() => { setEditing(null); setIsFormOpen(false); }} /> : null}
  </AnimeFadeUp>;
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Globe2; tone: string }) { return <div className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span><Icon size={20} className={tone} /></div><p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{value}</p></div>; }

function MissionCard({ mission, canEdit, deleting, onEdit, onDelete }: { mission: Mission; canEdit: boolean; deleting: boolean; onEdit: () => void; onDelete: () => void }) {
  const goal = Number(mission.goal_amount) || 0; const current = Number(mission.current_amount) || 0; const percent = goal ? Math.min(100, Math.round(current / goal * 100)) : 0;
  return <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/5"><div className="relative aspect-[16/8] overflow-hidden bg-slate-100 dark:bg-slate-800">{mission.image_url ? <img src={mission.image_url} alt={mission.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Globe2 size={42} className="text-slate-300" /></div>}<div className="absolute left-4 top-4 flex gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyle[mission.status]}`}>{statusLabel[mission.status]}</span><span className="rounded-full border border-white/50 bg-slate-950/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{scopeLabel[mission.scope ?? 'local']}</span></div>{mission.is_published === false && <span className="absolute bottom-3 left-4 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-bold text-white">Borrador</span>}</div><div className="p-5"><p className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"><MapPin size={14} />{mission.location || mission.city || 'Ubicación por confirmar'}</p><h2 className="mt-2 line-clamp-2 text-xl font-black text-slate-900 dark:text-white">{mission.title}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{mission.description || 'Sin descripción publicada.'}</p><div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={14} />{formatDate(mission.start_date)} {mission.end_date ? `→ ${formatDate(mission.end_date)}` : ''}</div>{goal > 0 && <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-bold"><span className="text-emerald-700 dark:text-emerald-300">{money(current)}</span><span className="text-slate-500">{percent}% de {money(goal)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500" style={{ width: `${percent}%` }} /></div></div>} {canEdit && <div className="mt-5 flex gap-2 border-t border-slate-200/70 pt-4 dark:border-white/10"><Button type="button" variant="outline" className="flex-1" onClick={onEdit}><Edit3 size={15} /> Editar</Button><Button type="button" variant="ghost" size="icon" className="text-rose-600" onClick={onDelete} disabled={deleting} aria-label={`Eliminar ${mission.title}`}>{deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}</Button></div>}</div></article>;
}

function MissionForm({ form, setForm, file, setFile, editing, saving, onSubmit, onClose }: { form: MissionFormData; setForm: React.Dispatch<React.SetStateAction<MissionFormData>>; file: File | null; setFile: React.Dispatch<React.SetStateAction<File | null>>; editing: Mission | null; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const update = <K extends keyof MissionFormData>(key: K, value: MissionFormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-2xl dark:border-white/10 dark:bg-slate-900/95"><div className="flex items-center justify-between border-b border-slate-200/70 p-6 dark:border-white/10"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-600">Centro de misiones</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{editing ? 'Editar proyecto' : 'Nuevo proyecto misionero'}</h2></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar formulario"><X size={20} /></Button></div><form onSubmit={onSubmit} className="overflow-y-auto p-6"><div className="grid gap-5 sm:grid-cols-2"><Field label="Título" required className="sm:col-span-2"><input required value={form.title} onChange={(event) => update('title', event.target.value)} className="input-glass" placeholder="Ej. Apoyo a misioneros en la Amazonía" /></Field><Field label="Descripción" className="sm:col-span-2"><textarea rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} className="input-glass" placeholder="Explica el propósito, alcance y próximos pasos…" /></Field><Field label="Ubicación"><input value={form.location} onChange={(event) => update('location', event.target.value)} className="input-glass" placeholder="Ciudad, país" /></Field><Field label="Ámbito"><select value={form.scope} onChange={(event) => update('scope', event.target.value as MissionScope)} className="input-glass"><option value="local">Local</option><option value="national">Ecuador</option><option value="international">Internacional</option></select></Field><Field label="País (código)"><input maxLength={3} value={form.country_code} onChange={(event) => update('country_code', event.target.value)} className="input-glass" placeholder="EC" /></Field><Field label="Región / provincia"><input value={form.region} onChange={(event) => update('region', event.target.value)} className="input-glass" /></Field><Field label="Ciudad"><input value={form.city} onChange={(event) => update('city', event.target.value)} className="input-glass" /></Field><Field label="Estado"><select value={form.status} onChange={(event) => update('status', event.target.value as MissionStatus)} className="input-glass"><option value="active">Activa</option><option value="paused">Pausada</option><option value="completed">Completada</option></select></Field><Field label="Meta (USD)"><input type="number" min="0" step="0.01" value={form.goal_amount} onChange={(event) => update('goal_amount', event.target.value)} className="input-glass" /></Field><Field label="Recaudado (USD)"><input type="number" min="0" step="0.01" value={form.current_amount} onChange={(event) => update('current_amount', event.target.value)} className="input-glass" /></Field><Field label="Inicio"><input type="date" value={form.start_date} onChange={(event) => update('start_date', event.target.value)} className="input-glass" /></Field><Field label="Cierre"><input type="date" value={form.end_date} onChange={(event) => update('end_date', event.target.value)} className="input-glass" /></Field><Field label="Imagen"><label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 text-sm text-slate-500 dark:border-white/15 dark:bg-white/5"><UploadCloud size={17} />{file?.name || 'Seleccionar imagen'}<input type="file" accept="image/*" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label></Field><Field label="URL de imagen"><input value={form.image_url} onChange={(event) => update('image_url', event.target.value)} className="input-glass" placeholder="https://…" /></Field></div><label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/50 p-4 text-sm font-semibold dark:border-white/10 dark:bg-white/5 dark:text-white"><input type="checkbox" checked={form.is_published} onChange={(event) => update('is_published', event.target.checked)} className="h-4 w-4 accent-emerald-600" /><span><span className="block">Publicar en el sitio</span><span className="text-xs font-normal text-slate-500">Si está desactivado, queda guardado como borrador.</span></span></label><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} {editing ? 'Guardar cambios' : 'Crear proyecto'}</Button></div></form></div></div>;
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) { return <label className={`block ${className ?? ''}`}><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}{required ? ' *' : ''}</span>{children}</label>; }
