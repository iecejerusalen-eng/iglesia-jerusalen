-- Isolated PostgreSQL fixture only. Never apply to a Supabase project.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema storage;
create schema private;
create schema cron;
create function cron.schedule(text,text,text) returns bigint language sql as $$ select 1::bigint $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
create type public.order_status as enum('pending_payment','paid','ready_for_pickup','completed','cancelled');
create type public.ecommerce_payment_method as enum('transfer','cash','card');
create type public.ecommerce_payment_status as enum('pending','verifying','paid','failed');
create type public.ecommerce_fulfillment_status as enum('unfulfilled','processing','shipped','delivered');
create table public.profiles(id uuid primary key,staff boolean default false);
create function private.profile_has_admin_permission(uuid,text,text) returns boolean language sql as $$ select coalesce((select staff from public.profiles where id=$1),false) $$;
create function private.current_user_has_admin_permission(text,text) returns boolean language sql security definer as $$ select private.profile_has_admin_permission(auth.uid(),$1,$2) $$;
create table public.products(id uuid primary key default gen_random_uuid(),name text,description text,price numeric,discount_price numeric,
 promo_tag text,sku text,tax_rate numeric,sold_count integer,is_active boolean,thumbnail_url text,image_url text,category text,type text,
 ecommerce_product_type text,features jsonb,cover_image_url text,deleted_at timestamptz,created_at timestamptz default now(),metadata jsonb default '{}',stock integer,cost_price numeric,digital_file_url text);
create table public.product_variants(id uuid primary key default gen_random_uuid(),product_id uuid references public.products(id),color_name text,color_hex text,size text,cloudinary_image_url text,sku text,stock integer,price_adjustment numeric);
create table public.product_digital_assets(product_id uuid primary key,drive_link text);
create table public.pos_sessions(id uuid primary key,cashier_id uuid,cashier_name text,status text,orders_count integer default 0,total_cash_sales numeric default 0,total_card_sales numeric default 0,total_transfer_sales numeric default 0);
create table public.orders(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),customer_name text not null,customer_email text not null,
 total numeric not null,status public.order_status not null default 'pending_payment',created_at timestamptz default now(),payment_method text,
 payment_voucher_url text,payment_receipt_url text,refund_status text default 'none',refunded_amount numeric default 0,refund_reason text,
 shipping_recipient_name text,shipping_phone text,shipping_override_address text,shipping_status_notes text,
 ecommerce_payment_method public.ecommerce_payment_method,ecommerce_payment_status public.ecommerce_payment_status,
 ecommerce_fulfillment_status public.ecommerce_fulfillment_status,channel text,receipt_number text,cashier_name text,pos_session_id uuid,member_id uuid);
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid references public.orders(id),product_id uuid references public.products(id),variant_id uuid references public.product_variants(id),quantity integer,price numeric);
create table public.church_settings(id integer primary key,bank_name text,bank_account text,ruc text,payment_methods jsonb,shipping_methods jsonb);
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table storage.objects enable row level security;
create policy legacy_products_read on public.products for select using(true);
create policy legacy_variants_read on public.product_variants for select using(true);
create policy legacy_storage_broad on storage.objects for all using(true) with check(true);
grant usage on schema public,auth,private,storage to anon,authenticated,service_role;
grant all on all tables in schema public,auth,storage to service_role;
grant all on public.orders,public.order_items,public.products,public.product_variants,storage.objects to anon,authenticated;

insert into auth.users values('00000000-0000-0000-0000-000000000001',now()),('00000000-0000-0000-0000-000000000002',now());
insert into public.profiles values('00000000-0000-0000-0000-000000000001',true),('00000000-0000-0000-0000-000000000002',false);
insert into public.products(id,name,price,stock,is_active,type,tax_rate,metadata,cost_price,digital_file_url) values
 ('10000000-0000-0000-0000-000000000001','Físico QA',10,3,true,'physical',15,'{}',7,'secret-file'),
 ('10000000-0000-0000-0000-000000000002','Digital QA',20,0,true,'digital',0,'{}',9,'secret-digital'),
 ('10000000-0000-0000-0000-000000000003','Variantes QA',22,42,true,'physical',15,'{"price_tiers":[{"min_quantity":3,"unit_price":18.5}]}',10,null);
insert into public.product_variants(id,product_id,stock,price_adjustment,color_name,size) values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',6,1,'Negro','L');
insert into public.product_digital_assets values('10000000-0000-0000-0000-000000000002','private-digital');
insert into public.church_settings values(1,'Banco QA','no-real-account',null,'[{"id":"transfer","active":true,"fee_percent":0}]','[{"id":"pickup","active":true,"base_cost":0}]');
insert into public.pos_sessions(id,cashier_id,cashier_name,status) values('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Caja QA','open');
-- Supabase installations can grant broad defaults to new relations. Views must explicitly revoke them.
alter default privileges in schema public grant all on tables to anon,authenticated;
alter default privileges in schema private grant all on tables to anon,authenticated;
