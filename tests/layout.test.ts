import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createPresetLayoutDetector } from '../src/imageImport/layoutDetector.mjs';
import { layoutScreenshot } from './layout-fixture.mjs';

const detector = createPresetLayoutDetector();
function verify(canvas, expected, scale = 1, offsetX = 0, offsetY = 0) {
  const result = detector.detect(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height));
  assert.equal(result.regions.length, expected.length);
  for (const target of expected) {
    const actual = result.regions.find(region => region.group === target.group && region.index === target.index);
    assert.ok(actual, `${target.group} ${target.index}`);
    assert.ok(Math.abs(actual.x + actual.w / 2 - (offsetX + (target.x + target.w / 2) * scale)) < 4 * scale, `Horizontal alignment for ${target.group} ${target.index}`);
    assert.ok(Math.abs(actual.y + actual.h / 2 - (offsetY + (target.y + target.h / 2) * scale)) < 4 * scale, `Vertical alignment for ${target.group} ${target.index}`);
  }
  return result;
}

test('locates independently positioned inventory and equipment without image-relative coordinates', () => {
  for (const options of [{}, { swapped: true }, { inventory: false }, { equipment: false }, { columns: 7 }, { compact: true }]) {
    const { canvas, expected } = layoutScreenshot(options);
    verify(canvas, expected);
  }
}, 15000);

test('slot detection tolerates margins, scaling and JPEG screenshots', async () => {
  const { canvas: original, expected } = layoutScreenshot();
  for (const scale of [.75, 1.5, 2]) {
    const canvas = createCanvas(original.width * scale + 70, original.height * scale + 50), ctx = canvas.getContext('2d');
    ctx.fillStyle = '#131313'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(original, 35, 25, original.width * scale, original.height * scale);
    const jpeg = await loadImage(canvas.toBuffer('image/jpeg', 90)); ctx.drawImage(jpeg, 0, 0);
    verify(canvas, expected, scale, 35, 25);
  }
});

test('an unrelated image produces no guessed slots and cancelled detection stops', async () => {
  const canvas = createCanvas(358, 304), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#25231e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  assert.equal(detector.detect(ctx.getImageData(0, 0, canvas.width, canvas.height)).regions.length, 0);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(detector.detectAsync(ctx.getImageData(0, 0, canvas.width, canvas.height), controller.signal));
});
