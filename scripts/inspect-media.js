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

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY no está definida.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- INSPECCIÓN DE TABLAS (CORREGIDA) ---');
  
  // 1. Ministries
  const { data: ministries, error: minErr } = await supabase.from('ministries').select('id, name, image_url');
  if (minErr) console.error('Error en ministries:', minErr.message);
  else console.log('Ministries:', ministries);

  // 2. Events
  const { data: events, error: evErr } = await supabase.from('events').select('id, title, cover_image_url');
  if (evErr) console.error('Error en events:', evErr.message);
  else console.log('Events:', events);

  // 3. Products
  const { data: products, error: prodErr } = await supabase.from('products').select('id, name, image_url');
  if (prodErr) console.error('Error en products:', prodErr.message);
  else console.log('Products:', products);

  // 4. Page Contents
  const { data: pages, error: pgErr } = await supabase.from('page_contents').select('id, page, section, cover_image_url, content_blocks');
  if (pgErr) console.error('Error en page_contents:', pgErr.message);
  else {
    console.log('Page Contents:');
    pages.forEach(p => {
      console.log(`Page: ${p.page}, Section: ${p.section} (ID: ${p.id})`);
      console.log(`  Cover Image: ${p.cover_image_url}`);
      if (Array.isArray(p.content_blocks)) {
        p.content_blocks.forEach((block, idx) => {
          if (block.type === 'image' && block.url) {
            console.log(`  Block ${idx} (image): ${block.url}`);
          } else if (block.type === 'gallery' && Array.isArray(block.images)) {
            block.images.forEach((img, imgIdx) => {
              console.log(`  Block ${idx} (gallery) Image ${imgIdx}: ${img.url}`);
            });
          }
        });
      }
    });
  }
}

inspect();
