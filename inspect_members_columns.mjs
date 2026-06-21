import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

async function inspect() {
  try {
    const envFile = await fs.readFile('./.env.local', 'utf-8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const parts = line.trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = value;
      }
    });

    const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('Env variables not found. Keys read:', Object.keys(env));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      console.log('Columns in members table:', Object.keys(data[0] || {}));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

inspect();
