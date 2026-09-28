import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, stat, rm } from 'node:fs/promises';
import path from 'node:path';

const layouts = ['7x4', '4x7'];
const validId = /^[a-zA-Z0-9_-]{1,160}$/;
const validImage = /^images\/[a-f0-9]{64}\.webp$/;
export const digest = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function staticEmbedHtml({ id, layout, title, siteUrl, image }) {
  const site = new URL(siteUrl);
  if (!['https:', 'http:'].includes(site.protocol) || site.search || site.hash || !site.pathname.endsWith('/')) {
    throw new Error('Site URL must be an HTTP(S) directory URL ending in /');
  }
  const editor = new URL(site); editor.hash = `/${encodeURIComponent(id)}?layout=${layout}`;
  const page = new URL(`embeds/${encodeURIComponent(id)}/${layout}/`, site);
  const meta = (property, value) => `<meta property="${property}" content="${escape(value)}">`;
  const imageUrl = image ? new URL(`embeds/${image.file}`, site).href : undefined;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
${meta('og:type', 'website')}${meta('og:site_name', 'PvME Preset Maker')}
${meta('og:title', `PvME Preset: ${title}`)}${meta('og:url', page.href)}
${meta('og:description', 'Click the link above to view preset and notes')}
${image ? `${meta('og:image', imageUrl)}${meta('og:image:type', 'image/webp')}${meta('og:image:width', image.width)}${meta('og:image:height', image.height)}` : ''}
<meta name="twitter:card" content="summary_large_image">
</head><body><h1>${escape(title)}</h1>
<p><a id="editor" href="${escape(editor.href)}">Open preset in the editor</a></p>
${image ? `<img src="${escape(imageUrl)}" width="${image.width}" height="${image.height}" alt="${escape(title)}">` : '<p>The image preview is being prepared. You can still open the preset above.</p>'}
<script>window.location.replace(document.getElementById('editor').href);</script>
</body></html>`;
}

async function writeChanged(file, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  try { if ((await readFile(file)).equals(bytes)) return false; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes); return true;
}

// input is a complete snapshot, never a partial/diff listing. Each entry has
// { id, content }, where content is the original JSON text from the source repo.
export async function generateStaticEmbeds({ entries, outputDir, siteUrl, rendererVersion, renderImage,
  siteRevision = '', force = false, maxBytes = 900_000_000,
  renderBudgetMs = Infinity, now = Date.now, logger = console }) {
  const started = now();
  const root = path.resolve(outputDir);
  const ids = new Set();
  for (const entry of entries) {
    if (!validId.test(entry.id) || ids.has(entry.id) || ['images', 'manifest'].includes(entry.id)) throw new Error(`Invalid or duplicate preset ID: ${entry.id}`);
    ids.add(entry.id);
  }
  if (!entries.length) throw new Error('Refusing to publish an empty preset snapshot');
  await mkdir(root, { recursive: true });
  const existing = await readdir(root);
  if (existing.length && !existing.includes('.static-embeds-output')) {
    throw new Error('Refusing to modify a nonempty directory not owned by the static embed generator');
  }
  await writeFile(path.join(root, '.static-embeds-output'), 'Static preset embed output\n');
  let previous = { entries: {} };
  try { previous = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const deferredBefore = new Set(Array.isArray(previous.pending?.deferred) ? previous.pending.deferred : []);
  entries = [...entries.filter(entry => deferredBefore.has(entry.id)), ...entries.filter(entry => !deferredBefore.has(entry.id))];
  const next = { version: 1, siteUrl, siteRevision, entries: {}, pending: { deferred: [], failed: [] } };
  const result = { rendered: 0, reused: 0, failed: 0, deferred: 0, removed: 0, changed: false, bytes: 0 };
  const referenced = new Set();
  for (const [index, { id, content }] of entries.entries()) {
    const fingerprint = digest(`${rendererVersion}\n${content}`);
    let old = previous.entries?.[id];
    if (old) {
      for (const layout of layouts) {
        const image = old.images?.[layout];
        if (!image || !validImage.test(image.file) || !Number.isInteger(image.width) || !Number.isInteger(image.height)) { old = undefined; break; }
        try { if (!(await stat(path.join(root, image.file))).size) old = undefined; }
        catch (error) { if (error.code !== 'ENOENT') throw error; old = undefined; }
        if (!old) break;
      }
    }
    let record = old;
    let title = old?.title || 'RuneScape preset';
    if (!force && old?.fingerprint === fingerprint) result.reused++;
    else if (now() - started >= renderBudgetMs) { result.deferred++; next.pending.deferred.push(id); }
    else {
      try {
        const preset = JSON.parse(content);
        if (!preset || (!Array.isArray(preset.inventorySlots) && !Array.isArray(preset.equipmentSlots))) throw new Error('Preset has no inventory or equipment slots');
        title = String(preset.presetName || 'Unnamed preset').slice(0, 300);
        const images = {};
        // Render both before replacing the previous record. One failed icon must
        // not replace a previously working pair with partially rendered images.
        const rendered = [];
        for (const layout of layouts) rendered.push([layout, await renderImage(preset, layout)]);
        for (const [layout, image] of rendered) {
          const file = `images/${digest(image.buffer)}.webp`;
          if (await writeChanged(path.join(root, file), image.buffer)) result.changed = true;
          images[layout] = { file, width: image.width, height: image.height };
        }
        record = { fingerprint, title, images };
        result.rendered++;
      } catch (error) {
        result.failed++;
        next.pending.failed.push(id);
        logger.warn(`Preset ${id}: ${error.message}`);
        // Keep an existing good preview on transient failures; failed inputs are
        // deliberately not marked current, so the next scheduled run retries.
      }
    }
    if (record) next.entries[id] = record;
    for (const layout of layouts) {
      const image = record?.images[layout];
      if (image) referenced.add(image.file);
      const html = staticEmbedHtml({ id, layout, title: record?.title || title, siteUrl, image });
      if (await writeChanged(path.join(root, id, layout, 'index.html'), html)) result.changed = true;
    }
    if ((index + 1) % 100 === 0) logger.log(`Processed ${index + 1}/${entries.length}; rendered ${result.rendered}, reused ${result.reused}, failed ${result.failed}`);
  }
  // Only remove generated children inside the explicit output directory.
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory() && validId.test(entry.name) && entry.name !== 'images' && !ids.has(entry.name)) {
      const target = path.resolve(root, entry.name);
      if (path.dirname(target) !== root) throw new Error('Refusing cleanup outside output directory');
      await rm(target, { recursive: true }); result.removed++; result.changed = true;
    }
  }
  await mkdir(path.join(root, 'images'), { recursive: true });
  for (const name of await readdir(path.join(root, 'images'))) {
    const file = `images/${name}`;
    if (validImage.test(file) && !referenced.has(file)) { await rm(path.join(root, file)); result.changed = true; }
  }
  next.entries = Object.fromEntries(Object.entries(next.entries).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  const manifest = JSON.stringify(next);
  if (await writeChanged(path.join(root, 'manifest.json'), manifest)) result.changed = true;
  const measure = async directory => {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isSymbolicLink()) throw new Error('Generated output must not contain symbolic links');
      const file = path.join(directory, item.name);
      if (item.isDirectory()) await measure(file); else result.bytes += (await stat(file)).size;
    }
  };
  await measure(root);
  if (result.bytes > maxBytes) throw new Error(`Embeds exceed the ${maxBytes} byte publication budget (${result.bytes} bytes)`);
  result.cacheKey = digest(`${manifest}\n${siteUrl}\n${[...ids].join('\n')}`);
  logger.log(JSON.stringify(result));
  return result;
}
