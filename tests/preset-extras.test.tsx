import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PresetExtras } from '../src/components/PresetExtras/PresetExtras';
import reducer, { setRelic, setPrayer, setAmmoSpells, setFamiliar, setAspect } from '../src/redux/store/reducers/preset-reducer';
import { SlotType } from '../src/schemas/slot-type';
const context = vi.hoisted(() => ({ editable: true }));
vi.mock('../src/storage/StorageModeContext', () => ({ useStorageMode: () => ({ isPresetEditable: context.editable }) }));
vi.mock('../src/hooks/useEmojiMap', () => ({ useEmojiMap: () => ({ get: (id: string) => id ? { id, name: id } : undefined, getUrl: (id: string) => id ? `https://example.test/${id}.png` : '' }) }));
vi.mock('../src/components/EmojiSelectDialog/EmojiSelectDialog', () => ({ EmojiSelectDialog: ({ open, onSelect }: any) => open ? <button onClick={() => onSelect([{ id: 'replacement' }])}>Choose item</button> : null }));
beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});
afterEach(() => { cleanup(); context.editable = true; });
function setup(items: { id: string }[]) {
  const store = configureStore({ reducer: { preset: reducer } });
  const view = render(<Provider store={store}><PresetExtras title="Relics" slotType={SlotType.Relic} items={items} maxItems={3} setItem={setRelic} indexed /></Provider>);
  return { ...view, store };
}
test('editable support slots retain every add target and update the original selected index', () => {
  const { store } = setup([{ id: '' }, { id: 'existing' }]);
  expect(screen.getAllByRole('button', { name: /Change Relics slot/ })).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Change Relics slot 3' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose item' }));
  expect(store.getState().preset.relics[2].id).toBe('replacement');
});

const supportSections = [
  { title: 'Relics', slotType: SlotType.Relic, setItem: setRelic, field: 'relics', indexed: true },
  { title: 'Prayers', slotType: SlotType.Prayer, setItem: setPrayer, field: 'prayers', indexed: true },
  { title: 'Ammo / Spells', slotType: SlotType.AmmoSpells, setItem: setAmmoSpells, field: 'ammoSpells', indexed: true },
  { title: 'Familiar', slotType: SlotType.Familiar, setItem: setFamiliar, field: 'familiar', indexed: false },
  { title: 'Aspect', slotType: SlotType.Aspect, setItem: setAspect, field: 'aspect', indexed: false },
] as const;

test.each(supportSections)('mobile $title slots can add and replace items', (section) => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() } as any);
  const store = configureStore({ reducer: { preset: reducer } });
  const index = section.indexed ? 2 : 0;
  const maxItems = section.indexed ? 3 : 1;
  for (const id of ['', 'existing']) {
    const items = Array.from({ length: maxItems }, () => ({ id }));
    const view = render(<Provider store={store}><PresetExtras {...section} items={items} maxItems={maxItems} /></Provider>);
    fireEvent.click(screen.getByRole('button', { name: `Change ${section.title} slot ${index + 1}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose item' }));
    const value = store.getState().preset[section.field];
    expect(Array.isArray(value) ? value[index].id : value.id).toBe('replacement');
    expect(screen.queryByRole('button', { name: 'Choose item' })).toBeNull();
    view.unmount();
  }
});
test('read-only support hides gaps and an entirely empty section', () => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() } as any);
  context.editable = false;
  const view = setup([{ id: '' }, { id: 'existing' }, { id: '' }]);
  expect(view.container.querySelectorAll('.preset-extras__item')).toHaveLength(1);
  expect(screen.getByAltText('existing')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  fireEvent.click(screen.getByAltText('existing'));
  expect(screen.queryByRole('button', { name: 'Choose item' })).toBeNull();
  cleanup();
  expect(setup([]).container.querySelector('.preset-extras')).toBeNull();
});
