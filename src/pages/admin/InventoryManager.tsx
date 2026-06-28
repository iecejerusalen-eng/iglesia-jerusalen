import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Calendar,
  DollarSign,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Filter,
  RefreshCw,
  PlusCircle,
  LayoutGrid,
  List,
  Play
} from 'lucide-react';
import type { InventoryCategory, InventoryItem } from '../../types';
import MediaSearchModal from '../../components/admin/MediaSearchModal';

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  category_id: z.string().min(1, 'La categoría es obligatoria'),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  status: z.enum(['buen_estado', 'reparacion', 'critico']),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  purchase_date: z.string().optional().nullable().or(z.literal('')),
  product_link: z.string().url('Ingrese un enlace válido (con http:// o https://)').or(z.literal('')).optional().nullable(),
  video_url: z.string().url('Ingrese un enlace válido (con http:// o https://)').or(z.literal('')).optional().nullable(),
  photo_url: z.string().url('Ingrese un enlace válido (con http:// o https://)').or(z.literal('')).optional().nullable(),
  description: z.string().optional().nullable().or(z.literal('')),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
};

const InventoryManager = () => {
  const { isReadOnly } = usePermissions();
  const readOnly = isReadOnly('inventory');
  const confirm = useConfirmStore((state) => state.confirm);

  // Database lists
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // View Mode & Video playing states
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  // Media Search Modal states
  const [isMediaSearchOpen, setIsMediaSearchOpen] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<'photo_url' | 'video_url' | null>(null);

  // Main Item Form Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Category Management Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      category_id: '',
      quantity: 1,
      status: 'buen_estado',
      price: 0,
      purchase_date: '',
      product_link: '',
      video_url: '',
      photo_url: '',
      description: '',
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase
          .from('inventory_items')
          .select('*, inventory_categories(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('inventory_categories')
          .select('*')
          .order('name')
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;

      setItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      toast.error('No se pudieron cargar los datos del inventario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    if (readOnly) return;
    setEditingItem(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    reset({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      quantity: 1,
      status: 'buen_estado',
      price: 0,
      purchase_date: '',
      product_link: '',
      video_url: '',
      photo_url: '',
      description: '',
    });
    setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    if (readOnly) return;
    setEditingItem(item);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    reset({
      name: item.name,
      category_id: item.category_id || '',
      quantity: item.quantity,
      status: item.status,
      price: item.price,
      purchase_date: item.purchase_date || '',
      product_link: item.product_link || '',
      video_url: item.video_url || '',
      photo_url: item.photo_url || '',
      description: item.description || '',
    });
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const timestamp = Date.now();
      const filename = `item_${timestamp}.${fileExt}`;
      const path = `photos/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('inventory')
        .upload(path, file, { cacheControl: '31536000', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('inventory').getPublicUrl(path);
      return data?.publicUrl || null;
    } catch (err: any) {
      console.error('Error uploading item photo:', err);
      toast.error('Error al subir la imagen: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: InventoryItemFormData) => {
    if (readOnly) return;
    setSaving(true);
    try {
      let photoUrl = data.photo_url || (editingItem ? editingItem.photo_url : null);

      if (selectedFile) {
        const uploadedUrl = await uploadPhoto(selectedFile);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      const payload = {
        name: data.name,
        category_id: data.category_id || null,
        quantity: data.quantity,
        status: data.status,
        price: data.price,
        purchase_date: data.purchase_date || null,
        product_link: data.product_link || null,
        video_url: data.video_url || null,
        description: data.description || null,
        photo_url: photoUrl
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Articulo de inventario actualizado correctamente.');
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert(payload);

        if (error) throw error;
        toast.success('Articulo registrado exitosamente en el inventario.');
      }

      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving inventory item:', err);
      toast.error('Error al guardar artículo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item: InventoryItem) => {
    if (readOnly) return;
    const confirmed = await confirm({
      title: 'Eliminar artículo',
      message: `¿Estás seguro de que deseas eliminar "${item.name}" del inventario?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      // Intentar borrar la imagen del storage si es una URL interna
      if (item.photo_url) {
        try {
          const urlParts = item.photo_url.split('/storage/v1/object/public/inventory/');
          if (urlParts.length === 2) {
            const storagePath = urlParts[1];
            await supabase.storage.from('inventory').remove([storagePath]);
          }
        } catch (storageErr) {
          console.warn('Advertencia al eliminar foto de storage:', storageErr);
        }
      }

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      toast.success('Artículo eliminado del inventario.');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting inventory item:', err);
      toast.error('Error al eliminar artículo: ' + err.message);
    }
  };

  // Category CRUD
  const addCategory = async () => {
    if (readOnly) return;
    if (!newCategoryName.trim()) {
      toast.error('Ingrese un nombre de categoría válido.');
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_categories')
        .insert({ name: newCategoryName.trim() });

      if (error) throw error;

      toast.success('Categoría agregada correctamente.');
      setNewCategoryName('');
      fetchData();
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast.error('Error al agregar categoría: ' + err.message);
    }
  };

  const deleteCategory = async (catId: string, catName: string) => {
    if (readOnly) return;
    const confirmed = await confirm({
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría "${catName}"?\n\nLos artículos de esta categoría se quedarán "Sin categoría".`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingCatId(catId);
    try {
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', catId);

      if (error) throw error;

      toast.success('Categoría eliminada con éxito.');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error('Error al eliminar categoría: ' + err.message);
    } finally {
      setDeletingCatId(null);
    }
  };

  // Filters logic
  const filteredItems = items.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      filterCategory === 'all' ||
      (filterCategory === 'none' && !item.category_id) ||
      item.category_id === filterCategory;

    const matchStatus = filterStatus === 'all' || item.status === filterStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  // Stats
  const totalItemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalFinancialValue = items.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
  const criticalItemsCount = items.filter((item) => item.status === 'critico').reduce((acc, curr) => acc + curr.quantity, 0);
  const repairItemsCount = items.filter((item) => item.status === 'reparacion').reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary dark:text-church-gold-bright flex items-center gap-2.5">
            <Package size={28} className="text-gold" />
            Inventario de Equipos y Herramientas
          </h1>
          <p className="text-gray-500 dark:text-gray-450 text-sm mt-1">Control inteligente y estado de los bienes físicos de la congregación.</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-2xs font-semibold text-xs cursor-pointer"
            >
              <Tag size={15} className="text-gold" />
              Categorías
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-900 transition-colors shadow-sm font-semibold text-xs cursor-pointer border border-transparent"
            >
              <Plus size={16} />
              Agregar Artículo
            </button>
          </div>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Package size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Unidades Totales</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{totalItemsCount}</span>
          </div>
          <div className="absolute top-0 right-0 h-full w-1.5 bg-blue-500" />
        </div>

        {/* Total Value */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Valor Estimado</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              S/. {totalFinancialValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="absolute top-0 right-0 h-full w-1.5 bg-emerald-500" />
        </div>

        {/* Repair Needed */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Falta Reparación</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{repairItemsCount}</span>
          </div>
          <div className="absolute top-0 right-0 h-full w-1.5 bg-amber-500" />
        </div>

        {/* Critical Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
            <AlertOctagon size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado Crítico</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{criticalItemsCount}</span>
          </div>
          <div className="absolute top-0 right-0 h-full w-1.5 bg-red-500" />
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción de artículo..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none bg-gray-50/50 dark:bg-slate-700/50 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-slate-700 transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs font-semibold select-none">
            <Filter size={14} />
            <span>Filtros:</span>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none font-semibold text-gray-650 dark:text-gray-200"
          >
            <option value="all">Todas las Categorías</option>
            <option value="none">Sin Categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none font-semibold text-gray-650 dark:text-gray-200"
          >
            <option value="all">Todos los Estados</option>
            <option value="buen_estado">Buen Estado</option>
            <option value="reparacion">Falta Reparación</option>
            <option value="critico">Crítico</option>
          </select>

          {/* View Mode toggler */}
          <div className="flex border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden p-0.5 bg-gray-50/50 dark:bg-slate-700/50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600'
              }`}
              title="Vista de Tabla"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex justify-center items-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredItems.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const statusLabels = {
                buen_estado: 'Buen Estado',
                reparacion: 'Reparación Requerida',
                critico: 'Estado Crítico'
              };

              const statusColors = {
                buen_estado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                reparacion: 'bg-amber-50 text-amber-700 border-amber-100',
                critico: 'bg-red-50 text-red-700 border-red-105'
              };

              const statusIcons = {
                buen_estado: <CheckCircle size={12} className="text-emerald-600" />,
                reparacion: <AlertTriangle size={12} className="text-amber-600" />,
                critico: <AlertOctagon size={12} className="text-red-600" />
              };

              return (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  {/* Photo container */}
                  <div className="h-44 bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6 border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon size={48} className="mb-2 text-gray-250" />
                        <span className="text-[10px] text-gray-400">Sin foto del artículo</span>
                      </div>
                    )}

                    {/* Quantity Floating Badge */}
                    <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/10 select-none">
                      Cant: {item.quantity}
                    </div>

                    {/* Video indicator badge */}
                    {item.video_url && (
                      <div className="absolute top-3 right-3 bg-red-650 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border border-white/10 flex items-center gap-1 select-none">
                        <Play size={10} className="fill-white" />
                        <span>Video</span>
                      </div>
                    )}
                  </div>

                  {/* Details container */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
                    <div className="space-y-2.5">
                      {/* Category & Status row */}
                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold uppercase tracking-wide truncate">
                          <Tag size={10} />
                          {item.inventory_categories?.name || 'Sin categoría'}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[item.status]}`}>
                          {statusIcons[item.status]}
                          {statusLabels[item.status]}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base leading-snug group-hover:text-primary dark:group-hover:text-church-gold-bright transition-colors truncate">
                        {item.name}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-400 text-xs line-clamp-2 h-8 leading-relaxed font-normal">
                        {item.description || 'Sin descripción detallada.'}
                      </p>
                    </div>

                    {/* Price & Actions Row */}
                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Precio Unitario</span>
                        <span className="text-sm font-extrabold text-gray-700 dark:text-gray-300 font-mono">
                          S/. {item.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.video_url && (
                          <button
                            onClick={() => setPlayingVideoUrl(item.video_url)}
                            className="p-1.5 rounded-lg border border-gray-150 dark:border-white/10 hover:bg-red-50 text-red-500 hover:border-red-100 transition-colors cursor-pointer"
                            title="Ver Video de Demostración"
                          >
                            <Play size={14} className="fill-red-500 text-red-500" />
                          </button>
                        )}

                        {item.product_link && (
                          <a
                            href={item.product_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-gray-150 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Ver enlace del producto"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        
                        {item.purchase_date && (
                          <div
                            className="p-1.5 rounded-lg border border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-400 cursor-help flex items-center justify-center"
                            title={`Adquirido el: ${new Date(item.purchase_date).toLocaleDateString('es-PE')}`}
                          >
                            <Calendar size={14} />
                          </div>
                        )}

                        {!readOnly && (
                          <>
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-700 transition-colors cursor-pointer"
                              title="Editar artículo"
                            >
                              <Edit3 size={14} />
                            </button>
                            
                            <button
                              onClick={() => deleteItem(item)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Eliminar artículo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View Layout */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-450 text-[10px] font-bold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
                    <th className="py-4 px-6 w-16">Foto</th>
                    <th className="py-4 px-6">Artículo</th>
                    <th className="py-4 px-6">Categoría</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-center">Cant.</th>
                    <th className="py-4 px-6 text-right">Precio Unit.</th>
                    <th className="py-4 px-6 text-right">Valor Total</th>
                    <th className="py-4 px-6">Adquisición</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-700 dark:text-gray-300">
                  {filteredItems.map((item) => {
                    const statusLabels = {
                      buen_estado: 'Buen Estado',
                      reparacion: 'Reparación',
                      critico: 'Crítico'
                    };

                    const statusColors = {
                      buen_estado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      reparacion: 'bg-amber-50 text-amber-700 border-amber-100',
                      critico: 'bg-red-50 text-red-750 border-red-105'
                    };

                    const totalValue = item.quantity * item.price;

                    return (
                      <tr key={item.id} className="hover:bg-gray-55/40 transition-colors">
                        <td className="py-3 px-6">
                          <div className="w-10 h-10 rounded-lg border border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-1 relative select-none">
                            {item.photo_url ? (
                              <img loading="lazy" src={item.photo_url} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <ImageIcon size={16} className="text-gray-300" />
                            )}
                            {item.video_url && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Play size={10} className="text-white fill-white" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <span className="font-bold text-gray-850 block">{item.name}</span>
                          {item.description && (
                            <span className="text-[10px] text-gray-400 font-normal block truncate max-w-[200px]" title={item.description}>
                              {item.description}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-450">
                          {item.inventory_categories?.name || 'Sin categoría'}
                        </td>
                        <td className="py-3 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center font-bold text-gray-800 dark:text-gray-100">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-6 text-right font-mono text-gray-600 dark:text-gray-400">
                          S/. {item.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-6 text-right font-mono font-bold text-gray-800 dark:text-gray-100">
                          S/. {totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-6 text-gray-400 text-xs font-semibold">
                          {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('es-PE') : '-'}
                        </td>
                        <td className="py-3 px-6 text-right space-x-1 whitespace-nowrap">
                          {item.video_url && (
                            <button
                              onClick={() => setPlayingVideoUrl(item.video_url)}
                              className="p-1 rounded-lg border border-gray-150 dark:border-white/10 hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                              title="Reproducir Video"
                            >
                              <Play size={12} className="fill-red-500 text-red-500" />
                            </button>
                          )}
                          {item.product_link && (
                            <a
                              href={item.product_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-1 rounded-lg border border-gray-150 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Ver enlace"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {!readOnly && (
                            <>
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-700 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => deleteItem(item)}
                                className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-xs">
          <Package size={52} className="mx-auto text-gray-300 mb-4 opacity-75" />
          <h3 className="text-lg font-serif font-bold text-gray-750">No se encontraron artículos</h3>
          <p className="text-gray-400 text-sm mt-1">Intente cambiar los filtros de búsqueda o registre un nuevo artículo.</p>
        </div>
      )}

      {/* Item Creation/Editing Side Slide/Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-white/10 my-4 animate-scaleIn overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 bg-primary text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Package size={18} />
                </div>
                <h2 className="text-lg font-serif font-bold">
                  {editingItem ? 'Editar Artículo' : 'Nuevo Artículo de Inventario'}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Nombre del Artículo *</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Ej: Consola Digital Behringer X32"
                  className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Categoría *</label>
                  <select
                    {...register('category_id')}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  >
                    <option value="">Seleccione una categoría...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Estado de Conservación *</label>
                  <select
                    {...register('status')}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  >
                    <option value="buen_estado">Buen Estado</option>
                    <option value="reparacion">Falta Reparación</option>
                    <option value="critico">Crítico (Inservible / Urgente Reemplazo)</option>
                  </select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Cantidad *</label>
                  <input
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Precio Unitario (S/.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Fecha de Adquisición</label>
                  <input
                    type="date"
                    {...register('purchase_date')}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  {errors.purchase_date && <p className="text-red-500 text-xs mt-1">{errors.purchase_date.message}</p>}
                </div>
              </div>

              {/* Product Reference Link & Video Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Enlace del Producto / Referencia</label>
                  <input
                    type="text"
                    {...register('product_link')}
                    placeholder="https://ejemplo.com/producto"
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  {errors.product_link && <p className="text-red-500 text-xs mt-1">{errors.product_link.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Video Demostración (YouTube/Vimeo)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...register('video_url')}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-grow border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMediaTargetField('video_url');
                        setIsMediaSearchOpen(true);
                      }}
                      className="px-3.5 py-2 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary rounded-xl text-xs font-semibold shadow-2xs bg-white dark:bg-slate-900 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                    >
                      <Search size={13} />
                      Asistente
                    </button>
                  </div>
                  {errors.video_url && <p className="text-red-500 text-xs mt-1">{errors.video_url.message}</p>}
                </div>
              </div>

              {/* Photo Link & Local Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Fotografía del Artículo</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={watch('photo_url') || ''}
                    onChange={(e) => setValue('photo_url', e.target.value)}
                    placeholder="URL directa de imagen de stock o presione el Asistente..."
                    className="flex-grow border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTargetField('photo_url');
                      setIsMediaSearchOpen(true);
                    }}
                    className="px-3.5 py-2.5 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary rounded-xl text-xs font-semibold shadow-2xs bg-white dark:bg-slate-900 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Search size={13} />
                    Asistente
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-grow flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50 hover:bg-gray-55 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer animate-none"
                      disabled={saving}
                    />
                    <ImageIcon size={18} className="text-gray-400 mb-1" />
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-450 text-center">
                      {selectedFile ? selectedFile.name : 'O suba / arrastre una imagen local para almacenarla en Supabase'}
                    </span>
                  </div>
                  {(selectedFile || watch('photo_url') || editingItem?.photo_url) && (
                    <div className="w-14 h-14 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-slate-950 p-1 flex items-center justify-center flex-shrink-0">
                      <img loading="lazy" 
                        src={selectedFile ? URL.createObjectURL(selectedFile) : (watch('photo_url') || editingItem?.photo_url || '')} 
                        alt="Miniatura" 
                        className="max-w-full max-h-full object-contain" 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wide mb-1">Descripción / Notas</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="Detalles adicionales, marca, número de serie, ubicación en la iglesia..."
                  className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-450 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  disabled={saving || uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-blue-900 rounded-xl transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 border border-transparent"
                  disabled={saving || uploading}
                >
                  {saving || uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      {uploading ? 'Subiendo imagen...' : 'Guardando...'}
                    </>
                  ) : (
                    <>
                      {editingItem ? <RefreshCw size={14} /> : <Plus size={14} />}
                      {editingItem ? 'Actualizar Artículo' : 'Registrar Artículo'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowCategoryModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-white/10 my-4 animate-scaleIn overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5 bg-primary text-white">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-gold" />
                <h3 className="text-base font-serif font-bold">Gestión de Categorías</h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Add category form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de nueva categoría..."
                  className="flex-1 text-sm border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <PlusCircle size={14} />
                  Añadir
                </button>
              </div>

              {/* List of categories */}
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Categorías Existentes</h4>
                {categories.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay categorías configuradas.</p>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-white/10 rounded-xl hover:bg-white transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Tag size={12} className="text-gold" />
                        {cat.name}
                      </span>
                      <button
                        onClick={() => deleteCategory(cat.id, cat.name)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-650 transition-colors cursor-pointer"
                        disabled={deletingCatId === cat.id}
                        title="Eliminar categoría"
                      >
                        {deletingCatId === cat.id ? (
                          <Loader2 className="animate-spin text-red-500" size={12} />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-white/5 flex justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 hover:bg-gray-150 text-gray-500 dark:text-gray-450 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideoUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative bg-black rounded-3xl overflow-hidden w-full max-w-3xl aspect-video border border-white/10 shadow-2xl animate-scaleIn">
            <button
              onClick={() => setPlayingVideoUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            {(() => {
              const ytId = getYoutubeId(playingVideoUrl);
              const vimId = getVimeoId(playingVideoUrl);
              if (ytId) {
                return (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                    title="YouTube video player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              } else if (vimId) {
                return (
                  <iframe
                    src={`https://player.vimeo.com/video/${vimId}?autoplay=1`}
                    title="Vimeo video player"
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                );
              } else {
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 gap-3 bg-slate-900">
                    <AlertTriangle size={48} className="text-amber-500" />
                    <p className="text-sm font-semibold">Formato de video no compatible directamente.</p>
                    <a
                      href={playingVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary hover:bg-blue-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      Abrir enlace en pestaña nueva
                      <ExternalLink size={14} />
                    </a>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* Media Search assistant modal */}
      <MediaSearchModal
        isOpen={isMediaSearchOpen}
        onClose={() => {
          setIsMediaSearchOpen(false);
          setMediaTargetField(null);
        }}
        onSelect={(url, options) => {
          if (mediaTargetField === 'photo_url') {
            setValue('photo_url', url, { shouldValidate: true });
          } else if (mediaTargetField === 'video_url') {
            setValue('video_url', options?.videoUrl || url, { shouldValidate: true });
            // Auto-set the photo URL if a thumbnail was generated and no photo is set
            if (options?.thumbnailUrl) {
              setValue('photo_url', options.thumbnailUrl, { shouldValidate: true });
            }
          }
        }}
        allowedTypes={mediaTargetField === 'video_url' ? ['video'] : ['image']}
        title={mediaTargetField === 'video_url' ? 'Asistente de Video (YouTube/Vimeo)' : 'Asistente de Fotografía'}
      />
    </div>
  );
};

export default InventoryManager;
