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
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Celebremos juntos nuestra historia de fe' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Bienvenida a Iglesia Jerusalén' })).toHaveCount(0);
  for (const width of [390, 698, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const bannerLayout = await page.evaluate(() => {
    const card = document.querySelector('[aria-labelledby="anniversary-home-title"] > div');
    const navigation = [...document.querySelectorAll('nav.fixed')].find((item) => item.querySelector('a[href="/visita"]'));
    if (!card || !navigation) return null;
    return { cardTop: card.getBoundingClientRect().top, navigationBottom: navigation.getBoundingClientRect().bottom };
  });
    expect(bannerLayout, `no se encontró la navegación a ${width}px`).not.toBeNull();
    expect(bannerLayout!.cardTop, `la tarjeta queda bajo el menú a ${width}px`).toBeGreaterThanOrEqual(bannerLayout!.navigationBottom);
  }

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

test('la agenda de hoy sigue accesible en móvil y se cierra desde el panel o al tocar fuera', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-25T15:00:00.000Z'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/rest/v1/events**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 'e2e-today-event',
        title: 'Culto de aniversario',
        emoji: '⛪',
        start_date: '2026-10-25',
        end_date: '2026-10-25',
        start_time: '09:00',
        end_time: null,
      }]),
    });
  });
  await page.goto('/');

  const trigger = page.getByRole('button', { name: 'Ver actividad de hoy' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole('heading', { name: /octubre/i })).toBeVisible();
  await page.mouse.click(380, 120);
  await expect(page.getByRole('heading', { name: /octubre/i })).toHaveCount(0);

  await trigger.click();
  await page.getByRole('button', { name: 'Cerrar actividad de hoy' }).last().click();
  await expect(page.getByRole('heading', { name: /octubre/i })).toHaveCount(0);
});
