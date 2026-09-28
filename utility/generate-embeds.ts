import { readdir, readFile, mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { makeEmbedRenderer } from './embed-renderer';
import { loadEmojis } from '../src/emoji/loadEmojis';
import { digest, generateStaticEmbeds } from '../embed-renderer/static-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.resolve(process.env.PRESET_SOURCE_DIR || '.cache/preset-source/presets');
const outputDir = path.resolve(process.env.EMBED_OUTPUT_DIR || '.cache/static-embeds');
const siteUrl = process.env.EMBED_SITE_URL;
if (!siteUrl) throw new Error('Set EMBED_SITE_URL to the published editor directory URL, including the final /');
const files = (await readdir(source)).filter(name => name.endsWith('.json')).sort();
const entries = await Promise.all(files.map(async name => ({
  id: name.slice(0, -5), content: await readFile(path.join(source, name), 'utf8'),
})));

// Include the renderer, normalizer, assets and catalogue in the fingerprint so
// their changes invalidate images even when the preset JSON has not changed.
const dependencies: string[] = [];
for (const folder of ['embed-renderer/lib', 'src/emoji', 'src/schemas', 'src/assets']) {
  for (const item of await readdir(path.join(root, folder), { withFileTypes: true })) {
    if (item.isFile() && /\.(js|ts|png)$/.test(item.name)) dependencies.push(`${folder}/${item.name}`);
  }
}
dependencies.push('utility/embed-renderer.ts', 'utility/generate-embeds.ts',
  'embed-renderer/static-pages.mjs',
  'src/redux/store/reducers/normalizePreset.ts', 'src/components/PresetEditor/equipmentSlots.ts', 'package-lock.json');
const maps = await loadEmojis(AbortSignal.timeout(15_000));
const rendererVersion = digest(Buffer.concat([
  ...await Promise.all(dependencies.sort().map(file => readFile(path.join(root, file)))),
  Buffer.from(JSON.stringify(maps.byId)),
]));
const icons = path.resolve('.cache/embed-icons', digest(JSON.stringify(maps.byId)).slice(0, 16));
await mkdir(icons, { recursive: true });
const downloads = new Map<string, Promise<Buffer>>();
const download = async (url: string) => {
  const file = path.join(icons, `${digest(url)}.img`);
  if (process.env.EMBED_FORCE !== 'true') {
    try { return await readFile(file); } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Icon download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await loadImage(bytes); // Never persist a failed HTML response or corrupt image.
  await writeFile(file, bytes);
  return bytes;
};
const fetchImageBytes = (url: string) => {
  // Coalesce downloads and avoid retrying a broken remote icon for every preset
  // during this run. A new scheduled run starts with a fresh failure cache.
  if (!downloads.has(url)) downloads.set(url, download(url));
  return downloads.get(url)!;
};
const { renderPresetImage } = makeEmbedRenderer({ fetchImageBytes });
const result = await generateStaticEmbeds({
  entries, outputDir, siteUrl, rendererVersion,
  siteRevision: process.env.GITHUB_SHA || '',
  force: process.env.EMBED_FORCE === 'true',
  renderBudgetMs: process.env.EMBED_FORCE === 'true' ? Infinity : Number(process.env.EMBED_RENDER_BUDGET_MS || 300_000),
  renderImage: async (preset: unknown, layout: string) => {
    const png = await renderPresetImage(preset, layout);
    const image = await loadImage(png);
    const canvas = createCanvas(image.width, image.height);
    canvas.getContext('2d').drawImage(image, 0, 0);
    return { buffer: await canvas.encode('webp', 90), width: image.width, height: image.height };
  },
});
if (process.env.GITHUB_OUTPUT) {
  const iconFiles = (await readdir(icons)).sort();
  const iconHashes = await Promise.all(iconFiles.map(async file => `${file}:${digest(await readFile(path.join(icons, file)))}`));
  const iconKey = digest(`${icons.split(path.sep).at(-1)}\n${iconHashes.join('\n')}`);
  await appendFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\ncache-key=${result.cacheKey}\nicon-cache-key=${iconKey}\n`);
}
if (result.failed) console.warn(`${result.failed} presets could not render. Their previous previews were retained where available; the next run will retry.`);
