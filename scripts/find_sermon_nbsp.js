import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Buscando prédicas en Supabase...');
  const { data: sermons, error } = await supabase.from('sermons').select('*');
  if (error) {
    console.error('Error fetching sermons:', error);
    return;
  }
  console.log(`Encontradas ${sermons.length} prédicas.`);
  for (const sermon of sermons) {
    if (JSON.stringify(sermon).includes('&nbsp')) {
      console.log('Prédica con &nbsp encontrada:', sermon.id, sermon.title);
      console.log('passage:', sermon.passage);
      console.log('description:', sermon.description);
      console.log('content:', sermon.content);
    }
  }
}

run();
