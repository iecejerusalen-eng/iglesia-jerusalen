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

const infoSchemaClient = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'information_schema' }
});

async function run() {
  const { data, error } = await infoSchemaClient
    .from('columns')
    .select('column_name')
    .eq('table_name', 'inventory_items');

  if (error) {
    console.error('Error fetching columns:', error);
  } else {
    console.log('Columns of inventory_items:', data.map(c => c.column_name));
  }
}

run();
