import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createStoreHandler, StoreValidationError } from '../supabase/functions/store-checkout/handler';
import type { StoreBackend } from '../supabase/functions/store-checkout/handler';

// Real components, Edge handler and migrations; synthetic accounts and purchases only.
for (const width of [390, 1280]) test('seguimiento y biblioteca a '+width+'px', async ({ page, browserName }, testInfo) => {
  const db = new PGlite();
  const owner = '00000000-0000-0000-0000-000000000001', secret = 'a'.repeat(64);
  const errors: string[] = []; page.on('pageerror', e => { errors.push(e.message); console.error('QA browser:', e.message); });
  try {
    for (const path of ['supabase/tests/store_checkout_fixture.sql','supabase/migrations/20261022001552_secure_store_checkout_v2.sql','supabase/tests/store_inventory_fixture.sql','supabase/migrations/20261022022116_store_inventory_control.sql','supabase/tests/store_customer_fixture.sql','supabase/migrations/20261022030818_store_customer_portal.sql']) await db.exec(await readFile(path,'utf8'));
    await db.exec(await readFile('supabase/migrations/20261022031805_store_customer_identity_columns.sql','utf8'));
    await db.exec('update private.store_checkout_settings set enabled=true');
    const rpc = async (action: string, actor: string | null, payload: Record<string, unknown>, cap = secret) => {
      const name = action.startsWith('customer_') ? 'store_customer_api' : 'store_api';
      return (await db.query<{result: Record<string, unknown>}>(`select public.${name}($1,$2::uuid,$3,$4::jsonb) result`,[action,actor,cap,JSON.stringify(payload)])).rows[0].result;
    };
    const create = (digital: boolean) => rpc('create',digital ? owner : null,{request_id:crypto.randomUUID(),name:'Cliente QA',email:'owner@example.invalid',phone:'0990000000',delivery:digital?'':'pickup',expected_total:digital?20:11.5,items:[{product_id:digital?'10000000-0000-0000-0000-000000000002':'10000000-0000-0000-0000-000000000001',quantity:1}]});
    const guest = await create(false), digital = await create(true);
    const path = digital.id+'/fixture.pdf';
    await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['store-receipts',path]);
    await rpc('attach_receipt',owner,{order_id:digital.id,path});
    await rpc('admin_update',owner,{order_id:digital.id,status:'paid',reference:'QA-ONLY'});
    const backend: StoreBackend = {
      async authenticate(token) { if (token !== 'fixture-owner') throw new Error('Sesión QA inválida'); return owner; },
      async limit() {},
      async execute(action, actor, cap, payload) { try { return await rpc(action,actor,payload,cap); } catch (e) { if (e instanceof Error && 'code' in e && e.code === 'P0001') throw new StoreValidationError(e.message); throw e; } },
      async upload() { throw new Error('Sin carga real'); }, async remove() { throw new Error('Sin archivos reales'); }, async signedUrl() { throw new Error('Sin archivos reales'); },
    };
    await page.setViewportSize({width,height:900});
    await page.route('**/*.supabase.co/**',async route => {
      if (route.request().url().includes('/rest/v1/store_catalog')) { const catalog = (await db.query('select * from public.store_catalog')).rows; await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(catalog)}); return; }
      if (!route.request().url().endsWith('/functions/v1/store-checkout')) { await route.fulfill({status:200,contentType:'application/json',body:'{}'}); return; }
      const headers = route.request().headers();
      const response = await createStoreHandler(backend,headers.apikey)(new Request(route.request().url(),{method:'POST',headers:{...headers,authorization:'Bearer '+(page.url().includes('account=1')?'fixture-owner':headers.apikey)},body:route.request().postData()}));
      await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
    });
    await page.route('**/__customer-qa*',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root" data-order="${guest.id}"></div><script type="module">
      import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
      </script><script type="module">
      import '/e2e/fixtures/store-customer-harness.tsx';
      </script></body></html>`}));
    const code = `JER1.${guest.id}.${secret}`;
    await page.goto('/__customer-qa');
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button',{name:'Guardar clave en archivo'}).click();
    const download = await downloadEvent; const downloaded = await download.path();
    expect(downloaded).toBeTruthy(); expect(await readFile(downloaded!, 'utf8')).toContain(code);
    await page.getByRole('region',{name:'Seguimiento de invitado'}).getByLabel('Clave privada de seguimiento',{exact:true}).fill(code);
    await page.getByRole('button',{name:'Consultar con clave',exact:true}).click();
    await expect(page.getByRole('region',{name:'Detalle de pedido'})).toContainText('Pendiente de comprobante y pago');
    await page.reload();
    await expect(page.getByRole('region',{name:'Seguimiento de invitado'}).getByLabel('Clave privada de seguimiento',{exact:true})).toHaveValue(code);
    await page.getByRole('button',{name:'Consultar con clave',exact:true}).click();
    await expect(page.getByRole('region',{name:'Detalle de pedido'})).toBeVisible();
    await page.goto('/__customer-qa?account=1');
    await page.getByRole('button',{name:'Consultar con clave',exact:true}).click();
    await page.getByRole('button',{name:'Vincular este pedido a mi cuenta'}).click();
    await expect(page.getByRole('region',{name:'Seguimiento de invitado'}).getByLabel('Clave privada de seguimiento',{exact:true})).toHaveValue('');
    await expect(page.getByRole('button',{name:new RegExp('Consultar pedido '+String(guest.id).slice(0,8))})).toBeVisible();
    await page.getByRole('button',{name:'Preparar acceso al recurso'}).click();
    const resource = page.getByRole('link',{name:'Abrir recurso en Google'});
    await expect(resource).toHaveAttribute('href','https://drive.google.com/file/d/QA_ONLY/view');
    await expect(resource).toHaveAttribute('rel','noopener noreferrer');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
    await page.screenshot({path:testInfo.outputPath('compras-'+width+'.png'),fullPage:true});
    await page.evaluate(()=>document.documentElement.classList.add('dark'));
    await page.screenshot({path:testInfo.outputPath('compras-oscuro-'+width+'.png'),fullPage:true});
    await db.query('update orders set refunded_amount=1 where id=$1',[digital.id]);
    await page.getByRole('button',{name:'Actualizar compras',exact:true}).click();
    await expect(page.getByText('Acceso en conciliación por reembolso',{exact:true})).toBeVisible();
    await expect(resource).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Preparar acceso al recurso'})).toHaveCount(0);
    await page.goto('/__customer-qa?catalog=1&producto=10000000-0000-0000-0000-000000000002');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('heading',{name:'Digital QA',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Copiar enlace del producto'})).toBeVisible();
    if (browserName === 'chromium') {
      await page.context().grantPermissions(['clipboard-read','clipboard-write']);
      await page.getByRole('button',{name:'Copiar enlace del producto'}).click();
      expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('/tienda?producto=10000000-0000-0000-0000-000000000002');
    }
    await page.reload();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(page.url()).not.toContain('producto=');
    await page.goto('/__customer-qa?catalog=1&producto=unavailable');
    await expect(page.getByRole('alert')).toContainText('Este producto ya no está disponible');
    expect(errors).toEqual([]);
  } finally { await db.close(); }
});
