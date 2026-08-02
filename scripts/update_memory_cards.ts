import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env natively
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

const memoryCards = [
  { pair_name: 'Arca de Noé', image_url: '/images/games/memory_match/noahs_ark.png' },
  { pair_name: 'Cruz de Jesús', image_url: '/images/games/memory_match/cross_jesus.png' },
  { pair_name: 'Tablas de la Ley', image_url: '/images/games/memory_match/ten_commandments.png' },
  { pair_name: 'Paloma (Espíritu Santo)', image_url: '/images/games/memory_match/holy_spirit_dove.png' },
  { pair_name: 'León de Judá', image_url: '/images/games/memory_match/lion_of_judah.png' },
  { pair_name: 'Pez (Ichthys)', image_url: '/images/games/memory_match/christian_fish.png' },
  { pair_name: 'Corona de Espinas', image_url: '/images/games/memory_match/crown_thorns.png' },
  { pair_name: 'Estrella de Belén', image_url: '/images/games/memory_match/star_bethlehem.png' }
];

async function updateMemoryCards() {
  console.log('Actualizando imágenes de las cartas de memoria...');
  let successCount = 0;
  
  for (const card of memoryCards) {
    const { error } = await supabase
      .from('game_memory_cards')
      .update({ image_url: card.image_url })
      .eq('pair_name', card.pair_name);
      
    if (error) {
      console.error(`Error actualizando ${card.pair_name}:`, error.message);
    } else {
      successCount++;
    }
  }
  
  console.log(`¡Proceso completado! ${successCount}/${memoryCards.length} cartas actualizadas.`);
}

updateMemoryCards();
