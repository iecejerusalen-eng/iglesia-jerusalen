import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanNbsp(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/&nbsp;/g, ' ').replace(/&nbsp/g, ' ');
}

async function fix() {
  console.log('Limpiando &nbsp; en la tabla sermons...');
  const { data: sermons, error } = await supabase.from('sermons').select('*');
  if (error) {
    console.error('Error al obtener prédicas:', error);
    return;
  }

  let updatedCount = 0;
  for (const s of sermons) {
    let modified = false;
    const updates = {};

    if (s.description && (s.description.includes('&nbsp;') || s.description.includes('&nbsp'))) {
      updates.description = cleanNbsp(s.description);
      modified = true;
    }

    if (s.title && (s.title.includes('&nbsp;') || s.title.includes('&nbsp'))) {
      updates.title = cleanNbsp(s.title);
      modified = true;
    }

    if (s.passage && (s.passage.includes('&nbsp;') || s.passage.includes('&nbsp'))) {
      updates.passage = cleanNbsp(s.passage);
      modified = true;
    }

    if (modified) {
      console.log(`Actualizando prédica ID: ${s.id} - ${s.title}`);
      console.log('Anterior description:', s.description);
      console.log('Nueva description:', updates.description || s.description);

      const { error: updateError } = await supabase
        .from('sermons')
        .update(updates)
        .eq('id', s.id);

      if (updateError) {
        console.error(`Error actualizando prédica ${s.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`¡Listo! Se actualizaron ${updatedCount} prédica(s).`);
}

fix();
