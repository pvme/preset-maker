// src/store/CloudPresetStorage.ts

import { PresetStorage } from './preset-storage';
import { getPreset } from '../api/get-preset';
import { uploadPreset } from '../api/upload-preset';
import { PresetSummary } from '../schemas/preset-summary';
import { SavedPreset } from '../schemas/saved-preset-data';

export const CloudPresetStorage: PresetStorage = {
  async getPreset(id: string): Promise<SavedPreset> {
    return await getPreset(id);
  },
  async savePreset(preset: SavedPreset, id?: string): Promise<string> {
    const result = await uploadPreset(preset, id);
    return result.id;
  },
  async listRecentPresets(): Promise<PresetSummary[]> {
    const raw = localStorage.getItem('recentPresets');
    return raw ? JSON.parse(raw) : [];
  },
  saveToRecentPresets(summary: PresetSummary): void {
    const raw = localStorage.getItem('recentPresets');
    const prev = raw ? JSON.parse(raw) as PresetSummary[] : [];
    const updated = [summary, ...prev.filter(p => p.presetId !== summary.presetId)].slice(0, 20);
    localStorage.setItem('recentPresets', JSON.stringify(updated));
  }
};
