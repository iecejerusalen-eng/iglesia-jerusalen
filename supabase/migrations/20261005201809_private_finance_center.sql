-- Finanzas privadas. No aplica cambios remotos por sÃ­ sola.
begin;
create schema if not exists finance_private;
revoke all on schema finance_private from public, anon;
grant usage on schema finance_private to authenticated;

-- Roles protegidos por protect_profile_access_fields. Un admin tÃ©cnico NO obtiene
-- acceso financiero automÃ¡ticamente. TesorerÃ­a se asigna con el rol personalizado.
insert into public.access_roles(name,slug,description,permissions)
values ('TesorerÃ­a','tesoreria','Gestiona finanzas confidenciales de la iglesia.','{"finances":{"view":true,"edit":true}}') on conflict(slug) do nothing;
create or replace function finance_private.can_access(editing boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
 select 1 from public.profiles p where p.id=auth.uid() and p.banned is not true and (
   p.role::text in ('pastor','secretary','secretaria','treasurer','tesorera','tesorero')
   or coalesce(p.roles::text[], '{}'::text[]) && array['pastor','secretary','secretaria','treasurer','tesorera','tesorero']
   or (not editing and (p.role::text='apoyo' or 'apoyo'=any(coalesce(p.roles::text[], '{}'::text[]))))
   or exists(select 1 from public.access_roles r where r.id=any(p.custom_role_ids) and r.slug='tesoreria' and r.is_active)
 ));
$$;
revoke all on function finance_private.can_access(boolean) from public,anon;
grant execute on function finance_private.can_access(boolean) to authenticated;
create or replace function public.finance_access()
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('view',finance_private.can_access(false),'edit',finance_private.can_access(true));
$$;
revoke all on function public.finance_access() from public,anon;
grant execute on function public.finance_access() to authenticated;

