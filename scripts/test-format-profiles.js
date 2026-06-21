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
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Iniciando prueba de trigger de auto-formato de nombres en public.profiles...');

  // 1. Obtener un perfil existente para probar
  const { data: profiles, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (fetchErr || !profiles || profiles.length === 0) {
    console.error('No se pudo obtener ningún perfil existente para la prueba:', fetchErr?.message);
    return;
  }

  const targetProfile = profiles[0];
  console.log(`\nPerfil seleccionado para prueba: ID: ${targetProfile.id}`);
  console.log(`Nombre original: "${targetProfile.first_name}"`);
  console.log(`Apellido original: "${targetProfile.last_name}"`);

  const originalFirstName = targetProfile.first_name;
  const originalLastName = targetProfile.last_name;

  // 2. Intentar actualizar a un formato desordenado
  console.log('\nActualizando perfil con formato incorrecto y espacios adicionales...');
  const testFirstName = '   mArThA   gEoRgEt   ';
  const testLastName = '   eSpInOsA   gOnZaLeZ   ';

  const { data: updated, error: updateErr } = await supabase
    .from('profiles')
    .update({ first_name: testFirstName, last_name: testLastName })
    .eq('id', targetProfile.id)
    .select()
    .single();

  if (updateErr) {
    console.error('Error al actualizar el perfil:', updateErr.message);
    return;
  }

  console.log('\nPerfil actualizado.');
  console.log(`Nombre guardado en BD: "${updated.first_name}"`);
  console.log(`Apellido guardado en BD: "${updated.last_name}"`);

  const expectedFirstName = 'Martha Georget';
  const expectedLastName = 'Espinosa Gonzalez';

  const isFormatted = 
    updated.first_name === expectedFirstName && 
    updated.last_name === expectedLastName;

  if (isFormatted) {
    console.log('\n¡ÉXITO! El trigger en public.profiles formateó los nombres correctamente a Title Case y limpió los espacios.');
  } else {
    console.log('\n[!] ADVERTENCIA: Los nombres en public.profiles no fueron formateados. El trigger no está activo para esta tabla.');
  }

  // 3. Restaurar los valores originales del perfil
  console.log('\nRestaurando valores originales del perfil...');
  const { error: restoreErr } = await supabase
    .from('profiles')
    .update({ first_name: originalFirstName, last_name: originalLastName })
    .eq('id', targetProfile.id);

  if (restoreErr) {
    console.error('Error al restaurar los valores originales:', restoreErr.message);
  } else {
    console.log('Valores originales restaurados con éxito.');
  }
}

runTest();
