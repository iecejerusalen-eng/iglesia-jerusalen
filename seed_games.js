import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.loadEnvFile(path.resolve(__dirname, '.env.local'));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables de entorno: VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const games = [
  {
    title: 'Quién quiere ser Biblionario',
    description: 'Pon a prueba tus conocimientos bíblicos, supera los niveles y conviértete en el mayor experto en las Escrituras.',
    image_url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=800&auto=format&fit=crop',
    slug: 'quien-quiere-ser-biblionario',
    is_active: true
  },
  {
    title: 'Ahorcado Bíblico',
    description: 'Adivina los nombres de personajes, ciudades y libros bíblicos antes de quedarte sin intentos.',
    image_url: 'https://images.unsplash.com/photo-1515549832467-8783363e19b6?q=80&w=800&auto=format&fit=crop',
    slug: 'ahorcado-biblico',
    is_active: true
  },
  {
    title: 'Memorama Bíblico',
    description: 'Entrena tu memoria encontrando las parejas de personajes, objetos y conceptos de la Biblia.',
    image_url: 'https://images.unsplash.com/photo-1606513542745-976ed960c184?q=80&w=800&auto=format&fit=crop',
    slug: 'memorama-biblico',
    is_active: true
  }
];

async function seedGames() {
  console.log("Seeding games...");
  
  for (const game of games) {
    const { data, error } = await supabase
      .from('games')
      .upsert(game, { onConflict: 'slug' });
      
    if (error) {
      console.error(`Error inserting game ${game.slug}:`, error);
    } else {
      console.log(`Inserted/Updated game: ${game.slug}`);
    }
  }
  
  console.log("Seeding games completed.");
}

seedGames();