create table public.finance_funds (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name)) between 2 and 100),
 kind text not null check(kind in ('tithe','offering')), restricted boolean not null default false, active boolean not null default true
);
insert into public.finance_funds(id,name,kind) select id,name,case when lower(name) like '%diezm%' then 'tithe' else 'offering' end from public.donation_categories on conflict(name) do nothing;
insert into public.finance_funds(name,kind,restricted) values ('Diezmos','tithe',false),('Ofrenda general','offering',false),('Pro-construcciÃ³n','offering',true),('Ofrenda de amor','offering',true),('Misiones','offering',true) on conflict(name) do nothing;
create sequence finance_private.receipt_seq;
create table public.finance_recurring (
 id uuid primary key default gen_random_uuid(), fund_id uuid not null references public.finance_funds(id),
 category text not null check(length(trim(category)) between 1 and 100), description text not null check(length(trim(description)) between 1 and 1000), beneficiary text check(length(beneficiary)<=160),
 amount numeric(14,2) not null check(amount>0 and amount<=100000000), method text not null check(method in ('cash','transfer')),
 day integer not null check(day between 1 and 28), starts_on date not null, ends_on date check(ends_on is null or ends_on>=starts_on), active boolean not null default true
);
create table public.finance_movements (
 id uuid primary key default gen_random_uuid(), receipt_number text not null unique default ('FIN-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('finance_private.receipt_seq')::text,8,'0')),
 kind text not null check(kind in ('income','expense')), fund_id uuid not null references public.finance_funds(id),
 user_id uuid references auth.users(id) on delete restrict, amount numeric(14,2) not null check(amount>0 and amount<=100000000), currency text not null default 'USD' check(currency='USD'),
 occurred_on date not null, contribution_month date check(contribution_month is null or extract(day from contribution_month)=1),
 method text not null check(method in ('cash','transfer')), status text not null default 'pending' check(status in ('pending','confirmed','void')),
 category text not null check(length(trim(category)) between 1 and 100), description text not null check(length(trim(description)) between 1 and 1000),
 reference text check(length(reference)<=120), proof_path text, beneficiary text check(length(beneficiary)<=160), correction_reason text check(length(correction_reason)<=500),
 version integer not null default 1, created_by uuid references auth.users(id), verified_by uuid references auth.users(id), verified_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 recurring_id uuid references public.finance_recurring(id), recurrence_month date, legacy_donation_id uuid unique,
 check(kind='income' or (user_id is null and contribution_month is null)),
 unique(recurring_id,recurrence_month)
);
create unique index finance_transfer_reference_unique on public.finance_movements(lower(reference)) where method='transfer' and status<>'void' and reference is not null;
create index finance_movements_owner_month on public.finance_movements(user_id,contribution_month) where kind='income';
create index finance_movements_date_status on public.finance_movements(occurred_on,status);
create index finance_movements_fund_date on public.finance_movements(fund_id,occurred_on);
create index finance_movements_recurring on public.finance_movements(recurring_id);
create table public.finance_budgets (
 id uuid primary key default gen_random_uuid(), fund_id uuid not null references public.finance_funds(id), month date not null check(extract(day from month)=1),
 category text not null check(length(trim(category)) between 1 and 100), amount numeric(14,2) not null check(amount>=0 and amount<=100000000), unique(fund_id,month,category)
);
create table public.finance_periods(month date primary key check(extract(day from month)=1), closed_by uuid not null references auth.users(id), closed_at timestamptz not null default now());
create table public.finance_audit (
 id uuid primary key default gen_random_uuid(), movement_id uuid, entity text not null, actor_id uuid references auth.users(id), action text not null,
 reason text, before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index finance_audit_created on public.finance_audit(created_at desc);
create table public.finance_preferences (user_id uuid primary key references auth.users(id), monthly_reminder boolean not null default false);
create table public.finance_notices (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), message text not null,
 dedupe_key text not null unique, created_at timestamptz not null default now(), read_at timestamptz
);
create index finance_notices_owner on public.finance_notices(user_id,created_at desc);

alter table public.donations add column if not exists user_id uuid references auth.users(id);
-- ImportaciÃ³n Ãºnica: conserva fechas y estado; nunca vincula por correo sin verificar.
insert into public.finance_movements(id,kind,fund_id,user_id,amount,occurred_on,contribution_month,method,status,category,description,legacy_donation_id)
select d.id,'income',coalesce(f.id,(select id from public.finance_funds where name='Ofrenda general')),d.user_id,d.amount,(d.created_at at time zone 'America/Guayaquil')::date,date_trunc('month',d.created_at at time zone 'America/Guayaquil')::date,
 case when lower(d.payment_method) in ('cash','efectivo') then 'cash' else 'transfer' end,
 case when d.status='completed' then 'confirmed' when d.status='failed' then 'void' else 'pending' end,
 coalesce(d.category_name_backup,'Aporte histÃ³rico'),'Aporte histÃ³rico Â· '||coalesce(d.donor_name,'Sin nombre'),d.id
from public.donations d left join public.finance_funds f on f.id=d.category_id where d.amount>0;

-- Triggers privados: validaciones del servidor, auditorÃ­a inmutable y notificaciÃ³n
-- al titular dentro de la misma transacciÃ³n. Sin borrado de movimientos.
create or replace function finance_private.guard_movement()
returns trigger language plpgsql security definer set search_path='' as $$
declare staff boolean:=finance_private.can_access(true); f public.finance_funds; prior_month date; lock_month date;
begin
 if auth.uid() is null then
  if current_setting('role',true) not in ('none','postgres') or tg_op<>'INSERT' or not exists(
   select 1 from public.finance_recurring r where r.id=new.recurring_id and r.active and r.fund_id=new.fund_id and r.amount=new.amount and r.method=new.method and new.kind='expense' and new.status='pending' and new.user_id is null and new.recurrence_month=date_trunc('month',now() at time zone 'America/Guayaquil')::date and new.occurred_on=new.recurrence_month+(r.day-1) and r.starts_on<=new.occurred_on and (r.ends_on is null or r.ends_on>=new.occurred_on)
  ) then raise exception 'Se requiere una sesiÃ³n autenticada o un vencimiento de automatizaciÃ³n vÃ¡lido.';end if;
  staff:=true;
 end if;
 select * into f from public.finance_funds where id=new.fund_id;
 if not f.active and (tg_op='INSERT' or new.fund_id is distinct from old.fund_id) then raise exception 'El fondo no estÃ¡ activo.'; end if;
 if tg_op='UPDATE' then
  if not staff then raise exception 'Solo el equipo financiero puede modificar movimientos.'; end if;
  if length(trim(coalesce(new.correction_reason,'')))<5 then raise exception 'Indica el motivo del cambio (mÃ­nimo 5 caracteres).'; end if;
  if new.id<>old.id or new.created_at<>old.created_at or new.receipt_number<>old.receipt_number or new.created_by is distinct from old.created_by or new.legacy_donation_id is distinct from old.legacy_donation_id or new.recurring_id is distinct from old.recurring_id or new.recurrence_month is distinct from old.recurrence_month then raise exception 'No se pueden alterar identificadores de trazabilidad.'; end if;
  prior_month:=date_trunc('month',old.occurred_on)::date;
  new.version:=old.version+1;
 else
  new.created_by:=auth.uid(); new.version:=1; new.created_at:=now();
  new.receipt_number:='FIN-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('finance_private.receipt_seq')::text,8,'0');
  if not staff and (new.kind<>'income' or new.user_id is distinct from auth.uid() or new.status<>'pending' or new.legacy_donation_id is not null or new.recurring_id is not null) then raise exception 'Solo puedes registrar tu propio aporte pendiente.'; end if;
 end if;
 for lock_month in select distinct m from unnest(array[date_trunc('month',new.occurred_on)::date,prior_month]) m where m is not null order by m loop
  perform pg_advisory_xact_lock(70031,extract(year from lock_month)::integer*12+extract(month from lock_month)::integer);
 end loop;
 if exists(select 1 from public.finance_periods where month in(date_trunc('month',new.occurred_on)::date,prior_month)) then raise exception 'El perÃ­odo estÃ¡ cerrado; solicita su reapertura al equipo financiero.'; end if;
 if new.occurred_on>(now() at time zone 'America/Guayaquil')::date and new.status='confirmed' then raise exception 'No confirmes movimientos futuros.'; end if;
 if new.kind='income' and f.kind='tithe' and new.contribution_month is null then raise exception 'Indica el mes del diezmo.'; end if;
 if new.proof_path is not null and (new.proof_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$' or (not staff and split_part(new.proof_path,'/',1)<>auth.uid()::text)) then raise exception 'Comprobante no autorizado.'; end if;
 if new.method='transfer' and new.status='confirmed' and nullif(trim(new.reference),'') is null and new.legacy_donation_id is null then raise exception 'Indica una referencia bancaria para confirmar.'; end if;
 new.reference:=nullif(trim(new.reference),'');
 if new.status='confirmed' then new.verified_by:=auth.uid(); new.verified_at:=now(); else new.verified_by:=null; new.verified_at:=null; end if;
 new.updated_at:=now(); return new;
end; $$;
create trigger finance_movement_guard before insert or update on public.finance_movements for each row execute function finance_private.guard_movement();
create or replace function finance_private.audit_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare previous jsonb; current jsonb; movement uuid;
begin
 if tg_op<>'INSERT' then previous:=to_jsonb(old); end if;
 if tg_op<>'DELETE' then current:=to_jsonb(new); end if;
 if tg_table_name='finance_movements' then movement:=new.id; end if;
 insert into public.finance_audit(movement_id,entity,actor_id,action,reason,before_data,after_data) values(movement,tg_table_name,auth.uid(),tg_op,current->>'correction_reason',previous,current);
 if tg_table_name='finance_movements' then
 if new.user_id is not null and (tg_op='INSERT' or new.status is distinct from old.status or new.amount is distinct from old.amount) then
  insert into public.finance_notices(user_id,message,dedupe_key) values(new.user_id,'Tu aporte '||new.receipt_number||' tiene estado '||case new.status when 'confirmed' then 'confirmado' when 'void' then 'anulado' else 'pendiente de revisiÃ³n' end||'. Consulta los detalles en Mis aportes.',new.id::text||':'||new.version::text);
 end if;
 end if;
 return coalesce(new,old);
end; $$;
create trigger finance_audit_movement after insert or update on public.finance_movements for each row execute function finance_private.audit_change();
create trigger finance_audit_budget after insert or update or delete on public.finance_budgets for each row execute function finance_private.audit_change();
create trigger finance_audit_recurring after insert or update or delete on public.finance_recurring for each row execute function finance_private.audit_change();
create trigger finance_audit_period after insert or delete on public.finance_periods for each row execute function finance_private.audit_change();
create trigger finance_audit_fund after insert or update on public.finance_funds for each row execute function finance_private.audit_change();
revoke all on function finance_private.guard_movement(),finance_private.audit_change() from public,anon,authenticated;

alter table public.finance_funds enable row level security;
alter table public.finance_movements enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.finance_recurring enable row level security;
alter table public.finance_periods enable row level security;
alter table public.finance_audit enable row level security;
alter table public.finance_preferences enable row level security;
alter table public.finance_notices enable row level security;
revoke all on public.finance_funds,public.finance_movements,public.finance_budgets,public.finance_recurring,public.finance_periods,public.finance_audit,public.finance_preferences,public.finance_notices from anon,authenticated;
grant select,insert,update on public.finance_movements,public.finance_funds to authenticated;
grant select on public.finance_funds to anon;
grant select,insert,update,delete on public.finance_budgets,public.finance_recurring to authenticated;
grant select,insert,delete on public.finance_periods to authenticated;
grant select on public.finance_audit to authenticated;
grant select,insert,update on public.finance_preferences to authenticated;
grant select,update(read_at) on public.finance_notices to authenticated;
grant usage on sequence finance_private.receipt_seq to authenticated;
create policy funds_public_read on public.finance_funds for select to anon using(active);
create policy funds_read on public.finance_funds for select to authenticated using(true);
create policy funds_insert on public.finance_funds for insert to authenticated with check((select finance_private.can_access(true)));
create policy funds_update on public.finance_funds for update to authenticated using((select finance_private.can_access(true))) with check((select finance_private.can_access(true)));
create policy movements_read on public.finance_movements for select to authenticated using((select finance_private.can_access(false)) or (kind='income' and user_id=(select auth.uid())));
create policy movements_insert on public.finance_movements for insert to authenticated with check((select finance_private.can_access(true)) or (kind='income' and user_id=(select auth.uid()) and status='pending'));
create policy movements_update on public.finance_movements for update to authenticated using((select finance_private.can_access(true))) with check((select finance_private.can_access(true)));
create policy budgets_read on public.finance_budgets for select to authenticated using((select finance_private.can_access(false)));
create policy budgets_manage on public.finance_budgets for all to authenticated using((select finance_private.can_access(true))) with check((select finance_private.can_access(true)));
create policy recurring_read on public.finance_recurring for select to authenticated using((select finance_private.can_access(false)));
create policy recurring_manage on public.finance_recurring for all to authenticated using((select finance_private.can_access(true))) with check((select finance_private.can_access(true)));
create policy periods_read on public.finance_periods for select to authenticated using((select finance_private.can_access(false)));
create policy periods_manage on public.finance_periods for all to authenticated using((select finance_private.can_access(true))) with check((select finance_private.can_access(true)));
create policy audit_read on public.finance_audit for select to authenticated using((select finance_private.can_access(false)));
create policy preferences_own on public.finance_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy notices_own on public.finance_notices for select to authenticated using(user_id=(select auth.uid()));
create policy notices_read on public.finance_notices for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

-- Directorio mÃ­nimo, solo para vincular el aporte a su titular; no expone CRM.
create or replace function finance_private.people()
returns table(id uuid,name text,email text) language sql stable security definer set search_path='' as $$
 select p.id,trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),p.email from public.profiles p
 where finance_private.can_access(false) and p.banned is not true order by p.first_name;
$$;
revoke all on function finance_private.people() from public,anon;
grant execute on function finance_private.people() to authenticated;
create or replace function public.finance_people() returns table(id uuid,name text,email text) language sql stable security invoker set search_path='' as $$ select * from finance_private.people(); $$;
revoke all on function public.finance_people() from public,anon;
grant execute on function public.finance_people() to authenticated;

-- AutomatizaciÃ³n idempotente: genera GASTOS PENDIENTES, jamÃ¡s marca pagos realizados.
create or replace function finance_private.run_automation()
returns void language plpgsql security definer set search_path='' as $$
declare today date:=(now() at time zone 'America/Guayaquil')::date; m date; r public.finance_recurring; pref public.finance_preferences;
begin
 m:=date_trunc('month',today)::date;
 for r in select * from public.finance_recurring where active and starts_on<=today and (ends_on is null or ends_on>=today) and day<=extract(day from today) and m+(day-1)>=starts_on and not exists(select 1 from public.finance_periods where month=m) and not exists(select 1 from public.finance_movements v where v.recurring_id=finance_recurring.id and v.recurrence_month=m) loop
  insert into public.finance_movements(kind,fund_id,amount,occurred_on,method,status,category,description,beneficiary,recurring_id,recurrence_month)
  values('expense',r.fund_id,r.amount,m+(r.day-1),r.method,'pending',r.category,r.description,r.beneficiary,r.id,m) on conflict(recurring_id,recurrence_month) do nothing;
 end loop;
 for pref in select * from public.finance_preferences where monthly_reminder loop
  if extract(day from today)>=20 and not exists(select 1 from public.finance_movements v join public.finance_funds f on f.id=v.fund_id where v.user_id=pref.user_id and v.contribution_month=m and f.kind='tithe' and v.status in('pending','confirmed')) then
   insert into public.finance_notices(user_id,message,dedupe_key) values(pref.user_id,'Tu recordatorio voluntario estÃ¡ disponible. Revisa el calendario de Mis aportes; un mes sin registro no es una deuda.','reminder:'||pref.user_id||':'||m) on conflict(dedupe_key) do nothing;
  end if;
 end loop;
end; $$;
revoke all on function finance_private.run_automation() from public,anon,authenticated;
create or replace function public.finance_generate_due()
returns integer language plpgsql security invoker set search_path='' as $$
declare today date:=(now() at time zone 'America/Guayaquil')::date; m date:=date_trunc('month',today)::date; r public.finance_recurring; n integer:=0; count_insert integer;
begin
 if not finance_private.can_access(true) then raise exception 'Sin autorizaciÃ³n financiera.'; end if;
 for r in select * from public.finance_recurring where active and starts_on<=today and (ends_on is null or ends_on>=today) and day<=extract(day from today) and m+(day-1)>=starts_on and not exists(select 1 from public.finance_periods where month=m) and not exists(select 1 from public.finance_movements v where v.recurring_id=finance_recurring.id and v.recurrence_month=m) loop
  insert into public.finance_movements(kind,fund_id,amount,occurred_on,method,status,category,description,beneficiary,recurring_id,recurrence_month)
  values('expense',r.fund_id,r.amount,m+(r.day-1),r.method,'pending',r.category,r.description,r.beneficiary,r.id,m) on conflict(recurring_id,recurrence_month) do nothing;
  get diagnostics count_insert=row_count; n:=n+count_insert;
 end loop;
 return n;
end; $$;
revoke all on function public.finance_generate_due() from public,anon;
grant execute on function public.finance_generate_due() to authenticated;
-- Si pg_cron estÃ¡ habilitado, instala vencimientos y recordatorios diarios.
do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  perform cron.schedule('finance-private-reminders','0 14 * * *','select finance_private.run_automation()');
 end if;
end $$;

-- Comprobantes privados, rutas de propietario, lectura solo titular/equipo.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('finance-proofs','finance-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do update set public=false;
create policy finance_proofs_upload on storage.objects for insert to authenticated with check(bucket_id='finance-proofs' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy finance_proofs_read on storage.objects for select to authenticated using(bucket_id='finance-proofs' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select finance_private.can_access(false))));
-- Retira Ãºnicamente las polÃ­ticas antiguas del bucket de donaciones, conserva objetos.
update storage.buckets set public=false where id='donation-proofs';
do $$ declare p record; begin
 for p in select policyname from pg_policies where schemaname='storage' and tablename='objects' and (coalesce(qual,'') like '%donation-proofs%' or coalesce(with_check,'') like '%donation-proofs%') loop execute format('drop policy %I on storage.objects',p.policyname); end loop;
end $$;
create policy legacy_finance_proofs_read on storage.objects for select to authenticated using(bucket_id='donation-proofs' and (select finance_private.can_access(false)));

-- Las restricciones se combinan con AND, incluso si hay polÃ­ticas antiguas amplias.
create policy finance_storage_read_guard on storage.objects as restrictive for select to authenticated using(
 bucket_id not in('finance-proofs','donation-proofs') or
 (bucket_id='finance-proofs' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select finance_private.can_access(false)))) or
 (bucket_id='donation-proofs' and (select finance_private.can_access(false)))
);
create policy finance_storage_anon_read_guard on storage.objects as restrictive for select to anon using(bucket_id not in('finance-proofs','donation-proofs'));
create policy finance_storage_insert_guard on storage.objects as restrictive for insert to anon,authenticated with check(
 bucket_id not in('finance-proofs','donation-proofs') or (bucket_id='finance-proofs' and (storage.foldername(name))[1]=(select auth.uid())::text)
);
create policy finance_storage_update_guard on storage.objects as restrictive for update to anon,authenticated using(bucket_id not in('finance-proofs','donation-proofs')) with check(bucket_id not in('finance-proofs','donation-proofs'));
create policy finance_storage_delete_guard on storage.objects as restrictive for delete to anon,authenticated using(bucket_id not in('finance-proofs','donation-proofs'));

