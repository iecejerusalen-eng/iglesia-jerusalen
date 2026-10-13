// Explicit initial import only: existing drafts/public editions are never overwritten.
// Run with Node 22+ and server-side Supabase env variables. Never ship service_role to the browser.
import { createClient } from '@supabase/supabase-js';
import { defaultLearningDocuments } from '../src/features/about/defaultLearningDocuments.ts';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the initial import.');
const client = createClient(url, key, { auth: { persistSession: false } });
for (const document of defaultLearningDocuments) {
  const draft = structuredClone(document);
  if (draft.content.audio) draft.content.audio.authorization = 'Enlace/incrustación de una publicación externa de YouTube, a petición del usuario. Sin descarga ni atribución a Jerusalén.';
  const imported = await client.from('about_learning_drafts').upsert(draft, { onConflict: 'slug', ignoreDuplicates: true });
  if (imported.error) throw imported.error;
  const existing = await client.from('about_learning_drafts').select('slug,title,summary,author_label,content,sources,revision').eq('slug', draft.slug).single();
  if (existing.error) throw existing.error;
  const published = structuredClone(existing.data);
  if (published.content.audio) delete published.content.audio.authorization;
  const importedPublic = await client.from('about_learning_published').upsert(published, { onConflict: 'slug', ignoreDuplicates: true });
  if (importedPublic.error) throw importedPublic.error;
  console.log(`Verified import: ${draft.slug}`);
}
