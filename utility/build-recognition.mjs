import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const CATALOGUE_URL = 'https://raw.githubusercontent.com/pvme/pvme-settings/master/emojis/emojis_v2.json';
function imageUrls(entry) {
  const urls = [];
  if (entry.emoji_id) urls.push(`https://cdn.discordapp.com/emojis/${entry.emoji_id}.png`);
  if (entry.image) urls.push(new URL(entry.image, 'https://img.pvme.io/images/').href);
  return [...new Set(urls)];
}
import { FINGERPRINT_SIZE, fingerprint, queries } from '../src/imageImport/matcher.ts';

const cache = new URL('../.cache/recognition/', import.meta.url);
await mkdir(cache, { recursive: true });
const response = await fetch(CATALOGUE_URL);
if (!response.ok) throw new Error('Catalogue download failed: ' + response.status);
const catalogue = await response.json();
const matcher = { size: FINGERPRINT_SIZE, fingerprint, queries }, records = [], failures = [];
const entries = catalogue.categories.flatMap(category => category.emojis);
const aliases = JSON.parse(await readFile(new URL('recognition-aliases.json', import.meta.url), 'utf8'));
const byId = new Map(entries.map(entry => [entry.id, entry]));
for (const [source, target] of Object.entries(aliases)) if (!byId.has(source) || !byId.has(target)) throw new Error('Recognition alias is missing from the catalogue: ' + source + ' -> ' + target);
let cursor = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (cursor < entries.length) {
    const entry = entries[cursor++];
    const recognized = byId.get(aliases[entry.id] || entry.id);
    const path = new URL(createHash('sha256').update(entry.id).digest('hex').slice(0, 24) + '.png', cache);
    let bytes;
    try { bytes = await readFile(path); } catch {
      for (const url of imageUrls(entry)) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (!res.ok) continue;
          bytes = Buffer.from(await res.arrayBuffer()); await writeFile(path, bytes); break;
        } catch {}
      }
    }
    if (!bytes) { failures.push(entry.id); continue; }
    try {
      const image = await loadImage(bytes), canvas = createCanvas(image.width, image.height), ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const samples = [pixels];
      if (matcher.queries(pixels).length > 2) {
        const scaled = createCanvas(Math.round(image.width * 1.5), Math.round(image.height * 1.5)), context = scaled.getContext('2d');
        context.drawImage(image, 0, 0, scaled.width, scaled.height);
        samples.push(context.getImageData(0, 0, scaled.width, scaled.height));
      }
      for (const sample of samples) for (const variant of [0, 1, 2, 3]) {
        const feature = matcher.fingerprint(sample, !!(variant % 2), variant >= 2);
        if (!feature.empty) records.push({ id: recognized.id.toLowerCase(), variant, family: recognized.name.toLowerCase().replace(/\s*\(stack(?: of \d+)?\)\s*$/, '').trim(), vector: feature.vector });
      }
    } catch { failures.push(entry.id); }
  }
}));
if (failures.length) throw new Error('Could not load icons: ' + failures.join(', '));

const artwork = await loadImage(fileURLToPath(new URL('../src/assets/presetmap_desktop.png', import.meta.url)));
for (let slot = 0; slot < 12; slot++) {
  const canvas = createCanvas(32, 34), ctx = canvas.getContext('2d');
  ctx.drawImage(artwork, 334 + slot % 3 * 49, 7 + Math.floor(slot / 3) * 38, 32, 34, 0, 0, 32, 34);
  for (const variant of [0, 1, 2, 3]) records.push({ id: '', variant, slot, vector: matcher.fingerprint(ctx.getImageData(0, 0, 32, 34), !!(variant % 2), variant >= 2).vector });
}
records.sort((a, b) => a.id.localeCompare(b.id) || a.variant - b.variant || (a.slot ?? 0) - (b.slot ?? 0));
const columns = 64, canvas = createCanvas(columns * matcher.size, Math.ceil(records.length / columns) * matcher.size), ctx = canvas.getContext('2d');
records.forEach((record, index) => {
  const pixels = ctx.createImageData(matcher.size, matcher.size);
  for (let p = 0; p < matcher.size * matcher.size; p++) {
    pixels.data.set(record.vector.subarray(p * 3, p * 3 + 3), p * 4); pixels.data[p * 4 + 3] = 255;
  }
  ctx.putImageData(pixels, index % columns * matcher.size, Math.floor(index / columns) * matcher.size);
});
const output = new URL('../src/assets/recognition/', import.meta.url);
await writeFile(new URL('recognition.png', output), canvas.toBuffer('image/png'));
await writeFile(new URL('recognition.json', output), JSON.stringify({ version: 2, size: matcher.size, columns, source: CATALOGUE_URL, records: records.map(({ vector, ...record }) => record) }));
console.log('Wrote ' + records.length + ' templates from ' + entries.length + ' catalogue entries.');