-- El registro previo queda como archivo. Se reemplazan polÃ­ticas permisivas, no datos.
do $$ declare p record; begin
 for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in('donations','donation_audit_logs') loop execute format('drop policy %I on public.%I',p.policyname,p.tablename); end loop;
end $$;
alter table public.donations enable row level security;
revoke all on public.donations,public.donation_audit_logs from anon,authenticated;
grant select on public.donations,public.donation_audit_logs to authenticated;
create policy legacy_donations_read on public.donations for select to authenticated using((select finance_private.can_access(false)) or user_id=(select auth.uid()));
create policy legacy_donations_audit_read on public.donation_audit_logs for select to authenticated using((select finance_private.can_access(false)));

-- No se reutiliza el acumulado del CRM como contabilidad ni se expone a sus roles.
create table public.finance_legacy_member_totals(member_id uuid primary key references public.members(id),amount numeric not null,archived_at timestamptz not null default now());
insert into public.finance_legacy_member_totals(member_id,amount) select id,tithes_sum from public.members where coalesce(tithes_sum,0)<>0;
alter table public.finance_legacy_member_totals enable row level security;
revoke all on public.finance_legacy_member_totals from anon,authenticated;
grant select on public.finance_legacy_member_totals to authenticated;
create policy legacy_member_totals_staff on public.finance_legacy_member_totals for select to authenticated using((select finance_private.can_access(false)));
update public.members set tithes_sum=0 where coalesce(tithes_sum,0)<>0;
create or replace function finance_private.retire_crm_tithes() returns trigger language plpgsql set search_path='' as $$
begin if coalesce(new.tithes_sum,0)<>0 then raise exception 'Registra aportes en Finanzas; el acumulado del CRM fue archivado de forma privada.'; end if;return new;end;$$;
create trigger finance_retire_crm_tithes before insert or update of tithes_sum on public.members for each row execute function finance_private.retire_crm_tithes();
revoke all on function finance_private.retire_crm_tithes() from public,anon,authenticated;

