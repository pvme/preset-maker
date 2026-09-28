import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateStaticEmbeds } from '../embed-renderer/static-pages.mjs';

const entry = (id, title = id) => ({ id, content: JSON.stringify({ presetName: title, inventorySlots: [] }) });
async function setup(t) {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'preset-static-test-'));
  t.after(async () => {
    const target = path.resolve(outputDir);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('preset-static-test-'));
    await rm(target, { recursive: true, force: true });
  });
  const calls = [];
  const options = { outputDir, siteUrl: 'https://example.test/preset-maker/', rendererVersion: 'v1',
    logger: { log() {}, warn() {} },
    renderImage: async (preset, layout) => {
      calls.push(`${preset.presetName}:${layout}`);
      return { buffer: Buffer.from(`${preset.presetName}:${layout}`), width: layout === '4x7' ? 381 : 472, height: 518 };
    },
  };
  return { options, calls, read: file => readFile(path.join(outputDir, file), 'utf8') };
}

test('each layout gets static metadata, versioned image and the correct hash redirect', async t => {
  const { options, read, calls } = await setup(t);
  const result = await generateStaticEmbeds({ ...options, entries: [entry('abc', '<script>Hi</script>')] });
  assert.equal(result.rendered, 1); assert.equal(calls.length, 2);
  for (const layout of ['7x4', '4x7']) {
    const html = await read(`abc/${layout}/index.html`);
    assert.match(html, /&lt;script&gt;Hi&lt;\/script&gt;/);
    assert.match(html, new RegExp(`embeds/abc/${layout}/`));
    assert.match(html, new RegExp(`#/abc\\?layout=${layout}`));
    assert.match(html, /property="og:image" content="https:\/\/example.test\/preset-maker\/embeds\/images\/[a-f0-9]{64}.webp"/);
    assert.doesNotMatch(html, /<script>Hi/);
    assert.match(html, /property="og:title" content="PvME Preset: /);
    assert.match(html, /Click the link above to view preset and notes/);
    assert.doesNotMatch(html, /RuneScape preset -|Portrait \(4 x 7\)|Landscape \(7 x 4\)/);
  }
});

test('unchanged entries do not rerender or rewrite output; modified data and code do', async t => {
  const { options, calls } = await setup(t);
  const first = await generateStaticEmbeds({ ...options, entries: [entry('abc')] });
  const next = await generateStaticEmbeds({ ...options, entries: [entry('abc')] });
  assert.equal(next.changed, false); assert.equal(next.reused, 1); assert.equal(next.cacheKey, first.cacheKey);
  assert.equal(calls.length, 2);
  const changed = await generateStaticEmbeds({ ...options, entries: [entry('abc', 'Edited')] });
  assert.equal(changed.rendered, 1); assert.notEqual(changed.cacheKey, first.cacheKey);
  assert.equal((await readdir(path.join(options.outputDir, 'images'))).length, 2);
  const code = await generateStaticEmbeds({ ...options, rendererVersion: 'v2', entries: [entry('abc', 'Edited')] });
  assert.equal(code.rendered, 1);
});

test('deletions remove both pages and unused images while shared images survive', async t => {
  const { options, read } = await setup(t);
  await generateStaticEmbeds({ ...options, entries: [entry('one', 'Same'), entry('two', 'Same'), entry('three')] });
  assert.equal((await readdir(path.join(options.outputDir, 'images'))).length, 4);
  const result = await generateStaticEmbeds({ ...options, entries: [entry('two', 'Same')] });
  assert.equal(result.removed, 2);
  await assert.rejects(read('one/4x7/index.html'), { code: 'ENOENT' });
  await assert.rejects(read('one/7x4/index.html'), { code: 'ENOENT' });
  assert.equal((await readdir(path.join(options.outputDir, 'images'))).length, 2);
});

test('render failure preserves both previous images and retries next time', async t => {
  const { options, read } = await setup(t);
  await generateStaticEmbeds({ ...options, entries: [entry('abc')] });
  const before = await read('abc/4x7/index.html');
  const changed = [entry('abc', 'New')];
  const failed = await generateStaticEmbeds({ ...options, entries: changed, renderImage: async () => { throw new Error('Network failure'); } });
  assert.equal(failed.failed, 1); assert.equal(await read('abc/4x7/index.html'), before);
  assert.equal((await generateStaticEmbeds({ ...options, entries: changed })).rendered, 1);
});

test('a first-time failure gets a working editor link and is not marked rendered', async t => {
  const { options, read } = await setup(t);
  const entries = [entry('abc')];
  await generateStaticEmbeds({ ...options, entries, renderImage: async () => { throw new Error('offline'); } });
  const html = await read('abc/4x7/index.html');
  assert.match(html, /#\/abc\?layout=4x7/); assert.doesNotMatch(html, /property="og:image"/);
  assert.deepEqual(JSON.parse(await read('manifest.json')).entries, {});
  assert.equal((await generateStaticEmbeds({ ...options, entries })).rendered, 1);
});

test('site origin and frontend revision changes publish fresh pages without rerendering images', async t => {
  const { options, calls, read } = await setup(t);
  const entries = [entry('abc')];
  await generateStaticEmbeds({ ...options, entries });
  const moved = await generateStaticEmbeds({ ...options, siteUrl: 'https://custom.test/', siteRevision: 'new-commit', entries });
  assert.equal(moved.changed, true); assert.equal(moved.reused, 1); assert.equal(calls.length, 2);
  assert.match(await read('abc/7x4/index.html'), /https:\/\/custom.test\/embeds/);
  assert.equal(JSON.parse(await read('manifest.json')).siteRevision, 'new-commit');
});

test('missing cached files are repaired and explicit force regenerates', async t => {
  const { options, read } = await setup(t);
  const entries = [entry('abc')];
  await generateStaticEmbeds({ ...options, entries });
  const manifest = JSON.parse(await read('manifest.json'));
  const relative = manifest.entries.abc.images['4x7'].file;
  assert.match(relative, /^images\/[a-f0-9]{64}\.webp$/);
  await rm(path.join(options.outputDir, relative));
  assert.equal((await generateStaticEmbeds({ ...options, entries })).rendered, 1);
  assert.equal((await generateStaticEmbeds({ ...options, entries, force: true })).rendered, 1);
});

test('unsafe IDs, empty snapshots, unrelated directories and oversize output fail safely', async t => {
  const { options } = await setup(t);
  await assert.rejects(generateStaticEmbeds({ ...options, entries: [entry('../outside')] }), /Invalid/);
  await assert.rejects(generateStaticEmbeds({ ...options, entries: [] }), /empty/);
  await writeFile(path.join(options.outputDir, 'important.txt'), 'keep');
  await assert.rejects(generateStaticEmbeds({ ...options, entries: [entry('abc')] }), /not owned/);
  assert.equal(await readFile(path.join(options.outputDir, 'important.txt'), 'utf8'), 'keep');
  await rm(path.join(options.outputDir, 'important.txt'));
  await assert.rejects(generateStaticEmbeds({ ...options, entries: [entry('abc')], maxBytes: 1 }), /budget/);
});

test('time-limited generation publishes progress and continues the backlog next run', async t => {
  const { options, read } = await setup(t);
  let clock = 0;
  const entries = [entry('abc'), entry('def')];
  const first = await generateStaticEmbeds({ ...options, entries, renderBudgetMs: 10, now: () => clock,
    renderImage: async (...args) => { clock += 6; return options.renderImage(...args); },
  });
  assert.equal(first.rendered, 1); assert.equal(first.deferred, 1);
  assert.match(await read('def/4x7/index.html'), /#\/def\?layout=4x7/);
  const second = await generateStaticEmbeds({ ...options, entries });
  assert.equal(second.rendered, 1); assert.equal(second.reused, 1);
});

test('legacy equipment-only presets can generate previews', async t => {
  const { options } = await setup(t);
  const result = await generateStaticEmbeds({ ...options,
    entries: [{ id: 'equipment-only', content: JSON.stringify({ presetName: 'Equipment', equipmentSlots: [] }) }],
  });
  assert.equal(result.rendered, 1); assert.equal(result.failed, 0);
});

test('a slow failing preset cannot starve deferred presets on following runs', async t => {
  const { options } = await setup(t);
  let clock = 0;
  const renderImage = async (preset, layout) => {
    if (preset.presetName === 'bad') { clock += 100; throw new Error('unavailable'); }
    return options.renderImage(preset, layout);
  };
  const entries = [entry('aaa', 'bad'), entry('bbb', 'good')];
  const config = { ...options, entries, renderImage, renderBudgetMs: 10, now: () => clock };
  const first = await generateStaticEmbeds(config);
  assert.equal(first.failed, 1); assert.equal(first.deferred, 1);
  const next = await generateStaticEmbeds(config);
  assert.equal(next.rendered, 1); assert.equal(next.failed, 1);
});
