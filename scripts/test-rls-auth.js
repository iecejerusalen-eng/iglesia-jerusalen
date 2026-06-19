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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runDiagnostics() {
  const testEmail = `test_diag_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let testUserId = null;

  try {
    console.log(`1. Creating temporary test user: ${testEmail}...`);
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (userError) throw userError;
    testUserId = userData.user.id;
    console.log(`   User created successfully with ID: ${testUserId}`);

    console.log(`2. Creating admin profile for user in public.profiles...`);
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: testUserId,
        first_name: 'Diag',
        last_name: 'Admin',
        role: 'admin'
      });

    if (profileError) throw profileError;
    console.log(`   Profile created successfully.`);

    console.log(`3. Signing in as test user using client-side anon key...`);
    const { data: sessionData, error: signInError } = await client.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) throw signInError;
    console.log(`   Signed in successfully! Session established.`);

    // Test SELECT members
    console.log(`\n4. Testing SELECT on members table...`);
    const { data: members, error: memSelErr } = await client
      .from('members')
      .select('id, first_name, dni')
      .is('deleted_at', null)
      .limit(5);
    
    if (memSelErr) {
      console.error(`❌ SELECT members failed:`, memSelErr);
    } else {
      console.log(`✅ SELECT members succeeded. Count: ${members.length}`);
      if (members.length > 0) {
        console.log('Sample members returned:');
        members.forEach(m => console.log(`   - Name: ${m.first_name}, DNI: ${m.dni}, ID: ${m.id}`));
      }
    }

    // Generate mock member payload
    const testMemberId = crypto.randomUUID();
    const testDni = `diag_${Date.now()}`.substring(0, 10);
    console.log(`\n5. Testing INSERT on members table with ID: ${testMemberId}...`);
    const { error: memInsErr } = await client
      .from('members')
      .insert({
        id: testMemberId,
        first_name: 'Diag',
        last_name: 'Member',
        dni: testDni
      });

    if (memInsErr) {
      console.error(`❌ INSERT member failed:`, memInsErr);
    } else {
      console.log(`✅ INSERT member succeeded.`);

      // If insert member succeeded, test relation table inserts
      
      // A. member_emails
      console.log(`\n6. Testing INSERT on member_emails...`);
      const { error: emailInsErr } = await client
        .from('member_emails')
        .insert({
          member_id: testMemberId,
          email: `diag_email_${Date.now()}@example.com`
        });
      
      if (emailInsErr) {
        console.error(`❌ INSERT member_emails failed:`, emailInsErr);
      } else {
        console.log(`✅ INSERT member_emails succeeded.`);
        
        // Test DELETE on member_emails
        console.log(`   Testing DELETE on member_emails...`);
        const { error: emailDelErr } = await client
          .from('member_emails')
          .delete()
          .eq('member_id', testMemberId);
        
        if (emailDelErr) {
          console.error(`   ❌ DELETE member_emails failed:`, emailDelErr);
        } else {
          console.log(`   ✅ DELETE member_emails succeeded.`);
        }
      }

      // B. member_service_areas
      console.log(`\n7. Testing INSERT on member_service_areas...`);
      // Get a catalog_role ID first if available
      const { data: roles } = await client.from('catalog_roles').select('id, category').limit(5);
      const areaRole = roles?.find(r => r.category === 'Área de Servicios') || roles?.[0];
      
      if (areaRole) {
        const { error: areaInsErr } = await client
          .from('member_service_areas')
          .insert({
            member_id: testMemberId,
            service_area_id: areaRole.id
          });
        
        if (areaInsErr) {
          console.error(`❌ INSERT member_service_areas failed:`, areaInsErr);
        } else {
          console.log(`✅ INSERT member_service_areas succeeded.`);
        }
      } else {
        console.log(`⚠️ No catalog_roles found to test member_service_areas.`);
      }

      // C. member_talents
      console.log(`\n8. Testing INSERT on member_talents...`);
      const talentRole = roles?.find(r => r.category === 'Talentos') || roles?.[1];
      if (talentRole) {
        const { error: talentInsErr } = await client
          .from('member_talents')
          .insert({
            member_id: testMemberId,
            talent_id: talentRole.id
          });
        
        if (talentInsErr) {
          console.error(`❌ INSERT member_talents failed:`, talentInsErr);
        } else {
          console.log(`✅ INSERT member_talents succeeded.`);
        }
      } else {
        console.log(`⚠️ No catalog_roles found to test member_talents.`);
      }

      // D. member_spiritual_gifts
      console.log(`\n9. Testing INSERT on member_spiritual_gifts...`);
      const giftRole = roles?.find(r => r.category === 'Dones') || roles?.[2];
      if (giftRole) {
        const { error: giftInsErr } = await client
          .from('member_spiritual_gifts')
          .insert({
            member_id: testMemberId,
            gift_id: giftRole.id
          });
        
        if (giftInsErr) {
          console.error(`❌ INSERT member_spiritual_gifts failed:`, giftInsErr);
        } else {
          console.log(`✅ INSERT member_spiritual_gifts succeeded.`);
        }
      } else {
        console.log(`⚠️ No catalog_roles found to test member_spiritual_gifts.`);
      }

      // Cleanup member from server
      console.log(`\n10. Cleaning up mock member...`);
      const { error: memDelErr } = await adminClient.from('members').delete().eq('id', testMemberId);
      if (memDelErr) {
        console.error(`❌ Cleanup delete of members failed:`, memDelErr.message);
      } else {
        console.log(`✅ Cleanup delete of members succeeded.`);
      }
    }

  } catch (err) {
    console.error('Fatal error during diagnostics:', err);
  } finally {
    if (testUserId) {
      console.log(`\n11. Cleaning up test user and profile for ID: ${testUserId}...`);
      await adminClient.from('profiles').delete().eq('id', testUserId);
      const { error: cleanupErr } = await adminClient.auth.admin.deleteUser(testUserId);
      if (cleanupErr) {
        console.error(`❌ Cleanup delete of user failed:`, cleanupErr.message);
      } else {
        console.log(`✅ Cleanup delete of user succeeded.`);
      }
    }
  }
}

runDiagnostics();
