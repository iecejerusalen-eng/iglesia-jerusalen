import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite(); let checks=0;
const owner='00000000-0000-0000-0000-000000000001', other='00000000-0000-0000-0000-000000000002';
const physical='10000000-0000-0000-0000-000000000001', digital='10000000-0000-0000-0000-000000000002', secret='a'.repeat(64);
try {
 for(const p of ['supabase/tests/store_checkout_fixture.sql','supabase/migrations/20261022001552_secure_store_checkout_v2.sql','supabase/tests/store_inventory_fixture.sql','supabase/migrations/20261022022116_store_inventory_control.sql','supabase/tests/store_customer_fixture.sql','supabase/migrations/20261022030818_store_customer_portal.sql','supabase/migrations/20261022031805_store_customer_identity_columns.sql']) await db.exec(await readFile(p,'utf8'));
 const sql=async(q,args=[])=>(await db.query(q,args)).rows;
 const rpc=async(action,payload={},actor=owner,cap=secret,portal=true)=>{
  await db.exec('savepoint req');
  try {const r=(await sql(`select public.${portal?'store_customer_api':'store_api'}($1,$2::uuid,$3,$4::jsonb) result`,[action,actor,cap,JSON.stringify(payload)]))[0].result; await db.exec('release savepoint req'); return r;}
  catch(e){await db.exec('rollback to savepoint req;release savepoint req');throw e;}
 };
 const create=(isDigital=false,actor=null)=>rpc('create',{request_id:crypto.randomUUID(),name:'Cliente QA',email:'owner@example.invalid',phone:'0990000000',delivery:isDigital?'':'pickup',expected_total:isDigital?20:11.5,items:[{product_id:isDigital?digital:physical,quantity:1}]},actor,secret,false);
 const pay=async(o)=>{const path=o.id+'/fixture.pdf';await sql('insert into storage.objects(bucket_id,name) values($1,$2)',['store-receipts',path]);await rpc('attach_receipt',{order_id:o.id,path},o.user_id,secret,false);return rpc('admin_update',{order_id:o.id,status:'paid',reference:'QA-ONLY'},owner,'',false);};
 const test=async(name,fn)=>{await db.exec('begin;update private.store_checkout_settings set enabled=true');try{await fn();checks++;console.log('PASS '+name);}finally{await db.exec('rollback');}};
 await test('biblioteca y vínculos exigen cuenta verificada',async()=>{
  await assert.rejects(rpc('customer_library',{},null),/verificada/);
  await db.exec(`update auth.users set email_confirmed_at=null where id='${owner}'`);
  await assert.rejects(rpc('customer_library'),/verificada/);
 });
 await test('clave de invitado no equivale a número de pedido ni admite otro correo',async()=>{
  const o=await create();await assert.rejects(rpc('status',{order_id:o.id},null,'b'.repeat(64),false),/no disponible/);
  await assert.rejects(rpc('customer_claim',{order_id:o.id},other),/No se pudo vincular/);
  await assert.rejects(rpc('customer_claim',{order_id:o.id},owner,'b'.repeat(64)),/No se pudo vincular/);
 });
 await test('vinculación atómica, idempotente e invalida clave invitada',async()=>{
  const o=await create();const claimed=await rpc('customer_claim',{order_id:o.id});assert.equal(claimed.user_id,owner);
  await rpc('customer_claim',{order_id:o.id});assert.equal((await sql("select count(*)::int n from private.store_customer_events where event='claim'"))[0].n,1);
  await assert.rejects(rpc('status',{order_id:o.id},null,secret,false),/no disponible/);
  assert.equal((await rpc('list_orders',{},owner,'',false)).length,1);
 });
 await test('claves vencidas no vinculan y otras cuentas no toman pedidos',async()=>{
  const o=await create();await sql("update private.store_order_access set access_expires_at=now()-interval '1 second' where order_id=$1",[o.id]);
  await assert.rejects(rpc('customer_claim',{order_id:o.id}),/No se pudo vincular/);
 });
 await test('digital pendiente aparece sin URL ni entrega antes de pago confirmado',async()=>{
  const o=await create(true,owner);const library=await rpc('customer_library');assert.equal(library[0].state,'pending_payment');assert.equal(library[0].name,'Digital QA');assert.ok(!JSON.stringify(library).includes('drive.google.com'));
  await assert.rejects(rpc('customer_digital_open',{item_id:o.order_items[0].id}),/no disponible/);
 });
 await test('pago otorga fuente estable y apertura verifica dueño y audita',async()=>{
  const o=await create(true,owner);await pay(o);const item=o.order_items[0].id;
  await db.exec("update product_digital_assets set drive_link='https://drive.google.com/NEW_NOT_PURCHASED'");
  const access=await rpc('customer_digital_open',{item_id:item});assert.equal(access.url,'https://drive.google.com/file/d/QA_ONLY/view');
  await assert.rejects(rpc('customer_digital_open',{item_id:item},other),/no disponible/);
  assert.equal((await sql("select count(*)::int n from private.store_customer_events where event='digital_open'"))[0].n,1);
 });
 await test('reembolso bloquea futuras aperturas y deja el recurso en conciliación',async()=>{
  const o=await create(true,owner);await pay(o);await sql('update orders set refunded_amount=1 where id=$1',[o.id]);
  assert.equal((await rpc('customer_library'))[0].state,'reconciliation');
  await assert.rejects(rpc('customer_digital_open',{item_id:o.order_items[0].id}),/no disponible/);
 });
 await test('un recurso mal configurado no se presenta como enlace generado',async()=>{
  await db.exec("update product_digital_assets set drive_link='https://evil.invalid/steal'");const o=await create(true,owner);await pay(o);
  assert.equal((await rpc('customer_library'))[0].state,'preparing');
  await assert.rejects(rpc('customer_digital_open',{item_id:o.order_items[0].id}),/preparación/);
 });
 await test('correo ausente no permite apropiarse de una compra invitada',async()=>{
  const o=await create();await sql("update orders set customer_email='' where id=$1",[o.id]);
  await assert.rejects(rpc('customer_claim',{order_id:o.id}),/No se pudo vincular/);
  await sql('update auth.users set email=null where id=$1',[owner]);await assert.rejects(rpc('customer_library'),/verificada/);
 });
 await test('cambio del catálogo no reescribe entregas y cancelación impide abrirlas',async()=>{
  const o=await create(true,owner);await pay(o);await db.exec("update product_digital_assets set instructions='NUEVAS',drive_link='https://docs.google.com/NEW'");
  await rpc('admin_update',{order_id:o.id,status:'ready_for_pickup',reference:'QA-ONLY'},owner,'',false);
  assert.equal((await rpc('customer_digital_open',{item_id:o.order_items[0].id})).instructions,'Archivo sintético; sin descarga real');
  await sql("update orders set status='cancelled' where id=$1",[o.id]);assert.equal((await rpc('customer_library'))[0].state,'cancelled');
  await assert.rejects(rpc('customer_digital_open',{item_id:o.order_items[0].id}),/no disponible/);
 });
 await test('navegador comprador no lee fuentes maestras aunque herede política amplia',async()=>{
  assert.equal((await sql("select has_function_privilege('authenticated','public.store_customer_api(text,uuid,text,jsonb)','EXECUTE') x"))[0].x,false);
  await db.exec(`set local role authenticated;select set_config('request.jwt.claim.sub','${other}',true)`);
  assert.equal((await sql('select * from product_digital_assets')).length,0);await db.exec('reset role');
  await db.exec('grant select on public.product_digital_assets to public;set local role anon');
  assert.equal((await sql('select * from product_digital_assets')).length,0);await db.exec('reset role');
 });
 await test('service_role ejecuta el portal y la compra física no crea recursos',async()=>{
  const o=await create();await pay(o);await rpc('customer_claim',{order_id:o.id});await db.exec('set local role service_role');assert.deepEqual(await rpc('customer_library'),[]);await db.exec('reset role');
 });
 await test('comprador sin permisos de staff abre su propia compra digital pagada',async()=>{
  const o=await create(true,other);await pay(o);
  assert.equal((await rpc('customer_library',{},other))[0].state,'available');assert.deepEqual(await rpc('customer_library'),[]);
  assert.equal((await rpc('customer_digital_open',{item_id:o.order_items[0].id},other)).kind,'external_google');
  await assert.rejects(rpc('customer_digital_open',{item_id:o.order_items[0].id},owner),/no disponible/);
 });
 await test('servidor solo lee identidad necesaria, compra digital y portal sin SELECT global de Auth',async()=>{
  assert.equal((await sql("select has_table_privilege('service_role','auth.users','SELECT') x"))[0].x,false);
  assert.equal((await sql("select has_column_privilege('service_role','auth.users','email','SELECT') x"))[0].x,true);
  assert.equal((await sql("select has_column_privilege('service_role','auth.users','encrypted_password','SELECT') x"))[0].x,false);
  await db.exec('set local role service_role');
  const o=await create(true,other);await pay(o);
  assert.equal((await rpc('customer_library',{},other))[0].state,'available');
  assert.equal((await rpc('customer_digital_open',{item_id:o.order_items[0].id},other)).kind,'external_google');
  await db.exec('reset role');
 });
 console.log(`Customer portal assertions: ${checks} passed. Isolated fixtures; no real email or delivery.`);
} finally {await db.close();}
