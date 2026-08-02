import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey || !supabaseUrl) {
  console.error('Error: Las credenciales de Supabase no están completas en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dom = new JSDOM();
const document = dom.window.document;

function htmlToBracketText(html) {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  temp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation, ruby').forEach(el => {
    const chord = el.getAttribute('data-chord');
    if (chord) {
      el.parentNode?.replaceChild(document.createTextNode(`[${chord}]`), el);
    } else {
      // Intento extraer de data-chord dentro del tag ruby si es un ruby legacy
      const rubyMatch = el.outerHTML.match(/data-chord=["']([^"']+)["']/);
      if (rubyMatch && rubyMatch[1]) {
        el.parentNode?.replaceChild(document.createTextNode(`[${rubyMatch[1]}]`), el);
      } else {
        el.remove();
      }
    }
  });
  
  let text = '';
  temp.childNodes.forEach(node => {
    if (node.nodeType === 1) { // ELEMENT_NODE
      const el = node;
      if (el.tagName === 'P') {
        text += el.textContent + '\n';
      } else if (el.tagName === 'BR') {
        text += '\n';
      } else {
        text += el.textContent;
      }
    } else if (node.nodeType === 3) { // TEXT_NODE
      text += node.textContent;
    }
  });
  
  return text.trim();
}

async function runMigration() {
  console.log('Obteniendo canciones...');
  const { data: songs, error } = await supabase.from('songs').select('id, title, lyrics');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Encontradas ${songs.length} canciones. Iniciando migración de formato...`);
  let count = 0;
  
  for (const song of songs) {
    if (!song.lyrics) continue;
    
    // Si ya está en formato brackets o no tiene HTML, es probable que no necesite mucho cambio, pero lo pasamos por el limpiador
    let newLyrics = htmlToBracketText(song.lyrics);
    
    // Si newLyrics aún contiene tags HTML como <strong> o similar, las removemos
    newLyrics = newLyrics.replace(/<[^>]*>?/gm, '');
    
    if (newLyrics !== song.lyrics) {
      const { error: updateError } = await supabase
        .from('songs')
        .update({ lyrics: newLyrics })
        .eq('id', song.id);
        
      if (updateError) {
        console.error(`Error actualizando ${song.title}:`, updateError);
      } else {
        count++;
        process.stdout.write('.');
      }
    }
  }
  console.log(`\n¡Migración completada! ${count} canciones actualizadas a formato [C].`);
}

runMigration();
