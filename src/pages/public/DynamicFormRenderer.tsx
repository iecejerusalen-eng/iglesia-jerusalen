import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { DynamicForm, DynamicFormField } from '../../features/competitive/types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { useAuthStore } from '../../store/useAuthStore';

type FormValue = string | boolean;
const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10';

function PublicField({ field, value, onChange }: { field: DynamicFormField; value: FormValue | undefined; onChange: (value: FormValue) => void }) {
  if (field.type === 'heading') return <div className="border-b border-white/10 pb-2 pt-3"><h2 className="font-serif text-xl font-bold text-white">{field.label}</h2></div>;
  if (field.type === 'paragraph') return <p className="text-sm leading-7 text-slate-400">{field.helpText || field.label}</p>;
  const label = <label className="block text-sm font-bold text-slate-200">{field.label} {field.required && <span className="text-rose-400">*</span>}</label>;
  const help = field.helpText && <p className="text-xs leading-5 text-slate-500">{field.helpText}</p>;
  if (field.type === 'checkbox') return <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300"><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} required={field.required} className="mt-1 size-4 accent-amber-400" /><span>{field.placeholder || field.label}{field.required && <span className="ml-1 text-rose-400">*</span>}</span></label>;
  if (field.type === 'radio') return <div className="space-y-2">{label}{help}<div className="grid gap-2 sm:grid-cols-2">{(field.options ?? []).map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-300 hover:border-amber-400/60"><input type="radio" name={field.id} value={option} checked={value === option} onChange={(event) => onChange(event.target.value)} required={field.required} className="accent-amber-400" />{option}</label>)}</div></div>;
  if (field.type === 'select') return <div className="space-y-2">{label}{help}<select value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} required={field.required} className={inputClass}><option value="">{field.placeholder || 'Selecciona una opción'}</option>{(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
  if (field.type === 'textarea') return <div className="space-y-2">{label}{help}<textarea rows={5} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} required={field.required} placeholder={field.placeholder} maxLength={field.maxLength} className={`${inputClass} resize-y`} /></div>;
  const type = field.type === 'phone' ? 'tel' : field.type;
  return <div className="space-y-2">{label}{help}<input type={type} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} required={field.required} placeholder={field.placeholder} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength} className={inputClass} /></div>;
}

const isFieldVisible = (field: DynamicFormField, values: Record<string, FormValue>) => (field.conditions ?? []).every((condition) => {
  const current = values[condition.fieldId];
  if (condition.operator === 'is_true') return current === true;
  if (typeof current !== 'string') return false;
  if (condition.operator === 'contains') return current.toLocaleLowerCase('es').includes((condition.value ?? '').toLocaleLowerCase('es'));
  if (condition.operator === 'not_equals') return current !== condition.value;
  return current === condition.value;
});

export const DynamicFormRenderer = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState<DynamicForm | null>(null);
  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collectContact = form?.settings?.collectSubmitterInfo !== false;
  const emailRequired = form?.settings?.submitterEmailRequired !== false;

  useEffect(() => { let active = true; const load = async () => { try { const forms = await competitiveService.getDynamicForms(); const target = forms.find((item) => item.id === formId || item.slug === formId) ?? null; if (active) { setForm(target); if (!target) setError('No encontramos este formulario o ya no está publicado.'); } } catch (err) { if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el formulario.'); } finally { if (active) setLoading(false); } }; void load(); return () => { active = false; }; }, [formId]);
  const handleSubmit = async (event: React.FormEvent) => { event.preventDefault(); if (!form) return; try { await competitiveService.submitForm(form.id, submitterName, submitterEmail, formData); setSubmitted(true); } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudieron enviar tus respuestas.'); } };
  const handleFieldChange = (fieldId: string, value: FormValue) => setFormData((current) => ({ ...current, [fieldId]: value }));

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-sm text-slate-400">Cargando formulario…</div>;
  if (error || !form) return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-center text-sm text-slate-400"><div><FileText className="mx-auto mb-3 text-amber-400" /><p>{error || 'Formulario no disponible.'}</p><button type="button" onClick={() => navigate('/')} className="mt-5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950">Volver al inicio</button></div></div>;
  if (form.requires_auth && !user) return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-center text-white"><div className="max-w-sm"><FileText className="mx-auto mb-4 text-amber-400" size={30} /><h1 className="text-xl font-bold">Este formulario requiere iniciar sesión</h1><p className="mt-2 text-sm text-slate-400">Ingresa a tu cuenta para continuar.</p><button type="button" onClick={() => navigate('/login')} className="mt-5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950">Iniciar sesión</button></div></div>;
  if (submitted) return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white"><AnimeFadeUp className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-8 text-center shadow-2xl"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 size={32} /></div><h2 className="mt-5 text-2xl font-extrabold">{form.settings?.successTitle || '¡Formulario enviado!'}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{form.settings?.successMessage || `Gracias por completar ${form.title}.`}</p><button type="button" onClick={() => navigate('/')} className="mt-6 w-full rounded-xl bg-amber-400 py-3 text-sm font-black text-slate-950">Volver al inicio</button></AnimeFadeUp></div>;

  return <div className="min-h-screen bg-slate-950 px-4 pb-16 pt-24 text-white sm:px-6"><div className="mx-auto max-w-2xl"><button type="button" onClick={() => navigate(-1)} className="mb-5 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><ArrowLeft size={15} /> Volver</button><AnimeFadeUp className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl"><div className="border-b border-white/10 p-6 sm:p-9">{form.cover_image_url && <img src={form.cover_image_url} alt="" className="mb-6 h-40 w-full rounded-2xl object-cover" />}<span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300"><FileText size={13} /> Formulario oficial</span><h1 className="mt-4 font-serif text-3xl font-extrabold sm:text-4xl">{form.title}</h1>{form.description && <p className="mt-3 text-sm leading-7 text-slate-400">{form.description}</p>}</div><form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-9">{collectContact && <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-bold text-slate-200">Nombre completo <span className="text-rose-400">*</span><input type="text" required value={submitterName} onChange={(event) => setSubmitterName(event.target.value)} placeholder="Tu nombre completo" className={inputClass} /></label><label className="space-y-2 text-sm font-bold text-slate-200">Correo electrónico {emailRequired && <span className="text-rose-400">*</span>}<input type="email" required={emailRequired} value={submitterEmail} onChange={(event) => setSubmitterEmail(event.target.value)} placeholder="correo@ejemplo.com" className={inputClass} /></label></div>}{form.fields.filter((field) => isFieldVisible(field, formData)).map((field) => <PublicField key={field.id} field={field} value={formData[field.id]} onChange={(value) => handleFieldChange(field.id, value)} />)}<button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"><Send size={16} /> {form.settings?.submitLabel || 'Enviar respuestas'}</button></form></AnimeFadeUp></div></div>;
};

export default DynamicFormRenderer;
