import { afterEach, expect, test, vi } from 'vitest';
import { loadEmojis } from '../src/emoji/loadEmojis';
afterEach(() => vi.unstubAllGlobals());
test('catalogue category identifies untyped prayers without affecting unrelated entries', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ categories: [
    { name: 'Prayers', emojis: [{ id: 'soulsplit', name: 'Soul Split', image: 'soulsplit.png' }] },
    { name: 'Items', emojis: [{ id: 'shark', name: 'Shark', preset_type: 'item' }] },
  ] }) }));
  const maps = await loadEmojis();
  expect(maps.get('soulsplit')?.preset_type).toBe('prayer');
  expect(maps.byType.prayer.map(item => item.id)).toEqual(['soulsplit']);
  expect(maps.get('shark')?.preset_type).toBe('item');
});
