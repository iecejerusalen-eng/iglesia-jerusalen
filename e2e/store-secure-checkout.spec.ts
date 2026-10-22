import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createStoreHandler } from '../supabase/functions/store-checkout/handler';
import type { StoreBackend } from '../supabase/functions/store-checkout/handler';

interface FixtureDatabase {
  exec(sql: string): Promise<unknown>;
  query(sql: string, args?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  close(): Promise<void>;
}

// Browser → actual handler → actual migrated, isolated PostgreSQL. Storage binary transport is simulated.
for (const width of [1280, 390]) {
  test('reserva, comprobante privado y recuperación del pedido a ' + width + 'px', async ({ page }, testInfo) => {
    const db: FixtureDatabase = new PGlite();
    try {
      await db.exec(await readFile('supabase/tests/store_checkout_fixture.sql', 'utf8'));
      await db.exec(await readFile('supabase/migrations/20261022001552_secure_store_checkout_v2.sql', 'utf8'));
      await db.exec('update private.store_checkout_settings set enabled=true');
      const backend: StoreBackend = {
        authenticate: async () => { throw new Error('Esta prueba solo usa comprador invitado'); },
        async limit(key) { await db.query('select public.store_request_limit($1)', [key]); },
        async execute(action, actor, secret, payload) {
          return (await db.query('select public.store_api($1,$2::uuid,$3,$4::jsonb) result', [action, actor, secret, JSON.stringify(payload)])).rows[0].result;
        },
        async upload(path) { await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', ['store-receipts', path]); },
        async remove(path) { await db.query('delete from storage.objects where name=$1', [path]); },
        async signedUrl() { return 'https://example.invalid/synthetic-signed-proof'; },
      };
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/*.supabase.co/**', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname.endsWith('/functions/v1/store-checkout')) {
          const handler = createStoreHandler(backend, request.headers().apikey);
          const response = await handler(new Request(request.url(), { method: request.method(), headers: request.headers(), body: new Uint8Array(request.postDataBuffer() || []).buffer }));
          await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
        } else if (url.pathname.endsWith('/rest/v1/store_catalog')) {
          await route.fulfill({ json: (await db.query('select * from public.store_catalog where name=$1', ['Físico QA'])).rows });
        } else if (url.pathname.endsWith('/rest/v1/store_checkout_options')) {
          const options = (await db.query('select * from public.store_checkout_options')).rows[0];
          await route.fulfill({ json: { enabled: options.enabled, transfer_fee_percent: Number(options.transfer_fee_percent) } });
        } else {
          await route.fulfill({ json: [] });
        }
      });
      await page.goto('/tienda');
      await page.getByRole('button', { name: /Físico QA/ }).click();
      await page.getByRole('button', { name: 'Añadir', exact: true }).click();
      await page.goto('/cart');
      await page.getByLabel('Nombre completo', { exact: true }).fill('Cliente QA');
      await page.getByLabel('Correo', { exact: true }).fill('qa@example.invalid');
      await page.getByLabel('Teléfono para coordinar retiro').fill('0990000000');
      await page.getByRole('button', { name: 'Reservar y ver datos de pago' }).click();
      await expect(page.getByRole('heading', { name: 'Transferencia bancaria' })).toBeVisible();
      await expect(page.getByText('Banco QA', { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByText('Banco QA', { exact: true })).toBeVisible();
      await expect(page.getByText('Tu reserva está registrada. Usa el total confirmado para transferir.')).toBeVisible();
      await page.getByRole('heading', { name: 'Tu pedido', exact: true }).scrollIntoViewIfNeeded();
      expect(await page.locator('html').evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(width);
      const before = (await db.query('select count(*)::int n from public.orders')).rows[0].n;
      expect(before).toBe(1);
      await page.screenshot({ path: testInfo.outputPath('reserva-' + width + '.png'), fullPage: true });
      await page.getByLabel(/Comprobante privado/).setInputFiles({ name: 'synthetic-proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nSynthetic QA only') });
      await page.getByRole('button', { name: 'Enviar comprobante', exact: true }).click();
      await expect(page.getByText('Comprobante recibido. El pago está en revisión; no vuelvas a transferir.')).toBeVisible();
      await page.reload();
      await expect(page.getByText('Comprobante recibido. El pago está en revisión; no vuelvas a transferir.')).toBeVisible();
      expect((await db.query('select count(*)::int n from public.orders')).rows[0].n).toBe(1);
      expect((await db.query('select state from private.store_reservations')).rows[0].state).toBe('held');
      expect((await db.query('select public from storage.buckets where id=$1', ['store-receipts'])).rows[0].public).toBe(false);
      await page.screenshot({ path: testInfo.outputPath('comprobante-' + width + '.png'), fullPage: true });
    } finally { await db.close(); }
  });
}
