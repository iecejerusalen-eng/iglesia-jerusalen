import { describe, expect, it } from 'vitest';
import { getCartStock, getProductStock, isDigitalProduct, normalizeStoreSearch, validateReceipt } from '../catalog';
import { getUnitPrice, getLineTax } from '../pricing';
import { product, variant } from './fixtures';
import { productSchema } from '../types';

describe('Reglas compartidas de tienda', () => {
  it('calcula inventario desde variantes, sin sumar el stock base dos veces', () => {
    expect(getProductStock({ ...product, stock: 100, product_variants: [variant, { ...variant, id: 'variant-2', stock: 4 }] })).toBe(7);
  });
  it('requiere una variante real y rechaza productos ocultos', () => {
    const withVariants = { ...product, product_variants: [variant] };
    expect(getCartStock(withVariants)).toBe(0);
    expect(getCartStock(withVariants, { ...variant, id: 'other' })).toBe(0);
    expect(getCartStock(withVariants, variant)).toBe(3);
    expect(getCartStock({ ...product, is_active: false })).toBe(0);
  });
  it('permite una unidad de un recurso digital sin inventario físico', () => {
    expect(isDigitalProduct({ ecommerce_product_type: 'digital' })).toBe(true);
    expect(getCartStock({ ...product, type: 'digital', stock: 0 })).toBe(1);
  });
  it('busca sin tildes y escoge el mejor descuento por cantidad', () => {
    expect(normalizeStoreSearch(' GUÍA de ORACIÓN ')).toBe('guia de oracion');
    const tiered = { ...product, metadata: { price_tiers: [{ min_quantity: 2, unit_price: 7 }, { min_quantity: 5, unit_price: 8 }] } };
    expect(getUnitPrice(tiered, 5)).toBe(7);
    expect(getLineTax(tiered, 5)).toBe(3.5);
  });
  it('valida tipo y tamaño del comprobante antes de subirlo', () => {
    expect(validateReceipt(new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' }))).toBeNull();
    expect(validateReceipt(new File(['x'], 'receipt.html', { type: 'text/html' }))).not.toBeNull();
    expect(validateReceipt(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))).not.toBeNull();
  });
  it('acepta un precio de oferta cero y rechaza ofertas mayores al precio', () => {
    const draft = { ...product, stock: 0, discount_price: 0, image_url: '/products/image.webp', drive_link: '', tax_rate: 15, sold_count: 0, is_active: true };
    expect(productSchema.safeParse(draft).success).toBe(true);
    expect(productSchema.safeParse({ ...draft, discount_price: 11 }).success).toBe(false);
    expect(productSchema.safeParse({ ...draft, type: 'digital' }).success).toBe(false);
    expect(productSchema.safeParse({ ...draft, type: 'digital', drive_link: 'https://drive.google.com/file/d/example' }).success).toBe(true);
  });
});
