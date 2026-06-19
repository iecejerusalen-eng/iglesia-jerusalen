import { v2 as cloudinary } from 'cloudinary';
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
    process.exit(1);
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

const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Error: Credenciales de Cloudinary incompletas en .env.local');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Credenciales de Supabase incompletas en .env.local');
  process.exit(1);
}

// Configurar Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

// Configurar Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Guardar los mapeos para referencia posterior
const migrationLog = {
  localAssets: {},
  databaseAssets: []
};

// Función para subir a Cloudinary (local o URL remota)
async function uploadToCloudinary(fileSource, folder, filenameOpt) {
  try {
    const options = {
      folder: `iglesia-jerusalen/${folder}`,
      resource_type: 'auto'
    };
    if (filenameOpt) {
      options.public_id = filenameOpt.split('.')[0];
    }
    const result = await cloudinary.uploader.upload(fileSource, options);
    console.log(`✓ Subido: ${fileSource.substring(0, 60)}... -> ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`✗ Error al subir ${fileSource}:`, err.message);
    return null;
  }
}

async function migrateLocalAssets() {
  console.log('\n--- 1. MIGRANDO ASSETS LOCALES ---');
  const localDirs = [
    { dir: path.resolve(__dirname, '../src/assets/Jerusalén'), folder: 'assets/Jerusalen' },
    { dir: path.resolve(__dirname, '../src/assets/logos'), folder: 'assets/logos' }
  ];

  for (const { dir, folder } of localDirs) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directorio no existe: ${dir}`);
      continue;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        console.log(`Subiendo asset local: ${file}`);
        const cloudinaryUrl = await uploadToCloudinary(fullPath, folder, file);
        if (cloudinaryUrl) {
          migrationLog.localAssets[file] = cloudinaryUrl;
        }
      }
    }
  }
}

