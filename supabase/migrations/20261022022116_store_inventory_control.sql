-- Phase 3: preserves existing quantities; none are certified as a physical count.
begin;
alter table public.inventory_movements add column variant_id uuid references public.product_variants(id);
alter table public.inventory_movements add column actor_id uuid;
alter table public.inventory_movements add column operation_id uuid;
alter table public.inventory_movements add column sequence_no bigint generated always as identity;
create index store_movements_variant_seq on public.inventory_movements(product_id,sequence_no desc);
revoke all on public.inventory_movements from public,anon,authenticated;
grant all on public.inventory_movements to service_role;
revoke all on sequence public.inventory_movements_sequence_no_seq from public,anon,authenticated;
grant usage,select on sequence public.inventory_movements_sequence_no_seq to service_role;
create policy store_movements_read_guard on public.inventory_movements as restrictive for select to authenticated
 using ((select private.current_user_has_admin_permission('products','view')));
grant select on public.inventory_movements to authenticated;

create table private.store_inventory_profiles (
 product_id uuid primary key references public.products(id), location text not null default '',
 minimum integer not null default 5 check(minimum between 0 and 1000000), notes text not null default '',
 custom_fields jsonb not null default '{}' check(jsonb_typeof(custom_fields)='object'),
 last_count_at timestamptz, last_count_by uuid, updated_by uuid, updated_at timestamptz not null default now()
);
create table private.store_inventory_counts (
 id uuid primary key, product_id uuid not null references public.products(id),
 state text not null default 'draft' check(state in ('draft','committed','cancelled')),
 snapshot jsonb not null, observed jsonb not null default '{}', reason text not null,
 created_by uuid not null, created_at timestamptz not null default now(),
 committed_by uuid, committed_at timestamptz
);
create unique index store_inventory_one_draft on private.store_inventory_counts(product_id) where state='draft';
create table private.store_inventory_operations (
 id uuid primary key, actor_id uuid not null, fingerprint text not null, product_id uuid not null,
 action text not null, details jsonb not null, created_at timestamptz not null default now()
);
alter table private.store_inventory_profiles enable row level security;
alter table private.store_inventory_counts enable row level security;
alter table private.store_inventory_operations enable row level security;
revoke all on private.store_inventory_profiles,private.store_inventory_counts,private.store_inventory_operations from public,anon,authenticated;
grant all on private.store_inventory_profiles,private.store_inventory_counts,private.store_inventory_operations to service_role;

create function private.store_inventory_actor_name(p_actor uuid) returns text language sql stable set search_path='' as $$
 select nullif(trim(concat_ws(' ',p.first_name,p.last_name)),'') from public.profiles p where p.id=p_actor
$$;

-- The existing authoritative stock columns stay in place. Browser metadata edits cannot change them.
create function private.store_stock_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare changed boolean; pid uuid;
begin
 if tg_table_name='products' then pid:=coalesce(new.id,old.id); else pid:=coalesce(new.product_id,old.product_id); end if;
 if tg_op='DELETE' then
  if coalesce(old.stock,0)<>0 or exists(select 1 from public.inventory_movements where product_id=pid)
   or exists(select 1 from private.store_inventory_counts where product_id=pid)
   or exists(select 1 from private.store_reservations where product_id=pid) then
   raise exception 'Conserva el historial: archiva el producto; las variantes con existencias o historial no se eliminan';
  end if;
  return old;
 end if;
 changed:=case when tg_op='INSERT' then coalesce(new.stock,0)<>0 else new.stock is distinct from old.stock end;
 if changed and coalesce(current_setting('role',true),'none') not in ('service_role','postgres','none') then
  raise exception 'Gestiona existencias desde Inventario mediante un conteo o movimiento';
 end if;
 if new.stock is null or new.stock<0 then raise exception 'Existencias inválidas'; end if;
 if tg_table_name='products' and tg_op='UPDATE' then
  if new.type is distinct from old.type and (old.stock<>0 or exists(select 1 from public.product_variants where product_id=pid)
   or exists(select 1 from public.inventory_movements where product_id=pid) or exists(select 1 from private.store_inventory_counts where product_id=pid)) then
   raise exception 'Un producto con existencias o historial conserva su tipo; crea una ficha diferente';
  end if;
 elsif tg_table_name='product_variants' then
  if tg_op='INSERT' and exists(select 1 from public.products where id=pid and type::text='digital') then raise exception 'Los digitales no usan variantes de inventario físico'; end if;
  if tg_op='UPDATE' and new.product_id<>old.product_id then raise exception 'Una variante no se mueve a otro producto'; end if;
  if tg_op='INSERT' and exists(select 1 from public.products where id=pid and (type::text='digital' or stock>0))
   and not exists(select 1 from public.product_variants where product_id=pid) then
   raise exception 'Para añadir variantes, el producto físico debe iniciar sin stock base';
  end if;
 end if;
 return new;
