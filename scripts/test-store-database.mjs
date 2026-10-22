import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Actual isolated PostgreSQL; no production connection is used.
const db = new PGlite();
let checks = 0;
try {
  await db.exec(await readFile('supabase/tests/store_checkout_fixture.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20261022001552_secure_store_checkout_v2.sql', 'utf8'));
  const rpc = async (action, payload, actor = null, secret = 'a'.repeat(64)) => {
    await db.exec('savepoint request');
    try {
      const result = (await db.query('select public.store_api($1,$2::uuid,$3,$4::jsonb) as result', [action, actor, secret, JSON.stringify(payload)])).rows[0].result;
      await db.exec('release savepoint request');
      return result;
    } catch (error) {
      await db.exec('rollback to savepoint request; release savepoint request');
      throw error;
    }
  };
  const payload = (overrides = {}) => ({ request_id: crypto.randomUUID(), name: 'Cliente QA', email: `${crypto.randomUUID()}@example.invalid`, phone: '0990000000', delivery: 'pickup', expected_total: 11.5, items: [{ product_id: '10000000-0000-0000-0000-000000000001', quantity: 1 }], ...overrides });
  const test = async (name, fn) => {
    await db.exec('begin');
    try { await fn(); checks++; console.log(`PASS ${name}`); }
    finally { await db.exec('rollback'); }
  };
  const enable = () => db.exec('update private.store_checkout_settings set enabled=true');
  await test('deshabilitada hasta revisión del catálogo', async () => { await assert.rejects(rpc('create',payload()),/preparación/); });
  await test('cálculo servidor, snapshot, reserva e idempotencia', async () => {
    await enable(); const input=payload(); const a=await rpc('create',input); const b=await rpc('create',input);
    assert.equal(a.id,b.id); assert.equal(a.total,11.5); assert.equal(a.order_items[0].product_snapshot.name,'Físico QA');
    assert.equal((await db.query('select count(*)::int n from public.orders')).rows[0].n,1);
    assert.equal((await db.query('select stock from public.products where name=$1',['Físico QA'])).rows[0].stock,3);
    assert.equal((await db.query('select stock from public.store_catalog where name=$1',['Físico QA'])).rows[0].stock,2);
    await assert.rejects(rpc('create',{...input,name:'Otro'}),/otros datos/);
  });
  await test('total manipulado no deja pedidos ni reservas parciales', async () => {
    await enable(); await assert.rejects(rpc('create',payload({expected_total:0.01})),/precio cambió/);
    assert.equal((await db.query('select count(*)::int n from public.orders')).rows[0].n,0);
  });
  await test('reserva y POS no pueden vender la última unidad dos veces', async () => {
    await enable(); await rpc('create',payload({expected_total:34.5,items:[{product_id:'10000000-0000-0000-0000-000000000001',quantity:3}]}));
    await assert.rejects(rpc('create',payload()),/Stock insuficiente/);
    await assert.rejects(rpc('pos',payload({session_id:'30000000-0000-0000-0000-000000000001',payment_method:'cash',amount_paid:20}),'00000000-0000-0000-0000-000000000001'),/Stock insuficiente/);
  });
  await test('variantes y tarifas por cantidad conservan ajuste', async () => {
    await enable(); const input=payload({expected_total:67.28,items:[{product_id:'10000000-0000-0000-0000-000000000003',variant_id:'20000000-0000-0000-0000-000000000001',quantity:3}]});
    const o=await rpc('create',input); assert.equal(o.order_items[0].price,19.5); assert.equal(o.subtotal,58.5);
  });
  await test('pedido digital exige identidad y no reserva stock físico', async () => {
    await enable(); const input=payload({expected_total:20,phone:'',items:[{product_id:'10000000-0000-0000-0000-000000000002',quantity:1}]});
    await assert.rejects(rpc('create',input),/cuenta verificada/);
    const o=await rpc('create',input,'00000000-0000-0000-0000-000000000002'); assert.equal(o.total,20);
    assert.equal((await db.query('select count(*)::int n from private.store_reservations')).rows[0].n,0);
  });
  await test('identidad invitada y propiedad de comprobantes', async () => {
    await enable(); const o=await rpc('create',payload());
    await assert.rejects(rpc('status',{order_id:o.id},null,'b'.repeat(64)),/no disponible/);
    await assert.rejects(rpc('authorize_receipt',{order_id:o.id},'00000000-0000-0000-0000-000000000001','b'.repeat(64)),/adjuntar/);
  });
  await test('comprobante privado retiene reserva; aprobar exige referencia y descuenta una vez', async () => {
    await enable(); const o=await rpc('create',payload()); const path=`${o.id}/qa.pdf`;
    await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['store-receipts',path]);
    await rpc('attach_receipt',{order_id:o.id,path});
    await db.query("update public.orders set reservation_expires_at=now()-interval '1 hour' where id=$1",[o.id]);
    await rpc('expire',{});
    assert.equal((await rpc('status',{order_id:o.id})).ecommerce_payment_status,'verifying');
    await assert.rejects(rpc('admin_update',{order_id:o.id,status:'paid'},'00000000-0000-0000-0000-000000000001'),/referencia/);
    await rpc('admin_update',{order_id:o.id,status:'paid',reference:'BANK-QA'},'00000000-0000-0000-0000-000000000001');
    assert.equal((await db.query('select stock from public.products where name=$1',['Físico QA'])).rows[0].stock,2);
    await assert.rejects(rpc('admin_update',{order_id:o.id,status:'paid',reference:'BANK-QA'},'00000000-0000-0000-0000-000000000001'),/referencia/);
  });
  await test('vencimiento libera, rechaza comprobante tardío y es repetible', async () => {
    await enable(); const o=await rpc('create',payload());
    await db.query("update public.orders set reservation_expires_at=now()-interval '1 hour' where id=$1",[o.id]);
    await rpc('expire',{}); await rpc('expire',{});
    assert.equal((await rpc('status',{order_id:o.id})).status,'cancelled');
    assert.equal((await db.query('select state from private.store_reservations')).rows[0].state,'released');
    await assert.rejects(rpc('authorize_receipt',{order_id:o.id}),/vencida/);
  });
  await test('POS atómico, total servidor y resumen de caja', async () => {
    await enable(); const o=await rpc('pos',payload({session_id:'30000000-0000-0000-0000-000000000001',payment_method:'cash',amount_paid:20}),'00000000-0000-0000-0000-000000000001');
    assert.equal(o.status,'completed');
    assert.equal((await db.query('select total_cash_sales from public.pos_sessions')).rows[0].total_cash_sales,'11.50');
  });
  await test('los navegadores no pueden invocar RPC privilegiado ni falsificar pagos', async () => {
    await db.exec('set local role anon');
    await assert.rejects(rpc('create',payload()),/permission denied/);
    await db.exec('rollback; begin; set local role authenticated');
    await assert.rejects(db.exec("insert into public.orders(customer_name,customer_email,total,status) values('QA','qa@example.invalid',1,'paid')"),/permission denied/);
  });
  await test('contenedor privado protegido incluso con política heredada permisiva', async () => {
    await db.exec("insert into storage.objects(bucket_id,name) values('store-receipts','private-qa.pdf'),('other','public-qa.pdf'); set local role authenticated");
    assert.equal((await db.query("select count(*)::int n from storage.objects where bucket_id='store-receipts'")).rows[0].n,0);
    assert.equal((await db.query("select count(*)::int n from storage.objects where bucket_id='other'")).rows[0].n,1);
  });
  await test('catálogo público sin columnas internas ni recursos de descarga', async () => {
    await db.exec('set local role anon');
    const catalog=(await db.query('select * from public.store_catalog')).rows;
    assert.equal(catalog.length,3); assert.equal('cost_price' in catalog[0],false); assert.equal('digital_file_url' in catalog[0],false);
  });
  await test('service_role puede ejecutar checkout, usuario normal no gestiona pagos', async () => {
    await enable(); await db.exec('set local role service_role');
    const o=await rpc('create',payload(), '00000000-0000-0000-0000-000000000002');
    await assert.rejects(rpc('admin_update',{order_id:o.id,status:'paid',reference:'FORGED'},'00000000-0000-0000-0000-000000000002'),/Sin permiso/);
    await db.exec('reset role');
  });
  await test('fallo al consumir la segunda variante revierte todo el pago y stock', async () => {
    await enable(); const o=await rpc('create',payload({expected_total:37.95,items:[
      {product_id:'10000000-0000-0000-0000-000000000001',quantity:1},
      {product_id:'10000000-0000-0000-0000-000000000003',variant_id:'20000000-0000-0000-0000-000000000001',quantity:1}
    ]}));
    const path=o.id+'/qa.pdf'; await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['store-receipts',path]);
    await rpc('attach_receipt',{order_id:o.id,path});
    await db.exec('update public.product_variants set stock=0');
    await assert.rejects(rpc('admin_update',{order_id:o.id,status:'paid',reference:'BANK-QA'},'00000000-0000-0000-0000-000000000001'),/Inventario cambiado/);
    assert.equal((await db.query('select stock from public.products where name=$1',['Físico QA'])).rows[0].stock,3);
    assert.equal((await rpc('status',{order_id:o.id})).ecommerce_payment_status,'verifying');
  });
  await test('IVA de 19,90 se redondea a 2,99 en servidor y cliente', async () => {
    await enable(); await db.exec("update public.products set price=19.9 where name='Físico QA'");
    const o=await rpc('create',payload({expected_total:22.89}));
    assert.equal(o.tax_total,2.99); assert.equal(o.total,22.89);
  });
  await test('historial previo sigue visible para su dueño sin capacidad invitada nueva', async () => {
    const id=crypto.randomUUID();
    await db.query("insert into public.orders(id,user_id,customer_name,customer_email,total,status) values($1,$2,'QA histórico','qa@example.invalid',10,'paid')",[id,'00000000-0000-0000-0000-000000000002']);
    assert.equal((await rpc('list_orders',{},'00000000-0000-0000-0000-000000000002')).length,1);
    await assert.rejects(rpc('status',{order_id:id}),/no disponible/);
  });
  await test('vistas de lectura no heredan escritura con privilegios por defecto amplios', async () => {
    await db.exec('set local role anon');
    await assert.rejects(db.exec("update public.store_catalog set price=0"),/permission denied/);
    await db.exec('rollback; begin; set local role authenticated');
    await assert.rejects(db.exec('select * from private.store_order_access'),/permission denied/);
  });
  await test('registro de reembolso es acumulado e idempotente y nunca repone stock', async () => {
    await enable(); const actor='00000000-0000-0000-0000-000000000001';
    const o=await rpc('pos',payload({session_id:'30000000-0000-0000-0000-000000000001',payment_method:'cash',amount_paid:20}),actor);
    const action={order_id:o.id,operation:'refund',amount:3,reason:'QA devolución',operation_id:crypto.randomUUID()};
    await rpc('admin_update',action,actor); const repeat=await rpc('admin_update',action,actor);
    assert.equal(repeat.refunded_amount,3);
    assert.equal((await db.query('select stock from public.products where name=$1',['Físico QA'])).rows[0].stock,2);
    await assert.rejects(rpc('admin_update',{...action,amount:10,operation_id:crypto.randomUUID()},actor),/Importe o motivo/);
  });
  console.log(`Database assertions: ${checks} passed. Isolated PGlite; fixtures only; no real purchases.`);
} catch (error) {
  console.error('Database test failed:', error.message, { code: error.code, detail: error.detail, hint: error.hint, where: error.where, position: error.position });
  process.exitCode = 1;
} finally { await db.close(); }
