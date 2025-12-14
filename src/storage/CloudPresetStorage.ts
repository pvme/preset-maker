// src/storage/CloudPresetStorage.ts

import { type PresetStorage } from "./preset-storage";
import { type SavedPreset } from "../schemas/saved-preset-data";
import { type PresetSummary } from "../schemas/preset-summary";
import { uploadPreset } from "../api/upload-preset";
import axios from "axios";

export const CloudPresetStorage: PresetStorage = {
  async getPreset(id: string): Promise<SavedPreset> {
    const { data } = await axios.get(`/api/presets/${id}`);
    return data;
  },

  async savePreset(preset: SavedPreset, id?: string): Promise<string> {
    const presetCopy = structuredClone(preset);
    const result = await uploadPreset(presetCopy, id);
    return result.id;
  },

  async listRecentPresets(): Promise<PresetSummary[]> {
    const raw = localStorage.getItem("recentPresets");
    return raw ? JSON.parse(raw) : [];
  },

  saveToRecentPresets(summary: PresetSummary): void {
    const raw = localStorage.getItem("recentPresets");
    const prev = raw ? (JSON.parse(raw) as PresetSummary[]) : [];
    const updated = [
      summary,
      ...prev.filter((p) => p.presetId !== summary.presetId),
    ].slice(0, 20);

    localStorage.setItem("recentPresets", JSON.stringify(updated));
  },
};