create or replace function finance_private.guard_period() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not finance_private.can_access(true) then raise exception 'Sin autorizaciÃ³n financiera.';end if;
 perform pg_advisory_xact_lock(70031,extract(year from new.month)::integer*12+extract(month from new.month)::integer);
 if exists(select 1 from public.finance_movements where date_trunc('month',occurred_on)::date=new.month and status='pending') then raise exception 'Resuelve los pendientes antes de cerrar el perÃ­odo.';end if;
 new.closed_by:=auth.uid();return new;
end;$$;
create trigger finance_period_guard before insert on public.finance_periods for each row execute function finance_private.guard_period();
create or replace function finance_private.guard_budget() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op<>'INSERT' and exists(select 1 from public.finance_periods where month=old.month) then raise exception 'PerÃ­odo cerrado.';end if;
 if tg_op<>'DELETE' and exists(select 1 from public.finance_periods where month=new.month) then raise exception 'PerÃ­odo cerrado.';end if;
 return coalesce(new,old);
end;$$;
create trigger finance_budget_guard before insert or update or delete on public.finance_budgets for each row execute function finance_private.guard_budget();
revoke all on function finance_private.guard_period(),finance_private.guard_budget() from public,anon,authenticated;

create or replace function finance_private.refresh_my_reminder() returns void language plpgsql security definer set search_path='' as $$
declare today date:=(now() at time zone 'America/Guayaquil')::date; m date:=date_trunc('month',today)::date;
begin
 if auth.uid() is null then raise exception 'Inicia sesiÃ³n.';end if;
 if extract(day from today)>=20 and exists(select 1 from public.finance_preferences where user_id=auth.uid() and monthly_reminder) and not exists(select 1 from public.finance_movements v join public.finance_funds f on f.id=v.fund_id where v.user_id=auth.uid() and v.contribution_month=m and f.kind='tithe' and v.status in('pending','confirmed')) then
 insert into public.finance_notices(user_id,message,dedupe_key) values(auth.uid(),'Tu recordatorio voluntario estÃ¡ disponible. Revisa el calendario de Mis aportes; un mes sin registro no es una deuda.','reminder:'||auth.uid()||':'||m) on conflict(dedupe_key) do nothing;
 end if;
