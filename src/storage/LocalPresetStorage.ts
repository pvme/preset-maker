// src/storage/LocalPresetStorage.ts

import { type PresetStorage } from "./preset-storage";
import { type SavedPreset } from "../schemas/saved-preset-data";
import { type PresetSummary } from "../schemas/preset-summary";

const LOCAL_KEY = "recentPresets";

export const LocalPresetStorage: PresetStorage = {
  async getPreset(id: string): Promise<SavedPreset> {
    const raw = localStorage.getItem(`preset:${id}`);
    if (!raw) {
      throw new Error("Preset not found");
    }

    const data = JSON.parse(raw);
    return {
      ...data,
      presetId: data.presetId ?? id,
    };
  },

  async savePreset(preset: SavedPreset, id?: string): Promise<string> {
    const presetId = id ?? crypto.randomUUID();
    const payload = { ...preset, presetId };
    localStorage.setItem(`preset:${presetId}`, JSON.stringify(payload));
    return presetId;
  },

  async listRecentPresets(): Promise<PresetSummary[]> {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveToRecentPresets(summary: PresetSummary): void {
    const raw = localStorage.getItem(LOCAL_KEY);
    const prev = raw ? (JSON.parse(raw) as PresetSummary[]) : [];
    const updated = [
      summary,
      ...prev.filter((p) => p.presetId !== summary.presetId),
    ].slice(0, 20);

    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  },
};
