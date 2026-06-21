import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqtatqekfrswvplemknc.supabase.co';
const supabaseKey = 'sb_publishable_qByEe2fjQaWn3v-gPoY8EQ_gPbYxjtJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Testing profiles join to members ---");
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      member_id,
      members:member_id (
        phone,
        emergency_contact_name,
        emergency_contact_phone,
        medical_notes
      )
    `)
    .limit(1);
  if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("Success! Data:", data);
  }
}

run();
