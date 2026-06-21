import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import MediaUploader from '../../components/common/MediaUploader';
import { 
  Plus, Edit2, Trash2, X, Loader2, Package, 
  ClipboardList, AlertCircle, Download, Eye,
  CheckCircle2, Clock, Truck, ShieldAlert, Users,
  FolderOpen, Check
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types';

// Zod Validation Schema
const productSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  price: z.number({ message: 'El precio debe ser un número válido' }).min(0, 'El precio no puede ser negativo'),
  discount_price: z.number().optional().nullable().or(z.literal('')),
  promo_tag: z.string().optional().nullable().or(z.literal('')),
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
  discount_price?: number | null;
  promo_tag?: string | null;
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

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'active' | 'inactive';
  kyc_tax_id_status: 'pending' | 'approved' | 'rejected';
  kyc_bank_status: 'pending' | 'approved' | 'rejected';
  kyc_agreement_status: 'pending' | 'approved' | 'rejected';
  kyc_notes: string | null;
  created_at?: string;
}

interface Dispute {
  id: string;
  order_id: string;
  user_id: string | null;
  type: 'fraud_suspicion' | 'broken_item' | 'wrong_item' | 'not_received' | 'other';
  description: string;
  status: 'open' | 'under_investigation' | 'resolved' | 'dismissed';
  resolution_notes: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email: string };
  orders?: { id: string; total: number; customer_name: string };
}

interface StoreCategory {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}

const StoreManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'suppliers' | 'disputes'>('products');
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Product Edit Modal
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<FormVariant[]>([]);

  // Categories Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<StoreCategory> | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Shipping Address Override and Refund Modals
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingOverride, setShippingOverride] = useState({
    recipient_name: '',
    phone: '',
    override_address: '',
    status_notes: ''
  });

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({
    amount: 0,
    reason: ''
  });

  // Suppliers Onboarding State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Disputes State
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [savingDispute, setSavingDispute] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: undefined,
      discount_price: undefined,
      promo_tag: '',
      stock: undefined,
      category: '',
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
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      if (activeTab === 'products') {
        await fetchProducts();
        await fetchCategories();
      } else if (activeTab === 'categories') {
        await fetchCategories();
      } else if (activeTab === 'orders') {
        await fetchOrders();
      } else if (activeTab === 'suppliers') {
        await fetchSuppliers();
      } else if (activeTab === 'disputes') {
        await fetchDisputes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setProducts((data || []) as DbProduct[]);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    setStoreCategories(data || []);
  };

  const fetchOrders = async () => {
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
      console.error(err);
      toast.error('Error al cargar pedidos: ' + err.message);
    }
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('store_suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setSuppliers(data || []);
  };

  const fetchDisputes = async () => {
    const { data, error } = await supabase
      .from('store_disputes')
      .select(`
        *,
        profiles:user_id(first_name, last_name, email),
        orders:order_id(id, total, customer_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setDisputes(data || []);
  };

  // --- PRODUCTS FORM ---
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setVariants([]);
    reset({
      name: '',
      price: undefined,
      discount_price: undefined,
      promo_tag: '',
      stock: undefined,
      category: storeCategories[0]?.name || 'Libros',
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
      discount_price: product.discount_price ? Number(product.discount_price) : undefined,
      promo_tag: product.promo_tag || '',
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

  const onSubmit = async (data: ProductForm) => {
    setActionLoading(true);
    try {
      const featuresArray = data.features ? data.features.split('\n').map(f => f.trim()).filter(Boolean) : [];

      const productPayload = {
        name: data.name,
        description: data.description,
        price: data.price,
        discount_price: data.discount_price ? Number(data.discount_price) : null,
        promo_tag: data.promo_tag || null,
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
        await supabase.from('product_variants').delete().eq('product_id', productId);
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
        await supabase.from('product_digital_assets').delete().eq('product_id', productId);
      } else {
        await supabase.from('product_digital_assets').delete().eq('product_id', productId);
        if (data.drive_link) {
          const { error: assetErr } = await supabase.from('product_digital_assets').insert({
            product_id: productId,
            drive_link: data.drive_link,
            instructions: data.instructions || null
          });
          if (assetErr) throw assetErr;
        }
        await supabase.from('product_variants').delete().eq('product_id', productId);
      }

      toast.success(editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar el producto: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
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
      console.error(err);
      toast.error('No se pudo eliminar el producto: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- DYNAMIC CATEGORIES LOGIC ---
  const handleOpenCategoryCreate = (cat?: StoreCategory) => {
    if (cat) {
      setEditingCategory(cat);
    } else {
      setEditingCategory({ name: '', description: '' });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    setSavingCategory(true);
    try {
      if (editingCategory.id) {
        const { error } = await supabase
          .from('store_categories')
          .update({
            name: editingCategory.name,
            description: editingCategory.description
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Categoría actualizada');
      } else {
        const { error } = await supabase
          .from('store_categories')
          .insert([{
            name: editingCategory.name,
            description: editingCategory.description
          }]);
        if (error) throw error;
        toast.success('Categoría creada');
      }
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar categoría');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    try {
      const { error } = await supabase
        .from('store_categories')
        .delete()
        .eq('id', catId);
      if (error) throw error;
      toast.success('Categoría eliminada');
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al eliminar categoría');
    }
  };

  // --- ORDERS LIFECYCLE LOGIC ---
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
      console.error(err);
      toast.error('Error al actualizar el estado: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel order and restore stock
  const handleCancelOrder = async (order: Order) => {
    const confirmed = await confirm({
      title: 'Cancelar Pedido',
      message: '¿Estás seguro de cancelar este pedido? Se restaurará automáticamente el stock del inventario.',
      confirmText: 'Sí, cancelar y restaurar stock',
      cancelText: 'Cerrar',
      variant: 'danger'
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // 1. Cancel order status
      const { error: cancelError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          shipping_status_notes: 'Pedido cancelado por el administrador.'
        })
        .eq('id', order.id);
      
      if (cancelError) throw cancelError;

      // 2. Loop order items and restore stock
      for (const item of order.order_items || []) {
        if (item.variant_id) {
          // Increment variant stock
          const { data: vData } = await supabase.from('product_variants').select('stock').eq('id', item.variant_id).single();
          if (vData) {
            await supabase.from('product_variants').update({ stock: vData.stock + item.quantity }).eq('id', item.variant_id);
          }
        } else {
          // Increment regular product stock
          const { data: pData } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (pData) {
            await supabase.from('products').update({ stock: pData.stock + item.quantity }).eq('id', item.product_id);
          }
        }
      }

      toast.success('Pedido cancelado e inventario restaurado con éxito.');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cancelar el pedido: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open shipping Address Modal
  const handleOpenShippingOverride = (order: Order) => {
    setShippingOverride({
      recipient_name: order.shipping_recipient_name || order.customer_name,
      phone: order.shipping_phone || '',
      override_address: order.shipping_override_address || '',
      status_notes: order.shipping_status_notes || ''
    });
    setShowShippingModal(true);
  };

  // Save shipping override
  const handleSaveShippingOverride = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          shipping_recipient_name: shippingOverride.recipient_name,
          shipping_phone: shippingOverride.phone,
          shipping_override_address: shippingOverride.override_address,
          shipping_status_notes: shippingOverride.status_notes
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;
      toast.success('Información de entrega actualizada.');
      setShowShippingModal(false);
      fetchOrders();
      // Sync selectedOrder state
      setSelectedOrder(prev => prev ? { 
        ...prev, 
        shipping_recipient_name: shippingOverride.recipient_name,
        shipping_phone: shippingOverride.phone,
        shipping_override_address: shippingOverride.override_address,
        shipping_status_notes: shippingOverride.status_notes
      } : null);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al actualizar entrega: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save refund
  const handleSaveRefund = async () => {
    if (!selectedOrder) return;
    if (refundData.amount <= 0 || refundData.amount > selectedOrder.total) {
      toast.error('El monto a reembolsar debe ser mayor a 0 y menor o igual al total.');
      return;
    }
    setActionLoading(true);
    try {
      const finalRefundStatus = refundData.amount === selectedOrder.total ? 'full' : 'partial';

      const { error } = await supabase
        .from('orders')
        .update({
          refund_status: finalRefundStatus,
          refunded_amount: refundData.amount,
          refund_reason: refundData.reason
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;
      toast.success('Reembolso registrado con éxito.');
      setShowRefundModal(false);
      fetchOrders();
      setSelectedOrder(prev => prev ? {
        ...prev,
        refund_status: finalRefundStatus,
        refunded_amount: refundData.amount,
        refund_reason: refundData.reason
      } : null);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al registrar el reembolso: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Transfer utility
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

  // --- SUPPLIERS LOGIC ---
  const handleOpenSupplierCreate = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
    } else {
      setEditingSupplier({
        name: '',
        email: '',
        phone: '',
        status: 'pending',
        kyc_tax_id_status: 'pending',
        kyc_bank_status: 'pending',
        kyc_agreement_status: 'pending',
        kyc_notes: ''
      });
    }
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier?.name) return;

    setSavingSupplier(true);
    try {
      const payload = {
        name: editingSupplier.name,
        email: editingSupplier.email || null,
        phone: editingSupplier.phone || null,
        status: editingSupplier.status || 'pending',
        kyc_tax_id_status: editingSupplier.kyc_tax_id_status || 'pending',
        kyc_bank_status: editingSupplier.kyc_bank_status || 'pending',
        kyc_agreement_status: editingSupplier.kyc_agreement_status || 'pending',
        kyc_notes: editingSupplier.kyc_notes || null
      };

      if (editingSupplier.id) {
        const { error } = await supabase
          .from('store_suppliers')
          .update(payload)
          .eq('id', editingSupplier.id);
        if (error) throw error;
        toast.success('Proveedor actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('store_suppliers')
          .insert([payload]);
        if (error) throw error;
        toast.success('Proveedor incorporado al sistema');
      }
      setShowSupplierModal(false);
      fetchSuppliers();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar proveedor: ' + err.message);
    } finally {
      setSavingSupplier(false);
    }
  };

  // --- DISPUTES LOGIC ---
  const handleSaveDisputeResolution = async () => {
    if (!selectedDispute) return;
    setSavingDispute(true);
    try {
      const { error } = await supabase
        .from('store_disputes')
        .update({
          status: 'resolved',
          resolution_notes: resolutionText
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;
      toast.success('Controversia marcada como resuelta.');
      setSelectedDispute(null);
      setResolutionText('');
      fetchDisputes();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al resolver la controversia');
    } finally {
      setSavingDispute(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
            <Clock size={12} />
            Esperando Pago
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
            <CheckCircle2 size={12} />
            Pagado
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-church-gold-bright border border-blue-200 dark:border-blue-900/30">
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30">
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

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Verificado</span>;
      case 'rejected':
        return <span className="text-[10px] bg-red-100 text-red-750 px-2 py-0.5 rounded-full font-bold">Rechazado</span>;
      default:
        return <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Pendiente</span>;
    }
  };

  return (
    <AnimeFadeUp className="space-y-6 max-w-6xl">
      <AdminHeader 
        title="Gestor de la Tienda" 
        description="Administra los productos, precios promocionales, control de envíos y KYC de proveedores."
        action={
          !showForm && activeTab === 'products' && (
            <button
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Nuevo Producto
            </button>
          )
        }
      />

      {/* Tabs */}
      {!showForm && (
        <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto gap-2 pb-px">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-5 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'products' ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-primary'
            }`}
          >
            <Package size={16} />
            Catálogo
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-5 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'categories' ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-primary'
            }`}
          >
            <FolderOpen size={16} />
            Categorías
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-5 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders' ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-primary'
            }`}
          >
            <ClipboardList size={16} />
            Pedidos ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-3 px-5 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'suppliers' ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-primary'
            }`}
          >
            <Users size={16} />
            Proveedores (KYC)
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`py-3 px-5 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'disputes' ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-primary'
            }`}
          >
            <ShieldAlert size={16} />
            Disputas
          </button>
        </div>
      )}

      <div className="relative">
        {showForm ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8 animate-fadeUp">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-650 cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Nombre del Producto *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Ej. Biblia de Estudio Jerusalén"
                />
                {errors.name && <p className="text-accent-red text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Precio Regular ($)</label>
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
                  <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Precio Oferta ($) (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('discount_price', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Etiqueta Promocional (Opcional)</label>
                  <input
                    type="text"
                    {...register('promo_tag')}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. 20% OFF, Novedad"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Stock Base</label>
                  <input
                    type="number"
                    min="0"
                    {...register('stock', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="10"
                  />
                  {errors.stock && <p className="text-accent-red text-xs mt-1">{errors.stock.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Tipo de Producto</label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                  >
                    <option value="physical">Físico</option>
                    <option value="digital">Digital / Descargable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Categoría de Tienda</label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                  >
                    {storeCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Imagen Portada */}
              <div>
                <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Imagen Principal (Cloudinary)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="border border-dashed border-gray-250 dark:border-white/10 rounded-xl p-4 text-center hover:bg-gray-50/50 transition-colors flex flex-col items-center justify-center gap-2">
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
                      <div className="relative w-20 h-20 rounded-xl border border-gray-150 dark:border-white/10 overflow-hidden bg-gray-55 flex-shrink-0">
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
                      <div className="w-20 h-20 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-55 flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0">
                        Sin Imagen
                      </div>
                    )}
                    <div className="flex-grow">
                      <span className="text-[10px] text-gray-400 font-bold block mb-1">O ingresa URL de imagen</span>
                      <input
                        type="url"
                        {...register('image_url')}
                        className="w-full px-3 py-1.5 border border-gray-250 dark:border-white/10 rounded-lg text-xs focus:outline-none"
                        placeholder="https://cloudinary.com/imagen.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Características */}
              <div>
                <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">
                  Características / Incluye (Una por línea)
                </label>
                <textarea
                  {...register('features')}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Ej. Tapa de cuero italiano&#10;Hojas con canto dorado&#10;Contiene concordancia y mapas"
                />
              </div>

              {/* Digital Assets Section */}
              {productType === 'digital' && (
                <div className="space-y-4 bg-purple-50/30 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-150 dark:border-purple-500/20 animate-fadeUp">
                  <h4 className="font-bold text-sm text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    Configuración de Recurso Digital
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-700 uppercase mb-1.5">Enlace Seguro de Google Drive *</label>
                      <input
                        type="text"
                        {...register('drive_link')}
                        className="w-full px-4 py-2 border border-purple-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-700 uppercase mb-1.5">Instrucciones de Descarga</label>
                      <input
                        type="text"
                        {...register('instructions')}
                        className="w-full px-4 py-2 border border-purple-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none"
                        placeholder="Contraseña para descomprimir, etc..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Variants Section */}
              {productType === 'physical' && (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Variantes de Producto (Tallas, Colores)</h4>
                    <button
                      type="button"
                      onClick={() => setVariants(prev => [...prev, { color_name: '', color_hex: '', size: '', cloudinary_image_url: '', stock: 0, price_adjustment: 0 }])}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-primary hover:bg-primary/5 text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      Añadir Variante
                    </button>
                  </div>

                  {variants.length > 0 && (
                    <div className="border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                            <th className="py-2.5 px-3">Color</th>
                            <th className="py-2.5 px-3">Hex</th>
                            <th className="py-2.5 px-3">Talla</th>
                            <th className="py-2.5 px-3">Foto</th>
                            <th className="py-2.5 px-3">Stock</th>
                            <th className="py-2.5 px-3">Ajuste Precio</th>
                            <th className="py-2.5 px-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                          {variants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-slate-55/50">
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={v.color_name}
                                  onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, color_name: e.target.value } : item))}
                                  className="w-full px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                                  placeholder="Ej. Negro"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={v.color_hex || '#000000'}
                                    onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, color_hex: e.target.value } : item))}
                                    className="w-7 h-7 p-0 rounded-full border border-gray-250 cursor-pointer overflow-hidden"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={v.size}
                                  onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, size: e.target.value } : item))}
                                  className="w-full px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                                  placeholder="Ej. L"
                                />
                              </td>
                              <td className="py-2 px-3 flex items-center gap-2">
                                <MediaUploader
                                  folder="productos"
                                  allowedFormats={['jpg', 'png', 'webp']}
                                  label="Subir"
                                  className="py-1 px-2 text-[10px]"
                                  onUploadSuccess={(url) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, cloudinary_image_url: url } : item))}
                                />
                                {v.cloudinary_image_url && (
                                  <img src={v.cloudinary_image_url} alt="Variant" className="w-7 h-7 rounded object-cover" />
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, stock: Number(e.target.value) } : item))}
                                  className="w-14 px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                                  min="0"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.price_adjustment}
                                  onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, price_adjustment: Number(e.target.value) } : item))}
                                  className="w-16 px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
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

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-transparent"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* TAB 1: PRODUCTS CATALOG */}
            {activeTab === 'products' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                {products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                          <th className="py-4 px-6">Producto</th>
                          <th className="py-4 px-6">Precio Regular</th>
                          <th className="py-4 px-6">Oferta / Promoción</th>
                          <th className="py-4 px-6">Inventario</th>
                          <th className="py-4 px-6">Categoría</th>
                          <th className="py-4 px-6 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300 font-medium">
                        {products.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                                  alt={prod.name}
                                  className="w-10 h-10 rounded object-cover border border-gray-150"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-white block">{prod.name}</span>
                                  <span className="text-[10px] text-gray-400 capitalize">{prod.type === 'digital' ? 'Digital' : 'Físico'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-bold text-gray-800 dark:text-gray-200">
                              <span className={prod.discount_price ? 'line-through text-gray-400 mr-2 font-normal' : ''}>
                                ${Number(prod.price).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {prod.discount_price ? (
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-green-600 dark:text-green-400">${Number(prod.discount_price).toFixed(2)}</span>
                                  {prod.promo_tag && (
                                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-white bg-green-500 rounded px-1 self-start mt-0.5">
                                      {prod.promo_tag}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 font-normal italic">Sin descuento</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={prod.stock === 0 ? 'text-red-500 font-bold' : ''}>
                                {prod.stock} u.
                              </span>
                            </td>
                            <td className="py-4 px-6">{prod.category}</td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button onClick={() => handleOpenEdit(prod)} className="p-1 hover:text-primary transition-colors cursor-pointer text-gray-400">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteProduct(prod.id)} className="p-1 hover:text-red-500 transition-colors cursor-pointer text-gray-400">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Package className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-sm text-gray-400">No hay productos registrados en el catálogo.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SHOP CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <span className="text-xs font-semibold text-gray-500">Gestión de categorías dinámicas de la tienda</span>
                  <button
                    onClick={() => handleOpenCategoryCreate()}
                    className="bg-primary text-white hover:bg-blue-900 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    Nueva Categoría
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                          <th className="py-4 px-6">Nombre de Categoría</th>
                          <th className="py-4 px-6">Descripción</th>
                          <th className="py-4 px-6 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
                        {storeCategories.map(cat => (
                          <tr key={cat.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold">{cat.name}</td>
                            <td className="py-4 px-6 text-gray-550">{cat.description || 'Sin descripción'}</td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button onClick={() => handleOpenCategoryCreate(cat)} className="text-gray-400 hover:text-primary cursor-pointer">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ORDERS & LIFECYCLE */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden animate-fade-in text-xs">
                {orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                          <th className="py-4 px-6">Pedido</th>
                          <th className="py-4 px-6">Comprador</th>
                          <th className="py-4 px-6">Pago</th>
                          <th className="py-4 px-6">Total</th>
                          <th className="py-4 px-6">Reembolsos</th>
                          <th className="py-4 px-6">Estado</th>
                          <th className="py-4 px-6">Fecha</th>
                          <th className="py-4 px-6 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300 font-medium">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-55/30">
                            <td className="py-4 px-6 font-mono font-bold">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-800 dark:text-white block">{order.customer_name}</span>
                              <span className="text-[10px] text-gray-400 block">{order.customer_email}</span>
                            </td>
                            <td className="py-4 px-6 capitalize">
                              {order.payment_method === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                            </td>
                            <td className="py-4 px-6 font-bold text-primary dark:text-church-gold-bright">
                              ${Number(order.total).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              {order.refund_status && order.refund_status !== 'none' ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.refund_status === 'full' ? 'bg-red-100 text-red-750' : 'bg-amber-100 text-amber-700'}`}>
                                  Reembolsado ${Number(order.refunded_amount).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-normal italic">Sin reembolsos</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="py-4 px-6 font-semibold text-gray-400">
                              {new Date(order.created_at).toLocaleDateString('es-ES')}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <ClipboardList className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-sm text-gray-400">No hay pedidos registrados.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SUPPLIERS ONBOARDING & KYC */}
            {activeTab === 'suppliers' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <span className="text-xs font-semibold text-gray-500">Listado de Proveedores e Incorporación KYC</span>
                  <button
                    onClick={() => handleOpenSupplierCreate()}
                    className="bg-primary text-white hover:bg-blue-900 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus size={14} />
                    Incorporar Proveedor
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                          <th className="py-4 px-6">Proveedor</th>
                          <th className="py-4 px-6">Contacto</th>
                          <th className="py-4 px-6">RUC / DNI</th>
                          <th className="py-4 px-6">Cert. Bancaria</th>
                          <th className="py-4 px-6">Acuerdo Comercial</th>
                          <th className="py-4 px-6">Estado General</th>
                          <th className="py-4 px-6 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
                        {suppliers.length > 0 ? (
                          suppliers.map(sup => (
                            <tr key={sup.id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-6 font-bold">{sup.name}</td>
                              <td className="py-4 px-6 text-[11px]">
                                <span className="block">{sup.email || 'Sin correo'}</span>
                                <span className="block text-gray-400">{sup.phone || 'Sin teléfono'}</span>
                              </td>
                              <td className="py-4 px-6">{getKycBadge(sup.kyc_tax_id_status)}</td>
                              <td className="py-4 px-6">{getKycBadge(sup.kyc_bank_status)}</td>
                              <td className="py-4 px-6">{getKycBadge(sup.kyc_agreement_status)}</td>
                              <td className="py-4 px-6">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  sup.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'
                                }`}>
                                  {sup.status === 'active' ? 'Activo' : 'Pendiente/Inactivo'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => handleOpenSupplierCreate(sup)}
                                  className="text-primary hover:text-gold font-bold text-xs cursor-pointer inline-flex items-center gap-0.5"
                                >
                                  <Edit2 size={12} />
                                  Ver KYC
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-gray-400 italic">No hay proveedores incorporados.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: DISPUTES & FRAUDS LOG */}
            {activeTab === 'disputes' && (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden animate-fade-in text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500">
                  Panel de control de disputas, contracargos bancarios o reportes de fraude.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                        <th className="py-4 px-6">Reclamante</th>
                        <th className="py-4 px-6">Pedido Afectado</th>
                        <th className="py-4 px-6">Tipo Caso</th>
                        <th className="py-4 px-6">Detalle</th>
                        <th className="py-4 px-6">Estado</th>
                        <th className="py-4 px-6">Fecha Reporte</th>
                        <th className="py-4 px-6 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
                      {disputes.length > 0 ? (
                        disputes.map(disp => (
                          <tr key={disp.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6">
                              <span className="font-bold block">{disp.profiles ? `${disp.profiles.first_name} ${disp.profiles.last_name}` : 'Anónimo'}</span>
                              <span className="text-[10px] text-gray-400 block">{disp.profiles?.email}</span>
                            </td>
                            <td className="py-4 px-6 font-mono font-bold text-primary dark:text-church-gold-bright">
                              {disp.orders ? `#${disp.orders.id.slice(0, 8).toUpperCase()}` : 'No enlazado'}
                            </td>
                            <td className="py-4 px-6">
                              <span className="capitalize px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-100">
                                {disp.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-6 max-w-xs truncate" title={disp.description}>
                              {disp.description}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                disp.status === 'resolved' 
                                  ? 'bg-green-100 text-green-700' 
                                  : disp.status === 'open' 
                                    ? 'bg-red-100 text-red-750' 
                                    : 'bg-amber-100 text-amber-700'
                              }`}>
                                {disp.status === 'resolved' ? 'Resuelto' : disp.status === 'open' ? 'Abierto' : 'Bajo Investigación'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 font-semibold">
                              {disp.created_at ? new Date(disp.created_at).toLocaleDateString('es-ES') : ''}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {disp.status !== 'resolved' && (
                                <button
                                  onClick={() => setSelectedDispute(disp)}
                                  className="text-primary hover:text-gold font-bold text-xs cursor-pointer inline-flex items-center gap-0.5"
                                >
                                  Resolver
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-gray-400 italic">No hay reportes de disputas o fraudes registrados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Categoría de Tienda */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">
                {editingCategory.id ? 'Editar Categoría de Tienda' : 'Nueva Categoría de Tienda'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-650 cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:outline-none"
                  placeholder="Ej. Tazas, Accesorios"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Descripción</label>
                <textarea
                  rows={3}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:outline-none"
                  placeholder="Detalles sobre qué productos componen esta categoría..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="bg-primary hover:bg-blue-900 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  {savingCategory ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle de Pedido (Admin) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-fade-in"
          />
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col animate-scale-in text-xs font-medium text-gray-700 dark:text-gray-300">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-gray-150 dark:border-white/10 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                    Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono font-normal block">{selectedOrder.id}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-grow">
                
                {/* Reembolso / Cancelación Badges */}
                {selectedOrder.refund_status && selectedOrder.refund_status !== 'none' && (
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex items-start gap-3">
                    <AlertCircle className="text-red-700 dark:text-red-400 shrink-0" size={18} />
                    <div>
                      <span className="font-bold text-red-800 dark:text-red-400 text-xs block">Reembolso Registrado ({selectedOrder.refund_status === 'full' ? 'Total' : 'Parcial'})</span>
                      <p className="text-[11px] text-red-700 dark:text-gray-300 mt-1">Reembolsado: <strong>${Number(selectedOrder.refunded_amount).toFixed(2)}</strong></p>
                      {selectedOrder.refund_reason && (
                        <p className="text-[11px] text-red-650 dark:text-gray-400 italic mt-0.5">Motivo: {selectedOrder.refund_reason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping status notes overrides */}
                {(selectedOrder.shipping_override_address || selectedOrder.shipping_status_notes) && (
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 space-y-1.5">
                    <span className="font-bold text-blue-700 dark:text-church-gold-bright text-xs block uppercase">Sobrescritura de Datos de Entrega</span>
                    {selectedOrder.shipping_recipient_name && (
                      <p className="text-[11px]">Destinatario: <strong>{selectedOrder.shipping_recipient_name}</strong></p>
                    )}
                    {selectedOrder.shipping_phone && (
                      <p className="text-[11px]">Teléfono: <strong>{selectedOrder.shipping_phone}</strong></p>
                    )}
                    {selectedOrder.shipping_override_address && (
                      <p className="text-[11px]">Nueva Dirección: <strong className="text-blue-800 dark:text-gray-200">{selectedOrder.shipping_override_address}</strong></p>
                    )}
                    {selectedOrder.shipping_status_notes && (
                      <p className="text-[11px] italic text-gray-500">Notas de envío: {selectedOrder.shipping_status_notes}</p>
                    )}
                  </div>
                )}

                {/* Estado */}
                <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-gray-150 dark:border-white/10">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Estado Actual</span>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider text-right">Total Pedido</span>
                    <span className="text-xl font-extrabold text-primary dark:text-church-gold-bright block mt-0.5">${Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/30 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Datos del Comprador</h4>
                    <p className="text-xs">Nombre: <span className="font-semibold text-gray-800 dark:text-white">{selectedOrder.customer_name}</span></p>
                    <p className="text-xs mt-1">Email: <span className="font-semibold text-gray-800 dark:text-white">{selectedOrder.customer_email}</span></p>
                  </div>
                  <div className="bg-slate-50/30 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Método de Pago</h4>
                    <p className="text-xs">Tipo: <span className="font-semibold text-gray-800 dark:text-white capitalize">{selectedOrder.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito'}</span></p>
                    {selectedOrder.payment_method === 'transfer' && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-bold">Requiere verificación manual.</p>
                    )}
                  </div>
                </div>

                {/* Comprobante */}
                {selectedOrder.payment_method === 'transfer' && selectedOrder.payment_voucher_url && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-gray-850 dark:text-white flex items-center justify-between">
                      <span>Comprobante de Pago Subido:</span>
                      <a href={selectedOrder.payment_voucher_url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-church-gold-bright hover:text-gold flex items-center gap-1">
                        <Download size={12} /> Ver Completo
                      </a>
                    </h4>
                    <div className="w-full max-h-56 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex justify-center items-center">
                      <img src={selectedOrder.payment_voucher_url} alt="Comprobante" className="max-h-56 object-contain" />
                    </div>
                  </div>
                )}

                {/* Productos */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-gray-850 dark:text-white">Artículos Comprados:</h4>
                  <div className="divide-y divide-gray-100 dark:divide-white/10 border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {selectedOrder.order_items?.map((item: any) => (
                      <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.products?.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'} 
                            alt={item.products?.name} 
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <span className="font-bold text-gray-800 dark:text-white block">{item.products?.name}</span>
                            {item.product_variants && (
                              <span className="text-[9px] text-gray-400 block mt-0.5">
                                Variante: {item.product_variants.color_name || ''} {item.product_variants.size ? `[Talla ${item.product_variants.size}]` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-gray-850 dark:text-white">{item.quantity} x ${Number(item.price).toFixed(2)}</span>
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
                    className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    Aprobar Pago
                  </button>
                )}
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'ready_for_pickup')}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Truck size={14} />
                    Listo para Enviar/Retirar
                  </button>
                )}
                {['paid', 'ready_for_pickup'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                    disabled={actionLoading}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    Entregar / Completar
                  </button>
                )}
                
                {/* Advanced Lifecycle buttons */}
                {selectedOrder.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => handleOpenShippingOverride(selectedOrder)}
                      className="border border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[11px] font-bold px-3 py-2 rounded-xl cursor-pointer"
                      title="Editar dirección de entrega o estado del transportista"
                    >
                      Editar Envío
                    </button>
                    {['paid', 'ready_for_pickup', 'completed'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => {
                          setRefundData({ amount: selectedOrder.total, reason: '' });
                          setShowRefundModal(true);
                        }}
                        className="border border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-[11px] font-bold px-3 py-2 rounded-xl cursor-pointer"
                        title="Registrar reembolso total o parcial"
                      >
                        Reembolsar
                      </button>
                    )}
                    {selectedOrder.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder)}
                        disabled={actionLoading}
                        className="border border-red-200 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 text-[11px] font-bold px-3 py-2 rounded-xl cursor-pointer ml-auto"
                        title="Cancelar y devolver stock a inventario"
                      >
                        Cancelar Pedido
                      </button>
                    )}
                  </>
                )}
              </div>
          </div>
        </div>
      )}

      {/* Modal Editar Dirección Envío */}
      {showShippingModal && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">Sobrescribir Datos de Despacho</h3>
              <button onClick={() => setShowShippingModal(false)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del Destinatario</label>
                <input
                  type="text"
                  value={shippingOverride.recipient_name}
                  onChange={(e) => setShippingOverride(prev => ({ ...prev, recipient_name: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={shippingOverride.phone}
                  onChange={(e) => setShippingOverride(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="+593 ..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nueva Dirección de Entrega (Override)</label>
                <textarea
                  rows={2}
                  value={shippingOverride.override_address}
                  onChange={(e) => setShippingOverride(prev => ({ ...prev, override_address: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ingresa la calle, número y referencias alternativas..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notas de Envío / Estado Transportista</label>
                <input
                  type="text"
                  value={shippingOverride.status_notes}
                  onChange={(e) => setShippingOverride(prev => ({ ...prev, status_notes: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Paquete en oficina de Servientrega, Guía #12345..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveShippingOverride}
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold hover:bg-blue-900"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reembolsos */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">Registrar Reembolso o Devolución</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl text-amber-800 dark:text-amber-400 font-bold border border-amber-100 dark:border-amber-900/30">
                Límite máximo reembolsable: ${selectedOrder.total.toFixed(2)} USD
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monto del Reembolso ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedOrder.total}
                  value={refundData.amount}
                  onChange={(e) => setRefundData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motivo del Reembolso / Observaciones *</label>
                <textarea
                  rows={3}
                  required
                  value={refundData.reason}
                  onChange={(e) => setRefundData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Devolución de producto por talla errónea, acuerdo mutuo..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRefund}
                  disabled={!refundData.reason}
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  Procesar Reembolso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proveedores (KYC Onboarding) */}
      {showSupplierModal && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">
                {editingSupplier.id ? 'Detalles & KYC de Proveedor' : 'Incorporar Nuevo Proveedor'}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name || ''}
                  onChange={(e) => setEditingSupplier(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Editorial Cristiana SA"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingSupplier.email || ''}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                    placeholder="contacto@editorial.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                    placeholder="+593 ..."
                  />
                </div>
              </div>

              {/* KYC Section */}
              <div className="pt-3 border-t border-gray-150 dark:border-white/5 space-y-3">
                <span className="font-bold text-slate-800 dark:text-gray-200 text-xs block">Carpeta KYC (Conformidad del Proveedor)</span>
                
                <div className="grid grid-cols-1 gap-3.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-150 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-xs">1. Identidad Fiscal (RUC / DNI)</span>
                      <span className="text-[10px] text-gray-400">Verificación de cédula o registro tributario fiscal.</span>
                    </div>
                    <select
                      value={editingSupplier.kyc_tax_id_status || 'pending'}
                      onChange={(e) => setEditingSupplier(prev => ({ ...prev, kyc_tax_id_status: e.target.value as any }))}
                      className="bg-white dark:bg-slate-900 border border-gray-200 rounded p-1"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-xs">2. Certificación Bancaria</span>
                      <span className="text-[10px] text-gray-400">Validación de cuenta corriente para transferencias.</span>
                    </div>
                    <select
                      value={editingSupplier.kyc_bank_status || 'pending'}
                      onChange={(e) => setEditingSupplier(prev => ({ ...prev, kyc_bank_status: e.target.value as any }))}
                      className="bg-white dark:bg-slate-900 border border-gray-200 rounded p-1"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-xs">3. Acuerdo de Comercialización</span>
                      <span className="text-[10px] text-gray-400">Convenio comercial debidamente firmado.</span>
                    </div>
                    <select
                      value={editingSupplier.kyc_agreement_status || 'pending'}
                      onChange={(e) => setEditingSupplier(prev => ({ ...prev, kyc_agreement_status: e.target.value as any }))}
                      className="bg-white dark:bg-slate-900 border border-gray-200 rounded p-1"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notas / Observaciones KYC</label>
                <textarea
                  rows={2}
                  value={editingSupplier.kyc_notes || ''}
                  onChange={(e) => setEditingSupplier(prev => ({ ...prev, kyc_notes: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ingresa correcciones pendientes o comentarios..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estado Operacional</label>
                  <select
                    value={editingSupplier.status || 'pending'}
                    onChange={(e) => setEditingSupplier(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="pending">Pendiente de Aprobación</option>
                    <option value="active">Activo / Operando</option>
                    <option value="inactive">Inactivo / Suspendido</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="bg-primary hover:bg-blue-900 text-white px-5 py-2 rounded-xl font-bold shadow-sm"
                >
                  {savingSupplier ? <Loader2 className="animate-spin" size={14} /> : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resolver Controversia */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">Resolver Controversia</h3>
              <button onClick={() => setSelectedDispute(null)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-1.5">
                <p>Caso reportado por: <strong>{selectedDispute.profiles ? `${selectedDispute.profiles.first_name} ${selectedDispute.profiles.last_name}` : 'Anónimo'}</strong></p>
                <p>Pedido afectado: <strong>{selectedDispute.orders ? `#${selectedDispute.orders.id.slice(0,8).toUpperCase()}` : 'No enlazado'}</strong></p>
                <p>Reclamo: <span className="italic text-gray-500">"{selectedDispute.description}"</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notas de la Resolución del Caso *</label>
                <textarea
                  rows={4}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Detalla qué acciones se tomaron (reembolso directo, envío duplicado, fraude descartado)..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDisputeResolution}
                  disabled={savingDispute || !resolutionText.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold"
                >
                  {savingDispute ? <Loader2 className="animate-spin" size={14} /> : 'Marcar como Resuelto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AnimeFadeUp>
  );
};

export default StoreManager;
