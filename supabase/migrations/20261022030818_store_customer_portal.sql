-- Phase 4: no email is sent, no payment is verified and sales remain disabled.
begin;
create table private.store_digital_deliveries (
 item_id uuid primary key references public.order_items(id), order_id uuid not null references public.orders(id),
 product_id uuid not null references public.products(id), source_url text, instructions text,
 granted_at timestamptz not null default now()
);
create index store_digital_delivery_order on private.store_digital_deliveries(order_id);
create table private.store_customer_events (
 id bigint generated always as identity primary key,order_id uuid not null references public.orders(id),
 actor_id uuid not null, item_id uuid, event text not null, created_at timestamptz not null default now()
);
create index store_customer_events_order on private.store_customer_events(order_id,created_at desc);
alter table private.store_digital_deliveries enable row level security;
alter table private.store_customer_events enable row level security;
revoke all on private.store_digital_deliveries,private.store_customer_events from public,anon,authenticated;
grant all on private.store_digital_deliveries,private.store_customer_events to service_role;
revoke all on sequence private.store_customer_events_id_seq from public,anon,authenticated;
grant usage,select on sequence private.store_customer_events_id_seq to service_role;
-- Paid buyers now request an entitlement instead of reading every master asset directly.
create policy store_digital_master_guard on public.product_digital_assets as restrictive for select to authenticated
 using ((select private.current_user_has_admin_permission('products','edit')));
revoke all on public.product_digital_assets from anon;
create policy store_digital_master_anon_guard on public.product_digital_assets as restrictive for select to anon using(false);

create function private.store_grant_digital(p_order uuid) returns void language sql set search_path='' as $$
 insert into private.store_digital_deliveries(item_id,order_id,product_id,source_url,instructions)
 select i.id,o.id,i.product_id,a.drive_link,a.instructions from public.orders o join public.order_items i on i.order_id=o.id
 left join public.products p on p.id=i.product_id left join public.product_digital_assets a on a.product_id=i.product_id
 where o.id=p_order and o.user_id is not null and o.ecommerce_payment_status='paid'
 and o.status in ('paid','ready_for_pickup','completed')
 and coalesce(i.product_snapshot->>'type',p.type::text)='digital'
 on conflict(item_id) do nothing
$$;
create function private.store_grant_digital_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin perform private.store_grant_digital(new.id); return new; end $$;
create trigger store_grant_digital after update of ecommerce_payment_status on public.orders for each row
 when(new.ecommerce_payment_status='paid') execute function private.store_grant_digital_trigger();
-- Existing paid lines keep their current source as a dated migration snapshot, not a historical assertion.
do $$ declare oid uuid; begin
 for oid in select id from public.orders where user_id is not null and ecommerce_payment_status='paid' loop
  perform private.store_grant_digital(oid);
 end loop;
end $$;

create function public.store_customer_api(p_action text,p_actor uuid,p_secret text,p_payload jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare oid uuid; u auth.users; v_order public.orders; v_delivery private.store_digital_deliveries; result jsonb;
begin
 if p_actor is null then raise exception 'Inicia sesión con una cuenta verificada'; end if;
 select * into u from auth.users where id=p_actor and email_confirmed_at is not null and nullif(trim(email),'') is not null;
 if not found then raise exception 'Inicia sesión con una cuenta verificada'; end if;
 if p_action='customer_claim' then
  oid:=(p_payload->>'order_id')::uuid;
  perform pg_advisory_xact_lock(72210621);
  select * into v_order from public.orders where id=oid for update;
  if not found then raise exception 'No se pudo vincular el pedido. Revisa la clave y el correo de tu cuenta'; end if;
  if v_order.user_id=p_actor then return private.store_api('status',p_actor,'',jsonb_build_object('order_id',oid)); end if;
  if v_order.user_id is not null or v_order.checkout_version is distinct from 2 or lower(trim(v_order.customer_email)) is distinct from lower(trim(u.email))
   or not private.store_access(oid,null,p_secret,false) then
   raise exception 'No se pudo vincular el pedido. Revisa la clave y el correo de tu cuenta';
  end if;
  update public.orders set user_id=p_actor where id=oid;
  update private.store_order_access set access_expires_at=now() where order_id=oid;
  perform private.store_grant_digital(oid);
  insert into private.store_customer_events(order_id,actor_id,event) values(oid,p_actor,'claim');
  return private.store_api('status',p_actor,'',jsonb_build_object('order_id',oid));
 elsif p_action='customer_library' then
  select coalesce(jsonb_agg(jsonb_build_object('item_id',i.id,'order_id',o.id,'product_id',i.product_id,
   'name',coalesce(i.product_snapshot->>'name',p.name,'Recurso digital'),'purchased_at',o.created_at,
   'state',case when coalesce(o.refunded_amount,0)>0 then 'reconciliation'
    when o.status='cancelled' then 'cancelled' when o.ecommerce_payment_status='paid' and o.status in ('paid','ready_for_pickup','completed')
     then case when d.source_url ~ '^https://(drive|docs)\.google\.com/' then 'available' else 'preparing' end else 'pending_payment' end)
    order by o.created_at desc),'[]') into result
   from public.orders o join public.order_items i on i.order_id=o.id left join public.products p on p.id=i.product_id
   left join private.store_digital_deliveries d on d.item_id=i.id
   where o.user_id=p_actor and coalesce(i.product_snapshot->>'type',p.type::text)='digital';
  return result;
 elsif p_action='customer_digital_open' then
  select * into v_delivery from private.store_digital_deliveries where item_id=(p_payload->>'item_id')::uuid;
  if not found then raise exception 'Recurso no disponible. Revisa el pago o contacta con la iglesia'; end if;
  select * into v_order from public.orders where id=v_delivery.order_id;
  if v_order.user_id is distinct from p_actor or v_order.ecommerce_payment_status<>'paid' or v_order.status not in ('paid','ready_for_pickup','completed')
   or coalesce(v_order.refunded_amount,0)>0 then raise exception 'Recurso no disponible. Revisa el pago o contacta con la iglesia'; end if;
  if v_delivery.source_url is null or v_delivery.source_url !~ '^https://(drive|docs)\.google\.com/' then
   raise exception 'La entrega digital necesita preparación. Contacta con la iglesia'; end if;
  insert into private.store_customer_events(order_id,actor_id,item_id,event) values(v_delivery.order_id,p_actor,v_delivery.item_id,'digital_open');
  return jsonb_build_object('url',v_delivery.source_url,'instructions',v_delivery.instructions,'kind','external_google');
 end if;
 raise exception 'Operación de cliente inválida';
end $$;
revoke all on function public.store_customer_api(text,uuid,text,jsonb),private.store_grant_digital(uuid),private.store_grant_digital_trigger() from public,anon,authenticated;
grant execute on function public.store_customer_api(text,uuid,text,jsonb),private.store_grant_digital(uuid) to service_role;
commit;
