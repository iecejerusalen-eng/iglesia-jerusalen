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

async function setAdmin() {
  const targetEmail = 'estebanico10@gmail.com';
  console.log(`Searching for profile with email: ${targetEmail}...`);

  const { data: profiles, error: findError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, email')
    .eq('email', targetEmail);

  if (findError) {
    console.error('Error searching for profile:', findError.message);
    return;
  }

  if (profiles.length === 0) {
    console.log(`No profile found with email: ${targetEmail}. Searching by auth.users...`);
    // Fallback: If email is not in profiles, search auth.users (requires service role admin API)
    const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error listing auth users:', userError.message);
      return;
    }
    const user = usersData.users.find(u => u.email === targetEmail);
    if (!user) {
      console.error(`User not found in auth.users either for email: ${targetEmail}`);
      return;
    }
    console.log(`Found auth user with ID: ${user.id}. Creating/updating profile...`);
    
    const { data: newProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: targetEmail,
        first_name: user.user_metadata?.first_name || 'Esteban',
        last_name: user.user_metadata?.last_name || '',
        role: 'admin'
      })
      .select();

    if (upsertError) {
      console.error('Error creating profile as admin:', upsertError.message);
    } else {
      console.log('Successfully created profile and set role to admin!', newProfile);
    }
  } else {
    const profile = profiles[0];
    console.log(`Found profile: ${profile.first_name} ${profile.last_name} (ID: ${profile.id}, Current Role: ${profile.role})`);
    
    console.log(`Updating role to 'admin'...`);
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id)
      .select();

    if (updateError) {
      console.error('Error updating role:', updateError.message);
    } else {
      console.log('Successfully updated user role to admin!', updated);
    }
  }
}

setAdmin();
