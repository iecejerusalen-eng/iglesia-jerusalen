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
    process.exit(1);
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Credenciales de Supabase no encontradas en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map of ministries
const MINISTRY_MAP = {
  'cuerpo-ministerial': 'c3e726b2-6047-4948-a006-dc2036c64ff3',
  'dep-damas': '37de37d0-899f-48e5-83a1-145cdfab7ac1',
  'dep-caballeros': 'bb62b122-fb10-4f30-98fd-1a3e52d54477',
  'dep-jovenes': '967926bc-26ef-4834-b464-266eb33ad107',
  'dep-escuela-dominical': '20ebd8ab-6a12-4240-8391-f6d2b7e60ff1',
  'dep-cadetes': 'e04425bf-6fa7-499e-9426-9bf0eefae6f0',
  'dep-misiones-y-evangelismo': 'ce7dcbf4-1cdd-4494-b59f-1b2466889933'
};

const leadersData = [
  // 1. CUERPO DE APOYO MINISTERIAL
  { ministryKey: 'cuerpo-ministerial', role: 'Pastor', name: 'NICOLA OLVERA DAVID DANIEL' },
  { ministryKey: 'cuerpo-ministerial', role: 'Consejera del Dep de Damas', name: 'MIRANDA SANCHEZ BERTHA CORINA' },
  { ministryKey: 'cuerpo-ministerial', role: 'Consejero del Ministerio de Ujieres y encargado de Ujieres', name: 'GONZALEZ RUIZ PABLO SEALARDINO' },
  { ministryKey: 'cuerpo-ministerial', role: 'Consejero del Dep de Caballeros', name: 'PAÑORA RUIZ LUIS AMABLE' },
  { ministryKey: 'cuerpo-ministerial', role: 'Secretaria y Consejera del Dep de Jóvenes', name: 'ROSALES BELTRAN FELICITA' },
  { ministryKey: 'cuerpo-ministerial', role: 'Tesorero y Consejero del Ministerio de Alabanza', name: 'MUÑOZ CARBO FRANKLIN OMAR' },
  { ministryKey: 'cuerpo-ministerial', role: 'Consejero del Dep de Escuela Dominical', name: 'MURILLO VALENCIA FRANCISCO GUSTAVO' },

  // 2. DEPARTAMENTO DE DAMAS
  { ministryKey: 'dep-damas', role: 'Coordinadora', name: 'GONZALEZ FUENTES DHANIZA VERONICA' },
  { ministryKey: 'dep-damas', role: 'Sub-Coordinadora', name: 'ROMAN SILVA BETSABE NORENA' },
  { ministryKey: 'dep-damas', role: 'Secretaria', name: 'JESSENIA ISABEL LOPEZ CISNEROS' },
  { ministryKey: 'dep-damas', role: 'Tesorera', name: 'BARRETO GARCIA KARLA MARIUXI' },
  { ministryKey: 'dep-damas', role: 'Vocal 1', name: 'COELLO BRAVO DIXI NARCISA' },
  { ministryKey: 'dep-damas', role: 'Vocal 2', name: 'CRUZ ESPINOZA MAYRA' },

  // 3. DEPARTAMENTO DE CABALLEROS
  { ministryKey: 'dep-caballeros', role: 'Coordinador', name: 'MACIAS MORA SILVIO ARTURO' },
  { ministryKey: 'dep-caballeros', role: 'Sub-Coordinador', name: 'DOMINGUEZ EDISON' },
  { ministryKey: 'dep-caballeros', role: 'Secretario', name: 'MONSERRATE VILLAMAR WELLINGTON OMAR' },
  { ministryKey: 'dep-caballeros', role: 'Tesorero', name: 'PEPPER MACIAS MARIO ENRIQUE' },
  { ministryKey: 'dep-caballeros', role: 'Vocal 1', name: 'RIVAS RODAS FELIPE' },

  // 4. DEPARTAMENTO DE JÓVENES
  { ministryKey: 'dep-jovenes', role: 'Coordinadora', name: 'AZU PERLAZA STEFFANIA ESTHER' },
  { ministryKey: 'dep-jovenes', role: 'Sub-Coordinador', name: 'BERMEO ANDREA' },
  { ministryKey: 'dep-jovenes', role: 'Secretaria', name: 'LOZANO ACHANCI DAMARIS ANAHI' },
  { ministryKey: 'dep-jovenes', role: 'Tesorero', name: 'PAÑORA QUINTANA NERY ISARAEL' },
  { ministryKey: 'dep-jovenes', role: 'Vocal 1', name: 'ENCALADA ADRIAN' },
  { ministryKey: 'dep-jovenes', role: 'Vocal 2', name: 'MASAQUIZA MACIAS BELKI JOICE' },
  { ministryKey: 'dep-jovenes', role: 'Vocal 3', name: 'PEREZ GONZALEZ ISAAC' },

  // 5. DEPARTAMENTO DE ESCUELA DOMINICAL
  { ministryKey: 'dep-escuela-dominical', role: 'Superintendente', name: 'PLUAS RODRIGUEZ CARLOS WILFRIDO' },
  { ministryKey: 'dep-escuela-dominical', role: 'Secretaria', name: 'VILLALTA TABITA' },

  // 6. DEPARTAMENTO DE CADETES
  { ministryKey: 'dep-cadetes', role: 'Coordinadora', name: 'ALVARADO GUERRERO MARY CRUZ' },
  { ministryKey: 'dep-cadetes', role: 'Secretaria', name: 'MACIAS ALVARADO RAQUEL MAGDALENA' },
  { ministryKey: 'dep-cadetes', role: 'Tesorera', name: 'ARISTEGA RONQUILLO LILA DONNINA' },
  { ministryKey: 'dep-cadetes', role: 'Vocal 1', name: 'DELGADO DOMINGUEZ MANUEL' },
  { ministryKey: 'dep-cadetes', role: 'Vocal 2', name: 'PLUAS SARVIA LUCIA ALAIS' },
  { ministryKey: 'dep-cadetes', role: 'Vocal 3', name: 'JAIME FLORES JESSENIA MARLENE' },

  // 7. DEPARTAMENTO DE EVANGELISMO Y MISIONES
  { ministryKey: 'dep-misiones-y-evangelismo', role: 'Coordinador', name: 'NICOLA OLVERA DAVID DANIEL' },
  { ministryKey: 'dep-misiones-y-evangelismo', role: 'Sub-Coordinador', name: 'MASAQUIZA LOPEZ CARLOS NAPOLEON' },
  { ministryKey: 'dep-misiones-y-evangelismo', role: 'Secretaria', name: 'ROSALES BELTRAN FELICITA' },
  { ministryKey: 'dep-misiones-y-evangelismo', role: 'Tesorero', name: 'DELGADO DOMINGUEZ MANUEL' },
  { ministryKey: 'dep-misiones-y-evangelismo', role: 'Vocal 1', name: 'DOMINGUEZ CHAVEZ EDISON' }
];

