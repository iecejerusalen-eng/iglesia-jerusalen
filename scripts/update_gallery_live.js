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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const newSlides = [
  {
    id: 'slide_1',
    url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=1200',
    caption: 'Alabanza y adoración congregacional',
    category: 'Adoración'
  },
  {
    id: 'slide_2',
    url: 'https://images.unsplash.com/photo-1504052434569-7c9302e09150?auto=format&fit=crop&q=80&w=1200',
    caption: 'Tiempo de enseñanza y estudio de la Palabra',
    category: 'Enseñanza'
  },
  {
    id: 'slide_3',
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1200',
    caption: 'Comunión fraternal de los miembros',
    category: 'Comunidad'
  },
  {
    id: 'slide_4',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200',
    caption: 'Grupos de crecimiento en hogares (Células)',
    category: 'Comunidad'
  },
  {
    id: 'slide_5',
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=1200',
    caption: 'Escuela Dominical y formación en la fe',
    category: 'Niños'
  },
  {
    id: 'slide_6',
    url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=1200',
    caption: 'Proyectos de ayuda y servicio a la comunidad',
    category: 'Servicio'
  }
];

async function updateGallery() {
  console.log('Actualizando home_gallery en Supabase...');
  const { data, error } = await supabase
    .from('page_contents')
    .update({ content_blocks: newSlides })
    .eq('id', 'home_gallery')
    .select();
  
  if (error) {
    console.error('Error al actualizar:', error.message);
  } else {
    console.log('Galería actualizada correctamente:', JSON.stringify(data, null, 2));
  }
}

updateGallery();
