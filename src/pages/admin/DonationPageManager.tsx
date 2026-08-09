import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CircleDollarSign,
  ExternalLink,
  Eye,
  FileCheck2,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Tag,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import type { Donation, DonationCategory } from '../../types';
import { DEFAULT_DONATION_PAGE_CONFIG, parseDonationPageConfig, type DonationPageConfig } from '../../features/donations/types';

type ManagerTab = 'content' | 'bank' | 'review';

interface DonationSettingsForm {
  phone: string;
  email: string;
  bank_name: string;
  bank_account: string;
  ruc: string;
  config: DonationPageConfig;
}

const EMPTY_FORM: DonationSettingsForm = {
  phone: '',
  email: '',
  bank_name: '',
  bank_account: '',
  ruc: '',
  config: DEFAULT_DONATION_PAGE_CONFIG,
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function FormField({ label, value, onChange, multiline = false, hint }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; hint?: string }) {
  const classes = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white';
  return (
    <label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>{hint && <span className="ml-2 text-[10px] text-slate-400">{hint}</span>}{multiline ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className={`${classes} resize-y`} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={classes} />}</label>
  );
}

export default function DonationPageManager() {
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('finances', 'edit');
  const [activeTab, setActiveTab] = useState<ManagerTab>('content');
  const [form, setForm] = useState<DonationSettingsForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResult, categoriesResult, donationsResult] = await Promise.all([
        supabase.from('church_settings').select('phone, email, bank_name, bank_account, ruc, donation_page_config').eq('id', 1).single(),
        supabase.from('donation_categories').select('*').order('name'),
        supabase.from('donations').select('*, donation_categories(id, name, description, is_active, created_at)').order('created_at', { ascending: false }).limit(50),
      ]);
      if (settingsResult.error) throw settingsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (donationsResult.error) throw donationsResult.error;
      if (!settingsResult.data) throw new Error('No se encontró la configuración principal de la iglesia.');

      setForm({
        phone: typeof settingsResult.data.phone === 'string' ? settingsResult.data.phone : '',
        email: typeof settingsResult.data.email === 'string' ? settingsResult.data.email : '',
        bank_name: typeof settingsResult.data.bank_name === 'string' ? settingsResult.data.bank_name : '',
        bank_account: typeof settingsResult.data.bank_account === 'string' ? settingsResult.data.bank_account : '',
        ruc: typeof settingsResult.data.ruc === 'string' ? settingsResult.data.ruc : '',
        config: parseDonationPageConfig(settingsResult.data.donation_page_config),
      });
      setCategories((categoriesResult.data || []) as DonationCategory[]);
      setDonations((donationsResult.data || []) as Donation[]);
    } catch (caughtError: unknown) {
      console.error('Error loading donation page manager:', caughtError);
      toast.error(`No se pudo cargar la gestión de donaciones: ${errorMessage(caughtError)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const updateConfig = <Key extends keyof DonationPageConfig>(key: Key, value: DonationPageConfig[Key]) => {
    setForm((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  };

  const saveSettings = async () => {
    if (!canEdit) {
      toast.error('Tu cuenta tiene acceso de lectura, pero no permiso para editar Finanzas.');
      return;
    }
    const requiredValues = [form.bank_name, form.bank_account, form.ruc, form.phone, form.config.beneficiary, form.config.title];
    if (requiredValues.some((value) => !value.trim())) {
      toast.error('Completa título, beneficiario, banco, cuenta, RUC y teléfono antes de guardar.');
      return;
    }
    if (form.config.preset_amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
      toast.error('Todos los montos sugeridos deben ser mayores que cero.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('church_settings').upsert({
        id: 1,
        phone: form.phone.trim(),
        email: form.email.trim(),
        bank_name: form.bank_name.trim(),
        bank_account: form.bank_account.trim(),
        ruc: form.ruc.trim(),
        donation_page_config: form.config,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Página pública de donaciones actualizada.');
    } catch (caughtError: unknown) {
      console.error('Error saving donation page settings:', caughtError);
      toast.error(`No se pudo guardar: ${errorMessage(caughtError)}`);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    if (!canEdit) {
      toast.error('No tienes permiso para crear destinos de aportación.');
      return;
    }
    const name = newCategoryName.trim();
    if (!name) return;
    setActionId('new-category');
    try {
      const { error } = await supabase.from('donation_categories').insert({ name, description: newCategoryDescription.trim() || null, is_active: true });
      if (error) throw error;
      setNewCategoryName('');
      setNewCategoryDescription('');
      toast.success('Destino de aportación creado.');
      await loadData();
    } catch (caughtError: unknown) {
      console.error('Error creating donation category:', caughtError);
      toast.error(`No se pudo crear el destino: ${errorMessage(caughtError)}`);
    } finally {
      setActionId(null);
    }
  };

  const toggleCategory = async (category: DonationCategory) => {
    if (!canEdit) {
      toast.error('No tienes permiso para cambiar destinos de aportación.');
      return;
    }
    setActionId(category.id);
    try {
      const { error } = await supabase.from('donation_categories').update({ is_active: !category.is_active }).eq('id', category.id);
      if (error) throw error;
      setCategories((current) => current.map((item) => item.id === category.id ? { ...item, is_active: !item.is_active } : item));
      toast.success(`Destino ${category.is_active ? 'ocultado' : 'publicado'} correctamente.`);
    } catch (caughtError: unknown) {
      console.error('Error updating donation category visibility:', caughtError);
      toast.error(`No se pudo cambiar el destino: ${errorMessage(caughtError)}`);
    } finally {
      setActionId(null);
    }
  };

  const updateDonationStatus = async (donation: Donation, status: 'completed' | 'failed') => {
    if (!canEdit) {
      toast.error('No tienes permiso para verificar aportes.');
      return;
    }
    setActionId(donation.id);
    try {
      const { error } = await supabase.from('donations').update({
        status,
        verified_at: new Date().toISOString(),
        verified_by: user?.id || null,
      }).eq('id', donation.id);
      if (error) throw error;
      setDonations((current) => current.map((item) => item.id === donation.id ? { ...item, status, verified_at: new Date().toISOString(), verified_by: user?.id || null } : item));
      toast.success(status === 'completed' ? 'Aporte verificado como recibido.' : 'Registro marcado como no recibido.');
    } catch (caughtError: unknown) {
      console.error('Error updating donation status:', caughtError);
      toast.error(`No se pudo actualizar el aporte: ${errorMessage(caughtError)}`);
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = donations.filter((donation) => donation.status === 'pending').length;
  const activeCategories = categories.filter((category) => category.is_active).length;
  const readiness = useMemo(() => [form.config.title, form.config.beneficiary, form.bank_name, form.bank_account, form.ruc, form.phone].filter((value) => value.trim()).length, [form]);

  if (loading) return <div className="space-y-5"><div className="h-20 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/5" /><div className="h-[34rem] animate-pulse rounded-[2rem] bg-slate-200/60 dark:bg-white/5" /></div>;

  const tabs: Array<{ id: ManagerTab; label: string; icon: typeof Settings2; badge?: number }> = [
    { id: 'content', label: 'Página pública', icon: Settings2 },
    { id: 'bank', label: 'Cuenta y destinos', icon: Landmark, badge: activeCategories },
    { id: 'review', label: 'Verificación', icon: FileCheck2, badge: pendingCount },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader title="Donaciones y aportaciones" description="Edita la página pública, administra los destinos y verifica las transferencias reportadas desde un solo lugar." action={<div className="flex gap-2"><Link to="/donations" target="_blank" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"><Eye size={15} /> Ver página <ExternalLink size={12} /></Link>{canEdit && <button type="button" onClick={() => void saveSettings()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar</button>}</div>} />

      {!canEdit && <div className="rounded-2xl border border-amber-300/50 bg-amber-500/10 p-4 text-xs leading-5 text-amber-800 dark:text-amber-200">Tu permiso de Finanzas es de solo lectura. Puedes revisar la configuración y los aportes, pero las acciones de guardado y verificación están deshabilitadas.</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Configuración</span><strong className="mt-1 block text-2xl text-primary dark:text-white">{readiness}/6</strong><span className="text-xs text-slate-400">campos esenciales completos</span></div>
        <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Destinos públicos</span><strong className="mt-1 block text-2xl text-primary dark:text-white">{activeCategories}</strong><span className="text-xs text-slate-400">de {categories.length} configurados</span></div>
        <div className={`rounded-2xl border p-4 ${pendingCount > 0 ? 'border-amber-300/50 bg-amber-500/10' : 'border-emerald-300/40 bg-emerald-500/10'}`}><span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Por verificar</span><strong className="mt-1 block text-2xl text-primary dark:text-white">{pendingCount}</strong><span className="text-xs text-slate-500 dark:text-slate-400">registros pendientes</span></div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}><tab.icon size={15} />{tab.label}{tab.badge !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'}`}>{tab.badge}</span>}</button>)}</div>

      {activeTab === 'content' && (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white/75 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <div><h2 className="font-serif text-xl font-bold text-primary dark:text-white">Contenido y mensaje</h2><p className="mt-1 text-xs text-slate-400">Estos textos se publican inmediatamente después de guardar.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><FormField label="Etiqueta superior" value={form.config.eyebrow} onChange={(value) => updateConfig('eyebrow', value)} /><FormField label="Referencia bíblica" value={form.config.verse_reference} onChange={(value) => updateConfig('verse_reference', value)} /></div>
            <FormField label="Título principal" value={form.config.title} onChange={(value) => updateConfig('title', value)} />
            <FormField label="Descripción" value={form.config.description} onChange={(value) => updateConfig('description', value)} multiline />
            <FormField label="Versículo" value={form.config.verse} onChange={(value) => updateConfig('verse', value)} multiline />
            <div className="grid gap-4 sm:grid-cols-2"><FormField label="Título de transparencia" value={form.config.transparency_title} onChange={(value) => updateConfig('transparency_title', value)} /><FormField label="Nombre del contacto" value={form.config.whatsapp_label} onChange={(value) => updateConfig('whatsapp_label', value)} /></div>
            <FormField label="Mensaje de transparencia" value={form.config.transparency_text} onChange={(value) => updateConfig('transparency_text', value)} multiline />
            <div className="grid gap-3 sm:grid-cols-2"><label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><span><strong className="block text-sm text-slate-700 dark:text-white">Recibir transferencias</strong><span className="text-[11px] text-slate-400">Habilita el formulario público.</span></span><input type="checkbox" checked={form.config.transfer_enabled} onChange={(event) => updateConfig('transfer_enabled', event.target.checked)} className="h-5 w-5 accent-primary" /></label><label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><span><strong className="block text-sm text-slate-700 dark:text-white">Mostrar voluntariado</strong><span className="text-[11px] text-slate-400">Enlace adicional de servicio.</span></span><input type="checkbox" checked={form.config.volunteer_enabled} onChange={(event) => updateConfig('volunteer_enabled', event.target.checked)} className="h-5 w-5 accent-primary" /></label></div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white/75 p-6 dark:border-white/10 dark:bg-slate-900/70"><h2 className="font-serif text-lg font-bold text-primary dark:text-white">Montos sugeridos</h2><p className="mt-1 text-xs text-slate-400">Hasta seis opciones positivas.</p><div className="mt-4 grid grid-cols-2 gap-3">{form.config.preset_amounts.map((amount, index) => <label key={index} className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span><input type="number" min="1" value={amount} onChange={(event) => updateConfig('preset_amounts', form.config.preset_amounts.map((current, currentIndex) => currentIndex === index ? Number(event.target.value) : current))} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm font-bold dark:border-white/10 dark:bg-white/5 dark:text-white" /></label>)}</div></div>
            <div className="rounded-[2rem] border border-slate-200 bg-white/75 p-6 dark:border-white/10 dark:bg-slate-900/70"><h2 className="font-serif text-lg font-bold text-primary dark:text-white">Instrucciones</h2><div className="mt-4 space-y-3">{form.config.transfer_instructions.map((instruction, index) => <div key={index} className="flex gap-2"><span className="mt-2.5 text-xs font-black text-church-gold-dark">{index + 1}</span><textarea rows={2} value={instruction} onChange={(event) => updateConfig('transfer_instructions', form.config.transfer_instructions.map((current, currentIndex) => currentIndex === index ? event.target.value : current))} className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-white/5 dark:text-white" /></div>)}</div></div>
          </aside>
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white/75 p-6 dark:border-white/10 dark:bg-slate-900/70"><div><h2 className="font-serif text-xl font-bold text-primary dark:text-white">Cuenta y contacto</h2><p className="mt-1 text-xs text-slate-400">Es la misma información global usada por la página pública.</p></div><div className="grid gap-4 sm:grid-cols-2"><FormField label="Banco" value={form.bank_name} onChange={(value) => setForm((current) => ({ ...current, bank_name: value }))} /><FormField label="Tipo de cuenta" value={form.config.account_type} onChange={(value) => updateConfig('account_type', value)} /></div><FormField label="Número de cuenta" value={form.bank_account} onChange={(value) => setForm((current) => ({ ...current, bank_account: value }))} /><FormField label="Beneficiario" value={form.config.beneficiary} onChange={(value) => updateConfig('beneficiary', value)} /><div className="grid gap-4 sm:grid-cols-2"><FormField label="RUC / CI" value={form.ruc} onChange={(value) => setForm((current) => ({ ...current, ruc: value }))} /><FormField label="Teléfono / WhatsApp" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} /></div><FormField label="Correo institucional" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} /></section>
          <section className="rounded-[2rem] border border-slate-200 bg-white/75 p-6 dark:border-white/10 dark:bg-slate-900/70"><div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-xl font-bold text-primary dark:text-white">Destinos del aporte</h2><p className="mt-1 text-xs text-slate-400">Solo los activos aparecen en la página pública.</p></div><Tag size={20} className="text-church-gold-dark" /></div><div className="mt-5 grid gap-2 sm:grid-cols-[0.8fr_1.2fr_auto]"><input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Nombre" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-white/10 dark:bg-white/5 dark:text-white" /><input value={newCategoryDescription} onChange={(event) => setNewCategoryDescription(event.target.value)} placeholder="Descripción" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-white/10 dark:bg-white/5 dark:text-white" /><button type="button" onClick={() => void addCategory()} disabled={!newCategoryName.trim() || actionId === 'new-category'} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{actionId === 'new-category' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar</button></div><div className="mt-5 space-y-2">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-white/[0.03]"><div className="min-w-0"><strong className="block text-sm text-slate-700 dark:text-white">{category.name}</strong><span className="block truncate text-[11px] text-slate-400">{category.description || 'Sin descripción'}</span></div><button type="button" onClick={() => void toggleCategory(category)} disabled={actionId === category.id} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider ${category.is_active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>{actionId === category.id ? <Loader2 size={13} className="animate-spin" /> : category.is_active ? 'Publicado' : 'Oculto'}</button></div>)}</div></section>
        </div>
      )}

      {activeTab === 'review' && (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-900/70"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-serif text-xl font-bold text-primary dark:text-white">Últimos aportes registrados</h2><p className="mt-1 text-xs text-slate-400">Verificar confirma una conciliación administrativa; registrar no equivale a recibir dinero.</p></div><button type="button" onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 dark:border-white/10"><RefreshCw size={14} /> Actualizar</button></div>{donations.length === 0 ? <div className="py-16 text-center text-sm text-slate-400"><CircleDollarSign className="mx-auto mb-2 opacity-50" size={28} />No existen aportes registrados.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:bg-white/5"><tr><th className="px-5 py-3">Referencia</th><th className="px-5 py-3">Donante</th><th className="px-5 py-3">Destino</th><th className="px-5 py-3">Monto</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">{donations.map((donation) => <tr key={donation.id} className="text-xs"><td className="px-5 py-4 font-mono font-bold text-primary dark:text-blue-300">{donation.id.slice(0, 8).toUpperCase()}</td><td className="px-5 py-4"><strong className="block text-slate-700 dark:text-white">{donation.donor_name || 'Sin nombre'}</strong><span className="text-[10px] text-slate-400">{donation.donor_email}</span></td><td className="px-5 py-4 text-slate-500 dark:text-slate-300">{donation.category_name_backup || donation.donation_categories?.name || 'Sin categoría'}</td><td className="px-5 py-4 text-sm font-black text-slate-800 dark:text-white">${Number(donation.amount).toFixed(2)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${donation.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : donation.status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>{donation.status === 'completed' ? 'Verificado' : donation.status === 'failed' ? 'No recibido' : 'Pendiente'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{donation.status === 'pending' && <><button type="button" onClick={() => void updateDonationStatus(donation, 'completed')} disabled={actionId === donation.id} className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300" title="Verificar como recibido">{actionId === donation.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}</button><button type="button" onClick={() => void updateDonationStatus(donation, 'failed')} disabled={actionId === donation.id} className="rounded-xl bg-red-500/10 p-2 text-red-600 dark:text-red-300" title="Marcar como no recibido"><X size={15} /></button></>}</div></td></tr>)}</tbody></table></div>}</section>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-blue-200/60 bg-blue-50/60 p-4 text-xs leading-5 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200"><AlertCircle size={16} className="mt-0.5 shrink-0" /><span>Las credenciales de PayPhone, PayPal u otra pasarela no deben guardarse aquí. Esta pantalla administra únicamente contenido público y transferencias; las claves privadas deben permanecer en Supabase Secrets y usarse desde funciones del servidor.</span></div>
    </div>
  );
}
