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
  console.log('Buscando "2 Timoteo" o "&nbsp" en todas las tablas...');
  
  // 1. Sermons
  const { data: sermons } = await supabase.from('sermons').select('*');
  if (sermons) {
    for (const s of sermons) {
      const str = JSON.stringify(s);
      if (str.includes('Timoteo') || str.includes('Avivando') || str.includes('&nbsp')) {
        console.log('=== SERMON MATCH ===');
        console.log('ID:', s.id, 'Title:', s.title);
        console.log('Passage:', s.passage);
        console.log('Description:', s.description);
      }
    }
  }

  // 2. Open Resources
  const { data: resources } = await supabase.from('open_resources').select('*');
  if (resources) {
    for (const r of resources) {
      const str = JSON.stringify(r);
      if (str.includes('Timoteo') || str.includes('Avivando') || str.includes('&nbsp')) {
        console.log('=== RESOURCE MATCH ===');
        console.log('ID:', r.id, 'Title:', r.title);
        console.log('Passage:', r.passage);
        console.log('Description:', r.description);
      }
    }
  }

  // 3. Pages / Dynamic Sections
  const { data: pages } = await supabase.from('pages').select('*');
  if (pages) {
    for (const p of pages) {
      const str = JSON.stringify(p);
      if (str.includes('Timoteo') || str.includes('Avivando') || str.includes('&nbsp')) {
        console.log('=== PAGE MATCH ===');
        console.log('ID:', p.id, 'Slug:', p.slug, 'Title:', p.title);
      }
    }
  }
}

run();
