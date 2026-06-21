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
  console.log('Iniciando prueba de trigger de auto-formato de nombres...');

  const tempDni = 'TEST' + Math.floor(100000 + Math.random() * 900000);
  const testMember = {
    first_name: '   jUaN   cArLoS   ',
    last_name: '   pÉrEz   gÓmEz   ',
    dni: tempDni,
    is_leader: false
  };

  console.log(`Insertando miembro de prueba con DNI: ${tempDni}`);
  console.log(`Nombre enviado: "${testMember.first_name}"`);
  console.log(`Apellido enviado: "${testMember.last_name}"`);

  // Insertar registro
  const { data: inserted, error: insertErr } = await supabase
    .from('members')
    .insert([testMember])
    .select()
    .single();

  if (insertErr) {
    console.error('Error al insertar el miembro de prueba:', insertErr.message, insertErr);
    return;
  }

  console.log('\nMiembro insertado exitosamente en la base de datos.');
  console.log(`Nombre guardado: "${inserted.first_name}"`);
  console.log(`Apellido guardado: "${inserted.last_name}"`);

  const expectedFirstName = 'Juan Carlos';
  const expectedLastName = 'Pérez Gómez';

  const isFormatted = 
    inserted.first_name === expectedFirstName && 
    inserted.last_name === expectedLastName;

  if (isFormatted) {
    console.log('\n¡ÉXITO! El trigger formateó los nombres correctamente a Title Case y limpió los espacios.');
  } else {
    console.log('\n[!] ADVERTENCIA: Los nombres no fueron formateados. Es probable que la migración SQL aún no haya sido aplicada en Supabase.');
  }

  // Limpiar registro de prueba
  console.log(`\nEliminando miembro de prueba con DNI ${tempDni}...`);
  const { error: deleteErr } = await supabase
    .from('members')
    .delete()
    .eq('id', inserted.id);

  if (deleteErr) {
    console.error('Error al limpiar el registro de prueba:', deleteErr.message);
  } else {
    console.log('Limpieza completada con éxito.');
  }
}

runTest();
