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

async function run() {
  const email = 'test_admin_debug@example.com';
  const password = 'Password123!';

  console.log(`Checking if user ${email} already exists...`);
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  let user = usersData.users.find(u => u.email === email);
  if (user) {
    console.log(`User already exists with ID: ${user.id}`);
  } else {
    console.log(`Creating user ${email}...`);
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }
    user = created.user;
    console.log(`User created with ID: ${user.id}`);
  }

  console.log(`Updating profile for user ${user.id} to be an admin...`);
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email,
      first_name: 'Debug',
      last_name: 'Admin',
      role: 'admin'
    });

  if (profileError) {
    console.error('Error updating profile:', profileError.message);
  } else {
    console.log('Profile successfully configured as admin.');
  }
}

run();
