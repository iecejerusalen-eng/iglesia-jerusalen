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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  console.log('Querying pg_catalog.pg_policies...');
  const { data, error } = await supabase
    .from('pg_catalog.pg_policies')
    .select('*')
    .eq('schemaname', 'public');

  if (error) {
    console.error('Error fetching policies directly:', error.message, error);
  } else {
    console.log('Policies count:', data.length);
    console.table(data.map(p => ({
      table: p.tablename,
      policy: p.policyname,
      cmd: p.cmd,
      roles: p.roles,
      qual: p.qual,
      with_check: p.with_check
    })));
  }
}

checkPolicies();
