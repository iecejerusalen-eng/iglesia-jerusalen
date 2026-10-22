import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated database only. Never connects to a remote project.
const db = new PGlite();
const product = '10000000-0000-0000-0000-000000000001';
const variantProduct = '10000000-0000-0000-0000-000000000003';
const staff = '00000000-0000-0000-0000-000000000001';
let checks = 0;
try {
  await db.exec(await readFile('supabase/tests/store_checkout_fixture.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20261022001552_secure_store_checkout_v2.sql', 'utf8'));
  await db.exec(await readFile('supabase/tests/store_inventory_fixture.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20261022022116_store_inventory_control.sql', 'utf8'));
  const inventory = async (action, extra = {}, actor = staff, pid = product) => {
    await db.exec('savepoint inventory_request');
    try {
      const r = (await db.query('select public.store_inventory_api($1,$2::uuid,$3::jsonb) result', [action, actor, JSON.stringify({ product_id: pid, operation_id: crypto.randomUUID(), reason: 'Conteo de prueba aislada', ...extra })])).rows[0].result;
      await db.exec('release savepoint inventory_request'); return r;
    } catch (e) { await db.exec('rollback to savepoint inventory_request; release savepoint inventory_request'); throw e; }
  };
  const test = async (name, fn) => { await db.exec('begin'); try { await fn(); console.log('PASS '+name); checks++; } finally { await db.exec('rollback'); } };
  const sql = async (query, args = []) => (await db.query(query, args)).rows;
  const stock = async () => Number((await sql('select stock from public.products where id=$1', [product]))[0].stock);
  await test('no certifica stock existente ni habilita ventas', async () => {
    const detail = await inventory('inventory_read'); assert.equal(detail.profile.last_count_at, undefined);
    assert.equal((await sql('select enabled from private.store_checkout_settings'))[0].enabled,false);
  });
  await test('permisos efectivos y RPC no ejecutable por navegador', async () => {
    await assert.rejects(inventory('inventory_read',{},null), /permiso/);
    await assert.rejects(inventory('inventory_move',{quantity:1,direction:'in'},'00000000-0000-0000-0000-000000000002'),/permiso/);
    const acl=(await sql("select has_function_privilege('authenticated','public.store_inventory_api(text,uuid,jsonb)','EXECUTE') as rpc,has_table_privilege('authenticated','public.inventory_movements','INSERT') as writes"))[0];
    assert.equal(acl.rpc,false); assert.equal(acl.writes,false);
  });
  await test('entrada idempotente y huella vinculada al contenido', async () => {
    const initial=await stock(); const operation_id=crypto.randomUUID();
    await inventory('inventory_move',{operation_id,quantity:3,direction:'in'});
    await inventory('inventory_move',{operation_id,quantity:3,direction:'in'});
    assert.equal(await stock(),initial+3);
    await assert.rejects(inventory('inventory_move',{operation_id,quantity:4,direction:'in'}),/otros datos/);
  });
  await test('salida no invade reservas', async () => {
    await db.exec('update private.store_checkout_settings set enabled=true');
    const payload={request_id:crypto.randomUUID(),name:'Fixture',email:'fixture@example.invalid',phone:'0990000000',delivery:'pickup',expected_total:11.5,items:[{product_id:product,quantity:1}]};
    await sql('select public.store_api($1,null,$2,$3::jsonb)', ['create','a'.repeat(64),JSON.stringify(payload)]);
    await assert.rejects(inventory('inventory_move',{quantity:await stock(),direction:'out'}),/reservadas/);
  });
  await test('borrador no cambia stock; confirma cantidades cero e idempotencia', async () => {
    const initial=await stock(); let d=await inventory('inventory_count_start'); const count_id=d.counts[0].id;
    await inventory('inventory_count_save',{count_id,observed:{base:0}}); assert.equal(await stock(),initial);
    const operation_id=crypto.randomUUID(); d=await inventory('inventory_count_commit',{operation_id,count_id,observed:{base:0}});
    assert.equal(await stock(),0); assert.ok(d.profile.last_count_at); assert.equal(d.counts[0].state,'committed');
    await inventory('inventory_count_commit',{operation_id,count_id,observed:{base:0}}); assert.equal(await stock(),0);
  });
  await test('conflicto de conteo detecta incluso movimientos que restauran stock', async () => {
    const initial=await stock(); const d=await inventory('inventory_count_start'); const count_id=d.counts[0].id;
    await inventory('inventory_move',{quantity:1,direction:'in'}); await inventory('inventory_move',{quantity:1,direction:'out'});
    assert.equal(await stock(),initial);
    await assert.rejects(inventory('inventory_count_commit',{count_id,observed:{base:initial}}),/Cambió/);
  });
  await test('conteos parciales no confirman y conteo cancelado conserva trazabilidad', async () => {
    const d=await inventory('inventory_count_start'); const count_id=d.counts[0].id;
    await assert.rejects(inventory('inventory_count_commit',{count_id,observed:{}}),/Completa/);
    const cancelled=await inventory('inventory_count_cancel',{count_id}); assert.equal(cancelled.counts[0].state,'cancelled');
  });
  await test('valida campos y rechaza cantidades fraccionarias o negativas', async () => {
    await assert.rejects(inventory('inventory_move',{quantity:0.5,direction:'in'}),/inválido/);
    await assert.rejects(inventory('inventory_move',{quantity:-1,direction:'out'}),/inválido/);
    const d=await inventory('inventory_count_start');
    await assert.rejects(inventory('inventory_count_save',{count_id:d.counts[0].id,observed:{base:1.5}}),/entero/);
    await assert.rejects(inventory('inventory_profile',{minimum:2,location:'',notes:'',custom_fields:[]}),/ficha/);
    const saved=await inventory('inventory_profile',{minimum:2,location:'Armario QA',notes:'Solo fixture',custom_fields:{Área:'Prueba'}});
    assert.equal(saved.profile.location,'Armario QA'); assert.equal(saved.profile.last_count_at,null);
  });
  await test('digital tiene ficha sin conteo ni movimientos físicos', async () => {
    const digital='10000000-0000-0000-0000-000000000002';
    await assert.rejects(inventory('inventory_count_start',{},staff,digital),/digitales/);
    assert.deepEqual((await inventory('inventory_read',{},staff,digital)).points,[]);
  });
  await test('variantes sincronizan base y conteo exige todas las combinaciones', async () => {
    const a='20000000-0000-0000-0000-000000000001',b=crypto.randomUUID();
    await sql('insert into public.product_variants(id,product_id,color_name,size,stock) values($1,$2,$3,$4,0)',[b,variantProduct,'Azul','M']);
    let d=await inventory('inventory_count_start',{},staff,variantProduct); const count_id=d.counts[0].id;
    await assert.rejects(inventory('inventory_count_commit',{count_id,observed:{[a]:2}},staff,variantProduct),/Completa/);
    d=await inventory('inventory_count_commit',{count_id,observed:{[a]:2,[b]:3}},staff,variantProduct);
    assert.equal(Number((await sql('select stock from public.products where id=$1',[variantProduct]))[0].stock),5);
    assert.equal(d.movements.length,2); assert.equal(d.movements.reduce((s,m)=>s+m.quantity,0),-1);
  });
  await test('navegador no cambia stock ni borra historial aunque tenga permiso de producto', async () => {
    await inventory('inventory_move',{quantity:1,direction:'in'});
    await db.exec(`savepoint browser_write; set local role authenticated; select set_config('request.jwt.claim.sub','${staff}',true)`);
    await assert.rejects(db.exec(`update public.products set stock=99 where id='${product}'`),/Inventario/);
    await db.exec('rollback to savepoint browser_write; release savepoint browser_write');
  });
  await test('operaciones de caja registran actor y pedido en el mismo movimiento', async () => {
    await db.exec('update private.store_checkout_settings set enabled=true');
    const session='30000000-0000-0000-0000-000000000001';
    const payload={request_id:crypto.randomUUID(),name:'Caja QA',email:'',phone:'',delivery:'pickup',expected_total:11.5,items:[{product_id:product,quantity:1}],session_id:session,payment_method:'cash',amount_paid:20};
    const order=(await sql('select public.store_api($1,$2::uuid,$3,$4::jsonb) result',['pos',staff,'a'.repeat(64),JSON.stringify(payload)]))[0].result;
    const d=await inventory('inventory_read'); assert.equal(d.movements[0].movement_type,'pos_sale'); assert.equal(d.movements[0].actor_id,staff); assert.equal(d.movements[0].reference_order_id,order.id);
  });
  await test('service_role puede gestionar stock; navegador no ejecuta el RPC', async () => {
    await db.exec('set local role service_role');
    const d=await inventory('inventory_move',{quantity:1,direction:'in'}); assert.equal(d.movements[0].actor_id,staff);
    await db.exec('reset role');
  });
  await test('confirmación web descuenta y audita una sola vez', async () => {
    await db.exec('update private.store_checkout_settings set enabled=true');
    const payload={request_id:crypto.randomUUID(),name:'Web QA',email:'web@example.invalid',phone:'0990000000',delivery:'pickup',expected_total:11.5,items:[{product_id:product,quantity:1}]};
    const order=(await sql('select public.store_api($1,null,$2,$3::jsonb) result',['create','a'.repeat(64),JSON.stringify(payload)]))[0].result;
    await sql('insert into storage.objects(bucket_id,name) values($1,$2)',['store-receipts',order.id+'/qa.png']);
    await sql('select public.store_api($1,null,$2,$3::jsonb)',['attach_receipt','a'.repeat(64),JSON.stringify({order_id:order.id,path:order.id+'/qa.png'})]);
    await sql('select public.store_api($1,$2::uuid,$3,$4::jsonb)',['admin_update',staff,'',JSON.stringify({order_id:order.id,status:'paid',reference:'QA-ONLY'})]);
    const d=await inventory('inventory_read'); assert.equal(d.movements.length,1); assert.equal(d.movements[0].movement_type,'online_sale'); assert.equal(d.movements[0].reference_order_id,order.id);
  });
  await test('consulta delegada no concede edición ni lectura anónima del historial', async () => {
    await db.exec(`create or replace function private.profile_has_admin_permission(uuid,text,text) returns boolean language sql as $$ select $1='${staff}'::uuid and $3='view' $$`);
    assert.equal((await inventory('inventory_read')).product_id,product);
    await assert.rejects(inventory('inventory_move',{quantity:1,direction:'in'}),/modificar/);
    assert.equal((await sql("select has_table_privilege('anon','public.inventory_movements','SELECT') as allowed"))[0].allowed,false);
  });
  await test('variantes nuevas invalidan conteo vigente sin borrar su historial', async () => {
    let d=await inventory('inventory_count_start',{},staff,variantProduct);
    d=await inventory('inventory_count_commit',{count_id:d.counts[0].id,observed:{'20000000-0000-0000-0000-000000000001':6}},staff,variantProduct);
    assert.ok(d.profile.last_count_at);
    await sql('insert into public.product_variants(id,product_id,color_name,size,stock) values($1,$2,$3,$4,0)',[crypto.randomUUID(),variantProduct,'Rojo','S']);
    d=await inventory('inventory_read',{},staff,variantProduct); assert.equal(d.profile.last_count_at,null); assert.equal(d.counts[0].state,'committed');
  });
  await test('un conteo no elimina reservas y conserva el borrador al rechazar', async () => {
    await db.exec('update private.store_checkout_settings set enabled=true');
    const payload={request_id:crypto.randomUUID(),name:'Reserva QA',email:'reserve@example.invalid',phone:'0990000000',delivery:'pickup',expected_total:11.5,items:[{product_id:product,quantity:1}]};
    await sql('select public.store_api($1,null,$2,$3::jsonb)',['create','b'.repeat(64),JSON.stringify(payload)]);
    const initial=await stock(); const d=await inventory('inventory_count_start');
    await assert.rejects(inventory('inventory_count_commit',{count_id:d.counts[0].id,observed:{base:0}}),/reservadas/);
    assert.equal(await stock(),initial); assert.equal((await inventory('inventory_read')).counts[0].state,'draft');
  });
  await test('fallo en segunda variante revierte cantidades, movimientos y confirmación', async () => {
    const a='20000000-0000-0000-0000-000000000001',b='ffffffff-0000-0000-0000-000000000001';
    await sql('insert into public.product_variants(id,product_id,color_name,size,stock) values($1,$2,$3,$4,0)',[b,variantProduct,'Rojo','S']);
    await inventory('inventory_move',{variant_id:b,quantity:2,direction:'in'},staff,variantProduct);
    await db.exec('update private.store_checkout_settings set enabled=true');
    const payload={request_id:crypto.randomUUID(),name:'Reserva QA',email:'variant@example.invalid',phone:'0990000000',delivery:'pickup',expected_total:25.3,items:[{product_id:variantProduct,variant_id:b,quantity:1}]};
    await sql('select public.store_api($1,null,$2,$3::jsonb)',['create','b'.repeat(64),JSON.stringify(payload)]);
    const d=await inventory('inventory_count_start',{},staff,variantProduct);
    await assert.rejects(inventory('inventory_count_commit',{count_id:d.counts[0].id,observed:{[a]:2,[b]:0}},staff,variantProduct),/reservadas/);
    const current=await inventory('inventory_read',{},staff,variantProduct);
    assert.equal(current.points.find(p=>p.variant_id===a).stock,6);
    assert.equal(current.points.find(p=>p.variant_id===b).stock,2);
    assert.equal(current.movements.length,1); assert.equal(current.counts[0].state,'draft'); assert.equal(current.profile.last_count_at,undefined);
  });
  console.log(`Inventory assertions: ${checks} passed. Isolated PGlite; no real counts or stock edits.`);
} finally { await db.close(); }
