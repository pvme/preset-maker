import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCanvas, loadImage, Image, ImageData } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { createPresetIconContribution } from '../src/imageImport/iconContribution.mjs';

const client = createPresetIconContribution('/unused');
async function pixels(path) {
  const image = await loadImage(await readFile(new URL(path, import.meta.url)));
  const ctx = createCanvas(image.width, image.height).getContext('2d'); ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
}

test('browser cleanup matches the original Python script for all three bank and GE backgrounds', async () => {
  for (const kind of ['ge', 'inventory', 'inventory-alt']) {
    const original = await pixels('./fixtures/cleanup-' + kind + '.png');
    const expected = await pixels('./fixtures/cleanup-' + kind + '-expected.png');
    const border = await pixels('../public/icon-cleanup/' + kind + '-border.png');
    const background = await pixels('../public/icon-cleanup/' + kind + '-background.png');
    const before = new Uint8ClampedArray(original.data);
    assert.deepEqual(client.clean(original, border, background)?.data, expected.data);
    assert.deepEqual(original.data, before);
    assert.equal(client.clean(background, border, background), null);
    original.data.fill(0);
    assert.equal(client.clean(original, border, background), null);
  }
});

test('unsupported contribution screenshots are rejected before image decoding', async () => {
  await assert.rejects(client.read({ type: 'image/jpeg', size: 100 }), /original PNG/);
  await assert.rejects(client.read({ type: 'image/png', size: 7 * 1024 * 1024 }), /smaller than 6 MB/);
});

test('slot extraction locates original bank frames and returns separate icons without the surrounding screenshot', async () => {
  const saved = { document: globalThis.document, Image: globalThis.Image, ImageData: globalThis.ImageData };
  Object.assign(globalThis, { document: { createElement: () => createCanvas(1, 1) }, Image, ImageData });
  try {
    const extractor = createPresetIconContribution(fileURLToPath(new URL('../public/icon-cleanup', import.meta.url)));
    const image = await loadImage(await readFile(new URL('./fixtures/cleanup-inventory.png', import.meta.url)));
    const screenshot = createCanvas(92, 74); const ctx = screenshot.getContext('2d');
    ctx.drawImage(image, 5, 6); ctx.drawImage(image, 49, 40);
    const found = await extractor.extract(screenshot);
    assert.deepEqual(found.map(({ x, y }) => ({ x, y })), [{ x: 5, y: 6 }, { x: 49, y: 40 }]);
    const selected = await loadImage(found[0].original);
    assert.deepEqual([selected.width, selected.height], [38, 34]);
    const reused = await extractor.prepare(screenshot, { x: 50, y: 41, w: 36, h: 32 });
    assert.equal(reused.selected, 1);
    assert.equal(reused.icons[reused.selected].original, found[1].original);
    const worn = await extractor.prepare(screenshot, { x: 5, y: 41, w: 32, h: 32 });
    assert.equal(worn.selected, -1);
    const aborted = new AbortController(); aborted.abort();
    await assert.rejects(extractor.extract(screenshot, aborted.signal), /abort/i);
    const invalid = createCanvas(100, 100);
    await assert.rejects(extractor.extract(invalid), /No compatible bank or GE slots/);
  } finally { Object.assign(globalThis, saved); }
});

