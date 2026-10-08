// Rebuild web documents from their editable UTF-8 Markdown sources.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
for (const slug of ['estatutos', 'reglamento-interno']) {
  const root = `docs/normativa-cuadrangular/textos/${slug}`;
  const metadata = JSON.parse(await readFile(`${root}.metadata.json`, 'utf8'));
  const source = await readFile(`${root}.md`, 'utf8');
  const pages = [...source.matchAll(/<!-- pagina:(\d+) -->\s*([\s\S]*?)(?=<!-- pagina:\d+ -->|$)/g)]
    .map(match => ({ number: Number(match[1]), text: match[2].trim() }));
  if (pages.length !== metadata.expectedPages || pages.some((page, index) => page.number !== index + 1 || !page.text)) {
    throw new Error(`${slug}: missing, empty or unordered pages`);
  }
  const original = await readFile(`public/documentos/${slug}.pdf`);
  if (createHash('sha256').update(original).digest('hex') !== metadata.sha256) throw new Error(`${slug}: original PDF changed`);
  await writeFile(`public/documentos/${slug}.json`, JSON.stringify({ ...metadata, pages }));
  console.log(`${slug}: ${pages.length} editable pages rebuilt; original PDF verified`);
}
