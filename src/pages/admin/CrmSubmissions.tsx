import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { Button } from '../../components/ui/button';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/useAuthStore';

type SubmissionStatus = 'pending' | 'approved' | 'rejected';

interface OnboardingData {
  firstName?: string; lastName?: string; birthDate?: string; gender?: string;
  maritalStatus?: string; phone?: string; email?: string; address?: string;
  birthPlace?: string; hasDisability?: string; disabilityTypes?: string;
  medicalNotes?: string; emergencyContactName?: string; emergencyContactPhone?: string;
  isBaptized?: string; ministryInterest?: string; spiritualGifts?: string; talents?: string;
}

interface CrmSubmission {
  id: string;
  status: SubmissionStatus;
  raw_data: OnboardingData;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

type JsonRecord = Record<string, unknown>;
type Metric = [label: string, value: number, icon: LucideIcon, color: string];
const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const toText = (value: unknown) => typeof value === 'string' ? value : '';
const normalizeData = (value: unknown): OnboardingData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as JsonRecord;
  return {
    firstName: toText(source.firstName), lastName: toText(source.lastName), birthDate: toText(source.birthDate),
    gender: toText(source.gender), maritalStatus: toText(source.maritalStatus), phone: toText(source.phone),
    email: toText(source.email), address: toText(source.address), birthPlace: toText(source.birthPlace),
    hasDisability: toText(source.hasDisability), disabilityTypes: toText(source.disabilityTypes),
    medicalNotes: toText(source.medicalNotes), emergencyContactName: toText(source.emergencyContactName),
    emergencyContactPhone: toText(source.emergencyContactPhone), isBaptized: toText(source.isBaptized),
    ministryInterest: toText(source.ministryInterest), spiritualGifts: toText(source.spiritualGifts), talents: toText(source.talents),
  };
};
const formatDate = (value: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const initials = (data: OnboardingData) => `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase() || '?';

const statusLabel: Record<SubmissionStatus, string> = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };
const statusStyle: Record<SubmissionStatus, string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-200',
  approved: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200',
  rejected: 'border-rose-400/30 bg-rose-400/10 text-rose-700 dark:text-rose-200',
};

export default function CrmSubmissions() {
  const [submissions, setSubmissions] = useState<CrmSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CrmSubmission | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | SubmissionStatus>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { hasPermission } = usePermissions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const canEdit = hasPermission('members', 'edit');

  const fetchSubmissions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('crm_onboarding_submissions')
        .select('id, status, raw_data, created_at, processed_at, processed_by')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setSubmissions((data ?? []).map((row) => ({ ...row, status: row.status as SubmissionStatus, raw_data: normalizeData(row.raw_data) })));
      setLastUpdated(new Date());
    } catch (fetchError: unknown) {
      const message = `No se pudieron cargar las solicitudes: ${getErrorMessage(fetchError)}`;
      setError(message);
      if (!silent) toast.error(message);
      console.error('CRM submissions fetch failed', fetchError);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchSubmissions(); }, 0);
    const refresh = window.setInterval(() => { void fetchSubmissions(true); }, 60000);
    return () => { window.clearTimeout(timer); window.clearInterval(refresh); };
  }, [fetchSubmissions]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return submissions.filter((submission) => {
      const data = submission.raw_data;
      const haystack = [data.firstName, data.lastName, data.email, data.phone].filter(Boolean).join(' ').toLowerCase();
      return (status === 'all' || submission.status === status) && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, status, submissions]);

  const counts = useMemo(() => submissions.reduce((result, item) => ({ ...result, [item.status]: result[item.status] + 1 }), { pending: 0, approved: 0, rejected: 0 }), [submissions]);

  const exportCsv = () => {
    const rows = filtered.map((item) => [item.raw_data.firstName, item.raw_data.lastName, item.raw_data.email, item.raw_data.phone, statusLabel[item.status], item.created_at]);
    const csv = [['Nombre', 'Apellido', 'Correo', 'Teléfono', 'Estado', 'Fecha'], ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `solicitudes-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const processSubmission = async (submission: CrmSubmission, nextStatus: 'approved' | 'rejected') => {
    if (!canEdit) { toast.error('Tu rol solo permite revisar solicitudes.'); return; }
    if (submission.status !== 'pending') { toast.error('Esta solicitud ya fue procesada.'); return; }
    if (nextStatus === 'rejected' && !window.confirm('¿Confirmas rechazar esta solicitud?')) return;
    setProcessingId(submission.id);
    let createdMemberId: string | null = null;
    try {
      if (nextStatus === 'approved') {
        const email = submission.raw_data.email?.trim().toLowerCase();
        if (email) {
          const { data: existingEmail, error: lookupError } = await supabase.from('member_emails').select('member_id').eq('email', email).maybeSingle();
          if (lookupError) throw lookupError;
          if (existingEmail) throw new Error('Ya existe una persona registrada con este correo.');
        }
        const { data: newMember, error: memberError } = await supabase.from('members').insert({
          first_name: submission.raw_data.firstName?.trim() || '', last_name: submission.raw_data.lastName?.trim() || '', birth_date: submission.raw_data.birthDate || null,
          phone: submission.raw_data.phone?.trim() || '', gender: submission.raw_data.gender || null, marital_status: submission.raw_data.maritalStatus || null,
          birth_place: submission.raw_data.birthPlace || null, has_disability: submission.raw_data.hasDisability === 'true',
          disability_types: submission.raw_data.disabilityTypes ? [submission.raw_data.disabilityTypes] : [], medical_notes: submission.raw_data.medicalNotes || null,
          emergency_contact_name: submission.raw_data.emergencyContactName || null, emergency_contact_phone: submission.raw_data.emergencyContactPhone || null, baptism_date: null,
        }).select('id').single();
        if (memberError) throw memberError;
        createdMemberId = newMember.id;
        if (email) {
          const { error: emailError } = await supabase.from('member_emails').insert({ member_id: newMember.id, email });
          if (emailError) throw emailError;
        }
      }
      const { error: updateError } = await supabase.from('crm_onboarding_submissions').update({ status: nextStatus, processed_at: new Date().toISOString(), processed_by: userId }).eq('id', submission.id).eq('status', 'pending');
      if (updateError) throw updateError;
      toast.success(nextStatus === 'approved' ? 'Solicitud aprobada e importada al CRM.' : 'Solicitud rechazada.');
      setSelected(null);
      await fetchSubmissions(true);
    } catch (processError: unknown) {
      if (createdMemberId) {
        const { error: rollbackEmailError } = await supabase.from('member_emails').delete().eq('member_id', createdMemberId);
        const { error: rollbackMemberError } = await supabase.from('members').delete().eq('id', createdMemberId);
        if (rollbackEmailError || rollbackMemberError) {
          console.error('CRM submission rollback failed', { rollbackEmailError, rollbackMemberError, createdMemberId });
        }
      }
      toast.error(`No se pudo procesar la solicitud: ${getErrorMessage(processError)}`);
      console.error('CRM submission processing failed', processError);
    } finally { setProcessingId(null); }
  };

  const metrics: Metric[] = [['Total recibidas', submissions.length, UsersRound, 'text-sky-600'], ['Pendientes', counts.pending, Clock3, 'text-amber-600'], ['Aprobadas', counts.approved, CheckCircle2, 'text-emerald-600'], ['Rechazadas', counts.rejected, XCircle, 'text-rose-600']];

  return <AnimeFadeUp className="mx-auto max-w-[1600px] space-y-6">
    <AdminHeader title="Solicitudes de ingreso" description="Revisa, valida y convierte los formularios de nuevos miembros en fichas del CRM." action={<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void fetchSubmissions()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar</Button>{canEdit && <Button type="button" variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download size={16} /> Exportar</Button>}</div>} />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value, Icon, color]) => <div key={label} className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span><Icon size={20} className={color} /></div><p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{value}</p></div>)}
    </section>

    <section className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><label className="relative flex-1"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, correo o teléfono…" className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-11 pr-4 text-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" /></label><div className="flex items-center gap-2"><Filter size={16} className="text-slate-400" /><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | SubmissionStatus)} className="h-12 rounded-2xl border border-slate-200 bg-white/70 px-4 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"><option value="all">Todos los estados</option><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option></select></div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{filtered.length} solicitudes visibles</span>{lastUpdated && <span>Actualizado {lastUpdated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · sincronización automática cada minuto</span>}</div></section>

    {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-rose-300/50 bg-rose-50/80 p-4 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"><span>{error}</span><Button type="button" variant="outline" onClick={() => void fetchSubmissions()}>Reintentar</Button></div>}
    <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55">
      {loading ? <div className="grid gap-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/10" />)}</div> : filtered.length === 0 ? <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><UsersRound size={36} className="text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-800 dark:text-white">No hay solicitudes con estos filtros</h2><p className="mt-1 text-sm text-slate-500">Prueba otra búsqueda o revisa todos los estados.</p></div> : <><div className="hidden overflow-x-auto md:block"><table className="min-w-full text-left"><thead className="border-b border-slate-200/70 text-xs uppercase tracking-wider text-slate-500 dark:border-white/10"><tr><th className="px-6 py-4">Persona</th><th className="px-6 py-4">Contacto</th><th className="px-6 py-4">Recibida</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-200/60 dark:divide-white/10">{filtered.map((item) => <tr key={item.id} className="transition hover:bg-white/60 dark:hover:bg-white/5"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-sm font-black text-primary dark:text-amber-200">{initials(item.raw_data)}</span><div><p className="font-bold text-slate-800 dark:text-white">{item.raw_data.firstName} {item.raw_data.lastName}</p><p className="text-xs text-slate-500">{item.raw_data.ministryInterest || 'Sin ministerio indicado'}</p></div></div></td><td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300"><p>{item.raw_data.email || 'Sin correo'}</p><p className="text-xs text-slate-400">{item.raw_data.phone || 'Sin teléfono'}</p></td><td className="px-6 py-4 text-sm text-slate-500">{formatDate(item.created_at)}</td><td className="px-6 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle[item.status]}`}>{statusLabel[item.status]}</span></td><td className="px-6 py-4 text-right"><Button type="button" variant="ghost" onClick={() => setSelected(item)}><Eye size={16} /> Revisar</Button></td></tr>)}</tbody></table></div><div className="grid gap-3 p-4 md:hidden">{filtered.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-sm font-black text-primary">{initials(item.raw_data)}</span><div><p className="font-bold dark:text-white">{item.raw_data.firstName} {item.raw_data.lastName}</p><p className="text-xs text-slate-500">{formatDate(item.created_at)}</p></div></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyle[item.status]}`}>{statusLabel[item.status]}</span></div><div className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300"><p>{item.raw_data.email || 'Sin correo'}</p><p>{item.raw_data.phone || 'Sin teléfono'}</p></div><Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setSelected(item)}><Eye size={16} /> Revisar solicitud</Button></article>)}</div></>}
    </section>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="submission-title"><div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 shadow-2xl dark:border-white/10 dark:bg-slate-900/95"><div className="flex items-start justify-between gap-4 border-b border-slate-200/70 p-6 dark:border-white/10"><div><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 font-black text-primary">{initials(selected.raw_data)}</span><div><h2 id="submission-title" className="text-xl font-black text-slate-900 dark:text-white">{selected.raw_data.firstName} {selected.raw_data.lastName}</h2><p className="text-sm text-slate-500">Solicitud recibida {formatDate(selected.created_at)}</p></div></div></div><Button type="button" variant="ghost" onClick={() => setSelected(null)} aria-label="Cerrar revisión"><X size={20} /></Button></div><div className="flex-1 overflow-y-auto p-6"><div className="mb-6 flex items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle[selected.status]}`}>{statusLabel[selected.status]}</span>{selected.status === 'pending' && <span className="text-xs text-slate-500">Requiere revisión del equipo CRM</span>}</div><div className="grid gap-6 sm:grid-cols-2"><InfoGroup title="Datos de contacto" items={[[Mail, 'Correo', selected.raw_data.email || 'No indicado'], [Phone, 'Teléfono', selected.raw_data.phone || 'No indicado'], [UserRound, 'Dirección', selected.raw_data.address || 'No indicada']]} /><InfoGroup title="Datos personales" items={[[UserRound, 'Nacimiento', [selected.raw_data.birthDate, selected.raw_data.birthPlace].filter(Boolean).join(' · ') || 'No indicado'], [UserRound, 'Género / estado civil', [selected.raw_data.gender, selected.raw_data.maritalStatus].filter(Boolean).join(' · ') || 'No indicado'], [ShieldCheck, 'Bautismo', selected.raw_data.isBaptized === 'true' ? 'Sí' : selected.raw_data.isBaptized === 'false' ? 'No' : 'No indicado']]} /><InfoGroup title="Cuidado y emergencia" items={[[ShieldCheck, 'Discapacidad', selected.raw_data.hasDisability === 'true' ? `Sí${selected.raw_data.disabilityTypes ? ` · ${selected.raw_data.disabilityTypes}` : ''}` : 'No indicada'], [Phone, 'Contacto de emergencia', [selected.raw_data.emergencyContactName, selected.raw_data.emergencyContactPhone].filter(Boolean).join(' · ') || 'No indicado'], [ShieldCheck, 'Notas médicas', selected.raw_data.medicalNotes || 'No indicadas']]} /><InfoGroup title="Integración y servicio" items={[[UsersRound, 'Interés ministerial', selected.raw_data.ministryInterest || 'No indicado'], [ShieldCheck, 'Dones espirituales', selected.raw_data.spiritualGifts || 'No indicados'], [ShieldCheck, 'Talentos', selected.raw_data.talents || 'No indicados']]} /></div></div><div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/70 p-5 dark:border-white/10">{selected.status === 'pending' && canEdit ? <><Button type="button" variant="outline" onClick={() => void processSubmission(selected, 'rejected')} disabled={processingId !== null} className="text-rose-700"><XCircle size={16} /> Rechazar</Button><Button type="button" onClick={() => void processSubmission(selected, 'approved')} disabled={processingId !== null}>{processingId === selected.id ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />} Aprobar e importar</Button></> : <span className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} /> {canEdit ? 'Esta solicitud ya fue procesada.' : 'Tu rol permite revisar, pero no modificar.'}</span>}</div></div></div>}
  </AnimeFadeUp>;
}

function InfoGroup({ title, items }: { title: string; items: Array<[LucideIcon, string, string]> }) {
  return <section className="rounded-2xl border border-slate-200/70 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</h3><dl className="mt-4 space-y-4">{items.map(([Icon, label, value]) => <div key={label}><dt className="flex items-center gap-2 text-xs font-bold text-slate-400"><Icon size={14} /> {label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</dd></div>)}</dl></section>;
}
