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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const gamesUpdates = [
  { slug: 'quien-quiere-ser-biblionario', image_url: '/images/games/biblionario_cover.png' },
  { slug: 'ahorcado-biblico', image_url: '/images/games/ahorcado_biblico_cover.png' },
  { slug: 'memorama-biblico', image_url: '/images/games/memory_match_cover.png' },
  { slug: 'descubre-el-personaje', image_url: '/images/games/descubre_personaje_cover.png' }
];

async function updateGamesTable() {
  console.log('Actualizando imágenes de la tabla games...');
  let successCount = 0;
  
  for (const game of gamesUpdates) {
    const { error } = await supabase
      .from('games')
      .update({ image_url: game.image_url })
      .eq('slug', game.slug);
      
    if (error) {
      console.error(`Error actualizando ${game.slug}:`, error.message);
    } else {
      successCount++;
    }
  }
  
  console.log(`¡Proceso completado! ${successCount}/${gamesUpdates.length} juegos actualizados en el catálogo.`);
}

updateGamesTable();
