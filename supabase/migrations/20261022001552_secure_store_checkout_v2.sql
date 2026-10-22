-- Phase 2. Apply together with the store-checkout Edge Function and its clients.
-- New sales start DISABLED until catalog/count/prices are verified. No live rows are rewritten.
begin;

create schema if not exists private;
create table private.store_checkout_settings (
  id boolean primary key default true check (id), enabled boolean not null default false
);
insert into private.store_checkout_settings(id) values(true);
create table private.store_order_access (
  order_id uuid primary key references public.orders(id),
  request_id uuid not null unique, secret_hash text not null, fingerprint text not null,
  created_at timestamptz not null default now(), access_expires_at timestamptz not null default now()+interval '30 days'
);
create table private.store_reservations (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  product_id uuid not null references public.products(id), variant_id uuid references public.product_variants(id),
  quantity integer not null check(quantity>0), state text not null check(state in ('active','held','consumed','released')),
  expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index store_reservations_availability on private.store_reservations(product_id,variant_id,state,expires_at);
create index store_reservations_order on private.store_reservations(order_id);
create table private.store_order_events (
  id bigint generated always as identity primary key, order_id uuid not null references public.orders(id),
  actor_id uuid, request_id uuid, event text not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index store_order_events_order on private.store_order_events(order_id,created_at);
create unique index store_order_events_request on private.store_order_events(order_id,request_id) where request_id is not null;
create table private.store_receipts (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  storage_path text not null unique, created_at timestamptz not null default now()
);
create table private.store_request_limits (
  key_hash text not null, window_start timestamptz not null, requests integer not null,
  primary key(key_hash,window_start)
);
alter table public.orders add column checkout_version integer;
alter table public.orders add column subtotal numeric(12,2);
alter table public.orders add column tax_total numeric(12,2);
alter table public.orders add column shipping_cost numeric(12,2);
alter table public.orders add column payment_fee numeric(12,2);
alter table public.orders add column reservation_expires_at timestamptz;
alter table public.orders add column receipt_storage_path text;
alter table public.order_items add column product_snapshot jsonb;

alter table private.store_checkout_settings enable row level security;
alter table private.store_order_access enable row level security;
alter table private.store_reservations enable row level security;
alter table private.store_order_events enable row level security;
alter table private.store_receipts enable row level security;
alter table private.store_request_limits enable row level security;
revoke all on private.store_checkout_settings,private.store_order_access,private.store_reservations,
 private.store_order_events,private.store_receipts,private.store_request_limits from public,anon,authenticated;
grant usage on schema private to service_role;
grant all on private.store_checkout_settings,private.store_order_access,private.store_reservations,
 private.store_order_events,private.store_receipts,private.store_request_limits to service_role;
grant usage,select on sequence private.store_order_events_id_seq to service_role;

-- No browser can forge a paid order, its items, or a refund. Staff uses the same gateway.
revoke insert,update,delete,truncate,references,trigger on public.orders,public.order_items from anon,authenticated;
revoke truncate,references,trigger on public.products,public.product_variants from anon,authenticated;
do $migration$ declare p record; begin
 for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('orders','order_items') loop
  execute format('drop policy %I on public.%I',p.policyname,p.tablename);
 end loop;
end $migration$;
create policy store_orders_read on public.orders for select to authenticated
 using (user_id=(select auth.uid()) or (select private.current_user_has_admin_permission('orders','view')));
create policy store_order_items_read on public.order_items for select to authenticated
 using (exists(select 1 from public.orders o where o.id=order_id));
create index store_orders_expiration on public.orders(reservation_expires_at)
 where checkout_version=2 and status='pending_payment';
create policy store_digital_assets_staff on public.product_digital_assets for all to authenticated
 using ((select private.current_user_has_admin_permission('products','edit')))
 with check ((select private.current_user_has_admin_permission('products','edit')));

-- Restrictive guards intersect with pre-existing permissive policies.
create policy store_products_internal_read on public.products as restrictive for select to anon,authenticated
 using ((select private.current_user_has_admin_permission('products','view')));
create policy store_variants_internal_read on public.product_variants as restrictive for select to anon,authenticated
 using ((select private.current_user_has_admin_permission('products','view')));
do $migration$ declare t text; p record; begin
 foreach t in array array['products','product_variants'] loop
  for p in select policyname from pg_policies where schemaname='public' and tablename=t and cmd in ('INSERT','UPDATE','DELETE','ALL') loop
   execute format('drop policy %I on public.%I',p.policyname,t);
  end loop;
  execute format('create policy store_staff_insert on public.%I for insert to authenticated with check ((select private.current_user_has_admin_permission(''products'',''edit'')))',t);
  execute format('create policy store_staff_update on public.%I for update to authenticated using ((select private.current_user_has_admin_permission(''products'',''edit''))) with check ((select private.current_user_has_admin_permission(''products'',''edit'')))',t);
  execute format('create policy store_staff_delete on public.%I for delete to authenticated using ((select private.current_user_has_admin_permission(''products'',''edit'')))',t);
 end loop;
end $migration$;

-- Deliberately owner-executed public projection: only published catalog fields, no costs/assets.
create view public.store_catalog with (security_barrier=true) as
select p.id,p.name,p.description,p.price,p.discount_price,p.promo_tag,p.sku,p.tax_rate,p.sold_count,
 p.is_active,p.thumbnail_url,p.image_url,p.category,p.type,p.ecommerce_product_type,p.features,
 p.cover_image_url,p.deleted_at,p.created_at,
 jsonb_build_object('tags',p.metadata->'tags','media',p.metadata->'media','attributes',p.metadata->'attributes',
 'specifications',p.metadata->'specifications','price_tiers',p.metadata->'price_tiers') as metadata,
 greatest(0,p.stock-coalesce((select sum(r.quantity) from private.store_reservations r
 where r.product_id=p.id and r.variant_id is null and (r.state='held' or r.state='active' and r.expires_at>now())),0))::integer as stock,
 coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'product_id',v.product_id,'color_name',v.color_name,
 'color_hex',v.color_hex,'size',v.size,'cloudinary_image_url',v.cloudinary_image_url,'sku',v.sku,
 'stock',greatest(0,v.stock-coalesce((select sum(r.quantity) from private.store_reservations r where r.variant_id=v.id
 and (r.state='held' or r.state='active' and r.expires_at>now())),0)),
 'price_adjustment',v.price_adjustment) order by v.id) from public.product_variants v where v.product_id=p.id),'[]'::jsonb) as product_variants
