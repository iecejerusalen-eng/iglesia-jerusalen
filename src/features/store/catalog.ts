import type { Product, ProductVariant } from '../../types';

export const normalizeStoreSearch = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

export const isDigitalProduct = (product: { type?: string; ecommerce_product_type?: string }) =>
  (product.type ?? product.ecommerce_product_type) === 'digital';

export const getProductStock = (product: { stock: number; product_variants?: { stock: number }[] }) =>
  product.product_variants?.length
    ? product.product_variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0)
    : Math.max(0, Number(product.stock) || 0);

export const getCartStock = (product: Product, variant?: ProductVariant | null) => {
  if (product.is_active === false || product.deleted_at) return 0;
  if (isDigitalProduct(product)) return 1;
  if (product.product_variants?.length && (!variant || !product.product_variants.some(candidate => candidate.id === variant.id))) return 0;
  return Math.max(0, Math.floor(Number(variant?.stock ?? product.stock) || 0));
};

export const storeCurrency = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
export const formatStoreCurrency = (value: number) => storeCurrency.format(value);

export const validateReceipt = (file: File): string | null => {
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
    return 'Selecciona un comprobante JPG, PNG, WebP o PDF.';
  }
  if (file.size > 5 * 1024 * 1024) return 'El comprobante no puede superar 5 MB.';
  return null;
};

import { getProductBasePrice } from './pricing';

/** Match Spanish searches with or without accents. */
export const normalizeCatalogSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es');

/** The card and its price ordering must reflect a purchasable variant. */
export const getCatalogPrice = (product: Product) => {
  const variants = product.product_variants || [];
  if (variants.length === 0) return getProductBasePrice(product);
  const available = variants.filter((variant) => Number(variant.stock) > 0);
  return Math.min(...(available.length ? available : variants)
    .map((variant) => getProductBasePrice(product, variant)));
};
