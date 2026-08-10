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
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  Filter,
  DollarSign,
  History,
  Image as ImageIcon,
  Edit2,
  Copy,
  PieChart,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  FileCode,
  User,
  Phone,
  Mail,
  Receipt,
  FileEdit,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import type { Donation, DonationCategory, DonationAuditLog } from '../../types';
import { DEFAULT_DONATION_PAGE_CONFIG, parseDonationPageConfig, type DonationPageConfig } from '../../features/donations/types';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

type ManagerTab = 'donations' | 'categories' | 'public_config' | 'audit_logs';

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

const CATEGORY_COLOR_PRESETS = [
  { label: 'Esmeralda / Diezmos', value: '#10B981', bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-500' },
  { label: 'Azul / Ofrendas', value: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500' },
  { label: 'Ámbar / Construcción', value: '#F59E0B', bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-500' },
  { label: 'Púrpura / Misiones', value: '#8B5CF6', bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-500' },
  { label: 'Rosa / Acción Social', value: '#EC4899', bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-500' },
  { label: 'Cian / Jóvenes', value: '#06B6D4', bg: 'bg-cyan-500', text: 'text-cyan-700', border: 'border-cyan-500' },
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function FormField({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  const classes =
    'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:focus:border-blue-400/50';
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      {hint && <span className="ml-2 text-[10px] text-slate-400">{hint}</span>}
      {multiline ? (
        <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${classes} resize-y`} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={classes} />
      )}
    </label>
  );
}

export default function DonationPageManager() {
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('finances', 'edit');

  const [activeTab, setActiveTab] = useState<ManagerTab>('donations');
  const [form, setForm] = useState<DonationSettingsForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [auditLogs, setAuditLogs] = useState<DonationAuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Filters for donations table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedDonationForProof, setSelectedDonationForProof] = useState<Donation | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<DonationAuditLog | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DonationCategory | null>(null);

  // Manual Entry Form State
  const [manualDonorName, setManualDonorName] = useState('');
  const [manualIsAnonymous, setManualIsAnonymous] = useState(false);
  const [manualDonorEmail, setManualDonorEmail] = useState('');
  const [manualDonorPhone, setManualDonorPhone] = useState('');
  const [manualCategoryId, setManualCategoryId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [manualStatus, setManualStatus] = useState<'completed' | 'pending'>('completed');
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');
  const [manualAdminNotes, setManualAdminNotes] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Category Edit Form State
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catTargetAmount, setCatTargetAmount] = useState('');
  const [catColor, setCatColor] = useState('#10B981');
  const [catIsActive, setCatIsActive] = useState(true);

  // Proof Inspector Notes
  const [proofAdminNote, setProofAdminNote] = useState('');
  const [savingProofNote, setSavingProofNote] = useState(false);

  // Load primary data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResult, categoriesResult, donationsResult] = await Promise.all([
        supabase.from('church_settings').select('phone, email, bank_name, bank_account, ruc, donation_page_config').eq('id', 1).single(),
        supabase.from('donation_categories').select('*').order('name'),
        supabase.from('donations').select('*, donation_categories(id, name, description, is_active, created_at)').order('created_at', { ascending: false }).limit(200),
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

      const loadedCats = (categoriesResult.data || []) as DonationCategory[];
      setCategories(loadedCats);
      setDonations((donationsResult.data || []) as Donation[]);

      if (loadedCats.length > 0 && !manualCategoryId) {
        setManualCategoryId(loadedCats[0].id);
      }
    } catch (caughtError: unknown) {
      console.error('Error loading donation manager:', caughtError);
      toast.error(`No se pudo cargar la información: ${errorMessage(caughtError)}`);
    } finally {
      setLoading(false);
    }
  }, [manualCategoryId]);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const { data, error } = await supabase
        .from('donation_audit_logs')
        .select('*, profiles:actor_id(first_name, last_name, email), donations:donation_id(receipt_number, donor_name, amount)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Audit log fetch notice:', error);
        setAuditLogs([]);
      } else {
        setAuditLogs((data || []) as DonationAuditLog[]);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      void loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs]);

  // Proof note sync
  useEffect(() => {
    if (selectedDonationForProof) {
      setProofAdminNote(selectedDonationForProof.admin_notes || '');
    }
  }, [selectedDonationForProof]);

  // Public config helper
  const updateConfig = <Key extends keyof DonationPageConfig>(key: Key, value: DonationPageConfig[Key]) => {
    setForm((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  };

  // Save public page settings
  const saveSettings = async () => {
    if (!canEdit) {
      toast.error('Tu cuenta no tiene permisos para guardar cambios en Finanzas.');
      return;
    }
    const requiredValues = [form.bank_name, form.bank_account, form.ruc, form.phone, form.config.beneficiary, form.config.title];
    if (requiredValues.some((value) => !value.trim())) {
      toast.error('Completa los campos obligatorios antes de guardar (Título, Beneficiario, Banco, Cuenta, RUC, Teléfono).');
      return;
    }
    if (form.config.preset_amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
      toast.error('Todos los montos sugeridos deben ser valores positivos.');
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
      toast.success('Página pública de donaciones y cuentas actualizadas.');
    } catch (caughtError: unknown) {
      console.error('Error saving settings:', caughtError);
      toast.error(`Error al guardar configuración: ${errorMessage(caughtError)}`);
    } finally {
      setSaving(false);
    }
  };

  // Quick category toggle
  const toggleCategory = async (category: DonationCategory) => {
    if (!canEdit) {
      toast.error('No tienes permiso para modificar los destinos.');
      return;
    }
    setActionId(category.id);
    try {
      const { error } = await supabase.from('donation_categories').update({ is_active: !category.is_active }).eq('id', category.id);
      if (error) throw error;
      setCategories((current) => current.map((item) => (item.id === category.id ? { ...item, is_active: !item.is_active } : item)));
      toast.success(`Destino "${category.name}" ${category.is_active ? 'desactivado' : 'activado'}.`);
    } catch (caughtError: unknown) {
      console.error('Error toggling category:', caughtError);
      toast.error(`Error al cambiar estado: ${errorMessage(caughtError)}`);
    } finally {
      setActionId(null);
    }
  };

  // Open modal for Create/Edit Category
  const openCategoryModal = (category?: DonationCategory) => {
    if (category) {
      setEditingCategory(category);
      setCatName(category.name);
      setCatDescription(category.description || '');
      setCatTargetAmount(category.target_amount ? String(category.target_amount) : '');
      setCatColor(category.color || '#10B981');
      setCatIsActive(category.is_active);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatDescription('');
      setCatTargetAmount('');
      setCatColor('#10B981');
      setCatIsActive(true);
    }
    setIsCategoryModalOpen(true);
  };

  // Save Category (Create or Edit)
  const saveCategory = async () => {
    if (!canEdit) {
      toast.error('No tienes permiso para gestionar destinos.');
      return;
    }
    const name = catName.trim();
    if (!name) {
      toast.error('Ingresa un nombre para el destino de aportación.');
      return;
    }

    setSaving(true);
    try {
      const targetVal = catTargetAmount.trim() ? parseFloat(catTargetAmount) : null;
      const payload: Record<string, any> = {
        name,
        description: catDescription.trim() || null,
        is_active: catIsActive,
        target_amount: targetVal,
        color: catColor,
      };

      if (editingCategory) {
        const { error } = await supabase.from('donation_categories').update(payload).eq('id', editingCategory.id);
        if (error) {
          if (error.message.includes('target_amount') || error.message.includes('color') || error.code === '42703') {
            const fallbackPayload = { name, description: catDescription.trim() || null, is_active: catIsActive };
            const { error: fallbackErr } = await supabase.from('donation_categories').update(fallbackPayload).eq('id', editingCategory.id);
            if (fallbackErr) throw fallbackErr;
          } else {
            throw error;
          }
        }
        toast.success(`Destino "${name}" actualizado.`);
      } else {
        const { error } = await supabase.from('donation_categories').insert(payload);
        if (error) {
          if (error.message.includes('target_amount') || error.message.includes('color') || error.code === '42703') {
            const fallbackPayload = { name, description: catDescription.trim() || null, is_active: catIsActive };
            const { error: fallbackErr } = await supabase.from('donation_categories').insert(fallbackPayload);
            if (fallbackErr) throw fallbackErr;
          } else {
            throw error;
          }
        }
        toast.success(`Destino "${name}" creado exitosamente.`);
      }

      setIsCategoryModalOpen(false);
      await loadData();
    } catch (caughtError: unknown) {
      console.error('Error saving category:', caughtError);
      toast.error(`No se pudo guardar el destino: ${errorMessage(caughtError)}`);
    } finally {
      setSaving(false);
    }
  };

  // Update Status of Donation (Verification / Rejection)
  const updateDonationStatus = async (donation: Donation, status: 'completed' | 'failed' | 'pending') => {
    if (!canEdit) {
      toast.error('No tienes permiso para verificar aportes.');
      return;
    }
    setActionId(donation.id);
    try {
      const nowIso = new Date().toISOString();
      const updateData: Record<string, any> = {
        status,
        verified_at: status === 'pending' ? null : nowIso,
        verified_by: status === 'pending' ? null : user?.id || null,
      };

      const { error } = await supabase.from('donations').update(updateData).eq('id', donation.id);
      if (error) throw error;

      setDonations((current) => current.map((item) => (item.id === donation.id ? { ...item, ...updateData } : item)));

      if (selectedDonationForProof?.id === donation.id) {
        setSelectedDonationForProof((current) => (current ? { ...current, ...updateData } : null));
      }

      toast.success(
        status === 'completed' ? 'Aporte verificado como recibido.' : status === 'failed' ? 'Aporte marcado como no recibido.' : 'Aporte marcado nuevamente como pendiente.'
      );
      void loadAuditLogs();
    } catch (caughtError: unknown) {
      console.error('Error updating donation status:', caughtError);
      toast.error(`Error al actualizar el aporte: ${errorMessage(caughtError)}`);
    } finally {
      setActionId(null);
    }
  };

  // Save Admin Note in Proof Inspector
  const saveProofAdminNote = async () => {
    if (!selectedDonationForProof) return;
    if (!canEdit) {
      toast.error('No tienes permiso para editar observaciones.');
      return;
    }

    setSavingProofNote(true);
    try {
      const { error } = await supabase.from('donations').update({ admin_notes: proofAdminNote.trim() || null }).eq('id', selectedDonationForProof.id);
      if (error) throw error;

      const updatedNotes = proofAdminNote.trim() || null;
      setDonations((current) => current.map((item) => (item.id === selectedDonationForProof.id ? { ...item, admin_notes: updatedNotes } : item)));
      setSelectedDonationForProof((current) => (current ? { ...current, admin_notes: updatedNotes } : null));
      toast.success('Nota administrativa actualizada.');
      void loadAuditLogs();
    } catch (caughtError: unknown) {
      console.error('Error saving admin notes:', caughtError);
      toast.error(`Error al guardar la nota: ${errorMessage(caughtError)}`);
    } finally {
      setSavingProofNote(false);
    }
  };

  // Submit Manual Entry Form
  const handleSaveManualDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('No tienes permiso para registrar aportes presenciales.');
      return;
    }

    const numericAmount = parseFloat(manualAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Ingresa un monto válido mayor que cero.');
      return;
    }

    setSavingManual(true);
    try {
      const selectedCat = categories.find((c) => c.id === manualCategoryId);
      const nowIso = new Date().toISOString();

      const payload: Record<string, any> = {
        donor_name: manualIsAnonymous ? 'Anónimo' : manualDonorName.trim() || 'Anónimo',
        donor_email: manualDonorEmail.trim() || 'tesoreria@iglesia.org',
        donor_phone: manualDonorPhone.trim() || null,
        is_anonymous: manualIsAnonymous,
        category_id: manualCategoryId || null,
        category_name_backup: selectedCat?.name || 'Aporte Presencial',
        amount: numericAmount,
        currency: 'USD',
        payment_method: manualPaymentMethod,
        status: manualStatus,
        admin_notes: manualAdminNotes.trim() || 'Registrado manualmente por tesorería en culto/evento.',
        verified_at: manualStatus === 'completed' ? nowIso : null,
        verified_by: manualStatus === 'completed' ? user?.id || null : null,
        created_at: nowIso,
      };

      if (manualReceiptNumber.trim()) {
        payload.receipt_number = manualReceiptNumber.trim();
      }

      const { error } = await supabase.from('donations').insert(payload);
      if (error) throw error;

      toast.success('Aporte presencial registrado exitosamente.');
      setIsManualModalOpen(false);
      // Reset form
      setManualDonorName('');
      setManualIsAnonymous(false);
      setManualDonorEmail('');
      setManualDonorPhone('');
      setManualAmount('');
      setManualReceiptNumber('');
      setManualAdminNotes('');

      await loadData();
      void loadAuditLogs();
    } catch (caughtError: unknown) {
      console.error('Error recording manual donation:', caughtError);
      toast.error(`No se pudo registrar el aporte: ${errorMessage(caughtError)}`);
    } finally {
      setSavingManual(false);
    }
  };

  // Filtered Donations
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const matchSearch =
        !searchTerm ||
        (d.donor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.donor_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchMethod = methodFilter === 'all' || d.payment_method === methodFilter;
      const matchCategory = categoryFilter === 'all' || d.category_id === categoryFilter;

      return matchSearch && matchStatus && matchMethod && matchCategory;
    });
  }, [donations, searchTerm, statusFilter, methodFilter, categoryFilter]);

  // Statistics
  const pendingCount = useMemo(() => donations.filter((d) => d.status === 'pending').length, [donations]);
  const completedTotal = useMemo(
    () => donations.filter((d) => d.status === 'completed').reduce((sum, d) => sum + Number(d.amount), 0),
    [donations]
  );
  const activeCategories = useMemo(() => categories.filter((c) => c.is_active).length, [categories]);
  const readiness = useMemo(
    () => [form.config.title, form.config.beneficiary, form.bank_name, form.bank_account, form.ruc, form.phone].filter((v) => v.trim()).length,
    [form]
  );

  // Category totals & progress map
  const categoryStatsMap = useMemo(() => {
    const map = new Map<string, number>();
    donations.forEach((d) => {
      if (d.category_id && d.status === 'completed') {
        const current = map.get(d.category_id) || 0;
        map.set(d.category_id, current + Number(d.amount));
      }
    });
    return map;
  }, [donations]);

  // Exports
  const handleExportExcel = () => {
    if (filteredDonations.length === 0) {
      toast.error('No hay aportes para exportar.');
      return;
    }
    const exportData = filteredDonations.map((d) => ({
      'N° Recibo': d.receipt_number || d.id.slice(0, 8).toUpperCase(),
      Fecha: new Date(d.created_at).toLocaleString('es-EC'),
      Donante: d.is_anonymous ? 'Anónimo' : d.donor_name || 'Sin nombre',
      Correo: d.donor_email || 'N/A',
      Teléfono: d.donor_phone || 'N/A',
      Destino: d.donation_categories?.name || d.category_name_backup || 'General',
      'Monto ($)': Number(d.amount).toFixed(2),
      'Método de Pago': d.payment_method,
      Estado: d.status === 'completed' ? 'Verificado' : d.status === 'failed' ? 'No recibido' : 'Pendiente',
      'Observaciones': d.admin_notes || '',
    }));
    exportToExcel(exportData, `Conciliacion_Aportes_${new Date().toISOString().slice(0, 10)}`, 'Aportes');
  };

  const handleExportCSV = () => {
    if (filteredDonations.length === 0) {
      toast.error('No hay aportes para exportar.');
      return;
    }
    const csvHeaders = ['Recibo', 'Fecha', 'Donante', 'Correo', 'Telefono', 'Destino', 'Monto', 'Metodo', 'Estado', 'Notas'];
    const csvRows = filteredDonations.map((d) => [
      `"${d.receipt_number || d.id.slice(0, 8).toUpperCase()}"`,
      `"${new Date(d.created_at).toLocaleString('es-EC')}"`,
      `"${d.is_anonymous ? 'Anónimo' : d.donor_name || 'Sin nombre'}"`,
      `"${d.donor_email || ''}"`,
      `"${d.donor_phone || ''}"`,
      `"${d.donation_categories?.name || d.category_name_backup || 'General'}"`,
      `"${Number(d.amount).toFixed(2)}"`,
      `"${d.payment_method}"`,
      `"${d.status}"`,
      `"${(d.admin_notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Conciliacion_Aportes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV descargado exitosamente.');
  };

  const handleExportPDF = () => {
    if (filteredDonations.length === 0) {
      toast.error('No hay aportes para exportar.');
      return;
    }
    const pdfHeaders = ['Recibo', 'Fecha', 'Donante', 'Destino', 'Monto ($)', 'Método', 'Estado'];
    const pdfRows = filteredDonations.map((d) => [
      d.receipt_number || d.id.slice(0, 8).toUpperCase(),
      new Date(d.created_at).toLocaleDateString('es-EC'),
      d.is_anonymous ? 'Anónimo' : d.donor_name || 'Sin nombre',
      d.donation_categories?.name || d.category_name_backup || 'General',
      `$${Number(d.amount).toFixed(2)}`,
      d.payment_method,
      d.status === 'completed' ? 'Verificado' : d.status === 'failed' ? 'Rechazado' : 'Pendiente',
    ]);
    exportToPDF('Reporte Oficial de Aportes y Diezmos', pdfHeaders, pdfRows, `Reporte_Aportes_${new Date().toISOString().slice(0, 10)}`);
  };

  if (loading) {
    return (
      <div className="space-y-5 p-4">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/5" />
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-slate-200/60 dark:bg-white/5" />
      </div>
    );
  }

  const tabs: Array<{ id: ManagerTab; label: string; icon: typeof Settings2; badge?: number | string }> = [
    { id: 'donations', label: '📊 Aportes y Diezmos', icon: CircleDollarSign, badge: pendingCount ? `${pendingCount} pend.` : undefined },
    { id: 'categories', label: '🎯 Destinos y Proyectos', icon: Tag, badge: activeCategories },
    { id: 'public_config', label: '⚙️ Configuración Pública', icon: Settings2 },
    { id: 'audit_logs', label: '📜 Pista de Auditoría', icon: History },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Finanzas y Diezmos"
        description="Gestión integral de aportes, conciliación bancaria, registro presencial en cultos, proyectos y auditoría."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
            >
              <Plus size={15} /> Registrar Culto / Presencial
            </button>

            <Link
              to="/donations"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <Eye size={15} /> Ver Pública <ExternalLink size={12} />
            </Link>

            {activeTab === 'public_config' && canEdit && (
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar Configuración
              </button>
            )}
          </div>
        }
      />

      {!canEdit && (
        <div className="rounded-2xl border border-amber-300/50 bg-amber-500/10 p-4 text-xs leading-5 text-amber-800 dark:text-amber-200">
          <strong>Modo Solo Lectura:</strong> Tu cuenta no posee permisos de edición para la sección de Finanzas. Puedes explorar los datos y la pista de auditoría, pero no podras verificar ni registrar montos.
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Recaudado (Verificado)</span>
            <DollarSign className="text-emerald-500" size={18} />
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-800 dark:text-white">${completedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          <span className="text-[11px] text-slate-400">En aportes conciliados</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Por Conciliar</span>
            <Clock className="text-amber-500" size={18} />
          </div>
          <strong className="mt-2 block text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</strong>
          <span className="text-[11px] text-slate-400">Aportes/Transferencias pendientes</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Destinos Activos</span>
            <Tag className="text-blue-500" size={18} />
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-800 dark:text-white">
            {activeCategories} / {categories.length}
          </strong>
          <span className="text-[11px] text-slate-400">Proyectos y fondos vigentes</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Configuración Pública</span>
            <ShieldCheck className="text-purple-500" size={18} />
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-800 dark:text-white">{readiness} / 6</strong>
          <span className="text-[11px] text-slate-400">Datos esenciales listos</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          title="Recargar información de base de datos"
        >
          <RefreshCw size={13} /> Refrescar
        </button>
      </div>

      {/* TAB 1: APORTES Y DIEZMOS */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filters, Export */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por donante, recibo o correo..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">Todos los Estados</option>
                <option value="pending">Pendientes por verificar</option>
                <option value="completed">Verificados como recibidos</option>
                <option value="failed">No recibidos / Rechazados</option>
              </select>

              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">Todos los Métodos</option>
                <option value="efectivo">Efectivo (Culto)</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta / Pasarela</option>
                <option value="de_una">De Una / QR</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">Todos los Destinos</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2 pt-2 lg:border-l lg:border-slate-200 lg:pl-3 lg:pt-0 dark:border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-400">Exportar:</span>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                title="Exportar a Excel (.xlsx)"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                title="Exportar a CSV"
              >
                <Download size={14} /> CSV
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300"
                title="Exportar Reporte PDF"
              >
                <FileText size={14} /> PDF
              </button>
            </div>
          </div>

          {/* Main Table */}
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-xs dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex flex-col gap-2 border-b border-slate-200 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-primary dark:text-white">Registros de Aportes ({filteredDonations.length})</h2>
                <p className="text-xs text-slate-400">Verifica comprobantes de transferencias o consulta los diezmos recolectados en el templo.</p>
              </div>
            </div>

            {filteredDonations.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                <CircleDollarSign className="mx-auto mb-2 opacity-40" size={36} />
                No se encontraron aportes con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:bg-white/5">
                    <tr>
                      <th className="px-5 py-3">Recibo / Ref.</th>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Donante</th>
                      <th className="px-5 py-3">Destino</th>
                      <th className="px-5 py-3">Monto</th>
                      <th className="px-5 py-3">Método</th>
                      <th className="px-5 py-3">Comprobante</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredDonations.map((donation) => {
                      const isPending = donation.status === 'pending';
                      const isCompleted = donation.status === 'completed';
                      const isFailed = donation.status === 'failed';

                      return (
                        <tr key={donation.id} className="text-xs transition hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                          <td className="px-5 py-4 font-mono font-bold text-primary dark:text-blue-300">
                            {donation.receipt_number || donation.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                            {new Date(donation.created_at).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-5 py-4">
                            <strong className="block text-slate-800 dark:text-white">
                              {donation.is_anonymous ? '🤫 Donante Anónimo' : donation.donor_name || 'Sin nombre'}
                            </strong>
                            <span className="text-[10px] text-slate-400">{donation.donor_email}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                              <Tag size={11} className="text-church-gold-dark" />
                              {donation.donation_categories?.name || donation.category_name_backup || 'General'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-black text-slate-900 dark:text-white">
                            ${Number(donation.amount).toFixed(2)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="capitalize text-slate-600 dark:text-slate-300">
                              {donation.payment_method === 'efectivo'
                                ? '💵 Efectivo'
                                : donation.payment_method === 'transferencia'
                                ? '🏦 Transferencia'
                                : donation.payment_method === 'tarjeta'
                                ? '💳 Tarjeta'
                                : donation.payment_method}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {donation.proof_url ? (
                              <button
                                type="button"
                                onClick={() => setSelectedDonationForProof(donation)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                              >
                                <ImageIcon size={13} /> Ver Comprobante
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Sin adjunto</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                  : isFailed
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {isCompleted && <CheckCircle2 size={11} />}
                              {isFailed && <XCircle size={11} />}
                              {isPending && <Clock size={11} />}
                              {isCompleted ? 'Verificado' : isFailed ? 'No Recibido' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end items-center gap-1.5">
                              {/* Open Details / Inspector */}
                              <button
                                type="button"
                                onClick={() => setSelectedDonationForProof(donation)}
                                className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                title="Inspeccionar detalle y comprobante"
                              >
                                <Eye size={14} />
                              </button>

                              {/* Verify Action */}
                              {isPending && canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void updateDonationStatus(donation, 'completed')}
                                    disabled={actionId === donation.id}
                                    className="rounded-xl bg-emerald-500/10 p-1.5 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                                    title="Verificar como Recibido"
                                  >
                                    {actionId === donation.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void updateDonationStatus(donation, 'failed')}
                                    disabled={actionId === donation.id}
                                    className="rounded-xl bg-red-500/10 p-1.5 text-red-600 hover:bg-red-500/20 dark:text-red-300"
                                    title="Marcar como No Recibido"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: DESTINOS Y PROYECTOS */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white/75 p-5 dark:border-white/10 dark:bg-slate-900/70">
            <div>
              <h2 className="font-serif text-xl font-bold text-primary dark:text-white">Destinos, Fondos y Proyectos</h2>
              <p className="mt-1 text-xs text-slate-400">
                Administra las categorías de aportación públicas (Diezmos, Misiones, Construcción) y define metas de recaudación.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => openCategoryModal()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90"
              >
                <Plus size={15} /> Nuevo Destino
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const raised = categoryStatsMap.get(category.id) || 0;
              const target = categoryCategoryTarget(category.target_amount);
              const progressPct = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;
              const catColorObj = CATEGORY_COLOR_PRESETS.find((c) => c.value === category.color) || CATEGORY_COLOR_PRESETS[0];

              return (
                <div
                  key={category.id}
                  className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xs transition hover:shadow-md dark:border-white/10 dark:bg-slate-900/70"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-3.5 w-3.5 rounded-full ${catColorObj.bg}`} />
                        <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">{category.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => void toggleCategory(category)}
                        disabled={actionId === category.id}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                          category.is_active
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300'
                        }`}
                      >
                        {actionId === category.id ? <Loader2 size={13} className="animate-spin" /> : category.is_active ? 'Publicado' : 'Oculto'}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {category.description || 'Sin descripción ingresada.'}
                    </p>

                    {/* Progress tracking */}
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recaudado (Verificado)</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          ${raised.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          {target > 0 && <span className="text-slate-400 font-normal"> / ${target.toLocaleString()}</span>}
                        </span>
                      </div>

                      {target > 0 ? (
                        <div className="mt-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                            <div className={`h-full rounded-full transition-all duration-500 ${catColorObj.bg}`} style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="mt-1 block text-right text-[10px] font-bold text-slate-400">{progressPct}% de la meta alcanzada</span>
                        </div>
                      ) : (
                        <span className="mt-1 block text-[10px] text-slate-400 italic">Fondo continuo sin meta límite</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3 dark:border-white/5">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openCategoryModal(category)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                      >
                        <Edit2 size={13} /> Editar Destino
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURACIÓN PÚBLICA */}
      {activeTab === 'public_config' && (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white/75 p-6 shadow-xs dark:border-white/10 dark:bg-slate-900/70">
            <div>
              <h2 className="font-serif text-xl font-bold text-primary dark:text-white">Contenido y Mensaje Público</h2>
              <p className="mt-1 text-xs text-slate-400">Textos inspiracionales y llamados a la acción visibles en el portal de donaciones.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Etiqueta Superior (Eyebrow)" value={form.config.eyebrow} onChange={(v) => updateConfig('eyebrow', v)} />
              <FormField label="Referencia Bíblica" value={form.config.verse_reference} onChange={(v) => updateConfig('verse_reference', v)} />
            </div>
            <FormField label="Título Principal" value={form.config.title} onChange={(v) => updateConfig('title', v)} />
            <FormField label="Descripción de Mayordomía" value={form.config.description} onChange={(v) => updateConfig('description', v)} multiline />
            <FormField label="Texto del Versículo" value={form.config.verse} onChange={(v) => updateConfig('verse', v)} multiline />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Título Transparencia" value={form.config.transparency_title} onChange={(v) => updateConfig('transparency_title', v)} />
              <FormField label="Contacto WhatsApp / Secretaría" value={form.config.whatsapp_label} onChange={(v) => updateConfig('whatsapp_label', v)} />
            </div>
            <FormField label="Mensaje de Transparencia" value={form.config.transparency_text} onChange={(v) => updateConfig('transparency_text', v)} multiline />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-white/5 cursor-pointer">
                <span>
                  <strong className="block text-sm text-slate-700 dark:text-white">Habilitar Transferencias Públicas</strong>
                  <span className="text-[11px] text-slate-400">Muestra el formulario y datos bancarios.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.config.transfer_enabled}
                  onChange={(e) => updateConfig('transfer_enabled', e.target.checked)}
                  className="h-5 w-5 rounded accent-primary"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-white/5 cursor-pointer">
                <span>
                  <strong className="block text-sm text-slate-700 dark:text-white">Sección de Voluntariado</strong>
                  <span className="text-[11px] text-slate-400">Enlace adicional para servicio comunitario.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.config.volunteer_enabled}
                  onChange={(e) => updateConfig('volunteer_enabled', e.target.checked)}
                  className="h-5 w-5 rounded accent-primary"
                />
              </label>
            </div>
          </section>

          <aside className="space-y-5">
            {/* Cuenta e información bancaria */}
            <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/75 p-6 dark:border-white/10 dark:bg-slate-900/70">
              <h2 className="font-serif text-lg font-bold text-primary dark:text-white">Cuenta Bancaria de la Iglesia</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Banco" value={form.bank_name} onChange={(v) => setForm((c) => ({ ...c, bank_name: v }))} />
                <FormField label="Tipo de Cuenta" value={form.config.account_type} onChange={(v) => updateConfig('account_type', v)} />
              </div>
              <FormField label="Número de Cuenta" value={form.bank_account} onChange={(v) => setForm((c) => ({ ...c, bank_account: v }))} />
              <FormField label="Beneficiario" value={form.config.beneficiary} onChange={(v) => updateConfig('beneficiary', v)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="RUC / CI" value={form.ruc} onChange={(v) => setForm((c) => ({ ...c, ruc: v }))} />
                <FormField label="Teléfono WhatsApp" value={form.phone} onChange={(v) => setForm((c) => ({ ...c, phone: v }))} />
              </div>
              <FormField label="Correo Institucional" value={form.email} onChange={(v) => setForm((c) => ({ ...c, email: v }))} />
            </div>

            {/* Montos sugeridos */}
            <div className="rounded-[2rem] border border-slate-200 bg-white/75 p-6 dark:border-white/10 dark:bg-slate-900/70">
              <h2 className="font-serif text-lg font-bold text-primary dark:text-white">Montos Sugeridos ($)</h2>
              <p className="mt-1 text-xs text-slate-400">Botones rápidos para los donantes.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {form.config.preset_amounts.map((amount, index) => (
                  <label key={index} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) =>
                        updateConfig(
                          'preset_amounts',
                          form.config.preset_amounts.map((c, i) => (i === index ? Number(e.target.value) : c))
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm font-bold dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Instrucciones de transferencia */}
            <div className="rounded-[2rem] border border-slate-200 bg-white/75 p-6 dark:border-white/10 dark:bg-slate-900/70">
              <h2 className="font-serif text-lg font-bold text-primary dark:text-white">Instrucciones de Transferencia</h2>
              <div className="mt-4 space-y-3">
                {form.config.transfer_instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="mt-2.5 text-xs font-black text-church-gold-dark">{index + 1}</span>
                    <textarea
                      rows={2}
                      value={instruction}
                      onChange={(e) =>
                        updateConfig(
                          'transfer_instructions',
                          form.config.transfer_instructions.map((c, i) => (i === index ? e.target.value : c))
                        )
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* TAB 4: PISTA DE AUDITORÍA */}
      {activeTab === 'audit_logs' && (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-xs dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-primary dark:text-white">Pista de Auditoría Inmutable</h2>
              <p className="mt-1 text-xs text-slate-400">
                Historial automático de modificaciones en la tabla de donaciones (disparado a nivel de base de datos Postgres).
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAuditLogs()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              <RefreshCw size={13} className={loadingAudit ? 'animate-spin' : ''} /> Actualizar Registros
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              <History className="mx-auto mb-2 opacity-40" size={36} />
              No existen registros de auditoría almacenados aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:bg-white/5">
                  <tr>
                    <th className="px-5 py-3">Fecha / Hora</th>
                    <th className="px-5 py-3">Usuario / Actor</th>
                    <th className="px-5 py-3">Acción</th>
                    <th className="px-5 py-3">Recibo Afectado</th>
                    <th className="px-5 py-3">IP Address</th>
                    <th className="px-5 py-3 text-right">Detalle JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {auditLogs.map((log) => {
                    const actorName = log.profiles ? `${log.profiles.first_name || ''} ${log.profiles.last_name || ''}`.trim() : 'Sistema / Trigger';
                    const actorEmail = log.profiles?.email || 'N/A';
                    const receiptNum = log.donations?.receipt_number || log.donation_id.slice(0, 8).toUpperCase();

                    return (
                      <tr key={log.id} className="text-xs transition hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono">
                          {new Date(log.created_at).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="px-5 py-4">
                          <strong className="block text-slate-800 dark:text-white">{actorName}</strong>
                          <span className="text-[10px] text-slate-400">{actorEmail}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-700 dark:text-slate-300">{receiptNum}</td>
                        <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedAuditLog(log)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                          >
                            <FileCode size={13} /> Ver JSON
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* MODAL 1: REGISTRAR APORTE PRESENCIAL / CULTO */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary dark:text-white flex items-center gap-2">
                  <Landmark className="text-emerald-600" size={20} /> Registrar Aporte Presencial / Culto
                </h3>
                <p className="text-xs text-slate-400">Registra diezmos u ofrendas recibidos durante el culto dominical.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualDonation} className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">¿Donante Anónimo?</span>
                <input
                  type="checkbox"
                  checked={manualIsAnonymous}
                  onChange={(e) => setManualIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>

              {!manualIsAnonymous && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Nombre del Donante</label>
                  <input
                    type="text"
                    required
                    value={manualDonorName}
                    onChange={(e) => setManualDonorName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Correo Electrónico</label>
                  <input
                    type="email"
                    value={manualDonorEmail}
                    onChange={(e) => setManualDonorEmail(e.target.value)}
                    placeholder="contacto@mi-iglesia.org"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={manualDonorPhone}
                    onChange={(e) => setManualDonorPhone(e.target.value)}
                    placeholder="0991234567"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Destino / Categoría</label>
                  <select
                    value={manualCategoryId}
                    onChange={(e) => setManualCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Monto ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Método de Pago</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="efectivo">Efectivo (Sobres de Culto)</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="tarjeta">Tarjeta de Crédito / Débito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Estado del Registro</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="completed">✓ Verificado / Recibido</option>
                    <option value="pending">⏳ Pendiente de Conciliación</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">N° de Recibo / Referencia (Opcional)</label>
                <input
                  type="text"
                  value={manualReceiptNumber}
                  onChange={(e) => setManualReceiptNumber(e.target.value)}
                  placeholder="Dejar en blanco para autogenerar REC-2026-XXXXXX"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Observaciones Internas</label>
                <textarea
                  rows={2}
                  value={manualAdminNotes}
                  onChange={(e) => setManualAdminNotes(e.target.value)}
                  placeholder="Ej. Recolectado en el segundo servicio de la mañana."
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingManual ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PROOF INSPECTOR & DETAILS */}
      {selectedDonationForProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Inspección de Comprobante</span>
                <h3 className="font-serif text-lg font-bold text-primary dark:text-white font-mono">
                  {selectedDonationForProof.receipt_number || selectedDonationForProof.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonationForProof(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* File / Image Preview */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  {selectedDonationForProof.proof_url ? (
                    selectedDonationForProof.proof_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="text-center p-6 space-y-3">
                        <FileText size={48} className="mx-auto text-blue-500" />
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">Comprobante en formato PDF</span>
                        <a
                          href={selectedDonationForProof.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
                        >
                          Abrir Documento PDF <ExternalLink size={12} />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center w-full">
                        <img
                          src={selectedDonationForProof.proof_url}
                          alt="Comprobante Bancario"
                          className="max-h-72 w-full object-contain rounded-xl border border-slate-200 dark:border-white/10 shadow-xs"
                        />
                        <a
                          href={selectedDonationForProof.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary underline"
                        >
                          Ver imagen en pantalla completa <ExternalLink size={11} />
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <ImageIcon size={40} className="mx-auto mb-2 opacity-40" />
                      <span className="text-xs">Sin imagen o archivo adjunto.</span>
                    </div>
                  )}
                </div>

                {/* Donation metadata */}
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Monto del Aporte</span>
                      <strong className="text-xl font-black text-slate-900 dark:text-white">
                        ${Number(selectedDonationForProof.amount).toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Estado de Verificación</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                          selectedDonationForProof.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : selectedDonationForProof.status === 'failed'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {selectedDonationForProof.status === 'completed'
                          ? 'Verificado'
                          : selectedDonationForProof.status === 'failed'
                          ? 'No Recibido'
                          : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Donante</span>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {selectedDonationForProof.is_anonymous ? 'Anónimo' : selectedDonationForProof.donor_name || 'Sin nombre'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Contacto</span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {selectedDonationForProof.donor_email || 'N/A'} {selectedDonationForProof.donor_phone ? `| ${selectedDonationForProof.donor_phone}` : ''}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Destino</span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {selectedDonationForProof.donation_categories?.name || selectedDonationForProof.category_name_backup || 'General'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Método y Fecha</span>
                      <p className="text-slate-600 dark:text-slate-300 capitalize">
                        {selectedDonationForProof.payment_method} • {new Date(selectedDonationForProof.created_at).toLocaleString('es-EC')}
                      </p>
                    </div>
                  </div>

                  {/* Notes section */}
                  <div className="border-t border-slate-100 pt-3 dark:border-white/10">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Notas Administrativas</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={proofAdminNote}
                        onChange={(e) => setProofAdminNote(e.target.value)}
                        placeholder="Ej. Transferencia recibida en Pichincha #4892"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => void saveProofAdminNote()}
                          disabled={savingProofNote}
                          className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-50"
                        >
                          {savingProofNote ? <Loader2 size={13} className="animate-spin" /> : 'Guardar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {canEdit && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-800/50">
                <span className="text-[11px] text-slate-400">Acción de verificación rápida:</span>
                <div className="flex gap-2">
                  {selectedDonationForProof.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => void updateDonationStatus(selectedDonationForProof, 'completed')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                    >
                      <Check size={14} /> Verificar como Recibido
                    </button>
                  )}
                  {selectedDonationForProof.status !== 'failed' && (
                    <button
                      type="button"
                      onClick={() => void updateDonationStatus(selectedDonationForProof, 'failed')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-red-700"
                    >
                      <X size={14} /> Marcar como No Recibido
                    </button>
                  )}
                  {selectedDonationForProof.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => void updateDonationStatus(selectedDonationForProof, 'pending')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      Reabrir Pendiente
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: CREAR / EDITAR DESTINO */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
              <h3 className="font-serif text-lg font-bold text-primary dark:text-white">
                {editingCategory ? 'Editar Destino de Aportación' : 'Nuevo Destino de Aportación'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Nombre del Destino / Proyecto</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej. Pro-Construcción Templo"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Descripción Breve</label>
                <textarea
                  rows={3}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Explica a los hermanos en qué consiste esta obra o fondo."
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Meta Financiera ($ USD, Opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={catTargetAmount}
                  onChange={(e) => setCatTargetAmount(e.target.value)}
                  placeholder="Ej. 5000 (Dejar en blanco para fondo continuo)"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Color Distintivo</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {CATEGORY_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setCatColor(preset.value)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-[11px] font-bold transition ${
                        catColor === preset.value
                          ? 'border-primary ring-2 ring-primary/20 bg-slate-50 dark:bg-white/10'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 rounded-full ${preset.bg}`} />
                      <span className="truncate text-slate-700 dark:text-slate-300">{preset.label.split('/')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Publicar en formulario web</span>
                <input
                  type="checkbox"
                  checked={catIsActive}
                  onChange={(e) => setCatIsActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveCategory()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar Destino
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: AUDIT LOG JSON VIEWER */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">Detalle de Modificación</span>
                <h3 className="font-serif text-lg font-bold text-primary dark:text-white">
                  Auditoría ID: {selectedAuditLog.id.slice(0, 8)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto mt-4 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-slate-500 mb-1 font-sans text-[11px] uppercase">Datos Anteriores (Previous)</h4>
                  <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                    {JSON.stringify(selectedAuditLog.previous_data, null, 2) || 'null'}
                  </pre>
                </div>
                <div>
                  <h4 className="font-bold text-slate-500 mb-1 font-sans text-[11px] uppercase">Datos Nuevos (New Data)</h4>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                    {JSON.stringify(selectedAuditLog.new_data, null, 2) || 'null'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-white"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function categoryCategoryTarget(targetAmount?: number | null): number {
  return typeof targetAmount === 'number' && Number.isFinite(targetAmount) ? targetAmount : 0;
}
