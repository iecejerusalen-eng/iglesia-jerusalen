import { test, expect } from './fixtures/test';

test.describe('Store Checkout Flow', () => {
  test('User can browse products and open product details', async ({ page }) => {
    await page.route('https://e2e-placeholder.supabase.co/rest/v1/site_feature_visibility**', (route) =>
      route.fulfill({ json: [{ feature_key: 'store', is_enabled: true }] }),
    );
    await page.route('https://e2e-placeholder.supabase.co/rest/v1/store_catalog**', (route) =>
      route.fulfill({ json: [{
        id: 'e2e-product-1',
        name: 'Producto de prueba',
        description: 'Artículo ficticio para validar la ficha de producto.',
        price: 10,
        discount_price: null,
        stock: 3,
        is_active: true,
        deleted_at: null,
        category: 'Recursos',
        type: 'physical',
        ecommerce_product_type: 'physical',
        product_variants: [],
        metadata: {},
        created_at: '2026-10-01T00:00:00Z',
      }] }),
    );
    // Navigate to store
    await page.goto('/tienda');

    // Wait for store to load
    await expect(page).toHaveURL(/.*tienda/);

    const cartLink = page.getByRole('link', { name: /Mi carrito/ });
    await expect(cartLink).toBeVisible();

    const productCards = page.locator('main button.group');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    await productCards.first().click();
    await expect(page.getByRole('button', { name: 'Cerrar' })).toBeVisible({ timeout: 10000 });
  });
});
