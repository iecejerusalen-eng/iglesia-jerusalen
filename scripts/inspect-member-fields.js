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

async function inspect() {
  console.log('--- inspect members ---');
  const { data: members, error } = await supabase.from('members').select('*').limit(1);
  if (error) {
    console.error('Error fetching members:', error.message);
  } else if (members && members.length > 0) {
    console.log('Keys for members:', Object.keys(members[0]));
    console.log('Sample member:', members[0]);
  } else {
    console.log('No members found');
  }

  console.log('\n--- inspect member_service_areas ---');
  const { data: areas, error: error2 } = await supabase.from('member_service_areas').select('*').limit(1);
  if (error2) {
    console.error('Error fetching member_service_areas:', error2.message);
  } else if (areas && areas.length > 0) {
    console.log('Keys for member_service_areas:', Object.keys(areas[0]));
    console.log('Sample area:', areas[0]);
  } else {
    console.log('No service areas found');
  }
  
  console.log('\n--- inspect profiles ---');
  const { data: profiles, error: error3 } = await supabase.from('profiles').select('*').limit(1);
  if (error3) {
    console.error('Error fetching profiles:', error3.message);
  } else if (profiles && profiles.length > 0) {
    console.log('Keys for profiles:', Object.keys(profiles[0]));
    console.log('Sample profile:', profiles[0]);
  } else {
    console.log('No profiles found');
  }
}

inspect();
