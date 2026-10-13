import { test, expect } from '@playwright/test';

test('Nosotros conduce a las seis lecturas y conserva el liderazgo público', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nosotros');
  await expect(page.getByRole('link', { name: 'Aprender más', exact: true })).toHaveAttribute('href', '/nosotros/documentos');
  await expect(page.getByText('Perfil CRM vinculado')).toHaveCount(0);
  await expect(page.locator('#aprender a')).toHaveCount(6);
  for (const link of await page.locator('main a[href^="#"]').all()) {
    await expect(page.locator((await link.getAttribute('href'))!)).toHaveCount(1);
  }
  await page.locator('#aprender a[href="/nosotros/origen-cuadrangular"]').click();
  await expect(page.getByRole('heading', { name: 'Origen Cuadrangular', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Continuar aprendiendo' }).getByRole('link', { name: /Siguiente lectura/ })).toHaveAttribute('href', '/nosotros/doctrina');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('El himno conserva las cuatro estrofas y su fuente documental', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nosotros/himno');
  await page.getByRole('navigation', { name: 'Índice de lectura' }).getByRole('link', { name: 'Letra completa', exact: true }).click();
  await expect(page).toHaveURL(/#himno$/);
  await expect(page.locator('#himno').getByRole('heading', { name: 'Himno Cuadrangular' })).toBeVisible();
  await expect(page.locator('#himno').getByRole('heading', { name: /^Estrofa/ })).toHaveCount(4);
  await expect(page.locator('#himno').getByRole('link')).toHaveAttribute('href', '/documentos/reglamento-interno.pdf#page=2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Todas las lecturas tienen índice válido, imágenes disponibles y navegación', async ({ page }) => {
  for (const slug of ['origen-cuadrangular', 'doctrina', 'simbolos', 'historia', 'himno']) {
    await page.goto(`/nosotros/${slug}`);
    await expect(page.locator('main h1')).toHaveCount(1);
    for (const link of await page.getByRole('navigation', { name: 'Índice de lectura' }).getByRole('link').all()) {
      const href = await link.getAttribute('href');
      await expect(page.locator(href!)).toHaveCount(1);
    }
    for (const image of await page.locator('main article img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await expect(page.getByRole('link', { name: 'Volver a Nosotros', exact: true })).toHaveAttribute('href', '/nosotros');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
