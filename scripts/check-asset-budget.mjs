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

try {
  const serviceWorker = await readFile(join(root, 'sw.js'), 'utf8');
  const precacheUrls = [...serviceWorker.matchAll(/"url":"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url && !url.startsWith('http'));
  const precacheAssets = precacheUrls.map((url) => ({
    url,
    asset: assets.find(({ file }) => file.replaceAll('\\', '/') === url),
  })).filter((item) => item.asset);
  const precacheBytes = precacheAssets.reduce((total, { asset }) => total + asset.size, 0);

  const largestPrecacheAssets = precacheAssets
    .map(({ url, asset }) => ({ url, size: asset.size }))
    .toSorted((a, b) => b.size - a.size)
    .slice(0, 12);
  console.table(largestPrecacheAssets.map(({ url, size }) => ({ file: url, kib: Math.round(size / 1024) })));

  const oversizedPrecache = precacheAssets.filter(({ asset }) => asset.size > limitBytes);
  if (oversizedPrecache.length > 0) {
    console.error(`Se encontraron ${oversizedPrecache.length} assets precargados por encima de 2 MiB:`);
    for (const { url, asset } of oversizedPrecache) {
      console.error(`- ${url}: ${Math.round(asset.size / 1024)} KiB`);
    }
    process.exitCode = 1;
  }

  console.log(`Precache PWA: ${precacheUrls.length} entradas, ${Math.round(precacheBytes / 1024)} KiB`);
  const onDemandOversized = assets.filter(({ size, file }) => size > limitBytes
    && !precacheAssets.some(({ url }) => url === file.replaceAll('\\', '/')));
  if (onDemandOversized.length > 0) {
    console.log(`Assets grandes fuera del precache (carga bajo demanda): ${onDemandOversized.length}`);
  }
  if (precacheBytes > precacheLimitBytes) {
    console.error(`El precache PWA supera el límite de ${Math.round(precacheLimitBytes / 1024)} KiB.`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error('No se pudo inspeccionar el precache de dist/sw.js.', error);
  process.exitCode = 1;
}

