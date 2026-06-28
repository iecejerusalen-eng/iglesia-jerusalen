-- =======================================================
-- SCRIPT SQL (ACTUALIZADO): FASE 4 - TIENDA Y DONACIONES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Tabla de Categorías de Donaciones (Dinámicas)
create table public.donation_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Categorías de Donación
alter table public.donation_categories enable row level security;

create policy "Permitir lectura pública de categorías de donación"
  on public.donation_categories for select
  using (is_active = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'pastor')
  ));

create policy "Permitir gestión de categorías a administradores"
  on public.donation_categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- Insertar categorías por defecto iniciales
insert into public.donation_categories (name, description) values
  ('Diezmo', 'Aportes regulares de los miembros'),
  ('Ofrenda', 'Ofrendas voluntarias generales'),
  ('Misiones', 'Apoyo a la obra misionera'),
  ('Construcción', 'Fondo para mejoras del templo y mantenimiento'),
  ('Otros', 'Otros fines específicos')
on conflict (name) do nothing;

-- 2. Tabla de Productos (Tienda)
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  category text not null default 'recursos',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Products
alter table public.products enable row level security;

create policy "Permitir lectura pública de productos" 
  on public.products for select 
  using (true);

create policy "Permitir escritura de productos a administradores" 
  on public.products for all 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 3. Tabla de Pedidos (Orders)
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  customer_name text not null,
  customer_email text not null,
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Orders
alter table public.orders enable row level security;

create policy "Permitir crear pedidos públicamente" 
  on public.orders for insert 
  with check (auth.uid() is not null);

create policy "Permitir lectura de pedidos a administradores" 
  on public.orders for select 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

create policy "Permitir actualización de pedidos a administradores" 
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 4. Tabla de Detalles del Pedido (Order Items)
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0)
);

-- RLS para Order Items
alter table public.order_items enable row level security;

create policy "Permitir crear detalles de pedido públicamente" 
  on public.order_items for insert 
  with check (auth.uid() is not null);

create policy "Permitir lectura de detalles de pedido a administradores" 
  on public.order_items for select 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 5. Tabla de Donaciones (Vinculada a Categorías Dinámicas)
create table public.donations (
  id uuid default gen_random_uuid() primary key,
  donor_name text,
  donor_email text not null,
  amount numeric(10, 2) not null check (amount > 0),
  category_id uuid references public.donation_categories(id) on delete set null,
  category_name_backup text, -- Guarda el nombre por si la categoría se desactiva/elimina
  payment_method text not null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Donaciones
alter table public.donations enable row level security;

create policy "Permitir insertar donaciones públicamente" 
  on public.donations for insert 
  with check (auth.uid() is not null);

create policy "Permitir lectura de donaciones a administradores" 
  on public.donations for select 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 6. Bucket de almacenamiento de imágenes
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "Cualquiera puede leer imágenes de productos"
  on storage.objects for select
  using (bucket_id = 'products');

create policy "Admins pueden subir imágenes de productos"
  on storage.objects for insert
  with check (bucket_id = 'products' and (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  ));

create policy "Admins pueden actualizar/eliminar imágenes de productos"
  on storage.objects for all
  using (bucket_id = 'products' and (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  ));
