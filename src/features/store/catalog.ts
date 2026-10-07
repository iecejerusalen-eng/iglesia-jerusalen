import type { Product } from '../../types';
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
