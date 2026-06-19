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

async function inspectReferences() {
  console.log('--- Inspecting ministries and references ---');
  
  // Fetch ministries
  const { data: ministries, error } = await supabase.from('ministries').select('*');
  if (error) {
    console.error('Error fetching ministries:', error.message);
    return;
  }
  
  console.log(`Total ministries: ${ministries.length}`);
  
  for (const min of ministries) {
    console.log(`Ministry ID: ${min.id} | Slug: ${min.slug} | Name: ${min.name}`);
    
    // Check profiles referencing this ministry
    const { count: profileCount, error: errP } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('ministry_id', min.id);
    
    // Check members referencing this ministry
    const { count: memberCount, error: errM } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('ministry_id', min.id);
      
    // Check events referencing this ministry
    const { count: eventCount, error: errE } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('ministry_id', min.id);
      
    // Check logos referencing this ministry
    const { count: logoCount, error: errL } = await supabase
      .from('logos')
      .select('*', { count: 'exact', head: true })
      .eq('ministry_id', min.id);
      
    console.log(`  -> Profiles: ${profileCount || 0}, Members: ${memberCount || 0}, Events: ${eventCount || 0}, Logos: ${logoCount || 0}`);
  }
}

inspectReferences();
