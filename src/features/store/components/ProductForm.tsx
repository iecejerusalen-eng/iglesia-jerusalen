import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MediaUploader from '../../../components/common/MediaUploader';
import type { DbProduct, FormVariant, ProductMedia, ProductPriceTier, StoreCategory } from '../types';
import { useStoreMutations } from '../hooks/useStoreMutations';
import { getOptimizedCloudinaryImage } from '../../../lib/cloudinaryService';

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
  sku: z.string().optional(),
  cost_price: z.number().min(0).optional().nullable(),
  tax_rate: z.number().min(0).max(100),
  profit_margin: z.number().min(0).optional().nullable(),
  sold_count: z.number().int().min(0),
  is_active: z.boolean(),
  tags: z.string().optional(),
});

type ProductFormType = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: DbProduct | null;
  categories: StoreCategory[];
  onCancel: () => void;
}

const ProductForm = ({
  product: editingProduct,
  categories: storeCategories,
  onCancel,
}: ProductFormProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<FormVariant[]>([]);
  const [priceTiers, setPriceTiers] = useState<ProductPriceTier[]>([]);
  const [gallery, setGallery] = useState<ProductMedia[]>([]);
  
  const mutations = useStoreMutations();
  const actionLoading = mutations.createProduct.isPending || mutations.updateProduct.isPending;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductFormType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
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
      sku: '',
      cost_price: undefined,
      tax_rate: 15,
      profit_margin: undefined,
      sold_count: 0,
      is_active: true,
      tags: '',
    }
  });

  useEffect(() => {
    if (editingProduct) {
      let featuresStr = '';
      if (Array.isArray(editingProduct.features)) {
        featuresStr = editingProduct.features.join('\n');
      } else if (typeof editingProduct.features === 'string') {
        try {
          const parsed = JSON.parse(editingProduct.features);
          if (Array.isArray(parsed)) {
            featuresStr = parsed.join('\n');
          }
        } catch {
          featuresStr = editingProduct.features;
        }
      }

      reset({
        name: editingProduct.name,
        price: Number(editingProduct.price),
        discount_price: editingProduct.discount_price ? Number(editingProduct.discount_price) : undefined,
        promo_tag: editingProduct.promo_tag || '',
        stock: Number(editingProduct.stock),
        category: editingProduct.category,
        type: editingProduct.type || 'physical',
        image_url: editingProduct.image_url || '',
        description: editingProduct.description || '',
        features: featuresStr,
        sku: editingProduct.sku || '',
        cost_price: editingProduct.cost_price ?? undefined,
        tax_rate: editingProduct.tax_rate ?? 15,
        profit_margin: editingProduct.profit_margin ?? undefined,
        sold_count: editingProduct.sold_count ?? 0,
        is_active: editingProduct.is_active ?? true,
        tags: editingProduct.metadata?.tags?.join(', ') || '',
      });
      setImagePreview(editingProduct.image_url || null);
      setVariants(editingProduct.product_variants || []);
      setPriceTiers(editingProduct.metadata?.price_tiers || []);
      setGallery(editingProduct.metadata?.media || []);
    }
  }, [editingProduct, reset]);

  const productType = watch('type');

  const onSubmitForm = (data: ProductFormType) => {
    let featuresArray: string[] = [];
    if (data.features) {
      featuresArray = data.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
    }

    const payload: Partial<DbProduct> = {
      name: data.name,
      price: data.price,
      discount_price: data.discount_price || null,
      promo_tag: data.promo_tag || null,
      stock: data.stock,
      category: data.category,
      type: data.type,
      image_url: data.image_url || null,
      description: data.description,
      features: featuresArray,
      cover_image_url: data.image_url || null,
      thumbnail_url: data.image_url
        ? getOptimizedCloudinaryImage(data.image_url, { width: 480, height: 360, crop: 'fill' })
        : null,
      sku: data.sku?.trim() || null,
      cost_price: data.cost_price ?? null,
      tax_rate: data.tax_rate,
      profit_margin: data.profit_margin ?? null,
      sold_count: data.sold_count,
      is_active: data.is_active,
      metadata: {
        ...(editingProduct?.metadata || {}),
        tags: (data.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
        media: gallery,
        price_tiers: priceTiers
          .filter(tier => tier.min_quantity > 1 && tier.unit_price >= 0)
          .sort((a, b) => a.min_quantity - b.min_quantity),
      },
    };

    if (editingProduct) {
      mutations.updateProduct.mutate(
        { id: editingProduct.id, product: payload, variants },
        { onSuccess: onCancel }
      );
    } else {
      mutations.createProduct.mutate(
        { product: payload, variants },
        { onSuccess: onCancel }
      );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8 animate-fadeUp">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
        <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
          {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-650 cursor-pointer p-1">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-500/15 dark:bg-amber-950/10">
          <div>
            <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">SKU</label>
            <input {...register('sku')} className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900" placeholder="BIB-001" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Costo ($)</label>
            <input type="number" step="0.01" min="0" {...register('cost_price', { valueAsNumber: true })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">IVA (%)</label>
            <input type="number" step="0.01" min="0" max="100" {...register('tax_rate', { valueAsNumber: true })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Margen (%)</label>
            <input type="number" step="0.01" min="0" {...register('profit_margin', { valueAsNumber: true })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Vendidos</label>
            <input type="number" min="0" {...register('sold_count', { valueAsNumber: true })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs font-bold text-gray-405 uppercase mb-1.5">Tags (separados por coma)</label>
            <input {...register('tags')} className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900" placeholder="biblia, estudio, regalo" />
          </div>
          <label className="flex items-center gap-3 self-end rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold dark:border-white/10 dark:bg-slate-900">
            <input type="checkbox" {...register('is_active')} className="h-4 w-4" /> Visible en tienda
          </label>
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
                  const optimizedUrl = getOptimizedCloudinaryImage(url, { width: 1600, crop: 'limit' });
                  setValue('image_url', optimizedUrl);
                  setImagePreview(optimizedUrl);
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              {imagePreview ? (
                <div className="relative w-20 h-20 rounded-xl border border-gray-150 dark:border-white/10 overflow-hidden bg-gray-55 flex-shrink-0">
                  <img loading="lazy" src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
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

        <div className="rounded-2xl border border-gray-150 p-4 dark:border-white/10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-white">Galería del producto</h4>
              <p className="text-xs text-gray-500">Sube varias vistas. Se optimizan al servirse y pueden usarse en variantes.</p>
            </div>
            <MediaUploader
              folder="productos/galeria"
              multiple
              allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
              label="Añadir fotos"
              onUploadSuccess={(url, publicId) => {
                const optimizedUrl = getOptimizedCloudinaryImage(url, { width: 1600, crop: 'limit' });
                setGallery(current => [...current, { id: publicId, url: optimizedUrl, alt: watch('name') || 'Producto' }]);
              }}
            />
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {gallery.map((media) => (
                <div key={media.id} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-150 dark:border-white/10">
                  <img src={media.url} alt={media.alt || 'Producto'} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setGallery(current => current.filter(item => item.id !== media.id))} className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Eliminar foto">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-gray-400">Aún no hay fotos adicionales.</p>}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-500/15 dark:bg-blue-950/10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-white">Precio escalable por cantidad</h4>
              <p className="text-xs text-gray-500">El mejor precio aplicable se calcula automáticamente en producto y carrito.</p>
            </div>
            <button type="button" onClick={() => setPriceTiers(current => [...current, { min_quantity: 2, unit_price: 0, label: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary">
              <Plus size={14} /> Añadir nivel
            </button>
          </div>
          <div className="space-y-2">
            {priceTiers.map((tier, index) => (
              <div key={`${index}-${tier.min_quantity}`} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2">
                <input aria-label="Cantidad mínima" type="number" min="2" value={tier.min_quantity} onChange={event => setPriceTiers(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, min_quantity: Number(event.target.value) } : item))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" placeholder="Cantidad" />
                <input aria-label="Precio unitario" type="number" min="0" step="0.01" value={tier.unit_price} onChange={event => setPriceTiers(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, unit_price: Number(event.target.value) } : item))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" placeholder="Precio" />
                <input aria-label="Etiqueta del nivel" value={tier.label || ''} onChange={event => setPriceTiers(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900" placeholder="Ej. Mayorista" />
                <button type="button" onClick={() => setPriceTiers(current => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-red-500" aria-label="Eliminar nivel"><Trash2 size={16} /></button>
              </div>
            ))}
            {priceTiers.length === 0 && <p className="text-xs text-gray-400">Sin descuentos por volumen.</p>}
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
              <div className="border border-gray-150 dark:border-white/10 rounded-xl overflow-x-auto text-xs">
                <table className="min-w-[900px] w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                      <th className="py-2.5 px-3">Color</th>
                      <th className="py-2.5 px-3">Hex</th>
                      <th className="py-2.5 px-3">Talla</th>
                      <th className="py-2.5 px-3">SKU</th>
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
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={(e) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, sku: e.target.value } : item))}
                            className="w-24 px-2 py-1 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none"
                            placeholder="SKU"
                          />
                        </td>
                        <td className="py-2 px-3 flex items-center gap-2">
                          <MediaUploader
                            folder="productos"
                            allowedFormats={['jpg', 'png', 'webp']}
                            label="Subir"
                            className="py-1 px-2 text-[10px]"
                            onUploadSuccess={(url) => setVariants(prev => prev.map((item, i) => i === idx ? { ...item, cloudinary_image_url: getOptimizedCloudinaryImage(url, { width: 1200, crop: 'limit' }) } : item))}
                          />
                          {v.cloudinary_image_url && (
                            <img loading="lazy" src={v.cloudinary_image_url} alt="Variant" className="w-7 h-7 rounded object-cover" />
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
            onClick={onCancel}
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
  );
};

export default ProductForm;
