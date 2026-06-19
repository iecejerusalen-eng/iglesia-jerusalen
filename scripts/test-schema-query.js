import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local no encontrado.');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize client with pg_catalog schema
const pgCatalogClient = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'pg_catalog' }
});

async function run() {
  console.log('Querying pg_policies from pg_catalog schema...');
  const { data: policies, error: polErr } = await pgCatalogClient
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'public');

  if (polErr) {
    console.error('Error fetching policies:', polErr.message, polErr);
  } else {
    console.log(`Found ${policies.length} policies:`);
    policies.forEach(p => {
      console.log(`  Table: ${p.tablename} | Policy: ${p.policyname} | Cmd: ${p.cmd} | Roles: ${p.roles}`);
    });
  }

  console.log('\nQuerying pg_proc for functions related to SQL execution...');
  const { data: procs, error: procErr } = await pgCatalogClient
    .from('pg_proc')
    .select('proname')
    .ilike('proname', '%sql%');

  if (procErr) {
    console.error('Error fetching pg_proc:', procErr.message);
  } else {
    console.log(`Found ${procs.length} SQL-related functions:`);
    procs.forEach(p => console.log(`  - ${p.proname}`));
  }
}

run();
