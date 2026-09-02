import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'dist');
const limitBytes = 2 * 1024 * 1024;
const precacheLimitBytes = 5 * 1024 * 1024;
const assets = [];

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(filePath);
      continue;
    }
    const size = (await stat(filePath)).size;
    assets.push({ file: relative(root, filePath), size });
  }
}

try {
  await visit(root);
} catch (error) {
  console.error('No se pudo inspeccionar dist/. Ejecuta npm run build antes de revisar assets.', error);
  process.exitCode = 1;
}

const largest = assets.toSorted((a, b) => b.size - a.size).slice(0, 12);
console.table(largest.map(({ file, size }) => ({ file, kib: Math.round(size / 1024) })));

const oversized = assets.filter(({ size }) => size > limitBytes);
if (oversized.length > 0) {
  console.error(`Se encontraron ${oversized.length} assets por encima de 2 MiB:`);
  for (const asset of oversized) {
    console.error(`- ${asset.file}: ${Math.round(asset.size / 1024)} KiB`);
  }
  process.exitCode = 1;
}

try {
  const serviceWorker = await readFile(join(root, 'sw.js'), 'utf8');
  const precacheUrls = [...serviceWorker.matchAll(/"url":"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url && !url.startsWith('http'));
  const precacheBytes = precacheUrls.reduce((total, url) => {
    const asset = assets.find(({ file }) => file.replaceAll('\\', '/') === url);
    return total + (asset?.size ?? 0);
  }, 0);

  console.log(`Precache PWA: ${precacheUrls.length} entradas, ${Math.round(precacheBytes / 1024)} KiB`);
  if (precacheBytes > precacheLimitBytes) {
    console.error(`El precache PWA supera el límite de ${Math.round(precacheLimitBytes / 1024)} KiB.`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error('No se pudo inspeccionar el precache de dist/sw.js.', error);
  process.exitCode = 1;
}
