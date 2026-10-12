import { test, expect } from '@playwright/test';

test('Inicio no deja que anuncios de eventos pasados desplacen comunicados vigentes', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-11T15:00:00Z'));
  const oldNotices = Array.from({ length: 50 }, (_, index) => ({
    id: `old-${index}`, title: `Evento pasado ${index}`, summary: 'Anuncio antiguo',
    is_featured: true, image_url: null,
    event: { id: 'old-event', title: 'Actividad pasada', start_date: '2026-09-05', end_date: '2026-09-05', is_recurring: false },
  }));
  const notices = [...oldNotices, { id: 'current', title: 'Comunicado vigente de prueba', summary: 'Aviso general', image_url: null, event: null }];
  await page.route('**/rest/v1/church_announcements?**', async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const offset = Number(params.get('offset') ?? 0);
    const limit = Number(params.get('limit') ?? 50);
    await route.fulfill({ json: notices.slice(offset, offset + limit) });
  });
  await page.goto('/');
  await expect(page.locator('#home_announcements').getByRole('heading', { name: 'Comunicado vigente de prueba' })).toBeVisible();
  await expect(page.locator('#home_announcements').getByText('Evento pasado', { exact: false })).toHaveCount(0);
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.length).toBeGreaterThan(0);
  for (const schema of schemas) expect(JSON.parse(schema)).not.toHaveProperty('openingHoursSpecification');
});

test('Inicio conserva el estado vacío cuando solo quedan eventos pasados', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-11T15:00:00Z'));
  await page.route('**/rest/v1/church_announcements?**', (route) => route.fulfill({ json: [{
    id: 'past', title: 'Actividad pasada de prueba', image_url: null,
    event: { id: 'event', start_date: '2026-08-30', end_date: '2026-08-30', is_recurring: false },
  }] }));
  await page.goto('/');
  await expect(page.locator('#home_announcements')).toBeAttached();
  await expect(page.locator('#home_announcements').getByRole('article')).toHaveCount(0);
  await expect(page.locator('#home_announcements')).toHaveText('');
});
