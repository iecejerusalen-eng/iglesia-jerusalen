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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonAccess() {
  console.log('Testing SELECT on members with anon key...');
  const { data: members, error: memErr } = await supabase
    .from('members')
    .select('id, first_name')
    .limit(1);

  if (memErr) {
    console.error('SELECT on members failed:', memErr.message);
  } else {
    console.log('SELECT on members succeeded. Count:', members.length);
  }

  console.log('\nTesting SELECT on member_emails with anon key...');
  const { data: emails, error: emailErr } = await supabase
    .from('member_emails')
    .select('*')
    .limit(1);

  if (emailErr) {
    console.error('SELECT on member_emails failed:', emailErr.message);
  } else {
    console.log('SELECT on member_emails succeeded. Count:', emails.length);
  }

  if (members && members.length > 0) {
    const testMemberId = members[0].id;
    console.log(`\nTesting INSERT on member_emails with anon key for member ${testMemberId}...`);
    const { data: insData, error: insErr } = await supabase
      .from('member_emails')
      .insert({ member_id: testMemberId, email: `anon_test_${Date.now()}@example.com` })
      .select();

    if (insErr) {
      console.error('INSERT on member_emails failed:', insErr.message, insErr);
    } else {
      console.log('INSERT on member_emails succeeded:', insData);
      
      // Cleanup
      const { error: delErr } = await supabase
        .from('member_emails')
        .delete()
        .eq('id', insData[0].id);
      if (delErr) {
        console.error('Cleanup DELETE on member_emails failed:', delErr.message);
      } else {
        console.log('Cleanup DELETE on member_emails succeeded.');
      }
    }
  }
}

testAnonAccess();
