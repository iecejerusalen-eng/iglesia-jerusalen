import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';
import AdminHeader from '../../components/admin/AdminHeader';
import BlockEditor from '../../components/admin/BlockEditor';
import MediaUploader from '../../components/common/MediaUploader';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  Package, 
  ClipboardList, 
  AlertCircle,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Truck
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types';

// Zod Validation Schema
const productSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  price: z.number({ message: 'El precio debe ser un número válido' }).min(0, 'El precio no puede ser negativo'),
  stock: z.number({ message: 'El stock debe ser un número entero' }).int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  type: z.enum(['physical', 'digital'], { message: 'El tipo debe ser Físico (physical) o Digital (digital)' }),
  image_url: z.string().url('Ingresa una URL de imagen válida').or(z.literal('')),
  description: z.string().min(1, 'La descripción es obligatoria'),
  features: z.string().optional(),
  drive_link: z.string().url('Ingresa una URL de Google Drive válida').or(z.literal('')),
  instructions: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  category: string;
  type?: 'physical' | 'digital';
  features?: any;
  cover_image_url?: string | null;
  created_at: string;
}

interface FormVariant {
  id?: string;
  color_name: string;
  color_hex: string;
  size: string;
  cloudinary_image_url: string;
  stock: number;
  price_adjustment: number;
}

const getPlainDescription = (desc: string | null) => {
  if (!desc) return '';
  if (desc.trim().startsWith('[')) {
    try {
      const blocks = JSON.parse(desc);
      if (Array.isArray(blocks)) {
        return blocks
          .map((b: any) => b.text || b.title || '')
          .filter(Boolean)
          .join(' ')
          .replace(/<[^>]*>/g, '');
      }
    } catch {
      // fallback
    }
  }
  return desc.replace(/<[^>]*>/g, '');
};

const StoreManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);

  // Estados de carga de archivos
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Estado para variantes
  const [variants, setVariants] = useState<FormVariant[]>([]);

  // Estados para órdenes
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: undefined,
      stock: undefined,
      category: 'Libros',
      type: 'physical',
      image_url: '',
      description: '',
      features: '',
      drive_link: '',
      instructions: '',
    }
  });

  const productType = watch('type');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as DbProduct[]);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      toast.error('Error al cargar productos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*),
            product_variants (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      toast.error('Error al cargar pedidos: ' + err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setVariants([]);
    reset({
      name: '',
      price: undefined,
      stock: undefined,
      category: 'Libros',
      type: 'physical',
      image_url: '',
      description: '',
      features: '',
      drive_link: '',
      instructions: '',
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const handleOpenEdit = async (product: DbProduct) => {
    setEditingProduct(product);
    
    let featuresStr = '';
    if (Array.isArray(product.features)) {
      featuresStr = product.features.join('\n');
    } else if (typeof product.features === 'string') {
      try {
        const parsed = JSON.parse(product.features);
        if (Array.isArray(parsed)) {
          featuresStr = parsed.join('\n');
        }
      } catch {
        featuresStr = product.features;
      }
    }

    reset({
      name: product.name,
      price: Number(product.price),
      stock: Number(product.stock),
      category: product.category,
      type: product.type || 'physical',
      image_url: product.image_url || '',
      description: product.description || '',
      features: featuresStr,
      drive_link: '',
      instructions: '',
    });
    
    setImagePreview(product.image_url || null);

    // Cargar variantes
    const { data: varsData } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id);

    setVariants((varsData || []).map(v => ({
      id: v.id,
      color_name: v.color_name || '',
      color_hex: v.color_hex || '',
      size: v.size || '',
      cloudinary_image_url: v.cloudinary_image_url || '',
      stock: v.stock || 0,
      price_adjustment: Number(v.price_adjustment) || 0
    })));

    // Cargar asset digital si aplica
    if (product.type === 'digital') {
      const { data: assetData } = await supabase
        .from('product_digital_assets')
        .select('*')
        .eq('product_id', product.id)
        .maybeSingle();

      if (assetData) {
        setValue('drive_link', assetData.drive_link);
        setValue('instructions', assetData.instructions || '');
      }
    }

    setShowForm(true);
  };

  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev,
      { color_name: '', color_hex: '', size: '', cloudinary_image_url: '', stock: 0, price_adjustment: 0 }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariantField = (index: number, field: keyof FormVariant, value: any) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const onSubmit = async (data: ProductForm) => {
    setActionLoading(true);
    try {
      const featuresArray = data.features ? data.features.split('\n').map(f => f.trim()).filter(Boolean) : [];

      const productPayload = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        type: data.type,
        image_url: data.image_url || null,
        features: featuresArray,
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { data: newProd, error } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single();

        if (error) throw error;
        productId = newProd.id;
      }

      // Sincronizar variantes y recursos digitales
      if (data.type === 'physical') {
        // Eliminar variantes antiguas
        await supabase.from('product_variants').delete().eq('product_id', productId);
        // Insertar variantes actuales
        if (variants.length > 0) {
          const variantsToInsert = variants.map(v => ({
            product_id: productId,
            color_name: v.color_name || null,
            color_hex: v.color_hex || null,
            size: v.size || null,
            cloudinary_image_url: v.cloudinary_image_url || null,
            stock: Number(v.stock) || 0,
            price_adjustment: Number(v.price_adjustment) || 0
          }));
          const { error: varErr } = await supabase.from('product_variants').insert(variantsToInsert);
          if (varErr) throw varErr;
        }
        // Limpiar assets digitales si existían
        await supabase.from('product_digital_assets').delete().eq('product_id', productId);
      } else {
        // Digital
        await supabase.from('product_digital_assets').delete().eq('product_id', productId);
        if (data.drive_link) {
          const { error: assetErr } = await supabase.from('product_digital_assets').insert({
            product_id: productId,
            drive_link: data.drive_link,
            instructions: data.instructions || null
          });
          if (assetErr) throw assetErr;
        }
        // Limpiar variantes si existían
        await supabase.from('product_variants').delete().eq('product_id', productId);
      }

      toast.success(editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      toast.error('Error al guardar el producto: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Ocultar producto',
      message: '¿Estás seguro de ocultar este producto del catálogo? (Se realizará un borrado lógico)',
      confirmText: 'Ocultar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Producto ocultado con éxito.');
      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error('No se pudo eliminar el producto: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Pedido actualizado a: ${newStatus}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error('Error updating order:', err);
      toast.error('Error al actualizar el estado: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper para sugerir auto-cambio a ready_for_pickup
  const handleApproveTransfer = async (order: Order) => {
    const hasPhysical = order.order_items?.some((item: any) => item.products?.type === 'physical');
    if (hasPhysical) {
      const changeStatus = await confirm({
        title: 'Productos físicos detectados',
        message: 'Este pedido contiene productos físicos. ¿Quieres marcarlo directamente como "Listo para Retirar" (ready_for_pickup) en lugar de "Pagado" (paid)?',
        confirmText: 'Sí, cambiar',
        cancelText: 'No, mantener Pagado',
        variant: 'info',
      });
      if (changeStatus) {
        await handleUpdateOrderStatus(order.id, 'ready_for_pickup');
        return;
      }
    }
    await handleUpdateOrderStatus(order.id, 'paid');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            Esperando Pago
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-250">
            <CheckCircle2 size={12} />
            Pagado
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-250">
            <Truck size={12} />
            Listo para Retirar
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10">
            <CheckCircle2 size={12} />
            Entregado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={12} />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-150 text-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="space-y-6 max-w-6xl"
    >
      <AdminHeader 
        title="Gestor de la Tienda" 
        description="Administra los productos literarios, música y recursos, y realiza despachos y verificación de transferencias."
        action={
          !showForm && activeTab === 'products' && (
            <button
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer animate-fade-in"
            >
              <Plus size={16} />
              Nuevo Producto
            </button>
          )
        }
      />

      {/* Tabs */}
      {!showForm && (
        <div className="flex border-b border-gray-250">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'products' 
                ? 'border-primary text-primary font-bold' 
                : 'border-transparent text-gray-500 hover:text-primary'
            }`}
          >
            <Package size={16} />
            Productos / Recursos
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'orders' 
                ? 'border-primary text-primary font-bold' 
                : 'border-transparent text-gray-500 hover:text-primary'
            }`}
          >
            <ClipboardList size={16} />
            Pedidos y Despacho
            {orders.filter(o => o.status === 'pending_payment' && o.payment_method === 'transfer').length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {orders.filter(o => o.status === 'pending_payment' && o.payment_method === 'transfer').length}
              </span>
            )}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del Producto</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Ej. Camiseta Oficial Iglesia Jerusalén"
                />
                {errors.name && <p className="text-accent-red text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Precio Base ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-accent-red text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Stock Base</label>
                  <input
                    type="number"
                    min="0"
                    {...register('stock', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="10"
                  />
                  {errors.stock && <p className="text-accent-red text-xs mt-1">{errors.stock.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de Producto</label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                  >
                    <option value="physical">Físico</option>
                    <option value="digital">Digital / Descargable</option>
                  </select>
                  {errors.type && <p className="text-accent-red text-xs mt-1">{errors.type.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Categoría</label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                  >
                    <option value="Libros">Libros</option>
                    <option value="Música">Música</option>
                    <option value="Ropa">Ropa</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Recursos">Recursos</option>
                  </select>
                  {errors.category && <p className="text-accent-red text-xs mt-1">{errors.category.message}</p>}
                </div>
              </div>

              {/* Imagen Portada */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Imagen Principal (Cloudinary)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="border border-dashed border-gray-250 rounded-xl p-4 text-center hover:bg-gray-50/50 transition-colors flex flex-col items-center justify-center gap-2">
                    <MediaUploader
                      folder="productos"
                      allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                      label="Subir Imagen de Portada"
                      onUploadSuccess={(url) => {
                        setValue('image_url', url);
                        setImagePreview(url);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <div className="relative w-20 h-20 rounded-xl border border-gray-150 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-slate-950 flex-shrink-0">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setValue('image_url', '');
                          }}
                          className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 hover:bg-red-700 shadow-sm cursor-pointer border border-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 flex items-center justify-center text-gray-300 text-[10px] font-semibold flex-shrink-0">
                        Sin Imagen
                      </div>
                    )}
                    <div className="flex-grow">
                      <span className="text-[10px] text-gray-400 font-bold block mb-1">O ingresa URL de imagen</span>
                      <input
                        type="url"
                        {...register('image_url')}
                        className="w-full px-3 py-1.5 border border-gray-250 rounded-lg text-xs focus:outline-none"
                        placeholder="https://cloudinary.com/imagen.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Características del Producto */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Características / ¿Qué incluye? (Una por línea)
                </label>
                <textarea
                  {...register('features')}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Ej. Algodón premium&#10;Logo bordado&#10;Guía de lavado"
                />
              </div>

              {/* Sección Digital */}
              {productType === 'digital' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 bg-purple-50/30 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-150 dark:border-purple-500/20"
                >
                  <h4 className="font-bold text-sm text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    Configuración de Recurso Digital Seguro
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">Enlace Seguro de Google Drive</label>
                      <input
                        type="text"
                        {...register('drive_link')}
                        className="w-full px-4 py-2 border border-purple-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none"
                        placeholder="https://drive.google.com/..."
                      />
                      {errors.drive_link && <p className="text-accent-red text-xs mt-1">{errors.drive_link.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">Instrucciones de Descarga</label>
                      <input
                        type="text"
                        {...register('instructions')}
                        className="w-full px-4 py-2 border border-purple-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none"
                        placeholder="Ej. Contraseña para descomprimir: Iglesia2026"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sección Físico: Variantes */}
              {productType === 'physical' && (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base">Variantes de Producto (Tallas, Colores)</h4>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-primary hover:bg-primary/5 text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      Añadir Variante
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <p className="text-xs text-gray-450 dark:text-gray-500 italic">No has agregado ninguna variante. El producto se venderá con su precio y stock base generales.</p>
                  ) : (
                    <div className="border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                            <th className="py-2.5 px-3">Color</th>
                            <th className="py-2.5 px-3">Hex</th>
                            <th className="py-2.5 px-3">Talla</th>
                            <th className="py-2.5 px-3">Foto (Cloudinary)</th>
                            <th className="py-2.5 px-3">Stock</th>
                            <th className="py-2.5 px-3">Ajuste Precio</th>
                            <th className="py-2.5 px-3 text-right">Quitar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                          {variants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={v.color_name}
                                  onChange={(e) => updateVariantField(idx, 'color_name', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                                  placeholder="Ej. Rojo"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={v.color_hex || '#000000'}
                                    onChange={(e) => updateVariantField(idx, 'color_hex', e.target.value)}
                                    className="w-7 h-7 p-0 rounded-full border border-gray-250 cursor-pointer overflow-hidden"
                                  />
                                  <input
                                    type="text"
                                    value={v.color_hex}
                                    onChange={(e) => updateVariantField(idx, 'color_hex', e.target.value)}
                                    className="w-14 px-1 py-1 border border-gray-200 dark:border-white/10 rounded-md uppercase text-[10px] text-center"
                                    placeholder="#FF0000"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={v.size}
                                  onChange={(e) => updateVariantField(idx, 'size', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                                  placeholder="Ej. XL"
                                />
                              </td>
                              <td className="py-2 px-3 flex items-center gap-2">
                                <MediaUploader
                                  folder="productos"
                                  allowedFormats={['jpg', 'png', 'webp']}
                                  label="Subir"
                                  className="py-1 px-2 text-[10px]"
                                  onUploadSuccess={(url) => updateVariantField(idx, 'cloudinary_image_url', url)}
                                />
                                {v.cloudinary_image_url && (
                                  <img 
                                    src={v.cloudinary_image_url} 
                                    alt="Variant" 
                                    className="w-7 h-7 rounded object-cover border border-gray-150 dark:border-white/10 shadow-2xs shrink-0" 
                                  />
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={(e) => updateVariantField(idx, 'stock', Number(e.target.value))}
                                  className="w-14 px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                                  min="0"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="relative flex items-center">
                                  <span className="absolute left-2 text-gray-400">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={v.price_adjustment}
                                    onChange={(e) => updateVariantField(idx, 'price_adjustment', Number(e.target.value))}
                                    className="w-16 pl-4 pr-1 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none font-bold"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(idx)}
                                  className="text-gray-400 hover:text-accent-red p-1 rounded-md hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* BlockEditor Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción del Producto</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <BlockEditor
                      content={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.description && <p className="text-accent-red text-xs mt-1">{errors.description.message}</p>}
              </div>

              {/* Controles del Formulario */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                  {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Listas de Pestañas */
          <div>
            {activeTab === 'products' ? (
              <motion.div 
                key="list-products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {loading ? (
                  <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs">
                    <Loader2 className="animate-spin text-primary dark:text-blue-400" size={32} />
                  </div>
                ) : products.length > 0 ? (
                  <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
                            <th className="py-4 px-6">Detalle</th>
                            <th className="py-4 px-6">Categoría</th>
                            <th className="py-4 px-6">Tipo</th>
                            <th className="py-4 px-6">Precio Base</th>
                            <th className="py-4 px-6">Stock</th>
                            <th className="py-4 px-6 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-750 dark:text-gray-300">
                          {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="py-4 px-6 flex items-center gap-4">
                                <img
                                  src={product.cover_image_url || product.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-100 dark:border-white/10 flex-shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-gray-800 dark:text-white block">{product.name}</span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 max-w-xs">
                                    {getPlainDescription(product.description)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-medium text-gray-650 dark:text-gray-400">
                                {product.category}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                                  product.type === 'digital' 
                                    ? 'bg-purple-550 text-purple-750 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20 font-bold' 
                                    : 'bg-blue-50 text-primary dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 font-bold'
                                }`}>
                                  {product.type === 'digital' ? 'Digital' : 'Físico'}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-bold text-gray-800 dark:text-white">
                                ${Number(product.price).toFixed(2)}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  product.stock === 0
                                    ? 'bg-red-50 text-accent-red border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/20'
                                    : product.stock <= 5
                                    ? 'bg-yellow-50 text-yellow-600 border border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-500/20'
                                    : 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/20'
                                }`}>
                                  {product.stock} disp.
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-1.5">
                                <button
                                  onClick={() => handleOpenEdit(product)}
                                  className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  disabled={actionLoading}
                                  className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-xs">
                    <Package className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                    <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-200">No hay productos en catálogo</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 font-medium">Comienza agregando un nuevo material de estudio o recurso.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Pestaña de Pedidos (Orders) */
              <motion.div 
                key="list-orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {ordersLoading ? (
                  <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs">
                    <Loader2 className="animate-spin text-primary dark:text-blue-400" size={32} />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
                            <th className="py-4 px-6">Código de Pedido</th>
                            <th className="py-4 px-6">Cliente</th>
                            <th className="py-4 px-6">Método Pago</th>
                            <th className="py-4 px-6">Total</th>
                            <th className="py-4 px-6">Estado</th>
                            <th className="py-4 px-6">Fecha</th>
                            <th className="py-4 px-6 text-right">Detalle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-750 dark:text-gray-300">
                          {orders.map((order) => {
                            const isPendingTransfer = order.status === 'pending_payment' && order.payment_method === 'transfer';
                            return (
                              <tr 
                                key={order.id} 
                                className={`hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors ${
                                  isPendingTransfer ? 'bg-amber-50/15 dark:bg-amber-900/10' : ''
                                }`}
                              >
                                <td className="py-4 px-6 font-mono font-bold text-gray-800 dark:text-white">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                  {isPendingTransfer && (
                                    <span className="ml-2 bg-amber-500 dark:bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                      Por Verificar
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  <div>
                                    <span className="font-bold text-gray-800 dark:text-white block">{order.customer_name}</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 block">{order.customer_email}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-medium dark:text-gray-300">
                                  <span className="capitalize">{order.payment_method === 'transfer' ? 'Transferencia' : 'Tarjeta'}</span>
                                </td>
                                <td className="py-4 px-6 font-bold text-primary dark:text-blue-400">
                                  ${Number(order.total).toFixed(2)}
                                </td>
                                <td className="py-4 px-6">
                                  {getStatusBadge(order.status)}
                                </td>
                                <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs font-semibold">
                                  {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="inline-flex items-center gap-1 text-primary hover:text-gold text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Eye size={14} />
                                    Gestionar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-250 dark:border-white/10 shadow-xs">
                    <ClipboardList className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                    <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-200">Sin pedidos registrados</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 font-medium">Las compras de los hermanos se reflejarán aquí de forma automática.</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detalle de Pedido (Admin) */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-gray-150 dark:border-white/10 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                    Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium font-mono">{selectedOrder.id}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                {/* Estado */}
                <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-gray-150 dark:border-white/10">
                  <div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 block font-semibold uppercase tracking-wider">Estado Actual</span>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 block font-semibold uppercase tracking-wider text-right">Total Pedido</span>
                    <span className="text-xl font-extrabold text-primary dark:text-blue-400 block mt-0.5">${Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/30 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Datos de Facturación</h4>
                    <p className="text-xs text-gray-650 dark:text-gray-400">Nombre: <span className="font-semibold text-gray-800 dark:text-white">{selectedOrder.customer_name}</span></p>
                    <p className="text-xs text-gray-650 dark:text-gray-400 mt-1">Email: <span className="font-semibold text-gray-800 dark:text-white">{selectedOrder.customer_email}</span></p>
                  </div>
                  <div className="bg-slate-50/30 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Método de Pago</h4>
                    <p className="text-xs text-gray-650 dark:text-gray-400">Tipo: <span className="font-semibold text-gray-800 dark:text-white capitalize">{selectedOrder.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito'}</span></p>
                    {selectedOrder.payment_method === 'transfer' && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-semibold">Requiere revisión manual de comprobante.</p>
                    )}
                  </div>
                </div>

                {/* Comprobante de Pago */}
                {selectedOrder.payment_method === 'transfer' && selectedOrder.payment_voucher_url && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center justify-between">
                      <span>Comprobante de Transferencia Subido:</span>
                      <a 
                        href={selectedOrder.payment_voucher_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary dark:text-blue-400 hover:text-gold text-xs font-semibold"
                      >
                        <Download size={12} />
                        Ver a tamaño completo
                      </a>
                    </h4>
                    <div className="w-full max-h-56 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 shadow-2xs relative group flex justify-center items-center">
                      <img 
                        src={selectedOrder.payment_voucher_url} 
                        alt="Comprobante de Pago" 
                        className="w-auto h-auto max-h-56 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Productos Comprados */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white">Artículos Comprados:</h4>
                  <div className="divide-y divide-gray-100 dark:divide-white/10 border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden">
                    {selectedOrder.order_items?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.products?.cover_image_url || item.products?.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'} 
                            alt={item.products?.name} 
                            className="w-10 h-10 rounded object-cover border border-gray-150 dark:border-white/10 shadow-3xs"
                          />
                          <div>
                            <span className="font-bold text-gray-800 dark:text-white block">{item.products?.name}</span>
                            <div className="flex gap-2 items-center mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                              <span className="capitalize">{item.products?.type === 'digital' ? 'Digital' : 'Físico'}</span>
                              {item.product_variants && (
                                <span>
                                  - Variante: {item.product_variants.color_name ? `${item.product_variants.color_name} ` : ''}{item.product_variants.size ? `[Talla ${item.product_variants.size}]` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-gray-800 dark:text-white">{item.quantity} x ${Number(item.price).toFixed(2)}</span>
                          <span className="block text-gray-450 dark:text-gray-500 text-[10px]">${(item.quantity * Number(item.price)).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acciones de cambio de estado / Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-gray-150 dark:border-white/10 flex flex-wrap gap-2 shrink-0">
                {selectedOrder.status === 'pending_payment' && selectedOrder.payment_method === 'transfer' && (
                  <button
                    onClick={() => handleApproveTransfer(selectedOrder)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    Aprobar Pago
                  </button>
                )}
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'ready_for_pickup')}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Truck size={14} />
                    Listo para Retirar
                  </button>
                )}
                {['paid', 'ready_for_pickup'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                    disabled={actionLoading}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    Entregar / Completar
                  </button>
                )}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                    disabled={actionLoading}
                    className="border border-red-250 dark:border-red-900 text-red-750 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors ml-auto"
                  >
                    Cancelar Pedido
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StoreManager;