end $$;
create trigger store_stock_guard before insert or update or delete on public.products for each row execute function private.store_stock_guard();
create trigger store_variant_stock_guard before insert or update or delete on public.product_variants for each row execute function private.store_stock_guard();

create function private.store_stock_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare pid uuid; vid uuid; old_qty integer; new_qty integer; source text;
begin
 if tg_table_name='products' then
  pid:=new.id;
  if new.type::text='digital' or exists(select 1 from public.product_variants where product_id=pid) then return new; end if;
 else pid:=coalesce(new.product_id,old.product_id); end if;
 if tg_table_name='product_variants' then vid:=coalesce(new.id,old.id); end if;
 old_qty:=case when tg_op='INSERT' then 0 else old.stock end;
 new_qty:=case when tg_op='DELETE' then 0 else new.stock end;
 source:=coalesce(nullif(current_setting('store.inventory_source',true),''),'adjustment');
 if old_qty<>new_qty then
  insert into public.inventory_movements(product_id,variant_id,movement_type,quantity,previous_stock,new_stock,actor_id,operation_id,reference_order_id,reason,created_by_name)
   values(pid,vid,source,new_qty-old_qty,old_qty,new_qty,
    nullif(current_setting('store.inventory_actor',true),'')::uuid,nullif(current_setting('store.inventory_operation',true),'')::uuid,
    nullif(current_setting('store.inventory_order',true),'')::uuid,coalesce(nullif(current_setting('store.inventory_reason',true),''),'Actualización de servidor'),
    private.store_inventory_actor_name(nullif(current_setting('store.inventory_actor',true),'')::uuid));
 end if;
 if tg_table_name='product_variants' then
  update public.products set stock=coalesce((select sum(stock) from public.product_variants where product_id=pid),0) where id=pid;
  if tg_op in ('INSERT','DELETE') then
   update private.store_inventory_profiles set last_count_at=null,last_count_by=null where product_id=pid;
  end if;
 end if;
 return coalesce(new,old);
end $$;
create trigger store_stock_audit after insert or update of stock on public.products for each row execute function private.store_stock_audit();
create trigger store_variant_stock_audit after insert or update of stock or delete on public.product_variants for each row execute function private.store_stock_audit();

create function private.store_stock_points(p_product uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('key',x.key,'variant_id',x.variant_id,'label',x.label,'stock',x.stock,'revision',
  coalesce((select max(m.sequence_no) from public.inventory_movements m where m.product_id=p_product and m.variant_id is not distinct from x.variant_id),0)) order by x.key),'[]')
 from (select v.id::text key,v.id variant_id,concat_ws(' · ',nullif(v.color_name,''),nullif(v.size,'')) label,v.stock from public.product_variants v where v.product_id=p_product
 union all select 'base',null::uuid,'Existencias generales',p.stock from public.products p where p.id=p_product and not exists(select 1 from public.product_variants v where v.product_id=p_product))x
