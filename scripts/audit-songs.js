import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const chordPattern = /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?(?:2|4|5|6|7|9|11|13)?(?:\/[A-G](?:#|b)?)?$/;

const decodeEntities = (value) => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#039;/gi, "'");

const toPlainText = (html) => decodeEntities(html
  .replace(/<rt\b[^>]*>.*?<\/rt>/gis, '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n')
  .replace(/<\/h[1-6]>/gi, '\n')
  .replace(/<[^>]+>/g, ' '))
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s+/g, '\n')
  .trim();

const normalizeTitle = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const extractChords = (lyrics) => {
  const dataChords = [...lyrics.matchAll(/data-chord=["']([^"']+)["']/gi)].map((match) => match[1].trim());
  const bracketChords = [...toPlainText(lyrics).matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim());
  return [...dataChords, ...bracketChords];
};

const { data: songs, error } = await supabase
  .from('songs')
  .select('id,title,artist,lyrics,has_chords,structure_blocks,created_at')
  .order('title');

if (error) {
  console.error('No se pudo auditar la tabla songs:', error);
  process.exit(1);
}

const titleGroups = new Map();
for (const song of songs) {
  const key = normalizeTitle(song.title);
  titleGroups.set(key, [...(titleGroups.get(key) ?? []), song.title]);
}

const audit = songs.map((song) => {
  const lyrics = song.lyrics ?? '';
  const text = toPlainText(lyrics);
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const chords = extractChords(lyrics);
  const invalidChords = [...new Set(chords.filter((chord) => !chordPattern.test(chord)))];
  const openingRuby = (lyrics.match(/<ruby\b/gi) ?? []).length;
  const closingRuby = (lyrics.match(/<\/ruby>/gi) ?? []).length;
  const openingRt = (lyrics.match(/<rt\b/gi) ?? []).length;
  const closingRt = (lyrics.match(/<\/rt>/gi) ?? []).length;
  const structureBlocks = Array.isArray(song.structure_blocks) ? song.structure_blocks : [];
  const reasons = [];

  if (text.length < 220) reasons.push('letra_muy_corta');
  else if (text.length < 420) reasons.push('letra_corta');
  if (lines.length < 5) reasons.push('pocas_lineas');
  if (/\.\.\.|…/.test(text)) reasons.push('contiene_elipsis');
  if (song.has_chords && chords.length === 0) reasons.push('marcada_con_acordes_sin_acordes');
  if (!song.has_chords && chords.length > 0) reasons.push('acordes_sin_marcar');
  if (invalidChords.length > 0) reasons.push('acordes_invalidos');
  if (openingRuby !== closingRuby || openingRt !== closingRt) reasons.push('html_de_acordes_desbalanceado');
  if (structureBlocks.length > 0 && structureBlocks.some((block) => !block || typeof block.lyrics !== 'string' || !block.lyrics.trim())) reasons.push('seccion_estructurada_vacia');

  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    textLength: text.length,
    lines: lines.length,
    chordCount: chords.length,
    invalidChords,
    structureBlockCount: structureBlocks.length,
    reasons,
  };
});

const flagged = audit.filter((song) => song.reasons.length > 0);
const reasonCounts = flagged.flatMap((song) => song.reasons).reduce((counts, reason) => {
  counts[reason] = (counts[reason] ?? 0) + 1;
  return counts;
}, {});
const duplicates = [...titleGroups.values()].filter((titles) => titles.length > 1);
const likelyTraditional = audit.filter((song) => /tradicional|himno/i.test(song.artist ?? ''));
const likelyModern = audit.filter((song) => !/tradicional|himno/i.test(song.artist ?? ''));
const critical = flagged.filter((song) => song.reasons.some((reason) => [
  'acordes_invalidos',
  'html_de_acordes_desbalanceado',
  'marcada_con_acordes_sin_acordes',
  'acordes_sin_marcar',
  'seccion_estructurada_vacia',
].includes(reason)));
const summaryOnly = process.argv.includes('--summary');

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalSongs: songs.length,
  flaggedSongs: flagged.length,
  reasonCounts,
  likelyTraditionalCount: likelyTraditional.length,
  likelyModernCount: likelyModern.length,
  duplicates,
  critical,
  ...(summaryOnly ? {} : { flagged }),
}, null, 2));