async function seed() {
  console.log('--- Iniciando Sembrado de Líderes de Departamentos ---');

  // Clear existing leaders for these ministries
  const ministryIds = Object.values(MINISTRY_MAP);
  console.log('Limpiando registros antiguos de directiva...');
  const { error: clearError } = await supabase
    .from('ministry_members')
    .delete()
    .in('ministry_id', ministryIds);

  if (clearError) {
    console.error('Error al limpiar registros antiguos:', clearError.message);
    process.exit(1);
  }

  console.log('Insertando nuevos directivos...');
  const insertPayload = leadersData.map(l => ({
    ministry_id: MINISTRY_MAP[l.ministryKey],
    role: l.role,
    member_name: l.name
  }));

  const { data: insertedData, error: insertError } = await supabase
    .from('ministry_members')
    .insert(insertPayload)
    .select();

  if (insertError) {
    console.error('Error al insertar directivos:', insertError.message);
    process.exit(1);
  }

  console.log(`¡Sembrado completado con éxito! Se insertaron ${insertedData.length} directivos.`);
  
  // Show how many linked automatically
  const linked = insertedData.filter(d => d.member_id !== null);
  console.log(`\nVinculados automáticamente por coincidencia de nombre en CRM: ${linked.length}`);
  linked.forEach(l => {
    console.log(` - Rol "${l.role}" enlazado con ID de miembro ${l.member_id} (Nombre: "${l.member_name}")`);
  });
}

seed();
