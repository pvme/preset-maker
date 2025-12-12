// src/storage/preset-storage.ts

import { LocalPresetStorage } from "./LocalPresetStorage";
import { CloudPresetStorage } from "./CloudPresetStorage";
import { normalizePreset } from "../redux/store/reducers/normalizePreset";
import { type Preset } from "../schemas/preset";
import { type PresetSummary } from "../schemas/preset-summary";
import { type SavedPreset } from "../schemas/saved-preset-data";

export const loadPresetById = async (
  id: string
): Promise<{
  data: Preset;
  presetId: string;
  source: "local" | "cloud";
}> => {
  try {
    const raw: SavedPreset = await LocalPresetStorage.getPreset(id);
    const normalised = await normalizePreset(raw);

    return {
      data: normalised,
      presetId: raw.presetId ?? id,
      source: "local",
    };
  } catch {
    const raw: SavedPreset = await CloudPresetStorage.getPreset(id);
    const normalised = await normalizePreset(raw);

    return {
      data: normalised,
      presetId: raw.presetId ?? id,
      source: "cloud",
    };
  }
};

//
// Storage adapter contract (RAW only)
//
export interface PresetStorage {
  getPreset(id: string): Promise<SavedPreset>;
  savePreset(preset: SavedPreset, id?: string): Promise<string>;
  listRecentPresets(): Promise<PresetSummary[]>;
  saveToRecentPresets(summary: PresetSummary): void;
}