end;$$;
revoke all on function finance_private.refresh_my_reminder() from public,anon;
grant execute on function finance_private.refresh_my_reminder() to authenticated;
create or replace function public.finance_refresh_my_reminder() returns void language sql security invoker set search_path='' as $$ select finance_private.refresh_my_reminder(); $$;
revoke all on function public.finance_refresh_my_reminder() from public,anon;
grant execute on function public.finance_refresh_my_reminder() to authenticated;


create or replace function finance_private.notify_member(recipient uuid,body text,request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not finance_private.can_access(true) then raise exception 'Sin autorizaciÃ³n financiera.';end if;
 if length(trim(body)) not between 10 and 500 or request_id is null or not exists(select 1 from public.profiles where id=recipient and banned is not true) then raise exception 'Indica destinatario y mensaje vÃ¡lidos.';end if;
 if exists(select 1 from public.finance_notices where id=request_id) then
  if not exists(select 1 from public.finance_notices where id=request_id and user_id=recipient and message=trim(body)) then raise exception 'La referencia de envÃ­o ya estÃ¡ utilizada.';end if;
  return;
 end if;
 insert into public.finance_notices(id,user_id,message,dedupe_key)values(request_id,recipient,trim(body),'staff:'||request_id);
 insert into public.finance_audit(entity,actor_id,action,after_data)values('finance_notices',auth.uid(),'NOTIFY',jsonb_build_object('id',request_id,'recipient',recipient));
end;$$;
revoke all on function finance_private.notify_member(uuid,text,uuid) from public,anon;
grant execute on function finance_private.notify_member(uuid,text,uuid) to authenticated;
create or replace function public.finance_notify_member(recipient uuid,body text,request_id uuid) returns void language sql security invoker set search_path='' as $$ select finance_private.notify_member(recipient,body,request_id); $$;
revoke all on function public.finance_notify_member(uuid,text,uuid) from public,anon;
grant execute on function public.finance_notify_member(uuid,text,uuid) to authenticated;

commit;
