import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const applyChanges = process.argv.includes('--apply');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const targets = [
  { id: 'ea102711-bb05-43b1-b4c3-93ee65e8a2b2', title: 'Cantaré de tu Amor por Siempre' },
  { id: '135768e5-6fcf-44dc-94b3-a171acbb7303', title: 'Cuán Grande es Él' },
  { id: '565a11ee-f378-42e8-9381-ff88cbfd1c82', title: 'Tú estás aquí' },
];

const { data: songs, error: fetchError } = await supabase
  .from('songs')
  .select('id,title,artist,lyrics,has_chords,structure_blocks')
  .in('id', targets.map((target) => target.id));

if (fetchError) {
  console.error('No se pudieron leer las canciones que necesitan reparación:', fetchError);
  process.exit(1);
}

if (songs.length !== targets.length) {
  console.error(`Se esperaban ${targets.length} canciones y se encontraron ${songs.length}. No se aplicaron cambios.`);
  process.exit(1);
}

const replaceSectionLabel = (lyrics, source, replacement) => lyrics.replace(
  new RegExp(`(?:<p[^>]*>\\s*)?\\[${source}\\](?:\\s*</p>)?`, 'gi'),
  `<h2>${replacement}</h2>`,
);

const repairs = songs.map((song) => {
  let lyrics = song.lyrics ?? '';

  if (song.id === 'ea102711-bb05-43b1-b4c3-93ee65e8a2b2') {
    lyrics = lyrics.replace(
      /<ruby\b([^>]*data-chord=["']F["'][^>]*)>F<\/rt><\/ruby>/i,
      '<ruby$1>ré<rt class="chord-name">F</rt></ruby>',
    );
  }

  lyrics = replaceSectionLabel(lyrics, 'Verse 1', 'Estrofa 1');
  lyrics = replaceSectionLabel(lyrics, 'Verse 2', 'Estrofa 2');
  lyrics = replaceSectionLabel(lyrics, 'Chorus', 'Coro');
  lyrics = replaceSectionLabel(lyrics, 'Bridge', 'Puente');

  return {
    id: song.id,
    title: song.title,
    before: song.lyrics,
    after: lyrics,
    changed: lyrics !== song.lyrics,
  };
});

const unchanged = repairs.filter((repair) => !repair.changed);
if (unchanged.length > 0) {
  console.error('No coincidió el contenido esperado para:', unchanged.map((repair) => repair.title));
  process.exit(1);
}

console.log(JSON.stringify({
  mode: applyChanges ? 'apply' : 'dry-run',
  changes: repairs.map(({ id, title, changed }) => ({ id, title, changed })),
}, null, 2));

if (applyChanges) {
  const backupDirectory = path.resolve('backups');
  await fs.mkdir(backupDirectory, { recursive: true });
  const backupPath = path.join(backupDirectory, `songs-formatting-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(backupPath, JSON.stringify(songs, null, 2), 'utf8');

  for (const repair of repairs) {
    const { error: updateError } = await supabase
      .from('songs')
      .update({ lyrics: repair.after })
      .eq('id', repair.id);

    if (updateError) {
      throw new Error(`Falló la actualización de "${repair.title}". Respaldo: ${backupPath}. ${updateError.message}`);
    }
  }

  console.log(`Reparaciones aplicadas. Respaldo: ${backupPath}`);
}