async function migrateDatabaseAssets() {
  console.log('\n--- 2. MIGRANDO ASSETS DE LA BASE DE DATOS (SUPABASE STORAGE) ---');

  const supabaseDomain = 'supabase.co/storage/v1/object/public/';

  // A. Ministries
  console.log('\nMigrando tabla: ministries...');
  const { data: ministries, error: minErr } = await supabase.from('ministries').select('id, name, image_url');
  if (minErr) {
    console.error('Error al obtener ministries:', minErr.message);
  } else if (ministries) {
    for (const m of ministries) {
      if (m.image_url && m.image_url.includes(supabaseDomain)) {
        console.log(`Migrando imagen de ministerio: ${m.name} (${m.image_url})`);
        const cloudUrl = await uploadToCloudinary(m.image_url, 'ministries');
        if (cloudUrl) {
          const { error: updErr } = await supabase
            .from('ministries')
            .update({ image_url: cloudUrl })
            .eq('id', m.id);
          if (updErr) {
            console.error(`Error al actualizar DB para ministerio ${m.name}:`, updErr.message);
          } else {
            console.log(`✓ DB Actualizada para ministerio: ${m.name}`);
            migrationLog.databaseAssets.push({
              table: 'ministries',
              rowId: m.id,
              oldUrl: m.image_url,
              newUrl: cloudUrl
            });
          }
        }
      }
    }
  }

  // B. Events
  console.log('\nMigrando tabla: events...');
  const { data: events, error: evErr } = await supabase.from('events').select('id, title, cover_image_url');
  if (evErr) {
    console.error('Error al obtener events:', evErr.message);
  } else if (events) {
    for (const e of events) {
      if (e.cover_image_url && e.cover_image_url.includes(supabaseDomain)) {
        console.log(`Migrando imagen de evento: ${e.title} (${e.cover_image_url})`);
        const cloudUrl = await uploadToCloudinary(e.cover_image_url, 'events');
        if (cloudUrl) {
          const { error: updErr } = await supabase
            .from('events')
            .update({ cover_image_url: cloudUrl })
            .eq('id', e.id);
          if (updErr) {
            console.error(`Error al actualizar DB para evento ${e.title}:`, updErr.message);
          } else {
            console.log(`✓ DB Actualizada para evento: ${e.title}`);
            migrationLog.databaseAssets.push({
              table: 'events',
              rowId: e.id,
              oldUrl: e.cover_image_url,
              newUrl: cloudUrl
            });
          }
        }
      }
    }
  }

  // C. Products
  console.log('\nMigrando tabla: products...');
  const { data: products, error: prodErr } = await supabase.from('products').select('id, name, image_url');
  if (prodErr) {
    console.error('Error al obtener products:', prodErr.message);
  } else if (products) {
    for (const p of products) {
      if (p.image_url && p.image_url.includes(supabaseDomain)) {
        console.log(`Migrando imagen de producto: ${p.name} (${p.image_url})`);
        const cloudUrl = await uploadToCloudinary(p.image_url, 'productos');
        if (cloudUrl) {
          const { error: updErr } = await supabase
            .from('products')
            .update({ image_url: cloudUrl })
            .eq('id', p.id);
          if (updErr) {
            console.error(`Error al actualizar DB para producto ${p.name}:`, updErr.message);
          } else {
            console.log(`✓ DB Actualizada para producto: ${p.name}`);
            migrationLog.databaseAssets.push({
              table: 'products',
              rowId: p.id,
              oldUrl: p.image_url,
              newUrl: cloudUrl
            });
          }
        }
      }
    }
  }

  // D. Page Contents
  console.log('\nMigrando tabla: page_contents...');
  const { data: pages, error: pgErr } = await supabase.from('page_contents').select('id, page, section, cover_image_url, content_blocks');
  if (pgErr) {
    console.error('Error al obtener page_contents:', pgErr.message);
  } else if (pages) {
    for (const p of pages) {
      let coverUpdated = false;
      let blocksUpdated = false;
      let newCoverUrl = p.cover_image_url;
      let newBlocks = p.content_blocks ? [...p.content_blocks] : [];

      // cover image
      if (p.cover_image_url && p.cover_image_url.includes(supabaseDomain)) {
        console.log(`Migrando portada de página: ${p.page}/${p.section} (${p.cover_image_url})`);
        const cloudUrl = await uploadToCloudinary(p.cover_image_url, 'paginas');
        if (cloudUrl) {
          newCoverUrl = cloudUrl;
          coverUpdated = true;
          migrationLog.databaseAssets.push({
            table: 'page_contents',
            rowId: p.id,
            field: 'cover_image_url',
            oldUrl: p.cover_image_url,
            newUrl: cloudUrl
          });
        }
      }

      // content blocks
      if (Array.isArray(p.content_blocks)) {
        for (let idx = 0; idx < newBlocks.length; idx++) {
          const block = newBlocks[idx];
          if (block.type === 'image' && block.url && block.url.includes(supabaseDomain)) {
            console.log(`Migrando imagen de bloque en ${p.page}/${p.section}: Bloque ${idx} (${block.url})`);
            const cloudUrl = await uploadToCloudinary(block.url, 'paginas');
            if (cloudUrl) {
              newBlocks[idx] = { ...block, url: cloudUrl };
              blocksUpdated = true;
              migrationLog.databaseAssets.push({
                table: 'page_contents',
                rowId: p.id,
                field: `content_blocks[${idx}].url`,
                oldUrl: block.url,
                newUrl: cloudUrl
              });
            }
          } else if (block.type === 'gallery' && Array.isArray(block.images)) {
            const updatedImages = [...block.images];
            let galleryUpdated = false;
            for (let imgIdx = 0; imgIdx < updatedImages.length; imgIdx++) {
              const img = updatedImages[imgIdx];
              if (img.url && img.url.includes(supabaseDomain)) {
                console.log(`Migrando imagen de galería en ${p.page}/${p.section}: Bloque ${idx}/Imagen ${imgIdx} (${img.url})`);
                const cloudUrl = await uploadToCloudinary(img.url, 'galeria');
                if (cloudUrl) {
                  updatedImages[imgIdx] = { ...img, url: cloudUrl };
                  galleryUpdated = true;
                  migrationLog.databaseAssets.push({
                    table: 'page_contents',
                    rowId: p.id,
                    field: `content_blocks[${idx}].images[${imgIdx}].url`,
                    oldUrl: img.url,
                    newUrl: cloudUrl
                  });
                }
              }
            }
            if (galleryUpdated) {
              newBlocks[idx] = { ...block, images: updatedImages };
              blocksUpdated = true;
            }
          }
        }
      }

      if (coverUpdated || blocksUpdated) {
        const { error: updErr } = await supabase
          .from('page_contents')
          .update({
            cover_image_url: newCoverUrl,
            content_blocks: newBlocks
          })
          .eq('id', p.id);
        if (updErr) {
          console.error(`Error al actualizar DB para página ${p.page}/${p.section}:`, updErr.message);
        } else {
          console.log(`✓ DB Actualizada para página: ${p.page}/${p.section}`);
        }
      }
    }
  }
}

async function run() {
  console.log('Iniciando migración de medios a Cloudinary...');
  
  await migrateLocalAssets();
  await migrateDatabaseAssets();
  
  // Guardar log
  const logPath = path.resolve(__dirname, '../cloudinary_migration_report.json');
  fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2), 'utf8');
  console.log(`\n🎉 Migración completada con éxito. Reporte guardado en: ${logPath}`);
}

run();
