import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure dot env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PolicyAuditRow {
  cmd: string;
  roles: string[];
  qual: string | null;
}

const isPolicyAuditRow = (value: unknown): value is PolicyAuditRow => {
  if (typeof value !== 'object' || value === null) return false;
  const cmd = Reflect.get(value, 'cmd');
  const roles = Reflect.get(value, 'roles');
  const qual = Reflect.get(value, 'qual');
  return typeof cmd === 'string'
    && Array.isArray(roles)
    && roles.every((role) => typeof role === 'string')
    && (typeof qual === 'string' || qual === null);
};

async function run() {
  console.log('Auditing RLS policies...');

  const { data, error } = await supabase
    .from('audit_pg_policies')
    .select('*')
    .order('tablename', { ascending: true });

  if (error) {
    throw new Error(`Error fetching policies: ${error.message}`);
  }

  const policies = (data ?? []).filter(isPolicyAuditRow);
  const outputPath = path.join(__dirname, '../scratch/policies_report.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(policies, null, 2));

  console.log(`Audited ${policies.length} policies. Saved to scratch/policies_report.json`);

  // Find potentially dangerous policies
  const publicReads = policies.filter((policy) =>
    policy.cmd === 'SELECT'
    && (policy.roles.includes('public') || policy.roles.includes('anon') || policy.roles.includes('authenticated'))
    && (policy.qual === 'true' || policy.qual === null || policy.qual === '')
  );

  console.log(`Found ${publicReads.length} potentially broad SELECT policies.`);
}

run().catch((error: unknown) => {
  console.error('Policy audit failed:', error);
  process.exitCode = 1;
});
