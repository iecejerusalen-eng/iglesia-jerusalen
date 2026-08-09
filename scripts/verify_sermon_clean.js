import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const { data: sermon } = await supabase
    .from('sermons')
    .select('*')
    .eq('id', 'da25504d-0123-4f2c-af09-fce5ac49516a')
    .single();

  if (sermon) {
    const cleanDesc = sermon.description.replace(/\s+/g, ' ');
    await supabase
      .from('sermons')
      .update({ description: cleanDesc })
      .eq('id', sermon.id);

    console.log('Descripción final verificada y limpia:');
    console.log(cleanDesc);
  }
}

verify();
