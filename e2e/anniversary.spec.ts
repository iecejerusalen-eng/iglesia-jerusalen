import { expect, test } from '@playwright/test';

test('la página del aniversario muestra información confirmada y se adapta a varios anchos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/aniversario-65');

  await expect(page.getByRole('heading', { name: /Testigos fieles/ })).toBeVisible();
  await expect(page.getByText('Preludio · 08:45')).toBeVisible();
  await expect(page.getByText('Culto · 09:00')).toBeVisible();
  await expect(page.getByRole('link', { name: /Compartir un agradecimiento/ })).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  await expect.poll(() => page.locator('main img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  await page.getByRole('button', { name: 'Imagen siguiente' }).click();
  await expect(page.getByText('2 de 2 · Una representación de nuestra fachada')).toBeVisible();
  await expect.poll(() => page.locator('main img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(widths.content, `contenido desbordado a ${width}px`).toBeLessThanOrEqual(widths.viewport);
  }
});

test('el anuncio temporal aparece solo durante el aniversario y la bienvenida 3D no bloquea la portada', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-25T15:00:00.000Z'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Celebremos juntos nuestra historia de fe' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Bienvenida a Iglesia Jerusalén' })).toHaveCount(0);

  await page.clock.setFixedTime(new Date('2026-10-26T05:00:00.000Z'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Celebremos juntos nuestra historia de fe' })).toHaveCount(0);
});

test('Inicio, visita y eventos no desbordan el ancho en móvil, tablet y escritorio', async ({ page }) => {
  for (const route of ['/', '/visita', '/eventos']) {
    await page.goto(route);
    if (route === '/') {
      const quickAccess = page.getByRole('region', { name: 'Información para visitar la iglesia' });
      await expect(quickAccess).toBeVisible();
      await expect(quickAccess.getByRole('link', { name: /Planifica tu visita/ })).toBeVisible();
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, `${route} desborda a ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
    }
  }
});
