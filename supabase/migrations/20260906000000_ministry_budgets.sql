create table if not exists public.ministerio_presupuestos (
  id uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministries(id) on delete cascade,
  ministerio_nombre text not null,
  periodo_inicio date not null,
  periodo_fin date not null,
  monto_asignado numeric(12,2) not null check (monto_asignado >= 0),
  monto_gastado numeric(12,2) not null default 0 check (monto_gastado >= 0),
  monto_pendiente numeric(12,2) not null default 0 check (monto_pendiente >= 0),
  moneda text not null default 'USD',
  notas text,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (ministerio_id, periodo_inicio),
  check (periodo_fin >= periodo_inicio)
);

create table if not exists public.ministerio_gastos (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid references public.ministerio_presupuestos(id) on delete set null,
  ministerio_id uuid not null references public.ministries(id) on delete cascade,
  titulo text not null,
  descripcion text,
  categoria text not null check (categoria in ('equipos','materiales','eventos','transporte','alimentacion','servicios','otros')),
  monto numeric(12,2) not null check (monto > 0),
  moneda text not null default 'USD',
  estado text not null default 'solicitado' check (estado in ('solicitado','aprobado','rechazado','pagado')),
  link_producto text,
  imagen_comprobante text,
  solicitado_por uuid references auth.users(id) on delete set null,
  solicitado_nombre text,
  aprobado_por uuid references auth.users(id) on delete set null,
  aprobado_at timestamptz,
  pagado_at timestamptz,
  nota_aprobacion text,
  created_at timestamptz not null default now()
);

create index if not exists ministerio_presupuestos_periodo_idx on public.ministerio_presupuestos (periodo_inicio desc, ministerio_id);
create index if not exists ministerio_gastos_ministerio_estado_idx on public.ministerio_gastos (ministerio_id, estado, created_at desc);
create index if not exists ministerio_gastos_presupuesto_idx on public.ministerio_gastos (presupuesto_id);

create or replace function public.recalcular_ministerio_presupuesto(target_budget uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.ministerio_presupuestos budget
  set monto_gastado = coalesce((select sum(expense.monto) from public.ministerio_gastos expense where expense.presupuesto_id = target_budget and expense.estado = 'pagado'), 0),
      monto_pendiente = coalesce((select sum(expense.monto) from public.ministerio_gastos expense where expense.presupuesto_id = target_budget and expense.estado in ('solicitado', 'aprobado')), 0)
  where budget.id = target_budget;
end;
$$;

create or replace function public.sync_ministerio_gasto_totales()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.presupuesto_id is not null then
    perform public.recalcular_ministerio_presupuesto(old.presupuesto_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.presupuesto_id is not null then
    perform public.recalcular_ministerio_presupuesto(new.presupuesto_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists ministerio_gasto_totales on public.ministerio_gastos;
create trigger ministerio_gasto_totales
after insert or update or delete on public.ministerio_gastos
for each row execute function public.sync_ministerio_gasto_totales();

alter table public.ministerio_presupuestos enable row level security;
alter table public.ministerio_gastos enable row level security;

drop policy if exists "ministerio_presupuestos_read_scope" on public.ministerio_presupuestos;
create policy "ministerio_presupuestos_read_scope" on public.ministerio_presupuestos
for select to authenticated using (
  exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.role in ('admin','pastor'))
  or exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and (profile.ministry_id = ministerio_presupuestos.ministerio_id or ministerio_presupuestos.ministerio_id = any(coalesce(profile.allowed_ministries, '{}'::uuid[]))))
);

drop policy if exists "ministerio_presupuestos_manage_finance" on public.ministerio_presupuestos;
create policy "ministerio_presupuestos_manage_finance" on public.ministerio_presupuestos
for all to authenticated
using (exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.role in ('admin','pastor')))
with check (exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.role in ('admin','pastor')));

drop policy if exists "ministerio_gastos_read_scope" on public.ministerio_gastos;
create policy "ministerio_gastos_read_scope" on public.ministerio_gastos
for select to authenticated using (
  exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.role in ('admin','pastor'))
  or exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and (profile.ministry_id = ministerio_gastos.ministerio_id or ministerio_gastos.ministerio_id = any(coalesce(profile.allowed_ministries, '{}'::uuid[]))))
);

drop policy if exists "ministerio_gastos_create_scope" on public.ministerio_gastos;
create policy "ministerio_gastos_create_scope" on public.ministerio_gastos
for insert to authenticated with check (
  solicitado_por = (select auth.uid())
  and exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and (profile.role in ('admin','pastor') or profile.ministry_id = ministerio_gastos.ministerio_id or ministerio_gastos.ministerio_id = any(coalesce(profile.allowed_ministries, '{}'::uuid[]))))
);

drop policy if exists "ministerio_gastos_update_scope" on public.ministerio_gastos;
create policy "ministerio_gastos_update_scope" on public.ministerio_gastos
for update to authenticated
using (
  exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.role in ('admin','pastor'))
  or (solicitado_por = (select auth.uid()) and estado = 'solicitado')
)
with check (
  exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.role in ('admin','pastor'))
  or (solicitado_por = (select auth.uid()) and estado = 'solicitado')
);

insert into storage.buckets (id, name, public) values ('budget-receipts', 'budget-receipts', false) on conflict (id) do nothing;
drop policy if exists "budget_receipts_read_scope" on storage.objects;
create policy "budget_receipts_read_scope" on storage.objects for select to authenticated using (
  bucket_id = 'budget-receipts' and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or exists (select 1 from public.profiles profile where profile.id = (select auth.uid()) and profile.role in ('admin','pastor'))
  )
);
drop policy if exists "budget_receipts_insert_authenticated" on storage.objects;
create policy "budget_receipts_insert_authenticated" on storage.objects for insert to authenticated with check (
  bucket_id = 'budget-receipts' and split_part(name, '/', 1) = (select auth.uid())::text
);
