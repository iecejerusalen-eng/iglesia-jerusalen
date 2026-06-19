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

const renameMappings = [
  { slug: 'dep-cadetes', name: 'Departamento de Cadetes' },
  { slug: 'dep-damas', name: 'Departamento de Damas' },
  { slug: 'dep-caballeros', name: 'Departamento de Caballeros' },
  { slug: 'dep-jovenes', name: 'Departamento de Jóvenes' },
  { slug: 'dep-escuela-dominical', name: 'Departamento de Escuela dominical' },
  { slug: 'multimedia', name: 'Multimedia' },
  { slug: 'dep-misiones-y-evangelismo', name: 'Departamento de Evangelismo y Misiones' },
  { slug: 'ministerio-de-alabanza', name: 'Ministerio de Alabanza' }
];

const deleteSlugs = [
  'gdf-jovenes',
  'celulas',
  'exploradores-del-reino',
  'mujeres-de-fe',
  'hombres-de-integridad',
  'altar-de-oracion'
];

async function updateMinistries() {
  console.log('--- Iniciando migración y limpieza de ministerios ---');

  // 1. Rename existing ministries
  for (const mapping of renameMappings) {
    const { data, error } = await supabase
      .from('ministries')
      .update({ name: mapping.name })
      .eq('slug', mapping.slug)
      .select();

    if (error) {
      console.error(`Error al renombrar ${mapping.slug}:`, error.message);
    } else {
      console.log(`Renombrado con éxito: ${mapping.slug} -> "${mapping.name}" (Filas afectadas: ${data.length})`);
    }
  }

  // 2. Insert or update "Cuerpo de Apoyo (se muestran los miembros)"
  const apoyoSlug = 'cuerpo-de-apoyo';
  const apoyoName = 'Cuerpo de Apoyo (se muestran los miembros)';
  const apoyoDescription = `<p>El <strong>Cuerpo de Apoyo</strong> de nuestra iglesia está compuesto por hermanos y hermanas comprometidos con el servicio práctico y logístico en las diversas actividades y cultos de la congregación.</p>
<h3>Misión y Propósito</h3>
<p>Servir con amor, orden y diligencia, facilitando el desarrollo de cada servicio y apoyando en la acogida, orden y asistencia de la congregación.</p>
<blockquote>
  <p><strong>Lema del Cuerpo de Apoyo:</strong> "Sirviendo al Señor con alegría y de buen ánimo"<br/>
  <strong>Versículo Clave:</strong> Colosenses 3:23-24 — <em>"Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres; sabiendo que del Señor recibiréis la recompensa de la herencia, porque a Cristo el Señor servís."</em></p>
</blockquote>
<h3>Valores Fundamentales</h3>
<ul>
  <li><strong>Diligencia:</strong> Realizar cada tarea asignada con excelencia y prontitud.</li>
  <li><strong>Amabilidad:</strong> Recibir y guiar a cada persona con una sonrisa y el amor de Cristo.</li>
  <li><strong>Unidad:</strong> Trabajar coordinadamente como un solo cuerpo en el servicio.</li>
</ul>`;

  const { data: existingApoyo, error: checkErr } = await supabase
    .from('ministries')
    .select('*')
    .eq('slug', apoyoSlug)
    .maybeSingle();

  if (checkErr) {
    console.error('Error al comprobar Cuerpo de Apoyo:', checkErr.message);
  } else if (existingApoyo) {
    console.log('Cuerpo de Apoyo ya existe. Actualizando nombre e información...');
    const { error: updErr } = await supabase
      .from('ministries')
      .update({
        name: apoyoName,
        description: apoyoDescription,
        category: 'servicio',
        theme_color: '#10B981',
        leader_name: 'Coordinador de Apoyo',
        schedule: 'Durante cultos y eventos especiales',
        image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80'
      })
      .eq('slug', apoyoSlug);
    if (updErr) console.error('Error al actualizar Cuerpo de Apoyo:', updErr.message);
    else console.log('Cuerpo de Apoyo actualizado con éxito.');
  } else {
    console.log('Cuerpo de Apoyo no existe. Insertando nuevo registro...');
    const { error: insErr } = await supabase
      .from('ministries')
      .insert({
        slug: apoyoSlug,
        name: apoyoName,
        description: apoyoDescription,
        category: 'servicio',
        theme_color: '#10B981',
        leader_name: 'Coordinador de Apoyo',
        schedule: 'Durante cultos y eventos especiales',
        image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80'
      });
    if (insErr) console.error('Error al insertar Cuerpo de Apoyo:', insErr.message);
    else console.log('Cuerpo de Apoyo insertado con éxito.');
  }

  // 3. Delete unused duplicate/extra ministries
  for (const slug of deleteSlugs) {
    const { data, error } = await supabase
      .from('ministries')
      .delete()
      .eq('slug', slug)
      .select();

    if (error) {
      console.error(`Error al eliminar ${slug}:`, error.message);
    } else {
      console.log(`Eliminado con éxito: ${slug} (Filas afectadas: ${data ? data.length : 0})`);
    }
  }

  console.log('--- Migración finalizada ---');
}

updateMinistries();
