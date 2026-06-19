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

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY no está definida en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemaAndPolicies() {
  const tables = [
    'members',
    'member_emails',
    'member_service_areas',
    'member_talents',
    'member_spiritual_gifts'
  ];

  console.log('--- COLUMNS INFO ---');
  for (const table of tables) {
    const { data: cols, error: colsErr } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', table)
      .eq('table_schema', 'public');
    
    if (colsErr) {
      // Fallback via direct query if information_schema query fails/is blocked
      console.error(`Error checking columns for ${table}:`, colsErr.message);
    } else {
      console.log(`Columns for "${table}":`);
      cols.forEach(c => {
        console.log(`  - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
      });
    }
  }

  console.log('\n--- RLS POLICIES INFO ---');
  // Query pg_policies to see what permissions exist on the tables
  const { data: policies, error: polErr } = await supabase
    .rpc('execute_sql_query', { 
      query_text: `
        SELECT tablename, policyname, cmd, roles, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename IN ('members', 'member_emails', 'member_service_areas', 'member_talents', 'member_spiritual_gifts');
      ` 
    });

  if (polErr) {
    // If the RPC doesn't exist, let's try direct postgres table query if allowed, or we can check with service role via raw query
    console.log('execute_sql_query RPC not available. Trying to fetch pg_policies through standard select if views are mapped...');
    // We can also execute query by creating a temporary function or just checking if we have any other way.
    // Let's query using standard table select if we mapped a view, but usually we don't.
    // Let's try to query pg_policies using custom select (sometimes supabase exposes it or we can run custom sql)
    const { data: directPol, error: directPolErr } = await supabase.rpc('get_policies');
    if (directPolErr) {
      console.error('Could not fetch policies via RPC:', directPolErr.message);
      
      // Let's run a generic select query if possible
      console.log('Trying to inspect policies using a manual method or we can write a function to return it.');
    } else {
      console.log('Policies:', directPol);
    }
  } else {
    console.log('Policies found via execute_sql_query:');
    console.table(policies);
  }

  // Let's list triggers or other constraints on member_emails
  console.log('\n--- TESTING MOCK INSERT ON member_emails WITH SERVICE ROLE ---');
  // First, get a real member id to test
  const { data: membersList, error: memErr } = await supabase.from('members').select('id, first_name').limit(1);
  if (memErr) {
    console.error('Error fetching a member:', memErr.message);
    return;
  }
  if (membersList.length === 0) {
    console.log('No members in the database. Cannot test insert.');
    return;
  }

  const testMemberId = membersList[0].id;
  console.log(`Using member "${membersList[0].first_name}" with ID: ${testMemberId} for mock insert test.`);

  // Test insert email
  const testEmail = `test_${Date.now()}@example.com`;
  const { data: insData, error: insErr } = await supabase
    .from('member_emails')
    .insert({ member_id: testMemberId, email: testEmail })
    .select();

  if (insErr) {
    console.error('Mock insert to member_emails failed:', insErr);
  } else {
    console.log('Mock insert succeeded:', insData);
    // Cleanup
    const { error: delErr } = await supabase
      .from('member_emails')
      .delete()
      .eq('member_id', testMemberId)
      .eq('email', testEmail);
    if (delErr) {
      console.error('Cleanup delete failed:', delErr.message);
    } else {
      console.log('Cleanup delete succeeded.');
    }
  }
}

checkSchemaAndPolicies();
