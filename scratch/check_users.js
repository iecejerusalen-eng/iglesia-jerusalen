import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqtatqekfrswvplemknc.supabase.co';
const supabaseAnonKey = 'sb_publishable_qByEe2fjQaWn3v-gPoY8EQ_gPbYxjtJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .limit(10);
    
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles in DB:', data);
  }
}

checkUsers();
