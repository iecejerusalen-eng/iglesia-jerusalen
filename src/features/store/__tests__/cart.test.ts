import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '../../../store/useCartStore';
import { product, variant } from './fixtures';

beforeEach(() => useCartStore.getState().clearCart());
describe('Carrito', () => {
  it('no agrega cantidades inválidas y limita las unidades al stock', () => {
    const cart = useCartStore.getState();
    cart.addItem(product, null, NaN);
    cart.addItem(product, null, Infinity);
    cart.addItem(product, null, -2);
    expect(useCartStore.getState().items).toHaveLength(0);
    cart.addItem(product, null, 100);
    expect(useCartStore.getState().getTotalItems()).toBe(5);
    cart.updateQuantity(product.id, null, NaN);
    expect(useCartStore.getState().getTotalItems()).toBe(5);
  });
  it('mantiene variantes como líneas independientes y elimina cantidades cero', () => {
    const secondVariant = { ...variant, id: 'variant-2' };
    const variantsProduct = { ...product, product_variants: [variant, secondVariant] };
    const cart = useCartStore.getState();
    cart.addItem(variantsProduct);
    expect(useCartStore.getState().items).toHaveLength(0);
    cart.addItem(variantsProduct, variant, 2);
    cart.addItem(variantsProduct, secondVariant, 1);
    expect(useCartStore.getState().items).toHaveLength(2);
    cart.updateQuantity(product.id, variant.id, 0);
    expect(useCartStore.getState().items[0].variant?.id).toBe(secondVariant.id);
  });
  it('no duplica el recurso digital al volver a agregarlo', () => {
    const digital = { ...product, type: 'digital' as const, stock: 0 };
    const cart = useCartStore.getState();
    cart.addItem(digital, null, 5);
    cart.addItem(digital);
    expect(useCartStore.getState().getTotalItems()).toBe(1);
  });
});
