import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { blankPreset, presetSchema } from '../src/schemas/preset';
import reducer, { importDataAction, setPrayer } from '../src/redux/store/reducers/preset-reducer';
import { normalizePreset } from '../src/redux/store/reducers/normalizePreset';
import { usePresetJsonExport } from '../src/components/PresetMenu/usePresetJsonExport';
import { usePresetSave } from '../src/components/PresetMenu/usePresetSave';
import { useEmojiFilter } from '../src/components/EmojiSelectDialog/useEmojiFilter';
import { SlotType } from '../src/schemas/slot-type';
const mocks = vi.hoisted(() => ({ exportJson: vi.fn(), save: vi.fn().mockResolvedValue('qa') }));
vi.mock('../src/emoji', () => ({ loadEmojis: async () => ({ resolve: (id: string) => id.trim().toLowerCase() === 'ss' ? 'soulsplit' : id.trim().toLowerCase() }) }));
vi.mock('../src/utility/export-to-json', () => ({ exportAsJson: mocks.exportJson }));
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }));
vi.mock('../src/storage/GlobalLoadingContext', () => ({ useGlobalLoading: () => ({ beginGlobalSave: vi.fn(), endGlobalSave: vi.fn() }) }));
vi.mock('../src/storage/LocalPresetStorage', () => ({ LocalPresetStorage: { savePreset: mocks.save } }));
vi.mock('../src/storage/CloudPresetStorage', () => ({ CloudPresetStorage: { savePreset: mocks.save } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

test('old presets default prayers to empty; imported prayers resolve aliases and cap at three', async () => {
  expect(presetSchema.parse({}).prayers).toEqual([]);
  expect((await normalizePreset({})).prayers).toEqual([]);
  const preset = await normalizePreset({ prayers: [{ id: 'SS' }, 'TURMOIL', { id: 'anguish' }, { id: 'affliction' }] });
  expect(preset.prayers).toEqual([{ id: 'soulsplit' }, { id: 'turmoil' }, { id: 'anguish' }]);
  let state = reducer(undefined, importDataAction(preset));
  state = reducer(state, setPrayer({ index: 1, value: null }));
  expect(state.prayers).toEqual([{ id: 'soulsplit' }, { id: '' }, { id: 'anguish' }]);
  state = reducer(state, setPrayer({ index: 1, value: { id: 'affliction' } }));
  expect(reducer(state, setPrayer({ index: 3, value: { id: 'invalid' } })).prayers).toEqual(state.prayers);
});

test('save and backup export emit the renderer prayer model and round-trip every support field', async () => {
  const preset = { ...structuredClone(blankPreset), presetName: 'Prayer QA', prayers: [{ id: '' }, { id: 'soulsplit' }, { id: 'turmoil' }], aspect: { id: 'darkness' }, ammoSpells: [{ id: 'incitefear' }] };
  const saved = renderHook(() => usePresetSave({ preset, presetName: preset.presetName, mode: 'local', id: 'qa', markClean: vi.fn(), setRecentList: vi.fn() }));
  await act(async () => { await saved.result.current.save(); });
  const payload = mocks.save.mock.calls[0][0];
  expect(payload.prayers).toEqual([{ id: 'soulsplit' }, { id: 'turmoil' }]);
  const exported = renderHook(() => usePresetJsonExport(preset));
  act(() => exported.result.current.exportJson());
  const json = JSON.parse(mocks.exportJson.mock.calls[0][1]);
  expect(json.prayers).toEqual(payload.prayers);
  expect(json.aspect).toEqual(preset.aspect);
  expect(json.ammoSpells).toEqual(preset.ammoSpells);
  const reloaded = await normalizePreset(json);
  expect(reloaded.prayers).toEqual(payload.prayers);
  expect(reloaded.aspect).toEqual(preset.aspect);
  expect(reloaded.ammoSpells).toEqual(preset.ammoSpells);
});

test('prayer selector and recent-item filter offer prayers only', () => {
  const byId = { soulsplit: { id: 'soulsplit', name: 'Soul Split', preset_type: 'prayer' }, turmoil: { id: 'turmoil', name: 'Turmoil', preset_type: 'prayer' }, shark: { id: 'shark', name: 'Shark', preset_type: 'item' } };
  const maps = { byId, get: (id: string) => byId[id as keyof typeof byId] } as any;
  const { result } = renderHook(() => useEmojiFilter({ maps, slotType: SlotType.Prayer, slotIndex: 0, slotKey: '', selectedIndices: [] }));
  expect(result.current.dialogTitle).toBe('Select prayer');
  expect(result.current.options).toEqual([{ id: 'soulsplit' }, { id: 'turmoil' }]);
  expect(result.current.filterRecent('shark')).toBe(false);
  expect(result.current.filterRecent('soulsplit')).toBe(true);
});
