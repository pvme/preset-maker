// src/storage/recent-presets.ts

import { PresetSummary } from '../schemas/preset-summary';

const STORAGE_KEY = 'recentPresets';

export const getRecentPresets = (): PresetSummary[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return parsed.filter((p: any) => typeof p.presetId === 'string');
  } catch {
    return [];
  }
};


export const addRecentPreset = (preset: PresetSummary) => {
  const list = getRecentPresets().filter(p => p.presetId !== preset.presetId);
  list.unshift(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 10)));
};

export const removeRecentPreset = (presetId: string) => {
  const list = getRecentPresets().filter(p => p.presetId !== presetId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};
