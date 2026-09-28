const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { createRenderer } = require('../embed-renderer/lib/render-core');
const { normalizeLayout } = require('../embed-renderer/lib/layout');

const color = i => [30 + i * 5, 80 + i * 3, 210 - i * 4];
const slots = Array.from({ length: 28 }, (_, i) => {
  const canvas = createCanvas(12, 12);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `rgb(${color(i).join(',')})`;
  ctx.fillRect(0, 0, 12, 12);
  return { id: `slot-${i}`, image: canvas.toDataURL('image/png') };
});
const preset = {
  presetName: 'Slot order verification', inventorySlots: slots,
  equipmentSlots: slots.slice(0, 12), relics: slots.slice(0, 3),
  familiar: slots[3], ammoSpells: slots.slice(4, 7), aspect: slots[7],
};
const { renderPresetImage } = createRenderer({
  createCanvas, loadImage,
  loadLocal: name => loadImage(path.join(__dirname, '../src/assets', name)),
  loadIconMap: async () => ({}), normalizePresetToV2: data => data,
  resolveArray: items => items, resolveSlot: slot => slot,
});
async function rendered(layout) {
  const buffer = await renderPresetImage(preset, layout);
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
  return { buffer, image, pixel: (x, y) => [...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data].slice(0, 3) };
}

test('only exact portrait is accepted', () => {
  for (const value of [undefined, null, '', 'portrait', '4X7', ['4x7'], true]) {
    assert.equal(normalizeLayout(value), '7x4');
  }
  assert.equal(normalizeLayout('4x7'), '4x7');
});

test('portrait places all 28 inventory items in row-major order and all equipment slots', async () => {
  const { image, pixel } = await rendered('4x7');
  assert.equal(image.width, 381); assert.equal(image.height, 518);
  slots.forEach((_, i) => assert.deepEqual(pixel(12 + i % 4 * 45 + 19, 34 + 12 + Math.floor(i / 4) * 39 + 17), color(i)));
  const equipment = [[1,0],[.25,1],[1,1],[0,2],[1,2],[2,2],[1,3],[0,4],[1,4],[2,4],[1.75,1],[1.75,0]];
  equipment.forEach(([col,row], i) => assert.deepEqual(pixel(202 + 14 + col * 59 + 16, 34 + 46 + row * 44 + 17), color(i)));
});

test('landscape keeps its original dimensions, slot order and default behavior', async () => {
  const { image, pixel, buffer } = await rendered('7x4');
  const background = await loadImage(path.join(__dirname, '../src/assets/presetmap_desktop.png'));
  assert.equal(image.width, 472); assert.equal(image.height, 34 + background.height + 188);
  slots.forEach((_, i) => assert.deepEqual(pixel(7 + i % 7 * 44 + 19, 34 + 7 + Math.floor(i / 7) * 36 + 17), color(i)));
  assert.deepEqual((await rendered(undefined)).buffer, buffer);
});

test('renderer does not mutate the input preset', async () => {
  const before = structuredClone(preset);
  await renderPresetImage(preset, '4x7');
  assert.deepEqual(preset, before);
});

test('double-resolution rendering preserves portrait slot positions', async () => {
  const renderer = createRenderer({
    createCanvas, loadImage, renderScale: 2,
    loadLocal: name => loadImage(path.join(__dirname, '../src/assets', name)),
    loadIconMap: async () => ({}), normalizePresetToV2: data => data,
    resolveArray: items => items, resolveSlot: slot => slot,
  });
  const image = await loadImage(await renderer.renderPresetImage(preset, '4x7'));
  assert.equal(image.width, 762); assert.equal(image.height, 1036);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
  slots.forEach((_, i) => {
    const x = (12 + i % 4 * 45 + 19) * 2;
    const y = (34 + 12 + Math.floor(i / 4) * 39 + 17) * 2;
    assert.deepEqual([...ctx.getImageData(x, y, 1, 1).data].slice(0, 3), color(i));
  });
});

test('strict icon loading rejects incomplete renders and retries failed images', async () => {
  let fail = true;
  const renderer = createRenderer({
    createCanvas, loadImage: async data => { if (fail) throw new Error('Icon unavailable'); return loadImage(data); },
    loadLocal: name => loadImage(path.join(__dirname, '../src/assets', name)),
    loadIconMap: async () => ({}), normalizePresetToV2: data => data,
    resolveArray: items => items, resolveSlot: slot => slot, failOnImageError: true,
  });
  await assert.rejects(renderer.renderPresetImage(preset, '4x7'), /Icon unavailable/);
  fail = false;
  const result = await renderer.renderPresetImage(preset, '4x7');
  assert.equal(result.readUInt32BE(16), 381);
});
