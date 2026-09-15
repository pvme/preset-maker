import { createCanvas } from '@napi-rs/canvas';

export function layoutScreenshot({ columns = 4, inventory = true, equipment = true, swapped = false, compact = false, bank = false } = {}) {
  const canvas = createCanvas(bank ? 202 : 540, bank ? 503 : 360), ctx = canvas.getContext('2d'), expected = [];
  ctx.fillStyle = '#25231e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const box = (group, index, x, y, w, h) => {
    ctx.fillStyle = '#49473c'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1b1b18'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = ['#e4ac35', '#38767c', '#8535aa'][index % 3];
    if (index % 4) ctx.fillRect(x + 9, y + 7, w - 18, h - 14);
    expected.push({ group, index, x, y, w, h });
  };
  if (inventory) for (let i = 0; i < 28; i++) box('inventory', i,
    (bank ? 11 : swapped ? 315 : 23) + i % columns * (bank ? 46 : 42), (bank ? 6 : 19) + Math.floor(i / columns) * (bank ? 37 : 38), 38, 34);
  if (equipment) {
    const offsets = [[0, 0], [-1, 1], [0, 1], [-1.3, 2], [0, 2], [1.3, 2], [0, 3], [-1.3, 4], [0, 4], [1.3, 4], [1, 1], [1, 0]];
    for (let i = 0; i < 12; i++) {
      let [x, y] = compact ? [i % 3, Math.floor(i / 3)] : offsets[i];
      if (bank && Math.abs(x) === 1.3) x = Math.sign(x) * 1.5;
      box('equipment', i, Math.round((bank || swapped ? 88 : 380) + x * 40), (bank ? 290 : 57) + y * 40, bank ? 34 : 36, bank ? 32 : 34);
    }
  }
  return { canvas, expected };
}
