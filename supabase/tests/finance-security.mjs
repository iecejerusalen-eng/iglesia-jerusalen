// Executes the actual migration and access rules in embedded PostgreSQL (PGlite).
// The fixture models Supabase auth/storage and the pre-existing tables only.
import { PGlite } from '../../scratch/finance-tools/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
process.on('uncaughtException', (error) => {
  console.error(error.message, error.detail || '', error.where || '');
  process.exit(1);
});
const db = new PGlite();
const ids = {
  alice: '00000000-0000-4000-8000-000000000001',
  bob: '00000000-0000-4000-8000-000000000002',
  pastor: '00000000-0000-4000-8000-000000000003',
  support: '00000000-0000-4000-8000-000000000004',
  admin: '00000000-0000-4000-8000-000000000005',
  treasurer: '00000000-0000-4000-8000-000000000006',
  secretary: '00000000-0000-4000-8000-000000000007',
};
await db.exec(`create role anon; create role authenticated;create schema auth;create schema storage;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
create table auth.users(id uuid primary key);
create table public.members(id uuid primary key,tithes_sum numeric);
create table public.profiles(id uuid primary key,first_name text,last_name text,email text,role text,roles text[],custom_role_ids uuid[] default '{}',banned boolean default false);
create table public.access_roles(id uuid primary key default gen_random_uuid(),name text,slug text unique,description text,permissions jsonb,is_active boolean default true);
create table public.donation_categories(id uuid primary key,name text);
create table public.donations(id uuid primary key,user_id uuid,amount numeric,created_at timestamptz,status text,category_id uuid,category_name_backup text,payment_method text,donor_name text);
create table public.donation_audit_logs(id uuid primary key);
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;
create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;`);
for (const [name, id] of Object.entries(ids)) {
  await db.query('insert into auth.users values($1)', [id]);
  await db.query(
    'insert into profiles(id,first_name,email,role,roles)values($1,$2,$3,$4,array[$4])',
    [
      id,
      name,
      `${name}@example.invalid`,
      name === 'support'
        ? 'apoyo'
        : name === 'alice' || name === 'bob' || name === 'treasurer'
          ? 'member'
          : name,
    ],
  );
}
await db.query('insert into members values($1,125)', [ids.alice]);
await db.exec(
  await readFile(
    new URL(
      '../migrations/20261005201809_private_finance_center.sql',
      import.meta.url,
    ),
    'utf8',
  ),
);
const treasury = (
  await db.query("select id from access_roles where slug='tesoreria'")
).rows[0].id;
await db.query(
  'update profiles set custom_role_ids=array[$1::uuid] where id=$2',
  [treasury, ids.treasurer],
);
const fund = (
  await db.query("select id from finance_funds where name='Diezmos'")
).rows[0].id;
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions++;
}
async function actor(name) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    name ? ids[name] : '',
  ]);
  await db.exec(`set role ${name ? 'authenticated' : 'anon'}`);
}
async function denied(sql, args = []) {
  try {
    await db.query(sql, args);
  } catch {
    assertions++;
    return;
  }
  throw new Error(`Expected denial: ${sql}`);
}
async function count(table) {
  return Number(
    (await db.query(`select count(*) as count from ${table}`)).rows[0].count,
  );
}
await actor('alice');
const insert = `insert into finance_movements(kind,fund_id,user_id,amount,occurred_on,contribution_month,method,status,category,description) values('income',$1,$2,20,current_date,date_trunc('month',current_date)::date,'cash',$3,'Aporte','Aporte voluntario')returning id,receipt_number`;
const own = (await db.query(insert, [fund, ids.alice, 'pending'])).rows[0];
check((await count('finance_movements')) === 1, 'Owner reads own contribution');
await denied(insert, [fund, ids.bob, 'pending']);
await denied(insert, [fund, ids.alice, 'confirmed']);
check(
  (
    await db.query(
      'update finance_movements set amount=99 where id=$1 returning id',
      [own.id],
    )
  ).rows.length === 0,
  'Owner cannot modify verified or pending ledger',
);
check((await count('finance_audit')) === 0, 'Owner cannot inspect staff audit');
await actor('bob');
check(
  (await count('finance_movements')) === 0,
  'Other donor cannot read contributions',
);
await db.query(insert, [fund, ids.bob, 'pending']);
await actor('support');
check((await count('finance_movements')) === 2, 'Support can consult');
await denied(insert, [fund, ids.alice, 'confirmed']);
check(
  (
    await db.query(
      'update finance_movements set amount=999 where id=$1 returning id',
      [own.id],
    )
  ).rows.length === 0,
  'Support cannot edit',
);
await actor('admin');
check(
  (await count('finance_movements')) === 0,
  'Technical admin has no implicit financial access',
);
for (const staff of ['pastor', 'secretary', 'treasurer']) {
  await actor(staff);
  check((await count('finance_movements')) === 2, `${staff} can read ledger`);
  check(
    (await db.query('select finance_access() as access')).rows[0].access.edit,
    `${staff} can manage`,
  );
}
await actor('pastor');
await denied("update finance_movements set status='confirmed' where id=$1", [
  own.id,
]);
await db.query(
  "update finance_movements set status='confirmed',correction_reason='Efectivo contado' where id=$1",
  [own.id],
);
check((await count('finance_audit')) === 3, 'Creation and correction audited');
await denied(
  "insert into finance_periods(month,closed_by)values(date_trunc('month',current_date)::date,$1)",
  [ids.pastor],
);
await db.exec(
  "update finance_movements set status='confirmed',correction_reason='Caja verificada' where status='pending'",
);
await db.query(
  "insert into finance_periods(month,closed_by)values(date_trunc('month',current_date)::date,$1)",
  [ids.bob],
);
check(
  (await db.query('select closed_by from finance_periods')).rows[0]
    .closed_by === ids.pastor,
  'Server stamps closer identity',
);
await denied(
  "update finance_movements set amount=25,correction_reason='Corregir importe' where id=$1",
  [own.id],
);
await denied(
  "insert into finance_budgets(fund_id,month,category,amount)values($1,date_trunc('month',current_date)::date,'Internet',50)",
  [fund],
);
await db.exec('delete from finance_periods');
await db.query(
  "insert into finance_recurring(fund_id,category,description,amount,method,day,starts_on)values($1,'Internet','Internet mensual',25,'transfer',1,date_trunc('month',current_date)::date)",
  [fund],
);
await db.exec('select finance_generate_due();select finance_generate_due();');
check(
  (await count('finance_movements')) === 3,
  'Recurring generation is idempotent',
);
check(
  (await db.query("select status from finance_movements where kind='expense'"))
    .rows[0].status === 'pending',
  'Recurring payments never auto-confirmed',
);
await denied(
  "update finance_movements set status='confirmed',correction_reason='Pagar internet' where kind='expense'",
);
await db.query(
  "insert into storage.objects(bucket_id,name)values('finance-proofs',$1)",
  [`${ids.pastor}/00000000-0000-4000-8000-000000000010.pdf`],
);
await actor('alice');
check(
  (await count('storage.objects')) === 0,
  'Proofs owned by others remain private',
);
await denied(
  "insert into storage.objects(bucket_id,name)values('finance-proofs',$1)",
  [`${ids.bob}/00000000-0000-4000-8000-000000000011.pdf`],
);
await db.query(
  "insert into storage.objects(bucket_id,name)values('finance-proofs',$1)",
  [`${ids.alice}/00000000-0000-4000-8000-000000000012.pdf`],
);
check((await count('storage.objects')) === 1, 'Own proof visible');
check(
  (await count('finance_notices')) === 2,
  'Only own confirmation notices visible',
);
await denied("update finance_notices set message='Changed'");
await denied('delete from finance_movements');
await actor('pastor');
check(
  (await count('finance_legacy_member_totals')) === 1,
  'CRM historical total retained privately',
);
await actor('bob');
check(
  (await count('finance_legacy_member_totals')) === 0,
  'CRM historical totals inaccessible to other users',
);
// A broad legacy storage policy cannot override the restrictive financial guard.
await db.exec('reset role');
await db.exec(
  'create policy legacy_broad_read on storage.objects for select to authenticated using(true)',
);
await actor('bob');
check(
  (await count('storage.objects')) === 0,
  'Broad legacy storage policy cannot reveal financial proofs',
);
await actor('support');
check(
  (await count('storage.objects')) === 2,
  'Support may read proofs but cannot change them',
);
check(
  (await db.query('select * from finance_people()')).rows.length === 7,
  'Support can identify contributors',
);
await actor('admin');
check(
  (await db.query('select * from finance_people()')).rows.length === 0,
  'Technical admin cannot enumerate finance directory',
);
await db.exec('reset role');
await db.query("select set_config('request.jwt.claim.sub','',false)");
await db.query(
  "insert into finance_recurring(fund_id,category,description,amount,method,day,starts_on)values($1,'Suscripciones','Suscripción mensual',10,'transfer',1,date_trunc('month',current_date)::date)",
  [fund],
);
await db.exec(
  'select finance_private.run_automation();select finance_private.run_automation()',
);
check(
  (await count('finance_movements')) === 4,
  'Scheduler generates due payments exactly once without a human session',
);
check(
  (
    await db.query(
      "select status from finance_movements where description='Suscripción mensual'",
    )
  ).rows[0].status === 'pending',
  'Scheduled expenses remain pending',
);
await actor('alice');
await denied('select finance_private.run_automation()');
// Manual notices are private, audited and idempotent.
await actor('support');
await denied('select finance_notify_member($1,$2,$3)', [
  ids.alice,
  'Mensaje privado de prueba',
  '00000000-0000-4000-8000-000000000030',
]);
await actor('pastor');
await db.query('select finance_notify_member($1,$2,$3)', [
  ids.alice,
  'Mensaje privado de prueba',
  '00000000-0000-4000-8000-000000000030',
]);
await db.query('select finance_notify_member($1,$2,$3)', [
  ids.alice,
  'Mensaje privado de prueba',
  '00000000-0000-4000-8000-000000000030',
]);
await actor('alice');
check(
  (
    await db.query(
      "select count(*) as n from finance_notices where message='Mensaje privado de prueba'",
    )
  ).rows[0].n === 1,
  'Manual notice saved once',
);
await actor('bob');
check(
  (
    await db.query(
      "select count(*) as n from finance_notices where message='Mensaje privado de prueba'",
    )
  ).rows[0].n === 0,
  'Manual notice hidden from another person',
);
// Transfer references cannot be reused for another active payment.
await actor('pastor');
await db.query(
  "update finance_movements set reference='BANK-ONE',status='confirmed',correction_reason='Conciliación bancaria' where description='Internet mensual'",
);
await denied(
  "update finance_movements set reference='bank-one',status='confirmed',correction_reason='Conciliación bancaria' where description='Suscripción mensual'",
);
await actor(null);
await denied('select * from finance_movements');
await denied('select finance_access()');
await db.exec('reset role');
check(
  Number(
    (await db.query('select tithes_sum from members')).rows[0].tithes_sum,
  ) === 0,
  'Public CRM no longer exposes historical amount',
);
await denied('update members set tithes_sum=100');
console.log(
  `${assertions} PostgreSQL security and workflow assertions passed.`,
);
await db.close();
