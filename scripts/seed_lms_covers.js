import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno para Supabase");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCovers() {
  const images = [
    'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1000&auto=format&fit=crop', // Biblia / Estudio
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=1000&auto=format&fit=crop', // Cruz / Esperanza
    'https://images.unsplash.com/photo-1544427920-c49ccf08c146?q=80&w=1000&auto=format&fit=crop', // Manos / Comunidad
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1000&auto=format&fit=crop', // Amanecer / Naturaleza
    'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=1000&auto=format&fit=crop'  // Adoración
  ];

  console.log("Obteniendo cursos sin portada...");
  const { data: courses, error } = await supabase.from('lms_courses').select('id, title, cover_image_url').or('cover_image_url.is.null,cover_image_url.eq.""');
  
  if (error) {
    console.error("Error obteniendo cursos:", error);
    process.exit(1);
  }

  if (!courses || courses.length === 0) {
    console.log("Todos los cursos ya tienen portada.");
    return;
  }

  console.log(`Actualizando ${courses.length} cursos...`);
  
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const imageUrl = images[i % images.length];
    
    console.log(`Actualizando curso: ${course.title}`);
    const { error: updateError } = await supabase.from('lms_courses').update({ cover_image_url: imageUrl }).eq('id', course.id);
    
    if (updateError) {
      console.error(`Error actualizando ${course.title}:`, updateError);
    }
  }
  console.log("Cursos actualizados exitosamente.");
}

seedCovers();