from public.products p where p.is_active is true and p.deleted_at is null;
revoke all on public.store_catalog from public,anon,authenticated;
grant select on public.store_catalog to anon,authenticated;
create view public.store_checkout_options with (security_barrier=true) as
select s.enabled,coalesce((select (m->>'fee_percent')::numeric from jsonb_array_elements(c.payment_methods) m
 where m->>'id'='transfer' and m->>'active'='true' limit 1),0) as transfer_fee_percent
from private.store_checkout_settings s join public.church_settings c on c.id=1 where s.id;
revoke all on public.store_checkout_options from public,anon,authenticated;
grant select on public.store_checkout_options to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('store-receipts','store-receipts',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']);
-- Even an unrelated permissive storage policy cannot open this bucket. Gateway only.
create policy store_receipts_isolation on storage.objects as restrictive for all to anon,authenticated
 using (bucket_id<>'store-receipts') with check(bucket_id<>'store-receipts');

-- Invoker functions, service-role only. Actor IDs come exclusively from verified Edge auth.
create function private.store_access(p_order uuid,p_actor uuid,p_secret text,p_staff boolean default false)
returns boolean language sql stable set search_path='' as $$
 select exists(
  select 1 from public.orders o where o.id=p_order and (
   (p_actor is not null and o.user_id=p_actor)
   or (o.user_id is null and length(p_secret)=64 and exists(
    select 1 from private.store_order_access a where a.order_id=o.id and a.access_expires_at>now()
     and a.secret_hash=encode(sha256(convert_to(p_secret,'UTF8')),'hex')
   ))
  )
 )
 or (p_staff and p_actor is not null and private.profile_has_admin_permission(p_actor,'orders','view'))
$$;

create function private.store_expire() returns integer language plpgsql set search_path='' as $$
declare expired_count integer;
begin
 perform pg_advisory_xact_lock(72210621);
 with expired as (
  update public.orders o set status='cancelled'
  where o.checkout_version=2 and o.status='pending_payment' and o.reservation_expires_at<=now()
   and o.ecommerce_payment_status='pending' and o.receipt_storage_path is null
  returning o.id
 ), events as (
  insert into private.store_order_events(order_id,event) select id,'reservation_expired' from expired returning order_id
 ) update private.store_reservations r set state='released' where r.order_id in(select order_id from events) and r.state='active';
 get diagnostics expired_count=row_count;
 return expired_count;
end $$;

create function private.store_api(p_action text,p_actor uuid,p_secret text,p_payload jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare
 o public.orders; p public.products; v public.product_variants; a private.store_order_access;
 line jsonb; tier jsonb; lines jsonb:='[]'; snapshot jsonb; cfg public.church_settings;
 req uuid; oid uuid; vid uuid; pid uuid; qty integer; remaining integer; reserved integer;
 base numeric; unit numeric; subtotal numeric:=0; tax numeric:=0; fee numeric:=0; total numeric:=0;
 fingerprint text; secret_hash text; physical boolean:=false; digital boolean:=false;
 pos boolean; next_status text; ref text; amount numeric; result jsonb; receipt_path text;
 session public.pos_sessions;
begin
 if p_action in ('create','pos') then
  pos:=p_action='pos';
  if not (select enabled from private.store_checkout_settings where id) then raise exception 'La tienda está en preparación. Contacta con la iglesia antes de transferir.'; end if;
  if pos and (p_actor is null or not private.profile_has_admin_permission(p_actor,'products','edit')) then raise exception 'Sin permiso para caja'; end if;
  if p_actor is not null and not exists(select 1 from auth.users u where u.id=p_actor and u.email_confirmed_at is not null)
   then raise exception 'Confirma tu correo antes de comprar'; end if;
  if p_secret is null or p_secret !~ '^[0-9a-f]{64}$' then raise exception 'Identidad de operación inválida'; end if;
  req:=(p_payload->>'request_id')::uuid;
  if req is null or jsonb_typeof(p_payload->'items') is distinct from 'array' then raise exception 'Pedido inválido'; end if;
  if jsonb_array_length(p_payload->'items') not between 1 and 50 then raise exception 'Agrega entre 1 y 50 productos'; end if;
  if length(trim(coalesce(p_payload->>'name',''))) not between 2 and 160
   or length(coalesce(p_payload->>'email',''))>254
   or (not pos and coalesce(p_payload->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Revisa nombre y correo'; end if;
  fingerprint:=encode(sha256(convert_to(jsonb_build_object('actor',p_actor,'payload',p_payload,'pos',pos)::text,'UTF8')),'hex');
  secret_hash:=encode(sha256(convert_to(p_secret,'UTF8')),'hex');
  -- One lock order for checkout, expiry, receipt attachment and staff transitions.
  -- Serializes inventory operations for the current small catalog; never spans network I/O.
  perform pg_advisory_xact_lock(72210621);
  select * into a from private.store_order_access where request_id=req;
  if found then
   select * into o from public.orders where id=a.order_id;
   if a.secret_hash<>secret_hash or a.fingerprint<>fingerprint or o.user_id is distinct from p_actor then raise exception 'La operación ya existe con otros datos'; end if;
   return private.store_api('status',p_actor,p_secret,jsonb_build_object('order_id',o.id));
  end if;
  perform private.store_expire();
  if not pos and (select count(*) from public.orders where lower(customer_email)=lower(p_payload->>'email') and checkout_version=2 and status='pending_payment')>=3 then raise exception 'Ya tienes pedidos pendientes. Revisa su estado antes de crear otro.'; end if;
  if exists(select 1 from jsonb_array_elements(p_payload->'items') x group by x->>'product_id',coalesce(x->>'variant_id','') having count(*)>1) then raise exception 'Agrupa cada variante en una sola línea'; end if;
  for line in select value from jsonb_array_elements(p_payload->'items') order by value->>'product_id',value->>'variant_id' loop
   pid:=(line->>'product_id')::uuid; vid:=nullif(line->>'variant_id','')::uuid; qty:=(line->>'quantity')::integer;
   if qty is null or qty not between 1 and 1000 or (line->>'quantity')::numeric<>qty then raise exception 'Cantidad inválida'; end if;
   select * into p from public.products where id=pid and is_active is true and deleted_at is null for update;
   if not found then raise exception 'Producto no disponible'; end if;
   digital:=p.type::text='digital'; physical:=physical or not digital;
   if digital and (p_actor is null or qty<>1 or pos) then raise exception 'Los digitales requieren cuenta verificada y una licencia por producto desde la web'; end if;
   if digital and not exists(select 1 from public.product_digital_assets where product_id=pid and length(trim(drive_link))>0) then raise exception 'Recurso digital todavía no disponible'; end if;
   v:=null;
   if vid is not null then
    select * into v from public.product_variants where id=vid and product_id=pid for update;
    if not found then raise exception 'Variante inválida'; end if;
   elsif exists(select 1 from public.product_variants where product_id=pid) and not digital then raise exception 'Selecciona una variante';
   end if;
   if not digital then
    select coalesce(sum(quantity),0)::integer into reserved from private.store_reservations where product_id=pid and variant_id is not distinct from vid
     and (state='held' or state='active' and expires_at>now());
    remaining:=coalesce(v.stock,p.stock)-reserved;
    if remaining<qty then raise exception 'Stock insuficiente para %',p.name; end if;
   end if;
   base:=case when p.discount_price>=0 and p.discount_price<p.price then p.discount_price else p.price end;
   if base is null or base<0 or base<>round(base,2) or coalesce(v.price_adjustment,0)<>round(coalesce(v.price_adjustment,0),2)
    or coalesce(p.tax_rate,0)<>round(coalesce(p.tax_rate,0),2) or coalesce(p.tax_rate,0) not between 0 and 100 then raise exception 'Precio o impuesto sin configurar (máximo dos decimales)'; end if;
   unit:=base;
   for tier in select value from jsonb_array_elements(coalesce(p.metadata->'price_tiers','[]')) loop
    if (tier->>'min_quantity')::numeric>=2 and (tier->>'min_quantity')::numeric=trunc((tier->>'min_quantity')::numeric)
     and (tier->>'min_quantity')::numeric<=qty and (tier->>'unit_price')::numeric>=0
     and (tier->>'unit_price')::numeric=round((tier->>'unit_price')::numeric,2) then unit:=least(unit,(tier->>'unit_price')::numeric); end if;
   end loop;
   unit:=round(unit+coalesce(v.price_adjustment,0),2);
   if unit<0 then raise exception 'Precio inválido'; end if;
   subtotal:=subtotal+round(unit*qty,2); tax:=tax+round(unit*qty*coalesce(p.tax_rate,0)/100,2);
   snapshot:=jsonb_build_object('id',p.id,'name',p.name,'sku',coalesce(v.sku,p.sku),'type',p.type,'image_url',p.image_url,
    'cover_image_url',p.cover_image_url,'tax_rate',p.tax_rate,'color_name',v.color_name,'size',v.size);
   lines:=lines||jsonb_build_array(jsonb_build_object('product_id',pid,'variant_id',vid,'quantity',qty,'price',unit,'snapshot',snapshot,'physical',not digital));
  end loop;
  select * into cfg from public.church_settings where id=1;
  if not pos then
   if physical and length(regexp_replace(coalesce(p_payload->>'phone',''),'\D','','g'))<9 then raise exception 'Indica un teléfono para coordinar el retiro'; end if;
   if coalesce(p_payload->>'delivery','') not in ('','pickup') then raise exception 'El envío todavía no está habilitado'; end if;
   if not exists(select 1 from jsonb_array_elements(cfg.payment_methods) x where x->>'id'='transfer' and x->>'active'='true')
    or nullif(trim(cfg.bank_name),'') is null or nullif(trim(cfg.bank_account),'') is null then raise exception 'Transferencia todavía no disponible'; end if;
   if physical and not exists(select 1 from jsonb_array_elements(cfg.shipping_methods) x where x->>'id'='pickup' and x->>'active'='true' and (x->>'base_cost')::numeric=0) then raise exception 'Retiro todavía no disponible'; end if;
   select round(subtotal*coalesce((x->>'fee_percent')::numeric,0)/100,2) into fee from jsonb_array_elements(cfg.payment_methods) x where x->>'id'='transfer' limit 1;
   if fee is null or fee<0 or fee>subtotal then raise exception 'Recargo sin configurar'; end if;
  else
   select * into session from public.pos_sessions where id=(p_payload->>'session_id')::uuid and status='open' for update;
   if not found or (session.cashier_id is not null and session.cashier_id<>p_actor) then raise exception 'Abre tu caja antes de vender'; end if;
   if p_payload->>'payment_method' not in ('cash','card','transfer') then raise exception 'Medio de caja inválido'; end if;
  end if;
  total:=round(subtotal+tax+fee,2);
  if total<=0 then raise exception 'Los recursos gratuitos no requieren transferencia'; end if;
  if p_payload->>'expected_total' is null or (p_payload->>'expected_total')::numeric<>total then raise exception 'El precio cambió. Revisa el total antes de continuar.'; end if;
  if pos and (p_payload->>'amount_paid' is null or (p_payload->>'amount_paid')::numeric<total) then raise exception 'Importe recibido insuficiente'; end if;
  insert into public.orders(user_id,customer_name,customer_email,total,subtotal,tax_total,shipping_cost,payment_fee,
   checkout_version,reservation_expires_at,status,channel,payment_method,ecommerce_payment_method,ecommerce_payment_status,
   ecommerce_fulfillment_status,shipping_recipient_name,shipping_phone,shipping_status_notes,pos_session_id,receipt_number,cashier_name)
  values(p_actor,trim(p_payload->>'name'),lower(trim(p_payload->>'email')),total,subtotal,tax,0,fee,2,now()+interval '24 hours',
   case when pos then 'completed'::public.order_status else 'pending_payment'::public.order_status end,
   case when pos then 'pos' else 'online' end,case when pos then p_payload->>'payment_method' else 'transfer' end,
   (case when pos then p_payload->>'payment_method' else 'transfer' end)::public.ecommerce_payment_method,
   case when pos then 'paid'::public.ecommerce_payment_status else 'pending'::public.ecommerce_payment_status end,
   case when pos then 'delivered'::public.ecommerce_fulfillment_status else 'unfulfilled'::public.ecommerce_fulfillment_status end,
   trim(p_payload->>'name'),p_payload->>'phone',case when physical then 'Retiro coordinado en Iglesia Jerusalén' else 'Entrega digital' end,
   case when pos then session.id end,case when pos then 'REC-'||upper(substr(req::text,1,8)) end,case when pos then session.cashier_name end)
  returning id into oid;
  insert into private.store_order_access(order_id,request_id,secret_hash,fingerprint) values(oid,req,secret_hash,fingerprint);
  for line in select value from jsonb_array_elements(lines) loop
   insert into public.order_items(order_id,product_id,variant_id,quantity,price,product_snapshot)
    values(oid,(line->>'product_id')::uuid,(line->>'variant_id')::uuid,(line->>'quantity')::integer,(line->>'price')::numeric,line->'snapshot');
   if (line->>'physical')::boolean then
    if pos then
     if line->>'variant_id' is null then update public.products set stock=stock-(line->>'quantity')::integer where id=(line->>'product_id')::uuid;
     else update public.product_variants set stock=stock-(line->>'quantity')::integer where id=(line->>'variant_id')::uuid; end if;
    else
     insert into private.store_reservations(order_id,product_id,variant_id,quantity,state,expires_at)
      values(oid,(line->>'product_id')::uuid,(line->>'variant_id')::uuid,(line->>'quantity')::integer,'active',now()+interval '24 hours');
    end if;
   end if;
  end loop;
  if pos then
   update public.pos_sessions set orders_count=coalesce(orders_count,0)+1,
    total_cash_sales=coalesce(total_cash_sales,0)+case when p_payload->>'payment_method'='cash' then total else 0 end,
    total_card_sales=coalesce(total_card_sales,0)+case when p_payload->>'payment_method'='card' then total else 0 end,
    total_transfer_sales=coalesce(total_transfer_sales,0)+case when p_payload->>'payment_method'='transfer' then total else 0 end where id=session.id;
  end if;
  insert into private.store_order_events(order_id,actor_id,event,details) values(oid,p_actor,case when pos then 'pos_sale' else 'reserved' end,jsonb_build_object('items',lines,'total',total));
  return private.store_api('status',p_actor,p_secret,jsonb_build_object('order_id',oid));
 end if;

 if p_action='expire' then return jsonb_build_object('expired',private.store_expire()); end if;
 if p_action='list_orders' then
  if p_actor is null then raise exception 'Inicia sesión'; end if;
  select coalesce(jsonb_agg(private.store_api('status',p_actor,'',jsonb_build_object('order_id',x.id)) order by x.created_at desc),'[]') into result
   from public.orders x where x.user_id=p_actor;
  return result;
 end if;
 oid:=(p_payload->>'order_id')::uuid;
 if not private.store_access(oid,p_actor,p_secret,true) then raise exception 'Pedido no disponible'; end if;
 if p_action in ('attach_receipt','admin_update','authorize_receipt') then
  perform pg_advisory_xact_lock(72210621);
  select * into o from public.orders where id=oid for update;
 else
  -- Read-only status/list requests must not lock orders in an inconsistent order.
  select * into o from public.orders where id=oid;
 end if;
 if not found then raise exception 'Pedido no disponible'; end if;
 if p_action='status' then
  select coalesce(jsonb_agg(to_jsonb(i)||jsonb_build_object('products',coalesce(i.product_snapshot,
   (select jsonb_build_object('id',catalog_product.id,'name',catalog_product.name,'type',catalog_product.type,'image_url',catalog_product.image_url,'cover_image_url',catalog_product.cover_image_url) from public.products catalog_product where catalog_product.id=i.product_id)),
   'product_variants',case when i.product_snapshot is not null then jsonb_build_object('id',i.variant_id,'color_name',i.product_snapshot->'color_name','size',i.product_snapshot->'size') else null end)),'[]') into lines
   from public.order_items i where i.order_id=oid;
  result:=to_jsonb(o)||jsonb_build_object('order_items',lines);
  if o.status='pending_payment' and o.reservation_expires_at>now() then
   select result||jsonb_build_object('bank',jsonb_build_object('bank_name',bank_name,'bank_account',bank_account,'ruc',ruc)) into result from public.church_settings where id=1;
  end if;
  return result;
 elsif p_action in ('authorize_receipt','attach_receipt') then
  -- Staff read permission must NEVER grant upload/submit ownership.
  if not private.store_access(oid,p_actor,p_secret,false) then raise exception 'Sin permiso para adjuntar'; end if;
  if o.checkout_version is distinct from 2 or o.status<>'pending_payment'
   or o.ecommerce_payment_status not in ('pending','verifying','failed')
   or (o.ecommerce_payment_status='pending' and o.reservation_expires_at<=now()) then raise exception 'Reserva vencida o pedido cerrado. Contacta con la iglesia antes de transferir.'; end if;
  if p_action='authorize_receipt' then return jsonb_build_object('order_id',oid); end if;
  receipt_path:=p_payload->>'path';
  if split_part(receipt_path,'/',1)<>oid::text or not exists(select 1 from storage.objects where bucket_id='store-receipts' and name=receipt_path) then raise exception 'Comprobante privado no encontrado'; end if;
  insert into private.store_receipts(order_id,storage_path) values(oid,receipt_path);
  update public.orders set receipt_storage_path=receipt_path,ecommerce_payment_status='verifying',payment_voucher_url=null,payment_receipt_url=null where id=oid;
  update private.store_reservations set state='held' where order_id=oid and state='active';
  insert into private.store_order_events(order_id,actor_id,event) values(oid,p_actor,'receipt_submitted');
  return private.store_api('status',p_actor,p_secret,jsonb_build_object('order_id',oid));
 elsif p_action='receipt_read' then
  if o.receipt_storage_path is null then raise exception 'No hay comprobante privado'; end if;
  return jsonb_build_object('path',o.receipt_storage_path);
 elsif p_action='admin_update' then
  if p_actor is null or not private.profile_has_admin_permission(p_actor,'orders','edit') then raise exception 'Sin permiso para gestionar pedidos'; end if;
  next_status:=p_payload->>'status'; ref:=trim(coalesce(p_payload->>'reference',''));
  if next_status='paid' then
   if o.status<>'pending_payment' or o.ecommerce_payment_status<>'verifying' or o.receipt_storage_path is null or length(ref)<3 then raise exception 'Revisa el comprobante y registra la referencia bancaria confirmada'; end if;
   for line in select to_jsonb(r) from private.store_reservations r where r.order_id=oid and r.state='held' loop
    if line->>'variant_id' is null then
     update public.products set stock=stock-(line->>'quantity')::integer where id=(line->>'product_id')::uuid and stock>=(line->>'quantity')::integer;
    else update public.product_variants set stock=stock-(line->>'quantity')::integer where id=(line->>'variant_id')::uuid and stock>=(line->>'quantity')::integer; end if;
    if not found then raise exception 'Inventario cambiado. Concilia existencias antes de aprobar.'; end if;
   end loop;
   update private.store_reservations set state='consumed' where order_id=oid and state='held';
   update public.orders set status='paid',ecommerce_payment_status='paid' where id=oid;
  elsif next_status='cancelled' then
   if o.status<>'pending_payment' or o.ecommerce_payment_status<>'pending' then raise exception 'Un pago enviado o recibido requiere conciliación antes de cancelar'; end if;
   update private.store_reservations set state='released' where order_id=oid and state='active';
   update public.orders set status='cancelled' where id=oid;
  elsif next_status='ready_for_pickup' then
   if o.status<>'paid' or o.ecommerce_payment_status<>'paid' then raise exception 'Confirma el pago antes de preparar la entrega'; end if;
   update public.orders set status='ready_for_pickup',ecommerce_fulfillment_status='processing' where id=oid;
  elsif next_status='completed' then
   if o.status not in ('paid','ready_for_pickup') or o.ecommerce_payment_status<>'paid' then raise exception 'El pedido no está listo para entregar'; end if;
   update public.orders set status='completed',ecommerce_fulfillment_status='delivered' where id=oid;
  elsif p_payload->>'operation'='shipping' then
   update public.orders set shipping_recipient_name=p_payload->>'recipient_name',shipping_phone=p_payload->>'phone',
    shipping_override_address=p_payload->>'override_address',shipping_status_notes=p_payload->>'status_notes' where id=oid;
  elsif p_payload->>'operation'='refund' then
   if not private.profile_has_admin_permission(p_actor,'finances','edit') then raise exception 'Sin permiso financiero para registrar reembolsos'; end if;
   req:=(p_payload->>'operation_id')::uuid;
   if req is null then raise exception 'Falta la referencia de operación del reembolso'; end if;
   select details into snapshot from private.store_order_events where order_id=oid and request_id=req;
   if found then
    if snapshot<>p_payload then raise exception 'La operación de reembolso ya existe con otros datos'; end if;
    return private.store_api('status',p_actor,p_secret,jsonb_build_object('order_id',oid));
   end if;
   amount:=(p_payload->>'amount')::numeric;
   if o.ecommerce_payment_status<>'paid' or amount is null or amount<=0 or amount>o.total-coalesce(o.refunded_amount,0) or length(trim(coalesce(p_payload->>'reason','')))<3 then raise exception 'Importe o motivo de reembolso inválido'; end if;
   update public.orders set refunded_amount=coalesce(refunded_amount,0)+amount,refund_reason=p_payload->>'reason',
    refund_status=case when coalesce(refunded_amount,0)+amount=o.total then 'full' else 'partial' end where id=oid;
  else raise exception 'Transición no permitida'; end if;
  insert into private.store_order_events(order_id,actor_id,request_id,event,details) values(oid,p_actor,req,'admin_update',p_payload);
  return private.store_api('status',p_actor,p_secret,jsonb_build_object('order_id',oid));
 end if;
 raise exception 'Operación no disponible';
end $$;

create function public.store_api(p_action text,p_actor uuid,p_secret text,p_payload jsonb)
returns jsonb language sql set search_path='' as $$ select private.store_api(p_action,p_actor,p_secret,p_payload) $$;
create function public.store_request_limit(p_key text) returns void language plpgsql set search_path='' as $$
declare n integer;
begin
 delete from private.store_request_limits where window_start<date_trunc('minute',now())-interval '1 hour';
 insert into private.store_request_limits(key_hash,window_start,requests) values(encode(sha256(convert_to(p_key,'UTF8')),'hex'),date_trunc('minute',now()),1)
 on conflict(key_hash,window_start) do update set requests=private.store_request_limits.requests+1 returning requests into n;
 if n>30 then raise exception 'Demasiadas solicitudes. Espera un minuto.'; end if;
end $$;
revoke all on function public.store_api(text,uuid,text,jsonb),public.store_request_limit(text),
 private.store_api(text,uuid,text,jsonb),private.store_access(uuid,uuid,text,boolean),private.store_expire() from public,anon,authenticated;
grant execute on function public.store_api(text,uuid,text,jsonb),public.store_request_limit(text),
 private.store_api(text,uuid,text,jsonb),private.store_access(uuid,uuid,text,boolean),private.store_expire() to service_role;
grant execute on function private.profile_has_admin_permission(uuid,text,text) to service_role;

-- pg_cron is installed in production. Remains local until this migration is applied.
select cron.schedule('store-expire-reservations','*/5 * * * *','select private.store_expire()');
commit;
