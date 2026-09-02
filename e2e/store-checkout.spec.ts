import { test, expect } from '@playwright/test';

test.describe('Store Checkout Flow', () => {
  test('User can browse products and open product details', async ({ page }) => {
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
