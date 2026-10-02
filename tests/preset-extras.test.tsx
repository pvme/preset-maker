import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PresetExtras } from '../src/components/PresetExtras/PresetExtras';
import reducer, { setRelic } from '../src/redux/store/reducers/preset-reducer';
import { SlotType } from '../src/schemas/slot-type';
const context = vi.hoisted(() => ({ editable: true }));
vi.mock('../src/storage/StorageModeContext', () => ({ useStorageMode: () => ({ isPresetEditable: context.editable }) }));
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => false }));
vi.mock('../src/hooks/useEmojiMap', () => ({ useEmojiMap: () => ({ get: (id: string) => id ? { id, name: id } : undefined, getUrl: (id: string) => id ? `https://example.test/${id}.png` : '' }) }));
vi.mock('../src/components/EmojiSelectDialog/EmojiSelectDialog', () => ({ EmojiSelectDialog: ({ open, onSelect }: any) => open ? <button onClick={() => onSelect([{ id: 'replacement' }])}>Choose item</button> : null }));
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
test('read-only support hides gaps and an entirely empty section', () => {
  context.editable = false;
  const view = setup([{ id: '' }, { id: 'existing' }, { id: '' }]);
  expect(view.container.querySelectorAll('.preset-extras__item')).toHaveLength(1);
  expect(screen.getByAltText('existing')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  cleanup();
  expect(setup([]).container.querySelector('.preset-extras')).toBeNull();
});
