import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
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

const pgCatalogClient = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'pg_catalog' }
});

async function inspectTriggers() {
  console.log('Consultando disparadores (triggers) en la BD...');

  // Query triggers and functions from pg_trigger and pg_class / pg_proc
  const { data: triggers, error } = await pgCatalogClient
    .from('pg_trigger')
    .select(`
      tgname,
      tgrelid (relname)
    `)
    .eq('tgisinternal', false);

  if (error) {
    console.error('Error fetching triggers:', error.message);
  } else {
    console.log(`Encontrados ${triggers.length} triggers externos:`);
    triggers.forEach(t => {
      console.log(`  Trigger: ${t.tgname} | Tabla: ${t.tgrelid?.relname}`);
    });
  }
}

inspectTriggers();
