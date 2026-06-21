import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqtatqekfrswvplemknc.supabase.co';
const supabaseKey = 'sb_publishable_qByEe2fjQaWn3v-gPoY8EQ_gPbYxjtJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin(syntax, label) {
  console.log(`--- Testing: ${label} (${syntax}) ---`);
  try {
    const { data, error } = await supabase
      .from('lms_enrollment_requests')
      .select(syntax)
      .limit(1);
    if (error) {
      console.log("Error:", error.message);
    } else {
      console.log("Success! Keys in first item:", Object.keys(data?.[0] || {}));
    }
  } catch (err) {
    console.log("Exception:", err.message);
  }
}

async function run() {
  // Test 1: Original syntax
  await testJoin(`*, lms_courses(title), profiles:user_id(first_name, last_name, email)`, "Original");

  // Test 2: Standard PostgREST join on table name
  await testJoin(`*, lms_courses(title), profiles(first_name, last_name, email)`, "Standard table name");

  // Test 3: Standard PostgREST join with foreign key column reference
  await testJoin(`*, lms_courses(title), profiles!user_id(first_name, last_name, email)`, "Table name with bang column name");
  
  // Test 4: Check if user_id points to profiles
  await testJoin(`*, lms_courses(title), profiles!lms_enrollment_requests_user_id_fkey(first_name, last_name, email)`, "Using explicit constraint name (if any)");
}

run();
