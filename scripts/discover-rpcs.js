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

async function discover() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log(`Fetching OpenAPI spec from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const spec = await response.json();
    const paths = Object.keys(spec.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    
    console.log(`Found ${rpcs.length} RPC endpoints:`);
    rpcs.forEach(r => {
      const proname = r.replace('/rpc/', '');
      console.log(`  - ${proname}`);
      console.log(JSON.stringify(spec.paths[r], null, 2));
    });
  } catch (err) {
    console.error('Error discovering RPCs:', err.message);
  }
}

discover();
