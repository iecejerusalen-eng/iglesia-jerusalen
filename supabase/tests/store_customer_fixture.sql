-- Isolated fixture only. Never apply to a remote project.
alter table auth.users add column email text;
update auth.users set email=case when id='00000000-0000-0000-0000-000000000001' then 'owner@example.invalid' else 'other@example.invalid' end;
alter table public.product_digital_assets add column instructions text;
alter table public.product_digital_assets enable row level security;
create policy legacy_paid_asset_read on public.product_digital_assets for select using(true);
grant select on public.product_digital_assets to authenticated,anon;
update public.product_digital_assets set drive_link='https://drive.google.com/file/d/QA_ONLY/view',instructions='Archivo sintético; sin descarga real';
