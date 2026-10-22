-- Isolated test fixture extending store_checkout_fixture; never apply remotely.
alter table public.profiles add column first_name text;
alter table public.profiles add column last_name text;
update public.profiles set first_name='Operador',last_name='QA' where staff;
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), product_id uuid not null,
 movement_type text not null check(movement_type in ('in','out','adjustment','pos_sale','online_sale')),
 quantity int not null, previous_stock int not null, new_stock int not null,
 reference_order_id uuid, created_by_name text, reason text, created_at timestamptz default now()
);
alter table public.inventory_movements enable row level security;
create policy legacy_movements on public.inventory_movements for all using(true);
grant all on public.inventory_movements to authenticated,anon;