$$;
create function private.store_inventory_detail(p_product uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('product_id',p.id,'profile',coalesce((select to_jsonb(f)||jsonb_build_object('last_count_name',private.store_inventory_actor_name(f.last_count_by)) from private.store_inventory_profiles f where f.product_id=p.id),'{}'),
 'points',case when p.type::text='digital' then '[]'::jsonb else private.store_stock_points(p.id) end,
 'reserved',coalesce((select sum(quantity) from private.store_reservations r where r.product_id=p.id and (r.state='held' or r.state='active' and r.expires_at>now())),0),
 'reservations',coalesce((select jsonb_agg(jsonb_build_object('variant_id',variant_id,'quantity',quantity,'state',state,'expires_at',expires_at)) from private.store_reservations r where r.product_id=p.id and (r.state='held' or r.state='active' and r.expires_at>now())),'[]'),
 'counts',coalesce((select jsonb_agg(c order by c.created_at desc) from (select counts.*,private.store_inventory_actor_name(created_by) as created_by_name,private.store_inventory_actor_name(committed_by) as committed_by_name from private.store_inventory_counts counts where product_id=p.id order by created_at desc limit 20)c),'[]'),
 'movements',coalesce((select jsonb_agg(m order by m.sequence_no desc) from (select * from public.inventory_movements where product_id=p.id order by sequence_no desc limit 100)m),'[]'))
 from public.products p where p.id=p_product
$$;

create function public.store_inventory_api(p_action text,p_actor uuid,p_payload jsonb) returns jsonb language plpgsql set search_path='' as $$
declare pid uuid:=(p_payload->>'product_id')::uuid; op uuid; fp text; prior private.store_inventory_operations;
 c private.store_inventory_counts; points jsonb; line jsonb; qty integer; old_qty integer; reserved integer; vid uuid; v_reason text;
begin
 if p_actor is null or not coalesce(private.profile_has_admin_permission(p_actor,'products','view'),false) then raise exception 'Sin permiso para consultar inventario'; end if;
 if not exists(select 1 from public.products where id=pid and deleted_at is null) then raise exception 'Producto no disponible'; end if;
 if p_action='inventory_read' then return private.store_inventory_detail(pid); end if;
 if not coalesce(private.profile_has_admin_permission(p_actor,'products','edit'),false) then raise exception 'Sin permiso para modificar inventario'; end if;
 if p_action not in ('inventory_profile','inventory_move','inventory_count_start','inventory_count_save','inventory_count_commit','inventory_count_cancel') then raise exception 'Operación de inventario inválida'; end if;
 op:=(p_payload->>'operation_id')::uuid;
 if op is null then raise exception 'Falta identidad de operación'; end if;
 fp:=encode(sha256(convert_to(jsonb_build_object('action',p_action,'payload',p_payload)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(72210621);
 select * into prior from private.store_inventory_operations where id=op;
 if found then
  if prior.actor_id<>p_actor or prior.fingerprint<>fp then raise exception 'La operación ya existe con otros datos'; end if;
  return private.store_inventory_detail(pid);
 end if;
 perform 1 from public.products where id=pid for update;
 perform 1 from public.product_variants where product_id=pid order by id for update;
 perform set_config('store.inventory_actor',p_actor::text,true);
 perform set_config('store.inventory_operation',op::text,true);
 perform set_config('store.inventory_order','',true);
 v_reason:=trim(coalesce(p_payload->>'reason',''));
 if p_action='inventory_profile' then
  if jsonb_typeof(p_payload->'minimum') is distinct from 'number' then raise exception 'Mínimo inválido'; end if;
  if length(coalesce(p_payload->>'location',''))>240 or length(coalesce(p_payload->>'notes',''))>4000
   or jsonb_typeof(p_payload->'custom_fields') is distinct from 'object' or octet_length((p_payload->'custom_fields')::text)>8000
   or (p_payload->>'minimum')::numeric not between 0 and 1000000 or (p_payload->>'minimum')::numeric<>trunc((p_payload->>'minimum')::numeric) then raise exception 'Revisa ubicación, mínimo y campos de la ficha'; end if;
  insert into private.store_inventory_profiles(product_id,location,minimum,notes,custom_fields,updated_by) values(pid,p_payload->>'location',(p_payload->>'minimum')::integer,p_payload->>'notes',p_payload->'custom_fields',p_actor)
   on conflict(product_id) do update set location=excluded.location,minimum=excluded.minimum,notes=excluded.notes,custom_fields=excluded.custom_fields,updated_by=p_actor,updated_at=now();
 else
  if exists(select 1 from public.products where id=pid and type::text='digital') then raise exception 'Los digitales no usan existencias físicas'; end if;
  if length(v_reason) not between 3 and 1000 then raise exception 'Escribe el motivo o referencia (3 a 1000 caracteres)'; end if;
  points:=private.store_stock_points(pid);
  if p_action='inventory_count_start' then
   if exists(select 1 from private.store_inventory_counts where product_id=pid and state='draft') then raise exception 'Ya existe un conteo abierto; continúa o cancélalo'; end if;
   insert into private.store_inventory_counts(id,product_id,snapshot,reason,created_by) values(op,pid,points,v_reason,p_actor);
  elsif p_action like 'inventory_count_%' then
   select * into c from private.store_inventory_counts where id=(p_payload->>'count_id')::uuid and product_id=pid for update;
   if not found or c.state<>'draft' then raise exception 'El conteo ya no está abierto'; end if;
   if p_action='inventory_count_cancel' then update private.store_inventory_counts set state='cancelled',reason=c.reason||' · Cancelado: '||v_reason where id=c.id;
   else
    if jsonb_typeof(p_payload->'observed') is distinct from 'object' or octet_length((p_payload->'observed')::text)>16000 then raise exception 'Conteo inválido'; end if;
    for line in select value from jsonb_array_elements(c.snapshot) loop
     if p_payload->'observed' ? (line->>'key') then
      if jsonb_typeof(p_payload->'observed'->(line->>'key'))<>'number' then raise exception 'Cada cantidad contada debe ser un entero no negativo'; end if;
      if (p_payload->'observed'->>(line->>'key'))::numeric not between 0 and 1000000
       or (p_payload->'observed'->>(line->>'key'))::numeric<>trunc((p_payload->'observed'->>(line->>'key'))::numeric) then raise exception 'Cada cantidad contada debe ser un entero no negativo'; end if;
     elsif p_action='inventory_count_commit' then raise exception 'Completa todas las variantes, incluyendo cantidades cero'; end if;
    end loop;
    if exists(select 1 from jsonb_object_keys(p_payload->'observed') k where not exists(select 1 from jsonb_array_elements(c.snapshot) s where s->>'key'=k)) then raise exception 'El conteo contiene variantes desconocidas'; end if;
    if p_action='inventory_count_commit' then
     if points<>c.snapshot then raise exception 'Cambió el inventario durante el conteo. Cancela e inicia uno actualizado'; end if;
     perform set_config('store.inventory_source','adjustment',true);
     perform set_config('store.inventory_reason','Conteo físico: '||v_reason,true);
     for line in select value from jsonb_array_elements(points) loop
      qty:=(p_payload->'observed'->>(line->>'key'))::integer; vid:=(line->>'variant_id')::uuid;
      select coalesce(sum(quantity),0) into reserved from private.store_reservations r where r.product_id=pid and r.variant_id is not distinct from vid and (r.state='held' or r.state='active' and r.expires_at>now());
      if qty<reserved then raise exception 'El conteo es menor que las unidades reservadas. Concilia los pedidos primero'; end if;
      if vid is null then update public.products set stock=qty where id=pid; else update public.product_variants set stock=qty where id=vid; end if;
     end loop;
     update public.products set stock=(select sum(stock) from public.product_variants where product_id=pid) where id=pid and exists(select 1 from public.product_variants where product_id=pid);
     insert into private.store_inventory_profiles(product_id,last_count_at,last_count_by) values(pid,now(),p_actor)
      on conflict(product_id) do update set last_count_at=now(),last_count_by=p_actor;
     update private.store_inventory_counts set state='committed',committed_by=p_actor,committed_at=now(),reason=v_reason where id=c.id;
    end if;
    update private.store_inventory_counts set observed=p_payload->'observed' where id=c.id;
   end if;
  elsif p_action='inventory_move' then
   vid:=nullif(p_payload->>'variant_id','')::uuid;
   select (value->>'stock')::integer into old_qty from jsonb_array_elements(points) where (value->>'variant_id')::uuid is not distinct from vid;
   if old_qty is null then raise exception 'Selecciona una variante válida'; end if;
   if jsonb_typeof(p_payload->'quantity') is distinct from 'number' then raise exception 'Movimiento inválido'; end if;
   if (p_payload->>'quantity')::numeric not between 1 and 1000000 or trunc((p_payload->>'quantity')::numeric)<>(p_payload->>'quantity')::numeric
    or coalesce(p_payload->>'direction','') not in ('in','out') then raise exception 'Movimiento inválido'; end if;
   qty:=(p_payload->>'quantity')::integer;
   if p_payload->>'direction'='out' then qty:=-qty; end if;
   select coalesce(sum(quantity),0) into reserved from private.store_reservations r where r.product_id=pid and r.variant_id is not distinct from vid and (r.state='held' or r.state='active' and r.expires_at>now());
   if old_qty+qty<reserved then raise exception 'No puedes retirar unidades reservadas ni dejar stock negativo'; end if;
   perform set_config('store.inventory_source',p_payload->>'direction',true);
   perform set_config('store.inventory_reason',v_reason,true);
   if vid is null then update public.products set stock=stock+qty where id=pid; else update public.product_variants set stock=stock+qty where id=vid; end if;
  end if;
 end if;
 insert into private.store_inventory_operations(id,actor_id,fingerprint,product_id,action,details) values(op,p_actor,fp,pid,p_action,p_payload);
 return private.store_inventory_detail(pid);
end $$;

-- Audit checkout writes using the identity verified by the existing Edge Function.
create or replace function public.store_api(p_action text,p_actor uuid,p_secret text,p_payload jsonb)
returns jsonb language plpgsql set search_path='' as $$
begin
 perform set_config('store.inventory_actor',coalesce(p_actor::text,''),true);
 perform set_config('store.inventory_operation',coalesce(p_payload->>'request_id',p_payload->>'operation_id',''),true);
 perform set_config('store.inventory_order',coalesce(p_payload->>'order_id',''),true);
 perform set_config('store.inventory_source',case when p_action='pos' then 'pos_sale' else 'online_sale' end,true);
 perform set_config('store.inventory_reason',case when p_action='pos' then 'Venta en punto de venta' else 'Pedido web confirmado' end,true);
 return private.store_api(p_action,p_actor,p_secret,p_payload);
end $$;
create function private.store_inventory_order_context() returns trigger language plpgsql set search_path='' as $$
begin perform set_config('store.inventory_order',new.id::text,true); return new; end $$;
create trigger store_inventory_order_context after insert on public.orders for each row when(new.checkout_version=2) execute function private.store_inventory_order_context();
revoke all on function public.store_inventory_api(text,uuid,jsonb),private.store_stock_points(uuid),private.store_inventory_detail(uuid),private.store_stock_guard(),private.store_stock_audit(),private.store_inventory_order_context() from public,anon,authenticated;
grant execute on function public.store_inventory_api(text,uuid,jsonb),private.store_stock_points(uuid),private.store_inventory_detail(uuid),private.store_inventory_order_context() to service_role;
revoke all on function private.store_inventory_actor_name(uuid) from public,anon,authenticated;
grant execute on function private.store_inventory_actor_name(uuid) to service_role;
commit;
