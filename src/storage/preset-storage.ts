// src/storage/preset-storage.ts

import { LocalPresetStorage } from './LocalPresetStorage';
import { CloudPresetStorage } from './CloudPresetStorage';
import { SavedPreset } from '../schemas/saved-preset-data';
import { PresetSummary } from '../schemas/preset-summary';

export const loadPresetById = async (
  id: string
): Promise<{ data: SavedPreset; source: 'local' | 'cloud' }> => {
  try {
    const data = await LocalPresetStorage.getPreset(id);
    return { data, source: 'local' };
  } catch {
    const data = await CloudPresetStorage.getPreset(id);
    return { data, source: 'cloud' };
  }
};

export interface PresetStorage {
  getPreset(id: string): Promise<SavedPreset>;
  savePreset(preset: SavedPreset, id?: string): Promise<string>;
  listRecentPresets(): Promise<PresetSummary[]>;
  saveToRecentPresets(summary: PresetSummary): void;
}
