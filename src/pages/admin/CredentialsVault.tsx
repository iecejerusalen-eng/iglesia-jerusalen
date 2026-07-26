import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import {
  KeyRound,
  Plus,
  Search,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
  Building,
  Check,
  Globe,
  Mail,
  ShieldCheck,
  Video,
  Share2,
  Palette,
  Layers,
  X
} from 'lucide-react';
import type { CredentialVaultItem, Ministry } from '../../types';

const CATEGORIES = [
  { id: 'todos', label: 'Todas las Categorías', icon: Layers },
  { id: 'redes_sociales', label: 'Redes Sociales', icon: Share2 },
  { id: 'streaming', label: 'Streaming & Video', icon: Video },
  { id: 'correos', label: 'Correos de Dominio', icon: Mail },
  { id: 'plataformas', label: 'Plataformas & Software', icon: Palette },
  { id: 'otros', label: 'Otros Accesos', icon: Lock },
];

const PLATFORMS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'YouTube',
  'X (Twitter)',
  'Zoom',
  'Gmail / Workspace',
  'Canva',
  'Spotify',
  'Página Web / CPanel',
  'Vercel / Supabase',
  'Otro'
];

export default function CredentialsVault() {
  const [items, setItems] = useState<CredentialVaultItem[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CredentialVaultItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'redes_sociales' as CredentialVaultItem['category'],
    department_id: '' as string | null,
    platform_name: 'Instagram',
    account_handle: '',
    login_url: '',
    username_email: '',
    password_encrypted: '',
    recovery_email: '',
    security_notes: '',
  });

  // Password visibility map (id -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  // Copied state indicator (key -> boolean)
  const [copiedKeys, setCopiedKeys] = useState<Record<string, boolean>>({});

  const confirm = useConfirmStore(state => state.confirm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, ministriesRes] = await Promise.all([
        supabase
          .from('credential_vault')
          .select('*, ministries(id, name)')
          .order('created_at', { ascending: false }),
        supabase.from('ministries').select('*').order('name')
      ]);

      if (itemsRes.error) {
        // Safe fallback if table doesn't exist yet or query fails
        console.warn('Error fetching credential_vault:', itemsRes.error);
      } else {
        setItems(itemsRes.data || []);
      }

      if (ministriesRes.data) {
        setMinistries(ministriesRes.data);
      }
    } catch (err) {
      console.error('Error loading vault:', err);
      toast.error('Error al cargar la bóveda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
    setCopiedKeys(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedKeys(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const nextState = !prev[id];
      if (nextState) {
        // Auto hide after 12 seconds for security
        setTimeout(() => {
          setVisiblePasswords(p => ({ ...p, [id]: false }));
        }, 12000);
      }
      return { ...prev, [id]: nextState };
    });
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'redes_sociales',
      department_id: '',
      platform_name: 'Instagram',
      account_handle: '',
      login_url: '',
      username_email: '',
      password_encrypted: '',
      recovery_email: '',
      security_notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CredentialVaultItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      department_id: item.department_id || '',
      platform_name: item.platform_name,
      account_handle: item.account_handle || '',
      login_url: item.login_url || '',
      username_email: item.username_email,
      password_encrypted: item.password_encrypted || '',
      recovery_email: item.recovery_email || '',
      security_notes: item.security_notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('El título es obligatorio');
    if (!formData.username_email.trim()) return toast.error('El usuario/correo es obligatorio');

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        department_id: formData.department_id ? formData.department_id : null,
        platform_name: formData.platform_name,
        account_handle: formData.account_handle.trim() || null,
        login_url: formData.login_url.trim() || null,
        username_email: formData.username_email.trim(),
        password_encrypted: formData.password_encrypted || null,
        recovery_email: formData.recovery_email.trim() || null,
        security_notes: formData.security_notes.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (editingItem) {
        const { error } = await supabase
          .from('credential_vault')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Credencial actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('credential_vault')
          .insert([payload]);

        if (error) throw error;
        toast.success('Credencial guardada en la bóveda');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Error al guardar la credencial');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Credencial',
      message: `¿Estás seguro de eliminar "${title}" de la bóveda? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('credential_vault')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Credencial eliminada');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar credencial');
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Dept filter
      if (selectedDepartment === 'general' && item.department_id !== null) return false;
      if (selectedDepartment !== 'todos' && selectedDepartment !== 'general' && item.department_id !== selectedDepartment) return false;

      // Category filter
      if (selectedCategory !== 'todos' && item.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPlatform = item.platform_name.toLowerCase().includes(q);
        const matchUser = item.username_email.toLowerCase().includes(q);
        const matchHandle = item.account_handle?.toLowerCase().includes(q);
        if (!matchTitle && !matchPlatform && !matchUser && !matchHandle) return false;
      }

      return true;
    });
  }, [items, selectedDepartment, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 space-y-8">
      {/* Header */}
      <AdminHeader
        title="Bóveda de Credenciales & Redes Sociales"
        description="Almacén centralizado de cuentas, contraseñas, accesos y canales digitales para la Iglesia General y sus Departamentos."
        action={
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Credencial</span>
          </button>
        }
      />

      {/* Filters Bar */}
      <AnimeFadeUp>
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por red, cuenta, usuario o título..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="todos">🏛️ Todos los Departamentos / Iglesia</option>
                <option value="general">⛪ Solo Iglesia General</option>
                {ministries.map(m => (
                  <option key={m.id} value={m.id}>
                    📁 {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats Summary */}
            <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-medium text-slate-400 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Total: <strong className="text-slate-200">{items.length}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal-400" />
                Filtrados: <strong className="text-slate-200">{filteredItems.length}</strong>
              </span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/40">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/60 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </AnimeFadeUp>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <KeyRound className="w-10 h-10 text-emerald-400 animate-bounce" />
          <p className="text-slate-400 text-sm animate-pulse">Abriendo bóveda de credenciales...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No se encontraron credenciales</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'todos' || selectedDepartment !== 'todos'
              ? 'Prueba ajustando los filtros de búsqueda o cambiando el departamento seleccionado.'
              : 'Empieza registrando las redes sociales y cuentas de la iglesia o sus departamentos.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Registrar Primera Credencial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isPasswordVisible = visiblePasswords[item.id];
            const deptName = item.ministries?.name || 'Iglesia General';
            const userKey = `user-${item.id}`;
            const passKey = `pass-${item.id}`;

            return (
              <AnimeFadeUp key={item.id}>
                <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/70 hover:border-slate-600 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 group transition-all">
                  {/* Top Bar */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                          item.department_id
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          <Building className="w-3 h-3" />
                          {deptName}
                        </span>
                        <h3 className="font-bold text-slate-100 text-lg group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-700/50 rounded-lg p-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Platform & Handle */}
                    <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-teal-400" />
                        {item.platform_name}
                      </span>
                      {item.account_handle && (
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded">
                          {item.account_handle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Credentials Credentials Copy Area */}
                  <div className="space-y-2.5 pt-1">
                    {/* Username / Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Usuario / Correo</label>
                      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 font-mono text-xs">
                        <span className="truncate text-slate-200 pr-2 select-all">{item.username_email}</span>
                        <button
                          onClick={() => handleCopy(item.username_email, userKey, 'Usuario')}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all flex-shrink-0"
                          title="Copiar Usuario"
                        >
                          {copiedKeys[userKey] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contraseña</label>
                      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 font-mono text-xs">
                        <span className="truncate text-slate-200 pr-2 select-all">
                          {item.password_encrypted
                            ? isPasswordVisible
                              ? item.password_encrypted
                              : '••••••••••••'
                            : '(Sin contraseña)'}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.password_encrypted && (
                            <>
                              <button
                                onClick={() => togglePasswordVisibility(item.id)}
                                className="p-1.5 text-slate-400 hover:text-teal-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                                title={isPasswordVisible ? 'Enmascarar' : 'Revelar por 12s'}
                              >
                                {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleCopy(item.password_encrypted || '', passKey, 'Contraseña')}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                                title="Copiar Contraseña"
                              >
                                {copiedKeys[passKey] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional info / Security notes */}
                  {item.security_notes && (
                    <div className="text-[11px] text-slate-400 bg-amber-950/20 border border-amber-800/30 p-2.5 rounded-xl space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Notas de Seguridad / 2FA:
                      </div>
                      <p className="line-clamp-2 text-slate-300 font-mono text-[10.5px]">{item.security_notes}</p>
                    </div>
                  )}

                  {/* Footer Link */}
                  {item.login_url && (
                    <div className="pt-2 border-t border-slate-700/50">
                      <a
                        href={item.login_url.startsWith('http') ? item.login_url : `https://${item.login_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir Sitio de Login
                      </a>
                    </div>
                  )}
                </div>
              </AnimeFadeUp>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-emerald-400" />
                {editingItem ? 'Editar Credencial' : 'Registrar Nueva Credencial'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Título & Departamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Título / Identificador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Instagram Jóvenes"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departamento / Ministerio
                  </label>
                  <select
                    value={formData.department_id || ''}
                    onChange={e => setFormData({ ...formData, department_id: e.target.value || null })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none"
                  >
                    <option value="">⛪ Iglesia General</option>
                    {ministries.map(m => (
                      <option key={m.id} value={m.id}>
                        📁 {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categoría & Plataforma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as CredentialVaultItem['category'] })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none"
                  >
                    <option value="redes_sociales">Redes Sociales</option>
                    <option value="streaming">Streaming & Video</option>
                    <option value="correos">Correos de Dominio</option>
                    <option value="plataformas">Plataformas & Software</option>
                    <option value="otros">Otros Accesos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plataforma / Red Social
                  </label>
                  <input
                    type="text"
                    list="platforms-list"
                    placeholder="Ej. Instagram"
                    value={formData.platform_name}
                    onChange={e => setFormData({ ...formData, platform_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                  <datalist id="platforms-list">
                    {PLATFORMS.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Handle & Login URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Usuario de Red (@Handle)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. @jovenesjerusalen"
                    value={formData.account_handle}
                    onChange={e => setFormData({ ...formData, account_handle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enlace de Inicio de Sesión (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. https://instagram.com"
                    value={formData.login_url}
                    onChange={e => setFormData({ ...formData, login_url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Username / Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Usuario / Correo de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="iglesia@gmail.com / admin"
                    value={formData.username_email}
                    onChange={e => setFormData({ ...formData, username_email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="text"
                    placeholder="Contraseña o clave secreta"
                    value={formData.password_encrypted}
                    onChange={e => setFormData({ ...formData, password_encrypted: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Recovery Email & Security Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo o Número de Recuperación
                </label>
                <input
                  type="text"
                  placeholder="recuperacion@iglesiajerusalen.org / +593..."
                  value={formData.recovery_email}
                  onChange={e => setFormData({ ...formData, recovery_email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas de Seguridad / Códigos 2FA de Respaldo
                </label>
                <textarea
                  rows={3}
                  placeholder="Códigos de verificación de 8 dígitos, preguntas secretas o instrucciones especiales..."
                  value={formData.security_notes}
                  onChange={e => setFormData({ ...formData, security_notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-200 text-sm focus:outline-none font-mono resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {editingItem ? 'Guardar Cambios' : 'Registrar Credencial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
