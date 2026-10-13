import { test, expect } from '@playwright/test';
test('Nosotros conserva navegación pública y foco del visor histórico en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nosotros');
  await expect(page.getByRole('link', { name: 'Aprender más', exact: true })).toHaveAttribute('href', '/nosotros/documentos');
  await expect(page.getByText('Perfil CRM vinculado')).toHaveCount(0);
  const opener = page.getByRole('button', { name: 'Ver historia completa', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog');
  const close = page.getByRole('button', { name: 'Cerrar historia', exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Nosotros permite llegar al himno y consultar su fuente en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nosotros');
  const navigation = page.getByRole('navigation', { name: 'En esta página' });
  await expect(navigation.getByRole('link', { name: 'Himno', exact: true })).toHaveAttribute('href', '#himno');
  await navigation.getByRole('link', { name: 'Himno', exact: true }).click();
  await expect(page).toHaveURL(/#himno$/);
  await expect(page.locator('#himno').getByRole('heading', { name: 'Himno Cuadrangular' })).toBeVisible();
  await expect(page.locator('#himno').getByRole('heading', { name: /^Estrofa/ })).toHaveCount(4);
  await expect(page.locator('#himno').getByRole('link')).toHaveAttribute('href', '/documentos/reglamento-interno.pdf#page=2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
