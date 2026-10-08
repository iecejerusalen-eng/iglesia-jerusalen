import type { Product, ProductVariant } from '../../../types';
import type { DbProduct, FormVariant } from '../types';
export const variant: ProductVariant & FormVariant = { id: 'variant-1', product_id: 'product-1', color_name: 'Azul', color_hex: '#0000ff', size: 'M', cloudinary_image_url: '', stock: 3, price_adjustment: 2, created_at: '2026-01-01' };
export const product: Product & DbProduct = { id: 'product-1', name: 'Guía de oración', description: 'Recurso', price: 10, image_url: null, stock: 5, category: 'Libros', type: 'physical', created_at: '2026-01-01', tax_rate: 10 };
