import { test, expect } from '@playwright/test';

test.describe('Biblioteca de alabanzas', () => {
  test('carga, busca y abre una canción', async ({ page }) => {
    await page.goto('/recursos/alabanzas');

    await expect(page.getByRole('heading', { name: 'Alabanzas e Himnos' })).toBeVisible({ timeout: 15000 });
    const search = page.getByRole('textbox', { name: 'Buscar alabanzas' });
    await expect(search).toBeVisible();
    await search.fill('Digno');

    const song = page.getByRole('button', { name: /Digno \(Worthy\)/ });
    await expect(song).toBeVisible({ timeout: 15000 });
    await song.click();
    await expect(page.getByRole('dialog', { name: 'Digno (Worthy)' })).toBeVisible({ timeout: 15000 });
  });
});
