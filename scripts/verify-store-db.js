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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gqtatqekfrswvplemknc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY no está definida.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStoreDB() {
  console.log('Verificando tablas del E-commerce en:', supabaseUrl);

  // 1. Verificar tabla products y sus nuevas columnas
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (prodError) {
    console.error('Error al leer de "products":', prodError);
  } else {
    console.log('¡Conexión a "products" exitosa! Registro de ejemplo:', prodData);
  }

  // 2. Verificar tabla product_variants
  const { data: varData, error: varError } = await supabase
    .from('product_variants')
    .select('*')
    .limit(1);

  if (varError) {
    console.error('Error al leer de "product_variants" (posiblemente no existe o no tiene permisos):', varError);
  } else {
    console.log('¡Tabla "product_variants" encontrada! Registro de ejemplo:', varData);
  }

  // 3. Verificar tabla product_digital_assets
  const { data: assetData, error: assetError } = await supabase
    .from('product_digital_assets')
    .select('*')
    .limit(1);

  if (assetError) {
    console.error('Error al leer de "product_digital_assets":', assetError);
  } else {
    console.log('¡Tabla "product_digital_assets" encontrada! Registro de ejemplo:', assetData);
  }

  // 4. Verificar columnas en orders
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (orderError) {
    console.error('Error al leer de "orders":', orderError);
  } else {
    console.log('¡Tabla "orders" encontrada! Registro de ejemplo:', orderData);
  }
}

verifyStoreDB();
