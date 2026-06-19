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
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('Consultando tabla ministries...');
  const { data, error } = await supabase
    .from('ministries')
    .select('id, name, slug, image_url, description');

  if (error) {
    console.error('Error al consultar:', error.message);
  } else {
    console.log(`Se encontraron ${data.length} ministerios:`);
    data.forEach(m => {
      console.log(`- Slug: ${m.slug}`);
      console.log(`  Nombre: ${m.name}`);
      console.log(`  Portada: ${m.image_url}`);
      console.log(`  Desc. Longitud: ${m.description ? m.description.length : 'NULL/vacía'}`);
      if (m.description) {
        console.log(`  Desc. Comienzo: ${m.description.substring(0, 80)}...`);
      }
      console.log('----------------------------');
    });
  }
}

inspect();
