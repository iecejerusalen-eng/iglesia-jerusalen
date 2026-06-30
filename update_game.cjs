const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMemoramaImage() {
  const newImageUrl = 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=800&auto=format&fit=crop';
  
  const { data, error } = await supabase
    .from('games')
    .update({ image_url: newImageUrl })
    .eq('slug', 'memorama-biblico');

  if (error) {
    console.error('Error updating image:', error);
  } else {
    console.log('Successfully updated Memorama Bíblico image!');
  }
}

updateMemoramaImage();
