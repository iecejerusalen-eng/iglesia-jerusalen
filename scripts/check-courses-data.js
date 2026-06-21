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

async function check() {
  console.log('Consultando lms_courses...');
  const { data: courses, error: err1 } = await supabase
    .from('lms_courses')
    .select('*');

  if (err1) {
    console.error('Error fetching lms_courses:', err1.message);
  } else {
    console.log(`Encontrados ${courses.length} cursos en lms_courses:`);
    courses.forEach(c => {
      console.log(`  ID: ${c.id} | Título: ${c.title} | Published: ${c.is_published}`);
    });
  }

  console.log('\nConsultando open_resources...');
  const { data: openRes, error: err2 } = await supabase
    .from('open_resources')
    .select('*');

  if (err2) {
    console.error('Error fetching open_resources:', err2.message);
  } else {
    console.log(`Encontrados ${openRes.length} recursos en open_resources:`);
    openRes.forEach(r => {
      console.log(`  ID: ${r.id} | Título: ${r.title} | Published: ${r.is_published}`);
    });
  }

  console.log('\nConsultando lms_course_categories...');
  const { data: cats, error: err3 } = await supabase
    .from('lms_course_categories')
    .select('*');

  if (err3) {
    console.error('Error fetching lms_course_categories:', err3.message);
  } else {
    console.log(`Encontradas ${cats.length} categorías en lms_course_categories:`);
    cats.forEach(c => {
      console.log(`  ID: ${c.id} | Nombre: ${c.name}`);
    });
  }
}

check();
