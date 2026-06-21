import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqtatqekfrswvplemknc.supabase.co';
const supabaseKey = 'sb_publishable_qByEe2fjQaWn3v-gPoY8EQ_gPbYxjtJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Testing lms_enrollments join to profiles:user_id ---");
  const { data, error } = await supabase
    .from('lms_enrollments')
    .select(`
      user_id,
      profiles:user_id (
        first_name,
        last_name,
        email
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
