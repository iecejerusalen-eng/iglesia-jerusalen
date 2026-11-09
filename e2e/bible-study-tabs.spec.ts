import { expect, test } from '@playwright/test';

test('las pestañas del estudio bíblico reciben clics aunque coincidan con Actividad de hoy', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route(/\/rest\/v1\/events(?:\?|$)/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{
      id: 'event-fixture',
      title: 'Actividad de prueba',
      emoji: '📅',
      start_date: '2026-11-08',
      end_date: '2026-11-08',
      start_time: '10:00',
      end_time: '11:00',
    }]),
  }));

  await page.goto('/programas/estudio-biblico?libro=genesis&capitulo=1');
  const preloader = page.getByText('Preparando tu visita...');
  await preloader.waitFor({ state: 'visible' });
  await preloader.locator('xpath=..').waitFor({ state: 'detached' });
  await expect(page.getByRole('button', { name: 'Ver actividad de hoy' })).toBeVisible();
  await expect(page.locator('#chapter-tool-study')).toBeVisible();

  await page.evaluate(() => {
    const tab = document.querySelector<HTMLElement>('#chapter-tool-study');
    if (!tab) throw new Error('No se encontró la pestaña Estudio');
    const documentTop = tab.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, documentTop - window.innerHeight / 2);
  });

  const overlap = await page.evaluate(() => {
    const tab = document.querySelector<HTMLElement>('#chapter-tool-study');
    const aside = document.querySelector<HTMLElement>('aside[aria-label="Actividad de hoy"]');
    if (!tab || !aside) return false;
    const tabRect = tab.getBoundingClientRect();
    const asideRect = aside.getBoundingClientRect();
    const x = tabRect.left + tabRect.width / 2;
    const y = tabRect.top + tabRect.height / 2;
    return x < asideRect.right && x > asideRect.left && y < asideRect.bottom && y > asideRect.top;
  });
  expect(overlap).toBe(true);

  for (const id of ['bible', 'study', 'atlas', 'encyclopedia', 'chronology']) {
    const tab = page.locator(`#chapter-tool-${id}`);
    const box = await tab.boundingBox();
    if (!box) throw new Error(`No se encontró la pestaña ${id}`);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(tab, `La pestaña ${id} debe responder al clic`).toHaveAttribute('aria-selected', 'true');
  }

  await expect(page.getByRole('heading', { name: 'Cronología · Génesis 1' })).toBeVisible();
});
