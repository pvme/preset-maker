import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createPresetManualLayout } from '../src/imageImport/manualLayout.mjs';
const geometry = createPresetManualLayout();

test('manual inventory shapes retain all 28 slots in reading order', () => {
  for (let columns = 1; columns <= 28; columns++) {
    let state = geometry.grid(geometry.blank(), 'columns', columns);
    state = geometry.place(state, { x: 20, y: 30, w: 1000, h: 1000 }, 1200, 1200);
    const slots = geometry.regions(state);
    assert.equal(slots.length, 28);
    assert.equal(state.inventory.rows, Math.ceil(28 / columns));
    assert.deepEqual(slots.map(slot => slot.index), Array.from({ length: 28 }, (_, i) => i));
    assert.ok(slots.every(slot => slot.x >= 20 && slot.y >= 30 && slot.x + slot.w <= 1020.001 && slot.y + slot.h <= 1030.001));
    if (columns < 28) { assert.equal(slots[columns].x, slots[0].x); assert.ok(slots[columns].y > slots[0].y); }
  }
});

test('inventory and equipment are placed independently and equipment slots can be rearranged', () => {
  let state = geometry.place(geometry.blank(), { x: 200, y: 20, w: 180, h: 280 }, 600, 400);
  const inventory = geometry.regions(state);
  assert.equal(geometry.ready(state), false);
  state = geometry.place({ ...state, step: 'equipment' }, { x: 10, y: 40, w: 140, h: 192 }, 600, 400);
  assert.equal(geometry.ready(state), true);
  assert.deepEqual(geometry.regions(state).filter(slot => slot.group === 'inventory'), inventory);
  const head = geometry.regions(state).find(slot => slot.group === 'equipment' && slot.index === 0);
  state = geometry.move(state, 0, { ...head, x: 580, y: 390 }, 600, 400);
  const moved = geometry.regions(state).find(slot => slot.group === 'equipment' && slot.index === 0);
  assert.equal(moved.x + moved.w, 600); assert.equal(moved.y + moved.h, 400);
  assert.equal(moved.w, head.w); assert.equal(moved.h, head.h);
  assert.deepEqual(geometry.regions(state).filter(slot => slot.group === 'inventory'), inventory);
  state = geometry.grid({ ...state, equipment: { ...state.equipment, kind: 'grid' } }, 'rows', 2);
  assert.equal(state.equipment.columns, 6);
  assert.deepEqual(state.equipment.overrides, {});
  assert.equal(geometry.regions(state).filter(slot => slot.group === 'equipment').length, 12);
});

test('missing and undersized panels cannot be scanned, and either panel can be skipped', () => {
  let state = geometry.blank();
  assert.equal(geometry.ready(state), false);
  state = geometry.place(state, { x: 0, y: 0, w: 10, h: 10 }, 400, 300);
  assert.equal(geometry.ready(state), false);
  state = geometry.place(state, { x: 0, y: 0, w: 160, h: 280 }, 400, 300);
  state.equipment.enabled = false;
  assert.equal(geometry.ready(state), true);
  assert.equal(geometry.regions(state).length, 28);
  state.inventory.enabled = false;
  assert.equal(geometry.ready(state), false);
  state = geometry.place({ ...state, step: 'equipment' }, { x: 200, y: 10, w: 140, h: 192 }, 400, 300);
  assert.equal(geometry.ready(state), true);
  assert.equal(geometry.regions(state).length, 12);
});
