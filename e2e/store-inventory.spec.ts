import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createStoreHandler, StoreValidationError } from '../supabase/functions/store-checkout/handler';
import type { StoreBackend } from '../supabase/functions/store-checkout/handler';

// Component harness: real UI → actual handler → real migrations on isolated PostgreSQL.
// Authentication is a declared fixture. No production user, stock or credentials are changed.
for (const width of [390, 1280]) test('conteo y movimiento de inventario a '+width+'px', async ({ page }, testInfo) => {
  const db = new PGlite();
  const staff = '00000000-0000-0000-0000-000000000001';
  const productId = '10000000-0000-0000-0000-000000000001';
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') console.error('QA browser:', message.text()); });
  try {
    for (const path of ['supabase/tests/store_checkout_fixture.sql', 'supabase/migrations/20261022001552_secure_store_checkout_v2.sql', 'supabase/tests/store_inventory_fixture.sql', 'supabase/migrations/20261022022116_store_inventory_control.sql']) await db.exec(await readFile(path, 'utf8'));
    const backend: StoreBackend = {
      async authenticate(token) { if (token !== 'fixture-verified-session') throw new Error('Sesión de prueba inválida'); return staff; },
      async limit() {},
      async execute(action, actor, _secret, payload) {
        try { return (await db.query<{ result: unknown }>('select public.store_inventory_api($1,$2::uuid,$3::jsonb) result', [action, actor, JSON.stringify(payload)])).rows[0].result; }
        catch (error) { if (error instanceof Error && 'code' in error && error.code === 'P0001') throw new StoreValidationError(error.message); throw error; }
      },
      async upload() { throw new Error('No se usan archivos en esta prueba'); },
      async remove() { throw new Error('No se usan archivos en esta prueba'); },
      async signedUrl() { throw new Error('No se usan archivos en esta prueba'); },
    };
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/*.supabase.co/**', async route => {
      if (!route.request().url().endsWith('/functions/v1/store-checkout')) { await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); return; }
      const h = route.request().headers();
      const response = await createStoreHandler(backend, h.apikey)(new Request(route.request().url(), { method: 'POST', headers: { ...h, authorization: 'Bearer fixture-verified-session' }, body: route.request().postData() }));
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
    });
    await page.route('**/__inventory-qa*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inventario QA aislado</title></head><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
      </script><script type="module">
      import React from '/node_modules/.vite/deps/react.js'; import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
      import {QueryClient,QueryClientProvider} from '/node_modules/.vite/deps/@tanstack_react-query.js';
      import InventoryManager from '/src/features/store/components/InventoryManager.tsx'; import ConfirmDialog from '/src/components/common/ConfirmDialog.tsx';
      import {useAuthStore} from '/src/store/useAuthStore.ts'; import '/src/index.css';
      useAuthStore.setState({user:{id:'${staff}'}});
      const products=[{id:'${productId}',name:'Inventario QA físico',sku:'QA-ONLY',category:'Prueba aislada',type:'physical',stock:3,product_variants:[],price:10}];
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(QueryClientProvider,{client:new QueryClient()},React.createElement('main',{className:'min-h-screen bg-slate-50 dark:bg-slate-950',style:{padding:'16px'}},React.createElement(InventoryManager,{products,canEdit:!location.search.includes('readonly')}),React.createElement(ConfirmDialog))));
    </script></body></html>` }));
    await page.goto('/__inventory-qa');
    await expect(page.getByText(/Último conteo: Pendiente/)).toBeVisible();
    await page.getByLabel('Ubicación o área responsable').fill('Armario de prueba');
    await page.getByRole('button', { name: 'Añadir campo', exact: true }).click();
    await page.getByLabel('Nombre del campo 1').fill('Lote');
    await page.getByLabel('Valor del campo 1').fill('QA-2026');
    await page.getByRole('button', { name: 'Guardar ficha', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Operación confirmada y guardada.');
    await page.getByLabel('Motivo, referencia o detalle del conteo').fill('Conteo sintético QA');
    await page.getByRole('button', { name: 'Iniciar conteo físico' }).click();
    await page.getByLabel('Cantidad contada: Existencias generales').fill('5');
    await page.getByRole('button', { name: 'Guardar borrador' }).click();
    await page.reload();
    await expect(page.getByLabel('Ubicación o área responsable')).toHaveValue('Armario de prueba');
    await expect(page.getByLabel('Valor del campo 1')).toHaveValue('QA-2026');
    await expect(page.getByLabel('Cantidad contada: Existencias generales')).toHaveValue('5');
    await page.getByLabel('Motivo, referencia o detalle del conteo').fill('Confirmación sintética QA');
    await page.getByRole('button', { name: 'Confirmar conteo', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText(/Último conteo: Pendiente/)).toHaveCount(0);
    await page.getByLabel('Unidades', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Registrar movimiento', exact: true }).click();
    await expect(page.getByText('+2 · 5 → 7', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Inventario QA físico/ })).toContainText('7 registradas');
    await expect(page.getByText('Responsable: Operador QA', { exact: true }).first()).toBeVisible();
    const current = (await db.query<{ stock: number }>('select stock from products where id=$1', [productId])).rows[0];
    expect(current.stock).toBe(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('inventario-qa-'+width+'.png'), fullPage: true });
    await page.goto('/__inventory-qa?readonly=1');
    await expect(page.getByRole('button', { name: 'Guardar ficha', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Registrar movimiento', exact: true })).toBeDisabled();
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('inventario-qa-oscuro-'+width+'.png'), fullPage: true });
  } finally { if (pageErrors.length) console.error('QA page errors:', pageErrors); await db.close(); }
});
