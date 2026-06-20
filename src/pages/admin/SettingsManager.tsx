import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '../../store/useConfirmStore';
import { fadeInUp } from '../../utils/animations';
import AdminHeader from '../../components/admin/AdminHeader';
import { 
  Phone, Landmark, Share2, Save, Loader2, 
  Settings, Tags, Plus, Trash2, Edit2, Check, X 
} from 'lucide-react';
import type { CatalogRole } from '../../types';

const settingsSchema = z.object({
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  address: z.string().min(1, 'La dirección es obligatoria'),
  google_maps_url: z.string().url('Ingresa una URL válida de Google Maps'),
  bank_name: z.string().min(1, 'El nombre del banco es obligatorio'),
  bank_account: z.string().min(1, 'El número de cuenta es obligatorio'),
  ruc: z.string().min(1, 'El RUC es obligatorio'),
  facebook_url: z.string().url('Ingresa una URL de Facebook válida').or(z.literal('')),
  instagram_url: z.string().url('Ingresa una URL de Instagram válida').or(z.literal('')),
  youtube_url: z.string().url('Ingresa una URL de YouTube válida').or(z.literal('')),
  chat_retention_days: z.number().min(1, 'La retención mínima es 1 día').max(365, 'La retención máxima es 365 días'),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const CATEGORIES = [
  { id: 'Roles', label: 'Roles de Liderazgo' },
  { id: 'Talentos', label: 'Habilidades y Talentos' },
  { id: 'Dones', label: 'Dones Espirituales' },
  { id: 'Área de Servicios', label: 'Áreas de Servicio' }
] as const;

type CatalogCategory = typeof CATEGORIES[number]['id'];

const SettingsManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [activeTab, setActiveTab] = useState<'settings' | 'catalogs'>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Catalog States
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory>('Roles');
  const [catalogItems, setCatalogItems] = useState<CatalogRole[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState('');
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogRole | null>(null);
  const [editingCatalogName, setEditingCatalogName] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'catalogs') {
      fetchCatalogItems(selectedCategory);
    }
  }, [activeTab, selectedCategory]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('church_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is empty results
        throw error;
      }

      if (data) {
        reset({
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          google_maps_url: data.google_maps_url || '',
          bank_name: data.bank_name || '',
          bank_account: data.bank_account || '',
          ruc: data.ruc || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
          chat_retention_days: data.chat_retention_days !== undefined ? data.chat_retention_days : 7,
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      toast.error('Error al cargar la configuración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('church_settings')
        .upsert({
          id: 1,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Configuración guardada correctamente.');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error('No se pudo guardar la configuración: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Catalog Functions
  const fetchCatalogItems = async (category: CatalogCategory) => {
    setCatalogLoading(true);
    try {
      const { data, error } = await supabase
        .from('catalog_roles')
        .select('*')
        .eq('category', category)
        .order('name');
      
      if (error) throw error;
      setCatalogItems(data || []);
    } catch (err: any) {
      console.error('Error loading catalog:', err);
      toast.error('Error al cargar catálogo: ' + err.message);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleAddCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatalogName.trim()) return;

    try {
      const { error } = await supabase
        .from('catalog_roles')
        .insert({
          name: newCatalogName.trim(),
          category: selectedCategory
        });

      if (error) throw error;
      toast.success('Elemento agregado con éxito.');
      setNewCatalogName('');
      fetchCatalogItems(selectedCategory);
    } catch (err: any) {
      console.error('Error adding catalog item:', err);
      toast.error('No se pudo agregar el elemento: ' + err.message);
    }
  };

  const handleStartEdit = (item: CatalogRole) => {
    setEditingCatalogItem(item);
    setEditingCatalogName(item.name);
  };

  const handleUpdateCatalog = async (item: CatalogRole) => {
    if (!editingCatalogName.trim()) return;

    try {
      const { error } = await supabase
        .from('catalog_roles')
        .update({ name: editingCatalogName.trim() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success('Elemento actualizado.');
      setEditingCatalogItem(null);
      fetchCatalogItems(selectedCategory);
    } catch (err: any) {
      console.error('Error updating catalog item:', err);
      toast.error('No se pudo actualizar: ' + err.message);
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar elemento de catálogo',
      message: '¿Estás seguro de eliminar este elemento?\n\nSi está siendo usado por algún miembro en el CRM, esto podría afectar su visualización.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('catalog_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Elemento eliminado.');
      fetchCatalogItems(selectedCategory);
    } catch (err: any) {
      console.error('Error deleting catalog item:', err);
      toast.error('No se pudo eliminar: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="space-y-6 max-w-5xl"
    >
      <AdminHeader 
        title="Datos y Parámetros del Sistema" 
        description="Gestiona la información global de la iglesia, enlaces a redes sociales y las listas dinámicas de cargos, talentos y dones."
      />

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-250 mb-6 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings size={14} />
          Datos de la Iglesia
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('catalogs')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalogs' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Tags size={14} />
          Parámetros y Catálogos
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'settings' ? (
          <motion.form 
            key="settings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Contact Information */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                  <Phone size={18} className="text-gold" />
                  Información de Contacto
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Teléfono Secretaría</label>
                    <input 
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      {...register('phone')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="+593 98 526 3122"
                    />
                    {errors.phone && <p className="text-accent-red text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">Correo Electrónico</label>
                    <input 
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="iece_jerusalen@hotmail.com"
                    />
                    {errors.email && <p className="text-accent-red text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">Dirección Física</label>
                    <input 
                      id="address"
                      type="text"
                      autoComplete="street-address"
                      {...register('address')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Baquerizo Moreno entre Av. Colón y Tulcán"
                    />
                    {errors.address && <p className="text-accent-red text-xs mt-1">{errors.address.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="google_maps_url" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">URL Google Maps (Iframe/Embed Link)</label>
                    <input 
                      id="google_maps_url"
                      type="text"
                      autoComplete="url"
                      {...register('google_maps_url')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono text-xs"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                    {errors.google_maps_url && <p className="text-accent-red text-xs mt-1">{errors.google_maps_url.message}</p>}
                  </div>
                </div>
              </div>

              {/* Card 2: Financial Details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                  <Landmark size={18} className="text-gold" />
                  Cuentas y Finanzas
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="bank_name" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">Nombre del Banco</label>
                    <input 
                      id="bank_name"
                      type="text"
                      autoComplete="off"
                      {...register('bank_name')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Banco Guayaquil"
                    />
                    {errors.bank_name && <p className="text-accent-red text-xs mt-1">{errors.bank_name.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="bank_account" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">Número de Cuenta</label>
                    <input 
                      id="bank_account"
                      type="text"
                      autoComplete="off"
                      {...register('bank_account')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="15830697"
                    />
                    {errors.bank_account && <p className="text-accent-red text-xs mt-1">{errors.bank_account.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="ruc" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">RUC de la Iglesia</label>
                    <input 
                      id="ruc"
                      type="text"
                      autoComplete="off"
                      {...register('ruc')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="0991437045001"
                    />
                    {errors.ruc && <p className="text-accent-red text-xs mt-1">{errors.ruc.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="chat_retention_days" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">Días de Retención del Chat Efímero (pg_cron)</label>
                    <input 
                      id="chat_retention_days"
                      type="number"
                      autoComplete="off"
                      {...register('chat_retention_days', { valueAsNumber: true })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold text-gray-800 dark:text-gray-100"
                      placeholder="7"
                      min="1"
                      max="365"
                    />
                    {errors.chat_retention_days && <p className="text-accent-red text-xs mt-1">{errors.chat_retention_days.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Social Media Links */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-lg text-primary flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                <Share2 size={18} className="text-gold" />
                Redes Sociales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="facebook_url" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">Facebook URL</label>
                  <input 
                    id="facebook_url"
                    type="url"
                    autoComplete="url"
                    {...register('facebook_url')}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="https://facebook.com/..."
                  />
                  {errors.facebook_url && <p className="text-accent-red text-xs mt-1">{errors.facebook_url.message}</p>}
                </div>

                <div>
                  <label htmlFor="instagram_url" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">Instagram URL</label>
                  <input 
                    id="instagram_url"
                    type="url"
                    autoComplete="url"
                    {...register('instagram_url')}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="https://instagram.com/..."
                  />
                  {errors.instagram_url && <p className="text-accent-red text-xs mt-1">{errors.instagram_url.message}</p>}
                </div>

                <div>
                  <label htmlFor="youtube_url" className="block text-xs font-semibold text-gray-500 dark:text-gray-455 uppercase tracking-wider mb-1">YouTube Channel URL</label>
                  <input 
                    id="youtube_url"
                    type="url"
                    autoComplete="url"
                    {...register('youtube_url')}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="https://youtube.com/..."
                  />
                  {errors.youtube_url && <p className="text-accent-red text-xs mt-1">{errors.youtube_url.message}</p>}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div 
            key="catalogs-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {/* Category selection list (left sidebar) */}
            <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-4 rounded-2xl shadow-xs space-y-1.5 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block px-2">Categorías de Catálogo</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setEditingCatalogItem(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-50 dark:bg-blue-950/20 text-primary dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-2xs'
                      : 'text-gray-550 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog content panel (right 3 cols) */}
            <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-lg">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Agrega y edita los valores predeterminados para la ficha de miembros en el CRM.
                </p>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddCatalog} className="flex gap-2">
                <label htmlFor="new_catalog_name" className="sr-only">Nombre del catálogo</label>
                <input
                  id="new_catalog_name"
                  type="text"
                  autoComplete="off"
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  className="flex-grow px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder={`Agregar nuevo a ${CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase()}...`}
                />
                <button
                  type="submit"
                  disabled={!newCatalogName.trim()}
                  className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </form>

              {/* List grid */}
              <div className="border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden">
                {catalogLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : catalogItems.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {catalogItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                        {editingCatalogItem?.id === item.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <label htmlFor={`edit_catalog_${item.id}`} className="sr-only">Editar catálogo</label>
                            <input
                              id={`edit_catalog_${item.id}`}
                              type="text"
                              autoComplete="off"
                              value={editingCatalogName}
                              onChange={(e) => setEditingCatalogName(e.target.value)}
                              className="flex-grow px-3 py-1 bg-white dark:bg-slate-850 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary/20 font-semibold"
                            />
                            <button
                              onClick={() => handleUpdateCatalog(item)}
                              className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingCatalogItem(null)}
                              className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg cursor-pointer transition-colors"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-gray-750 dark:text-gray-300">{item.name}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteCatalog(item.id)}
                                className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-gray-400 font-semibold">
                    No hay elementos en esta categoría.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsManager;
