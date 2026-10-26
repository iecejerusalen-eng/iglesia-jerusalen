import { test, expect } from './fixtures/test';

// Isolated visual fixtures. No CRM records, statistics or production settings are changed.
test.beforeEach(async ({ page }) => {
  await page.route('**/__community-stats-qa*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/e2e/fixtures/community-stats-harness.tsx"></script></body></html>` }));
});

for (const width of [390, 768, 1440]) test('cifras editoriales a ' + width + 'px', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/__community-stats-qa');
  await expect(page.getByRole('heading', { name: 'Cada vida cuenta.' })).toBeVisible();
  await expect(page.locator('.community-metric')).toHaveCount(5);
  await expect(page.locator('.community-metric__value').first().locator('[aria-hidden=true]')).toHaveText('13');
  await expect(page.locator('.community-metric__value').nth(2).locator('[aria-hidden=true]')).toHaveText('0');
  await expect(page.locator('.community-stats__metrics')).not.toContainText('+');
  await expect(page.getByRole('link', { name: 'Ven a conocernos' })).toHaveAttribute('href', '/visita');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ven a conocernos' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  if (width > 1000) {
    await page.locator('.community-stats__panel').hover({ position: { x: 400, y: 200 } });
    expect(await page.locator('.community-stats__panel').evaluate(el => el.style.getPropertyValue('--community-x'))).not.toBe('');
  }
  await page.mouse.move(0, 0);
  await page.locator('.community-stats').screenshot({ path: info.outputPath('comunidad-claro-' + width + '.png') });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.locator('.community-stats').screenshot({ path: info.outputPath('comunidad-oscuro-' + width + '.png') });
  expect(errors).toEqual([]);
});

test('carga, ausencia de cifras, valores grandes y movimiento reducido', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto('/__community-stats-qa?loading');
  await expect(page.getByRole('status', { name: 'Cargando cifras de la comunidad' })).toBeVisible();
  await expect(page.locator('.community-metric')).toHaveCount(0);
  await page.goto('/__community-stats-qa?empty');
  await expect(page.getByRole('status')).toContainText('estarán disponibles próximamente');
  await expect(page.locator('.community-metric')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/__community-stats-qa?large&dark');
  await expect(page.locator('.community-metric__value').first().locator('[aria-hidden=true]')).toHaveText('12.345.678');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(await page.locator('.community-stats__light').evaluate(el => getComputedStyle(el).display)).toBe('none');
  for (const metric of await page.locator('.community-metric').all()) {
    expect(await metric.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('comunidad-valores-largos-320.png'), fullPage: true });
});
